import Image from "next/image";

export type CartaoFoto = { src: string; alt: string; numero: string; titulo: string; detalhe?: string };

// Três cartões com foto que sobem sobre a base do hero (modelo 2).
export function CartoesSobrepostos({ itens }: { itens: CartaoFoto[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="relative z-10 mx-auto -mt-16 w-full max-w-5xl px-5 md:-mt-24">
      <ul className={`grid gap-4 ${itens.length >= 3 ? "md:grid-cols-3" : itens.length === 2 ? "md:grid-cols-2" : ""}`}>
        {itens.map((c) => (
          <li key={c.numero} className="rounded-2xl bg-card p-3 shadow-lg ring-1 ring-foreground/5">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <Image src={c.src} alt={c.alt} fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover" />
            </div>
            <p className="mt-3 text-sm font-semibold">
              {c.numero} · {c.titulo}
            </p>
            {c.detalhe && <p className="text-sm text-muted-foreground">{c.detalhe}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
