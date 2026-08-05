import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SubscriptionPlanKey =
  | 'FREE_30_DAYS'
  | 'TACTICAL_25'
  | 'PREMIUM_50'
  | 'MASTERMIND_100'
  | 'ENTERPRISE_500'
  | 'ALLIANCE_1000';

export type AgentKey =
  | 'orquestador'
  | 'analista'
  | 'escritor'
  | 'investigador'
  | 'desarrollador'
  | 'disenador'
  | 'revisor'
  | 'asistente'
  | 'architect'
  | 'logic'
  | 'recepcionista';

export interface PlanModelRouting {
  greeting: string;
  default: string;
  agents: Record<AgentKey, string>;
}

export interface UserPlanState {
  plan: SubscriptionPlanKey;
  status: string;
  endDate: string | null;
}

export interface ChatMessage {
  role: string;
  content: string | Array<Record<string, unknown>>;
}

export type PaidProviderName = 'openrouter' | 'gateway';

export interface AIProviderResult {
  data?: Record<string, unknown> & {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
    model?: string;
    provider?: PaidProviderName;
    requestedModel?: string;
  };
  error?: string;
  status: number;
}

export const LOVABLE_AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const EQUITYLABS_PRIMARY_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
export const OPENROUTER_FALLBACK_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

const SINGLE_MODEL_AGENTS: Record<AgentKey, string> = {
  orquestador: EQUITYLABS_PRIMARY_MODEL,
  analista: EQUITYLABS_PRIMARY_MODEL,
  escritor: EQUITYLABS_PRIMARY_MODEL,
  investigador: EQUITYLABS_PRIMARY_MODEL,
  desarrollador: EQUITYLABS_PRIMARY_MODEL,
  disenador: EQUITYLABS_PRIMARY_MODEL,
  revisor: EQUITYLABS_PRIMARY_MODEL,
  asistente: EQUITYLABS_PRIMARY_MODEL,
  architect: EQUITYLABS_PRIMARY_MODEL,
  logic: EQUITYLABS_PRIMARY_MODEL,
  recepcionista: EQUITYLABS_PRIMARY_MODEL,
};

function singleModelRouting(): PlanModelRouting {
  return {
    greeting: EQUITYLABS_PRIMARY_MODEL,
    default: EQUITYLABS_PRIMARY_MODEL,
    agents: { ...SINGLE_MODEL_AGENTS },
  };
}

export const PLAN_MODEL_ROUTING: Record<SubscriptionPlanKey, PlanModelRouting> = {
  FREE_30_DAYS: singleModelRouting(),
  TACTICAL_25: singleModelRouting(),
  PREMIUM_50: singleModelRouting(),
  MASTERMIND_100: singleModelRouting(),
  ENTERPRISE_500: singleModelRouting(),
  ALLIANCE_1000: singleModelRouting(),
};

const LEGACY_PLAN_MAP: Record<string, SubscriptionPlanKey> = {
  free: 'FREE_30_DAYS',
  tactical: 'TACTICAL_25',
  premium: 'PREMIUM_50',
  mastermind: 'MASTERMIND_100',
  enterprise: 'ENTERPRISE_500',
  alliance: 'ALLIANCE_1000',
};

function getOpenRouterHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-OpenRouter-Title': 'EQuityLabs AI',
  };
  const referer =
    Deno.env.get('OPENROUTER_HTTP_REFERER')
    || Deno.env.get('PUBLIC_SITE_URL')
    || Deno.env.get('SITE_URL');

  if (referer) {
    headers['HTTP-Referer'] = referer;
  }

  return headers;
}

function resolvePaidProvider(
  gatewayUrl: string,
  paidApiKey: string,
): { name: PaidProviderName; gatewayUrl: string; apiKey: string; extraHeaders?: Record<string, string> } | null {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') || '';
  if (openRouterApiKey) {
    return {
      name: 'openrouter',
      gatewayUrl: OPENROUTER_CHAT_URL,
      apiKey: openRouterApiKey,
      extraHeaders: getOpenRouterHeaders(),
    };
  }

  if (paidApiKey) {
    return {
      name: 'gateway',
      gatewayUrl,
      apiKey: paidApiKey,
    };
  }

  return null;
}

function shouldRetryWithOpenRouterFallback(
  status: number,
  responseText: string,
  model: string,
  fallbackModel: string,
): boolean {
  if (model === fallbackModel) return false;
  if (status !== 400 && status !== 404) return false;

  const lowerText = responseText.toLowerCase();
  return (
    lowerText.includes('model')
    || lowerText.includes('not found')
    || lowerText.includes('unavailable')
    || lowerText.includes('no endpoints')
    || lowerText.includes('unknown')
  );
}

