export type SubscriptionPlanKey =
  | 'FREE_30_DAYS'
  | 'TACTICAL_25'
  | 'PREMIUM_50'
  | 'MASTERMIND_100'
  | 'ENTERPRISE_500'
  | 'ALLIANCE_1000';

export const FREE_PLAN_KEY: SubscriptionPlanKey = 'FREE_30_DAYS';

export const PLAN_DEFAULT_MODELS: Record<SubscriptionPlanKey, string> = {
  FREE_30_DAYS: 'qwen/qwen3-vl-8b-thinking',
  TACTICAL_25: 'qwen/qwen3-vl-8b-thinking',
  PREMIUM_50: 'qwen/qwen3-vl-8b-thinking',
  MASTERMIND_100: 'qwen/qwen3-vl-8b-thinking',
  ENTERPRISE_500: 'qwen/qwen3-vl-8b-thinking',
  ALLIANCE_1000: 'qwen/qwen3-vl-8b-thinking',
};

const LEGACY_PLAN_MAP: Record<string, SubscriptionPlanKey> = {
  free: 'FREE_30_DAYS',
  tactical: 'TACTICAL_25',
  premium: 'PREMIUM_50',
  mastermind: 'MASTERMIND_100',
  enterprise: 'ENTERPRISE_500',
  alliance: 'ALLIANCE_1000',
};

const PLAN_RANK: Record<SubscriptionPlanKey, number> = {
  FREE_30_DAYS: 0,
  TACTICAL_25: 1,
  PREMIUM_50: 2,
  MASTERMIND_100: 3,
  ENTERPRISE_500: 4,
  ALLIANCE_1000: 4,
};

export function normalizeSubscriptionPlan(plan: string | null | undefined): SubscriptionPlanKey {
  if (!plan) return FREE_PLAN_KEY;
  if (plan in PLAN_DEFAULT_MODELS) return plan as SubscriptionPlanKey;
  return LEGACY_PLAN_MAP[plan.toLowerCase()] || FREE_PLAN_KEY;
}

export function getDefaultModelForPlan(plan: string | null | undefined): string {
  return PLAN_DEFAULT_MODELS[normalizeSubscriptionPlan(plan)];
}

export function isFreeSubscriptionPlan(plan: string | null | undefined): boolean {
  return normalizeSubscriptionPlan(plan) === FREE_PLAN_KEY;
}

export function planMeetsMinimum(
  plan: string | null | undefined,
  requiredPlan: SubscriptionPlanKey,
): boolean {
  return PLAN_RANK[normalizeSubscriptionPlan(plan)] >= PLAN_RANK[requiredPlan];
}
