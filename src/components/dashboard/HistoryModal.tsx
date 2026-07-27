import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientArchivePanel } from './ClientArchivePanel';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal = ({ isOpen, onClose }: HistoryModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 modal-cyber mx-4 flex h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-cyan-400/15 p-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/65">Historial unificado</p>
                <h2 className="mt-1 text-sm font-semibold text-cyan-50">Cliente, sesiones y documentos en una sola vista</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1">
              <ClientArchivePanel isOpen={isOpen} onOpenHistory={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
