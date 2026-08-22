import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  state: 'idle' | 'thinking' | 'speaking' | 'listening';
  className?: string;
}

export const VoiceWaveform = ({ state, className = '' }: VoiceWaveformProps) => {
  const barCount = 24;
  
  const getBarAnimation = (index: number) => {
    const baseDelay = index * 0.05;
    
    switch (state) {
      case 'idle':
        return {
          scaleY: [0.2, 0.4, 0.2],
          opacity: [0.3, 0.5, 0.3],
          transition: {
            duration: 2,
            repeat: Infinity,
            delay: baseDelay,
            ease: 'easeInOut',
          },
        };
      case 'thinking':
        return {
          scaleY: [0.2, 0.6, 0.3, 0.5, 0.2],
          opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            delay: baseDelay,
            ease: 'easeInOut',
          },
        };
      case 'listening':
        // Grabación activa: barras vivas e irregulares, bien energéticas
        return {
          scaleY: [0.3, 1, 0.45, 0.85, 0.35, 0.95, 0.4, 1, 0.3],
          opacity: [0.5, 1, 0.6, 0.9, 0.5, 0.95, 0.55, 1, 0.5],
          transition: {
            duration: 0.45,
            repeat: Infinity,
            delay: baseDelay * 0.22,
            ease: 'linear',
          },
        };
      case 'speaking':
        return {
          scaleY: [0.2, 1, 0.4, 0.8, 0.3, 0.9, 0.2],
          opacity: [0.5, 1, 0.6, 0.9, 0.5, 0.95, 0.5],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            delay: baseDelay * 0.3,
            ease: 'linear',
          },
        };
      default:
        return {};
    }
  };

  return (
    <div className={`flex items-center justify-center gap-[3px] h-8 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] bg-white/90 rounded-full origin-center"
          style={{ height: '100%' }}
          initial={{ scaleY: 0.2, opacity: 0.3 }}
          animate={getBarAnimation(i)}
        />
      ))}
    </div>
  );
};
