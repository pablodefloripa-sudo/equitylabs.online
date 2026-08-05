# 📘 API Documentation — EQuityLabs

> Generada automáticamente desde el código fuente (`src/`, `supabase/functions/`, `core/`, `supabase/migrations/`).
> Fecha: 2026-08-04 · Stack: React 18 + Vite + TS + Supabase Edge Functions (Deno) + Python 3.14 (core) + OpenRouter/Gateway IA.

---

## 🌐 Base URLs

| Capa | Base URL | Notas |
|------|----------|-------|
| Edge Functions (Supabase) | `https://<project-ref>.supabase.co/functions/v1/` | Deno, CORS `*` habilitado |
| Supabase REST (PostgREST) | `https://<project-ref>.supabase.co/rest/v1/` | Acceso directo a tablas (RLS) |
| Supabase Auth (GoTrue) | `https://<project-ref>.supabase.co/auth/v1/` | Signup, login, tokens |
| Supabase Storage | `https://<project-ref>.supabase.co/storage/v1/` | Buckets `documentos`, `user-files` |

**Autenticación estándar (todas las Edge Functions):**
```
Authorization: Bearer <JWT de Supabase>
```
- Sin header → `401 { "error": "Authentication required" }` (o variante en español).
- JWT inválido/expirado → `401 { "error": "Invalid or expired session" }`.
- Las funciones usan `SUPABASE_SERVICE_ROLE_KEY` internamente; el cliente NUNCA la expone.

**CORS (todas las funciones):** `Access-Control-Allow-Origin: *` · headers: `authorization, x-client-info, apikey, content-type`. `OPTIONS` → `200` vacío.

---

## 📌 Índice de Endpoints (Edge Functions)

| # | Función | Método | Ruta | Autenticación |
|---|---------|--------|------|---------------|
| 1 | AI Chat | `POST` | `/functions/v1/ai-chat` | 🔒 Requerida |
| 2 | Diagnóstico de negocio | `POST` | `/functions/v1/diagnostico` | ❌ Pública |
| 3 | Diagnóstico (verificación de auth) | `POST` | `/functions/v1/diagnostico-auth` | 🔒 Requerida |
| 4 | Generación de imágenes IA | `POST` | `/functions/v1/generate-image` | 🔒 Requerida (no FREE) |
| 5 | Gmail actions | `POST` | `/functions/v1/gmail-actions` | 🔒 Requerida + integración |
| 6 | Google Calendar | `POST` | `/functions/v1/google-calendar` | 🔒 Requerida + integración |
| 7 | Google Drive | `POST` | `/functions/v1/google-drive` | 🔒 Requerida + integración |
| 8 | Google Sheets | `POST` | `/functions/v1/google-sheets` | 🔒 Requerida + integración |
| 9 | Tools IA (8 herramientas) | `POST` | `/functions/v1/tools-ai` | 🔒 Requerida |

---

## 1️⃣ `POST /functions/v1/ai-chat`

Chat principal con enrutamiento por agente/plan. Detecta intenciones de Gmail/Drive/Sheets/Calendar y delega en las funciones Google correspondientes. Soporta adjuntos (imágenes/PDF) y persona "mascota".

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `message` | `string` | ✅ Sí | Mensaje del usuario. Vacío → error |
| `conversationHistory` | `Array<{role, content}>` | ❌ | Historial previo. Vacío = primer mensaje |
| `agentId` | `string` | ❌ | `ag_01`…`ag_40`, `ls_01`…`ls_20`, `mascota`, o clave de ruta (`orquestador`, `architect`, …). Ausente → flujo "Agent One" |
| `language` | `string` | ❌ | `es` (default), `en`, `pt`, `de`, `it`, `fr`, `zh`, `ja`, `nl`, `pl` |
| `attachments` | `Array<{name?, mimeType?, dataUrl?, size?}>` | ❌ | Máx. 4, máx. 8 MB c/u. Solo `image/*` y `application/pdf` |
| `preferredModel` | `string` | ❌ | Modelo preferido; se valida contra el plan (`isModelAllowedForPlan`). No permitido → fallback + `rejectedPreferredModel` |