async function executePaidChatCompletion(
  provider: { name: PaidProviderName; gatewayUrl: string; apiKey: string; extraHeaders?: Record<string, string> },
  model: string,
  messages: ChatMessage[],
  maxTokens = 500,
) {
  const outputTokenBudget = Math.max(maxTokens, 256);
  const requestBody: Record<string, unknown> = {
    model,
    messages,
    max_tokens: outputTokenBudget,
    temperature: 0.7,
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    'Content-Type': 'application/json',
    ...(provider.extraHeaders || {}),
  };

  const response = await fetch(provider.gatewayUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  return {
    response,
    responseText: await response.text(),
  };
}

export function hasPaidAIProvider(gatewayUrl: string, paidApiKey: string): boolean {
  return resolvePaidProvider(gatewayUrl, paidApiKey) !== null;
}

export function getPaidProviderName(gatewayUrl: string, paidApiKey: string): PaidProviderName | null {
  return resolvePaidProvider(gatewayUrl, paidApiKey)?.name || null;
}

export function normalizePlan(plan: string | null | undefined): SubscriptionPlanKey {
  if (!plan) return 'FREE_30_DAYS';
  if (plan in PLAN_MODEL_ROUTING) return plan as SubscriptionPlanKey;
  return LEGACY_PLAN_MAP[plan.toLowerCase()] || 'FREE_30_DAYS';
}

export async function getUserPlanState(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  userId: string,
): Promise<UserPlanState> {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data } = await supabase
    .from('user_planes')
    .select('plan, status, end_date')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    plan: normalizePlan(data?.plan),
    status: data?.status || 'active',
    endDate: data?.end_date || null,
  };
}

export function isFreePlan(plan: SubscriptionPlanKey): boolean {
  return plan === 'FREE_30_DAYS';
}

export function resolveModel(plan: SubscriptionPlanKey, route: 'greeting' | 'default' | AgentKey): string {
  const routing = PLAN_MODEL_ROUTING[plan];
  if (route === 'greeting') return routing.greeting;
  if (route === 'default') return routing.default;
  return routing.agents[route];
}

export function getAllowedModelsForPlan(plan: SubscriptionPlanKey): string[] {
  const routing = PLAN_MODEL_ROUTING[plan];
  return Array.from(new Set([
    routing.greeting,
    routing.default,
    ...Object.values(routing.agents),
  ]));
}

export function isModelAllowedForPlan(plan: SubscriptionPlanKey, model: string): boolean {
  return getAllowedModelsForPlan(plan).includes(model.trim());
}

export function resolvePreferredModelForPlan(
  plan: SubscriptionPlanKey,
  fallbackRoute: 'greeting' | 'default' | AgentKey,
  preferredModel: unknown,
): {
  model: string;
  requestedPreferredModel: string | null;
  preferredModelAllowed: boolean;
} {
  const fallbackModel = resolveModel(plan, fallbackRoute);
  const requestedPreferredModel = typeof preferredModel === 'string'
    ? preferredModel.trim()
    : '';

  if (!requestedPreferredModel) {
    return {
      model: fallbackModel,
      requestedPreferredModel: null,
      preferredModelAllowed: false,
    };
  }

  if (isModelAllowedForPlan(plan, requestedPreferredModel)) {
    return {
      model: requestedPreferredModel,
      requestedPreferredModel,
      preferredModelAllowed: true,
    };
  }

  return {
    model: fallbackModel,
    requestedPreferredModel,
    preferredModelAllowed: false,
  };
}

export async function callPaidGateway(
  gatewayUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens = 500,
): Promise<AIProviderResult> {
  const provider = resolvePaidProvider(gatewayUrl, apiKey);
  if (!provider) {
    return {
      error: 'No paid AI provider configured. Set OPENROUTER_API_KEY or LOVABLE_API_KEY.',
      status: 503,
    };
  }

  const requestedModel = model;
  let effectiveModel = model;
  let { response, responseText } = await executePaidChatCompletion(
    provider,
    effectiveModel,
    messages,
    maxTokens,
  );

  if (
    !response.ok
    && provider.name === 'openrouter'
    && shouldRetryWithOpenRouterFallback(response.status, responseText, requestedModel, OPENROUTER_FALLBACK_MODEL)
  ) {
    console.warn(
      `[EquityLabs] OpenRouter model "${requestedModel}" unavailable. Retrying with fallback "${OPENROUTER_FALLBACK_MODEL}".`,
    );

    effectiveModel = OPENROUTER_FALLBACK_MODEL;
    ({ response, responseText } = await executePaidChatCompletion(
      provider,
      effectiveModel,
      messages,
      maxTokens,
    ));
  }

  if (!response.ok) {
    let errorMessage = `${provider.name === 'openrouter' ? 'OpenRouter' : 'AI Gateway'} error ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch {
      // Keep gateway status message.
    }

    if (response.status === 429) {
      return { error: 'Rate limit exceeded. Please try again later.', status: 429 };
    }
    if (response.status === 402) {
      return { error: 'AI credits exhausted. Please add funds in Settings -> Workspace -> Usage.', status: 402 };
    }

    return { error: errorMessage, status: response.status };
  }

  try {
    const parsed = JSON.parse(responseText) as Record<string, unknown>;
    return {
      data: {
        ...parsed,
        provider: provider.name,
        model: effectiveModel,
        requestedModel,
      },
      status: 200,
    };
  } catch {
    return { error: 'Invalid response format from AI', status: 500 };
  }
}

export async function callAIWithCostControl(
  params: {
    userId: string;
    plan: SubscriptionPlanKey;
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    gatewayUrl: string;
    paidApiKey: string;
    model: string;
    messages: ChatMessage[];
    maxTokens?: number;
  },
): Promise<AIProviderResult> {
  return callPaidGateway(
    params.gatewayUrl,
    params.paidApiKey,
    params.model,
    params.messages,
    params.maxTokens,
  );
}
