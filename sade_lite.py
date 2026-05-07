"""
SADE Lite v2 — Simple Affective Distress Extraction (Enhanced Lexicon)

A culturally-annotated Hindi depression lexicon for perinatal mental health
screening in rural India. Contains 80 phrases across 5 clinical categories,
each weighted by clinical severity.

Categories:
    1. burden_worthlessness  — feeling like a burden to family
    2. inability_to_bond     — not feeling connected to the baby
    3. sleep_exhaustion       — beyond normal postpartum tiredness
    4. hopelessness           — loss of future orientation
    5. masked_distress        — cultural euphemisms for suffering

Usage:
    from sade_lite import compute_ams

    result = compute_ams("मुझसे कुछ नहीं होता, सब ठीक है", epds_score=6)
    # => {lexicon_hits: 2, weighted_score: 2.7, divergence_flag: True, ...}
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Lexicon — 80 culturally-annotated Hindi phrases
# ---------------------------------------------------------------------------
# Each entry:  {hindi, transliteration, category, weight}
#   weight ∈ [1.0, 2.0] — higher = stronger clinical indicator
# ---------------------------------------------------------------------------

# fmt: off
SADE_LEXICON: list[dict[str, Any]] = [

    # ── 1. BURDEN / WORTHLESSNESS (16 phrases) ─────────────────────────────
    {"hindi": "मैं बोझ हूँ",               "transliteration": "main bojh hoon",               "category": "burden_worthlessness", "weight": 1.8},
    {"hindi": "मेरा कोई फायदा नहीं",       "transliteration": "mera koi fayda nahi",           "category": "burden_worthlessness", "weight": 1.7},
    {"hindi": "मुझसे कुछ नहीं होता",        "transliteration": "mujhse kuch nahi hota",         "category": "burden_worthlessness", "weight": 1.6},
    {"hindi": "मैं किसी काम की नहीं",       "transliteration": "main kisi kaam ki nahi",        "category": "burden_worthlessness", "weight": 1.7},
    {"hindi": "मेरे बिना सब अच्छा होगा",   "transliteration": "mere bina sab accha hoga",      "category": "burden_worthlessness", "weight": 2.0},
    {"hindi": "घरवालों को तकलीफ देती हूँ",  "transliteration": "gharwalon ko takleef deti hoon", "category": "burden_worthlessness", "weight": 1.8},
    {"hindi": "मैं बेकार हूँ",              "transliteration": "main bekaar hoon",               "category": "burden_worthlessness", "weight": 1.7},
    {"hindi": "मेरी कोई कीमत नहीं",        "transliteration": "meri koi keemat nahi",           "category": "burden_worthlessness", "weight": 1.9},
    {"hindi": "सब मुझसे परेशान हैं",        "transliteration": "sab mujhse pareshan hain",      "category": "burden_worthlessness", "weight": 1.5},
    {"hindi": "मैं अच्छी माँ नहीं हूँ",      "transliteration": "main acchi maa nahi hoon",      "category": "burden_worthlessness", "weight": 1.8},
    {"hindi": "ससुराल वाले ताना मारते हैं",   "transliteration": "sasural wale taana marte hain", "category": "burden_worthlessness", "weight": 1.4},
    {"hindi": "पति नहीं समझते",             "transliteration": "pati nahi samajhte",             "category": "burden_worthlessness", "weight": 1.3},
    {"hindi": "कोई मदद नहीं करता",          "transliteration": "koi madad nahi karta",           "category": "burden_worthlessness", "weight": 1.4},
    {"hindi": "मैं सबके लिए मुसीबत हूँ",     "transliteration": "main sabke liye musibat hoon",  "category": "burden_worthlessness", "weight": 1.9},
    {"hindi": "लड़की पैदा की है मैंने",       "transliteration": "ladki paida ki hai maine",      "category": "burden_worthlessness", "weight": 1.6},
    {"hindi": "भगवान ने सजा दी है",          "transliteration": "bhagwan ne saza di hai",        "category": "burden_worthlessness", "weight": 1.7},

    # ── 2. INABILITY TO BOND (16 phrases) ──────────────────────────────────
    {"hindi": "बच्चे को छूने का दिल नहीं",      "transliteration": "bachche ko chhune ka dil nahi",      "category": "inability_to_bond", "weight": 1.9},
    {"hindi": "बच्चा रोता है तो चिढ़ होती है",    "transliteration": "bachcha rota hai to chidh hoti hai",  "category": "inability_to_bond", "weight": 1.8},
    {"hindi": "दूध पिलाने का मन नहीं",           "transliteration": "doodh pilane ka man nahi",            "category": "inability_to_bond", "weight": 1.7},
    {"hindi": "बच्चे से दूर रहना चाहती हूँ",      "transliteration": "bachche se door rehna chahti hoon",   "category": "inability_to_bond", "weight": 2.0},
    {"hindi": "बच्चे को देखकर कुछ नहीं लगता",    "transliteration": "bachche ko dekhkar kuch nahi lagta",  "category": "inability_to_bond", "weight": 1.9},
    {"hindi": "मुझे लगता है बच्चा मेरा नहीं है",   "transliteration": "mujhe lagta hai bachcha mera nahi hai","category": "inability_to_bond", "weight": 2.0},
    {"hindi": "बच्चे को नुकसान हो जाएगा",         "transliteration": "bachche ko nuksan ho jayega",         "category": "inability_to_bond", "weight": 1.8},
    {"hindi": "माँ बनने का मन नहीं था",            "transliteration": "maa banne ka man nahi tha",           "category": "inability_to_bond", "weight": 1.6},
    {"hindi": "बच्चे की जिम्मेदारी नहीं उठा सकती","transliteration": "bachche ki zimmedari nahi utha sakti", "category": "inability_to_bond", "weight": 1.7},
    {"hindi": "बच्चा मुझसे प्यार नहीं करता",       "transliteration": "bachcha mujhse pyar nahi karta",     "category": "inability_to_bond", "weight": 1.5},
    {"hindi": "बच्चे को गोद में लेने से डर लगता है","transliteration": "bachche ko god mein lene se dar lagta hai","category": "inability_to_bond", "weight": 1.8},
    {"hindi": "अच्छी माँ कभी नहीं बन पाऊँगी",     "transliteration": "acchi maa kabhi nahi ban paoongi",    "category": "inability_to_bond", "weight": 1.7},
    {"hindi": "बच्चे को किसी और को दे दो",         "transliteration": "bachche ko kisi aur ko de do",        "category": "inability_to_bond", "weight": 2.0},
    {"hindi": "बच्चे की आवाज़ से घबराहट होती है",   "transliteration": "bachche ki aawaz se ghabrahat hoti hai","category": "inability_to_bond", "weight": 1.6},
    {"hindi": "मैं बच्चे के लिए ठीक नहीं हूँ",      "transliteration": "main bachche ke liye theek nahi hoon","category": "inability_to_bond", "weight": 1.8},
    {"hindi": "बच्चे को पालने का मन नहीं",          "transliteration": "bachche ko palne ka man nahi",        "category": "inability_to_bond", "weight": 1.9},

    # ── 3. SLEEP / EXHAUSTION (16 phrases) ─────────────────────────────────
    {"hindi": "नींद नहीं आती",                  "transliteration": "neend nahi aati",                   "category": "sleep_exhaustion", "weight": 1.3},
    {"hindi": "बहुत थक गई हूँ",                 "transliteration": "bahut thak gayi hoon",               "category": "sleep_exhaustion", "weight": 1.2},
    {"hindi": "रात भर जागती रहती हूँ",           "transliteration": "raat bhar jagti rehti hoon",         "category": "sleep_exhaustion", "weight": 1.4},
    {"hindi": "शरीर टूट रहा है",                "transliteration": "sharir toot raha hai",               "category": "sleep_exhaustion", "weight": 1.5},
    {"hindi": "उठने का मन नहीं करता",           "transliteration": "uthne ka man nahi karta",            "category": "sleep_exhaustion", "weight": 1.5},
    {"hindi": "सोकर भी थकान नहीं जाती",         "transliteration": "sokar bhi thakan nahi jaati",        "category": "sleep_exhaustion", "weight": 1.6},
    {"hindi": "आँखें बंद करती हूँ तो डर लगता है","transliteration": "aankhen band karti hoon to dar lagta hai","category": "sleep_exhaustion", "weight": 1.7},
    {"hindi": "दिन भर लेटी रहती हूँ",            "transliteration": "din bhar leti rehti hoon",           "category": "sleep_exhaustion", "weight": 1.4},
    {"hindi": "खाना बनाने की ताकत नहीं",         "transliteration": "khana banane ki takat nahi",         "category": "sleep_exhaustion", "weight": 1.3},
    {"hindi": "खाने का मन नहीं",                "transliteration": "khane ka man nahi",                  "category": "sleep_exhaustion", "weight": 1.3},
    {"hindi": "सिर में दर्द रहता है",             "transliteration": "sir mein dard rehta hai",           "category": "sleep_exhaustion", "weight": 1.2},
    {"hindi": "हाथ पैर में दर्द",                "transliteration": "hath pair mein dard",               "category": "sleep_exhaustion", "weight": 1.1},
    {"hindi": "चक्कर आते हैं",                  "transliteration": "chakkar aate hain",                 "category": "sleep_exhaustion", "weight": 1.2},
    {"hindi": "बीमार लग रहा है",                "transliteration": "bimar lag raha hai",                "category": "sleep_exhaustion", "weight": 1.1},
    {"hindi": "बच्चे के कारण सो नहीं पाती",     "transliteration": "bachche ke karan so nahi paati",    "category": "sleep_exhaustion", "weight": 1.3},
    {"hindi": "शरीर में जान नहीं रही",           "transliteration": "sharir mein jaan nahi rahi",        "category": "sleep_exhaustion", "weight": 1.6},

    # ── 4. HOPELESSNESS (16 phrases) ───────────────────────────────────────
    {"hindi": "जीने का मन नहीं",            "transliteration": "jeene ka man nahi",              "category": "hopelessness", "weight": 2.0},
    {"hindi": "सब कुछ बेकार है",             "transliteration": "sab kuch bekaar hai",            "category": "hopelessness", "weight": 1.7},
    {"hindi": "कुछ अच्छा नहीं होगा",         "transliteration": "kuch accha nahi hoga",           "category": "hopelessness", "weight": 1.8},
    {"hindi": "मन उदास रहता है",             "transliteration": "man udaas rehta hai",            "category": "hopelessness", "weight": 1.5},
    {"hindi": "रोने का मन है",               "transliteration": "rone ka man hai",                "category": "hopelessness", "weight": 1.4},
    {"hindi": "किसी को मेरी परवाह नहीं",      "transliteration": "kisi ko meri parwah nahi",      "category": "hopelessness", "weight": 1.6},
    {"hindi": "अकेलापन लगता है",             "transliteration": "akelapan lagta hai",             "category": "hopelessness", "weight": 1.5},
    {"hindi": "डर लगता है",                  "transliteration": "dar lagta hai",                  "category": "hopelessness", "weight": 1.3},
    {"hindi": "आगे कुछ नहीं दिखता",          "transliteration": "aage kuch nahi dikhta",          "category": "hopelessness", "weight": 1.9},
    {"hindi": "ज़िंदगी में कोई उम्मीद नहीं",   "transliteration": "zindagi mein koi ummeed nahi",  "category": "hopelessness", "weight": 2.0},
    {"hindi": "मर जाना बेहतर है",             "transliteration": "mar jaana behtar hai",           "category": "hopelessness", "weight": 2.0},
    {"hindi": "बच्चे का भविष्य अंधेरा है",    "transliteration": "bachche ka bhavishya andhera hai","category": "hopelessness", "weight": 1.8},
    {"hindi": "कभी ठीक नहीं होगा",           "transliteration": "kabhi theek nahi hoga",          "category": "hopelessness", "weight": 1.7},
    {"hindi": "मेरी किस्मत खराब है",          "transliteration": "meri kismat kharab hai",         "category": "hopelessness", "weight": 1.4},
    {"hindi": "भगवान ने छोड़ दिया",           "transliteration": "bhagwan ne chhod diya",          "category": "hopelessness", "weight": 1.6},
    {"hindi": "कोई रास्ता नहीं दिखता",        "transliteration": "koi rasta nahi dikhta",          "category": "hopelessness", "weight": 1.9},

    # ── 5. MASKED DISTRESS (16 phrases) ────────────────────────────────────
    # These sound neutral/positive on the surface but are cultural euphemisms
    # for suffering when spoken in specific contexts.
    {"hindi": "सब ठीक है",                   "transliteration": "sab theek hai",                  "category": "masked_distress", "weight": 1.2},
    {"hindi": "चल रहा है",                   "transliteration": "chal raha hai",                  "category": "masked_distress", "weight": 1.1},
    {"hindi": "भगवान की मर्जी",               "transliteration": "bhagwan ki marzi",               "category": "masked_distress", "weight": 1.3},
    {"hindi": "ऐसे ही होता है",               "transliteration": "aise hi hota hai",               "category": "masked_distress", "weight": 1.2},
    {"hindi": "क्या बताऊँ",                   "transliteration": "kya bataun",                     "category": "masked_distress", "weight": 1.4},
    {"hindi": "कुछ नहीं बस",                  "transliteration": "kuch nahi bas",                  "category": "masked_distress", "weight": 1.3},
    {"hindi": "ऊपर वाले की इच्छा",            "transliteration": "upar wale ki ichha",             "category": "masked_distress", "weight": 1.2},
    {"hindi": "जो होगा देखा जाएगा",           "transliteration": "jo hoga dekha jayega",           "category": "masked_distress", "weight": 1.3},
    {"hindi": "मैं ठीक हूँ",                   "transliteration": "main theek hoon",               "category": "masked_distress", "weight": 1.1},
    {"hindi": "कोई बात नहीं",                 "transliteration": "koi baat nahi",                  "category": "masked_distress", "weight": 1.2},
    {"hindi": "ऐसा तो सबके साथ होता है",       "transliteration": "aisa to sabke sath hota hai",   "category": "masked_distress", "weight": 1.3},
    {"hindi": "देखते हैं",                     "transliteration": "dekhte hain",                   "category": "masked_distress", "weight": 1.1},
    {"hindi": "किस्मत में यही था",              "transliteration": "kismat mein yahi tha",          "category": "masked_distress", "weight": 1.3},
    {"hindi": "सहना तो पड़ता है",              "transliteration": "sehna to padta hai",             "category": "masked_distress", "weight": 1.5},
    {"hindi": "औरत का यही काम है",             "transliteration": "aurat ka yahi kaam hai",         "category": "masked_distress", "weight": 1.4},
    {"hindi": "मायके वाले क्या कहेंगे",         "transliteration": "maayke wale kya kahenge",       "category": "masked_distress", "weight": 1.4},
]
# fmt: on

# Precomputed category list for validation
CATEGORIES = [
    "burden_worthlessness",
    "inability_to_bond",
    "sleep_exhaustion",
    "hopelessness",
    "masked_distress",
]


# ---------------------------------------------------------------------------
# AMS Computation Engine
# ---------------------------------------------------------------------------

def compute_ams(free_speech_text: str, epds_score: int) -> dict[str, Any]:
    """
    Compute the Affective Mismatch Score (AMS) from free-speech text.

    Lowercases and tokenizes the input, matches against all 80 lexicon
    phrases via substring matching, then computes divergence between
    the EPDS self-report score and detected affective distress signals.

    Args:
        free_speech_text: Raw Hindi free-speech text from the patient.
        epds_score: Edinburgh Postnatal Depression Scale score (0–30).

    Returns:
        dict with keys:
            - lexicon_hits (int):  number of matched phrases
            - weighted_score (float): sum of weights of matched phrases
            - divergence_flag (bool): True if speech contradicts low EPDS
            - matched_phrases (list[dict]): details of each matched phrase
            - ams_category (str): "GREEN" | "YELLOW" | "RED"
    """
    text_lower = (free_speech_text or "").lower()

    matched_phrases: list[dict[str, Any]] = []

    for entry in SADE_LEXICON:
        # Substring match against the Hindi phrase
        if entry["hindi"] in text_lower:
            matched_phrases.append({
                "hindi": entry["hindi"],
                "transliteration": entry["transliteration"],
                "category": entry["category"],
                "weight": entry["weight"],
            })

    lexicon_hits = len(matched_phrases)
    weighted_score = round(sum(p["weight"] for p in matched_phrases), 2)

    # Divergence flag: speech indicates distress that EPDS missed
    divergence_flag = (
        (epds_score <= 12 and weighted_score >= 2.5)
        or (epds_score <= 6 and lexicon_hits >= 1)
    )

    # AMS traffic-light category
    if weighted_score >= 3.0 or divergence_flag:
        ams_category = "RED"
    elif weighted_score >= 1.5:
        ams_category = "YELLOW"
    else:
        ams_category = "GREEN"

    return {
        "lexicon_hits": lexicon_hits,
        "weighted_score": weighted_score,
        "divergence_flag": divergence_flag,
        "matched_phrases": matched_phrases,
        "ams_category": ams_category,
    }


# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------

def get_phrases_by_category(category: str) -> list[dict[str, Any]]:
    """Return all lexicon entries for a given category."""
    return [e for e in SADE_LEXICON if e["category"] == category]


def get_category_counts() -> dict[str, int]:
    """Return a count of phrases per category."""
    counts: dict[str, int] = {}
    for entry in SADE_LEXICON:
        cat = entry["category"]
        counts[cat] = counts.get(cat, 0) + 1
    return counts
