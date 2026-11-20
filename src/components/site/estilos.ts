// Botões em pílula dos modelos de layout (docs/identidade-visual.md).
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/** Ação principal: bronze com texto branco. */
export const botaoCta = `${base} bg-cta text-cta-foreground hover:bg-cta/90`;
/** Sobre foto ou fundo escuro: contorno claro. */
export const botaoContorno = `${base} border border-white/50 text-white hover:bg-white hover:text-foreground`;
/** Sobre fundo claro: verde-floresta cheio. */
export const botaoEscuro = `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
/** Sobre fundo claro: contorno escuro. */
export const botaoContornoEscuro = `${base} border border-foreground/30 text-foreground hover:bg-foreground hover:text-background`;
