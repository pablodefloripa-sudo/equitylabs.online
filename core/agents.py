"""Central registry and deterministic routing rules for EquityLabs agents."""

from dataclasses import dataclass
from typing import Final


AGENT_IDS: Final[frozenset[str]] = frozenset(
    f"ag_{number:02d}" for number in range(1, 41)
)
DEFAULT_AGENT_ID: Final[str] = "ag_12"


@dataclass(frozen=True, slots=True)
class AgentRoute:
    """Maps a group of user-intent keywords to specialist agents."""

    name: str
    keywords: tuple[str, ...]
    agent_ids: tuple[str, ...]


ROUTING_RULES: Final[tuple[AgentRoute, ...]] = (
    AgentRoute(
        name="financial_planning",
        keywords=("retiro", "finanzas", "inversion"),
        agent_ids=("ag_06", "ag_08", "ag_14"),
    ),
    AgentRoute(
        name="travel_and_luxury",
        keywords=("viaje", "gastronomia", "lujo"),
        agent_ids=("ag_10", "ag_17", "ag_40"),
    ),
)


def validate_agent_registry() -> None:
    """Fail fast when a routing rule references an unknown agent."""
    configured_ids = {
        agent_id
        for route in ROUTING_RULES
        for agent_id in route.agent_ids
    }
    unknown_ids = configured_ids - AGENT_IDS

    if DEFAULT_AGENT_ID not in AGENT_IDS:
        unknown_ids.add(DEFAULT_AGENT_ID)

    if unknown_ids:
        unknown = ", ".join(sorted(unknown_ids))
        raise ValueError(f"Unknown agent IDs in routing registry: {unknown}")


validate_agent_registry()
