import { Client, ID, Storage } from "node-appwrite";

// Só no servidor: a chave de API nunca vai para o cliente.
function config() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const bucketId = process.env.APPWRITE_BUCKET_ID;
  if (!endpoint || !projectId || !apiKey || !bucketId) {
    throw new Error("Variáveis APPWRITE_* não configuradas.");
  }
  return { endpoint, projectId, apiKey, bucketId };
}

function storage() {
  const { endpoint, projectId, apiKey } = config();
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  return new Storage(client);
}

/** Envia a foto ao Appwrite e devolve o fileId (é isso que vai para o banco). */
export async function uploadFoto(arquivo: File): Promise<string> {
  const { bucketId } = config();
  const criado = await storage().createFile({
    bucketId,
    fileId: ID.unique(),
    file: arquivo,
  });
  return criado.$id;
}

export async function removerFoto(fileId: string): Promise<void> {
  const { bucketId } = config();
  await storage().deleteFile({ bucketId, fileId });
}

/** Monta a URL pública da foto a partir do fileId. */
export function urlFoto(fileId: string): string {
  const { endpoint, projectId, bucketId } = config();
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
}