### Respuesta 200
```json
{
  "response": "texto del asistente",
  "meta": {
    "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "provider": "openrouter | gateway | paid-provider",
    "requestedModel": "…",
    "effectiveModel": "…",
    "preferredModelAllowed": false,
    "rejectedPreferredModel": null,
    "plan": "FREE_30_DAYS",
    "route": "agent:ag_01 | greeting | default | drive_search | gmail_sent | …",
    "agentId": "ag_01",
    "agentRoute": "architect",
    "availableTools": { "gmail": false, "drive": false, "sheets": false, "calendar": false },
    "usage": null
  }
}
```

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Message is required" }` |
| 401 | `{ "error": "Authentication required" }` / `{ "error": "Invalid or expired session" }` |
| 402 | `{ "error": "AI credits exhausted. Please add funds…" }` |
| 429 | `{ "error": "Rate limit exceeded. Please try again later." }` |
| 500 | `{ "error": "AI service not configured" }` / `{ "error": "AI returned empty response." }` / mensaje genérico |

**Nota:** las respuestas de intención Google devuelven el mismo contrato `{ response, meta }` con `meta.action` ∈ `drive_search | sheets_read | calendar_list | gmail_read | gmail_sent | *_error`.

---

## 2️⃣ `POST /functions/v1/diagnostico`

Diagnóstico estratégico de negocio en español. Motor de reglas determinístico (`buildRulesDiagnostic`) con enriquecimiento IA en cascada: **Google (Gemini) → OpenRouter → Gateway Lovable** → fallback a reglas.

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `respuestas` | `object` (string→string) | ✅ Sí | Claves: `identidad`, `objetivo90`, `audiencia`, `presupuesto`, `plazo`, `metricas`, `competencia`, `obstaculo`, `recursos`, `problema`, … Vacío → 400 |

### Respuesta 200
```json
{
  "norteEstrategico": "string",
  "diagnostico": { "fortalezas": ["…"], "riesgos": ["…"], "oportunidades": ["…"] },
  "plan": ["1. …", "2. …", "…"],
  "meta": {
    "source": "ai | rules",
    "provider": "google | openrouter | gateway",
    "model": "gemini-2.5-flash-lite | ~openai/gpt-latest | google/gemini-2.5-pro",
    "note": "Solo cuando source=rules: 'AI no disponible…'"
  }
}
```
`source: "rules"` es el comportamiento esperado cuando no hay claves de IA configuradas (no es un error).

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Debes enviar respuestas validas." }` |
| 405 | `{ "error": "Method not allowed" }` (método ≠ POST) |
| 500 | `{ "error": "<mensaje>" }` |

---

## 3️⃣ `POST /functions/v1/diagnostico-auth`

Health-check de autenticación y entorno (diagnóstico técnico). Devuelve estado de variables de entorno y valida el JWT.

### Request
Sin body. Solo header `Authorization: Bearer <token>`.

### Respuestas
| Status | Body |
|--------|------|
| 200 | `{ "ok": true, "stage": "auth_ok", "timestamp": "…", "hasAuthHeader": true, "authHeaderPrefix": "…", "env": { "hasSupabaseUrl": true, "supabaseUrlHost": "…", "hasServiceRoleKey": true, "serviceRolePrefix": "…", "hasOpenRouterApiKey": true, "hasLovableApiKey": true }, "authResult": { "error": null, "userId": "…", "email": "…", "role": "authenticated" } }` |
| 401 | `{ "ok": false, "stage": "missing_auth_header" \| "auth_failed", … }` |
| 500 | `{ "ok": false, "stage": "unexpected_error", "error": "…" }` |

---

## 4️⃣ `POST /functions/v1/generate-image`

Generación de imágenes IA (OpenRouter `openai/gpt-image-1[-mini]` o gateway legacy Gemini). **Requiere plan de pago** — plan FREE → 429.

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `prompt` | `string` | ✅ Sí | Máx. 2000 caracteres. Vacío o >2000 → 400 |
| `model` | `string` | ❌ | `"pro"` → modelo premium (`gpt-image-1` / `gemini-3-pro-image-preview`); cualquier otro valor → modelo estándar |

