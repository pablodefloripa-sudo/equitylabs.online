# 📋 REPORTE TÉCNICO — EQuityLabs (Agosto 2026)

> Generado: 2026-08-04 · Repo: `EquityLabs20261` · Rama: `main`
> Build verificado: ✅ `npm run build` → `dist/` en 29.88s (0 errores TS)

---

## 🎯 Resumen Ejecutivo

EQuityLabs es una **plataforma multi-agente de IA** con 41 agentes de estilo de vida + 20 agentes core, monetización por suscripción (6 planes), integraciones Google (Gmail/Calendar/Drive/Sheets), diagnóstico de negocio, generación de imágenes, módulo de proyectos/equity y un core Python de enrutamiento offline. Interfaz Warhol Pop-Art con Quicksand, desplegada en Vercel con backend Supabase Edge Functions (Deno).

**Estado global: 🟢 Operativo** — build limpio, 12 rutas activas, 9 Edge Functions, 10 migraciones aplicadas.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite + TypeScript | 18.3 / 5.4 / 5.8 |
| Estilos | Tailwind + shadcn/ui (Radix) | 3.4 / — |
| Animación | Framer Motion + Embla Carousel | 11.18 / 8.6 |
| Backend | Supabase Edge Functions (Deno) | std 0.168 |
| DB | Supabase (Postgres + PostgREST + GoTrue) | — |
| IA | OpenRouter + Lovable AI Gateway | — |
| Modelo principal | `nvidia/nemotron-3-ultra-550b-a55b:free` | — |
| Pagos | Stripe (checkout, por implementar webhook) | — |
| Analytics | Firebase (activo) + PostHog (pendiente) | 12.16 |
| Deploy | Vercel (auto desde git + CLI) | — |
| Core offline | Python 3.14 (router/agents/models) | — |

---

## 📁 Estructura del Proyecto

```
EquityLabs20261/
├── src/                      # Frontend (25.749 líneas)
│   ├── pages/                # 12 páginas (Landing, Index=dashboard, Auth, Suscripciones...)
│   ├── components/
│   │   ├── dashboard/        # 36 componentes (Mascot, Tools, Metrics, Bunker...)
│   │   ├── landing/          # 10 (AgentGrid inline, LanguageFloater, GhostTyper...)
│   │   ├── zen/              # Modo Zen (AgentOrchestrator, CommandCenter)
│   │   └── ui/               # 50+ componentes shadcn
│   ├── hooks/                # 14 hooks (useAIChat, useAuth, useKokoroTTS...)
│   ├── integrations/         # supabase, firebase, lovable
│   ├── lib/                  # audit.service, subscription-plans, oauth-state
│   └── data/                 # agentsData.json (20) + lifestyleAgents.json (41)
├── supabase/
│   ├── functions/            # 9 Edge Functions + _shared (3.378 líneas)
│   └── migrations/           # 10 migraciones SQL
├── core/                     # Python: router.py, agents.py, models.py (141 líneas)
├── tests/                    # test_router.py, test_models.py
└── docs/                     # API_DOCUMENTATION, SECRETS_ROTATION, UNIFICATION
```

---

## 🖥️ Frontend — Rutas (App.tsx)

| Ruta | Página | AuthGuard |
|------|--------|-----------|
| `/` y `/dashboard` | Index (dashboard principal) | 🔒 Sí |
| `/landing` | Landing 2 fases (hero + grid 41 agentes) | ❌ No |
| `/auth` y `/register` | Auth | ❌ No |
| `/reset-password` | ResetPassword | ❌ No |
| `/suscripciones` | Suscripciones (6 planes) | ❌ No |
| `/diagnostico` | Diagnostico (público) | ❌ No |
| `/oauth/consent` | OAuthConsent | ❌ No |
| `/mascota-paseo` | MascotaPaseo | 🔒 Sí |
| `/admin` | AdminDashboard | 🔒 Sí |
| `*` | NotFound | ❌ No |

**Patrón clave:** lazy imports + `Suspense` — toda ruta nueva DEBE tener su `lazy(() => import(...))` o crashea en runtime con página negra (build pasa igual).

