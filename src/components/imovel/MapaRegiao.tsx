import { MapPin } from "lucide-react";
import type { ImovelPublico } from "@/lib/imoveis";

// RN-05: por padrão mostra só a região aproximada (coordenada arredondada, sem
// marcador). O endereço e o ponto exato só aparecem se o corretor marcou `mostrarEndereco`.
export function MapaRegiao({ imovel }: { imovel: ImovelPublico }) {
  const { latitude, longitude, mostrarEndereco, endereco, bairro, cidade } = imovel;
  const exato = mostrarEndereco && endereco;

  let src: string | null = null;
  if (latitude !== null && longitude !== null) {
    const lat = exato ? latitude : Math.round(latitude * 100) / 100;
    const lon = exato ? longitude : Math.round(longitude * 100) / 100;
    const d = exato ? 0.004 : 0.012;
    const bbox = [lon - d, lat - d, lon + d, lat + d].join(",");
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${exato ? `&marker=${lat},${lon}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="size-4 shrink-0" aria-hidden />
        {exato ? `${endereco} — ${bairro}, ${cidade}` : `${bairro}, ${cidade}`}
      </p>
      {src ? (
        <iframe
          title={`Mapa da região do ${bairro}, ${cidade}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-64 w-full rounded-xl border lg:h-80"
        />
      ) : null}
      {!exato && <p className="text-sm text-muted-foreground">Região aproximada.</p>}
    </div>
  );
}
