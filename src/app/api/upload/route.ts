import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { apagarFoto, guardarFoto, urlDaFoto, validarArquivoFoto } from "@/lib/fotos";
import { CORRETOR_MOCK, usarMocks } from "@/lib/mocks";
import { adicionarFoto, buscarImovel } from "@/lib/painel/imoveis";
import { definirFotoDoPerfil } from "@/lib/painel/perfil";

// Recebe a foto do painel, valida e guarda no Appwrite (ou em public/mock-uploads com USAR_MOCKS=1).
// Exige sessão e confere que o imóvel é do corretor logado.

// `alvo` diz para onde vai a foto: de um imóvel (padrão, exige imovelId) ou do perfil do corretor.
const corpo = z.discriminatedUnion("alvo", [
  z.object({ alvo: z.literal("imovel"), imovelId: z.string().min(1), arquivo: z.instanceof(File) }),
  z.object({ alvo: z.literal("perfil"), arquivo: z.instanceof(File) }),
]);

export async function POST(request: Request) {
  const corretorId = usarMocks() ? CORRETOR_MOCK.id : (await auth())?.user?.id;
  if (!corretorId) return NextResponse.json({ erro: "Faça login para enviar fotos." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const dados = corpo.safeParse({
    alvo: form?.get("alvo") ?? "imovel",
    imovelId: form?.get("imovelId") ?? undefined,
    arquivo: form?.get("arquivo"),
  });
  if (!dados.success) return NextResponse.json({ erro: "Envie uma foto e o imóvel." }, { status: 400 });

  const { arquivo } = dados.data;

  if (dados.data.alvo === "perfil") {
    const problema = await validarArquivoFoto(arquivo);
    if (problema) return NextResponse.json({ erro: problema }, { status: 400 });
    const fileId = await guardarFoto(arquivo);
    const r = await definirFotoDoPerfil(corretorId, fileId);
    if (!r.ok) {
      await apagarFoto(fileId);
      return NextResponse.json({ erro: r.erro }, { status: 404 });
    }
    revalidatePath("/painel/perfil");
    return NextResponse.json({ foto: { src: urlDaFoto(fileId) } });
  }

  const { imovelId } = dados.data;
  const imovel = await buscarImovel(corretorId, imovelId);
  if (!imovel) return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });

  const problema = await validarArquivoFoto(arquivo);
  if (problema) return NextResponse.json({ erro: problema }, { status: 400 });

  const fileId = await guardarFoto(arquivo);
  const r = await adicionarFoto(corretorId, imovelId, fileId);
  if (!r.ok) {
    await apagarFoto(fileId);
    return NextResponse.json({ erro: r.erro }, { status: 404 });
  }

  revalidatePath(`/painel/imoveis/${imovelId}`);
  if (imovel.status !== "rascunho") revalidatePath(`/imovel/${imovel.slug}`);
  const foto = r.imovel.fotos[r.imovel.fotos.length - 1];
  return NextResponse.json({ foto: { id: foto.id, src: urlDaFoto(foto.fileId), legenda: foto.legenda } });
}
