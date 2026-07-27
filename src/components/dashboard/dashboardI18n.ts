import type { Language } from '@/hooks/useLanguage';

export type DashboardToolKey =
  | 'create_image'
  | 'canvas_organize'
  | 'deep_research'
  | 'create_video_brief'
  | 'create_music_brief'
  | 'learn'
  | 'prompt_engineer'
  | 'generate_report'
  | 'market_analysis'
  | 'project_metrics'
  | 'mascot';

export type DashboardToolText = {
  label: string;
  description: string;
  placeholder: string;
};

export const HEADER_UI_COPY: Record<
  Language,
  {
    subscriptions: string;
    openRoadmap: string;
    zoomIn: string;
    zoomOut: string;
  }
> = {
  EN: { subscriptions: 'Subscriptions', openRoadmap: 'Open project map', zoomIn: 'Zoom in', zoomOut: 'Zoom out' },
  ES: { subscriptions: 'Suscripciones', openRoadmap: 'Abrir hoja de ruta', zoomIn: 'Aumentar vista', zoomOut: 'Reducir vista' },
  PT: { subscriptions: 'Assinaturas', openRoadmap: 'Abrir roteiro', zoomIn: 'Aumentar vista', zoomOut: 'Reduzir vista' },
  FR: { subscriptions: 'Abonnements', openRoadmap: 'Ouvrir la feuille de route', zoomIn: 'Agrandir la vue', zoomOut: 'Reduire la vue' },
  DE: { subscriptions: 'Abos', openRoadmap: 'Projektplan offnen', zoomIn: 'Ansicht vergroessern', zoomOut: 'Ansicht verkleinern' },
  IT: { subscriptions: 'Abbonamenti', openRoadmap: 'Apri roadmap', zoomIn: 'Aumenta vista', zoomOut: 'Riduci vista' },
  NL: { subscriptions: 'Abonnementen', openRoadmap: 'Open projectkaart', zoomIn: 'Vergroot weergave', zoomOut: 'Verklein weergave' },
  PL: { subscriptions: 'Subskrypcje', openRoadmap: 'Otworz mape projektu', zoomIn: 'Powieksz widok', zoomOut: 'Zmniejsz widok' },
};

export const AGENT_UI_COPY: Record<
  Language,
  {
    defaultTasks: string[];
    immediateExecution: (agentName: string) => string;
    initialEngine: (engine: string) => string;
    agentContext: (context: string) => string;
    objective: string;
    startHint: string;
    ready: (agentName: string) => string;
    greeting: (userName: string) => string;
    beforeExecute: string;
    kickoff: string;
    startupOptions: string;
    executeProposal: (proposalIndex: number, agentName: string, proposal: string) => string;
    connectPermissions: string;
    googleWorkspaceReason: string;
    permissionRequired: (provider: string) => string;
    permissionFallback: string;
    focusMode: string;
    like: string;
    dislike: string;
    delete: string;
  }
