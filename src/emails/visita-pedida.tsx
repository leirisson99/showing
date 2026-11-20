type Props = {
  imovel: string;
  dataHora: string;
  comprador: string;
  contato: string;
  duvidas?: string[];
  link: string;
};

// Aviso ao corretor de um novo pedido de visita (BK-07). Texto dinâmico passa pelo React,
// que já escapa o HTML.
export function VisitaPedida({ imovel, dataHora, comprador, contato, duvidas = [], link }: Props) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "Arial, sans-serif", color: "#171717", margin: 0, padding: 24, background: "#f4f1ea" }}>
        <table role="presentation" width="100%" style={{ maxWidth: 520, margin: "0 auto", background: "#ffffff", borderRadius: 16, padding: 24 }}>
          <tbody>
            <tr>
              <td>
                <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Novo pedido de visita</h1>
                <p style={{ margin: "0 0 16px", color: "#525252" }}>O atendente registrou um pedido. Confirme pelo painel.</p>
                <p style={{ margin: "0 0 4px" }}><strong>Imóvel:</strong> {imovel}</p>
                <p style={{ margin: "0 0 4px" }}><strong>Quando:</strong> {dataHora}</p>
                <p style={{ margin: "0 0 4px" }}><strong>Comprador:</strong> {comprador}</p>
                <p style={{ margin: "0 0 16px" }}><strong>Contato:</strong> {contato}</p>
                {duvidas.length > 0 && (
                  <>
                    <p style={{ margin: "0 0 4px" }}><strong>Dúvidas pendentes:</strong></p>
                    <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
                      {duvidas.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </>
                )}
                <a
                  href={link}
                  style={{ display: "inline-block", background: "#1f3a2b", color: "#ffffff", padding: "12px 20px", borderRadius: 999, textDecoration: "none" }}
                >
                  Ver no painel
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
