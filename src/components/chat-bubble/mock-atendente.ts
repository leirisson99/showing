import { SUGESTOES_INICIAIS, textoSaudacao } from "@/lib/ai/saudacao";
import { formatarArea, formatarPreco } from "@/lib/format";

// MOCK do atendente para desenvolver a bolha antes da rota /api/chat (card C3).
// Responde por regras, só com dados da ficha, e segue as mesmas regras do atendente real:
// se apresenta como assistente virtual, mensagens curtas, uma pergunta por vez, não negocia
// preço, pede consentimento antes de guardar dados e só oferece os horários recebidos.
// Quando o C3 entrar, a bolha troca este módulo pelo streaming da API.

export type Fase = "livre" | "escolhendo_horario" | "pedindo_nome" | "pedindo_contato" | "pedindo_consentimento" | "concluida";

export type Estado = {
  fase: Fase;
  horario?: string;
  nome?: string;
  contato?: string;
  transferida?: boolean;
};

export type Horario = { iso: string; rotulo: string };

export type ContextoMock = {
  corretor: string;
  imovel: {
    preco: number;
    condominio: number | null;
    iptu: number | null;
    aceitaFinanciamento: boolean;
    aceitaFgts: boolean | null;
    quartos: number;
    areaM2: number;
    bairro: string;
  };
  /** Horários livres já calculados (no atendente real vêm de listar_horarios). */
  horarios: Horario[];
};

export type Resposta = {
  texto: string;
  sugestoes?: string[];
  pedeConsentimento?: boolean;
};

export const ESTADO_INICIAL: Estado = { fase: "livre" };

export { SUGESTOES_INICIAIS };

export function saudacao(ctx: ContextoMock): Resposta {
  return {
    texto: textoSaudacao(ctx.corretor),
    sugestoes: SUGESTOES_INICIAIS,
  };
}

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const tem = (texto: string, ...padroes: RegExp[]) => padroes.some((p) => p.test(texto));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telefoneValido = (t: string) => {
  const d = t.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 13;
};

const TRANSFERIR = "Vou confirmar com o corretor e ele te responde por aqui.";

function oferecerHorarios(ctx: ContextoMock, estado: Estado): [Resposta, Estado] {
  const opcoes = ctx.horarios.slice(0, 3);
  if (opcoes.length === 0) {
    return [{ texto: `No momento não há horários livres. Vou avisar ${ctx.corretor} para combinar com você.` }, { ...estado, fase: "livre", transferida: true }];
  }
  return [
    { texto: "Tenho estes horários para a visita. Qual prefere?", sugestoes: opcoes.map((h) => h.rotulo) },
    { ...estado, fase: "escolhendo_horario" },
  ];
}

