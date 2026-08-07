"""Match Score v1 — sof funksiya, DB yoki tarmoqsiz to'liq deterministik test."""

import pytest

from app.core.match_score import compute_match_score
from app.models.enums import WorkFormat


def _score(**kwargs: object) -> int:
    defaults: dict[str, object] = {
        "vacancy_ladder_step": 2,
        "user_max_ladder_step": 2,
        "work_format": WorkFormat.REMOTE,
        "user_remote_only": False,
        "vacancy_region_id": None,
        "user_region_id": None,
    }
    defaults.update(kwargs)
    return compute_match_score(**defaults)  # type: ignore[arg-type]


def test_perfect_match_remote_same_step() -> None:
    assert _score() == 100


def test_user_above_required_step_still_full_step_score() -> None:
    assert _score(vacancy_ladder_step=1, user_max_ladder_step=3) == 100


def test_user_one_step_below_gets_partial_credit() -> None:
    score = _score(vacancy_ladder_step=3, user_max_ladder_step=2)
    assert score == 20 + 35 + 25  # step partial + remote + region(remote)


def test_user_far_below_step_gets_zero_step_credit() -> None:
    score = _score(vacancy_ladder_step=3, user_max_ladder_step=0)
    assert score == 0 + 35 + 25


def test_office_vacancy_with_remote_only_user_scores_zero_on_format() -> None:
    score = _score(work_format=WorkFormat.OFFICE, user_remote_only=True)
    # step=40, format=0, region: office & no region set -> 5
    assert score == 40 + 0 + 5


def test_office_vacancy_matches_flexible_user() -> None:
    score = _score(work_format=WorkFormat.OFFICE, user_remote_only=False)
    assert score == 40 + 35 + 5


def test_hybrid_vacancy_with_remote_only_user_gets_partial_format_credit() -> None:
    score = _score(work_format=WorkFormat.HYBRID, user_remote_only=True)
    assert score == 40 + 10 + 5


def test_hybrid_vacancy_with_flexible_user() -> None:
    score = _score(work_format=WorkFormat.HYBRID, user_remote_only=False)
    assert score == 40 + 20 + 5


def test_office_same_region_scores_full_region_credit() -> None:
    score = _score(work_format=WorkFormat.OFFICE, vacancy_region_id=5, user_region_id=5)
    assert score == 40 + 35 + 25


def test_office_different_region_scores_low_region_credit() -> None:
    score = _score(work_format=WorkFormat.OFFICE, vacancy_region_id=5, user_region_id=9)
    assert score == 40 + 35 + 5


def test_remote_ignores_region_mismatch() -> None:
    score = _score(work_format=WorkFormat.REMOTE, vacancy_region_id=5, user_region_id=9)
    assert score == 40 + 35 + 25


def test_worst_case_score_is_low_but_not_negative() -> None:
    score = _score(
        vacancy_ladder_step=4,
        user_max_ladder_step=0,
        work_format=WorkFormat.OFFICE,
        user_remote_only=True,
        vacancy_region_id=5,
        user_region_id=9,
    )
    # step=0, format=0, region(mismatch, non-remote)=5 — hali ham ko'rinadi, lekin past
    assert score == 5
    assert score >= 0


@pytest.mark.parametrize(
    "vacancy_step,user_step,expected",
    [(0, 0, 40), (1, 0, 20), (2, 1, 20), (4, 4, 40), (4, 3, 20), (4, 2, 0)],
)
def test_step_score_matrix(vacancy_step: int, user_step: int, expected: int) -> None:
    score = _score(
        vacancy_ladder_step=vacancy_step,
        user_max_ladder_step=user_step,
        work_format=WorkFormat.OFFICE,
        vacancy_region_id=1,
        user_region_id=1,
    )
    # format(35) + region(25) doim bir xil shu holatda — step qismini ayirib tekshiramiz
    assert score - 35 - 25 == expected


def test_accommodations_bonus_adds_five_points_to_imperfect_match() -> None:
    without = _score(vacancy_ladder_step=3, user_max_ladder_step=2)
    with_bonus = _score(vacancy_ladder_step=3, user_max_ladder_step=2, has_accommodations=True)
    assert with_bonus == without + 5


def test_accommodations_bonus_capped_at_100_for_perfect_match() -> None:
    assert _score(has_accommodations=True) == 100


def test_score_always_within_0_100() -> None:
    for step_gap in range(-5, 6):
        for fmt in (WorkFormat.REMOTE, WorkFormat.HYBRID, WorkFormat.OFFICE):
            for remote_only in (True, False):
                score = compute_match_score(
                    vacancy_ladder_step=2,
                    user_max_ladder_step=2 + step_gap,
                    work_format=fmt,
                    user_remote_only=remote_only,
                    vacancy_region_id=1,
                    user_region_id=2,
                )
                assert 0 <= score <= 100
