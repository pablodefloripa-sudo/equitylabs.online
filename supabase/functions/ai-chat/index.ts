import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  callPaidGateway,
  callAIWithCostControl,
  EQUITYLABS_PRIMARY_MODEL,
  getPaidProviderName,
  getUserPlanState,
  hasPaidAIProvider,
  LOVABLE_AI_GATEWAY_URL,
  resolveModel,
  type AgentKey,
  type ChatMessage,
  type SubscriptionPlanKey,
} from "../_shared/subscription-routing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AGENT_ONE_ID = 'ag_01';
const AGENT_ONE_MODEL = EQUITYLABS_PRIMARY_MODEL;
const AGENT_ONE_START_PROMPT = `Eres Agent 1 de EQuityLabs.
Tu modelo obligatorio es qwen/qwen3-vl-8b-thinking.
Tu primera tarea es recibir al usuario por su nombre, decir hola, presentarte con claridad y pedir el objetivo inicial.
No menciones otros modelos, no delegates, no pidas integraciones al inicio salvo que el usuario lo pida.
Responde en el idioma solicitado por el usuario, con contexto suficiente, acciones concretas y un próximo paso claro.`;

type ChatAttachment = {
  name?: string;
  mimeType?: string;
  dataUrl?: string;
  size?: number;
};

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

function sanitizeAttachments(value: unknown): ChatAttachment[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_ATTACHMENTS)
    .filter((item): item is ChatAttachment => {
      if (!item || typeof item !== 'object') return false;
      const attachment = item as ChatAttachment;
      if (typeof attachment.dataUrl !== 'string' || typeof attachment.mimeType !== 'string') return false;
      if (typeof attachment.size === 'number' && attachment.size > MAX_ATTACHMENT_BYTES) return false;
      return (
        attachment.mimeType.startsWith('image/')
        || attachment.mimeType === 'application/pdf'
      );
    });
}

function buildUserContent(message: string, attachments: ChatAttachment[]): ChatMessage['content'] {
  if (attachments.length === 0) return message;

  const content: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: message || 'Analiza los archivos adjuntos.',
    },
  ];

  for (const attachment of attachments) {
    if (!attachment.dataUrl || !attachment.mimeType) continue;

    if (attachment.mimeType.startsWith('image/')) {
      content.push({
        type: 'image_url',
        image_url: {
          url: attachment.dataUrl,
        },
      });
      continue;
    }

    if (attachment.mimeType === 'application/pdf') {
      content.push({
        type: 'file',
        file: {
          filename: attachment.name || 'document.pdf',
          file_data: attachment.dataUrl,
        },
      });
    }
  }

  return content;
}

// Detect if message is a simple greeting
function isGreeting(message: string): boolean {
  const greetingPatterns = [
    /^hola$/i, /^hi$/i, /^hello$/i, /^hey$/i,
    /^buenos?\s*(días?|tardes?|noches?)$/i,
    /^good\s*(morning|afternoon|evening)$/i,
    /^qué\s*tal$/i, /^cómo\s*estás?$/i, /^saludos?$/i,
  ];
  return greetingPatterns.some(pattern => pattern.test(message.trim()));
}

interface AvailableTools {
  gmail: boolean;
  drive: boolean;
  sheets: boolean;
  calendar: boolean;
}

async function checkGoogleIntegrations(supabaseUrl: string, supabaseKey: string, userId: string): Promise<AvailableTools> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('provider, is_connected')
    .eq('user_id', userId)
    .in('provider', ['gmail', 'drive', 'calendar', 'sheets']);
  
  const result: AvailableTools = { gmail: false, drive: false, sheets: false, calendar: false };
  
  if (integrations) {
    for (const row of integrations) {
      if (row.is_connected && row.provider in result) {
        result[row.provider as keyof AvailableTools] = true;
      }
    }
  }
  
  return result;
}

function formatAvailableTools(tools: AvailableTools): string {
  const available: string[] = [];
  if (tools.gmail) available.push('Gmail (leer/enviar correos)');
  if (tools.drive) available.push('Drive (buscar/leer archivos)');
  if (tools.sheets) available.push('Sheets (leer/escribir datos)');
  if (tools.calendar) available.push('Calendar (ver/crear eventos)');
  
  if (available.length === 0) return '';
  return `\n\n**Herramientas activas:** ${available.join(', ')}`;
}