---

## ⚙️ Backend — Edge Functions (Supabase/Deno)

| # | Función | Auth | Descripción |
|---|---------|------|-------------|
| 1 | `ai-chat` | 🔒 | Chat principal: enrutamiento por agente/plan, detección de intención Google, adjuntos (4×8MB img/PDF), persona mascota. **931 líneas** |
| 2 | `diagnostico` | ❌ | Diagnóstico de negocio público |
| 3 | `diagnostico-auth` | 🔒 | Verificación de auth para diagnóstico |
| 4 | `generate-image` | 🔒 | Generación de imágenes (bloqueado en FREE → 429) |
| 5 | `gmail-actions` | 🔒+int | Leer/enviar/responder Gmail |
| 6 | `google-calendar` | 🔒+int | Eventos de calendario |
| 7 | `google-drive` | 🔒+int | Archivos en Drive |
| 8 | `google-sheets` | 🔒+int | Hojas de cálculo |
| 9 | `tools-ai` | 🔒 | **8 herramientas**: deep_research, create_video_brief, create_music_brief, canvas_organize, generate_report, market_analysis, prompt_engineer, project_metrics |

**Contrato compartido** `_shared/subscription-routing.ts` (383 líneas):
- `EQUITYLABS_PRIMARY_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free'`
- Mapas de agentes (`orquestador`, `analista`, `escritor`, `investigador`, `desarrollador`, `disenador`, `revisor`, `asistente`, `architect`, `logic`, `recepcionista` + mascota)
- `callAIWithCostControl` (control de costos por plan), `getUserPlanState`, `hasPaidAIProvider`
- ⚠️ **El `_shared` NO se versiona solo** — cualquier cambio exige redeploy de TODAS las funciones que lo importan (`ai-chat`, `tools-ai`)

**Modelo principal:** `nvidia/nemotron-3-ultra-550b-a55b:free` (gratis vía OpenRouter). El core Python usa `qwen/qwen3-vl-8b-thinking` (pago) — ⚠️ desincronizado.

---

## 🗄️ Base de Datos — Migraciones (10)

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfiles de usuario (plan, idioma, agente activo) |
| `user_planes` | Suscripciones activas por usuario |
| `user_integrations` | Tokens OAuth Google por usuario |
| `tool_executions` | Auditoría de ejecución de herramientas |
| `free_ai_usage` | Contador de uso gratuito (rate limit) |
| `audit_logs` | Log de auditoría (migración 20260803) |
| `leads_enterprise` | Leads de venta enterprise (referenciada) |
| `realtime.messages` | Mensajes en tiempo real (referenciada) |

---

## 🐍 Core Python (lógica offline — NO HTTP)

| Archivo | Rol |
|---------|-----|
| `core/router.py` | `EquityRouter.route(query, plan)` — enrutamiento por plan |
| `core/agents.py` | Definición de agentes core |
| `core/models.py` | `PRIMARY_MODEL = "qwen/qwen3-vl-8b-thinking"` ⚠️ distinto al TS |

Tests: `tests/test_router.py` + `test_models.py` ✅

---

## 💰 Modelo de Monetización — 6 Planes

| Plan | Precio | Cadencia | Badge |
|------|--------|----------|-------|
| FREE | $0 | 30 días | EVALUATE |
| TACTICAL | $25 | /mes | POPULAR ⭐ |
| PREMIUM | $50 | /mes | MOST POWERFUL |
| MASTERMIND | $100 | /mes | ELITE |
| ENTERPRISE | $600 | /mes | ORGANIZATION |
| ALLIANCE | $1K | /año | PARTNER |

