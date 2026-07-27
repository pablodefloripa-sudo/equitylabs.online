import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Building2,
  Crown,
  Globe,
  Target,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type SubscriptionPlanKey =
  | 'FREE_30_DAYS'
  | 'TACTICAL_25'
  | 'PREMIUM_50'
  | 'MASTERMIND_100'
  | 'ENTERPRISE_500'
  | 'ALLIANCE_1000';

type PlanDefinition = {
  key: SubscriptionPlanKey;
  tier: string;
  displayPlan: string;
  name: string;
  price: string;
  cadence: string;
  agentLimit: string;
  summary: string;
  badge: string;
  accent: string;
  icon: LucideIcon;
  checkoutUrl?: string;
  spotlight?: boolean;
  features: string[];
  ctaLabel: string;
  infoRoute?: string;
};

type UserPlanPayload = {
  user_id: string;
  plan: SubscriptionPlanKey;
  status: 'active' | 'requested';
  start_date: string;
  end_date: string | null;
};

const plans: PlanDefinition[] = [
  {
    key: 'FREE_30_DAYS',
    tier: 'FREE',
    displayPlan: 'FREE',
    name: 'Trial operativo',
    price: '$0',
    cadence: '30 dias',
    agentLimit: '3',
    summary: 'Entrada simple para validar el sistema y empezar a usar agentes.',
    badge: 'Start',
    accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    icon: Zap,
    ctaLabel: 'Activar trial',
    features: [
      '3 agentes activos',
      'Chat operativo',
      'Primer documento de trabajo',
      'Acceso inmediato al dashboard',
    ],
  },
  {
    key: 'TACTICAL_25',
    tier: 'TACTICAL',
    displayPlan: '$25 USD',
    name: 'Tactical',
    price: '$25',
    cadence: '/mes',
    agentLimit: '5',
    summary: 'Para ejecucion frecuente con mas capacidad diaria.',
    badge: 'Lean',
    accent: 'from-cyan-400 via-sky-400 to-blue-500',
    icon: Target,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_TACTICAL,
    ctaLabel: 'Ir a Stripe',
    features: [
      '5 agentes activos',
      'Mas capacidad de ejecucion',
      'Routing mejorado',
      'Uso semanal sostenido',
    ],
  },
  {
    key: 'PREMIUM_50',
    tier: 'PREMIUM',
    displayPlan: '$50 USD',
    name: 'Premium',
    price: '$50',
    cadence: '/mes',
    agentLimit: '6',
    summary: 'Plan principal para trabajo serio y continuo.',
    badge: 'Core',
    accent: 'from-fuchsia-400 via-violet-400 to-cyan-400',
    icon: BrainCircuit,
    spotlight: true,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_PREMIUM,
    ctaLabel: 'Ir a Stripe',
    features: [
      '6 agentes activos',
      'Capa principal de trabajo',
      'Mejor calidad de salida',
      'Integraciones bajo demanda',
    ],
  },
  {
    key: 'MASTERMIND_100',
    tier: 'MASTERMIND',
    displayPlan: '$100 USD',
    name: 'Mastermind',
    price: '$100',
    cadence: '/mes',
    agentLimit: '8',
    summary: 'Para razonamiento avanzado y operaciones mas pesadas.',
    badge: 'Advanced',
    accent: 'from-amber-300 via-orange-400 to-rose-400',
    icon: Crown,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_MASTERMIND,
    ctaLabel: 'Ir a Stripe',
    features: [
      '8 agentes activos',
      'Mas profundidad operativa',
      'Mayor margen de iteracion',
      'Trabajo estrategico continuo',
    ],
  },
  {
    key: 'ENTERPRISE_500',
    tier: 'ENTERPRISE',
    displayPlan: '$500 USD',
    name: 'Enterprise',
    price: '$500',
    cadence: '/mes',
    agentLimit: '8',
    summary: 'Placeholder comercial para una futura ventana enterprise.',
    badge: 'Scale',
    accent: 'from-slate-200 via-cyan-300 to-sky-500',
    icon: Building2,
    ctaLabel: 'More info',
    infoRoute: '/business-builder',
    features: [
      'Escala operativa',
      'Equipos internos',
      'Automatizacion futura',
      'Ventana enterprise futura',
    ],
  },
  {
    key: 'ALLIANCE_1000',
    tier: 'ALLIANCE',
    displayPlan: '$1000 USD',
    name: 'Alliance',
    price: '$1000',
    cadence: '/mes',
    agentLimit: '8+',
    summary: 'Placeholder comercial para acuerdos y alianzas futuras.',
    badge: 'Partner',
    accent: 'from-emerald-300 via-lime-300 to-cyan-300',
    icon: Globe,
    ctaLabel: 'More info',
    infoRoute: '/diagnostico',
    features: [
      'Clientes estrategicos',
      'Acuerdos especiales',
      'Expansion futura',
      'Ventana partner futura',
    ],
  },
];

