import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, ArrowRight, BrainCircuit, Building2, Crown, Globe, Target, Zap, Sparkles, Shield, Rocket, Star, Swords, Gem
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type PlanKey = 'FREE' | 'TACTICAL' | 'PREMIUM' | 'MASTERMIND' | 'ENTERPRISE' | 'ALLIANCE';

type PlanDef = {
  key: PlanKey;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  icon: LucideIcon;
  spotlight?: boolean;
  features: string[];
  ctaLabel: string;
  checkoutUrl?: string;
  infoRoute?: string;
  badge?: string;
};

const plans: PlanDef[] = [
  {
    key: 'FREE', name: 'Free Trial',
    price: '$0', cadence: '30 days',
    tagline: 'Explore + Define Strategic Direction',
    icon: Zap,
    features: [
      'Basic code generation',
      'Simple debugging',
      'Limited to small projects',
      'Multi-agent collaboration on a single objective',
      'Strategic North definition',
      'Final roadmap delivery (clear next steps, not just prompts)',
    ],
    ctaLabel: 'Start Free Trial',
    badge: 'EVALUATE',
  },
  {
    key: 'TACTICAL', name: 'Tactical',
    price: '$25', cadence: '/month',
    tagline: 'Speed + Real Results',
    icon: Target, spotlight: true,
    features: [
      'Everything in Free Trial',
      'Optimized code and functional prototypes',
      'API integrations',
      'Automated testing (core coverage)',
      'Ethical and privacy checks',
      'Up to 3 concurrent projects',
      'Priority access to high-performance models',
      'Priority technical support',
    ],
    ctaLabel: 'Go Tactical',
    badge: 'POPULAR',
  },
  {
    key: 'PREMIUM', name: 'Premium',
    price: '$50', cadence: '/month',
    tagline: 'Scalability + Professional Quality',
    icon: Shield,
    features: [
      'Everything in Tactical',
      'Advanced scalability & performance (NVIDIA infra)',
      'Comprehensive automated testing + edge-cases',
      'Complex multi-API integrations',
      'Architecture review & best-practice enforcement',
      'Up to 8 concurrent projects',
      'Senior agent supervision',
      'Weekly technical progress reports',
      'Early access to new agent capabilities',
    ],
    ctaLabel: 'Go Premium',
    badge: 'MOST POWERFUL',
  },
  {
    key: 'MASTERMIND', name: 'Mastermind',
    price: '$100', cadence: '/month',
    tagline: 'Corporate-Grade + Maximum Control',
    icon: Crown,
    features: [
      'Everything in Premium',
      'High-level software architecture design',
      'Extreme performance optimization',
      'Full automated testing + CI/CD readiness',
      'Enterprise-level security, ethics & privacy',
      'Unlimited projects (fair use)',
      'Dedicated Mastermind agent (24/7 co-pilot)',
      'Monthly architecture sessions',
      'Maximum resource & model priority',
      'Professional technical documentation',
      'Direct support from EquityLabs team',
    ],
    ctaLabel: 'Go Mastermind',
    badge: 'ELITE',
  },
  {
    key: 'ENTERPRISE', name: 'Enterprise',
    price: '$600', cadence: '/month',
    tagline: 'Full Organizational Implementation',
    icon: Building2,
    features: [
      'Everything in Mastermind',
      'Complete 15-day technical implementation',
      'Dedicated technical team assignment',
      'Multi-agent execution across departments',
      'Content generation + lead seeding from day one',
      'Controlled database access',
      'Brand relaunch support',
      'Custom workspace activation',
      'Full Google Workspace, WhatsApp & internal tools',
      'Role-based access control & security protocols',
      'Executive progress dashboard',
      'Priority SLA & dedicated account management',
    ],
    ctaLabel: 'Contact Sales',
    badge: 'ORGANIZATION',
  },
  {
    key: 'ALLIANCE', name: 'Alliance',
    price: '$1K', cadence: '/year',
    tagline: 'Strategic Partnership + Brand Expansion',
    icon: Globe,
    features: [
      'Everything in Enterprise',
      'Official white-label / co-branding rights',
      'Revenue share on referred clients',
      'Resell with significant margins',
      'Co-selling & joint business development',
      'Co-branded marketing campaigns & events',
      'Dedicated partner success manager',
      'Priority access to new capabilities & models',
      'Strategic expansion support (regional or global)',
    ],
    ctaLabel: 'Become Partner',
    badge: 'PARTNER',
  },
];

const persist = (plan: PlanDef) => localStorage.setItem('eq_subscription_context', JSON.stringify({
  key: plan.key, name: plan.name, price: plan.price, selectedAt: new Date().toISOString(),
}));

