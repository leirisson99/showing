// Limite simples de mensagens por janela de tempo (RNF-10). Em memória: vale para uma
// instância só, o suficiente para a POC. Com mais de uma instância, trocar por um
// armazenamento compartilhado.

const g = globalThis as unknown as { __showingLimites?: Map<string, number[]> };

export function dentroDoLimite(chave: string, max: number, janelaMs: number, agora = Date.now()): boolean {
  const limites = (g.__showingLimites ??= new Map<string, number[]>());
  const recentes = (limites.get(chave) ?? []).filter((t) => agora - t < janelaMs);

  if (recentes.length >= max) {
    limites.set(chave, recentes);
    return false;
  }
  recentes.push(agora);
  limites.set(chave, recentes);

  // Limpeza ocasional para o mapa não crescer sem fim.
  if (limites.size > 5000) {
    for (const [k, v] of limites) if (v.every((t) => agora - t >= janelaMs)) limites.delete(k);
  }
  return true;
}

export function reiniciarLimites() {
  g.__showingLimites = new Map<string, number[]>();
}