### Respuesta 200
```json
{
  "imageUrl": "data:image/png;base64,…",
  "model": "openai/gpt-image-1-mini",
  "provider": "openrouter | gateway",
  "usage": null
}
```

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Prompt invalido (max 2000 chars)" }` |
| 401 | `{ "error": "Authentication required" }` / `{ "error": "Invalid or expired session" }` |
| 402 | `{ "error": "Creditos AI agotados." }` |
| 429 | `{ "error": "La generacion de imagenes no esta incluida en el plan FREE." }` (plan FREE) / `{ "error": "Limite alcanzado, intenta de nuevo en un minuto." }` |
| 500 | `{ "error": "AI no configurado" }` / mensaje del proveedor |

---

## 5️⃣ `POST /functions/v1/gmail-actions`

Acciones sobre Gmail vía API de Google. Requiere integración `user_integrations` con provider `google` (`is_connected=true`) y scopes `gmail.send` / `gmail.readonly` / `mail.google.com`. Refresca token automáticamente.

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `action` | `"send" \| "read" \| "search"` | ✅ Sí | Operación |
| `to` | `string` | Solo `send` | Destinatario email |
| `subject` | `string` | Solo `send` | Asunto |
| `body` | `string` | Solo `send` | Cuerpo (texto plano) |
| `query` | `string` | Solo `read/search` | Query Gmail (default `in:inbox is:unread`) |
| `maxResults` | `number` | ❌ | Default 5 |

### Respuesta 200
`send`:
```json
{ "success": true, "action": "send", "data": { "messageId": "…", "threadId": "…", "message": "Email enviado a …" } }
```
`read`/`search`:
```json
{ "success": true, "action": "read", "data": { "emails": [ { "id": "…", "from": "…", "subject": "…", "snippet": "…", "date": "…" } ], "count": 5, "query": "…" } }
```

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Faltan campos requeridos: to, subject, body" }` / `{ "error": "Acción no soportada: …" }` |
| 401 | `{ "error": "No autorizado", "requiresAuth": true, "message": "Inicia sesión para usar Gmail." }` / `{ "error": "Sesión inválida o expirada", … }` |
| 403 | `{ "error": "Gmail no conectado", … }` / `{ "error": "Permisos insuficientes", … }` |
| 500 | `{ "error": "<mensaje>", "requiresAuth": <bool> }` |

---

## 6️⃣ `POST /functions/v1/google-calendar`

Eventos de Google Calendar. Requiere integración `google` conectada. Timezone por defecto: `America/Argentina/Buenos_Aires`.

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `action` | `"list" \| "create" \| "delete" \| "get"` | ✅ Sí | Operación |
| `calendarId` | `string` | ❌ | Default `primary` |
| `eventId` | `string` | `delete`/`get` | ID del evento |
| `event` | `object` | `create` | `{ summary, description?, start (ISO), end (ISO), timeZone?, attendees?: string[] }` — requiere `summary`, `start`, `end` |
| `timeMin` / `timeMax` | `string` (ISO) | ❌ | Filtro de rango (`list`) |
| `maxResults` | `number` | ❌ | Default 10 |

### Respuesta 200
`list`:
```json
{ "success": true, "data": { "events": [ { "id": "…", "summary": "…", "description": "…", "start": "…", "end": "…", "link": "…", "attendees": [ { "email": "…", "status": "accepted" } ] } ], "count": 0 } }
```
`create` / `get`: `{ "success": true, "data": { "id", "summary", "description", "start", "end", "link" } }` (+`attendees` en `get`)
`delete`: `{ "success": true, "data": { "deleted": "<eventId>" } }`

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Google Calendar not connected" }` |
| 401 | `{ "error": "No authorization header" }` / `{ "error": "Invalid token" }` |
| 500 | `{ "error": "<mensaje>" }` (incluye `event with summary, start, and end is required`, `eventId is required`, `Unknown action: …`) |

---

## 7️⃣ `POST /functions/v1/google-drive`

Archivos de Google Drive. Requiere integración `google` conectada.

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `action` | `"search" \| "get" \| "list_folders"` | ✅ Sí | Operación |
| `query` | `string` | ❌ | Nombre a buscar (`name contains '…'`) |
| `folderId` | `string` | ❌ | Filtro `'…' in parents` |
| `fileId` | `string` | `get` | ID del archivo |
| `maxResults` | `number` | ❌ | Default 10 |

