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
    (re.compile(r"financ|wealth|money|invest|real estate|propiedad|riqueza|dinero|inversi", re.I),
     ["análisis financiero personal", "presupuestos y ahorro", "estrategia de inversión", "planificación fiscal básica", "educación financiera"]),
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
