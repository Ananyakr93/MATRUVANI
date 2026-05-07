"""
Unit tests for SADE Lite v2 — depression lexicon + AMS computation.

Covers:
    - Lexicon integrity (count, categories, weight ranges)
    - No matches on clean text
    - Low EPDS + no divergence
    - Low EPDS + divergence trigger (weighted_score path)
    - Low EPDS + divergence trigger (lexicon_hits path)
    - High EPDS + no divergence
    - Masked distress category detection
    - Multiple category matches
    - Edge cases (empty text, boundary EPDS)
"""

import pytest

from sade_lite import SADE_LEXICON, CATEGORIES, compute_ams, get_phrases_by_category


# ─── 1. Lexicon integrity ──────────────────────────────────────────────────

class TestLexiconIntegrity:
    """Ensure the lexicon has the expected structure and size."""

    def test_lexicon_has_80_phrases(self):
        assert len(SADE_LEXICON) == 80

    def test_all_entries_have_required_keys(self):
        required_keys = {"hindi", "transliteration", "category", "weight"}
        for entry in SADE_LEXICON:
            assert required_keys.issubset(entry.keys()), f"Missing keys in: {entry}"

    def test_all_weights_in_valid_range(self):
        for entry in SADE_LEXICON:
            assert 1.0 <= entry["weight"] <= 2.0, (
                f"Weight {entry['weight']} out of range for: {entry['hindi']}"
            )

    def test_all_categories_are_valid(self):
        for entry in SADE_LEXICON:
            assert entry["category"] in CATEGORIES, (
                f"Unknown category '{entry['category']}' for: {entry['hindi']}"
            )

    def test_each_category_has_16_phrases(self):
        for cat in CATEGORIES:
            count = sum(1 for e in SADE_LEXICON if e["category"] == cat)
            assert count == 16, f"Category '{cat}' has {count} phrases, expected 16"


# ─── 2. No matches on clean / unrelated text ──────────────────────────────

def test_no_matches_clean_text():
    """Unrelated Hindi text should produce zero hits and GREEN status."""
    result = compute_ams("आज मौसम बहुत अच्छा है और बच्चा खेल रहा है", epds_score=5)
    assert result["lexicon_hits"] == 0
    assert result["weighted_score"] == 0
    assert result["divergence_flag"] is False
    assert result["matched_phrases"] == []
    assert result["ams_category"] == "GREEN"


# ─── 3. Low EPDS + no divergence ──────────────────────────────────────────

def test_low_epds_no_divergence():
    """
    Low EPDS score with a single low-weight masked distress phrase.
    weighted_score < 2.5 AND epds > 6, so no divergence via either path.
    """
    # "चल रहा है" (weight 1.1, masked_distress)
    result = compute_ams("हाँ दीदी, चल रहा है सब", epds_score=8)
    assert result["lexicon_hits"] == 1
    assert result["weighted_score"] == 1.1
    # epds=8 > 6, so the (epds<=6 AND hits>=1) path doesn't trigger
    # weighted_score=1.1 < 2.5, so the other path doesn't trigger either
    assert result["divergence_flag"] is False
    assert result["ams_category"] == "GREEN"


# ─── 4. Low EPDS + divergence trigger (weighted_score path) ───────────────

def test_low_epds_divergence_weighted_score():
    """
    EPDS ≤ 12 AND weighted_score ≥ 2.5 → divergence_flag = True.
    Two high-weight phrases should exceed 2.5 total.
    """
    # "मैं बोझ हूँ" (1.8) + "जीने का मन नहीं" (2.0) = 3.8
    text = "मैं बोझ हूँ, जीने का मन नहीं"
    result = compute_ams(text, epds_score=10)
    assert result["lexicon_hits"] == 2
    assert result["weighted_score"] == 3.8
    assert result["divergence_flag"] is True
    assert result["ams_category"] == "RED"


# ─── 5. Low EPDS + divergence trigger (lexicon_hits path) ─────────────────

def test_low_epds_divergence_single_hit():
    """
    EPDS ≤ 6 AND lexicon_hits ≥ 1 → divergence_flag = True.
    Even a single low-weight phrase triggers divergence when EPDS is very low.
    """
    # "नींद नहीं आती" (weight 1.3)
    result = compute_ams("नींद नहीं आती रात को", epds_score=4)
    assert result["lexicon_hits"] == 1
    assert result["weighted_score"] == 1.3
    assert result["divergence_flag"] is True
    assert result["ams_category"] == "RED"  # divergence → RED


# ─── 6. High EPDS + no speech divergence ──────────────────────────────────

def test_high_epds_no_divergence():
    """
    High EPDS score (>12) with no lexicon matches.
    No divergence flag because EPDS itself is elevated.
    ams_category based purely on weighted_score (0 → GREEN).
    """
    result = compute_ams("कुछ नहीं कहना है", epds_score=18)
    assert result["lexicon_hits"] == 0
    assert result["weighted_score"] == 0
    assert result["divergence_flag"] is False
    assert result["ams_category"] == "GREEN"


# ─── 7. Masked distress category detection ────────────────────────────────

def test_masked_distress_detection():
    """
    Masked distress phrases should be detected and correctly categorized.
    'सब ठीक है' + 'भगवान की मर्जी' are cultural euphemisms.
    """
    text = "सब ठीक है, भगवान की मर्जी है"
    result = compute_ams(text, epds_score=5)
    assert result["lexicon_hits"] == 2
    categories = {p["category"] for p in result["matched_phrases"]}
    assert "masked_distress" in categories
    # Both are masked_distress
    assert all(p["category"] == "masked_distress" for p in result["matched_phrases"])
    # EPDS ≤ 6 and hits ≥ 1 → divergence
    assert result["divergence_flag"] is True


# ─── 8. Multiple category matches ─────────────────────────────────────────

def test_multiple_category_matches():
    """
    Text containing phrases from different categories should report all.
    """
    # burden_worthlessness + inability_to_bond + hopelessness
    text = "मैं बोझ हूँ और बच्चे को छूने का दिल नहीं, आगे कुछ नहीं दिखता"
    result = compute_ams(text, epds_score=11)
    assert result["lexicon_hits"] == 3
    matched_cats = {p["category"] for p in result["matched_phrases"]}
    assert "burden_worthlessness" in matched_cats
    assert "inability_to_bond" in matched_cats
    assert "hopelessness" in matched_cats
    # 1.8 + 1.9 + 1.9 = 5.6
    assert result["weighted_score"] == 5.6
    assert result["divergence_flag"] is True


# ─── 9. Empty text edge case ──────────────────────────────────────────────

def test_empty_text():
    """Empty or None text should produce zero hits."""
    result = compute_ams("", epds_score=15)
    assert result["lexicon_hits"] == 0
    assert result["weighted_score"] == 0
    assert result["divergence_flag"] is False
    assert result["ams_category"] == "GREEN"

    result_none = compute_ams(None, epds_score=15)
    assert result_none["lexicon_hits"] == 0


# ─── 10. YELLOW category threshold ────────────────────────────────────────

def test_yellow_category_threshold():
    """
    weighted_score ≥ 1.5 but < 3.0, with no divergence flag,
    should yield YELLOW ams_category.
    """
    # "मन उदास रहता है" (1.5, hopelessness) — single phrase
    # Need EPDS > 12 so divergence doesn't trigger, but weighted ≥ 1.5
    result = compute_ams("मन उदास रहता है हमेशा", epds_score=14)
    assert result["lexicon_hits"] == 1
    assert result["weighted_score"] == 1.5
    assert result["divergence_flag"] is False
    assert result["ams_category"] == "YELLOW"
