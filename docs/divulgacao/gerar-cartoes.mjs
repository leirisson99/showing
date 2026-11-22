// Gera os cartões de divulgação (1080x1080) em docs/divulgacao/features/*.png.
// Uso: node docs/divulgacao/gerar-cartoes.mjs   (precisa do Playwright já instalado no projeto)
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const MARCA = `<svg viewBox="0 0 143 143"><path d="M33 0H77A33 33 0 0 1 110 33A33 33 0 0 1 77 66H4A4 4 0 0 1 0 62V33A33 33 0 0 1 33 0Z" fill="#fff"/><path d="M66 77H110A33 33 0 0 1 143 110V139A4 4 0 0 1 139 143H66A33 33 0 0 1 33 110A33 33 0 0 1 66 77Z" fill="#F2A65A"/></svg>`;

const msg = (t, eu) => `<div class="msg ${eu ? "eu" : "ia"}">${t}</div>`;
const chat = (...c) => `<div class="card">${c.join("")}</div>`;

const cartoes = [
  {
    arquivo: "01-pagina-exclusiva",
    titulo: "Cada imóvel ganha uma <em>página só dele</em>.",
    sub: "Fotos, características e bairro, com endereço para compartilhar em qualquer lugar.",
    visual: `<div class="card pagina"><div class="foto"></div><div class="corpo"><b>Apartamento de 2 quartos no Victor Konder</b><span class="preco">R$ 480.000</span><div class="chips"><i>2 quartos</i><i>1 vaga</i><i>68 m²</i><i>Aceita financiamento</i></div><div class="botao">Falar com o atendente</div></div></div>`,
  },
  {
    arquivo: "02-atendente-na-pagina",
    titulo: "Um atendente que <em>responde na hora</em>, dentro da página.",
    sub: "O interessado tira as dúvidas sem esperar você sair da reunião.",
    visual: chat(msg("Tem vaga de garagem?", true), msg("Tem, sim: 1 vaga. Quer ver o imóvel pessoalmente?"), msg("Quero!", true)),
  },
  {
    arquivo: "03-visita-agendada",
    titulo: "A visita sai <em>nos horários que você escolheu</em>.",
    sub: "Você define a agenda uma vez. A IA só oferece o que está livre.",
    visual: chat(msg("Tenho estes horários:"), `<div class="hor"><i>Sáb 09:00</i><i>Sáb 10:00</i><i>Dom 10:00</i></div>`, `<div class="ok">✓ Visita pedida. O corretor confirma.</div>`),
  },
  {
    arquivo: "04-resumo-por-email",
    titulo: "Você recebe o <em>resumo por e&#8209;mail</em>.",
    sub: "Quem pediu visita, o horário e o que a pessoa perguntou, sem ler a conversa toda.",
    visual: `<div class="card email"><small>Nova visita pedida</small><b>Apartamento no Victor Konder</b><div class="linha"><span>Quando</span> Sábado, 09:00</div><div class="linha"><span>Contato</span> Maria (autorizou guardar)</div><div class="linha"><span>Perguntou sobre</span> financiamento e vaga</div><div class="botao">Abrir no painel</div></div>`,
  },
  {
    arquivo: "05-ia-que-nao-inventa",
    titulo: "Não está na ficha? <em>A IA não inventa.</em>",
    sub: "Ela responde só com os dados do imóvel e chama você quando precisa.",
    visual: chat(msg("Qual o valor do condomínio?", true), msg("Essa informação não está na ficha. Vou confirmar com o corretor."), `<div class="ok">↪ Conversa enviada ao corretor</div>`),
  },
  {
    arquivo: "06-painel-do-corretor",
    titulo: "Veja <em>o que a página traz</em> para você.",
    sub: "Visualizações, conversas, contatos e visitas de cada imóvel, em um lugar só.",
    visual: `<div class="card metricas"><div><b>128</b><span>Visualizações</span></div><div><b>14</b><span>Conversas</span></div><div><b>6</b><span>Contatos</span></div><div><b>3</b><span>Visitas</span></div><p class="nota">Dados de exemplo</p></div>`,
  },
  {
    arquivo: "07-texto-pronto-para-revisar",
    titulo: "Título e descrição <em>prontos para revisar</em>.",
    sub: "A IA escreve um rascunho a partir da ficha. Você ajusta e aprova antes de publicar.",
    visual: `<div class="card texto"><small>Rascunho</small><b>Apartamento de 2 quartos no Victor Konder</b><p>Apartamento com 68 m², 2 quartos, 1 vaga e sacada com churrasqueira, no bairro Victor Konder, em Blumenau. Aceita financiamento.</p><div class="duplo"><div class="botao ghost">Editar</div><div class="botao">Aprovar</div></div></div>`,
  },
  {
    arquivo: "08-privacidade-do-comprador",
    titulo: "Só guarda o contato <em>com a permissão</em> de quem pergunta.",
    sub: "O comprador escolhe, os dados são só seus e podem ser apagados quando ele pedir.",
    visual: chat(msg("Posso guardar seu nome e telefone para o corretor falar com você?"), `<div class="hor"><i class="cheio">Pode guardar</i><i>Prefiro não</i></div>`),
  },
];

