import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useToast } from '@/hooks/use-toast';
import { buildAuthRedirectUrl } from '@/lib/auth-redirect';
import { clearPendingGoogleOAuth, markGoogleOAuthPending } from '@/lib/oauth-state';
import { trackFirebaseEvent } from '@/integrations/firebase';
import type { Session } from '@supabase/supabase-js';

interface UseGoogleOAuthReturn {
  connectGoogle: () => Promise<void>;
  connectGoogleWorkspace: () => Promise<void>;
  handleOAuthCallback: () => Promise<boolean>;
}

const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

const cleanAuthUrl = (url: URL) => {
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');

  const nextUrl = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}`;
  window.history.replaceState({}, document.title, nextUrl);
};

const waitForSession = async (timeoutMs = 5000): Promise<Session | null> => {
  const {
    data: { session: currentSession },
  } = await supabase.auth.getSession();

  if (currentSession) {
    return currentSession;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const finish = (session: Session | null) => {
      if (resolved) return;
      resolved = true;
      subscription.unsubscribe();
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      resolve(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finish(session);
      }
    });

    const pollTimer = window.setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        finish(session);
      }
    }, 250);

    const timeoutTimer = window.setTimeout(() => {
      finish(null);
    }, timeoutMs);
  });
};

const persistGoogleIntegrations = async (session: Session) => {
  if (!session.provider_token) {
    return;
  }

  const providers = ['gmail', 'drive', 'calendar', 'sheets'];
  const scopesMap: Record<string, string[]> = {
    gmail: ['gmail.readonly', 'gmail.send'],
    drive: ['drive.readonly'],
    calendar: ['calendar'],
    sheets: ['spreadsheets'],
  };

  for (const provider of providers) {
    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: session.user.id,
          provider,
          is_connected: true,
          access_token_encrypted: session.provider_token,
          refresh_token_encrypted: session.provider_refresh_token || null,
          scopes: scopesMap[provider],
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        },
      );

    if (upsertError) {
      console.error(`Error saving ${provider} integration:`, upsertError);
    }
  }
};

export const useGoogleOAuth = (): UseGoogleOAuthReturn => {
  const { toast } = useToast();

  const connectGoogle = useCallback(async () => {
    try {
      void trackFirebaseEvent('google_oauth_start', { scope: 'profile' });
      markGoogleOAuthPending();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildAuthRedirectUrl('/auth'),
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      clearPendingGoogleOAuth();
      console.error('Error connecting to Google:', error);
      void trackFirebaseEvent('google_oauth_error', { scope: 'profile' });
      const message = error instanceof Error ? error.message : String(error);
      const isMissingSecret = message.toLowerCase().includes('missing oauth secret');

      toast({
        title: isMissingSecret ? 'Google no esta configurado en Supabase' : 'Error de conexion',
        description: isMissingSecret
          ? 'Falta cargar el Client Secret de Google en Auth > Providers > Google.'
          : 'No se pudo conectar con Google. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const connectGoogleWorkspace = useCallback(async () => {
    try {
      void trackFirebaseEvent('google_oauth_start', { scope: 'workspace' });
      markGoogleOAuthPending();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildAuthRedirectUrl('/auth'),
          scopes: GOOGLE_WORKSPACE_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      clearPendingGoogleOAuth();
      console.error('Error connecting Google Workspace:', error);
      void trackFirebaseEvent('google_oauth_error', { scope: 'workspace' });
      toast({
        title: 'Error de conexión Google',
        description: error instanceof Error ? error.message : 'No se pudo abrir Google Workspace. Revisa OAuth en Supabase.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleOAuthCallback = useCallback(async () => {
    try {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(url.search);
      const hasOAuthPayload = Boolean(hashParams.get('access_token') || queryParams.get('code'));
      const authError =
        queryParams.get('error_description') ||
        queryParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (!hasOAuthPayload) {
        return false;
      }

      if (authError) {
        cleanAuthUrl(url);
        clearPendingGoogleOAuth();
        console.error('OAuth callback returned an auth error:', authError);
        return false;
      }

      if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
        const { error } = await supabase.auth.setSession({
          access_token: hashParams.get('access_token') as string,
          refresh_token: hashParams.get('refresh_token') as string,
        });

        if (error) {
          throw error;
        }
      }

      const authorizationCode = queryParams.get('code');
      if (authorizationCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authorizationCode);
        if (error) throw error;
      }

      const session = await waitForSession();
      cleanAuthUrl(url);
      clearPendingGoogleOAuth();

      if (!session) {
        console.error('OAuth callback completed, but no active Supabase session was found.');
        return false;
      }

      await persistGoogleIntegrations(session);
      void trackFirebaseEvent('google_oauth_complete', {
        scope: 'workspace',
        workspace_token: Boolean(session.provider_token),
      });

      toast({
        title: 'Google conectado',
        description: session.provider_token
          ? 'La sesión se inició y las integraciones de Google quedaron listas.'
          : 'La sesión se inició, pero Google no entregó permisos Workspace. Reconecta aceptando los permisos.',
      });

      return true;
    } catch (error) {
      clearPendingGoogleOAuth();
      console.error('Error handling OAuth callback:', error instanceof Error ? error.message : error);
      return false;
    }
  }, [toast]);

  return { connectGoogle, connectGoogleWorkspace, handleOAuthCallback };
};
