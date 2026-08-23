import { useState, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMapsBackground } from '@/components/GoogleMapsBackground';
import { CustomBackground } from './CustomBackground';
import { TaskOperator } from './TaskOperator';
import { DashboardHeader } from './DashboardHeader';
import { CommunicationArea } from './CommunicationArea';
import { IntegrationCenter } from './IntegrationCenter';
import { WallpaperSelector } from './WallpaperSelector';
import { FocusMissionMode } from './FocusMissionMode';
import { HistoryModal } from './HistoryModal';
import { ExitModal } from './ExitModal';
import { ProjectManagerModal } from './ProjectManagerModal';
import { DashboardNeonAtmosphere } from './DashboardNeonAtmosphere';
import AgentActivity from './AgentActivity';

import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

export const ProjectDashboard = () => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [dashboardScale, setDashboardScale] = useState(1);
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const userName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.user_metadata?.preferred_name
    || user?.email?.split('@')[0]
    || 'Operador';

  const handleOpenDocs = useCallback(() => {
    setIsProjectManagerOpen(true);
  }, []);

  const handleOpenSubscriptions = useCallback(() => {
    navigate('/suscripciones');
  }, [navigate]);

  const handleSettings = useCallback(() => {
    setIsWallpaperOpen(true);
    toast({ title: t('nav.settings'), description: t('toast.settings') });
  }, [toast, t]);

  const handleHistory = useCallback(() => {
    setIsHistoryOpen(true);
  }, []);

  const handleExit = useCallback(() => {
    setIsExitOpen(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    navigate('/landing');
  }, [navigate]);

  const handleOpenIntegrations = useCallback(() => setIsIntegrationsOpen(true), []);

  const handleFocusConsole = useCallback(() => {
    window.dispatchEvent(new CustomEvent('eq:focus-console'));
  }, []);

  useEffect(() => {
    const openIntegrations = () => setIsIntegrationsOpen(true);
    window.addEventListener('eq:open-integration-center', openIntegrations);
    return () => window.removeEventListener('eq:open-integration-center', openIntegrations);
  }, []);

  useEffect(() => {
    const zoomIn = () => setDashboardScale(value => Math.min(1.35, Number((value + 0.08).toFixed(2))));
    const zoomOut = () => setDashboardScale(value => Math.max(0.88, Number((value - 0.08).toFixed(2))));

    window.addEventListener('eq:response-zoom-in', zoomIn);
    window.addEventListener('eq:response-zoom-out', zoomOut);
    return () => {
      window.removeEventListener('eq:response-zoom-in', zoomIn);
      window.removeEventListener('eq:response-zoom-out', zoomOut);
    };
  }, []);

  return (
    <div
      className="h-screen w-full overflow-hidden relative"
      style={{
        '--dashboard-content-scale': dashboardScale,
        '--dashboard-header-height': '72px',
        '--dashboard-console-height': '228px',
        '--dashboard-console-gap': '10px',
        '--dashboard-sidebar-top': '72px',
        '--dashboard-sidebar-bottom': 'calc(var(--dashboard-console-height) + var(--dashboard-console-gap) + 24px)',
      } as CSSProperties}
    >
      <GoogleMapsBackground />
      <CustomBackground />
      <DashboardNeonAtmosphere />
      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
        <div className="eq-spectrum-frame h-full w-full" />
      </div>

      <motion.div
        animate={{ 
          opacity: isFocusMode ? 0 : 1,
          y: isFocusMode ? -20 : 0,
          pointerEvents: isFocusMode ? 'none' : 'auto'
        }}
        transition={{ duration: 0.3 }}
      >
        <DashboardHeader
          onOpenDocs={handleOpenDocs}
          onSettings={handleSettings}
          onHistory={handleHistory}
          onExit={handleExit}
          onOpenIntegrations={handleOpenIntegrations}
          onFocusConsole={handleFocusConsole}
          onOpenSubscriptions={handleOpenSubscriptions}
        />
      </motion.div>

      <motion.main 
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden"
        style={{
          top: 'var(--dashboard-header-height)',
        }}
        animate={{
          opacity: isFocusMode ? 0.3 : 1,
        }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-1 gap-4 px-4 overflow-hidden min-h-0">
          <div className="flex-1 min-w-0">
            <CommunicationArea onEnterFocusMode={() => setIsFocusMode(true)} />
          </div>
        </div>
      </motion.main>

      <TaskOperator />

      <FocusMissionMode 
        isActive={isFocusMode}
        onExit={() => setIsFocusMode(false)}
        onSettings={handleSettings}
      />

      <IntegrationCenter 
        isOpen={isIntegrationsOpen} 
        onClose={() => setIsIntegrationsOpen(false)} 
      />
      <WallpaperSelector 
        isOpen={isWallpaperOpen} 
        onClose={() => setIsWallpaperOpen(false)} 
      />
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
      <ExitModal 
        isOpen={isExitOpen} 
        onClose={() => setIsExitOpen(false)} 
        onConfirmExit={handleConfirmExit}
      />
      <ProjectManagerModal 
        isOpen={isProjectManagerOpen} 
        onClose={() => setIsProjectManagerOpen(false)} 
      />
      <AgentActivity />
    </div>
  );
};