const css = `*{box-sizing:border-box;margin:0}
body{width:1080px;height:1080px;background:#0f3d3e;color:#fff;font-family:Inter,sans-serif;position:relative;overflow:hidden}
.glow{position:absolute;right:-220px;top:-220px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,#1b5a5b 0%,rgba(15,61,62,0) 70%)}
.topo{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:14px;font:700 32px 'Space Grotesk'}
.topo svg{width:42px;height:42px}
.txt{position:absolute;left:72px;top:150px;width:936px}
h1{font:700 68px/1.07 'Space Grotesk';letter-spacing:-.025em}
h1 em{font-style:normal;color:#f2a65a}
.sub{margin-top:24px;font-size:28px;line-height:1.38;color:#cfe0de;max-width:860px}
.vis{position:absolute;left:72px;right:72px;top:520px;display:flex;justify-content:center}
.card{width:100%;background:#fff;color:#111816;border-radius:32px;padding:28px 30px;box-shadow:0 30px 70px rgba(0,0,0,.35)}
.msg{padding:16px 20px;border-radius:22px;font-size:25px;line-height:1.35;max-width:82%;margin-top:14px}
.card>.msg:first-child{margin-top:0}
.ia{background:#eef1f0;border-bottom-left-radius:6px}
.eu{background:#0f3d3e;color:#fff;margin-left:auto;border-bottom-right-radius:6px}
.hor{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap}
.hor i{font-style:normal;font-size:22px;font-weight:600;border:2px solid #0f3d3e;color:#0f3d3e;border-radius:999px;padding:10px 22px}
.hor i.cheio{background:#0f3d3e;color:#fff}
.ok{margin-top:18px;border-radius:18px;background:#e6efee;padding:16px 20px;font-size:23px;color:#0f3d3e;font-weight:600}
.pagina{padding:0;overflow:hidden}.foto{height:120px;background:linear-gradient(135deg,#7aa6a3,#cfe0de 55%,#f2a65a)}
.corpo{padding:24px 30px 28px;display:flex;flex-direction:column;gap:12px}.corpo b{font:700 31px 'Space Grotesk'}
.preco{font:600 30px Inter;color:#0f3d3e}.chips{display:flex;gap:10px;flex-wrap:wrap}.chips i{font-style:normal;font-size:21px;background:#eef1f0;border-radius:999px;padding:8px 16px}
.botao{margin-top:6px;background:#0f3d3e;color:#fff;border-radius:999px;text-align:center;font-weight:600;font-size:24px;padding:16px}
.ghost{background:#fff;color:#0f3d3e;border:2px solid #0f3d3e}.duplo{display:flex;gap:14px}.duplo .botao{flex:1}
.email small,.texto small{font-size:20px;letter-spacing:.08em;text-transform:uppercase;color:#a85f1c;font-weight:600}
.email b,.texto b{display:block;font:700 33px 'Space Grotesk';margin:8px 0 14px}
.linha{font-size:23px;padding:11px 0;border-top:1px solid #e3e8e6}.linha span{display:inline-block;width:200px;color:#5b6b68}
.texto p{font-size:24px;line-height:1.42;color:#33423f;margin-bottom:18px}
.metricas{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:transparent;box-shadow:none;padding:0}
.metricas div{background:#fff;border-radius:26px;padding:26px 28px;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.metricas b{display:block;font:700 62px 'Space Grotesk';color:#0f3d3e}.metricas span{font-size:24px;color:#5b6b68}
.nota{grid-column:1/-1;font-size:19px;color:#cfe0de;text-align:right}
.rodape{position:absolute;left:72px;right:72px;bottom:52px;display:flex;justify-content:space-between;font-size:23px;color:#cfe0de}
.rodape b{color:#f2a65a;font-weight:600}`;

const html = (c) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="glow"></div><div class="topo">${MARCA}Showing</div><div class="txt"><h1>${c.titulo}</h1><p class="sub">${c.sub}</p></div><div class="vis">${c.visual}</div><div class="rodape"><span>Piloto com corretores de Blumenau</span><b>showing.foliumdev.com.br</b></div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 2 });
for (const c of cartoes) {
  const arq = join(dir, "features", `${c.arquivo}.html`);
  writeFileSync(arq, html(c));
  await p.goto(`file://${arq}`);
  await p.waitForLoadState("networkidle");
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(dir, "features", `${c.arquivo}.png`) });
  console.log("ok", c.arquivo);
}
await b.close();
