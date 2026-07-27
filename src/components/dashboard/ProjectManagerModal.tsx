import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Image as ImageIcon, FileText, Trash2, Loader2, FolderPlus, HardDrive, Rocket, File, FileSpreadsheet, FileImage, FileVideo, FileAudio, Upload, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ClientArchivePanel } from './ClientArchivePanel';
import { ProjectMindMapStudio } from './ProjectMindMapStudio';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'archive' | 'maps' | 'chats' | 'assets';

interface LocalFile {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(ext)) return <FileImage className="w-4 h-4 text-purple-400 shrink-0" />;
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return <FileVideo className="w-4 h-4 text-pink-400 shrink-0" />;
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-400 shrink-0" />;
  return <File className="w-4 h-4 text-primary shrink-0" />;
};

export const ProjectManagerModal = ({ isOpen, onClose }: ProjectManagerModalProps) => {
  const [tab, setTab] = useState<Tab>('archive');
  const [chats, setChats] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const allowed = ['jpg','jpeg','png','webp','gif','pdf','doc','docx','xls','xlsx','csv','txt'];
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 20MB`, variant: 'destructive' });
          continue;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!allowed.includes(ext)) {
          toast({ title: 'Format not allowed', description: file.name, variant: 'destructive' });
          continue;
        }
        const path = `${user.id}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('documentos').upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from('documentos').createSignedUrl(path, 60 * 60 * 24 * 365);
        const { error: dbErr } = await supabase.from('user_documents').insert({
          user_id: user.id,
          name: file.name,
          type: 'file',
          file_url: signed?.signedUrl || path,
        });
        if (dbErr) throw dbErr;
      }
      toast({ title: '✅ Upload complete' });
      await fetchAssets();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('chat_history')
        .select('project_id, project_name, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(300);

      const grouped = new Map<string, any>();
      for (const row of data || []) {
        const pid = row.project_id || 'default';
        if (!grouped.has(pid)) {
          grouped.set(pid, { project_id: pid, project_name: row.project_name || 'Chat', updated_at: row.created_at, count: 1 });
        } else {
          grouped.get(pid)!.count++;
        }
      }
      setChats(Array.from(grouped.values()));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('user_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      setAssets(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'maps' || tab === 'archive') return;
    if (tab === 'chats') fetchChats();
    else fetchAssets();
  }, [isOpen, tab, fetchChats, fetchAssets]);

  useEffect(() => {
    if (isOpen) {
      setTab('archive');
    }
  }, [isOpen]);

  const deleteChat = async (projectId: string) => {
    if (!user) return;
    await supabase.from('chat_history').delete().eq('user_id', user.id).eq('project_id', projectId);
    setChats(prev => prev.filter(c => c.project_id !== projectId));
    toast({ title: 'Deleted' });
  };

  const resumeChat = async (chat: { project_id: string; project_name: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, role, content, created_at, model_used')
        .eq('user_id', user.id)
        .eq('project_id', chat.project_id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const rows = data || [];
      const contextRow = rows.find(row => row.role === 'system' && row.content.startsWith('EQ_SESSION_CONTEXT:'));
      let context: unknown = undefined;
      if (contextRow) {
        try { context = JSON.parse(contextRow.content.slice('EQ_SESSION_CONTEXT:'.length)).context; } catch { /* ignore malformed context */ }
      }
      const messages = rows
        .filter(row => row.role === 'user' || row.role === 'assistant')
        .map(row => ({
          id: row.id,
          role: row.role as 'user' | 'assistant',
          content: row.content,
          timestamp: row.created_at,
          model: row.model_used || undefined,
        }));
      sessionStorage.setItem('eq_resume_session', JSON.stringify({
        project_id: chat.project_id,
        project_name: chat.project_name,
        messages,
        context,
      }));
      window.dispatchEvent(new CustomEvent('eq:resume-session', { detail: { project_id: chat.project_id, messages, context } }));
      toast({ title: 'Chat restaurado', description: `${chat.project_name} listo para continuar.` });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo restaurar el chat.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!user) return;
    await supabase.from('user_documents').delete().eq('id', id);
    setAssets(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Deleted' });
  };

  const linkLocalFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast({ title: 'Not supported', description: 'Your browser does not support File System Access API. Use Chrome or Edge.', variant: 'destructive' });
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDirHandle(handle);
      await readDirectory(handle);
      toast({ title: '🔗 Folder linked', description: handle.name });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
      }
    }
  };

  const readDirectory = async (handle: FileSystemDirectoryHandle) => {
    const files: LocalFile[] = [];
    for await (const entry of (handle as any).values()) {
      files.push({ name: entry.name, kind: entry.kind, handle: entry });
    }
    files.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    setLocalFiles(files);
  };

  const createSubfolder = async () => {
    if (!dirHandle) return;
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      await dirHandle.getDirectoryHandle(name, { create: true });
      await readDirectory(dirHandle);
      toast({ title: '📁 Folder created', description: name });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const saveCurrentSession = async () => {
    if (!dirHandle || !user) return;
    try {
      const { data } = await supabase.from('chat_history').select('role, content, created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(500);
      if (!data || data.length === 0) {
        toast({ title: 'No session data to save' });
        return;
      }
      const content = data.map(m => `[${m.role.toUpperCase()}] ${m.created_at}\n${m.content}`).join('\n\n---\n\n');
      const fileName = `session_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(content);
      await writable.close();
      await readDirectory(dirHandle);
      toast({ title: '💾 Session saved', description: fileName });
    } catch (e: any) {
      toast({ title: 'Error saving', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative z-10 modal-cyber mx-4 flex w-full flex-col overflow-hidden rounded-2xl ${
              tab === 'maps' || tab === 'archive' ? 'max-w-7xl h-[88vh]' : 'max-w-lg max-h-[80vh]'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-cyan-400/15">
              <h2 className="modal-cyber-title text-sm font-semibold">Project Manager</h2>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/20">
              {(['archive', 'maps', 'chats', 'assets'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                    tab === t ? 'border-b-2 text-foreground/90' : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                  style={tab === t ? { borderColor: '#22d3ee', color: '#22d3ee' } : {}}
                >
                  {t === 'archive'
                    ? 'Archivero'
                    : t === 'maps'
                      ? 'Root Maps'
                      : t === 'chats'
                        ? 'Chats & Projects'
                        : 'Assets & Files'}
                </button>
              ))}
            </div>

            <div className={`flex-1 ${tab === 'maps' || tab === 'archive' ? 'min-h-0 overflow-hidden' : 'overflow-y-auto p-4 space-y-2 scrollbar-thin'}`}>
              {tab === 'archive' ? (
                <ClientArchivePanel
                  isOpen={isOpen}
                  onOpenHistory={() => setTab('chats')}
                  onOpenAssets={() => setTab('assets')}
                />
              ) : tab === 'maps' ? (
                <ProjectMindMapStudio isOpen={isOpen} />
              ) : (
                <div className="space-y-2 p-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : tab === 'chats' ? (
                chats.length === 0 ? <p className="text-center text-muted-foreground/50 py-8 text-sm">No saved chats</p> :
                chats.map(c => (
                  <div key={c.project_id} role="button" tabIndex={0} onClick={() => resumeChat(c)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') void resumeChat(c); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 text-left hover:border-cyan-300/40 hover:bg-cyan-300/8 transition-colors cursor-pointer">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground/90 truncate">{c.project_name}</p>
                      <p className="text-xs text-muted-foreground/50">{c.count} messages</p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); void deleteChat(c.project_id); }} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <>
                  {/* Local folder section */}
                  {!dirHandle ? (
                    <button
                      onClick={linkLocalFolder}
                      className="w-full py-6 rounded-xl border-2 border-dashed border-[#22d3ee]/30 bg-[#22d3ee]/5 hover:bg-[#22d3ee]/10 transition-all flex flex-col items-center gap-2"
                    >
                      <Rocket className="w-8 h-8 text-[#22d3ee]" />
                      <span className="text-sm font-display font-bold text-[#22d3ee]">🚀 Initialize Local Bunker</span>
                      <span className="text-[10px] text-muted-foreground/50">Link a folder from your disk</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-[#22d3ee]" />
                          <span className="text-xs font-display font-bold text-[#22d3ee]">{dirHandle.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={createSubfolder} className="h-7 text-[10px] px-2 text-[#22d3ee] hover:bg-[#22d3ee]/10">
                            <FolderPlus className="w-3 h-3 mr-1" />New Folder
                          </Button>
                          <Button variant="ghost" size="sm" onClick={saveCurrentSession} className="h-7 text-[10px] px-2 text-emerald-400 hover:bg-emerald-400/10">
                            💾 Save Session
                          </Button>
                        </div>
                      </div>
                      {localFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/20">
                          {f.kind === 'directory' ? (
                            <FolderPlus className="w-4 h-4 text-[#22d3ee] shrink-0" />
                          ) : (
                            getFileIcon(f.name)
                          )}
                          <span className="text-xs text-foreground/80 truncate flex-1">{f.name}</span>
                          <span className="text-[9px] text-muted-foreground/40 uppercase">{f.kind === 'directory' ? 'DIR' : f.name.split('.').pop()}</span>
                        </div>
                      ))}
                      {localFiles.length === 0 && (
                        <p className="text-center text-muted-foreground/40 text-xs py-4">Empty folder</p>
                      )}
                    </div>
                  )}

                  {/* Divider + Upload */}
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-border/20" />
                    <span className="text-[9px] text-muted-foreground/40 uppercase">Cloud Assets</span>
                    <div className="flex-1 h-px bg-border/20" />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-primary" />}
                    <span className="text-xs font-display font-bold text-primary">
                      {uploading ? 'Uploading...' : 'Upload from disk (JPG, PDF, Word, Excel)'}
                    </span>
                  </button>

                  {/* Cloud assets */}
                  {assets.length === 0 ? <p className="text-center text-muted-foreground/50 py-4 text-sm">No cloud assets</p> :
                  assets.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                      {a.type === 'file' ? <FileText className="w-4 h-4 text-primary shrink-0" /> : <ImageIcon className="w-4 h-4 text-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground/90 truncate">{a.name}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteAsset(a.id)} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
