"""Central registry of models enabled for each EquityLabs subscription plan."""


PRIMARY_MODEL = "qwen/qwen3-vl-8b-thinking"


MODELS_BY_PLAN: dict[str, list[str]] = {
    "free": [PRIMARY_MODEL],
    "tactical": [PRIMARY_MODEL],
    "premium": [PRIMARY_MODEL],
    "mastermind": [PRIMARY_MODEL],
    "enterprise": [PRIMARY_MODEL],
    "alliance": [PRIMARY_MODEL],
}


def normalize_plan(plan: str | None) -> str:
    """Return a supported plan name, defaulting safely to the free tier."""
    normalized = (plan or "free").strip().lower()
    return normalized if normalized in MODELS_BY_PLAN else "free"


def get_allowed_models(plan: str | None) -> list[str]:
    """Return a mutable copy of the models enabled for a subscription plan."""
    return list(MODELS_BY_PLAN[normalize_plan(plan)])
