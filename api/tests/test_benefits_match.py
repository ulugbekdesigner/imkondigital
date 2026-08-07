"""Imtiyozlarni shaxsiylashtirish — sof funksiya testlari (DB'siz)."""

from app.core.benefits_match import is_relevant_to_user


def test_no_restrictions_matches_everyone() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=None,
            benefit_disability_categories=[],
            user_region_id=5,
            user_disability_categories=["eshitish"],
        )
        is True
    )


def test_region_restricted_matches_same_region() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=1,
            benefit_disability_categories=[],
            user_region_id=1,
            user_disability_categories=[],
        )
        is True
    )


def test_region_restricted_rejects_other_region() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=1,
            benefit_disability_categories=[],
            user_region_id=2,
            user_disability_categories=[],
        )
        is False
    )


def test_category_restricted_matches_overlap() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=None,
            benefit_disability_categories=["ko'rish", "eshitish"],
            user_region_id=None,
            user_disability_categories=["eshitish"],
        )
        is True
    )


def test_category_restricted_rejects_no_overlap() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=None,
            benefit_disability_categories=["ko'rish"],
            user_region_id=None,
            user_disability_categories=["harakat"],
        )
        is False
    )


def test_both_restrictions_require_both_to_match() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=1,
            benefit_disability_categories=["eshitish"],
            user_region_id=1,
            user_disability_categories=["ko'rish"],
        )
        is False
    )
    assert (
        is_relevant_to_user(
            benefit_region_id=1,
            benefit_disability_categories=["eshitish"],
            user_region_id=1,
            user_disability_categories=["eshitish"],
        )
        is True
    )


def test_user_with_no_categories_fails_category_restricted_benefit() -> None:
    assert (
        is_relevant_to_user(
            benefit_region_id=None,
            benefit_disability_categories=["eshitish"],
            user_region_id=None,
            user_disability_categories=[],
        )
        is False
    )
