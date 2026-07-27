import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, LogOut, Search, ZoomIn, ZoomOut, Crown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, getLanguageName, type Language } from '@/hooks/useLanguage';
import { HEADER_UI_COPY } from './dashboardI18n';

interface DashboardHeaderProps {
  onOpenDocs?: () => void;
  onSettings?: () => void;
  onHistory?: () => void;
  onExit?: () => void;
  onOpenIntegrations?: () => void;
  onFocusConsole?: () => void;
  onOpenSubscriptions?: () => void;
}

export const DashboardHeader = ({
  onOpenDocs,
  onSettings,
  onHistory,
  onExit,
  onOpenIntegrations,
  onFocusConsole,
  onOpenSubscriptions,
}: DashboardHeaderProps = {}) => {
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const headerCopy = HEADER_UI_COPY[language];

  const languageOptions: Array<{ code: Language; flag: string }> = [
    { code: 'EN', flag: '🇺🇸' },
    { code: 'ES', flag: '🇪🇸' },
    { code: 'PT', flag: '🇧🇷' },
    { code: 'FR', flag: '🇫🇷' },
    { code: 'DE', flag: '🇩🇪' },
    { code: 'IT', flag: '🇮🇹' },
    { code: 'PL', flag: '🇵🇱' },
    { code: 'NL', flag: '🇳🇱' },
  ];

  const activeLanguage = languageOptions.find((option) => option.code === language) || languageOptions[0];

  return (
    <motion.header
      className="dashboard-neon-surface fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b border-cyan-400/20 bg-black/65 px-6"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-2xl font-display font-bold tracking-tighter text-transparent">
            eQuityLabs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm gap-1.5 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-50"
            onClick={onOpenSubscriptions}
          >
            <Crown className="w-4 h-4" />
            {headerCopy.subscriptions}
          </Button>
          <Button variant="ghost" size="sm" className="text-sm" onClick={onOpenDocs}>
            {t('nav.docs')}
          </Button>
          <Button variant="ghost" size="sm" className="text-sm" onClick={onSettings}>
            {t('nav.settings')}
          </Button>
          <Button variant="ghost" size="sm" className="text-sm" onClick={onHistory}>
            {t('nav.history')}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-black/35 px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-cyan-100/80 hover:bg-cyan-400/10 hover:text-cyan-50"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('eq:open-task-panel'));
                onFocusConsole?.();
              }}
              title={headerCopy.openRoadmap}
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-cyan-100/80 hover:bg-cyan-400/10 hover:text-cyan-50"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('eq:response-zoom-in'));
                window.dispatchEvent(new CustomEvent('eq:task-panel-zoom-in'));
              }}
              title={headerCopy.zoomIn}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-cyan-100/80 hover:bg-cyan-400/10 hover:text-cyan-50"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('eq:response-zoom-out'));
                window.dispatchEvent(new CustomEvent('eq:task-panel-zoom-out'));
              }}
              title={headerCopy.zoomOut}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onOpenIntegrations}
            title={t('nav.integrations')}
          >
            <Link2 className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onExit} title={t('nav.exit')}>
            <LogOut className="w-5 h-5" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLangOpen((open) => !open)}
              className="h-9 gap-2 rounded-full border border-cyan-400/30 bg-black/35 px-3 text-xs text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50"
            >
              <span className="text-base leading-none">{activeLanguage.flag}</span>
              <span className="font-medium">{getLanguageName(language)}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>

            <AnimatePresence>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-11 z-50 min-w-40 overflow-hidden rounded-xl border border-cyan-400/25 bg-black/95 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-xl"
                  >
                    {languageOptions.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => {
                          setLanguage(option.code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-cyan-400/10 ${
                          language === option.code ? 'text-cyan-200' : 'text-white/75'
                        }`}
                      >
                        <span className="text-base leading-none">{option.flag}</span>
                        <span className="font-medium">{getLanguageName(option.code)}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-xs font-bold">
            P
          </div>
        </div>
      </div>
    </motion.header>
  );
};

