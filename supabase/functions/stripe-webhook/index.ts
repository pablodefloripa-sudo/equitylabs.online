import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Stripe webhook: escucha checkout.session.completed y activa el plan
// en public.user_planes. Verifica la firma HMAC-SHA256 del header
// "stripe-signature" contra STRIPE_WEBHOOK_SECRET (whsec_...).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Verificacion de firma (sin SDK, crypto nativo de Deno) ---
async function verifySignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  // Formato: t=<timestamp>,v1=<hex>
  const items = signatureHeader.split(",").map((s) => s.trim().split("="));
  const ts = items.find(([k]) => k === "t")?.[1];
  const sig = items.find(([k]) => k === "v1")?.[1];
  if (!ts || !sig) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedPayload = new TextEncoder().encode(`${ts}.${payload}`);
  const mac = await crypto.subtle.sign("HMAC", key, signedPayload);
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === sig;
}

// Duración del plan en días según intervalo Stripe
function daysForInterval(interval: string | null): number | null {
  if (interval === "month") return 30;
  if (interval === "year") return 365;
  return null; // pago único sin recurrencia → sin expiración programada
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    if (!secret) {
      console.error("stripe-webhook: STRIPE_WEBHOOK_SECRET no configurado");
      return new Response("Webhook secret missing", { status: 500 });
    }

    const valid = await verifySignature(rawBody, signature, secret);
    if (!valid) {
      console.error("stripe-webhook: firma invalida");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      const planKey = (session.metadata?.plan || "TACTICAL").toUpperCase();
      const mode = session.mode;

      if (!userId) {
        console.error("stripe-webhook: sesion sin client_reference_id", session.id);
        return new Response("Missing user", { status: 400 });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Calcular fin de plan
      let endDate: string | null = null;
      if (mode === "subscription" && session.subscription) {
        // Consultar suscripcion para current_period_end
        const subRes = await fetch(
          `https://api.stripe.com/v1/subscriptions/${session.subscription}`,
          { headers: { Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY") || ""}` } },
        );
        if (subRes.ok) {
          const sub = await subRes.json();
          if (sub.current_period_end) {
            endDate = new Date(sub.current_period_end * 1000).toISOString();
          }
        }
      }
      if (!endDate) {
        const days = mode === "subscription"
          ? daysForInterval(session.line_items?.[0]?.price?.recurring?.interval ?? null)
          : null;
        if (days) {
          endDate = new Date(Date.now() + days * 86400_000).toISOString();
        }
      }

      const { error } = await supabase.from("user_planes").upsert(
        {
          user_id: userId,
          plan: planKey,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: endDate,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("stripe-webhook: upsert user_planes fallo", error);
        return new Response("DB update failed", { status: 500 });
      }
      console.log(
        `stripe-webhook: plan ${planKey} activado para user ${userId} (end ${endDate})`,
      );
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook crash", err);
    return new Response("Webhook error", { status: 500 });
  }
});
