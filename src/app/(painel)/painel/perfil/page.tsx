import type { Metadata } from "next";
import { FormPerfil } from "@/components/painel/FormPerfil";
import { urlDaFoto } from "@/lib/fotos";
import { formatarTelefone } from "@/lib/format";
import { buscarPerfil } from "@/lib/painel/perfil";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Perfil — Showing", robots: { index: false } };

export default async function PerfilPage() {
  const corretor = await exigirCorretor();
  const perfil = await buscarPerfil(corretor.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Perfil</h1>
        <p className="mt-1 text-muted-foreground">Como você aparece para o comprador e quando ele pode visitar seus imóveis.</p>
      </div>
      <FormPerfil
        email={perfil?.email ?? corretor.email}
        fotoSrc={perfil?.fotoFileId ? urlDaFoto(perfil.fotoFileId) : null}
        valores={{
          nome: perfil?.nome ?? "",
          creci: perfil?.creci ?? "",
          whatsapp: perfil?.whatsapp ? formatarTelefone(perfil.whatsapp) : "",
          horariosVisita: perfil?.horariosVisita ?? {},
          duracaoVisitaMin: perfil?.duracaoVisitaMin ?? 60,
        }}
      />
    </main>
  );
}
