import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { User, Session } from '@supabase/supabase-js';
import { buildAuthRedirectUrl } from '@/lib/auth-redirect';
import { saveUserMirror, setFirebaseAnalyticsUser, trackFirebaseEvent } from '@/integrations/firebase';
import { FREE_PLAN_KEY, normalizeSubscriptionPlan, type SubscriptionPlanKey } from '@/lib/subscription-plans';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  subscriptionPlan: SubscriptionPlanKey;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
}

const DEFAULT_SUBSCRIPTION = {
  subscriptionPlan: FREE_PLAN_KEY,
  subscriptionStatus: 'active',
  subscriptionEndDate: null as string | null,
};

const readSubscriptionState = async (userId: string) => {
  const { data: planRow } = await supabase
    .from('user_planes')
    .select('plan, status, end_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (planRow?.plan) {
    return {
      subscriptionPlan: normalizeSubscriptionPlan(planRow.plan),
      subscriptionStatus: planRow.status || 'active',
      subscriptionEndDate: planRow.end_date || null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    ...DEFAULT_SUBSCRIPTION,
    subscriptionPlan: normalizeSubscriptionPlan(profile?.plan_type),
  };
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    ...DEFAULT_SUBSCRIPTION,
  });

  const syncFirebaseMirror = useCallback(async (session: Session | null) => {
    const user = session?.user ?? null;
    if (!user) {
      void setFirebaseAnalyticsUser(null);
      return;
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const fullName =
      (typeof metadata?.full_name === 'string' && metadata.full_name) ||
      (typeof metadata?.name === 'string' && metadata.name) ||
      (typeof metadata?.preferred_name === 'string' && metadata.preferred_name) ||
      null;
    const provider =
      (typeof user.app_metadata?.provider === 'string' && user.app_metadata.provider) ||
      (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers[0]) ||
      null;

    void setFirebaseAnalyticsUser(user.id);
    void saveUserMirror({
      userId: user.id,
      email: user.email || null,
      fullName,
      provider,
      lastLoginAt: user.last_sign_in_at || new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const applySession = async (session: Session | null) => {
      if (!isMounted) return;

      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        ...DEFAULT_SUBSCRIPTION,
      });
      void syncFirebaseMirror(session);

      if (!session?.user?.id) return;

      try {
        const subscription = await readSubscriptionState(session.user.id);
        if (!isMounted) return;
        setAuthState(current => ({
          ...current,
          ...subscription,
        }));
      } catch (error) {
        console.warn('[EquityLabs] Could not load subscription plan:', error);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void applySession(session);
      }
    );

    // Then read the initial session state.
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await applySession(session);
    };

    init();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncFirebaseMirror]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    void trackFirebaseEvent('auth_sign_in_email', { method: 'password' });
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildAuthRedirectUrl('/auth'),
      },
    });
    if (error) throw error;
    void trackFirebaseEvent('auth_sign_up_email', { method: 'password' });
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    void trackFirebaseEvent('auth_sign_out');
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated: !!authState.session,
    subscriptionPlan: authState.subscriptionPlan,
    subscriptionStatus: authState.subscriptionStatus,
    subscriptionEndDate: authState.subscriptionEndDate,
    signIn,
    signUp,
    signOut,
  };
};
