import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { toApiLanguage, useLanguage } from '@/hooks/useLanguage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAttachment {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

interface AIChatResult {
  response: string;
  meta?: Record<string, unknown> | null;
}

interface UseAIChatReturn {
  sendMessage: (
    message: string,
    conversationHistory?: Message[],
    agentId?: string,
    attachments?: ChatAttachment[],
    preferredModel?: string,
  ) => Promise<AIChatResult>;
  isLoading: boolean;
  error: string | null;
}

const RUNTIME_ERROR_LOG_KEY = 'eq_runtime_error_log';
const RUNTIME_HEALTH_KEY = 'eq_runtime_health_v1';

const appendRuntimeError = (source: string, message: string) => {
  try {
    const raw = localStorage.getItem(RUNTIME_ERROR_LOG_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(current) ? current : [];
    next.unshift({
      id: crypto.randomUUID(),
      source,
      message,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(RUNTIME_ERROR_LOG_KEY, JSON.stringify(next.slice(0, 15)));
  } catch {
    // ignore logger storage failures
  }
};

const markRuntimeHealth = (payload: Record<string, unknown>) => {
  try {
    localStorage.setItem(RUNTIME_HEALTH_KEY, JSON.stringify({
      ...payload,
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    // ignore logger storage failures
  }
};

const isSimpleGreeting = (message: string) =>
  /^(hola|hello|hi|hey|buenos dias|buenas tardes|buenas noches|saludos)$/i.test(
    message.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );

const localGreeting = (language: string) => {
  const lang = language.toLowerCase();
  const greetings: Record<string, string> = {
    es: 'Hola. Estoy listo para ayudarte desde EquityLabs. Puedo orientarte, organizar ideas, preparar un plan de accion o trabajar con tus agentes.',
    en: 'Hello. I am ready to help from EquityLabs. I can organize ideas, prepare an action plan, or work with your agents.',
    pt: 'Ola. Estou pronto para ajudar no EquityLabs. Posso organizar ideias, preparar um plano de acao ou trabalhar com seus agentes.',
    fr: 'Bonjour. Je suis pret a vous aider depuis EquityLabs. Je peux organiser des idees, preparer un plan d action ou travailler avec vos agents.',
    de: 'Hallo. Ich bin bereit, dir in EquityLabs zu helfen. Ich kann Ideen ordnen, einen Aktionsplan vorbereiten oder mit deinen Agenten arbeiten.',
    it: 'Ciao. Sono pronto ad aiutarti da EquityLabs. Posso organizzare idee, preparare un piano d azione o lavorare con i tuoi agenti.',
    nl: 'Hallo. Ik ben klaar om je te helpen vanuit EquityLabs. Ik kan ideeen ordenen, een actieplan voorbereiden of met je agents werken.',
    pl: 'Czesc. Jestem gotowy pomoc w EquityLabs. Moge uporzadkowac pomysly, przygotowac plan dzialania albo pracowac z agentami.',
  };

  return greetings[lang] || greetings.es;
};

export const useAIChat = (): UseAIChatReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const apiLanguage = toApiLanguage(language);

  const sendMessage = useCallback(async (
    message: string, 
    conversationHistory: Message[] = [],
    agentId?: string,
    attachments: ChatAttachment[] = [],
    preferredModel?: string,
  ): Promise<AIChatResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message,
          agentId,
          language: apiLanguage,
          attachments,
          preferredModel,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (fnError) {
        console.error('[EquityLabs] ai-chat invoke failed:', fnError);
        appendRuntimeError('ai-chat.invoke', fnError.message || 'Invoke failed');
        if (isSimpleGreeting(message)) return { response: localGreeting(apiLanguage), meta: { provider: 'local-fallback' } };
        throw new Error(fnError.message || 'Error calling AI service');
      }

      if (data?.error) {
        console.error('[EquityLabs] ai-chat returned error:', data.error, data);
        appendRuntimeError('ai-chat.response', String(data.error));
        if (isSimpleGreeting(message)) return { response: localGreeting(apiLanguage), meta: { provider: 'local-fallback' } };
        throw new Error(data.error);
      }

      if (!data?.response) {
        console.error('[EquityLabs] ai-chat returned empty response:', data);
        appendRuntimeError('ai-chat.empty', 'No response received from AI');
        if (isSimpleGreeting(message)) return { response: localGreeting(apiLanguage), meta: { provider: 'local-fallback' } };
        throw new Error('No response received from AI');
      }

      markRuntimeHealth({
        source: 'ai-chat',
        status: 'ok',
        effectiveModel: data?.meta?.effectiveModel || data?.meta?.model || null,
      });

      return {
        response: data.response,
        meta: data.meta || null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      appendRuntimeError('ai-chat.catch', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiLanguage]);

  return {
    sendMessage,
    isLoading,
    error,
  };
};
