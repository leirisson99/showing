"use client";

import "./globals.css";

// Último recurso: erro no layout raiz. Precisa do próprio <html> e <body>.
export default function ErroGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-5 text-center text-foreground">
        <h1 className="text-3xl font-medium">Algo deu errado</h1>
        <p className="max-w-md text-muted-foreground">Não foi possível carregar o Showing. Tente de novo em instantes.</p>
        <button type="button" onClick={reset} className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
