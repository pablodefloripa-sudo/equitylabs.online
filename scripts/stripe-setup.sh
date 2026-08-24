#!/usr/bin/env bash
# ------------------------------------------------------------------
# EquityLabs — Setup de Stripe (productos, precios y webhook)
# Uso:  STRIPE_SECRET_KEY=sk_live_... bash scripts/stripe-setup.sh
# La key se lee SOLO de la variable de entorno (nunca se imprime).
# ------------------------------------------------------------------
set -euo pipefail

API="https://api.stripe.com/v1"
KEY="${STRIPE_SECRET_KEY:-}"
[ -z "$KEY" ] && { echo "ERROR: define STRIPE_SECRET_KEY=sk_... primero"; exit 1; }

AUTH="Authorization: Bearer ${KEY}"
WEBHOOK_URL="${STRIPE_WEBHOOK_URL:-https://otgxdmouuaqdpgrpzlul.supabase.co/functions/v1/stripe-webhook}"

# plan | nombre | descripcion | monto_usd | intervalo (month|year|one_time)
PLANS=(
  "TACTICAL|Tactical|Speed + Real Results|25|month"
  "MASTERMIND|Mastermind|Corporate-Grade + Maximum Control|100|month"
  "ENTERPRISE|Enterprise|Full Organizational Implementation|500|month"
  "ALLIANCE|Alliance|Strategic Partnership + Brand Expansion|1000|year"
)

echo "==> Creando productos y precios..."
for entry in "${PLANS[@]}"; do
  IFS='|' read -r KEY_NAME NAME DESC AMOUNT INTERVAL <<< "$entry"

  # Producto (reutiliza si ya existe)
  PROD=$(curl -s -u "$KEY:" -X POST "$API/products" \
    -d "name=$NAME" -d "description=$DESC" \
    -H "$AUTH")
  PROD_ID=$(echo "$PROD" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)

  # Precio
  PRICE=$(curl -s -u "$KEY:" -X POST "$API/prices" \
    -d "product=$PROD_ID" \
    -d "currency=usd" \
    -d "unit_amount=$((AMOUNT * 100))" \
    -d "metadata[plan]=$KEY_NAME" \
    $( [ "$INTERVAL" != "one_time" ] && echo "-d recurring[interval]=$INTERVAL" || echo "" ) \
    -H "$AUTH")
  PRICE_ID=$(echo "$PRICE" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)

  if [ -n "$PRICE_ID" ]; then
    echo "  $KEY_NAME -> $PRICE_ID  (\$$AMOUNT/$INTERVAL)"
  else
    echo "  $KEY_NAME -> ERROR: $(echo "$PRICE" | head -c 200)"
  fi
done

echo ""
echo "==> Creando webhook endpoint ($WEBHOOK_URL)..."
WH=$(curl -s -u "$KEY:" -X POST "$API/webhook_endpoints" \
  -d "url=$WEBHOOK_URL" \
  -d "enabled_events[]=checkout.session.completed" \
  -H "$AUTH")
WH_SECRET=$(echo "$WH" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('secret',''))" 2>/dev/null)
if [ -n "$WH_SECRET" ]; then
  echo "  Webhook OK -> STRIPE_WEBHOOK_SECRET=$WH_SECRET"
else
  echo "  Webhook ERROR: $(echo "$WH" | head -c 300)"
fi

echo ""
echo "==> Siguiente paso: cargar estos secrets en Supabase:"
echo "  npx supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... STRIPE_PRICE_TACTICAL=... STRIPE_PRICE_PREMIUM=... STRIPE_PRICE_MASTERMIND=... STRIPE_PRICE_ENTERPRISE=... STRIPE_PRICE_ALLIANCE=... --project-ref otgxdmouuaqdpgrpzlul"
