import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Shield, ShieldAlert, Eye, Save, Bot, AlertTriangle, ExternalLink, Check, Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MascotCreatorModalProps {
  open: boolean;
  onClose: () => void;
}

const ICON_SIZE = 16;

const SPECIES = [
  'Perro Cibernético', 'Gato Cuántico', 'Zorro Digital', 'Dragón Neón',
  'Águila IA', 'Panda Galáctico', 'Robot Emocional', 'Criatura Fantástica',
];
const PERSONALITIES = [
  'Amigable y curiosa', 'Sabia y serena', 'Juguetona y caótica',
  'Profesional y enfocada', 'Sarcástica e ingeniosa', 'Empática y cálida',
  'Aventurera y audaz', 'Filosófica y profunda',
];
const SPECIALTIES = [
  'Productividad personal', 'Investigación y aprendizaje', 'Creatividad y arte',
  'Bienestar emocional', 'Negocios y finanzas', 'Programación y tech',
  'Coaching de hábitos', 'Entretenimiento',
];
const VOICE_TONES = [
  'Cálido y cercano', 'Formal y profesional', 'Energético y motivador',
  'Calmado y meditativo', 'Divertido y casual', 'Misterioso y narrativo',
];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán', 'Japonés', 'Chino'];

const FUNCTIONS_NO_INTEGRATION = [
  { id: 'stories', label: 'Generación de historias e ideas creativas' },
  { id: 'focus', label: 'Modo estudio / focus' },
  { id: 'play', label: 'Modo juego / entretenimiento' },
  { id: 'emotion', label: 'Análisis emocional' },
  { id: 'roleplay', label: 'Roleplay inmersivo' },
  { id: 'habits', label: 'Coaching de hábitos' },
  { id: 'imagegen', label: 'Imágenes conceptuales' },
];
const FUNCTIONS_INTEGRATION = [
  { id: 'gmail_read', label: 'Leer y resumir emails', integration: 'Gmail', write: false },
  { id: 'gmail_send', label: 'Responder emails', integration: 'Gmail', write: true },
  { id: 'calendar', label: 'Gestionar calendario', integration: 'Google Calendar', write: true },
  { id: 'reminders', label: 'Recordatorios inteligentes', integration: 'Calendar', write: true },
  { id: 'drive', label: 'Acceso a Google Drive', integration: 'Google Drive', write: true },
  { id: 'notion', label: 'Acceso a Notion', integration: 'Notion', write: true },
  { id: 'tasks', label: 'Gestión de tareas', integration: 'Tasks', write: true },
  { id: 'whatsapp', label: 'Leer/responder WhatsApp', integration: 'WhatsApp', write: true },
  { id: 'telegram', label: 'Leer/responder Telegram', integration: 'Telegram', write: true },
  { id: 'slack', label: 'Slack / Teams', integration: 'Slack', write: true },
  { id: 'github', label: 'Gestión en GitHub', integration: 'GitHub', write: true },
  { id: 'docs', label: 'Análisis de documentos', integration: 'Drive', write: false },
  { id: 'contacts', label: 'Acceso a contactos', integration: 'Contacts', write: false },
  { id: 'finance', label: 'Resumen de finanzas', integration: 'Finance', write: false },
  { id: 'smart_home', label: 'Smart Home', integration: 'Smart Home', write: true },
  { id: 'news', label: 'Noticias y feeds', integration: 'News', write: false },
  { id: 'crm', label: 'CRM (HubSpot, Salesforce)', integration: 'CRM', write: true },
];

