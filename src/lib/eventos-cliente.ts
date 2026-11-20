// Envia um evento de métrica ao servidor, no máximo uma vez por sessão do navegador.
// Falha em silêncio: métrica nunca atrapalha a página.
export function registrarEventoUmaVez(tipo: "visualizacao" | "chat_aberto", imovelId: string) {
  const chave = `showing:evento:${tipo}:${imovelId}`;
  try {
    if (window.sessionStorage.getItem(chave) === "1") return;
    window.sessionStorage.setItem(chave, "1");
  } catch {
    // sem sessionStorage: envia mesmo assim
  }
  void fetch("/api/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, imovelId }),
    keepalive: true,
  }).catch(() => {});
}
