import { z } from "zod";
import { calcularHorariosLivres } from "./horarios";
import { ConflitoDeVisita, type RepositorioAtendimento } from "./repositorio";

// Regras das ferramentas do atendente. Cada função valida a entrada com Zod e
// devolve { ok: true, ... } ou { ok: false, erro } para o modelo responder sem quebrar.
// Os dados do comprador nunca vão para log (CLAUDE.md, LGPD).

export type ContextoAtendimento = {
  /** Imóvel desta conversa. A ferramenta recusa qualquer outro `imovel_id`. */
  imovelId: string;
  conversaId: string;
  repo: RepositorioAtendimento;
  agora?: () => Date;
  /** Observador opcional (testes, métricas). Recebe só o nome da ferramenta e o resultado. */
  observador?: (e: { ferramenta: string; resultado: Resultado }) => void;
};

export type Resultado = { ok: true; [k: string]: unknown } | { ok: false; erro: string };

const MAX_HORARIOS_OFERECIDOS = 8;

const imovelId = z.string().min(1, "imovel_id é obrigatório");

// Sem transform: o esquema precisa virar JSON Schema para o modelo. A normalização é feita ao gravar.
const apenasDigitos = (v: string) => v.replace(/\D/g, "");
const telefone = z
  .string()
  .trim()
  .refine((v) => apenasDigitos(v).length >= 10 && apenasDigitos(v).length <= 13, "Telefone inválido. Use DDD + número.");

export const esquemas = {
  listarHorarios: z.object({ imovel_id: imovelId }),
  registrarLead: z
    .object({
      imovel_id: imovelId,
      nome: z.string().trim().min(2, "Informe o nome").max(100),
      telefone: telefone.optional(),
      email: z.email("E-mail inválido").optional(),
      pagamento: z.string().trim().max(200).optional(),
      prazo: z.string().trim().max(200).optional(),
      consentimento: z.literal(true, { error: "Só registre depois do consentimento explícito do comprador" }),
    })
    .refine((d) => d.telefone || d.email, { message: "Informe telefone ou e-mail", path: ["telefone"] }),
  agendarVisita: z.object({
    imovel_id: imovelId,
    data_hora: z.string().min(1, "data_hora é obrigatória"),
  }),
  transferirCorretor: z.object({
    imovel_id: imovelId,
    motivo: z.string().trim().min(3, "Descreva o motivo ou a pergunta pendente").max(500),
  }),
};

const erro = (mensagem: string): Resultado => ({ ok: false, erro: mensagem });

function formatarErroZod(e: z.ZodError): string {
  return e.issues.map((i) => i.message).join("; ");
}

/** RNF-07: o imóvel existe, está publicado e é o desta conversa. */
async function conferirImovel(ctx: ContextoAtendimento, id: string): Promise<string | null> {
  if (id !== ctx.imovelId) return "Imóvel diferente do desta conversa.";
  const imovel = await ctx.repo.buscarImovel(id);
  if (!imovel || imovel.status !== "publicado") return "Imóvel não encontrado ou indisponível.";
  return null;
}

async function horariosLivres(ctx: ContextoAtendimento) {
  const { horariosVisita, duracaoMin } = await ctx.repo.horariosDoCorretor(ctx.imovelId);
  const ocupados = await ctx.repo.visitasOcupadas(ctx.imovelId);
  return calcularHorariosLivres({ horariosVisita, duracaoMin, ocupados, agora: (ctx.agora ?? (() => new Date()))() });
}

async function executar(ctx: ContextoAtendimento, ferramenta: string, fn: () => Promise<Resultado>): Promise<Resultado> {
  const resultado = await fn();
  ctx.observador?.({ ferramenta, resultado });
  return resultado;
}

