import { ImageResponse } from "next/og";

// Imagem de compartilhamento da página inicial (WhatsApp, LinkedIn, X): 1200×630, nas cores da marca.
export const alt = "Showing — assistente virtual para corretores de imóveis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagemDeCompartilhamento() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0f3d3e", color: "#ffffff", padding: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 143 143">
            <path d="M33 0H77A33 33 0 0 1 110 33A33 33 0 0 1 77 66H4A4 4 0 0 1 0 62V33A33 33 0 0 1 33 0Z" fill="#ffffff" />
            <path d="M66 77H110A33 33 0 0 1 143 110V139A4 4 0 0 1 139 143H66A33 33 0 0 1 33 110A33 33 0 0 1 66 77Z" fill="#f2a65a" />
          </svg>
          <div style={{ fontSize: 52, fontWeight: 700 }}>Showing</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>Seu imóvel atende sozinho enquanto você não está.</div>
          <div style={{ fontSize: 34, color: "#cfe0de", maxWidth: 900 }}>Página do imóvel com assistente virtual que responde o comprador e marca a visita.</div>
        </div>
      </div>
    ),
    size,
  );
}
