import type { ReactNode } from "react";

// Layout comum dos e-mails: tabela com estilos inline (clientes de e-mail não leem CSS externo).
// O React escapa todo texto dinâmico.

export function Moldura({ titulo, intro, children, botao }: { titulo: string; intro?: string; children?: ReactNode; botao?: { texto: string; href: string } }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "Arial, sans-serif", color: "#171717", margin: 0, padding: 24, background: "#f4f1ea" }}>
        <table role="presentation" width="100%" style={{ maxWidth: 520, margin: "0 auto", background: "#ffffff", borderRadius: 16, padding: 24 }}>
          <tbody>
            <tr>
              <td>
                <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>{titulo}</h1>
                {intro && <p style={{ margin: "0 0 16px", color: "#525252" }}>{intro}</p>}
                {children}
                {botao && (
                  <a
                    href={botao.href}
                    style={{ display: "inline-block", marginTop: 8, background: "#1f3a2b", color: "#ffffff", padding: "12px 20px", borderRadius: 999, textDecoration: "none" }}
                  >
                    {botao.texto}
                  </a>
                )}
                <p style={{ margin: "24px 0 0", fontSize: 12, color: "#737373" }}>Showing · página do imóvel com atendente virtual</p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p style={{ margin: "0 0 4px" }}>
      <strong>{rotulo}:</strong> {valor}
    </p>
  );
}