> = {
  EN: {
    defaultTasks: ['Find strategic north', 'Activate the required agents', 'Audit performance and permissions'],
    immediateExecution: (agentName) => `Immediate execution with ${agentName}.`,
    initialEngine: (engine) => `Starting engine: ${engine}.`,
    agentContext: (context) => `Agent context: ${context}`,
    objective: 'Goal: find the user strategic north, propose the minimum agent squad, open an operating project, define performance metrics, auditing, control, and required permissions.',
    startHint: 'Start with proposal 1 unless the user chooses another.',
    ready: (agentName) => `**${agentName} ready to operate.**`,
    greeting: (userName) => `Hello ${userName}. I already understood that this agent was chosen as the entry point.`,
    beforeExecute: 'Before we execute, we will open the project root document and register the next task.',
    kickoff: 'Complete this quick kickoff: operating role, trunk, available time, weekly hours, and next micro-action.',
    startupOptions: 'Launch options',
    executeProposal: (proposalIndex, agentName, proposal) => `Run proposal ${proposalIndex} with ${agentName}: ${proposal}`,
    connectPermissions: 'Connect permissions if needed',
    googleWorkspaceReason: 'This execution needs Gmail, Drive, Calendar, or Sheets to read real data and act with explicit permission.',
    permissionRequired: (provider) => `**Permission required: ${provider}.**`,
    permissionFallback: 'I will open the integrations center so you can confirm access. Without confirmation, the agent will work with manual data or files uploaded by you.',
    focusMode: 'Meta-Learning focus mode',
    like: 'Like',
    dislike: 'Dislike',
    delete: 'Delete',
  },
  ES: {
    defaultTasks: ['Buscar norte estrategico', 'Activar los agentes necesarios', 'Auditar rendimiento y permisos'],
    immediateExecution: (agentName) => `Ejecucion inmediata con ${agentName}.`,
    initialEngine: (engine) => `Motor inicial: ${engine}.`,
    agentContext: (context) => `Contexto del agente: ${context}`,
    objective: 'Objetivo: encontrar el norte estrategico del usuario, proponer el squad minimo de agentes, abrir un proyecto operativo, definir metricas de rendimiento, auditoria, control y permisos requeridos.',
    startHint: 'Empeza por la propuesta 1 salvo que el usuario elija otra.',
    ready: (agentName) => `**${agentName} listo para operar.**`,
    greeting: (userName) => `Hola ${userName}. Ya entendi que este agente fue elegido como punto de entrada.`,
    beforeExecute: 'Antes de ejecutar, vamos a abrir el documento raiz del proyecto y dejar registrada la proxima tarea.',
    kickoff: 'Completa este kickoff rapido: rol operativo, tronco, tiempo disponible, horas semanales y siguiente micro-accion.',
    startupOptions: 'Opciones de arranque',
    executeProposal: (proposalIndex, agentName, proposal) => `Ejecutar propuesta ${proposalIndex} con ${agentName}: ${proposal}`,
    connectPermissions: 'Conectar permisos si hacen falta',
    googleWorkspaceReason: 'Esta ejecucion necesita Gmail, Drive, Calendar o Sheets para leer datos reales y accionar con permiso explicito.',
    permissionRequired: (provider) => `**Permiso requerido: ${provider}.**`,
    permissionFallback: 'Voy a abrir el centro de integraciones para que confirmes el acceso. Sin confirmacion, el agente trabaja con datos manuales o archivos cargados por vos.',
    focusMode: 'Meta-Learning focus mode',
    like: 'Me gusta',
    dislike: 'No me gusta',
    delete: 'Eliminar',
  },
  PT: {
    defaultTasks: ['Encontrar o norte estrategico', 'Ativar os agentes necessarios', 'Auditar desempenho e permissoes'],
    immediateExecution: (agentName) => `Execucao imediata com ${agentName}.`,
    initialEngine: (engine) => `Motor inicial: ${engine}.`,
    agentContext: (context) => `Contexto do agente: ${context}`,
    objective: 'Objetivo: encontrar o norte estrategico do usuario, propor o squad minimo de agentes, abrir um projeto operacional, definir metricas de desempenho, auditoria, controle e permissoes necessarias.',
    startHint: 'Comece pela proposta 1, a menos que o usuario escolha outra.',
    ready: (agentName) => `**${agentName} pronto para operar.**`,
    greeting: (userName) => `Ola ${userName}. Ja entendi que este agente foi escolhido como ponto de entrada.`,
    beforeExecute: 'Antes de executar, vamos abrir o documento raiz do projeto e registrar a proxima tarefa.',
    kickoff: 'Complete este kickoff rapido: papel operacional, tronco, tempo disponivel, horas semanais e proxima microacao.',
    startupOptions: 'Opcoes de arranque',
    executeProposal: (proposalIndex, agentName, proposal) => `Executar proposta ${proposalIndex} com ${agentName}: ${proposal}`,
    connectPermissions: 'Conectar permissoes se necessario',
    googleWorkspaceReason: 'Esta execucao precisa de Gmail, Drive, Calendar ou Sheets para ler dados reais e agir com permissao explicita.',
    permissionRequired: (provider) => `**Permissao necessaria: ${provider}.**`,
    permissionFallback: 'Vou abrir o centro de integracoes para voce confirmar o acesso. Sem confirmacao, o agente trabalha com dados manuais ou arquivos enviados por voce.',
    focusMode: 'Modo Meta-Learning',
    like: 'Curtir',
    dislike: 'Nao curtir',
    delete: 'Excluir',
  },
  FR: {
    defaultTasks: ['Trouver le nord strategique', 'Activer les agents necessaires', 'Auditer la performance et les permissions'],
    immediateExecution: (agentName) => `Execution immediate avec ${agentName}.`,
    initialEngine: (engine) => `Moteur initial: ${engine}.`,
    agentContext: (context) => `Contexte de lagent: ${context}`,
    objective: 'Objectif: trouver le nord strategique de l utilisateur, proposer le squad minimum d agents, ouvrir un projet operationnel, definir les metriques de performance, laudit, le controle et les permissions requises.',
    startHint: 'Commence par la proposition 1 sauf si l utilisateur en choisit une autre.',
    ready: (agentName) => `**${agentName} pret a operer.**`,
    greeting: (userName) => `Bonjour ${userName}. Jai deja compris que cet agent a ete choisi comme point dentree.`,
    beforeExecute: 'Avant dexecuter, nous allons ouvrir le document racine du projet et enregistrer la prochaine tache.',
    kickoff: 'Complete ce kickoff rapide: role operationnel, tronc, temps disponible, heures hebdomadaires et prochaine micro-action.',
    startupOptions: 'Options de lancement',
    executeProposal: (proposalIndex, agentName, proposal) => `Executer la proposition ${proposalIndex} avec ${agentName}: ${proposal}`,
    connectPermissions: 'Connecter les permissions si besoin',
    googleWorkspaceReason: 'Cette execution a besoin de Gmail, Drive, Calendar ou Sheets pour lire des donnees reelles et agir avec une permission explicite.',
    permissionRequired: (provider) => `**Permission requise: ${provider}.**`,
    permissionFallback: 'Je vais ouvrir le centre d integrations pour que tu confirmes lacces. Sans confirmation, lagent travaillera avec des donnees manuelles ou des fichiers envoyes par toi.',
    focusMode: 'Mode Meta-Learning',
    like: 'Jaime',
    dislike: 'Je naime pas',
    delete: 'Supprimer',
  },
  DE: {
    defaultTasks: ['Strategischen Norden finden', 'Notige Agenten aktivieren', 'Leistung und Berechtigungen pruefen'],
    immediateExecution: (agentName) => `Sofortige Ausfuehrung mit ${agentName}.`,
    initialEngine: (engine) => `Startmodell: ${engine}.`,
    agentContext: (context) => `Agentenkontext: ${context}`,
    objective: 'Ziel: den strategischen Norden des Nutzers finden, das minimale Agenten-Squad vorschlagen, ein operatives Projekt oeffnen sowie Leistungsmetriken, Audit, Kontrolle und erforderliche Berechtigungen definieren.',
    startHint: 'Starte mit Vorschlag 1, falls der Nutzer keinen anderen waehlt.',
    ready: (agentName) => `**${agentName} ist einsatzbereit.**`,
    greeting: (userName) => `Hallo ${userName}. Ich habe bereits verstanden, dass dieser Agent als Einstiegspunkt gewaehlt wurde.`,
    beforeExecute: 'Bevor wir starten, oeffnen wir das Root-Dokument des Projekts und erfassen die naechste Aufgabe.',
    kickoff: 'Vervollstaendige dieses schnelle Kickoff: operative Rolle, Stamm, verfuegbare Zeit, Wochenstunden und naechste Mikroaktion.',
    startupOptions: 'Startoptionen',
    executeProposal: (proposalIndex, agentName, proposal) => `Vorschlag ${proposalIndex} mit ${agentName} ausfuehren: ${proposal}`,
    connectPermissions: 'Berechtigungen bei Bedarf verbinden',
    googleWorkspaceReason: 'Diese Ausfuehrung benoetigt Gmail, Drive, Calendar oder Sheets, um echte Daten zu lesen und mit expliziter Erlaubnis zu handeln.',
    permissionRequired: (provider) => `**Erforderliche Berechtigung: ${provider}.**`,
    permissionFallback: 'Ich oeffne das Integrationszentrum, damit du den Zugriff bestaetigst. Ohne Bestaetigung arbeitet der Agent mit manuellen Daten oder von dir hochgeladenen Dateien.',
    focusMode: 'Meta-Learning Modus',
    like: 'Gefaellt mir',
    dislike: 'Gefaellt mir nicht',
    delete: 'Loeschen',
  },
  IT: {
    defaultTasks: ['Trovare il nord strategico', 'Attivare gli agenti necessari', 'Verificare performance e permessi'],
    immediateExecution: (agentName) => `Esecuzione immediata con ${agentName}.`,
    initialEngine: (engine) => `Motore iniziale: ${engine}.`,
    agentContext: (context) => `Contesto dell agente: ${context}`,
    objective: 'Obiettivo: trovare il nord strategico dell utente, proporre il team minimo di agenti, aprire un progetto operativo e definire metriche di performance, audit, controllo e permessi richiesti.',
    startHint: 'Inizia dalla proposta 1 salvo che l utente scelga un altra opzione.',
    ready: (agentName) => `**${agentName} pronto a operare.**`,
    greeting: (userName) => `Ciao ${userName}. Ho gia capito che questo agente e stato scelto come punto di ingresso.`,
    beforeExecute: 'Prima di eseguire, apriremo il documento radice del progetto e registreremo la prossima attivita.',
    kickoff: 'Completa questo kickoff rapido: ruolo operativo, tronco, tempo disponibile, ore settimanali e prossima micro-azione.',
    startupOptions: 'Opzioni di avvio',
    executeProposal: (proposalIndex, agentName, proposal) => `Esegui proposta ${proposalIndex} con ${agentName}: ${proposal}`,
    connectPermissions: 'Collega i permessi se necessario',
    googleWorkspaceReason: 'Questa esecuzione richiede Gmail, Drive, Calendar o Sheets per leggere dati reali e agire con autorizzazione esplicita.',
    permissionRequired: (provider) => `**Permesso richiesto: ${provider}.**`,
    permissionFallback: 'Apriro il centro integrazioni per permetterti di confermare l accesso. Senza conferma, l agente lavorera con dati manuali o file caricati da te.',
    focusMode: 'Modalita Meta-Learning',
    like: 'Mi piace',
    dislike: 'Non mi piace',
    delete: 'Elimina',
  },
  NL: {
    defaultTasks: ['Zoek het strategische noorden', 'Activeer de nodige agents', 'Controleer prestaties en rechten'],
    immediateExecution: (agentName) => `Directe uitvoering met ${agentName}.`,
    initialEngine: (engine) => `Startmotor: ${engine}.`,
    agentContext: (context) => `Agentcontext: ${context}`,
    objective: 'Doel: het strategische noorden van de gebruiker vinden, het minimale agententeam voorstellen, een operationeel project openen en prestatie-metrieken, audit, controle en vereiste rechten vastleggen.',
    startHint: 'Begin met voorstel 1 tenzij de gebruiker iets anders kiest.',
    ready: (agentName) => `**${agentName} is klaar om te werken.**`,
    greeting: (userName) => `Hallo ${userName}. Ik begrijp al dat deze agent als ingangspunt is gekozen.`,
    beforeExecute: 'Voordat we uitvoeren, openen we het rootdocument van het project en leggen we de volgende taak vast.',
    kickoff: 'Vul deze snelle kickoff in: operationele rol, stam, beschikbare tijd, wekelijkse uren en volgende micro-actie.',
    startupOptions: 'Startopties',
    executeProposal: (proposalIndex, agentName, proposal) => `Voer voorstel ${proposalIndex} uit met ${agentName}: ${proposal}`,
    connectPermissions: 'Verbind rechten indien nodig',
    googleWorkspaceReason: 'Deze uitvoering heeft Gmail, Drive, Calendar of Sheets nodig om echte data te lezen en met expliciete toestemming te handelen.',
    permissionRequired: (provider) => `**Vereiste toestemming: ${provider}.**`,
    permissionFallback: 'Ik open het integratiecentrum zodat je de toegang kunt bevestigen. Zonder bevestiging werkt de agent met handmatige data of bestanden die jij uploadt.',
    focusMode: 'Meta-Learning modus',
    like: 'Vind ik leuk',
    dislike: 'Vind ik niet leuk',
    delete: 'Verwijderen',
  },
  PL: {
    defaultTasks: ['Znajdz strategiczny kierunek', 'Aktywuj potrzebnych agentow', 'Sprawdz wydajnosc i uprawnienia'],
    immediateExecution: (agentName) => `Natychmiastowe wykonanie z ${agentName}.`,
    initialEngine: (engine) => `Silnik startowy: ${engine}.`,
    agentContext: (context) => `Kontekst agenta: ${context}`,
    objective: 'Cel: znalezc strategiczny kierunek uzytkownika, zaproponowac minimalny zespol agentow, otworzyc projekt operacyjny oraz zdefiniowac metryki wydajnosci, audyt, kontrole i wymagane uprawnienia.',
    startHint: 'Zacznij od propozycji 1, chyba ze uzytkownik wybierze inna.',
    ready: (agentName) => `**${agentName} jest gotowy do pracy.**`,
    greeting: (userName) => `Czesc ${userName}. Rozumiem juz, ze ten agent zostal wybrany jako punkt startowy.`,
    beforeExecute: 'Przed uruchomieniem otworzymy dokument glownego rdzenia projektu i zapiszemy kolejne zadanie.',
    kickoff: 'Uzupelnij szybki kickoff: rola operacyjna, rdzen, dostepny czas, tygodniowe godziny i kolejna mikro-akcja.',
    startupOptions: 'Opcje startowe',
    executeProposal: (proposalIndex, agentName, proposal) => `Uruchom propozycje ${proposalIndex} z ${agentName}: ${proposal}`,
    connectPermissions: 'Polacz uprawnienia w razie potrzeby',
    googleWorkspaceReason: 'To wykonanie wymaga Gmaila, Drive, Calendar lub Sheets, aby czytac prawdziwe dane i dzialac za wyrazna zgoda.',
    permissionRequired: (provider) => `**Wymagane uprawnienie: ${provider}.**`,
    permissionFallback: 'Otworze centrum integracji, aby potwierdzic dostep. Bez potwierdzenia agent bedzie pracowal na danych recznych lub plikach przeslanych przez ciebie.',
    focusMode: 'Tryb Meta-Learning',
    like: 'Lubię to',
    dislike: 'Nie lubię',
    delete: 'Usun',
  },
};

