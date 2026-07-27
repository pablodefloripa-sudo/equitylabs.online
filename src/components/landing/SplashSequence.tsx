import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe, ChevronDown } from 'lucide-react';
import type { LandingLang } from '@/components/landing/LanguageFloater';

interface SplashSequenceProps {
  onComplete: () => void;
  lang: LandingLang;
  onLangChange: (l: LandingLang) => void;
}

const flags: Record<LandingLang, string> = {
  en: '🇺🇸', es: '🇪🇸', it: '🇮🇹', pt: '🇧🇷', fr: '🇫🇷', de: '🇩🇪', pl: '🇵🇱', nl: '🇳🇱',
};

const langLabels: Record<LandingLang, string> = {
  en: 'EN', es: 'ES', it: 'IT', pt: 'PT', fr: 'FR', de: 'DE', pl: 'PL', nl: 'NL',
};

type PageDef = {
  isTitle?: boolean;
  hasCTA?: boolean;
  texts: Record<LandingLang, string>;
};

const typingPages: PageDef[] = [
  {
    isTitle: true,
    texts: {
      en: 'Ultralearning in Emerging Technologies',
      es: 'Ultralearning en Tecnologías Emergentes',
      it: 'Ultralearning nelle Tecnologie Emergenti',
      pt: 'Ultralearning em Tecnologias Emergentes',
      fr: 'Ultralearning dans les Technologies Émergentes',
      de: 'Ultralearning in aufstrebenden Technologien',
      pl: 'Ultralearning w Technologiach Wschodzących',
      nl: 'Ultralearning in opkomende technologieën',
    },
  },
  {
    texts: {
      en: 'AI is advancing faster than ever.',
      es: 'La IA avanza más rápido que nunca.',
      it: "L'IA avanza più velocemente che mai.",
      pt: 'A IA está avançando mais rápido do que nunca.',
      fr: "L'IA progresse plus vite que jamais.",
      de: 'KI entwickelt sich schneller als je zuvor.',
      pl: 'AI rozwija się szybciej niż kiedykolwiek.',
      nl: 'AI ontwikkelt zich sneller dan ooit.',
    },
  },
  {
    texts: {
      en: 'To keep up, you need Ultralearning powered by the strongest models.',
      es: 'Para mantenerte al día, necesitas Ultralearning impulsado por los modelos más poderosos.',
      it: 'Per restare al passo, hai bisogno di Ultralearning alimentato dai modelli più potenti.',
      pt: 'Para acompanhar, você precisa de Ultralearning com os modelos mais poderosos.',
      fr: "Pour suivre le rythme, vous avez besoin d'Ultralearning alimenté par les modèles les plus puissants.",
      de: 'Um Schritt zu halten, brauchen Sie Ultralearning mit den stärksten Modellen.',
      pl: 'Aby nadążyć, potrzebujesz Ultralearning opartego na najsilniejszych modelach.',
      nl: 'Om bij te blijven heb je Ultralearning nodig, aangedreven door de sterkste modellen.',
    },
  },
  {
    texts: {
      en: 'EquityLabs now runs on one private core: qwen/qwen3-vl-8b-thinking, with text, image and PDF input integrated into the operational dashboard.',
      es: 'EquityLabs ahora corre con un solo nucleo privado: qwen/qwen3-vl-8b-thinking, con texto, imagen y PDF integrados al dashboard operativo.',
      it: 'EquityLabs ora funziona con un unico nucleo privato: qwen/qwen3-vl-8b-thinking, con testo, immagini e PDF integrati nella dashboard operativa.',
      pt: 'EquityLabs agora roda com um unico nucleo privado: qwen/qwen3-vl-8b-thinking, com texto, imagem e PDF integrados ao dashboard operacional.',
      fr: "EquityLabs fonctionne maintenant avec un seul noyau prive: qwen/qwen3-vl-8b-thinking, avec texte, image et PDF integres au dashboard operationnel.",
      de: 'EquityLabs laeuft jetzt mit einem einzigen privaten Kern: qwen/qwen3-vl-8b-thinking, mit Text, Bild und PDF im operativen Dashboard.',
      pl: 'EquityLabs dziala teraz na jednym prywatnym rdzeniu: qwen/qwen3-vl-8b-thinking, z tekstem, obrazem i PDF w dashboardzie operacyjnym.',
      nl: 'EquityLabs draait nu op een enkele private kern: qwen/qwen3-vl-8b-thinking, met tekst, beeld en PDF in het operationele dashboard.',
    },
  },
  {
    texts: {
      en: 'Our proprietary LoRA system trains elite AI agents tailored to your "North Star." You own 100% of the intellectual property.',
      es: 'Nuestro sistema LoRA propietario entrena agentes IA de élite adaptados a tu "Estrella Polar." Eres dueño del 100% de la propiedad intelectual.',
      it: 'Il nostro sistema LoRA proprietario addestra agenti IA d\'élite su misura per la tua "Stella Polare." Possiedi il 100% della proprietà intellettuale.',
      pt: 'Nosso sistema LoRA proprietário treina agentes IA de elite personalizados para sua "Estrela Guia." Você é dono de 100% da propriedade intelectual.',
      fr: 'Notre système LoRA propriétaire forme des agents IA d\'élite adaptés à votre "Étoile Polaire." Vous possédez 100% de la propriété intellectuelle.',
      de: 'Unser proprietäres LoRA-System trainiert Elite-KI-Agenten, die auf Ihren "Nordstern" zugeschnitten sind. Sie besitzen 100% des geistigen Eigentums.',
      pl: 'Nasz autorski system LoRA szkoli elitarnych agentów AI dostosowanych do Twojej "Gwiazdy Polarnej." Jesteś właścicielem 100% własności intelektualnej.',
      nl: 'Ons eigen LoRA-systeem traint elite AI-agents op maat van jouw "North Star." Jij bezit 100% van de intellectuele eigendom.',
    },
  },
  {
    texts: {
      en: 'It learns constantly, plugs into your tools, kills the chaos, and builds agents that are 100% yours.',
      es: 'Aprende constantemente, se conecta a tus herramientas, elimina el caos y construye agentes que son 100% tuyos.',
      it: 'Impara costantemente, si collega ai tuoi strumenti, elimina il caos e costruisce agenti che sono al 100% tuoi.',
      pt: 'Aprende constantemente, conecta-se às suas ferramentas, elimina o caos e constrói agentes que são 100% seus.',
      fr: 'Il apprend constamment, se connecte à vos outils, élimine le chaos et crée des agents qui sont 100% les vôtres.',
      de: 'Es lernt ständig, verbindet sich mit Ihren Tools, beseitigt das Chaos und erstellt Agenten, die zu 100% Ihnen gehören.',
      pl: 'Uczy się stale, łączy z Twoimi narzędziami, eliminuje chaos i buduje agentów, którzy są w 100% Twoi.',
      nl: 'Het leert continu, koppelt aan je tools, elimineert chaos en bouwt agents die 100% van jou zijn.',
    },
  },
  {
    hasCTA: true,
    texts: {
      en: 'EquityLabs — your never-sleeping AI weapon.',
      es: 'EquityLabs — tu arma de IA que nunca duerme.',
      it: 'EquityLabs — la tua arma IA che non dorme mai.',
      pt: 'EquityLabs — sua arma de IA que nunca dorme.',
      fr: 'EquityLabs — votre arme IA qui ne dort jamais.',
      de: 'EquityLabs — Ihre niemals schlafende KI-Waffe.',
      pl: 'EquityLabs — Twoja nigdy nie śpiąca broń AI.',
      nl: 'EquityLabs — jouw AI-wapen dat nooit slaapt.',
    },
  },
];