const accentGlow: Record<SubscriptionPlanKey, string> = {
  FREE_30_DAYS: 'shadow-[0_0_45px_rgba(16,185,129,0.18)]',
  TACTICAL_25: 'shadow-[0_0_45px_rgba(56,189,248,0.18)]',
  PREMIUM_50: 'shadow-[0_0_55px_rgba(217,70,239,0.22)]',
  MASTERMIND_100: 'shadow-[0_0_45px_rgba(251,146,60,0.18)]',
  ENTERPRISE_500: 'shadow-[0_0_45px_rgba(148,163,184,0.18)]',
  ALLIANCE_1000: 'shadow-[0_0_45px_rgba(132,204,22,0.18)]',
};

const persistSubscriptionContext = (plan: PlanDefinition) => {
  localStorage.setItem(
    'eq_subscription_context',
    JSON.stringify({
      key: plan.key,
      tier: plan.tier,
      displayPlan: plan.displayPlan,
      agentLimit: plan.agentLimit,
      selectedAt: new Date().toISOString(),
    }),
  );
};

const Suscripciones = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [submittedPlan, setSubmittedPlan] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const syncVisibleCount = () => setVisibleCount(query.matches ? 1 : 3);

    syncVisibleCount();
    query.addEventListener('change', syncVisibleCount);
    return () => query.removeEventListener('change', syncVisibleCount);
  }, []);

  const maxCarouselIndex = Math.max(0, plans.length - visibleCount);
  const visiblePlans = useMemo(() => plans.slice(carouselIndex, carouselIndex + visibleCount), [carouselIndex, visibleCount]);
  const canGoBack = carouselIndex > 0;
  const canGoForward = carouselIndex < maxCarouselIndex;
  const pageStarts = useMemo(() => {
    const starts: number[] = [];
    for (let index = 0; index < plans.length; index += visibleCount) {
      starts.push(Math.min(index, maxCarouselIndex));
    }
    return [...new Set(starts)];
  }, [maxCarouselIndex, visibleCount]);

  useEffect(() => {
    setCarouselIndex((value) => Math.min(value, maxCarouselIndex));
  }, [maxCarouselIndex]);

  const handleSelectPlan = async (plan: PlanDefinition) => {
    try {
      setLoading(plan.key);
      persistSubscriptionContext(plan);

      if (plan.infoRoute) {
        toast.success(`Abriendo mas informacion sobre ${plan.name}.`);
        navigate(plan.infoRoute);
        return;
      }

      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);

      if (plan.key === 'FREE_30_DAYS') {
        endDate.setDate(endDate.getDate() + 30);
      }

      const planPayload: UserPlanPayload = {
        user_id: user.id,
        plan: plan.key,
        status: plan.key === 'FREE_30_DAYS' ? 'active' : 'requested',
        start_date: startDate.toISOString(),
        end_date: plan.key === 'FREE_30_DAYS' ? endDate.toISOString() : null,
      };

      const { error } = await supabase
        .from('user_planes' as never)
        .upsert(planPayload as never, { onConflict: 'user_id' });

      if (error) {
        toast.error('No pudimos guardar la seleccion del plan.');
        return;
      }

      setSubmittedPlan(plan.key);

      if (plan.key === 'FREE_30_DAYS') {
        toast.success('Trial operativo activado por 30 dias.');
        navigate('/');
        return;
      }

      if (!plan.checkoutUrl) {
        toast.error(`Falta configurar el link de Stripe para ${plan.name}.`);
        return;
      }

      toast.success(`Redirigiendo a Stripe para ${plan.name}.`);
      window.location.assign(plan.checkoutUrl);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0">
        <img src="/slides/base.jpg" alt="" aria-hidden className="h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.82),rgba(2,6,23,0.96))]" />
        <div className="subscription-float subscription-float-a" />
        <div className="subscription-float subscription-float-b" />
        <div className="subscription-float subscription-float-c" />
      </div>

      <div className="relative z-10">
        <section className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <button
              onClick={() => navigate('/landing')}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-black/35 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al landing
            </button>

            <button
              onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              {isAuthenticated ? 'Abrir dashboard' : 'Iniciar sesion'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-[64rem] px-4 pb-10 pt-5 sm:px-6 md:pt-8 xl:max-w-[70rem]">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCarouselIndex((value) => Math.max(0, value - visibleCount))}
              disabled={!canGoBack}
              className="group absolute left-0 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/30 bg-black/55 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:border-cyan-200 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-30 md:-left-5"
              aria-label="Mostrar planes anteriores"
            >
              <ArrowLeft className="h-5 w-5 transition group-hover:-translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setCarouselIndex((value) => Math.min(maxCarouselIndex, value + visibleCount))}
              disabled={!canGoForward}
              className="group absolute right-0 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-400/30 bg-black/55 text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.18)] transition hover:border-fuchsia-200 hover:bg-fuchsia-400/12 disabled:cursor-not-allowed disabled:opacity-30 md:-right-5"
              aria-label="Mostrar siguientes planes"
            >
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </button>

            <div className="grid gap-4 md:grid-cols-3">
            {visiblePlans.map((plan) => {
              const Icon = plan.icon;
              const isSubmitted = submittedPlan === plan.key;

              return (
                <article
                  key={plan.key}
                  className={[
                    'subscription-card-float relative min-h-[21.5rem] overflow-hidden rounded-[18px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl transition duration-300 sm:p-5',
                    'subscription-shimmer-border',
                    plan.spotlight ? 'scale-[1.015] border-fuchsia-300/25 bg-[linear-gradient(180deg,rgba(20,20,40,0.88),rgba(8,10,18,0.94))]' : '',
                    accentGlow[plan.key] || '',
                  ].join(' ')}
                >
                  <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${plan.accent}`} />
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${plan.accent} opacity-[0.045]`} />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">{plan.displayPlan}</p>
                      <h3 className="mt-2 text-2xl font-semibold leading-none text-cyan-200">{plan.name}</h3>
                      <p className="mt-3 text-[12px] font-medium leading-5 text-white/78">{plan.summary}</p>
                    </div>

                    <div className={`rounded-2xl bg-gradient-to-br p-[1px] ${plan.accent}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-semibold text-cyan-200">{plan.agentLimit}</span>
                    <span className="pb-1 text-xs font-semibold text-amber-200">agentes</span>
                    <span className="ml-auto pb-1 text-xs font-semibold text-white/82">
                      {plan.price} {plan.cadence}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {plan.badge}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {plan.tier}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-[12px] font-semibold leading-5 text-white/88">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loading === plan.key}
                    className={[
                      'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold transition',
                      plan.spotlight
                        ? 'border-fuchsia-400/50 bg-fuchsia-400/14 text-white hover:bg-fuchsia-400/18'
                        : 'border-cyan-400/35 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/16',
                      loading === plan.key ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    {loading === plan.key
                      ? 'Guardando...'
                      : isSubmitted
                        ? 'Solicitud guardada'
                        : plan.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {pageStarts.map((start, pageIndex) => (
              <button
                key={start}
                type="button"
                onClick={() => setCarouselIndex(start)}
                className={[
                  'h-2.5 rounded-full transition-all duration-300',
                  carouselIndex === start ? 'w-10 bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.75)]' : 'w-2.5 bg-white/25 hover:bg-white/45',
                ].join(' ')}
                aria-label={`Ir al grupo ${pageIndex + 1} de planes`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Suscripciones;
