import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Zap, Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentI18n, type Agent } from '@/hooks/useAgentI18n';
import { getAgentIcon } from './agentMeta';
import { planMeetsMinimum, type SubscriptionPlanKey } from '@/lib/subscription-plans';

interface BunkerModalProps {
  agent: Agent | null;
  subscriptionPlan: SubscriptionPlanKey;
  isOpen: boolean;
  onClose: () => void;
}

export const BunkerModal = ({ agent, subscriptionPlan, isOpen, onClose }: BunkerModalProps) => {
  const [engine, setEngine] = useState<'free' | 'pro'>('free');
  const { t, getAgentName, getAgentTasks, getEngine } = useAgentI18n();
  const navigate = useNavigate();

  if (!agent) return null;

  const tasks = getAgentTasks(agent);
  const name = getAgentName(agent);
  const IconComponent = getAgentIcon(agent.id);
  const activeEngine = getEngine(agent, engine);
  const canUsePro = planMeetsMinimum(subscriptionPlan, 'TACTICAL_25');
  const needsUpgrade = engine === 'pro' && !canUsePro;
  const goToUpgrade = () => {
    onClose();
    navigate('/suscripciones');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent overflow-hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(222 47% 8% / 0.95), hsl(222 47% 4% / 0.98))',
            backdropFilter: 'blur(40px)',
            border: engine === 'pro'
              ? '1px solid hsl(280 100% 60% / 0.5)'
              : '1px solid hsl(210 100% 50% / 0.3)',
            boxShadow: engine === 'pro'
              ? '0 0 40px hsl(280 100% 60% / 0.2), inset 0 0 60px hsl(280 100% 60% / 0.05)'
              : '0 0 30px hsl(210 100% 50% / 0.15), inset 0 0 40px hsl(210 100% 50% / 0.03)',
          }}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: engine === 'pro'
                      ? 'linear-gradient(135deg, hsl(280 100% 60% / 0.3), hsl(320 100% 50% / 0.2))'
                      : 'linear-gradient(135deg, hsl(210 100% 50% / 0.2), hsl(180 100% 50% / 0.1))',
                    border: `1px solid ${engine === 'pro' ? 'hsl(280 100% 60% / 0.4)' : 'hsl(210 100% 50% / 0.3)'}`,
                  }}
                >
                  <IconComponent className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle
                    className="text-xl tracking-wider text-foreground"
                    style={{ fontFamily: "'Syncopate', 'Space Grotesk', sans-serif" }}
                  >
                    {name}
                  </DialogTitle>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {t('modal.active_engine')}: <span className={engine === 'pro' ? 'text-accent' : 'text-primary'}>{activeEngine}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Engine Toggle */}
          <div className="px-6 pb-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3">
              {t('modal.engine')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEngine('free')}
                className={`flex-1 py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider transition-all duration-300 ${
                  engine === 'free'
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/30 text-muted-foreground/50 border border-border/20 hover:border-primary/20'
                }`}
                style={engine === 'free' ? { boxShadow: '0 0 20px hsl(180 100% 50% / 0.2)' } : {}}
              >
                <Zap className="w-4 h-4 inline mr-1.5" />
                {t('modal.free')}
              </button>
              <button
                onClick={() => setEngine('pro')}
                className={`flex-1 py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider transition-all duration-300 ${
                  engine === 'pro'
                    ? 'bg-accent/20 text-accent border border-accent/50'
                    : 'bg-muted/30 text-muted-foreground/50 border border-border/20 hover:border-accent/20'
                }`}
                style={engine === 'pro' ? { boxShadow: '0 0 20px hsl(280 100% 60% / 0.3)' } : {}}
              >
                {canUsePro ? <Shield className="w-4 h-4 inline mr-1.5" /> : <Lock className="w-4 h-4 inline mr-1.5" />}
                {t('modal.pro')}
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="px-6 pb-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3">
              {t('modal.tasks')}
            </p>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
                >
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground/80">{task}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          <AnimatePresence>
            {needsUpgrade && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <button
                    onClick={goToUpgrade}
                    className="w-full py-3 rounded-xl font-mono text-sm font-bold tracking-widest transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, hsl(280 100% 60%), hsl(320 100% 50%))',
                      color: 'white',
                      boxShadow: '0 0 30px hsl(280 100% 60% / 0.4)',
                    }}
                  >
                    <Lock className="w-4 h-4 inline mr-2" />
                    {t('modal.upgrade')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
