import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { usarMocks } from "@/lib/mocks";
import { urlUnsplash } from "@/mocks/unsplash";
import { removerFoto, uploadFoto, urlFoto } from "@/lib/storage";
import { FOTO_MAX_BYTES, FOTO_TIPOS } from "@/lib/painel/schema";

// Fotos: Appwrite em produção; com USAR_MOCKS=1 os arquivos vão para public/mock-uploads.
// O banco guarda só o fileId. Convenção dos mocks: "mock-unsplash:<id da foto>" e "mock-upload:<arquivo>".

const PASTA_MOCK = path.join(process.cwd(), "public", "mock-uploads");
const EXTENSAO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function urlDaFoto(fileId: string): string {
  if (fileId.startsWith("mock-unsplash:")) return urlUnsplash(fileId.slice("mock-unsplash:".length));
  if (fileId.startsWith("mock-upload:")) return `/mock-uploads/${fileId.slice("mock-upload:".length)}`;
  return urlFoto(fileId);
}

function assinaturaConfere(tipo: string, b: Uint8Array): boolean {
  if (tipo === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (tipo === "image/png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (tipo === "image/webp") {
    const txt = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
    return txt(0, 4) === "RIFF" && txt(8, 4) === "WEBP";
  }
  return false;
}

/** RNF-09: só jpg, png e webp, até 10 MB, e o conteúdo precisa ser mesmo uma imagem. */
export async function validarArquivoFoto(arquivo: File): Promise<string | null> {
  if (!(FOTO_TIPOS as readonly string[]).includes(arquivo.type)) return "Use uma foto JPG, PNG ou WebP.";
  if (arquivo.size > FOTO_MAX_BYTES) return "A foto deve ter no máximo 10 MB.";
  if (arquivo.size === 0) return "O arquivo está vazio.";
  const inicio = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
  if (!assinaturaConfere(arquivo.type, inicio)) return "O arquivo não parece ser uma imagem válida.";
  return null;
}

export async function guardarFoto(arquivo: File): Promise<string> {
  if (!usarMocks()) return uploadFoto(arquivo);
  const nome = `${randomUUID()}.${EXTENSAO[arquivo.type]}`;
  await mkdir(PASTA_MOCK, { recursive: true });
  await writeFile(path.join(PASTA_MOCK, nome), Buffer.from(await arquivo.arrayBuffer()));
  return `mock-upload:${nome}`;
}

export async function apagarFoto(fileId: string): Promise<void> {
  if (fileId.startsWith("mock-unsplash:")) return;
  if (fileId.startsWith("mock-upload:")) {
    // basename impede sair da pasta, mesmo com um fileId adulterado.
    await unlink(path.join(PASTA_MOCK, path.basename(fileId.slice("mock-upload:".length)))).catch(() => {});
    return;
  }
  await removerFoto(fileId);
}
