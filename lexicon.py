"""
SADE Lite — Simple Affective Distress Extraction (Lexicon-based).

Hardcoded list of 20 Hindi depression/distress phrases commonly associated
with perinatal mental health issues.  Used as a lightweight NLP signal to
complement the EPDS questionnaire score.
"""

# fmt: off
HINDI_DEPRESSION_PHRASES: list[str] = [
    "मैं बोझ हूँ",                  # I am a burden
    "रोने का मन है",               # I feel like crying
    "बच्चे को छूने का दिल नहीं",    # I don't feel like touching the baby
    "जीने का मन नहीं",             # I don't feel like living
    "मुझसे कुछ नहीं होता",          # I can't do anything
    "अकेलापन लगता है",             # I feel lonely
    "नींद नहीं आती",               # I can't sleep
    "बहुत थक गई हूँ",              # I am very tired
    "किसी को मेरी परवाह नहीं",      # Nobody cares about me
    "मन उदास रहता है",             # I feel sad
    "डर लगता है",                  # I feel afraid
    "खाने का मन नहीं",             # I don't feel like eating
    "सब कुछ बेकार है",             # Everything is useless
    "मैं अच्छी माँ नहीं हूँ",        # I am not a good mother
    "बच्चे को नुकसान हो जाएगा",     # The baby will get hurt
    "कोई मदद नहीं करता",           # Nobody helps me
    "ससुराल वाले ताना मारते हैं",     # In-laws taunt me
    "पति नहीं समझते",              # Husband doesn't understand
    "मैं बीमार हूँ",                # I am sick
    "भगवान ने सजा दी है",           # God has punished me
]
# fmt: on


def count_lexicon_hits(text: str) -> int:
    """
    Count how many of the depression phrases appear in the given text.
    Matching is case-insensitive and uses simple substring containment.
    """
    if not text:
        return 0
    text_lower = text.lower()
    return sum(1 for phrase in HINDI_DEPRESSION_PHRASES if phrase in text_lower)
