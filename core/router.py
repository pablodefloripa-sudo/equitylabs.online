"""Initial deterministic router for EquityLabs models and specialist agents."""

from __future__ import annotations

import os
import sys
import unicodedata
from typing import Any

if __package__ in (None, ""):
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.agents import DEFAULT_AGENT_ID, ROUTING_RULES
from core.models import get_allowed_models, normalize_plan


def normalize_query(query: str) -> str:
    """Normalize casing and accents so routing keywords remain language-safe."""
    casefolded = query.casefold()
    decomposed = unicodedata.normalize("NFKD", casefolded)
    return "".join(character for character in decomposed if not unicodedata.combining(character))


class EquityRouter:
    """Select an authorized model and an initial specialist agent group."""

    def __init__(self) -> None:
        print("EquityLabs Router inicializado")

    def route(self, query: str, user_plan: str = "free") -> dict[str, Any]:
        normalized_plan = normalize_plan(user_plan)
        allowed_models = get_allowed_models(normalized_plan)
        selected_model = allowed_models[0]
        normalized_query = normalize_query(query)
        matched_route = next(
            (
                rule
                for rule in ROUTING_RULES
                if any(keyword in normalized_query for keyword in rule.keywords)
            ),
            None,
        )
        activated_agents = list(
            matched_route.agent_ids if matched_route else (DEFAULT_AGENT_ID,)
        )
        route_name = matched_route.name if matched_route else "general"

        return {
            "status": "ok",
            "user_plan": normalized_plan,
            "selected_model": selected_model,
            "allowed_models": allowed_models,
            "activated_agents": activated_agents,
            "reasoning": (
                f"Routing basico '{route_name}' para plan {normalized_plan}"
            ),
        }


if __name__ == "__main__":
    router = EquityRouter()
    print(router.route("Plan de retiro con viajes", "premium"))