### Respuesta 200
`search`: `{ "success": true, "data": { "files": [ { "id", "name", "mimeType", "createdTime", "modifiedTime", "size", "webViewLink", "iconLink" } ], "count": 0 } }`
`get`: `{ "success": true, "data": { "id", "name", "mimeType", "createdTime", "modifiedTime", "size", "webViewLink", "content": "<texto o null; truncado a 10.000 chars>" } }`
`list_folders`: `{ "success": true, "data": { "folders": [ { "id", "name", "createdTime" } ] } }`

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Google Drive not connected" }` |
| 401 | `{ "error": "No authorization header" }` / `{ "error": "Invalid token" }` |
| 500 | `{ "error": "<mensaje>" }` (`fileId is required for get action`, `Unknown action: …`) |

---

## 8️⃣ `POST /functions/v1/google-sheets`

Hojas de cálculo de Google Sheets. Requiere integración `google` conectada.

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `action` | `"read" \| "write" \| "append" \| "get_metadata"` | ✅ Sí | Operación |
| `spreadsheetId` | `string` | ✅ (excepto `get_metadata` igual) | ID de la hoja |
| `range` | `string` | `write`/`append` | Rango A1, ej. `A1:Z1000` (default en read) |
| `values` | `string[][]` | `write`/`append` | Matriz de celdas |

### Respuesta 200
`read`: `{ "success": true, "data": { "range": "…", "values": [[…]], "rowCount": 0 } }`
`write`: `{ "success": true, "data": { "updatedRange": "…", "updatedRows": 0, "updatedColumns": 0, "updatedCells": 0 } }`
`append`: `{ "success": true, "data": { "updatedRange": "…", "updatedRows": 0 } }`
`get_metadata`: `{ "success": true, "data": { "title": "…", "sheets": [ { "id": 0, "title": "…", "index": 0 } ] } }`

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Google Sheets not connected" }` |
| 401 | `{ "error": "No authorization header" }` / `{ "error": "Invalid token" }` |
| 500 | `{ "error": "<mensaje>" }` (`spreadsheetId is required`, `spreadsheetId, range, and values are required`, `Unknown action: …`) |

---

## 9️⃣ `POST /functions/v1/tools-ai`

Herramientas de IA especializadas con system-prompts fijos. Requiere proveedor IA pagado (`OPENROUTER_API_KEY` o `LOVABLE_API_KEY`).

### Request body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tool` | `string` | ✅ Sí | Una de las 8 claves (abajo) |
| `prompt` | `string` | ✅ Sí | Máx. 4000 caracteres |

### Tools disponibles
| Tool | Salida (Markdown) | Max tokens |
|------|-------------------|------------|
| `deep_research` | Resumen Ejecutivo, Hallazgos, Datos Clave, Riesgos/Contradicciones, Próximos Pasos | 2400 |
| `create_video_brief` | Logline, Audiencia, Tono, Estructura escena a escena, Estilo visual, Música/SFX, CTA | 1500 |
| `create_music_brief` | Género, BPM, Tonalidad, Instrumentación, Estructura, Mood, Referencias, Letras | 1200 |
| `canvas_organize` | Mapa mental jerárquico Markdown + conexiones | 1500 |
| `generate_report` | Portada, Resumen Ejecutivo, Contexto, Análisis, KPIs, Recomendaciones, Conclusión | 2400 |
| `market_analysis` | TAM/SAM/SOM, Competidores, Tendencias, Oportunidades, Amenazas, Recomendación | 2400 |
| `prompt_engineer` | Prompt final optimizado (ROL+OBJETIVO+CONTEXTO+RESTRICCIONES+FORMATO+EJEMPLO) | 1200 |
| `project_metrics` | KPIs, Velocidad/Burndown, Milestones, Riesgos, Métricas de calidad, Recomendaciones | 2000 |

### Respuesta 200
```json
{ "content": "markdown…", "model": "…", "requestedModel": "nvidia/nemotron-3-ultra-550b-a55b:free", "provider": "…", "plan": "FREE_30_DAYS" }
```

