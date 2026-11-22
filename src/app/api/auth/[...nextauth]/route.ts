import { NextRequest } from "next/server";
import { handlers } from "@/auth";

// Atrás do proxy, o servidor escuta em 0.0.0.0:<porta> e o Auth.js monta os redirecionamentos com esse
// host (ex.: https://0.0.0.0:80/login?error=...). Em produção, o pedido segue com o domínio público.
function comDominioPublico(req: NextRequest): NextRequest {
  if (process.env.NODE_ENV !== "production" || !process.env.NEXT_PUBLIC_SITE_URL) return req;
  try {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL);
    const url = new URL(req.url);
    url.protocol = site.protocol;
    url.hostname = site.hostname;
    url.port = site.port; // vazio = porta padrão; sem isso ficaria a porta do contêiner
    const init: ConstructorParameters<typeof NextRequest>[1] & { duplex?: "half" } = { method: req.method, headers: req.headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req.body;
      init.duplex = "half";
    }
    return new NextRequest(url, init);
  } catch {
    return req;
  }
}

export const GET = (req: NextRequest) => handlers.GET(comDominioPublico(req));
export const POST = (req: NextRequest) => handlers.POST(comDominioPublico(req));
