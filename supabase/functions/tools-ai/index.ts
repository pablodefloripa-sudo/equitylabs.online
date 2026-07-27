import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  callAIWithCostControl,
  EQUITYLABS_PRIMARY_MODEL,
  getPaidProviderName,
  getUserPlanState,
  hasPaidAIProvider,
  LOVABLE_AI_GATEWAY_URL,
  type ChatMessage,
} from "../_shared/subscription-routing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ToolKey =
  | 'deep_research'
  | 'create_video_brief'
  | 'create_music_brief'
  | 'canvas_organize'
  | 'generate_report'
  | 'market_analysis'
  | 'prompt_engineer'
  | 'project_metrics';

const SYSTEMS: Record<ToolKey, { system: string; model: string; max: number }> = {
  deep_research: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 2400,
    system: `Eres "Deep Research" de EQuityLabs. Realizas investigación rigurosa: contexto, hechos clave, actores, datos cuantitativos cuando aplique, contraargumentos, referencias y conclusiones accionables. Estructura en Markdown con secciones: Resumen Ejecutivo, Hallazgos, Datos Clave, Riesgos/Contradicciones, Próximos Pasos. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  create_video_brief: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 1500,
    system: `Eres director creativo de video. Convierte la idea del usuario en un brief profesional de producción: Logline, Audiencia, Tono, Estructura escena por escena (con duración estimada), Estilo visual, Música/SFX, CTA. Formato Markdown. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  create_music_brief: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 1200,
    system: `Eres productor musical. Convierte la idea en un brief musical detallado listo para enviar a Suno/Udio/MusicGen: Género, BPM, Tonalidad, Instrumentación, Estructura (Intro/Verse/Chorus/Bridge/Outro con compases), Mood, Referencias, Letras (si aplica). Formato Markdown. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  canvas_organize: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 1500,
    system: `Eres asistente de Canvas. Toma las notas/ideas crudas del usuario y devuelve un canvas estructurado: Mapa mental jerárquico en Markdown (con #, ##, ###), conexiones entre conceptos y bloques destacados. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  generate_report: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 2400,
    system: `Eres analista senior de EQuityLabs. Genera un reporte ejecutivo completo en Markdown sobre el tema indicado: Portada (título + fecha), Resumen Ejecutivo, Contexto, Análisis Detallado (con sub-secciones), Métricas/KPIs sugeridos, Recomendaciones priorizadas, Conclusión. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  market_analysis: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 2400,
    system: `Eres analista de mercado de EQuityLabs. Analiza el mercado/empresa/sector indicado: Tamaño y crecimiento (TAM/SAM/SOM), Competidores principales, Tendencias macro, Oportunidades, Amenazas, Recomendación estratégica. Markdown con tablas cuando aplique. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  prompt_engineer: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 1200,
    system: `Eres Prompt Engineer experto. Reescribe la idea del usuario como un prompt de IA óptimo siguiendo el framework: ROL + OBJETIVO + CONTEXTO + RESTRICCIONES + FORMATO DE SALIDA + EJEMPLO. Devuelve solo el prompt final en bloque \`\`\`. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
  project_metrics: {
    model: EQUITYLABS_PRIMARY_MODEL,
    max: 2000,
    system: `Eres analista de proyectos de EQuityLabs. Genera un dashboard de métricas del proyecto en Markdown: KPIs principales (con valores objetivo), Velocidad/Burndown, Milestones, Riesgos operativos, Métricas de calidad, Recomendaciones tácticas. Usa tablas. Termina con: Modelo: ${EQUITYLABS_PRIMARY_MODEL}.`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { tool, prompt } = await req.json() as { tool: ToolKey; prompt: string };

    if (!tool || !SYSTEMS[tool]) {
      return new Response(JSON.stringify({ error: 'Tool inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!prompt || typeof prompt !== 'string' || prompt.length > 4000) {
      return new Response(JSON.stringify({ error: 'Prompt inválido (max 4000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authToken = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(authToken);
    const userId = user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPlan = await getUserPlanState(supabaseUrl, supabaseKey, userId);
    const apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const paidProvider = getPaidProviderName(LOVABLE_AI_GATEWAY_URL, apiKey) || 'paid-provider';

    if (!hasPaidAIProvider(LOVABLE_AI_GATEWAY_URL, apiKey)) {
      return new Response(JSON.stringify({ error: 'AI no configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cfg = SYSTEMS[tool];
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `${cfg.system}\n\nModelo obligatorio: ${EQUITYLABS_PRIMARY_MODEL}. No menciones Gemini ni otros modelos.`,
      },
      { role: 'user', content: prompt },
    ];
    const aiResult = await callAIWithCostControl({
      userId,
      plan: userPlan.plan,
      supabaseUrl,
      supabaseServiceRoleKey: supabaseKey,
      gatewayUrl: LOVABLE_AI_GATEWAY_URL,
      paidApiKey: apiKey,
      model: EQUITYLABS_PRIMARY_MODEL,
      messages,
      maxTokens: cfg.max,
    });

    if (aiResult.error) {
      return new Response(JSON.stringify({ error: aiResult.error }), {
        status: aiResult.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }    

    const content = aiResult.data?.choices?.[0]?.message?.content || '';
    const effectiveModel = typeof aiResult.data?.model === 'string'
      ? aiResult.data.model
      : EQUITYLABS_PRIMARY_MODEL;
    const provider = typeof aiResult.data?.provider === 'string'
      ? aiResult.data.provider
      : paidProvider;
    return new Response(JSON.stringify({
      content,
      model: effectiveModel,
      requestedModel: EQUITYLABS_PRIMARY_MODEL,
      provider,
      plan: userPlan.plan,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('tools-ai exception', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Error desconocido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
