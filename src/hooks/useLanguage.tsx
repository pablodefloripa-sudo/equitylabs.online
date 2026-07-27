import React, { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';
import { getBrowserLandingLang, getStoredLandingLang } from '@/components/landing/landingContent';

export type Language = 'EN' | 'ES' | 'PT' | 'DE' | 'IT' | 'FR' | 'NL' | 'PL';
const APP_LANGUAGES: Language[] = ['EN', 'ES', 'PT', 'DE', 'IT', 'FR', 'NL', 'PL'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const mapLandingLangToAppLanguage = (lang: string): Language => {
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

const mapAppLanguageToLandingLang = (lang: Language): string => {
  switch (lang) {
    case 'ES':
      return 'es';
    case 'PT':
      return 'pt';
    case 'DE':
      return 'de';
    case 'IT':
      return 'it';
    case 'FR':
      return 'fr';
    case 'NL':
      return 'nl';
    case 'PL':
      return 'pl';
    default:
      return 'en';
  }
};

const normalizeAppLanguage = (value: string | null | undefined): Language | null => {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  return APP_LANGUAGES.includes(upper as Language) ? upper as Language : null;
};

export const toApiLanguage = (lang: Language): string => mapAppLanguageToLandingLang(lang);

// Common keys for sidebars (Metrics + Dashboard) and Operative Order
const sidebarKeys = {
  ES: {
    'side.metrics': 'Métricas',
    'side.dashboard': 'Dashboard',
    'side.realtime': 'Tiempo Real',
    'side.realtime_metrics': 'Métricas en Tiempo Real',
    'side.charts': 'Gráficos',
    'side.update': 'Actualización: 2s',
    'metric.operative_speed': 'Velocidad Operativa',
    'metric.cognitive_load': 'Carga Cognitiva',
    'metric.sla_sync': 'Sincronía SLA',
    'metric.active_projects': 'Proyectos Activos',
    'metric.no_change': 'sin cambios',
    'chart.latency': 'Latencia (ms)',
    'chart.projects': 'Proyectos',
    'op.title': 'Orden Operativo',
    'op.mode': 'Modo de Operación',
    'op.creativity': 'Creatividad',
    'op.injectors': 'Inyectores',
    'op.winning': 'Prompts Ganadores',
    'op.mission_placeholder': 'Escribe la misión de hoy...',
    'op.save_prompt': 'Guardar Prompt Ganador',
    'op.no_prompts': 'Sin prompts guardados aún',
    'op.mode.seo': 'SEO Estratégico',
    'op.mode.seo.desc': 'Keywords, intención de búsqueda, clusters',
    'op.mode.fullstack': 'Full-Stack Dev',
    'op.mode.fullstack.desc': 'React, Remix, backend limpio',
    'op.mode.copywriter': 'Copywriter',
    'op.mode.copywriter.desc': 'Slogans, landing, conversión',
    'op.mode.debug': 'Debug Mode',
    'op.mode.debug.desc': 'Errores rápidos, consola, logs',
    'op.creat.precision': 'Precisión Quirúrgica',
    'op.creat.balanced': 'Equilibrado',
    'op.creat.brainstorm': 'Lluvia de Ideas',
    'op.inj.concise': 'Concisión Extrema',
    'op.inj.concise.desc': 'Sin saludos, solo solución',
    'op.inj.human': 'Explicación Humana',
    'op.inj.human.desc': 'Como socio, no como manual',
    'op.inj.markdown': 'Formato Markdown',
    'op.inj.markdown.desc': 'Tablas, negritas y listas',
  },
  EN: {
    'side.metrics': 'Metrics',
    'side.dashboard': 'Dashboard',
    'side.realtime': 'Real-Time',
    'side.realtime_metrics': 'Real-Time Metrics',
    'side.charts': 'Charts',
    'side.update': 'Refresh: 2s',
    'metric.operative_speed': 'Operative Speed',
    'metric.cognitive_load': 'Cognitive Load',
    'metric.sla_sync': 'SLA Sync',
    'metric.active_projects': 'Active Projects',
    'metric.no_change': 'no change',
    'chart.latency': 'Latency (ms)',
    'chart.projects': 'Projects',
    'op.title': 'Operative Order',
    'op.mode': 'Operation Mode',
    'op.creativity': 'Creativity',
    'op.injectors': 'Injectors',
    'op.winning': 'Winning Prompts',
    'op.mission_placeholder': "Write today's mission...",
    'op.save_prompt': 'Save Winning Prompt',
    'op.no_prompts': 'No saved prompts yet',
    'op.mode.seo': 'Strategic SEO',
    'op.mode.seo.desc': 'Keywords, search intent, clusters',
    'op.mode.fullstack': 'Full-Stack Dev',
    'op.mode.fullstack.desc': 'React, Remix, clean backend',
    'op.mode.copywriter': 'Copywriter',
    'op.mode.copywriter.desc': 'Slogans, landing, conversion',
    'op.mode.debug': 'Debug Mode',
    'op.mode.debug.desc': 'Quick errors, console, logs',
    'op.creat.precision': 'Surgical Precision',
    'op.creat.balanced': 'Balanced',
    'op.creat.brainstorm': 'Brainstorm',
    'op.inj.concise': 'Extreme Concision',
    'op.inj.concise.desc': 'No greetings, just the solution',
    'op.inj.human': 'Human Explanation',
    'op.inj.human.desc': 'Like a partner, not a manual',
    'op.inj.markdown': 'Markdown Format',
    'op.inj.markdown.desc': 'Tables, bold and lists',
  },
  PT: {
    'side.metrics': 'Métricas',
    'side.dashboard': 'Painel',
    'side.realtime': 'Tempo Real',
    'side.realtime_metrics': 'Métricas em Tempo Real',
    'side.charts': 'Gráficos',
    'side.update': 'Atualização: 2s',
    'metric.operative_speed': 'Velocidade Operativa',
    'metric.cognitive_load': 'Carga Cognitiva',
    'metric.sla_sync': 'Sincronia SLA',
    'metric.active_projects': 'Projetos Ativos',
    'metric.no_change': 'sem alterações',
    'chart.latency': 'Latência (ms)',
    'chart.projects': 'Projetos',
    'op.title': 'Ordem Operativa',
    'op.mode': 'Modo de Operação',
    'op.creativity': 'Criatividade',
    'op.injectors': 'Injetores',
    'op.winning': 'Prompts Vencedores',
    'op.mission_placeholder': 'Escreva a missão de hoje...',
    'op.save_prompt': 'Salvar Prompt Vencedor',
    'op.no_prompts': 'Nenhum prompt salvo ainda',
    'op.mode.seo': 'SEO Estratégico',
    'op.mode.seo.desc': 'Keywords, intenção de busca, clusters',
    'op.mode.fullstack': 'Full-Stack Dev',
    'op.mode.fullstack.desc': 'React, Remix, backend limpo',
    'op.mode.copywriter': 'Copywriter',
    'op.mode.copywriter.desc': 'Slogans, landing, conversão',
    'op.mode.debug': 'Modo Debug',
    'op.mode.debug.desc': 'Erros rápidos, console, logs',
    'op.creat.precision': 'Precisão Cirúrgica',
    'op.creat.balanced': 'Equilibrado',
    'op.creat.brainstorm': 'Brainstorm',
    'op.inj.concise': 'Concisão Extrema',
    'op.inj.concise.desc': 'Sem saudações, só solução',
    'op.inj.human': 'Explicação Humana',
    'op.inj.human.desc': 'Como sócio, não como manual',
    'op.inj.markdown': 'Formato Markdown',
    'op.inj.markdown.desc': 'Tabelas, negritos e listas',
  },
  DE: {
    'side.metrics': 'Metriken',
    'side.dashboard': 'Dashboard',
    'side.realtime': 'Echtzeit',
    'side.realtime_metrics': 'Echtzeit-Metriken',
    'side.charts': 'Diagramme',
    'side.update': 'Aktualisierung: 2s',
    'metric.operative_speed': 'Operative Geschwindigkeit',
    'metric.cognitive_load': 'Kognitive Last',
    'metric.sla_sync': 'SLA-Synchronisation',
    'metric.active_projects': 'Aktive Projekte',
    'metric.no_change': 'keine Änderung',
    'chart.latency': 'Latenz (ms)',
    'chart.projects': 'Projekte',
    'op.title': 'Operative Anweisung',
    'op.mode': 'Betriebsmodus',
    'op.creativity': 'Kreativität',
    'op.injectors': 'Injektoren',
    'op.winning': 'Gewinner-Prompts',
    'op.mission_placeholder': 'Schreibe die heutige Mission...',
    'op.save_prompt': 'Gewinner-Prompt speichern',
    'op.no_prompts': 'Noch keine Prompts gespeichert',
    'op.mode.seo': 'Strategisches SEO',
    'op.mode.seo.desc': 'Keywords, Suchintention, Cluster',
    'op.mode.fullstack': 'Full-Stack Dev',
    'op.mode.fullstack.desc': 'React, Remix, sauberes Backend',
    'op.mode.copywriter': 'Copywriter',
    'op.mode.copywriter.desc': 'Slogans, Landing, Konversion',
    'op.mode.debug': 'Debug-Modus',
    'op.mode.debug.desc': 'Schnelle Fehler, Konsole, Logs',
    'op.creat.precision': 'Chirurgische Präzision',
    'op.creat.balanced': 'Ausgewogen',
    'op.creat.brainstorm': 'Brainstorming',
    'op.inj.concise': 'Extreme Prägnanz',
    'op.inj.concise.desc': 'Keine Grüße, nur Lösung',
    'op.inj.human': 'Menschliche Erklärung',
    'op.inj.human.desc': 'Wie ein Partner, nicht wie ein Handbuch',
    'op.inj.markdown': 'Markdown-Format',
    'op.inj.markdown.desc': 'Tabellen, Fett und Listen',
  },
  IT: {
    'side.metrics': 'Metriche',
    'side.dashboard': 'Dashboard',
    'side.realtime': 'Tempo Reale',
    'side.realtime_metrics': 'Metriche in Tempo Reale',
    'side.charts': 'Grafici',
    'side.update': 'Aggiornamento: 2s',
    'metric.operative_speed': 'Velocità Operativa',
    'metric.cognitive_load': 'Carico Cognitivo',
    'metric.sla_sync': 'Sincronia SLA',
    'metric.active_projects': 'Progetti Attivi',
    'metric.no_change': 'nessun cambiamento',
    'chart.latency': 'Latenza (ms)',
    'chart.projects': 'Progetti',
    'op.title': 'Ordine Operativo',
    'op.mode': 'Modalità Operativa',
    'op.creativity': 'Creatività',
    'op.injectors': 'Iniettori',
    'op.winning': 'Prompt Vincenti',
    'op.mission_placeholder': 'Scrivi la missione di oggi...',
    'op.save_prompt': 'Salva Prompt Vincente',
    'op.no_prompts': 'Nessun prompt salvato',
    'op.mode.seo': 'SEO Strategico',
    'op.mode.seo.desc': 'Keywords, intento di ricerca, cluster',
    'op.mode.fullstack': 'Full-Stack Dev',
    'op.mode.fullstack.desc': 'React, Remix, backend pulito',
    'op.mode.copywriter': 'Copywriter',
    'op.mode.copywriter.desc': 'Slogan, landing, conversione',
    'op.mode.debug': 'Modalità Debug',
    'op.mode.debug.desc': 'Errori rapidi, console, log',
    'op.creat.precision': 'Precisione Chirurgica',
    'op.creat.balanced': 'Bilanciato',
    'op.creat.brainstorm': 'Brainstorming',
    'op.inj.concise': 'Concisione Estrema',
    'op.inj.concise.desc': 'Niente saluti, solo soluzione',
    'op.inj.human': 'Spiegazione Umana',
    'op.inj.human.desc': 'Come un socio, non un manuale',
    'op.inj.markdown': 'Formato Markdown',
    'op.inj.markdown.desc': 'Tabelle, grassetto e liste',
  },
  FR: {
    'side.metrics': 'Métriques',
    'side.dashboard': 'Tableau de bord',
    'side.realtime': 'Temps Réel',
    'side.realtime_metrics': 'Métriques en Temps Réel',
    'side.charts': 'Graphiques',
    'side.update': 'Mise à jour : 2s',
    'metric.operative_speed': 'Vitesse Opérationnelle',
    'metric.cognitive_load': 'Charge Cognitive',
    'metric.sla_sync': 'Synchronisation SLA',
    'metric.active_projects': 'Projets Actifs',
    'metric.no_change': 'aucun changement',
    'chart.latency': 'Latence (ms)',
    'chart.projects': 'Projets',
    'op.title': 'Ordre Opérationnel',
    'op.mode': "Mode d'Opération",
    'op.creativity': 'Créativité',
    'op.injectors': 'Injecteurs',
    'op.winning': 'Prompts Gagnants',
    'op.mission_placeholder': "Écris la mission d'aujourd'hui...",
    'op.save_prompt': 'Enregistrer le Prompt Gagnant',
    'op.no_prompts': 'Aucun prompt enregistré',
    'op.mode.seo': 'SEO Stratégique',
    'op.mode.seo.desc': 'Mots-clés, intention de recherche, clusters',
    'op.mode.fullstack': 'Full-Stack Dev',
    'op.mode.fullstack.desc': 'React, Remix, backend propre',
    'op.mode.copywriter': 'Copywriter',
    'op.mode.copywriter.desc': 'Slogans, landing, conversion',
    'op.mode.debug': 'Mode Debug',
    'op.mode.debug.desc': 'Erreurs rapides, console, logs',
    'op.creat.precision': 'Précision Chirurgicale',
    'op.creat.balanced': 'Équilibré',
    'op.creat.brainstorm': 'Brainstorming',
    'op.inj.concise': 'Concision Extrême',
    'op.inj.concise.desc': 'Pas de salutations, juste la solution',
    'op.inj.human': 'Explication Humaine',
    'op.inj.human.desc': 'Comme un associé, pas un manuel',
    'op.inj.markdown': 'Format Markdown',
    'op.inj.markdown.desc': 'Tableaux, gras et listes',
  },
} as const;

const translations: Record<Language, Record<string, string>> = {
  ES: {
    ...sidebarKeys.ES,
    'nav.docs': 'Mis Documentos',
    'nav.save': 'Guardar',
    'nav.settings': 'Ajustes',
    'nav.history': 'Historial',
    'nav.exit': 'Salir',
    'nav.integrations': 'Centro de Integraciones',
    'chat.placeholder': 'Escribe tu mensaje...',
    'chat.start': 'Escribe o habla para comenzar',
    'chat.error': 'Lo siento, hubo un error al procesar tu mensaje.',
    'feature.coming_soon': 'Funcion proximamente',
    'toast.docs': 'Abriendo documentos...',
    'toast.save': 'Proyecto guardado correctamente',
    'toast.settings': 'Panel de ajustes abierto',
    'toast.history': 'Cargando historial...',
    'toast.exit': 'Cerrando sesion...',
    'toast.language': 'Idioma cambiado a',
  },
  EN: {
    ...sidebarKeys.EN,
    'nav.docs': 'My Documents',
    'nav.save': 'Save',
    'nav.settings': 'Settings',
    'nav.history': 'History',
    'nav.exit': 'Exit',
    'nav.integrations': 'Integration Center',
    'chat.placeholder': 'Type your message...',
    'chat.start': 'Type or speak to start',
    'chat.error': 'Sorry, there was an error processing your message.',
    'feature.coming_soon': 'Feature coming soon',
    'toast.docs': 'Opening documents...',
    'toast.save': 'Project saved successfully',
    'toast.settings': 'Settings panel opened',
    'toast.history': 'Loading history...',
    'toast.exit': 'Signing out...',
    'toast.language': 'Language changed to',
  },
  PT: {
    ...sidebarKeys.PT,
    'nav.docs': 'Meus Documentos',
    'nav.save': 'Salvar',
    'nav.settings': 'Configuracoes',
    'nav.history': 'Historico',
    'nav.exit': 'Sair',
    'nav.integrations': 'Central de Integracoes',
    'chat.placeholder': 'Digite sua mensagem...',
    'chat.start': 'Digite ou fale para comecar',
    'chat.error': 'Desculpe, houve um erro ao processar sua mensagem.',
    'feature.coming_soon': 'Recurso em breve',
    'toast.docs': 'Abrindo documentos...',
    'toast.save': 'Projeto salvo com sucesso',
    'toast.settings': 'Painel de configuracoes aberto',
    'toast.history': 'Carregando historico...',
    'toast.exit': 'Saindo...',
    'toast.language': 'Idioma alterado para',
  },
  DE: {
    ...sidebarKeys.DE,
    'nav.docs': 'Meine Dokumente',
    'nav.save': 'Speichern',
    'nav.settings': 'Einstellungen',
    'nav.history': 'Verlauf',
    'nav.exit': 'Beenden',
    'nav.integrations': 'Integrationszentrum',
    'chat.placeholder': 'Nachricht eingeben...',
    'chat.start': 'Tippen oder sprechen Sie, um zu beginnen',
    'chat.error': 'Entschuldigung, es gab einen Fehler bei der Verarbeitung.',
    'feature.coming_soon': 'Funktion bald verfugbar',
    'toast.docs': 'Dokumente werden geoffnet...',
    'toast.save': 'Projekt erfolgreich gespeichert',
    'toast.settings': 'Einstellungspanel geoffnet',
    'toast.history': 'Verlauf wird geladen...',
    'toast.exit': 'Abmelden...',
    'toast.language': 'Sprache geandert zu',
  },
  IT: {
    ...sidebarKeys.IT,
    'nav.docs': 'I Miei Documenti',
    'nav.save': 'Salva',
    'nav.settings': 'Impostazioni',
    'nav.history': 'Cronologia',
    'nav.exit': 'Esci',
    'nav.integrations': 'Centro Integrazioni',
    'chat.placeholder': 'Scrivi il tuo messaggio...',
    'chat.start': 'Scrivi o parla per iniziare',
    'chat.error': 'Spiacente, si e verificato un errore.',
    'feature.coming_soon': 'Funzionalita in arrivo',
    'toast.docs': 'Apertura documenti...',
    'toast.save': 'Progetto salvato con successo',
    'toast.settings': 'Pannello impostazioni aperto',
    'toast.history': 'Caricamento cronologia...',
    'toast.exit': 'Disconnessione...',
    'toast.language': 'Lingua cambiata in',
  },
  FR: {
    ...sidebarKeys.FR,
    'nav.docs': 'Mes Documents',
    'nav.save': 'Enregistrer',
    'nav.settings': 'Parametres',
    'nav.history': 'Historique',
    'nav.exit': 'Quitter',
    'nav.integrations': 'Centre d Integrations',
    'chat.placeholder': 'Tapez votre message...',
    'chat.start': 'Tapez ou parlez pour commencer',
    'chat.error': 'Desole, une erreur s est produite.',
    'feature.coming_soon': 'Fonctionnalite a venir',
    'toast.docs': 'Ouverture des documents...',
    'toast.save': 'Projet enregistre avec succes',
    'toast.settings': 'Panneau des parametres ouvert',
    'toast.history': 'Chargement de l historique...',
    'toast.exit': 'Deconnexion...',
    'toast.language': 'Langue changee en',
  },
  NL: {
    ...sidebarKeys.EN,
    'nav.docs': 'Mijn Documenten',
    'nav.save': 'Opslaan',
    'nav.settings': 'Instellingen',
    'nav.history': 'Geschiedenis',
    'nav.exit': 'Afsluiten',
    'nav.integrations': 'Integratiecentrum',
    'chat.placeholder': 'Typ je bericht...',
    'chat.start': 'Typ of spreek om te beginnen',
    'chat.error': 'Sorry, er is een fout opgetreden bij het verwerken van je bericht.',
    'feature.coming_soon': 'Functie binnenkort beschikbaar',
    'toast.docs': 'Documenten openen...',
    'toast.save': 'Project succesvol opgeslagen',
    'toast.settings': 'Instellingenpaneel geopend',
    'toast.history': 'Geschiedenis laden...',
    'toast.exit': 'Uitloggen...',
    'toast.language': 'Taal gewijzigd naar',
  },
  PL: {
    ...sidebarKeys.EN,
    'nav.docs': 'Moje Dokumenty',
    'nav.save': 'Zapisz',
    'nav.settings': 'Ustawienia',
    'nav.history': 'Historia',
    'nav.exit': 'Wyjdź',
    'nav.integrations': 'Centrum Integracji',
    'chat.placeholder': 'Wpisz wiadomość...',
    'chat.start': 'Wpisz lub powiedz, aby zacząć',
    'chat.error': 'Przepraszamy, wystąpił błąd podczas przetwarzania wiadomości.',
    'feature.coming_soon': 'Funkcja wkrótce dostępna',
    'toast.docs': 'Otwieranie dokumentów...',
    'toast.save': 'Projekt zapisany pomyślnie',
    'toast.settings': 'Panel ustawień otwarty',
    'toast.history': 'Ładowanie historii...',
    'toast.exit': 'Wylogowywanie...',
    'toast.language': 'Język zmieniony na',
  },
};

const languageNames: Record<Language, string> = {
  EN: 'English',
  ES: 'Espanol',
  PT: 'Portugues',
  DE: 'Deutsch',
  IT: 'Italiano',
  FR: 'Francais',
  NL: 'Nederlands',
  PL: 'Polski',
};

export const getLanguageName = (lang: Language): string => languageNames[lang];

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    const savedLanguage = normalizeAppLanguage(saved);
    if (savedLanguage) return savedLanguage;

    const landingLang = getStoredLandingLang() || getBrowserLandingLang();
    return mapLandingLangToAppLanguage(landingLang);
  });

  const setLanguage = useCallback((lang: Language) => {
    const next = normalizeAppLanguage(lang) || 'ES';
    setLanguageState(next);
    localStorage.setItem('app_language', next);
    localStorage.setItem('eq_landing_lang', mapAppLanguageToLandingLang(next));
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'app_language' || !event.newValue) return;
      const next = normalizeAppLanguage(event.newValue);
      if (!next) return;
      setLanguageState(next);
      localStorage.setItem('eq_landing_lang', mapAppLanguageToLandingLang(next));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations.ES[key] || key;
  }, [language]);

  const value: LanguageContextType = { language, setLanguage, t };

  return React.createElement(
    LanguageContext.Provider,
    { value },
    children
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