export function listarHorarios(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "listar_horarios", async () => {
    const dados = esquemas.listarHorarios.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx, dados.data.imovel_id);
    if (problema) return erro(problema);

    const livres = (await horariosLivres(ctx)).slice(0, MAX_HORARIOS_OFERECIDOS);
    if (livres.length === 0) {
      return { ok: true, horarios: [], aviso: "Sem horários livres agora. Transfira para o corretor combinar." };
    }
    return { ok: true, horarios: livres.map((h) => ({ data_hora: h.iso, rotulo: h.rotulo })) };
  });
}

export function registrarLead(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "registrar_lead", async () => {
    const dados = esquemas.registrarLead.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx, dados.data.imovel_id);
    if (problema) return erro(problema);

    const conversa = await ctx.repo.buscarConversa(ctx.conversaId);
    if (!conversa) return erro("Conversa não encontrada.");

    const { nome, telefone, email, pagamento, prazo } = dados.data;
    const lead = { nome, telefone: telefone ? apenasDigitos(telefone) : undefined, email, pagamento, prazo };
    // RNF-13: o consentimento é gravado com data e hora.
    await ctx.repo.salvarLead(ctx.conversaId, lead, (ctx.agora ?? (() => new Date()))());
    return { ok: true };
  });
}

export function agendarVisita(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "agendar_visita", async () => {
    const dados = esquemas.agendarVisita.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx, dados.data.imovel_id);
    if (problema) return erro(problema);

    const conversa = await ctx.repo.buscarConversa(ctx.conversaId);
    if (!conversa) return erro("Conversa não encontrada.");

    // RN-19: no máximo uma visita por conversa.
    if (conversa.visitaId) {
      return erro("Já existe um pedido de visita nesta conversa. Para outro horário, o comprador fala com o corretor.");
    }
    // RN-11 e RN-12: consentimento, nome e ao menos um contato.
    const lead = conversa.lead;
    if (!conversa.consentimento || !lead?.nome || !(lead.telefone || lead.email)) {
      return erro("Antes de agendar, peça o nome e um contato (telefone ou e-mail), peça o consentimento e chame registrar_lead.");
    }

    // RN-17 e RN-18: só horários que listar_horarios devolveria agora.
    const pedido = new Date(dados.data.data_hora);
    const livres = await horariosLivres(ctx);
    const escolhido = Number.isNaN(pedido.getTime())
      ? undefined
      : livres.find((h) => h.instante.getTime() === pedido.getTime());
    if (!escolhido) {
      return erro("Horário indisponível. Chame listar_horarios e ofereça só os horários retornados.");
    }

    // RN-20: toda visita nasce `pedida`. O envio dos e-mails (RN-21) entra no card C5.
    let visita: { id: string };
    try {
      visita = await ctx.repo.criarVisita({ imovelId: ctx.imovelId, conversaId: ctx.conversaId, dataHora: escolhido.instante });
    } catch (e) {
      if (!(e instanceof ConflitoDeVisita)) throw e;
      return erro(
        e.motivo === "conversa"
          ? "Já existe um pedido de visita nesta conversa. Para outro horário, o comprador fala com o corretor."
          : "Esse horário acabou de ser pedido por outra pessoa. Chame listar_horarios e ofereça outro.",
      );
    }
    return { ok: true, visita_id: visita.id, status: "pedida", horario: escolhido.rotulo };
  });
}

export function transferirCorretor(ctx: ContextoAtendimento, entrada: unknown) {
  return executar(ctx, "transferir_corretor", async () => {
    const dados = esquemas.transferirCorretor.safeParse(entrada);
    if (!dados.success) return erro(formatarErroZod(dados.error));
    const problema = await conferirImovel(ctx, dados.data.imovel_id);
    if (problema) return erro(problema);

    const conversa = await ctx.repo.buscarConversa(ctx.conversaId);
    if (!conversa) return erro("Conversa não encontrada.");

    await ctx.repo.marcarTransferida(ctx.conversaId, dados.data.motivo);
    return { ok: true };
  });
}
