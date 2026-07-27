import agentsData from '@/data/agentsData.json';
import { toApiLanguage, useLanguage } from '@/hooks/useLanguage';

type SupportedLang = 'es' | 'en' | 'it';

type Agent = typeof agentsData.equity_labs_v1[0];

export type { Agent };

export function useAgentI18n() {
  const { language } = useLanguage();
  const selectedLang = toApiLanguage(language);
  const lang: SupportedLang = (selectedLang === 'es' || selectedLang === 'en' || selectedLang === 'it')
    ? selectedLang
    : 'en';

  const t = (key: string): string => {
    const uiStrings = agentsData.ui as Record<string, Record<string, string>>;
    return uiStrings[lang]?.[key] ?? uiStrings['en']?.[key] ?? key;
  };

  const getAgentName = (agent: Agent): string => {
    return (agent.name as Record<string, string>)[lang] ?? (agent.name as Record<string, string>)['en'];
  };

  const getAgentTasks = (agent: Agent): string[] => {
    return (agent.tasks as Record<string, string[]>)[lang] ?? (agent.tasks as Record<string, string[]>)['en'];
  };

  const getEngine = (agent: Agent, tier: 'free' | 'pro'): string => {
    return agent.engines[tier];
  };

  return { lang, t, getAgentName, getAgentTasks, getEngine, agents: agentsData.equity_labs_v1 };
}
