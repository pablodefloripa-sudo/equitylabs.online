import type { LandingLang } from './LanguageFloater';

export const SUPPORTED_LANDING_LANGS: LandingLang[] = ['en', 'es', 'it', 'pt', 'fr', 'de', 'pl', 'nl'];

export const DEFAULT_LANDING_LANG: LandingLang = 'en';

export const isLandingLang = (value: string | null | undefined): value is LandingLang =>
  Boolean(value && SUPPORTED_LANDING_LANGS.includes(value as LandingLang));

export const resolveLandingLang = (candidate?: string | null): LandingLang => {
  if (isLandingLang(candidate)) return candidate;
  return DEFAULT_LANDING_LANG;
};

export const getBrowserLandingLang = (): LandingLang => {
  if (typeof navigator === 'undefined') return DEFAULT_LANDING_LANG;

  const browserLang = navigator.language?.slice(0, 2).toLowerCase();
  return resolveLandingLang(browserLang);
};

export const getStoredLandingLang = (storageKey = 'eq_landing_lang'): LandingLang | null => {
  if (typeof window === 'undefined') return null;
  return resolveLandingLang(window.localStorage.getItem(storageKey));
};

export const setStoredLandingLang = (lang: LandingLang, storageKey = 'eq_landing_lang') => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, lang);
};

export const getLandingLang = (storageKey = 'eq_landing_lang'): LandingLang => {
  return getStoredLandingLang(storageKey) || getBrowserLandingLang();
};

export const resolveLandingSlideUrl = (lang: LandingLang, index: number) => {
  const slideNumber = index + 1;
  return `/slides/landing/${slideNumber}.png`;
};

export const resolveLandingSlideFallbackUrl = (index: number) => {
  const slideNumber = index + 1;
  return `/slides/landing/${slideNumber}.png`;
};