### Errores
| Status | Body |
|--------|------|
| 400 | `{ "error": "Tool inválido" }` / `{ "error": "Prompt inválido (max 4000 chars)" }` |
| 401 | `{ "error": "Authentication required" }` / `{ "error": "Invalid or expired session" }` |
| 402 | `{ "error": "AI credits exhausted…" }` |
| 429 | `{ "error": "Rate limit exceeded…" }` |
| 500 | `{ "error": "AI no configurado" }` / mensaje |

---

## 🧩 Módulo compartido `_shared/subscription-routing.ts`

No es un endpoint; lo importan `ai-chat`, `tools-ai` y `generate-image`. Define el **contrato de planes, modelos y agentes**:

- **Planes (`SubscriptionPlanKey`)**: `FREE_30_DAYS`, `TACTICAL_25`, `PREMIUM_50`, `MASTERMIND_100`, `ENTERPRISE_500`, `ALLIANCE_1000`. Normaliza claves legacy (`free`, `tactical`, …).
- **Modelo primario**: `EQUITYLABS_PRIMARY_MODEL = nvidia/nemotron-3-ultra-550b-a55b:free` (fallback OpenRouter: mismo modelo).
- **Agentes (`AgentKey`)**: `orquestador, analista, escritor, investigador, desarrollador, disenador, revisor, asistente, architect, logic, recepcionista` — todos enrutados al modelo primario (routing single-model).
- **Proveedores**: `openrouter` (prioridad) → `gateway` (Lovable). `hasPaidAIProvider()` retorna falso sin ninguna clave → funciones responden 500 "AI no configurado".
- **Fallback OpenRouter**: si el modelo primario responde 400/404 con `model/not found/unavailable/no endpoints/unknown`, reintenta con el modelo de respaldo (solo si son distintos).
- **`getUserPlanState()`**: lee `user_planes` (tabla) y devuelve `{ plan, status, endDate }`.

---

## 🐍 Core Python (lógica interna — NO es HTTP)

Ubicación: `EquityLabs20261/core/` · Python 3.14 · Usado por tests (`tests/test_router.py`, `tests/test_models.py`) y potencialmente por tooling offline.

| Módulo | Símbolo | Entrada | Salida |
|--------|---------|---------|--------|
| `core/router.py` | `EquityRouter.route(query, user_plan="free")` | texto libre + plan | `{ status: "ok", user_plan, selected_model, allowed_models, activated_agents, reasoning }` |
| `core/models.py` | `get_allowed_models(plan)` / `normalize_plan(plan)` | plan | lista de modelos por plan |
| `core/agents.py` | `ROUTING_RULES` / `DEFAULT_AGENT_ID` | — | reglas de routing + validación del registro |

**Modelo primario Python**: `qwen/qwen3-vl-8b-thinking` (⚠️ difiere del modelo primario TS — sincronizar si se usa en producción).

**Reglas de routing** (`ROUTING_RULES`):
| Ruta | Keywords (normalizadas, sin acentos) | Agentes activados |
|------|-------------------------------------|-------------------|
| `financial_planning` | `retiro`, `finanzas`, `inversion` | `ag_06`, `ag_08`, `ag_14` |
| `travel_and_luxury` | `viaje`, `gastronomia`, `lujo` | `ag_10`, `ag_17`, `ag_40` |
| `general` (default) | — | `ag_12` (DEFAULT_AGENT_ID) |

**Agentes**: registro `ag_01`…`ag_40` (40 agentes, `frozenset`). Fallo rápido si una regla referencia un ID inexistente.

---

## 🖥️ Rutas del Frontend (React Router)

Definidas en `src/App.tsx`. Todas lazy-loaded. `AuthGuard` redirige a `/auth` si no hay sesión.