Accents Warhol por plan: cyan (#00d2ff) → violeta (#7b2ff7) → pink (#ff007f).

---

## 🎨 Design System — Warhol Pop-Art

| Token | Valor |
|-------|-------|
| Tipografía | Quicksand (display) + JetBrains Mono |
| Cyan | `#00d2ff` |
| Hot Pink | `#ff007f` |
| Background | `#0c0a1d` |
| Card | `bg-[#120e2e] rounded-2xl border-2 border-[#00d2ff] shadow-[8px_8px_0px_0px_#00d2ff]` |
| Button premium | `bg-gradient-to-r from-[#00d2ff] via-[#8a2be2] to-[#ff007f] border-2 border-white` |

**Landing actual (2 fases, sin intro):**
1. **Hero** — 5 slogans rotando cada 6s (`HERO_SLIDE_SECONDS`), fade/blur con AnimatePresence, fondo `hero-bg.jpg` sin overlay oscuro, dots clicables, scroll hint
2. **Agent Grid** — 41 agentes en grid 4×10 compacto, click → `localStorage['eq_active_agent_context']` → `/dashboard`

---

## 🔧 Implementaciones Recientes (working tree)

| Archivo | Cambio |
|---------|--------|
| `src/pages/Landing.tsx` | AgentGrid inline reemplazó AgentEliteCarousel (decisión usuario, 100% zoom) |
| `src/pages/Suscripciones.tsx` | Redesign Warhol + leather background + 6 planes |
| `supabase/functions/ai-chat/index.ts` | Mejoras de enrutamiento/costos |
| `src/lib/audit.service.ts` + `auditService.ts` | Auditoría (⚠️ dos archivos = duplicado a consolidar) |
| `src/lib/subscription-plans.ts` | Datos de planes (⚠️ duplica constantes del `_shared` TS) |
| `src/integrations/firebase/` | Analytics Firebase (nuevo) |
| `src/hooks/useAIChat.ts` | Lógica de chat con fallback de proveedor |
| `API_DOCUMENTATION.md` | Doc de API completa generada (26 KB) |
| `.vercelignore` | Evita EPERM en deploy local |
| `vite.config.ts` | Dev server en puerto **8080** + `strictPort` |

**Sin commitear:** 25 archivos modificados + 9 nuevos. Último commit: `77617b8` (2026-08-01).

---

## ⚠️ Deuda Técnica / Pendientes

| # | Issue | Severidad | Acción |
|---|-------|-----------|--------|
| 1 | Chunk principal `index-*.js` 817 KB (gzip 209 KB) | 🟡 Media | Code-splitting / manualChunks |
| 2 | Modelo Python ≠ TS (`qwen3-vl-8b` vs `nemotron-3`) | 🟡 Media | Sincronizar si el core corre en prod |
| 3 | `auditService.ts` + `audit.service.ts` duplicados | 🟢 Baja | Consolidar en uno |
| 4 | `subscription-plans.ts` duplica constantes del `_shared` | 🟢 Baja | Centralizar |
| 5 | Archivos muertos: `LandingIntro`, `SplashSequence`, `IntroSequence`, `AgentEliteCarousel`, `GhostTyper` | 🟢 Baja | Eliminar (sin imports) |
| 6 | `resolveLandingSlideUrl` ignora `lang` | 🟢 Baja | Corregir o eliminar |
| 7 | `generate-image` bloqueado en FREE (429) | 🟡 Media | Verificar plan/upgrade |
| 8 | Webhook Stripe pendiente | 🟡 Media | Implementar `stripe-webhook` |
| 9 | PostHog pendiente (solo Firebase activo) | 🟢 Baja | Configurar `VITE_ENABLE_POSTHOG` |
| 10 | `.env.example` sin `VITE_SUPABASE_PUBLISHABLE_KEY` (el runtime lo lee con fallback a ANON) | 🟢 Baja | Documentar |

---

## 🚀 Próximos Pasos Sugeridos

1. **Commit + push** del working tree (25+9 archivos) → Vercel auto-deploy
2. **Redeploy Edge Functions** (`ai-chat`, `tools-ai`) tras cambios en `_shared`
3. **Verificar credenciales prod**: `npx vercel env ls` vs `.env.local`
4. **Chunk splitting** para bajar el bundle principal
5. **Limpiar dead code** (archivos de intro eliminados)
6. **Stripe webhook** para confirmar pagos y activar `user_planes`

---

*Reporte generado por Hermes Agent · eQuityLabs · MetaLearning: ejecutar → medir → iterar*
