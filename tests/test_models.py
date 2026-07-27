import pytest

from core.models import MODELS_BY_PLAN, PRIMARY_MODEL, get_allowed_models, normalize_plan


@pytest.mark.parametrize(
    ("raw_plan", "expected"),
    [
        ("free", "free"),
        (" PREMIUM ", "premium"),
        ("TACTICAL", "tactical"),
        ("unknown", "free"),
        ("", "free"),
        (None, "free"),
    ],
)
def test_normalize_plan(raw_plan: str | None, expected: str) -> None:
    assert normalize_plan(raw_plan) == expected


def test_every_plan_has_at_least_one_model() -> None:
    assert all(models for models in MODELS_BY_PLAN.values())


def test_get_allowed_models_returns_a_copy() -> None:
    models = get_allowed_models("free")
    models.clear()

    assert get_allowed_models("free")


def test_every_plan_uses_the_single_primary_model() -> None:
    assert all(models == [PRIMARY_MODEL] for models in MODELS_BY_PLAN.values())