const ctaLabels: Record<LandingLang, string> = {
  en: 'Start Here', es: 'Comenzar', it: 'Inizia Qui', pt: 'Começar Aqui',
  fr: 'Commencer', de: 'Hier Starten', pl: 'Zacznij Tutaj', nl: 'Start Hier',
};

const TypewriterText = ({
  text, onDone, speed = 30, cursorClass = 'bg-blue-400',
}: { text: string; onDone: () => void; speed?: number; cursorClass?: string }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(iv);
        setDone(true);
        onDone();
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span
        className={`inline-block w-[2px] h-[1em] ${cursorClass} ml-[2px] align-middle animate-pulse`}
      />
    </span>
  );
};

const LangSelector = ({ lang, onChange }: { lang: LandingLang; onChange: (l: LandingLang) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed top-4 right-4 z-[10000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/40 bg-black/60 backdrop-blur-xl text-cyan-400 text-xs font-mono tracking-wide hover:border-cyan-400 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{langLabels[lang]}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="absolute right-0 top-10 bg-black/90 backdrop-blur-xl rounded-lg border border-cyan-500/30 overflow-hidden min-w-[120px] shadow-xl"
            >
              {(Object.keys(flags) as LandingLang[]).filter(l => l !== lang).map((l) => (
                <button
                  key={l}
                  onClick={() => { onChange(l); setOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-400"
                >
                  <span className="text-base leading-none">{flags[l]}</span>
                  <span className="font-mono">{langLabels[l]}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

type Phase = 'slogan' | 'typing' | 'done';

export const SplashSequence = ({ onComplete, lang, onLangChange }: SplashSequenceProps) => {
  const [phase, setPhase] = useState<Phase>('slogan');
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const navigate = useNavigate();

  // Slogan lasts 8 seconds
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('typing'), 8000);
    return () => clearTimeout(t1);
  }, []);

  // 5 second delay after typing finishes before auto-advancing
  useEffect(() => {
    if (!typingDone) return;
    const current = typingPages[typingIndex];
    if (current?.hasCTA) return;
    const timer = setTimeout(() => {
      if (typingIndex < typingPages.length - 1) {
        setTypingIndex((i) => i + 1);
        setTypingDone(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [typingDone, typingIndex]);

  const handleTypingDone = useCallback(() => {
    setTypingDone(true);
  }, []);

  const handleStartClick = () => {
    ambienceRef.current?.stop();
    ambienceRef.current = null;
    setPhase('done');
    onComplete();
  };

  const currentPage = typingPages[typingIndex];
  const currentText = currentPage?.isTitle
    ? currentPage.texts[lang]
    : currentPage?.texts[lang] || '';

  // Matrix terminal style for all typing pages
  const matrixTextStyle = { textShadow: '0 0 8px rgba(34,197,94,0.55), 0 0 16px rgba(34,197,94,0.25)' };

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <LangSelector lang={lang} onChange={onLangChange} />

          <AnimatePresence mode="wait">
            {phase === 'slogan' && (
              <motion.div
                key="slogan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center px-8"
              >
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-2xl md:text-4xl font-display font-light tracking-tight text-foreground/90"
                >
                  Your AI-Powered
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-3xl md:text-5xl font-display font-bold tracking-tight mt-2 text-primary"
                >
                  Command Center
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase">
                    Initializing agents...
                  </span>
                </motion.div>
              </motion.div>
            )}

            {phase === 'typing' && (
              <motion.div
                key={`typing-${typingIndex}-${lang}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center px-6 md:px-12 max-w-4xl mx-auto w-full"
              >
                {currentPage?.isTitle ? (
                  <div className="text-left font-mono">
                    <div className="text-green-500/70 text-sm md:text-base mb-3">
                      $ cat manifesto.txt
                    </div>
                    <div
                      className="text-green-400 text-2xl md:text-3xl lg:text-4xl font-bold leading-snug"
                      style={matrixTextStyle}
                    >
                      <TypewriterText
                        text={currentText}
                        onDone={handleTypingDone}
                        speed={70}
                        cursorClass="bg-green-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-left font-mono">
                    <div className="text-green-500/50 text-xs md:text-sm tracking-widest mb-4">
                      [{typingIndex}/{typingPages.length - 1}] $ ./manifesto --next
                    </div>
                    <p
                      className="text-green-400 text-xl md:text-2xl lg:text-3xl font-mono font-medium leading-relaxed"
                      style={matrixTextStyle}
                    >
                      <TypewriterText
                        text={currentText}
                        onDone={handleTypingDone}
                        speed={40}
                        cursorClass="bg-green-400"
                      />
                    </p>

                    {currentPage?.hasCTA && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.5, duration: 0.6 }}
                        className="mt-12 text-center"
                      >
                        <button
                          onClick={handleStartClick}
                          className="group relative px-10 py-4 rounded-lg font-display font-bold text-lg tracking-wide
                            bg-black text-white border border-white/20
                            hover:text-blue-400 hover:border-blue-400/50
                            transition-all duration-300 hover:scale-105"
                        >
                          <span className="relative z-10">{ctaLabels[lang]}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
