import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OPENROUTER_CHAT_URL, EQUITYLABS_PRIMARY_MODEL } from "../_shared/subscription-routing.ts";

// Chat público de la landing (sin login): demo del communication center.
// Llama a OpenRouter con el modelo gratuito. Solo validación de tamaño:
// sin auth, sin persistencia.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = [
  "Eres el agente principal de EQuityLabsAI Agency, una agencia de IA multi-agente.",
  "Presentate como 'EQuityLabs AI'. Responde breve y directo (max 120 palabras), en el mismo idioma del usuario.",
  "Precios reales: Free Trial $0 por 30 dias; Tactical $25/mes; Premium $50/mes; Mastermind $100/mes; Enterprise $600/mes; Alliance $1000/año.",
  "Menciona que se puede crear una cuenta gratis (free trial 30 dias) para trabajar con 40 agentes especializados.",
].join(" ");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Mensaje vacio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > 600) {
      return new Response(JSON.stringify({ error: "Mensaje muy largo (max 600 caracteres)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Demo no disponible." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.equitylabs.online",
        "X-Title": "EQuityLabs Landing Demo",
      },
      body: JSON.stringify({
        model: EQUITYLABS_PRIMARY_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message.slice(0, 600) },
        ],
        max_tokens: 320,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("landing-chat openrouter error", res.status, JSON.stringify(data).slice(0, 300));
      return new Response(JSON.stringify({ error: "El agente no responde ahora, intenta en un momento." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "Sin respuesta.";
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("landing-chat crash", err);
    return new Response(JSON.stringify({ error: "Error interno." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
