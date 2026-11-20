// Faixa escura de chamada final (modelos 1 e 2).
export function FaixaChamada({ titulo, acao }: { titulo: string; acao: React.ReactNode }) {
  return (
    <section className="bg-deep text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center">
        <h2 className="max-w-xl text-2xl leading-snug font-medium md:text-3xl">{titulo}</h2>
        {acao}
      </div>
    </section>
  );
}