interface EmailIntent {
  type: 'send' | 'read' | null;
  to?: string;
  subject?: string;
  body?: string;
  query?: string;
  personName?: string;
}

function detectEmailIntent(message: string): EmailIntent {
  const lowerMsg = message.toLowerCase();
  
  const sendPatterns = [
    /mand[aáe]\s*(un\s*)?(email|correo|mail)/i,
    /envi[aáe]\s*(un\s*)?(email|correo|mail)/i,
    /escrib[eíi]\s*(un\s*)?(email|correo|mail)/i,
    /enviar\s*(email|correo|mail)/i,
    /mandar\s*(email|correo|mail)/i,
  ];
  
  const readPatterns = [
    /qu[eé]\s*(me\s*)?(respondió|contesto|dijo|escribió)/i,
    /respuesta\s*de/i,
    /emails?\s*(de|recibidos?)/i,
    /correos?\s*(de|recibidos?)/i,
    /revisar?\s*(mis\s*)?(emails?|correos?)/i,
    /leer\s*(mis\s*)?(emails?|correos?)/i,
    /mensajes?\s*de/i,
  ];
  
  if (sendPatterns.some(p => p.test(lowerMsg))) {
    const toMatch = message.match(/a\s+(\S+@\S+\.\S+)/i) || 
                    message.match(/para\s+(\S+@\S+\.\S+)/i);
    const personMatch = message.match(/a\s+mi\s+(\w+)/i) ||
                        message.match(/a\s+(\w+)/i);
    
    return {
      type: 'send',
      to: toMatch?.[1],
      personName: personMatch?.[1],
    };
  }
  
  if (readPatterns.some(p => p.test(lowerMsg))) {
    const personMatch = message.match(/(?:de|respondió|contesto)\s+(\w+)/i);
    
    return {
      type: 'read',
      personName: personMatch?.[1],
      query: personMatch ? `from:${personMatch[1]}` : 'in:inbox is:unread',
    };
  }
  
  return { type: null };
}

interface DriveIntent {
  type: 'search' | 'get' | null;
  query?: string;
  fileId?: string;
}

function detectDriveIntent(message: string): DriveIntent {
  const lowerMsg = message.toLowerCase();
  
  const searchPatterns = [
    /busca(r)?\s*(en\s*)?(drive|archivos?|documentos?)/i,
    /encontra(r)?\s*(en\s*)?(drive|archivos?)/i,
    /qu[eé]\s*archivos?\s*(tengo|hay)/i,
    /archivos?\s*(de|sobre|relacionados?)/i,
  ];
  
  if (searchPatterns.some(p => p.test(lowerMsg))) {
    const queryMatch = message.match(/(?:sobre|de|llamado|titulado)\s+["']?([^"']+)["']?/i) ||
                       message.match(/buscar?\s+["']?([^"']+)["']?\s+en/i);
    return {
      type: 'search',
      query: queryMatch?.[1] || message.replace(/buscar?\s*(en\s*)?(drive|archivos?|documentos?)/i, '').trim(),
    };
  }
  
  return { type: null };
}

interface SheetsIntent {
  type: 'read' | 'write' | null;
  spreadsheetId?: string;
  range?: string;
  query?: string;
}

function detectSheetsIntent(message: string): SheetsIntent {
  const lowerMsg = message.toLowerCase();
  
  const readPatterns = [
    /datos?\s*(de|en)\s*(la\s*)?(hoja|planilla|sheet|excel)/i,
    /leer\s*(la\s*)?(hoja|planilla|sheet)/i,
    /qu[eé]\s*(hay|dice)\s*(en|la)\s*(hoja|planilla)/i,
  ];
  
  if (readPatterns.some(p => p.test(lowerMsg))) {
    const urlMatch = message.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return {
      type: 'read',
      spreadsheetId: urlMatch?.[1],
      query: message,
    };
  }
  
  return { type: null };
}

