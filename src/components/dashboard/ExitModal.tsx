import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ExitModal = ({ isOpen, onClose, onConfirmExit }: ExitModalProps) => {
  const [working, setWorking] = useState<null | 'save' | 'discard'>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const finalizeExit = async (keepSession = false) => {
    if (!keepSession) {
      try {
        await signOut();
      } catch (e) {
        console.error('signOut failed', e);
      }
    }
    // Always navigate, even if signOut throws
    onConfirmExit();
  };

  const handleSaveAndExit = async () => {
    if (working) return;
    setWorking('save');
    try {
      if (user) {
        const projectId = crypto.randomUUID();
        const stamp = new Date().toLocaleString();
        const projectName = `Session ${stamp}`;

        // Pull live messages from the dashboard chat
        const live = (window as unknown as {
          __eqMessages?: Array<{ role: string; content: string; timestamp?: Date; model?: string; agentRoute?: string }>;
        }).__eqMessages || [];

        const rows = live
          .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
          .map(m => ({
            user_id: user.id,
            role: m.role,
            content: m.content,
            project_id: projectId,
            project_name: projectName,
            model_used: m.model || m.agentRoute || null,
          }));
        const context = (window as unknown as { __eqDashboardContext?: unknown }).__eqDashboardContext || null;

        // Persist full conversation (if any) plus the marker, all under same project_id
        if (rows.length > 0) {
          await supabase.from('chat_history').insert(rows);
        }
        await supabase.from('chat_history').insert({
          user_id: user.id,
          role: 'system',
          content: `EQ_SESSION_CONTEXT:${JSON.stringify({ context, savedAt: new Date().toISOString() })}`,
          project_id: projectId,
          project_name: projectName,
        });
      }
      toast({ title: 'Session saved', description: 'Available in History.' });
      // Saving is not logging out: preserve auth, active agent and selected model.
      await finalizeExit(true);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not save session.', variant: 'destructive' });
      setWorking(null);
    }
  };

  const handleDontSaveAndExit = async () => {
    if (working) return;
    setWorking('discard');
    try {
      if (user) {
        await supabase.from('chat_history').delete().eq('user_id', user.id);
        const { data: files } = await supabase.storage.from('user-files').list(user.id);
        if (files && files.length > 0) {
          const paths = files.map(f => `${user.id}/${f.name}`);
          await supabase.storage.from('user-files').remove(paths);
        }
        await supabase.from('user_documents').delete().eq('user_id', user.id);
      }
      toast({ title: 'Session cleared', description: 'No trace left.' });
      await finalizeExit();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not clear session.', variant: 'destructive' });
      setWorking(null);
    }
  };

  const handleJustExit = async () => {
    if (working) return;
    await handleSaveAndExit();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !working && onClose()} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 modal-cyber w-full max-w-sm mx-4 p-6 rounded-2xl text-center"
          >
            <h2 className="modal-cyber-title text-base font-semibold mb-2">
              Save project before leaving?
            </h2>
            <p className="text-muted-foreground/60 text-sm mb-6">
              Your chat history, files and images will be preserved or permanently deleted.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSaveAndExit}
                disabled={!!working}
                className="w-full h-11 rounded-xl font-display font-semibold text-sm bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
              >
                {working === 'save' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                SAVE & EXIT
              </Button>
              <Button
                variant="ghost"
                onClick={handleJustExit}
                disabled={!!working}
                className="w-full h-10 rounded-xl font-display text-xs text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                EXIT & SAVE SESSION
              </Button>
              <Button
                variant="ghost"
                onClick={handleDontSaveAndExit}
                disabled={!!working}
                className="w-full h-11 rounded-xl font-display font-semibold text-sm text-destructive hover:bg-destructive/10"
              >
                {working === 'discard' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                DELETE ALL & EXIT
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={!!working}
                className="w-full h-9 rounded-xl text-muted-foreground/60 text-xs"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
