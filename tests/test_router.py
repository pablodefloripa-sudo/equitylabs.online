import pytest

from core.agents import AGENT_IDS, DEFAULT_AGENT_ID, ROUTING_RULES
from core.router import EquityRouter


@pytest.fixture
def router() -> EquityRouter:
    return EquityRouter()


@pytest.mark.parametrize(
    ("query", "expected_agents"),
    [
        ("Diseña mi plan de retiro", ["ag_06", "ag_08", "ag_14"]),
        ("Analiza esta inversión", ["ag_06", "ag_08", "ag_14"]),
        ("Quiero un viaje de lujo", ["ag_10", "ag_17", "ag_40"]),
        ("Recomienda gastronomía local", ["ag_10", "ag_17", "ag_40"]),
        ("Coordina mi proyecto", [DEFAULT_AGENT_ID]),
    ],
)
def test_routes_queries_to_expected_agents(
    router: EquityRouter,
    query: str,
    expected_agents: list[str],
) -> None:
    assert router.route(query)["activated_agents"] == expected_agents


def test_first_matching_rule_has_priority(router: EquityRouter) -> None:
    result = router.route("Plan de retiro con viajes", "premium")

    assert result["activated_agents"] == ["ag_06", "ag_08", "ag_14"]


def test_unknown_plan_falls_back_to_free(router: EquityRouter) -> None:
    result = router.route("Consulta general", "unsupported")

    assert result["user_plan"] == "free"
    assert result["selected_model"] == result["allowed_models"][0]


def test_all_routing_agents_exist_in_registry() -> None:
    configured_agents = {
        agent_id
        for rule in ROUTING_RULES
        for agent_id in rule.agent_ids
    }

    assert len(AGENT_IDS) == 40
    assert configured_agents <= AGENT_IDS
