import type { Model } from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import { urlDoSite } from "@/lib/seo";

// Modelo do atendente via OpenRouter, que fala o protocolo da OpenAI. A chave e o id do
// modelo vêm só de variáveis de ambiente do servidor (AI_API_KEY, AI_MODEL).

const URL_PADRAO = "https://openrouter.ai/api/v1";

export function iaConfigurada(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_MODEL);
}

export function criarModelo(): Model {
  const apiKey = process.env.AI_API_KEY;
  const modelId = process.env.AI_MODEL;
  if (!apiKey || !modelId) throw new Error("AI_API_KEY e AI_MODEL não configuradas.");

  return new OpenAIModel({
    api: "chat",
    modelId,
    apiKey,
    // Respostas curtas e estáveis: o atendente só repete dados da ficha.
    temperature: 0.3,
    maxTokens: 3000, // folga para modelos que raciocinam antes de responder e chamar ferramenta
    // OpenRouter: pouco raciocínio. O atendente segue regras fixas; sem isto alguns modelos gastam
    // todo o limite pensando e a resposta vem vazia (MaxTokensError).
    params: { reasoning: { effort: "low" } },
    clientConfig: {
      baseURL: process.env.AI_BASE_URL || URL_PADRAO,
      // Identifica o app no OpenRouter. Só nome e endereço públicos do site.
      defaultHeaders: { "HTTP-Referer": urlDoSite(), "X-Title": "Showing" },
    },
  });
}