interface CalendarIntent {
  type: 'list' | 'create' | null;
  summary?: string;
  startTime?: string;
  endTime?: string;
}

function detectCalendarIntent(message: string): CalendarIntent {
  const lowerMsg = message.toLowerCase();
  
  const listPatterns = [
    /qu[eé]\s*(eventos?|reuniones?|citas?)\s*(tengo|hay)/i,
    /mi\s*agenda/i,
    /calendario/i,
    /próxim[oa]s?\s*(eventos?|reuniones?)/i,
  ];
  
  const createPatterns = [
    /crea(r)?\s*(un\s*)?(evento|reunión|cita)/i,
    /agenda(r)?\s*(una?\s*)?(reunión|cita|llamada)/i,
    /programa(r)?\s*(una?\s*)?(reunión|cita)/i,
  ];
  
  if (listPatterns.some(p => p.test(lowerMsg))) {
    return { type: 'list' };
  }
  
  if (createPatterns.some(p => p.test(lowerMsg))) {
    const summaryMatch = message.match(/(?:llamada|reunión|evento)\s+(?:con|sobre|para)\s+["']?([^"']+)["']?/i);
    return {
      type: 'create',
      summary: summaryMatch?.[1],
    };
  }
  
  return { type: null };
}

async function callGoogleFunction(
  supabaseUrl: string,
  authToken: string,
  functionName: string,
  params: Record<string, unknown>
) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return response.json();
}

const AGENT_KEYS: AgentKey[] = [
  'orquestador',
  'analista',
  'escritor',
  'investigador',
  'desarrollador',
  'disenador',
  'revisor',
  'asistente',
  'architect',
  'logic',
  'recepcionista',
];

const AGENT_ID_ROUTE_MAP: Record<string, AgentKey> = {
  ag_02: 'investigador',
  ag_03: 'analista',
  ag_04: 'analista',
  ag_05: 'revisor',
  ag_06: 'analista',
  ag_07: 'logic',
  ag_08: 'architect',
  ag_09: 'analista',
  ag_10: 'orquestador',
  ag_11: 'investigador',
  ag_12: 'orquestador',
  ag_13: 'asistente',
  ag_14: 'logic',
  ag_15: 'desarrollador',
  ag_16: 'orquestador',
  ag_17: 'investigador',
  ag_18: 'investigador',
  ag_19: 'revisor',
  ag_20: 'recepcionista',
};

function isAgentKey(value: unknown): value is AgentKey {
  return typeof value === 'string' && AGENT_KEYS.includes(value as AgentKey);
}

function resolveAgentRoute(agentId: unknown): AgentKey | null {
  if (isAgentKey(agentId)) return agentId;
  if (typeof agentId !== 'string') return null;
  return AGENT_ID_ROUTE_MAP[agentId] || null;
}

function resolvePaidProviderLabel(apiKey: string): string {
  return getPaidProviderName(LOVABLE_AI_GATEWAY_URL, apiKey) || 'paid-provider';
}

function resolveProviderLabel(
  _plan: SubscriptionPlanKey,
  paidProvider: string,
  aiData?: Record<string, unknown>,
): string {
  return typeof aiData?.provider === 'string' ? aiData.provider : paidProvider;
}

function resolveEffectiveModel(
  _plan: SubscriptionPlanKey,
  requestedModel: string,
  aiData?: Record<string, unknown>,
): string {
  return typeof aiData?.model === 'string' ? aiData.model : requestedModel;
}

function isAgentOne(agentId: unknown): boolean {
  return agentId === AGENT_ONE_ID;
}

function callAI(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  plan: SubscriptionPlanKey,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens = 500,
) {
  return callAIWithCostControl({
    userId,
    plan,
    supabaseUrl,
    supabaseServiceRoleKey: supabaseKey,
    gatewayUrl: LOVABLE_AI_GATEWAY_URL,
    paidApiKey: apiKey,
    model,
    messages,
    maxTokens,
  });
}

