import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_API = "https://api.stripe.com/v1";

// Mapa plan -> config de precio. Los price_id se crean una sola vez en Stripe
// (Products & Prices) y se referencian aqui. Modo: subscription = recurrente,
// payment = pago unico.
type PlanConfig = {
  priceId: string;
  mode: "subscription" | "payment";
  interval?: "month" | "year";
};

const PLANS: Record<string, PlanConfig> = {
  TACTICAL: {
    priceId: Deno.env.get("STRIPE_PRICE_TACTICAL") || "",
    mode: "subscription",
    interval: "month",
  },
  MASTERMIND: {
    priceId: Deno.env.get("STRIPE_PRICE_MASTERMIND") || "",
    mode: "subscription",
    interval: "month",
  },
  ENTERPRISE: {
    priceId: Deno.env.get("STRIPE_PRICE_ENTERPRISE") || "",
    mode: "subscription",
    interval: "month",
  },
  ALLIANCE: {
    priceId: Deno.env.get("STRIPE_PRICE_ALLIANCE") || "",
    mode: "subscription",
    interval: "year",
  },
};

const SITE_URL =
  Deno.env.get("PUBLIC_SITE_URL") ||
  Deno.env.get("SITE_URL") ||
  "https://www.equitylabs.online";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Autenticar: el usuario debe tener sesion (JWT de Supabase)
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized. Inicia sesion." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Leer plan
    const { planKey, successPath } = await req.json();
    const plan = PLANS[planKey];
    if (!plan || !plan.priceId) {
      return new Response(
        JSON.stringify({
          error: plan
            ? "Precio no configurado para este plan (STRIPE_PRICE_*)."
            : "Plan invalido.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Crear Checkout Session
    const body = new URLSearchParams();
    body.set("mode", plan.mode);
    body.set("client_reference_id", user.id);
    body.set("customer_email", user.email || "");
    body.set("metadata[plan]", planKey);
    body.set("metadata[userId]", user.id);
    body.set("line_items[0][price]", plan.priceId);
    body.set("line_items[0][quantity]", "1");
    if (plan.mode === "subscription" && plan.interval === "year") {
      body.set("line_items[0][price_data][recurring][interval]", "year");
    }
    body.set("allow_promotion_codes", "true"); // soporta LANZAMIENTO2026
    body.set("success_url", `${SITE_URL}/dashboard${successPath ? `?plan=${planKey}` : ""}`);
    body.set("cancel_url", `${SITE_URL}/suscripciones`);

    const stripeRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY") || ""}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok || !data.url) {
      console.error("stripe-checkout error", stripeRes.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.error?.message || "Stripe rechazo el checkout." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ url: data.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-checkout crash", err);
    return new Response(JSON.stringify({ error: "Error interno." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
