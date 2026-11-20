import { z } from "zod";
import { calcularHorariosLivres } from "./horarios";
import { ConflitoDeVisita, type Lead, type RepositorioAtendimento } from "./repositorio";

// Regras das ferramentas do atendente. Cada função valida a entrada com Zod e
// devolve { ok: true, ... } ou { ok: false, erro } para o modelo responder sem quebrar.
// Os dados do comprador nunca vão para log (CLAUDE.md, LGPD).

export type ContextoAtendimento = {
  /** Imóvel desta conversa: as ferramentas só agem nele. */
  imovelId: string;
  conversaId: string;
  /** Nome do corretor, para a resposta de transferir_para_corretor. */
  corretorNome?: string;
  repo: RepositorioAtendimento;
  agora?: () => Date;
  /** Observador opcional (testes, métricas). Recebe só o nome da ferramenta e o resultado. */
  observador?: (e: { ferramenta: string; resultado: Resultado }) => void;
  /** Disparos opcionais de e-mail (BK-07). Rodam depois de salvar, sem `await`: falha de envio não afeta o resultado. */
  aoPedirVisita?: (visitaId: string) => void;
  aoTransferir?: (conversaId: string, motivo: string) => void;
};

export type Resultado = { ok: true; [k: string]: unknown } | { ok: false; erro: string };

const MAX_HORARIOS_OFERECIDOS = 6;

// Sem transform: o esquema precisa virar JSON Schema para o modelo. A normalização é feita ao gravar.
const apenasDigitos = (v: string) => v.replace(/\D/g, "");
const telefone = z
  .string()
  .trim()
  .refine((v) => apenasDigitos(v).length >= 10 && apenasDigitos(v).length <= 13, "Telefone inválido. Use DDD + número.");

export const FORMAS_DE_PAGAMENTO = ["à vista", "financiamento", "FGTS", "consórcio"] as const;
export const MOTIVOS_DE_TRANSFERENCIA = ["sem_resposta", "pedido_do_comprador", "negociacao", "reclamacao"] as const;

const ROTULO_DO_MOTIVO: Record<(typeof MOTIVOS_DE_TRANSFERENCIA)[number], string> = {
  sem_resposta: "Pergunta sem resposta na ficha",
  pedido_do_comprador: "Pediu para falar com o corretor",
  negociacao: "Quer negociar preço ou condições",
  reclamacao: "Reclamação",
};

export const esquemas = {
  consultarHorarios: z.object({
    a_partir_de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a data no formato AAAA-MM-DD").optional(),
  }),
  pedirVisita: z.object({
    slot_id: z.string().min(1, "slot_id é obrigatório"),
    nome: z.string().trim().min(2, "Informe o nome").max(100),
    telefone,
    forma_pagamento: z.enum(FORMAS_DE_PAGAMENTO).optional(),
    observacao: z.string().trim().max(500).optional(),
  }),
  salvarContato: z
    .object({
      nome: z.string().trim().min(2, "Nome muito curto").max(100).optional(),
      telefone: telefone.optional(),
      email: z.email("E-mail inválido").optional(),
      forma_pagamento: z.enum(FORMAS_DE_PAGAMENTO).optional(),
      interesse: z.string().trim().min(2).max(300).optional(),
    })
    .refine((d) => Object.values(d).some((v) => v !== undefined), { message: "Informe ao menos um dado do comprador", path: ["nome"] }),
  transferirParaCorretor: z.object({
    motivo: z.enum(MOTIVOS_DE_TRANSFERENCIA, { error: "motivo deve ser sem_resposta, pedido_do_comprador, negociacao ou reclamacao" }),
    resumo: z.string().trim().min(3, "Resuma em uma frase o que o comprador quer").max(500),
  }),
};

const erro = (mensagem: string): Resultado => ({ ok: false, erro: mensagem });

const SEM_CONSENTIMENTO_SALVAR =
  "Sem consentimento: não salve dados. Se o comprador ainda não respondeu aos botões \"Pode guardar\" e \"Prefiro não\", peça que toque em um deles; se tocou em \"Prefiro não\", não insista nem peça de novo.";
const SEM_CONSENTIMENTO_VISITA =
  "Sem consentimento do comprador para guardar os dados. Se ainda não perguntou, pergunte se pode guardar nome e telefone para o corretor; se ele recusou, não insista e chame transferir_para_corretor para o corretor combinar a visita.";
const HORARIO_OCUPADO = "Horário ocupado, consulte os horários de novo.";

function formatarErroZod(e: z.ZodError): string {
  return e.issues.map((i) => i.message).join("; ");
}

/** RNF-07: o imóvel existe e está publicado. */
async function conferirImovel(ctx: ContextoAtendimento): Promise<string | null> {
  const imovel = await ctx.repo.buscarImovel(ctx.imovelId);
  if (!imovel || imovel.status !== "publicado") return "Imóvel não encontrado ou indisponível.";
  return null;
}

type Horario = { slot_id: string; dia: string; hora: string; instante: Date; rotulo: string };