const Suscripciones = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(3);

  useEffect(() => {
    const q = window.matchMedia('(max-width: 767px)');
    const s = () => setVis(q.matches ? 1 : 3);
    s(); q.addEventListener('change', s);
    return () => q.removeEventListener('change', s);
  }, []);

  const maxI = Math.max(0, plans.length - vis);
  const visible = useMemo(() => plans.slice(idx, idx + vis), [idx, vis]);
  const pages = useMemo(() => [...new Set(Array.from({ length: Math.ceil(plans.length / vis) }, (_, i) => Math.min(i * vis, maxI)))], [maxI, vis]);

  useEffect(() => setIdx(v => Math.min(v, maxI)), [maxI]);

  const handleSelect = async (plan: PlanDef) => {
    try {
      setLoading(plan.key);
      persist(plan);
      if (plan.infoRoute) { toast.success(`Opening ${plan.name} info.`); navigate(plan.infoRoute); return; }
      if (!isAuthenticated || !user) { navigate('/auth'); return; }
      if (plan.key === 'FREE') {
        const { error } = await supabase.from('user_planes' as never).upsert({
          user_id: user.id, plan: plan.key, status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30*86400000).toISOString(),
        } as never, { onConflict: 'user_id' });
        if (error) { toast.error('Could not save plan.'); return; }
        setSubmitted(plan.key);
        toast.success('Free Trial activated for 30 days! 🎉');
        navigate('/');
        return;
      }
      if (!plan.checkoutUrl) { toast.error(`Stripe link missing for ${plan.name}.`); return; }
      window.location.assign(plan.checkoutUrl);
    } finally { setLoading(null); }
  };

  const accentFor = (key: PlanKey, spotlight?: boolean) => {
    const map: Record<PlanKey, { border: string; glow: string; badge: string; dot: string; btn: string }> = {
      FREE: { border: 'border-[#00d2ff]', glow: 'shadow-[8px_8px_0px_0px_#00d2ff]', badge: 'from-[#00d2ff] to-[#7b2ff7]', dot: 'bg-[#00d2ff]', btn: 'bg-white text-black border-[#00d2ff] shadow-[4px_4px_0px_0px_#00d2ff] hover:shadow-[6px_6px_0px_0px_#00d2ff]' },
      TACTICAL: { border: 'border-[#7b2ff7]', glow: 'shadow-[8px_8px_0px_0px_#7b2ff7]', badge: 'from-[#7b2ff7] to-[#ff007f]', dot: 'bg-[#7b2ff7]', btn: 'bg-white text-black border-[#7b2ff7] shadow-[4px_4px_0px_0px_#7b2ff7] hover:shadow-[6px_6px_0px_0px_#7b2ff7]' },
      PREMIUM: { border: 'border-[#ff007f]', glow: 'shadow-[10px_10px_0px_0px_#ff007f]', badge: 'from-[#00d2ff] to-[#ff007f]', dot: 'bg-[#ff007f]', btn: 'bg-gradient-to-r from-[#00d2ff] via-[#8a2be2] to-[#ff007f] text-white border-white shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[6px_6px_0px_0px_#ffffff]' },
      MASTERMIND: { border: 'border-[#ff007f]', glow: 'shadow-[8px_8px_0px_0px_#ff007f]', badge: 'from-[#ff007f] to-[#00d2ff]', dot: 'bg-[#ff007f]', btn: 'bg-white text-black border-[#ff007f] shadow-[4px_4px_0px_0px_#ff007f] hover:shadow-[6px_6px_0px_0px_#ff007f]' },
      ENTERPRISE: { border: 'border-[#00d2ff]', glow: 'shadow-[8px_8px_0px_0px_#00d2ff]', badge: 'from-[#00d2ff] to-[#7b2ff7]', dot: 'bg-[#00d2ff]', btn: 'bg-white text-black border-[#00d2ff] shadow-[4px_4px_0px_0px_#00d2ff] hover:shadow-[6px_6px_0px_0px_#00d2ff]' },
      ALLIANCE: { border: 'border-[#7b2ff7]', glow: 'shadow-[8px_8px_0px_0px_#7b2ff7]', badge: 'from-[#7b2ff7] to-[#00d2ff]', dot: 'bg-[#7b2ff7]', btn: 'bg-white text-black border-[#7b2ff7] shadow-[4px_4px_0px_0px_#7b2ff7] hover:shadow-[6px_6px_0px_0px_#7b2ff7]' },
    };
    const a = map[key];
    if (spotlight) {
      a.glow = a.glow.replace('8px_8px', '10px_10px');
    }
    return a;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0a1d] text-white font-display">
      {/* ─── Background ─── */}
      <div className="fixed inset-0">
        <img src="/slides/leather-bg.jpg" alt="" aria-hidden className="h-full w-full object-cover opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a1d]/85 via-[#0c0a1d]/95 to-[#0c0a1d]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent bg-[length:200%_100%] animate-[sweep_12s_ease-in-out_infinite] pointer-events-none" />
      </div>

      <div className="relative z-10">
        {/* ─── Header ─── */}
        <section className="border-b-2 border-[#00d2ff]/15">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <button onClick={() => navigate('/landing')}
              className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-5 py-2.5 rounded-lg border-2 border-[#00d2ff] shadow-[3px_3px_0px_0px_#00d2ff] hover:shadow-[1px_1px_0px_0px_#00d2ff] active:shadow-none transition-all">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
              className="inline-flex items-center gap-2 bg-[#ff007f] text-white font-bold text-sm px-5 py-2.5 rounded-lg border-2 border-white shadow-[3px_3px_0px_0px_#ff007f] hover:shadow-[1px_1px_0px_0px_#ff007f] active:shadow-none transition-all">
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* ─── Title ─── */}
        <section className="mx-auto max-w-[70rem] px-4 pt-10 pb-2 text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="text-white">CHOOSE YOUR</span>{' '}
            <span className="text-[#00d2ff]">PLAN</span>
          </h1>
          <p className="mt-3 text-xs text-white/40 font-bold uppercase tracking-widest bg-[#ff007f]/8 inline-block px-4 py-1.5 rounded-full border border-[#ff007f]/20">
            Warhol Pop-Art Edition
          </p>
        </section>

        {/* ─── Cards ─── */}
        <section className="mx-auto max-w-[70rem] px-4 pb-10 pt-6">
          <div className="relative">
            <button onClick={() => setIdx(v => Math.max(0, v - vis))} disabled={idx <= 0}
              className="group absolute left-0 top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#00d2ff] bg-black/50 text-[#00d2ff] shadow-[3px_3px_0px_0px_#00d2ff] hover:shadow-[1px_1px_0px_0px_#00d2ff] disabled:opacity-20 disabled:cursor-not-allowed transition-all md:-left-5"
              aria-label="Previous">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setIdx(v => Math.min(maxI, v + vis))} disabled={idx >= maxI}
              className="group absolute right-0 top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#ff007f] bg-black/50 text-[#ff007f] shadow-[3px_3px_0px_0px_#ff007f] hover:shadow-[1px_1px_0px_0px_#ff007f] disabled:opacity-20 disabled:cursor-not-allowed transition-all md:-right-5"
              aria-label="Next">
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="grid gap-6 md:grid-cols-3">
              {visible.map((plan) => {
                const Icon = plan.icon;
                const a = accentFor(plan.key, plan.spotlight);
                const isSub = submitted === plan.key;

                return (
                  <motion.article
                    key={plan.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`relative bg-[#120e2e] rounded-2xl p-6 border-2 ${a.border} ${a.glow} transition-all duration-300 hover:-translate-y-1 ${plan.spotlight ? 'scale-[1.02]' : ''}`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className={`absolute -top-4 right-4 bg-gradient-to-r ${a.badge} text-white font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full border-2 border-white shadow-md`}>
                        {plan.badge}
                      </div>
                    )}

                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`rounded-xl bg-gradient-to-br ${a.badge} p-[2px]`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#120e2e]">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{plan.name}</h2>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3 p-4 rounded-xl bg-gradient-to-r from-[#ff007f]/10 to-[#00d2ff]/10 border-2 border-[#ff007f]">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-5xl font-black text-white">{plan.price}</span>
                          <span className="text-white/40 font-bold ml-1 text-sm">{plan.cadence}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-[#00d2ff]" />
                        </div>
                      </div>
                      <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest mt-2">{plan.tagline}</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5 mb-6 max-h-48 overflow-y-auto scrollbar-thin">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className={`flex-shrink-0 w-4 h-4 rounded-full ${a.dot} text-black font-black flex items-center justify-center text-[9px] mt-0.5`}>✓</span>
                          <span className={`text-sm font-medium ${i === 0 ? 'text-[#ff007f] font-bold' : 'text-white/80'}`}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button onClick={() => handleSelect(plan)} disabled={loading === plan.key}
                      className={`w-full py-3.5 font-black text-sm uppercase tracking-wider rounded-xl border-2 transition-all duration-200 ${a.btn} ${loading === plan.key ? 'opacity-60' : ''} active:translate-x-[0px] active:translate-y-[0px] active:shadow-none`}>
                      {loading === plan.key ? 'Processing...' : isSub ? '✓ Active' : plan.ctaLabel}
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </div>

          {/* ─── Dots ─── */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {pages.map((p, i) => (
              <button key={p} onClick={() => setIdx(p)}
                className={`rounded-full transition-all duration-300 border-2 ${
                  idx === p
                    ? 'w-10 h-3 bg-[#00d2ff] border-[#00d2ff] shadow-[2px_2px_0px_0px_#ff007f]'
                    : 'w-3 h-3 bg-transparent border-white/20 hover:border-white/50'
                }`}
                aria-label={`Page ${i + 1}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Suscripciones;