export function responder(estado: Estado, entrada: string, ctx: ContextoMock): [Resposta, Estado] {
  const texto = normalizar(entrada);
  const { imovel } = ctx;

  // Mudar de papel ou pedir o prompt: recusa e volta ao imóvel (RNF-11).
  if (tem(texto, /ignore|esqueca|instruc|prompt|system|finja|voce agora/)) {
    return [{ texto: "Só posso ajudar com este imóvel e com o agendamento da visita. O que você quer saber sobre ele?", sugestoes: SUGESTOES_INICIAIS }, estado];
  }

  switch (estado.fase) {
    case "escolhendo_horario": {
      const opcoes = ctx.horarios.slice(0, 3);
      const indice = /^[1-3]$/.test(texto) ? Number(texto) - 1 : opcoes.findIndex((h) => normalizar(h.rotulo) === texto);
      const escolhido = opcoes[indice];
      if (!escolhido) return oferecerHorarios(ctx, estado);
      return [{ texto: `Combinado, ${escolhido.rotulo}. Qual é o seu nome?` }, { ...estado, fase: "pedindo_nome", horario: escolhido.iso }];
    }
    case "pedindo_nome": {
      if (entrada.trim().length < 2) return [{ texto: "Não entendi o nome. Pode repetir?" }, estado];
      const nome = entrada.trim().slice(0, 100);
      return [{ texto: `Prazer, ${nome.split(" ")[0]}! Qual é o seu telefone ou e-mail para o corretor falar com você?` }, { ...estado, fase: "pedindo_contato", nome }];
    }
    case "pedindo_contato": {
      const contato = entrada.trim();
      if (!EMAIL.test(contato) && !telefoneValido(contato)) {
        return [{ texto: "Esse contato não parece válido. Pode enviar o telefone com DDD ou um e-mail?" }, estado];
      }
      return [
        {
          texto: `Posso guardar seu nome e contato e passar para ${ctx.corretor}? Só ele vê esses dados.`,
          sugestoes: ["Autorizo", "Não autorizo"],
          pedeConsentimento: true,
        },
        { ...estado, fase: "pedindo_consentimento", contato },
      ];
    }
    case "pedindo_consentimento": {
      if (tem(texto, /^(nao|nao autorizo)\b/)) {
        return [{ texto: `Sem problema, não guardo seus dados. Se quiser, fale direto com ${ctx.corretor}.` }, { fase: "livre" }];
      }
      if (tem(texto, /^(sim|autorizo|pode|claro|ok)\b/)) {
        return [
          { texto: `Pedido de visita enviado! ${ctx.corretor} vai confirmar o horário com você em breve.` },
          { ...estado, fase: "concluida" },
        ];
      }
      return [
        { texto: "Preciso do seu aval para guardar nome e contato. Você autoriza?", sugestoes: ["Autorizo", "Não autorizo"], pedeConsentimento: true },
        estado,
      ];
    }
    default:
  }

  if (tem(texto, /visita|agendar|visitar|conhecer/)) {
    if (estado.fase === "concluida") {
      return [{ texto: `Já enviei um pedido de visita. Para outro horário, ${ctx.corretor} combina com você.` }, estado];
    }
    return oferecerHorarios(ctx, estado);
  }

  // Preço: só informa o da ficha; não negocia (RN-14).
  if (tem(texto, /desconto|negoci|abaixa|menos|proposta|oferta|\d+ ?mil|parcel/)) {
    return [{ texto: `Valores e condições de negociação são com ${ctx.corretor}. Vou avisar ele.` }, { ...estado, transferida: true }];
  }
  if (tem(texto, /financ/)) {
    return [
      {
        texto: imovel.aceitaFinanciamento
          ? "A ficha informa que o imóvel aceita financiamento. A aprovação e as condições dependem do banco, então não consigo garantir."
          : "A ficha não indica que o imóvel aceita financiamento. Vou confirmar com o corretor.",
      },
      estado,
    ];
  }
  if (tem(texto, /fgts/)) {
    if (imovel.aceitaFgts === null) return [{ texto: `O FGTS não consta na ficha. ${TRANSFERIR}` }, { ...estado, transferida: true }];
    return [{ texto: imovel.aceitaFgts ? "Sim, a ficha informa que aceita FGTS." : "A ficha informa que não aceita FGTS." }, estado];
  }
  if (tem(texto, /condominio/)) {
    if (imovel.condominio === null) return [{ texto: `O condomínio não consta na ficha. ${TRANSFERIR}` }, { ...estado, transferida: true }];
    return [{ texto: `O condomínio é de ${formatarPreco(imovel.condominio)} por mês, segundo a ficha.` }, estado];
  }
  if (tem(texto, /iptu/)) {
    if (imovel.iptu === null) return [{ texto: `O IPTU não consta na ficha. ${TRANSFERIR}` }, { ...estado, transferida: true }];
    return [{ texto: `O IPTU é de ${formatarPreco(imovel.iptu)}, segundo a ficha.` }, estado];
  }
  if (tem(texto, /preco|valor|quanto custa|quanto e/)) {
    return [{ texto: `O valor anunciado é ${formatarPreco(imovel.preco)}.` }, estado];
  }
  if (tem(texto, /quarto|area|metragem|tamanho|m2/)) {
    return [{ texto: `São ${imovel.quartos} ${imovel.quartos === 1 ? "quarto" : "quartos"} e ${formatarArea(imovel.areaM2)} de área, no ${imovel.bairro}.` }, estado];
  }
  if (tem(texto, /^(oi|ola|bom dia|boa tarde|boa noite)\b/)) {
    return [{ texto: "Oi! Quer saber algo sobre o imóvel ou agendar uma visita?", sugestoes: SUGESTOES_INICIAIS }, estado];
  }

  // Fora da ficha (RN-09, RN-10).
  return [{ texto: `Essa informação não está na ficha do imóvel. ${TRANSFERIR}` }, { ...estado, transferida: true }];
}
