import type { EntradaRoteiro } from "./entrada";
import type { Roteiro } from "./roteiro";

// O agente vê as fotos como f1, f2... (curtas, difíceis de errar). O roteiro guardado usa os ids reais.

export function comAliasDeFotos(e: EntradaRoteiro): { entrada: EntradaRoteiro; paraReal: Map<string, string> } {
  const paraReal = new Map<string, string>();
  const fotos = e.fotos.map((f, k) => {
    const alias = `f${k + 1}`;
    paraReal.set(alias, f.id);
    return { ...f, id: alias };
  });
  return { entrada: { ...e, fotos }, paraReal };
}

/** Troca os aliases pelos ids reais em todo o roteiro (fotos dos capítulos e fontes `foto:fN`). */
export function trocarIdsDeFotos(r: Roteiro, mapa: Map<string, string>): Roteiro {
  const id = (a: string) => mapa.get(a) ?? a;
  const fontes = (f: { campo: string }[]) => f.map((x) => (x.campo.startsWith("foto:") ? { campo: `foto:${id(x.campo.slice(5))}` } : x));
  const texto = (t: { texto: string; fontes: { campo: string }[] }) => ({ ...t, fontes: fontes(t.fontes) });
  return {
    ...r,
    capitulos: r.capitulos.map((c) => {
      switch (c.tipo) {
        case "hero_imagem":
          return { ...c, titulo: texto(c.titulo), foto: id(c.foto) };
        case "ambientes_fixo":
          return { ...c, quadros: c.quadros.map((q) => ({ ...q, foto: id(q.foto), frase: texto(q.frase) })) };
        case "galeria_horizontal":
        case "galeria_grade":
          return { ...c, titulo: texto(c.titulo), fotos: c.fotos.map(id) };
        default:
          return { ...c, titulo: texto(c.titulo) };
      }
    }),
  };
}