| Ruta | Página | Guard |
|------|--------|-------|
| `/landing` | Landing (hero + grid de 40 agentes) | — |
| `/auth` | Login/Registro | — |
| `/register` | Auth (modo registro) | — |
| `/reset-password` | Reset de contraseña | — |
| `/suscripciones` | Planes de suscripción | — |
| `/diagnostico` | Diagnóstico de negocio | — |
| `/oauth/consent` | Consentimiento OAuth | — |
| `/mascota-paseo` | Mascota | 🔒 AuthGuard |
| `/admin` | Admin dashboard | 🔒 AuthGuard |
| `/dashboard` | Dashboard principal (Index) | 🔒 AuthGuard |
| `/` | Index → Dashboard | 🔒 AuthGuard |
| `*` | NotFound (catch-all) | — |

---

## 🗄️ Modelos de Datos (Supabase — SQL)

Fuente: `supabase/migrations/*.sql`. Todas las tablas con RLS activado (políticas por `auth.uid()`).

### `profiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `user_id` | UUID FK → `auth.users` | UNIQUE NOT NULL, ON DELETE CASCADE |
| `email` | TEXT | |
| `display_name` | TEXT | |
| `stripe_secret_key_encrypted` | TEXT | |
| `wallpaper_url` | TEXT | |
| `wallpaper_opacity` | FLOAT | default 0.3 |
| `music_preference` | TEXT | añadida en migración posterior |
| `created_at` / `updated_at` | TIMESTAMPTZ | trigger `update_updated_at_column()` |

Triggers anti-escalada de privilegios: `prevent_profile_insert_escalation`, `prevent_profile_privilege_escalation`.

### `user_integrations`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → `auth.users` | ON DELETE CASCADE |
| `provider` | TEXT | `google`, `gmail`, `drive`, `calendar`, `sheets` |
| `is_connected` | BOOLEAN | default false |
| `access_token_encrypted` / `refresh_token_encrypted` | TEXT | |
| `token_expires_at` | TIMESTAMPTZ | refresco automático |
| `scopes` | TEXT[] | |
| `connected_at` / `created_at` | TIMESTAMPTZ | |
| UNIQUE | `(user_id, provider)` | |

Trigger `handle_google_oauth_tokens()` persiste tokens OAuth de Google desde `auth.users.raw_app_meta_data` al login.

### `user_planes`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID | UNIQUE NOT NULL |
| `plan` | TEXT | default `FREE_30_DAYS`; valores `FREE_30_DAYS`, `TACTICAL_25`, `PREMIUM_50`, `MASTERMIND_100`, `ENTERPRISE_500`, `ALLIANCE_1000` |
| `status` | TEXT | default `active` |
| `start_date` / `end_date` | TIMESTAMPTZ | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `tool_executions`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID NOT NULL | índice `idx_tool_executions_user_id` |
| `tool_name` | TEXT | |
| `input` / `output` | JSONB | default `{}` |
| `status` | TEXT | default `pending` |
| `error` | TEXT | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `free_ai_usage` (cuota diaria de IA gratuita)
| Columna | Tipo | Notas |
|---------|------|-------|
| `user_id` | UUID | PK compuesta |
| `usage_date` | DATE | PK compuesta, default `current_date` |
| `request_count` | INTEGER | default 0 |
| `updated_at` | TIMESTAMPTZ | |

Función: `consume_free_ai_quota(p_user_id uuid, p_daily_limit integer) → boolean` (SECURITY DEFINER, atómica con `FOR UPDATE`).

### `audit_logs`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → `auth.users` | ON DELETE SET NULL |
| `action_type` | TEXT NOT NULL | índice |
| `entity_type` / `entity_id` | TEXT / UUID | |
| `details` | JSONB | default `{}` |
| `created_at` | TIMESTAMPTZ | índice |
| `ip_address` | INET | |
| `user_agent` | TEXT | |

### Otras entidades referenciadas
- `leads_enterprise`: solo policies en migraciones (tabla creada externamente); `user_id` NOT NULL, insert/update/delete solo para `authenticated`.
- `realtime.messages`: RLS por topic `user:<uid>` (canales privados de realtime).
- **Storage buckets**: `documentos` (privado), `user-files` (privado, paths `{uid}/…` con policy de UPDATE por owner).

---

## 🔑 Flujo de Autenticación (GoTrue)

Endpoints estándar de Supabase Auth (usados por `src/hooks/useAuth.ts`, `useGoogleOAuth.ts`):