export const INLINE_TOOLS_COPY: Record<
  Language,
  {
    panelTitle: string;
    panelSubtitle: string;
    learnToastTitle: string;
    learnToastDescription: string;
    tools: Record<DashboardToolKey, DashboardToolText>;
  }
> = {
  EN: {
    panelTitle: 'Tool Center',
    panelSubtitle: 'agent tool routing',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Opening...',
    tools: {
      create_image: { label: 'Create image', description: 'Generative AI', placeholder: 'Describe the image...' },
      canvas_organize: { label: 'Canvas', description: 'Mind map', placeholder: 'Paste your notes...' },
      deep_research: { label: 'Deep Research', description: 'Research', placeholder: 'What should we research?' },
      create_video_brief: { label: 'Video', description: 'Production brief', placeholder: 'Describe the video...' },
      create_music_brief: { label: 'Music', description: 'Music brief', placeholder: 'Describe the song...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Best prompts', placeholder: 'What do you want to achieve?' },
      generate_report: { label: 'Report', description: 'Executive', placeholder: 'What topic?' },
      market_analysis: { label: 'Market', description: 'TAM/SAM/SOM', placeholder: 'Company or sector...' },
      project_metrics: { label: 'Metrics', description: 'Project KPIs', placeholder: 'Name and context...' },
      mascot: { label: 'AI Mascot', description: 'Companion', placeholder: '' },
    },
  },
  ES: {
    panelTitle: 'Centro de Herramientas',
    panelSubtitle: 'ruteo de herramientas del agente',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Abriendo...',
    tools: {
      create_image: { label: 'Crear imagen', description: 'IA generativa', placeholder: 'Describe la imagen...' },
      canvas_organize: { label: 'Canvas', description: 'Mapa mental', placeholder: 'Pega tus notas...' },
      deep_research: { label: 'Deep Research', description: 'Investigacion', placeholder: 'Que investigar?' },
      create_video_brief: { label: 'Video', description: 'Brief de produccion', placeholder: 'Describe el video...' },
      create_music_brief: { label: 'Musica', description: 'Brief musical', placeholder: 'Describe la cancion...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Prompts optimos', placeholder: 'Que quieres lograr?' },
      generate_report: { label: 'Reporte', description: 'Ejecutivo', placeholder: 'Sobre que tema?' },
      market_analysis: { label: 'Mercado', description: 'TAM/SAM/SOM', placeholder: 'Empresa o sector...' },
      project_metrics: { label: 'Metricas', description: 'KPIs del proyecto', placeholder: 'Nombre y contexto...' },
      mascot: { label: 'Mascota IA', description: 'Companion', placeholder: '' },
    },
  },
  PT: {
    panelTitle: 'Centro de Ferramentas',
    panelSubtitle: 'roteamento de ferramentas do agente',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Abrindo...',
    tools: {
      create_image: { label: 'Criar imagem', description: 'IA generativa', placeholder: 'Descreva a imagem...' },
      canvas_organize: { label: 'Canvas', description: 'Mapa mental', placeholder: 'Cole suas notas...' },
      deep_research: { label: 'Deep Research', description: 'Pesquisa', placeholder: 'O que investigar?' },
      create_video_brief: { label: 'Video', description: 'Brief de producao', placeholder: 'Descreva o video...' },
      create_music_brief: { label: 'Musica', description: 'Brief musical', placeholder: 'Descreva a musica...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Prompts otimos', placeholder: 'O que voce quer atingir?' },
      generate_report: { label: 'Relatorio', description: 'Executivo', placeholder: 'Sobre qual tema?' },
      market_analysis: { label: 'Mercado', description: 'TAM/SAM/SOM', placeholder: 'Empresa ou setor...' },
      project_metrics: { label: 'Metricas', description: 'KPIs do projeto', placeholder: 'Nome e contexto...' },
      mascot: { label: 'Mascote IA', description: 'Companion', placeholder: '' },
    },
  },
  FR: {
    panelTitle: 'Centre doutils',
    panelSubtitle: 'routage des outils de lagent',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Ouverture...',
    tools: {
      create_image: { label: 'Creer image', description: 'IA generative', placeholder: 'Decris limage...' },
      canvas_organize: { label: 'Canvas', description: 'Carte mentale', placeholder: 'Colle tes notes...' },
      deep_research: { label: 'Deep Research', description: 'Recherche', placeholder: 'Que faut-il etudier?' },
      create_video_brief: { label: 'Video', description: 'Brief production', placeholder: 'Decris la video...' },
      create_music_brief: { label: 'Musique', description: 'Brief musical', placeholder: 'Decris la chanson...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Prompts optimaux', placeholder: 'Que veux-tu obtenir?' },
      generate_report: { label: 'Rapport', description: 'Executif', placeholder: 'Sur quel sujet?' },
      market_analysis: { label: 'Marche', description: 'TAM/SAM/SOM', placeholder: 'Entreprise ou secteur...' },
      project_metrics: { label: 'Metriques', description: 'KPIs du projet', placeholder: 'Nom et contexte...' },
      mascot: { label: 'Mascotte IA', description: 'Companion', placeholder: '' },
    },
  },
  DE: {
    panelTitle: 'Tool Center',
    panelSubtitle: 'werkzeug routing des agenten',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Wird geoeffnet...',
    tools: {
      create_image: { label: 'Bild erstellen', description: 'Generative KI', placeholder: 'Beschreibe das Bild...' },
      canvas_organize: { label: 'Canvas', description: 'Mindmap', placeholder: 'Fuege deine Notizen ein...' },
      deep_research: { label: 'Deep Research', description: 'Recherche', placeholder: 'Was soll untersucht werden?' },
      create_video_brief: { label: 'Video', description: 'Produktionsbrief', placeholder: 'Beschreibe das Video...' },
      create_music_brief: { label: 'Musik', description: 'Musikbrief', placeholder: 'Beschreibe den Song...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Optimale Prompts', placeholder: 'Was willst du erreichen?' },
      generate_report: { label: 'Bericht', description: 'Executive', placeholder: 'Zu welchem Thema?' },
      market_analysis: { label: 'Markt', description: 'TAM/SAM/SOM', placeholder: 'Firma oder Sektor...' },
      project_metrics: { label: 'Metriken', description: 'Projekt KPIs', placeholder: 'Name und Kontext...' },
      mascot: { label: 'KI Maskottchen', description: 'Companion', placeholder: '' },
    },
  },
  IT: {
    panelTitle: 'Centro Strumenti',
    panelSubtitle: 'routing strumenti dell agente',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Apertura...',
    tools: {
      create_image: { label: 'Crea immagine', description: 'IA generativa', placeholder: 'Descrivi limmagine...' },
      canvas_organize: { label: 'Canvas', description: 'Mappa mentale', placeholder: 'Incolla le tue note...' },
      deep_research: { label: 'Deep Research', description: 'Ricerca', placeholder: 'Cosa vuoi analizzare?' },
      create_video_brief: { label: 'Video', description: 'Brief produzione', placeholder: 'Descrivi il video...' },
      create_music_brief: { label: 'Musica', description: 'Brief musicale', placeholder: 'Descrivi la canzone...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Prompt ottimali', placeholder: 'Cosa vuoi ottenere?' },
      generate_report: { label: 'Report', description: 'Esecutivo', placeholder: 'Su quale tema?' },
      market_analysis: { label: 'Mercato', description: 'TAM/SAM/SOM', placeholder: 'Azienda o settore...' },
      project_metrics: { label: 'Metriche', description: 'KPI progetto', placeholder: 'Nome e contesto...' },
      mascot: { label: 'Mascotte IA', description: 'Companion', placeholder: '' },
    },
  },
  NL: {
    panelTitle: 'Toolcentrum',
    panelSubtitle: 'tool routing van de agent',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Openen...',
    tools: {
      create_image: { label: 'Afbeelding maken', description: 'Generatieve AI', placeholder: 'Beschrijf de afbeelding...' },
      canvas_organize: { label: 'Canvas', description: 'Mindmap', placeholder: 'Plak je notities...' },
      deep_research: { label: 'Deep Research', description: 'Onderzoek', placeholder: 'Wat moeten we onderzoeken?' },
      create_video_brief: { label: 'Video', description: 'Productiebrief', placeholder: 'Beschrijf de video...' },
      create_music_brief: { label: 'Muziek', description: 'Muziekbrief', placeholder: 'Beschrijf het lied...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Sterke prompts', placeholder: 'Wat wil je bereiken?' },
      generate_report: { label: 'Rapport', description: 'Executive', placeholder: 'Over welk onderwerp?' },
      market_analysis: { label: 'Markt', description: 'TAM/SAM/SOM', placeholder: 'Bedrijf of sector...' },
      project_metrics: { label: 'Metrieken', description: 'Project KPIs', placeholder: 'Naam en context...' },
      mascot: { label: 'AI Mascotte', description: 'Companion', placeholder: '' },
    },
  },
  PL: {
    panelTitle: 'Centrum Narzedzi',
    panelSubtitle: 'routing narzedzi agenta',
    learnToastTitle: 'Ultralearning Roadmap',
    learnToastDescription: 'Otwieranie...',
    tools: {
      create_image: { label: 'Stworz obraz', description: 'Generatywna AI', placeholder: 'Opisz obraz...' },
      canvas_organize: { label: 'Canvas', description: 'Mapa mysli', placeholder: 'Wklej notatki...' },
      deep_research: { label: 'Deep Research', description: 'Badanie', placeholder: 'Co mam zbadac?' },
      create_video_brief: { label: 'Wideo', description: 'Brief produkcyjny', placeholder: 'Opisz wideo...' },
      create_music_brief: { label: 'Muzyka', description: 'Brief muzyczny', placeholder: 'Opisz piosenke...' },
      learn: { label: 'Learn', description: 'Roadmap', placeholder: '' },
      prompt_engineer: { label: 'Prompt Eng.', description: 'Najlepsze prompty', placeholder: 'Co chcesz osiagnac?' },
      generate_report: { label: 'Raport', description: 'Executive', placeholder: 'Na jaki temat?' },
      market_analysis: { label: 'Rynek', description: 'TAM/SAM/SOM', placeholder: 'Firma lub sektor...' },
      project_metrics: { label: 'Metryki', description: 'KPI projektu', placeholder: 'Nazwa i kontekst...' },
      mascot: { label: 'Maskotka AI', description: 'Companion', placeholder: '' },
    },
  },
};
