import { useState } from 'react';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { getLandingLang, setStoredLandingLang } from '@/components/landing/landingContent';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import { LandingIntro } from '@/components/landing/LandingIntro';

const agentsBg = '/slides/leather-bg.jpg';

const landingLangToAppLanguage = (lang: LandingLang): Language => {
  switch (lang) {
    case 'es':
      return 'ES';
    case 'pt':
      return 'PT';
    case 'de':
      return 'DE';
    case 'it':
      return 'IT';
    case 'fr':
      return 'FR';
    case 'nl':
      return 'NL';
    case 'pl':
      return 'PL';
    default:
      return 'EN';
  }
};

const Landing = () => {
  const { setLanguage } = useLanguage();
  const [lang, setLang] = useState<LandingLang>(() => getLandingLang());
  const [introDone, setIntroDone] = useState(false);
  const visualScale = 1;
  const navigate = useNavigate();

  if (!introDone) {
    return <LandingIntro lang={lang} onComplete={() => setIntroDone(true)} />;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src={agentsBg}
          alt=""
          aria-hidden
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="fixed inset-x-4 top-4 z-[100] flex justify-end">
        <div className="flex max-w-full flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/suscripciones')}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 py-2 text-sm text-fuchsia-100 backdrop-blur-xl transition hover:border-fuchsia-300 hover:bg-fuchsia-400/10"
          >
            <Crown className="h-4 w-4" />
            Ver suscripciones
          </button>

          <LanguageFloater
            className="relative"
            lang={lang}
            onChange={(nextLang) => {
              setStoredLandingLang(nextLang);
              setLang(nextLang);
              setLanguage(landingLangToAppLanguage(nextLang));
            }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <AgentEliteCarousel lang={lang} visualScale={visualScale} />
      </div>
    </div>
  );
};

export default Landing;