| Método | Ruta | Body | Respuesta clave |
|--------|------|------|-----------------|
| `POST` | `/auth/v1/signup` | `{ email, password, options? }` | `{ user, session }` |
| `POST` | `/auth/v1/token?grant_type=password` | `{ email, password }` | `{ access_token, refresh_token, user }` |
| `POST` | `/auth/v1/token?grant_type=refresh_token` | `{ refresh_token }` | `{ access_token, … }` |
| `GET` | `/auth/v1/user` | `Authorization: Bearer <token>` | `{ id, email, … }` |
| `POST` | `/auth/v1/reset-password` | `{ email }` | 200 (email enviado) |
| `POST` | `/auth/v1/logout` | Bearer token | 204 |

**OAuth Google**: `/auth/v1/authorize?provider=google&redirect_to=…` → callback → `/oauth/consent` → trigger SQL persiste tokens en `user_integrations`.

---

## ⚙️ Variables de Entorno (Edge Functions)

| Variable | Usada en | Obligatoria |
|----------|----------|-------------|
| `SUPABASE_URL` | Todas (auto-inyectada) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas (auto-inyectada) | ✅ |
| `OPENROUTER_API_KEY` | ai-chat, tools-ai, generate-image, diagnostico, diagnostico-auth | ⚠️ al menos una con `LOVABLE_API_KEY` |
| `LOVABLE_API_KEY` | ai-chat, tools-ai, generate-image, diagnostico | ⚠️ idem |
| `GOOGLE_FREE_API_KEY` / `GOOGLE_API_KEY` | diagnostico (Gemini) | ❌ fallback a reglas |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | gmail-actions, google-*, refresh de tokens | ✅ si se usan integraciones Google |
| `FREE_GOOGLE_MODEL` | diagnostico | ❌ default `gemini-2.5-flash-lite` |
| `OPENROUTER_HTTP_REFERER` / `PUBLIC_SITE_URL` / `SITE_URL` | generate-image, subscription-routing | ❌ |

**Frontend (Vite, baked at build)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (o `VITE_SUPABASE_PUBLISHABLE_KEY`), `VITE_AUTH_REDIRECT_ORIGIN`, `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_CHECKOUT_*`.

---

## 🧪 Cómo probar un endpoint (curl)

```bash
# 1. Crear usuario de prueba
curl -X POST "https://<ref>.supabase.co/auth/v1/signup" \
  -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"email":"test@equitylabs.ai","password":"supersecret"}'

# 2. Obtener token
TOKEN=$(curl -s -X POST "https://<ref>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"email":"test@equitylabs.ai","password":"supersecret"}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 3. Llamar ai-chat
curl -s -X POST "https://<ref>.supabase.co/functions/v1/ai-chat" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Hola","language":"es"}'

# 4. Diagnóstico público
curl -s -X POST "https://<ref>.supabase.co/functions/v1/diagnostico" \
  -H "Content-Type: application/json" \
  -d '{"respuestas":{"identidad":"SaaS de IA","objetivo90":"10 clientes","audiencia":"PyMEs"}}'
```

> ⚠️ `diagnostico-auth` responde 401 con anon key ("Invalid or expired session") — necesita un JWT real.
> ⚠️ Si el modelo IA responde "non-2xx status code": verificar `OPENROUTER_API_KEY` real (no placeholder) y créditos. Ver skill `equitylabs-workflow` → referencia `openrouter-model-pricing.md`.

---

## 📁 Inventario de archivos fuente

| Capa | Archivos |
|------|----------|
| Controladores (Edge Functions) | `supabase/functions/{ai-chat,diagnostico,diagnostico-auth,generate-image,gmail-actions,google-calendar,google-drive,google-sheets,tools-ai}/index.ts` |
| Lógica compartida | `supabase/functions/_shared/subscription-routing.ts` |
| Esquemas/DTOs TS | `src/integrations/supabase/types.ts`, tipos inline en cada función |
| Rutas frontend | `src/App.tsx` (+ `pages/*.tsx`) |
| Modelos SQL | `supabase/migrations/*.sql` |
| Core Python (routing offline) | `core/{router,models,agents}.py` |
| Tests | `tests/test_router.py`, `tests/test_models.py` |