export const MascotCreatorModal = ({ open, onClose }: MascotCreatorModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(SPECIES[0]);
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [role, setRole] = useState<'basic' | 'advanced'>('basic');
  const [personality, setPersonality] = useState(PERSONALITIES[0]);
  const [autonomy, setAutonomy] = useState(4);
  const [empathy, setEmpathy] = useState(7);
  const [humor, setHumor] = useState(5);
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [voiceTone, setVoiceTone] = useState(VOICE_TONES[0]);
  const [languages, setLanguages] = useState<string[]>(['Español']);
  const [activeFunctions, setActiveFunctions] = useState<string[]>([]);
  const [backstory, setBackstory] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      return;
    }

    // Restore the user's latest mascot from Supabase when Companion Forge opens.
    // This keeps the companion available across browsers and sessions.
    let cancelled = false;
    const restoreSavedMascot = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await supabase
        .from('agent_configs')
        .select('config')
        .eq('user_id', user.id)
        .eq('agent_type', 'mascot')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data?.config || cancelled) return;
      const restored = data.config as Record<string, unknown>;
      localStorage.setItem('eq:active-mascot', JSON.stringify(restored));
      window.dispatchEvent(new CustomEvent('eq:mascot-restored', { detail: restored }));
    };

    void restoreSavedMascot();
    return () => { cancelled = true; };
  }, [open]);

  const toggleFn = (id: string) =>
    setActiveFunctions((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleLang = (l: string) =>
    setLanguages((p) => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  const isFnDisabled = (write: boolean) => role === 'basic' && write;

  const buildSystemPrompt = () => {
    const fns = [
      ...FUNCTIONS_NO_INTEGRATION.filter(f => activeFunctions.includes(f.id)).map(f => f.label),
      ...FUNCTIONS_INTEGRATION.filter(f => activeFunctions.includes(f.id)).map(f => `${f.label} [${f.integration}]`),
    ];
    return [
      `Eres ${name || 'una mascota IA'}, un/a ${species}.`,
      `Rol: ${role === 'basic' ? 'Mascota Básica (acceso limitado, sin acciones de escritura sin confirmación)' : 'Mascota Avanzada (mayor autonomía y capacidad de acción)'}.`,
      `Personalidad: ${personality}. Tono: ${voiceTone}.`,
      `Niveles -> Autonomía: ${autonomy}/10, Empatía: ${empathy}/10, Humor: ${humor}/10.`,
      `Especialidad: ${specialty}. Idiomas: ${languages.join(', ')}.`,
      `Funciones: ${fns.length ? fns.join('; ') : 'ninguna'}.`,
      backstory ? `\nBackstory:\n${backstory}` : '',
    ].join('\n');
  };

  const handlePreview = () => {
    if (!name.trim()) return toast({ title: 'Falta el nombre', variant: 'destructive' });
    setPreview(buildSystemPrompt());
  };

  const handleSave = async () => {
    if (!name.trim()) return toast({ title: 'Falta el nombre', variant: 'destructive' });
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const config = {
        name, species, avatarIdx, role, personality, autonomy, empathy, humor,
        specialty, voiceTone, languages, activeFunctions, backstory, isActive,
        systemPrompt: buildSystemPrompt(),
        createdAt: new Date().toISOString(),
      };
      const stored = JSON.parse(localStorage.getItem('eq:mascots') || '[]');
      stored.push(config);
      localStorage.setItem('eq:mascots', JSON.stringify(stored));
      localStorage.setItem('eq:active-mascot', JSON.stringify(config));
      if (user) {
        await supabase.from('agent_configs').insert({
          user_id: user.id, agent_type: 'mascot', name, config: config as any, is_active: isActive,
        });
      }
      window.dispatchEvent(new CustomEvent('eq:mascot-created', { detail: config }));
      toast({
        title: isActive ? '✨ Mascota creada' : 'Mascota apagada',
        description: isActive ? `${name} está lista.` : `${name} quedó guardada pero apagada.`,
      });
      onClose();
      setName(''); setBackstory(''); setActiveFunctions([]); setPreview(null); setIsActive(true);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo guardar', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const goToIntegrations = () => window.dispatchEvent(new CustomEvent('eq:open-integration-center'));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto modal-cyber-pink w-[92vw] max-w-5xl max-h-[88vh] rounded-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-pink-400/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-400/40 flex items-center justify-center">
                    <Bot size={ICON_SIZE} className="text-pink-300" />
                  </div>
                  <div>
                    <h2 className="modal-cyber-title text-base font-semibold" style={{ color: 'rgb(249,168,212)' }}>
                      Crear Mascota IA
                    </h2>
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Companion Forge</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10">
                  <X size={ICON_SIZE} />
                </Button>
              </div>

              {/* Body — 2 columns */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* === LEFT: Identity === */}
                  <div className="space-y-3">
                    <SectionTitle icon={<Sparkles size={ICON_SIZE} />} title="Identidad" />

                    <Field label="Nombre *">
                      <input
                        autoFocus
                        value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Nova, Pip, Atlas..."
                        className={`modal-cyber-input w-full ${!name.trim() ? 'ring-1 ring-pink-400/60' : ''}`}
                      />
                      <p className="mt-1 text-[10px] font-mono text-pink-300/70">
                        {name.trim() ? `✓ ${name} guardará al finalizar` : 'Requerido para finalizar y guardar'}
                      </p>
                    </Field>

                    <Field label="Especie">
                      <Select value={species} onChange={setSpecies} options={SPECIES} />
                    </Field>

                    <Field label="Avatar">
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((i) => (
                          <button
                            key={i} type="button" onClick={() => setAvatarIdx(i)}
                            className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                              avatarIdx === i
                                ? 'border-2 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.45)]'
                                : 'border border-white/10 hover:border-white/30'
                            }`}
                            style={{
                              background: `linear-gradient(${135 + i * 60}deg, rgba(34,211,238,0.25) 0%, rgba(168,85,247,0.25) 50%, rgba(236,72,153,0.25) 100%)`,
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">
                              {['🤖', '🦊', '🐉'][i]}
                            </div>
                            {avatarIdx === i && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-400 flex items-center justify-center">
                                <Check size={10} className="text-black" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Estado de la mascota">
                      <button
                        type="button"
                        onClick={() => setIsActive((value) => !value)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                          isActive
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                            : 'border-white/10 bg-white/[0.03] text-white/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {isActive ? 'Mascota activa' : 'Mascota apagada'}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                              {isActive
                                ? 'Aparece en el dashboard y responde a eventos.'
                                : 'Se guarda la config, pero no se muestra ni interrumpe.'}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            isActive
                              ? 'bg-emerald-400/15 text-emerald-200 border border-emerald-400/30'
                              : 'bg-white/5 text-white/50 border border-white/10'
                          }`}>
                            {isActive ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </button>
                    </Field>

                    <Field label="Personalidad">
                      <Select value={personality} onChange={setPersonality} options={PERSONALITIES} />
                    </Field>

                    <Field label="Especialidad">
                      <Select value={specialty} onChange={setSpecialty} options={SPECIALTIES} />
                    </Field>

                    <Field label="Tono de voz">
                      <Select value={voiceTone} onChange={setVoiceTone} options={VOICE_TONES} />
                    </Field>

                    <Field label="Backstory & reglas">
                      <textarea
                        value={backstory} onChange={(e) => setBackstory(e.target.value)}
                        rows={3}
                        placeholder="Origen, valores, frases típicas, límites..."
                        className="modal-cyber-input w-full resize-y"
                      />
                    </Field>
                  </div>

                  {/* === RIGHT: Behavior === */}
                  <div className="space-y-3">
                    <SectionTitle icon={<Cpu size={ICON_SIZE} />} title="Comportamiento" />

                    <Field label="Rol">
                      <div className="grid grid-cols-2 gap-2">
                        <RoleCard
                          active={role === 'basic'} onClick={() => setRole('basic')}
                          icon={<Shield size={ICON_SIZE} />} title="Básica"
                          desc="Acceso limitado y seguro."
                          activeCls="border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                        />
                        <RoleCard
                          active={role === 'advanced'} onClick={() => setRole('advanced')}
                          icon={<ShieldAlert size={ICON_SIZE} />} title="Avanzada"
                          desc="Mayor autonomía y permisos."
                          activeCls="border-pink-400/50 bg-pink-500/10 text-pink-200"
                        />
                      </div>
                    </Field>

                    <SliderField label="Autonomía" value={autonomy} onChange={setAutonomy} />
                    <SliderField label="Empatía" value={empathy} onChange={setEmpathy} />
                    <SliderField label="Humor" value={humor} onChange={setHumor} />

                    <Field label="Idiomas">
                      <div className="flex flex-wrap gap-1.5">
                        {LANGUAGES.map((l) => (
                          <button
                            key={l} type="button" onClick={() => toggleLang(l)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                              languages.includes(l)
                                ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.35)]'
                                : 'bg-white/5 border border-white/10 text-white/55 hover:bg-white/10'
                            }`}
                          >{l}</button>
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>

                {/* === BOTTOM FULL-WIDTH: Permissions === */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <SectionTitle icon={<Cpu size={ICON_SIZE} />} title="Funciones y permisos" />

                  <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/60 mb-2">Sin integración</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 mb-4">
                    {FUNCTIONS_NO_INTEGRATION.map((f) => (
                      <FunctionRow key={f.id} label={f.label}
                        checked={activeFunctions.includes(f.id)} onToggle={() => toggleFn(f.id)} />
                    ))}
                  </div>

                  <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/60 mb-2">Con integración externa</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {FUNCTIONS_INTEGRATION.map((f) => {
                      const checked = activeFunctions.includes(f.id);
                      const disabled = isFnDisabled(f.write);
                      return (
                        <div key={f.id} className={`rounded-lg border ${
                          checked ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-white/10 bg-white/[0.02]'
                        } px-2 py-1.5`}>
                          <FunctionRow label={f.label} checked={checked} disabled={disabled}
                            onToggle={() => !disabled && toggleFn(f.id)} />
                          {checked && (
                            <div className="mt-1.5 pl-6 flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                                {f.integration}
                              </span>
                              <button onClick={goToIntegrations}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-200 hover:bg-cyan-500/10 transition">
                                <ExternalLink size={10} /> Conectar
                              </button>
                            </div>
                          )}
                          {disabled && !checked && (
                            <p className="mt-1 pl-6 text-[10px] text-white/40 italic flex items-center gap-1">
                              <AlertTriangle size={10} /> Bloqueada en modo Básica
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {preview && (
                  <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/5 p-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 mb-1.5">Vista Previa · System Prompt</p>
                    <pre className="text-[11px] text-white/80 whitespace-pre-wrap font-mono leading-relaxed">{preview}</pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-pink-400/20 flex items-center justify-end gap-2 bg-black/40">
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs text-white/60 hover:text-white">
                  Cancelar
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePreview}
                  className="h-8 text-xs text-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/10 border border-cyan-400/30">
                  <Eye size={ICON_SIZE} className="mr-1.5" /> Vista previa
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}
                  className="h-8 text-xs bg-pink-500/20 hover:bg-pink-500/35 text-pink-100 border border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.35)]">
                  <Save size={ICON_SIZE} className="mr-1.5" />
                  {saving ? 'Guardando...' : isActive ? 'Crear Mascota' : 'Guardar Apagada'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Subcomponents ---
const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300">
      {icon}
    </div>
    <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">{title}</h3>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1 block">{label}</label>
    {children}
  </div>
);

const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <select
    value={value} onChange={(e) => onChange(e.target.value)}
    className="modal-cyber-input w-full cursor-pointer"
  >
    {options.map((o) => <option key={o} value={o} className="bg-black">{o}</option>)}
  </select>
);

const SliderField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <Field label={label}>
    <div className="flex items-center gap-2.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
      <Slider value={[value]} min={1} max={10} step={1} onValueChange={(v) => onChange(v[0])} className="flex-1" />
      <span className="text-xs font-bold text-cyan-300 font-mono w-6 text-right">{value}</span>
    </div>
  </Field>
);

const RoleCard = ({ active, onClick, icon, title, desc, activeCls }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; activeCls: string;
}) => (
  <button type="button" onClick={onClick}
    className={`text-left p-2.5 rounded-lg border transition-all ${
      active ? `${activeCls} shadow-[0_0_12px_rgba(236,72,153,0.25)]` : 'border-white/10 bg-white/[0.02] hover:bg-white/5 text-white/65'
    }`}
  >
    <div className="flex items-center gap-1.5 mb-0.5">{icon}<span className="font-bold text-xs">{title}</span></div>
    <p className="text-[10px] opacity-80 leading-snug">{desc}</p>
  </button>
);

const FunctionRow = ({ label, checked, onToggle, disabled }: {
  label: string; checked: boolean; onToggle: () => void; disabled?: boolean;
}) => (
  <label className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors ${
    disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'
  }`}>
    <Checkbox checked={checked} onCheckedChange={onToggle} disabled={disabled}
      className="h-3.5 w-3.5 border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-400" />
    <span className="text-[12px] text-white/80 leading-tight">{label}</span>
  </label>
);
