import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";

  const basePayload = {
    timestamp: new Date().toISOString(),
    hasAuthHeader: Boolean(authHeader),
    authHeaderPrefix: authHeader ? authHeader.slice(0, 16) : null,
    env: {
      hasSupabaseUrl: Boolean(supabaseUrl),
      supabaseUrlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
      hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
      serviceRolePrefix: supabaseServiceRoleKey ? supabaseServiceRoleKey.slice(0, 12) : null,
      hasOpenRouterApiKey: Boolean(openRouterApiKey),
      hasLovableApiKey: Boolean(lovableApiKey),
    },
  };

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        ok: false,
        stage: "missing_auth_header",
        ...basePayload,
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const authResult = await supabase.auth.getUser(token);

    return new Response(
      JSON.stringify({
        ok: Boolean(authResult.data.user),
        stage: authResult.data.user ? "auth_ok" : "auth_failed",
        ...basePayload,
        authResult: {
          error: authResult.error?.message || null,
          userId: authResult.data.user?.id || null,
          email: authResult.data.user?.email || null,
          role: authResult.data.user?.role || null,
        },
      }),
      { status: authResult.data.user ? 200 : 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        stage: "unexpected_error",
        ...basePayload,
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
