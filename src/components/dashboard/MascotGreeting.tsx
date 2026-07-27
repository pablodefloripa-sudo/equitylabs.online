import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import mascotImage from '@/assets/mascot/assistant-dog.png';

interface MascotGreetingProps {
  onPickTask?: (task: string) => void;
}

export const MascotGreeting = ({ onPickTask }: MascotGreetingProps) => {
  const { language } = useLanguage();

  type Lang = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
  const normalizedLanguage = language.toLowerCase();
  const lang = (['es','en','pt','fr','de','it','zh','ja'].includes(normalizedLanguage) ? normalizedLanguage : 'en') as Lang;

  const copy: Record<Lang, { hello: string; intro: string; tasks: string[] }> = {
    es: {
      hello: '¡Hola! Soy Pip, tu Jack Russell.',
      intro: 'Te propongo tres tareas para hoy:',
      tasks: [
        'Revisar las métricas del proyecto',
        'Generar un reporte ejecutivo',
        'Iniciar una misión de Foco (20 min)',
      ],
    },
    en: { hello: 'Hi! I\'m Pip, your Jack Russell.', intro: 'Here are three tasks for today:',
      tasks: ['Review project metrics', 'Generate an executive report', 'Start a Focus mission (20 min)'] },
    pt: { hello: 'Olá! Sou o Pip, seu Jack Russell.', intro: 'Proponho três tarefas para hoje:',
      tasks: ['Revisar as métricas do projeto', 'Gerar um relatório executivo', 'Iniciar uma missão de Foco (20 min)'] },
    fr: { hello: 'Salut ! Je suis Pip, ton Jack Russell.', intro: 'Voici trois tâches pour aujourd\'hui :',
      tasks: ['Revoir les métriques du projet', 'Générer un rapport exécutif', 'Lancer une mission Focus (20 min)'] },
    de: { hello: 'Hallo! Ich bin Pip, dein Jack Russell.', intro: 'Drei Aufgaben für heute:',
      tasks: ['Projektmetriken überprüfen', 'Executive-Report erstellen', 'Focus-Mission starten (20 Min)'] },
    it: { hello: 'Ciao! Sono Pip, il tuo Jack Russell.', intro: 'Tre attività per oggi:',
      tasks: ['Rivedere le metriche del progetto', 'Generare un report esecutivo', 'Avviare una missione Focus (20 min)'] },
    zh: { hello: '你好！我是 Pip，你的杰克罗素犬。', intro: '为你准备了三项任务：',
      tasks: ['查看项目指标', '生成执行报告', '开始专注任务（20 分钟）'] },
    ja: { hello: 'こんにちは！ジャックラッセルのPipです。', intro: '今日のおすすめ3タスク：',
      tasks: ['プロジェクトの指標を確認', 'エグゼクティブレポートを生成', '集中ミッション開始（20分）'] },
  };

  const c = copy[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full rounded-2xl border border-cyan-400/30 bg-black/70 backdrop-blur-xl p-4 flex gap-4 items-start"
    >
      <motion.div
        animate={{ y: [0, -4, 0], rotate: [0, -1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0 relative"
      >
        <img
          src={mascotImage}
          alt="Mascota asistente"
          className="w-32 h-32 rounded-2xl object-cover object-center border border-cyan-300/25 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
        />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-cyan-200 font-semibold tracking-wide">{c.hello}</p>
        <p className="text-xs text-foreground/70 mt-1">{c.intro}</p>
        <ul className="mt-2 space-y-1.5">
          {c.tasks.map((t, i) => (
            <li key={i}>
              <button
                onClick={() => onPickTask?.(t)}
                className="w-full text-left text-[13px] text-foreground/85 px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-400/10 border border-white/10 hover:border-cyan-400/40 transition-all"
              >
                <span className="text-cyan-300/80 font-mono mr-2">{i + 1}.</span>{t}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};