/** Horários livres agora (RN-17, RN-18). `slot_id` = dia e hora de Brasília, ex.: 20261121-0900. */
async function horariosLivres(ctx: ContextoAtendimento): Promise<Horario[]> {
  const { horariosVisita, duracaoMin } = await ctx.repo.horariosDoCorretor(ctx.imovelId);
  const ocupados = await ctx.repo.visitasOcupadas(ctx.imovelId);
  const livres = calcularHorariosLivres({ horariosVisita, duracaoMin, ocupados, agora: (ctx.agora ?? (() => new Date()))() });
  return livres.map((h) => {
    const [dia, hora] = h.rotulo.split(", às ");
    return { slot_id: h.iso.slice(0, 16).replace(/[-:]/g, "").replace("T", "-"), dia, hora, instante: h.instante, rotulo: h.rotulo, data: h.iso.slice(0, 10) } as Horario & { data: string };
  });
}

async function executar(ctx: ContextoAtendimento, ferramenta: string, fn: () => Promise<Resultado>): Promise<Resultado> {
  const resultado = await fn();
  ctx.observador?.({ ferramenta, resultado });
  return resultado;
}

export function consultarHorarios(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "consultar_horarios", async () => {
    const dados = esquemas.consultarHorarios.safeParse(entrada ?? {});
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx);
    if (problema) return erro(problema);

    const desde = dados.data.a_partir_de;
    const livres = ((await horariosLivres(ctx)) as (Horario & { data: string })[])
      .filter((h) => !desde || h.data >= desde)
      .slice(0, MAX_HORARIOS_OFERECIDOS);
    if (livres.length === 0) return { ok: true, horarios: [], aviso: "Sem horários livres nos próximos dias" };
    return { ok: true, horarios: livres.map(({ slot_id, dia, hora }) => ({ slot_id, dia, hora })) };
  });
}

export function pedirVisita(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "pedir_visita", async () => {
    const dados = esquemas.pedirVisita.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx);
    if (problema) return erro(problema);

    const conversa = await ctx.repo.buscarConversa(ctx.conversaId);
    if (!conversa) return erro("Conversa não encontrada.");
    // RN-19: no máximo uma visita por conversa.
    if (conversa.visitaId) return erro("Já existe um pedido de visita nesta conversa. Para outro horário, o comprador fala com o corretor.");
    // RN-11: sem o aceite registrado pela bolha, não grava nome nem telefone.
    if (!conversa.consentimento) return erro(SEM_CONSENTIMENTO_VISITA);

    // RN-17 e RN-18: só horários que consultar_horarios devolveria agora.
    const escolhido = (await horariosLivres(ctx)).find((h) => h.slot_id === dados.data.slot_id.trim());
    if (!escolhido) return erro(HORARIO_OCUPADO);

    const { nome, telefone, forma_pagamento, observacao } = dados.data;
    await ctx.repo.salvarLead(ctx.conversaId, { nome, telefone: apenasDigitos(telefone), ...(forma_pagamento ? { pagamento: forma_pagamento } : {}) });

    // RN-20: toda visita nasce `pedida`; só o corretor confirma.
    let visita: { id: string };
    try {
      visita = await ctx.repo.criarVisita({ imovelId: ctx.imovelId, conversaId: ctx.conversaId, dataHora: escolhido.instante, observacao });
    } catch (e) {
      if (!(e instanceof ConflitoDeVisita)) throw e;
      return erro(
        e.motivo === "conversa"
          ? "Já existe um pedido de visita nesta conversa. Para outro horário, o comprador fala com o corretor."
          : HORARIO_OCUPADO,
      );
    }
    ctx.aoPedirVisita?.(visita.id);
    return {
      ok: true,
      visita_id: visita.id,
      status: "pedida",
      dia: escolhido.dia,
      hora: escolhido.hora,
      horario: escolhido.rotulo,
      mensagem: `Pedido de visita registrado para ${escolhido.rotulo}. Ainda não está confirmado: o corretor vai confirmar.`,
    };
  });
}

export function salvarContato(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "salvar_contato", async () => {
    const dados = esquemas.salvarContato.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx);
    if (problema) return erro(problema);

    const conversa = await ctx.repo.buscarConversa(ctx.conversaId);
    if (!conversa) return erro("Conversa não encontrada.");
    if (!conversa.consentimento) return erro(SEM_CONSENTIMENTO_SALVAR);

    const { nome, telefone, email, forma_pagamento, interesse } = dados.data;
    const novo: Partial<Lead> = {
      ...(nome ? { nome } : conversa.lead?.nome ? {} : { nome: "Comprador" }),
      ...(telefone ? { telefone: apenasDigitos(telefone) } : {}),
      ...(email ? { email } : {}),
      ...(forma_pagamento ? { pagamento: forma_pagamento } : {}),
      ...(interesse ? { interesse } : {}),
    };
    await ctx.repo.salvarLead(ctx.conversaId, novo);
    return { ok: true, mensagem: "Contato salvo" };
  });
}

export function transferirParaCorretor(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "transferir_para_corretor", async () => {
    const dados = esquemas.transferirParaCorretor.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx);
    if (problema) return erro(problema);

    const conversa = await ctx.repo.buscarConversa(ctx.conversaId);
    if (!conversa) return erro("Conversa não encontrada.");

    const motivo = `${ROTULO_DO_MOTIVO[dados.data.motivo]}: ${dados.data.resumo}`;
    await ctx.repo.marcarTransferida(ctx.conversaId, motivo);
    ctx.aoTransferir?.(ctx.conversaId, motivo);
    return { ok: true, mensagem: `Conversa transferida para ${ctx.corretorNome ?? "o corretor"}` };
  });
}
