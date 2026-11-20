type Props = { link: string };

export function LinkDeAcesso({ link }: Props) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "Arial, sans-serif", color: "#171717", margin: 0, padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Seu link de acesso ao Showing</h1>
        <p>Clique no botão abaixo para entrar no painel. O link vale por 15 minutos e só pode ser usado uma vez.</p>
        <p>
          <a
            href={link}
            style={{
              display: "inline-block",
              background: "#171717",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Entrar no painel
          </a>
        </p>
        <p style={{ fontSize: 13, color: "#737373" }}>
          Se você não pediu este acesso, é só ignorar este e-mail.
        </p>
      </body>
    </html>
  );
}
