import "dotenv/config";
import { readFile } from "node:fs/promises";
import { removerFoto, uploadFoto, urlFoto } from "../src/lib/storage";

// pnpm tsx scripts/test-appwrite.ts [--manter] — envia e2e/fixtures/foto.png ao Appwrite, abre a URL
// pública e, por padrão, apaga o arquivo. Com --manter o arquivo fica no bucket.
async function main() {
  const manter = process.argv.includes("--manter");
  const bytes = await readFile("e2e/fixtures/foto.png");
  const arquivo = new File([bytes], "teste-showing.png", { type: "image/png" });

  const fileId = await uploadFoto(arquivo);
  console.log("Enviado. fileId:", fileId);

  const url = urlFoto(fileId);
  const r = await fetch(url);
  console.log("URL pública:", r.status, r.headers.get("content-type"), `${(await r.arrayBuffer()).byteLength} bytes`);
  console.log(url);

  if (manter) console.log("Arquivo mantido no bucket.");
  else {
    await removerFoto(fileId);
    console.log("Arquivo apagado do bucket.");
  }
}

main().catch((e) => {
  console.error("Falha:", e instanceof Error ? `${e.name}: ${e.message}` : "erro");
  process.exit(1);
});
