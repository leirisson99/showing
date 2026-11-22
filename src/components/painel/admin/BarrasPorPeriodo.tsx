type Item = { rotulo: string; valor: number; texto: string };

// Barras simples em CSS (sem biblioteca de gráfico). O texto de cada barra vai no title e no leitor de tela.
export function BarrasPorPeriodo({ titulo, itens }: { titulo: string; itens: Item[] }) {
  const maximo = Math.max(...itens.map((i) => i.valor), 0);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium text-muted-foreground">{titulo}</figcaption>
      <ul className="flex h-28 items-end gap-1">
        {itens.map((i) => (
          <li key={i.rotulo} title={`${i.rotulo}: ${i.texto}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <span className="sr-only">{i.rotulo}: {i.texto}</span>
            <span aria-hidden className="w-full rounded-t bg-primary/80" style={{ height: maximo > 0 ? `${Math.max((i.valor / maximo) * 100, i.valor > 0 ? 3 : 0)}%` : "0%" }} />
          </li>
        ))}
      </ul>
    </figure>
  );
}
