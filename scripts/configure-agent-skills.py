#!/usr/bin/env python3
"""EquityLabs — Configura engines + skills por agente (41 agentes).
Decisión Hermes Ago 2026:
- engines.free  = nemotron free (plan FREE)
- engines.pro   = modelo según categoría/keyword (deepseek para código, kimi para análisis/estrategia/ES)
- skills[]      = capacidades especializadas por categoría + overrides por keyword de la misión
Escribe lifestyleAgents.json preservando el resto de campos.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "src" / "data" / "lifestyleAgents.json"

NEMOTRON_FREE = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
DEEPSEEK = "deepseek/deepseek-v4-flash"
KIMI = "moonshotai/kimi-k2.5"
KIMI_THINKING = "moonshotai/kimi-k2-thinking"
QWEN = "qwen/qwen3.7-flash"
CLAUDE = "anthropic/claude-haiku-4.5"

def sm(mid, tier, purpose):
    return {"id": mid, "tier": tier, "purpose": purpose}

# Modelos de soporte por dominio: 5 budget + 1 premium (restringido a reporte semanal).
# El premium SIEMPRE es Claude (uso restringido); los budget varían según la especialidad.
def support_for(domain):
    base_budget = [
        sm(KIMI, "budget", "análisis y estrategia"),
        sm(KIMI_THINKING, "budget", "razonamiento profundo"),
        sm(DEEPSEEK, "budget", "procesamiento rápido"),
        sm(QWEN, "budget", "resumen y soporte"),
        sm(NEMOTRON_FREE, "budget", "fallback gratuito"),
    ]
    ordering = {
        "code": [sm(DEEPSEEK, "budget", "código y automatización"), sm(QWEN, "budget", "tareas rápidas"), sm(KIMI, "budget", "arquitectura"), sm(KIMI_THINKING, "budget", "debug profundo"), sm(NEMOTRON_FREE, "budget", "fallback gratuito")],
        "analysis": [sm(KIMI, "budget", "análisis de mercado"), sm(KIMI_THINKING, "budget", "razonamiento profundo"), sm(DEEPSEEK, "budget", "procesamiento de datos"), sm(QWEN, "budget", "resumen"), sm(NEMOTRON_FREE, "budget", "fallback gratuito")],
        "writing": [sm(KIMI, "budget", "redacción"), sm(KIMI_THINKING, "budget", "profundidad"), sm(QWEN, "budget", "borradores"), sm(DEEPSEEK, "budget", "edición"), sm(NEMOTRON_FREE, "budget", "fallback gratuito")],
        "creative": [sm(KIMI, "budget", "concepto creativo"), sm(QWEN, "budget", "rapidez"), sm(KIMI_THINKING, "budget", "ideación"), sm(DEEPSEEK, "budget", "ejecución"), sm(NEMOTRON_FREE, "budget", "fallback gratuito")],
        "social": [sm(KIMI, "budget", "estrategia de contenido"), sm(QWEN, "budget", "respuestas rápidas"), sm(DEEPSEEK, "budget", "métricas"), sm(KIMI_THINKING, "budget", "planificación"), sm(NEMOTRON_FREE, "budget", "fallback gratuito")],
        "wellness": [sm(KIMI, "budget", "acompañamiento"), sm(QWEN, "budget", "rapidez"), sm(NEMOTRON_FREE, "budget", "fallback gratuito"), sm(DEEPSEEK, "budget", "lógica"), sm(KIMI_THINKING, "budget", "profundidad")],
        "lifestyle": [sm(QWEN, "budget", "rapidez"), sm(KIMI, "budget", "calidad"), sm(NEMOTRON_FREE, "budget", "fallback gratuito"), sm(DEEPSEEK, "budget", "lógica"), sm(KIMI_THINKING, "budget", "profundidad")],
    }
    budgets = ordering.get(domain, base_budget)
    return budgets + [sm(CLAUDE, "premium", "reporte semanal")]

SKILLS_BY_BADGE = {
    "CAREER": [
        "análisis de carrera y proyección profesional",
        "optimización de CV, LinkedIn y perfil profesional",
        "preparación de entrevistas y negociación salarial",
        "estrategia de networking y marca personal",
        "planes de desarrollo de habilidades",
    ],
    "BUSINESS": [
        "estrategia de negocio y análisis de mercado",
        "planes de negocio y modelos de ingresos",
        "finanzas empresariales y métricas (KPI, ROI)",
        "automatización de procesos y operaciones",
        "propuestas comerciales y presentaciones a clientes",
    ],
    "ENTREPRENEURSHIP": [
        "validación de ideas y lean startup",
        "modelo de negocio y pricing",
        "pitch, fundraising y finanzas de arranque",
        "growth marketing y adquisición de usuarios",
        "metodologías ágiles y ejecución de proyectos",
    ],
    "WELLNESS": [
        "bienestar emocional y manejo del estrés",
        "hábitos saludables y rutinas sostenibles",
        "productividad personal y gestión del tiempo",
        "mindfulness y enfoque",
        "acompañamiento motivacional",
    ],
    "LIFESTYLE": [
        "organización personal y planificación",
        "planificación de eventos y vida social",
        "estilo de vida y ocio inteligente",
        "relaciones interpersonales y comunicación",
        "viajes, hobbies y experiencias",
    ],
}

# Overrides por keyword de la misión (más específicos que la categoría)
KEYWORD_SKILLS = [
    (re.compile(r"public speaking|hablar en publico|oratoria|discurso|presentac|speech|confianza escenica", re.I),
     ["técnicas de oratoria y comunicación", "estructura de discursos y presentaciones", "manejo de voz, ritmo y lenguaje corporal", "storytelling en presentaciones", "control de nervios y confianza escénica"]),
    (re.compile(r"film|cinema|cine|movie|pelicul|director de cine|video production|short film|rodaje", re.I),
     ["dirección cinematográfica y narrativa visual", "guion y estructura de historias", "dirección de actores y puesta en escena", "planificación de rodaje (storyboard, shot list)", "edición y postproducción de video"]),
    (re.compile(r"crypto|defi|bitcoin|blockchain|token|nft|web3|trading", re.I),
     ["análisis de criptomonedas y mercados", "fundamentos DeFi y yield farming", "seguridad de wallets y buenas prácticas", "evaluación de proyectos token", "gestión de riesgo y portafolio crypto"]),
    (re.compile(r"real estate|propiedad|inmobiliari|rental|landlord", re.I),
     ["análisis de propiedades e inversión inmobiliaria", "evaluación de flujo de caja (ROI, cap rate)", "negociación de compra/venta", "financiamiento e hipotecas", "expansión de portafolio inmobiliario"]),
    (re.compile(r"fitness|health|gym|entrenam|workout|salud|nutrici", re.I),
     ["planes de entrenamiento y acondicionamiento", "nutrición y hábitos alimentarios", "seguimiento de progreso y métricas", "recuperación y prevención de lesiones", "motivación y consistencia"]),
    (re.compile(r"social|instagram|tiktok|youtube|influencer|redes|content creator", re.I),
     ["estrategia de contenido para redes sociales", "crecimiento orgánico y engagement", "branding personal en plataformas", "calendario de contenido", "análisis de métricas sociales"]),
    (re.compile(r"financ|wealth|money|invest|riqueza|dinero|inversi", re.I),
     ["análisis financiero personal", "presupuestos y ahorro", "estrategia de inversión", "planificación fiscal básica", "educación financiera"]),
    (re.compile(r"travel|viaje|aventura|explor", re.I),
     ["planificación de viajes y rutas", "optimización de presupuesto de viaje", "experiencias y cultura local", "itinerarios flexibles", "fotografía y registro de viajes"]),
    (re.compile(r"music|arte|creativ|design|diseñ|dibuj|pint", re.I),
     ["desarrollo de habilidades creativas", "proyectos de arte y diseño", "técnicas de expresión creativa", "portafolio creativo", "colaboración artística"]),
    (re.compile(r"code|software|develop|program|build app|web|developer|crear", re.I),
     ["desarrollo de software y código", "automatización con scripts", "integración de APIs", "revisión de código", "arquitectura técnica"]),
    (re.compile(r"writ|content|blog|copy|book|libro|escrib", re.I),
     ["redacción y edición de contenido", "copywriting y persuasión", "estructura de libros y artículos", "storytelling", "revisión de estilo"]),
    (re.compile(r"market|ventas|sales|lead|clientes", re.I),
     ["estrategia de marketing", "embudos de venta (funnels)", "copy de conversión", "análisis de métricas", "CRM y seguimiento de leads"]),
]

KEYWORD_MODELS = [
    (re.compile(r"code|software|develop|program|app|web|script", re.I), DEEPSEEK),
]

# Dominio → regex (alineado con KEYWORD_SKILLS: primer match define el dominio)
DOMAIN_PATTERNS = [
    ("public_speaking", re.compile(r"public speaking|hablar en publico|oratoria|discurso|presentac|speech", re.I)),
    ("film", re.compile(r"film|cinema|cine|movie|pelicul|director de cine|video production|rodaje", re.I)),
    ("analysis", re.compile(r"crypto|defi|bitcoin|blockchain|token|nft|web3|trading|real estate|propiedad|inmobiliari|financ|wealth|money|invest|riqueza|dinero|inversi", re.I)),
    ("wellness", re.compile(r"fitness|health|gym|entrenam|workout|salud|nutrici|yoga|meditac|bienestar", re.I)),
    ("social", re.compile(r"social|instagram|tiktok|youtube|influencer|redes|content creator", re.I)),
    ("code", re.compile(r"code|software|develop|program|build app|web|developer|crear", re.I)),
    ("writing", re.compile(r"writ|content|blog|copy|book|libro|escrib", re.I)),
    ("creative", re.compile(r"music|arte|creativ|design|diseñ|dibuj|pint|culinary|cocina|chef", re.I)),
    ("lifestyle", re.compile(r"travel|viaje|aventura|explor", re.I)),
]

def detect_domain(mission):
    for name, rx in DOMAIN_PATTERNS:
        if rx.search(mission):
            return name
    return "lifestyle"

def build_agent(agent):
    name = agent.get("name", {}).get("en", "")
    mission = " ".join(str(agent.get("mission", {}).get(k, "")) for k in ("en", "es"))
    badge = agent.get("badge", "").upper()

    # Skills: overrides por keyword primero; si no, por badge; si no, genéricas
    skills = None
    for rx, sk in KEYWORD_SKILLS:
        if rx.search(mission):
            skills = sk
            break
    if skills is None:
        skills = SKILLS_BY_BADGE.get(badge, SKILLS_BY_BADGE["LIFESTYLE"])

    # Modelo pro: keyword code → DeepSeek; resto (análisis/estrategia/ES) → Kimi
    pro_model = KIMI
    for rx, mdl in KEYWORD_MODELS:
        if rx.search(mission):
            pro_model = mdl
            break

    agent["engines"] = {"free": NEMOTRON_FREE, "pro": pro_model}
    agent["freeModels"] = [NEMOTRON_FREE]
    agent["proModels"] = [pro_model]
    agent["proStack"] = pro_model
    agent["skills"] = skills

    # Modelos de soporte: 5 budget + 1 premium (reporte semanal) según dominio
    domain = detect_domain(mission)
    agent["supportModels"] = support_for(domain)
    return agent

def main():
    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)
    agents = data.get("agents", [])
    print(f"Configurando {len(agents)} agentes...")
    counts = {}
    for a in agents:
        build_agent(a)
        mdl = a["engines"]["pro"]
        counts[mdl] = counts.get(mdl, 0) + 1
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Modelos pro asignados:", counts)
    print("Skills por agente: OK (campo 'skills' agregado)")
    fin = [a for a in agents if a["id"] == "ls_09"]
    if fin:
        print("Ejemplo ls_09:", fin[0]["engines"], "| skills:", fin[0]["skills"][:3])

if __name__ == "__main__":
    main()