serve(async (req) => {
  console.log('[EQuityLabs] AI Chat request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, agentId, language, attachments } = await req.json();
    const safeAttachments = sanitizeAttachments(attachments);
    const langMap: Record<string, string> = {
      es: 'español', en: 'English', pt: 'português', de: 'Deutsch',
      it: 'italiano', fr: 'français', zh: '中文', ja: '日本語'
    };
    const requestedLanguage = typeof language === 'string' ? language.trim().toLowerCase() : 'es';
    const normalizedLangMap: Record<string, string> = {
      ...langMap,
      es: 'espanol',
      pt: 'portugues',
      fr: 'francais',
      nl: 'Nederlands',
      pl: 'polski',
    };
    const responseLang = normalizedLangMap[requestedLanguage] || normalizedLangMap.es;

    if (!message) {
      throw new Error('Message is required');
    }

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authToken: string = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(authToken);
    const userId: string | null = user?.id || null;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPlan = await getUserPlanState(supabaseUrl, supabaseKey, userId);
    const activePlan = userPlan.plan;
    const apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const paidProvider = resolvePaidProviderLabel(apiKey);

    if (!hasPaidAIProvider(LOVABLE_AI_GATEWAY_URL, apiKey)) {
      console.error('CRITICAL: no paid AI provider configured. Expected OPENROUTER_API_KEY or LOVABLE_API_KEY');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let availableTools: AvailableTools = { gmail: false, drive: false, sheets: false, calendar: false };
    let userDisplayName = 'Admin';

    {
      
      if (userId) {
        availableTools = await checkGoogleIntegrations(supabaseUrl, supabaseKey, userId);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', userId)
          .single();
        
        if (profile?.display_name) {
          userDisplayName = profile.display_name;
        }
      }
    }

    const firstName = userDisplayName.trim().split(/\s+/)[0] || 'usuario';
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;
    const isSimpleGreeting = isGreeting(message);
    const useAgentOne = isAgentOne(agentId) || !agentId;

    if (useAgentOne) {
      const agentOnePrompt = `${AGENT_ONE_START_PROMPT}
El nombre del usuario es ${firstName}.
El idioma de respuesta seleccionado es ${responseLang}.
${isFirstMessage ? `En tu primera respuesta, comienza con "Hola ${firstName},".` : 'No repitas el saludo inicial si la conversación ya comenzó.'}`;
      const agentOneMessages: ChatMessage[] = [
        {
          role: 'system',
          content: agentOnePrompt,
        },
        ...(conversationHistory || []),
        {
          role: 'user',
          content: buildUserContent(message, safeAttachments),
        },
      ];

      const aiResult = await callPaidGateway(
        LOVABLE_AI_GATEWAY_URL,
        apiKey,
        AGENT_ONE_MODEL,
        agentOneMessages,
        700,
      );

      if (aiResult.error) {
        return new Response(
          JSON.stringify({ error: aiResult.error }),
          { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const assistantMessage = aiResult.data?.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        return new Response(
          JSON.stringify({ error: 'AI returned empty response.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          response: assistantMessage,
          meta: {
            model: typeof aiResult.data?.model === 'string' ? aiResult.data.model : AGENT_ONE_MODEL,
            provider: typeof aiResult.data?.provider === 'string' ? aiResult.data.provider : 'openrouter',
            requestedModel: AGENT_ONE_MODEL,
            effectiveModel: typeof aiResult.data?.model === 'string' ? aiResult.data.model : AGENT_ONE_MODEL,
            plan: activePlan,
            route: 'agent:ag_01',
            agentId: AGENT_ONE_ID,
            agentRoute: 'architect',
            availableTools,
            usage: aiResult.data?.usage || null,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle contextual greeting with available tools
    if (isFirstMessage && isSimpleGreeting && userId) {
      const toolsList = formatAvailableTools(availableTools);
      const greetingWithTools = toolsList 
        ? `¡Hola ${firstName}! 👋\n\nVeo que tengo acceso a tus integraciones:${toolsList}\n\n¿En qué trabajamos hoy?`
        : `¡Hola ${firstName}! 👋\n\nEstoy listo para ayudarte. Aún no tienes integraciones de Google activas. ¿Quieres conectar Gmail, Drive, Sheets o Calendar?`;
      
      const modelUsed = resolveModel(activePlan, 'orquestador');
      
      return new Response(
        JSON.stringify({ 
          response: greetingWithTools,
          meta: { model: modelUsed, provider: paidProvider, plan: activePlan, route: 'greeting_with_tools', availableTools }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect tool intents
    const emailIntent = detectEmailIntent(message);
    const driveIntent = detectDriveIntent(message);
    const sheetsIntent = detectSheetsIntent(message);
    const calendarIntent = detectCalendarIntent(message);

    // Handle Drive actions
    if (driveIntent.type && availableTools.drive && authToken) {
      console.log(`[EQuityLabs] Drive intent: ${driveIntent.type}`);
      
      const result = await callGoogleFunction(supabaseUrl, authToken, 'google-drive', {
        action: driveIntent.type,
        query: driveIntent.query,
        fileId: driveIntent.fileId,
        maxResults: 10,
      });
      
      if (result.error) {
        return new Response(
          JSON.stringify({ response: `❌ Error al acceder a Drive: ${result.error}`, meta: { action: 'drive_error', model: resolveEffectiveModel(activePlan, resolveModel(activePlan, 'architect')), provider: paidProvider, plan: activePlan } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const filesContext = result.data?.files?.map((f: { name: string; mimeType: string; modifiedTime: string; webViewLink: string }) => 
        `📄 ${f.name} (${f.mimeType.split('.').pop()})\n   Modificado: ${new Date(f.modifiedTime).toLocaleDateString('es')}\n   Link: ${f.webViewLink}`
      ).join('\n\n') || 'No se encontraron archivos';

      const architectModel = resolveModel(activePlan, 'architect');
      const aiResult = await callAI(supabaseUrl, supabaseKey, userId, activePlan, apiKey, architectModel, [
        { role: 'system', content: `Eres el agente Architect de EQuityLabs especializado en arquitectura de sistemas. El usuario buscó en Drive y encontró:\n\n${filesContext}\n\nResume los archivos encontrados y ofrece analizar alguno en detalle si es relevante para el proyecto.` },
        { role: 'user', content: message },
      ], 600);

      if (aiResult.error) {
        return new Response(JSON.stringify({ error: aiResult.error }), { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const summary = aiResult.data?.choices?.[0]?.message?.content || 'No pude procesar los resultados de Drive.';
      const driveProvider = resolveProviderLabel(activePlan, paidProvider, aiResult.data);
      const driveModel = resolveEffectiveModel(activePlan, architectModel, aiResult.data);
      return new Response(
        JSON.stringify({ response: summary, meta: { action: 'drive_search', model: driveModel, requestedModel: architectModel, provider: driveProvider, plan: activePlan, fileCount: result.data?.count || 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Sheets actions
    if (sheetsIntent.type && availableTools.sheets && authToken && sheetsIntent.spreadsheetId) {
      console.log(`[EQuityLabs] Sheets intent: ${sheetsIntent.type}`);
      
      const result = await callGoogleFunction(supabaseUrl, authToken, 'google-sheets', {
        action: sheetsIntent.type,
        spreadsheetId: sheetsIntent.spreadsheetId,
        range: sheetsIntent.range || 'A1:Z50',
      });
      
      if (result.error) {
        return new Response(
          JSON.stringify({ response: `❌ Error al acceder a Sheets: ${result.error}`, meta: { action: 'sheets_error', model: resolveEffectiveModel(activePlan, resolveModel(activePlan, 'logic')), provider: paidProvider, plan: activePlan } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sheetsContext = JSON.stringify(result.data?.values?.slice(0, 20) || [], null, 2);
      
      const logicModel = resolveModel(activePlan, 'logic');
      const aiResult = await callAI(supabaseUrl, supabaseKey, userId, activePlan, apiKey, logicModel, [
        { role: 'system', content: `Eres el agente Logic de EQuityLabs especializado en análisis de datos y cálculos. Datos de la hoja:\n\n\`\`\`json\n${sheetsContext}\n\`\`\`\n\nAnaliza estos datos y responde la pregunta del usuario.` },
        { role: 'user', content: message },
      ], 800);

      if (aiResult.error) {
        return new Response(JSON.stringify({ error: aiResult.error }), { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const analysis = aiResult.data?.choices?.[0]?.message?.content || 'No pude analizar los datos.';
      const sheetsProvider = resolveProviderLabel(activePlan, paidProvider, aiResult.data);
      const sheetsModel = resolveEffectiveModel(activePlan, logicModel, aiResult.data);
      return new Response(
        JSON.stringify({ response: analysis, meta: { action: 'sheets_read', model: sheetsModel, requestedModel: logicModel, provider: sheetsProvider, plan: activePlan, rowCount: result.data?.rowCount || 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Calendar actions
    if (calendarIntent.type && availableTools.calendar && authToken) {
      console.log(`[EQuityLabs] Calendar intent: ${calendarIntent.type}`);
      
      if (calendarIntent.type === 'list') {
        const result = await callGoogleFunction(supabaseUrl, authToken, 'google-calendar', {
          action: 'list',
          maxResults: 10,
        });
        
        if (result.error) {
          return new Response(
            JSON.stringify({ response: `❌ Error al acceder a Calendar: ${result.error}`, meta: { action: 'calendar_error', model: resolveEffectiveModel(activePlan, resolveModel(activePlan, 'logic')), provider: paidProvider, plan: activePlan } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const eventsContext = result.data?.events?.map((e: { summary: string; start: string; end: string; attendees?: { email: string }[] }) => 
          `📅 **${e.summary}**\n   ${new Date(e.start).toLocaleString('es')} - ${new Date(e.end).toLocaleString('es')}\n   Asistentes: ${e.attendees?.map(a => a.email).join(', ') || 'Solo tú'}`
        ).join('\n\n') || 'No hay eventos próximos';

        return new Response(
          JSON.stringify({ response: `📆 **Tu Agenda**\n\n${eventsContext}`, meta: { action: 'calendar_list', model: resolveEffectiveModel(activePlan, resolveModel(activePlan, 'logic')), provider: paidProvider, plan: activePlan, eventCount: result.data?.count || 0 } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle Gmail actions
    if (emailIntent.type && availableTools.gmail && authToken) {
      console.log(`[EQuityLabs] Email intent: ${emailIntent.type}`);
      
      if (emailIntent.type === 'read') {
        const result = await callGoogleFunction(supabaseUrl, authToken, 'gmail-actions', {
          action: 'read',
          query: emailIntent.query,
          maxResults: 5,
        });
        
        if (result.error) {
          return new Response(
            JSON.stringify({ response: `❌ Error al leer emails: ${result.error}`, meta: { action: 'gmail_read_error', model: resolveEffectiveModel(activePlan, resolveModel(activePlan, 'recepcionista')), provider: paidProvider, plan: activePlan } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const emailContext = result.data?.emails?.map((e: { from: string; subject: string; snippet: string; date: string }) => 
          `De: ${e.from}\nAsunto: ${e.subject}\nFecha: ${e.date}\nPreview: ${e.snippet}`
        ).join('\n---\n') || 'No se encontraron emails';

        const receptionistModel = resolveModel(activePlan, 'recepcionista');
        const aiResult = await callAI(supabaseUrl, supabaseKey, userId, activePlan, apiKey, receptionistModel, [
          { role: 'system', content: `Eres el agente Recepcionista de EQuityLabs. Emails encontrados:\n\n${emailContext}\n\nResume estos emails de forma concisa y profesional.` },
          { role: 'user', content: message },
        ]);

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const emailSummary = aiResult.data?.choices?.[0]?.message?.content || 'No pude procesar los emails.';
        const gmailProvider = resolveProviderLabel(activePlan, paidProvider, aiResult.data);
        const gmailModel = resolveEffectiveModel(activePlan, receptionistModel, aiResult.data);
        return new Response(
          JSON.stringify({ response: emailSummary, meta: { action: 'gmail_read', model: gmailModel, requestedModel: receptionistModel, provider: gmailProvider, plan: activePlan, emailCount: result.data?.count || 0 } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (emailIntent.type === 'send' && emailIntent.to) {
        const result = await callGoogleFunction(supabaseUrl, authToken, 'gmail-actions', {
          action: 'send',
          to: emailIntent.to,
          subject: emailIntent.subject || 'Mensaje desde EQuityLabs',
          body: emailIntent.body || message,
        });

        if (result.success) {
          return new Response(
            JSON.stringify({ response: `✅ **Email enviado**\n\n📬 Destinatario: ${emailIntent.to}\n🆔 ID: \`${result.data.messageId}\``, meta: { action: 'gmail_sent', model: resolveEffectiveModel(activePlan, resolveModel(activePlan, 'recepcionista')), provider: paidProvider, plan: activePlan, messageId: result.data.messageId } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Standard AI chat flow
    let modelToUse: string;
    let routingReason: string;
    const routedAgent = resolveAgentRoute(agentId);

    if (isFirstMessage && isSimpleGreeting) {
      modelToUse = resolveModel(activePlan, 'greeting');
      routingReason = 'greeting';
    } else if (routedAgent) {
      modelToUse = resolveModel(activePlan, routedAgent);
      routingReason = `agent:${agentId}->${routedAgent}`;
    } else {
      modelToUse = resolveModel(activePlan, 'default');
      routingReason = 'default';
    }

    console.log(`[EQuityLabs] Plan: ${activePlan} | Routing: ${routingReason} -> Model: ${modelToUse}`);

    const toolsInfo = formatAvailableTools(availableTools);
    const equityLabsContext = `
Eres el asistente principal de EQuityLabs, una plataforma de control de misiones y proyectos de alto rendimiento.

## Tu Identidad
- Nombre: EQuityLabs AI Assistant
- Rol: Asistente ejecutivo para análisis de datos, gestión de proyectos y toma de decisiones estratégicas
- Tono: Profesional, conciso, orientado a resultados

## Capacidades Activas${toolsInfo || '\n- Sin integraciones de Google activas'}

## Agentes Especializados
- **Architect**: Busca en Drive, analiza arquitectura de proyectos
- **Logic**: Lee Sheets, crea eventos en Calendar, cálculos complejos
- **Recepcionista**: Gestiona emails de Gmail

## Reglas
- IDIOMA PREFERIDO: Responde en ${responseLang}. Si el usuario solicita expresamente otro idioma compatible, responde en ese idioma.
- IDIOMAS COMPATIBLES: español, inglés, portugués, italiano, francés, alemán y griego.
- FORMATO: Responde de forma natural, clara y profesional. No uses ni muestres las etiquetas "Razonamiento:", "Ejecución:" o "Next Step:"; entrega directamente la información y el próximo paso cuando corresponda.
- Sé claro y directo, incluyendo el contexto necesario, las acciones recomendadas y un próximo paso concreto cuando corresponda.
- Si te preguntan quién eres, di que eres el asistente de EQuityLabs.
${agentId ? `\n## Modo Agente Activo: ${agentId}${routedAgent ? ` (${routedAgent})` : ''}` : ''}
`;

    const messages: ChatMessage[] = [
      { role: 'system', content: equityLabsContext },
      ...(conversationHistory || []),
      { role: 'user', content: buildUserContent(message, safeAttachments) },
    ];

    const aiResult = await callAI(supabaseUrl, supabaseKey, userId, activePlan, apiKey, modelToUse, messages);
    const provider = resolveProviderLabel(activePlan, paidProvider, aiResult.data);
    const effectiveModel = resolveEffectiveModel(activePlan, modelToUse, aiResult.data);

    if (aiResult.error) {
      return new Response(
        JSON.stringify({ error: aiResult.error }),
        { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assistantMessage = aiResult.data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error('[EQuityLabs] No content in response:', JSON.stringify(aiResult.data));
      return new Response(
        JSON.stringify({ error: 'AI returned empty response.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        meta: {
          model: effectiveModel,
          provider,
          requestedModel: modelToUse,
          effectiveModel,
          plan: activePlan,
          route: routingReason,
          agentId: typeof agentId === 'string' ? agentId : null,
          agentRoute: routedAgent,
          availableTools,
          usage: aiResult.data?.usage || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[EQuityLabs] Critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
