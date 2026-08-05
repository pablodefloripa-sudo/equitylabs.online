import { logEvent, setUserId } from 'firebase/analytics';
import { getFirebaseAnalytics } from './client';

type AnalyticsValue = string | number | boolean;

const normalizeValue = (value: unknown): AnalyticsValue | undefined => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value == null) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item);
        }

        try {
          return JSON.stringify(item);
        } catch {
          return '[unserializable]';
        }
      })
      .join(', ')
      .slice(0, 100);
  }

  try {
    return JSON.stringify(value).slice(0, 100);
  } catch {
    return String(value).slice(0, 100);
  }
};

const normalizeParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, normalizeValue(value)] as const)
      .filter((entry): entry is readonly [string, AnalyticsValue] => typeof entry[1] !== 'undefined'),
  );

export const trackFirebaseEvent = async (name: string, params: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return;

  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return;
    logEvent(analytics, name, normalizeParams(params));
  } catch {
    // Analytics stays best-effort.
  }
};

export const setFirebaseAnalyticsUser = async (userId: string | null | undefined) => {
  if (typeof window === 'undefined') return;

  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics || !userId) return;
    setUserId(analytics, userId);
  } catch {
    // Analytics stays best-effort.
  }
};
