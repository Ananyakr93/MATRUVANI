import string

# PART 1 — EPDS Question Bank

EPDS_QUESTIONS = {
    1: {
        'en': "I have been able to laugh and see the funny side of things",
        'hi': "मैं हँस पाई हूँ और चीजों का मज़ेदार पक्ष देख पाई हूँ",
        'options_hi': [
            "हमेशा की तरह",
            "अब उतना नहीं",
            "निश्चित रूप से अब उतना नहीं",
            "बिल्कुल नहीं"
        ],
        'scoring': 'normal'
    },
    2: {
        'en': "I have looked forward with enjoyment to things",
        'hi': "मैंने चीजों का आनंद लेने की उम्मीद की है",
        'options_hi': [
            "हमेशा की तरह",
            "पहले से कुछ कम",
            "निश्चित रूप से पहले से कम",
            "शायद ही कभी"
        ],
        'scoring': 'normal'
    },
    3: {
        'en': "I have blamed myself unnecessarily when things went wrong",
        'hi': "जब चीजें गलत हुईं तो मैंने खुद को बेवजह दोषी ठहराया है",
        'options_hi': [
            "हाँ, ज़्यादातर समय",
            "हाँ, कभी-कभी",
            "बहुत बार नहीं",
            "नहीं, कभी नहीं"
        ],
        'scoring': 'reverse'
    },
    4: {
        'en': "I have been anxious or worried for no good reason",
        'hi': "मैं बिना किसी अच्छे कारण के चिंतित या परेशान रही हूँ",
        'options_hi': [
            "नहीं, बिल्कुल नहीं",
            "नहीं, ज़्यादा नहीं",
            "हाँ, कभी-कभी",
            "हाँ, बहुत बार"
        ],
        'scoring': 'normal'
    },
    5: {
        'en': "I have felt scared or panicky for no very good reason",
        'hi': "मैं बिना किसी बड़े कारण के डरी या घबराई हूँ",
        'options_hi': [
            "हाँ, बहुत बार",
            "हाँ, कभी-कभी",
            "नहीं, ज़्यादा नहीं",
            "नहीं, बिल्कुल नहीं"
        ],
        'scoring': 'reverse'
    },
    6: {
        'en': "Things have been getting on top of me",
        'hi': "चीजें मुझ पर हावी हो रही हैं",
        'options_hi': [
            "हाँ, ज़्यादातर समय मैं बिल्कुल काम नहीं कर पाती हूँ",
            "हाँ, कभी-कभी मैं सामान्य रूप से काम नहीं कर पाती हूँ",
            "नहीं, ज़्यादातर समय मैं ठीक से काम कर लेती हूँ",
            "नहीं, मैं हमेशा की तरह ही काम कर रही हूँ"
        ],
        'scoring': 'reverse'
    },
    7: {
        'en': "I have been so unhappy that I have had difficulty sleeping",
        'hi': "मैं इतनी दुखी रही हूँ कि सोने में कठिनाई हुई है",
        'options_hi': [
            "हाँ, ज़्यादातर समय",
            "हाँ, कभी-कभी",
            "बहुत बार नहीं",
            "नहीं, बिल्कुल नहीं"
        ],
        'scoring': 'reverse'
    },
    8: {
        'en': "I have felt sad or miserable",
        'hi': "मैं उदास या दयनीय महसूस करती रही हूँ",
        'options_hi': [
            "हाँ, ज़्यादातर समय",
            "हाँ, बहुत बार",
            "बहुत बार नहीं",
            "नहीं, बिल्कुल नहीं"
        ],
        'scoring': 'reverse'
    },
    9: {
        'en': "I have been so unhappy that I have been crying",
        'hi': "मैं इतनी दुखी रही हूँ कि रो रही हूँ",
        'options_hi': [
            "हाँ, ज़्यादातर समय",
            "हाँ, बहुत बार",
            "कभी-कभी",
            "नहीं, कभी नहीं"
        ],
        'scoring': 'reverse'
    },
    10: {
        'en': "The thought of harming myself has occurred to me",
        'hi': "मुझे खुद को नुकसान पहुँचाने का विचार आया है",
        'options_hi': [
            "हाँ, काफी बार",
            "कभी-कभी",
            "शायद ही कभी",
            "कभी नहीं"
        ],
        'scoring': 'reverse'
    }
}

# PART 2 — SADE-Lite Depression Lexicon (Primary AI Layer)

DEPRESSION_LEXICON = [
    # Self-blame
    {'phrase': "meri galti hai", 'weight': 0.3, 'category': 'self_blame', 'critical': False},
    {'phrase': "main buri maa hoon", 'weight': 0.5, 'category': 'self_blame', 'critical': False},
    {'phrase': "main burden hoon", 'weight': 0.5, 'category': 'self_blame', 'critical': False},
    {'phrase': "sab meri wajah se", 'weight': 0.3, 'category': 'self_blame', 'critical': False},
    {'phrase': "mujhe kuch nahi aata", 'weight': 0.3, 'category': 'self_blame', 'critical': False},
    {'phrase': "main kisi kaam ki nahi", 'weight': 0.4, 'category': 'self_blame', 'critical': False},
    {'phrase': "mujhe maa banne ka haq nahi", 'weight': 0.6, 'category': 'self_blame', 'critical': False},
    
    # Hopelessness
    {'phrase': "kuch nahi hoga", 'weight': 0.4, 'category': 'hopelessness', 'critical': False},
    {'phrase': "umeed nahi", 'weight': 0.4, 'category': 'hopelessness', 'critical': False},
    {'phrase': "kya fayda", 'weight': 0.3, 'category': 'hopelessness', 'critical': False},
    {'phrase': "sab bekaar hai", 'weight': 0.4, 'category': 'hopelessness', 'critical': False},
    {'phrase': "meri kismat kharab hai", 'weight': 0.3, 'category': 'hopelessness', 'critical': False},
    {'phrase': "kuch theek nahi hoga", 'weight': 0.5, 'category': 'hopelessness', 'critical': False},
    {'phrase': "andhera lagta hai", 'weight': 0.4, 'category': 'hopelessness', 'critical': False},

    # Exhaustion
    {'phrase': "bahut thak gayi hoon", 'weight': 0.2, 'category': 'exhaustion', 'critical': False},
    {'phrase': "uthne ki himmat nahi", 'weight': 0.4, 'category': 'exhaustion', 'critical': False},
    {'phrase': "neend nahi aati", 'weight': 0.3, 'category': 'exhaustion', 'critical': False},
    {'phrase': "poori raat jagti hoon", 'weight': 0.3, 'category': 'exhaustion', 'critical': False},
    {'phrase': "thakan", 'weight': 0.1, 'category': 'exhaustion', 'critical': False},
    {'phrase': "so nahi paati", 'weight': 0.3, 'category': 'exhaustion', 'critical': False},
    {'phrase': "taqat nahi bachi", 'weight': 0.4, 'category': 'exhaustion', 'critical': False},

    # Sadness
    {'phrase': "rona aata hai", 'weight': 0.4, 'category': 'sadness', 'critical': False},
    {'phrase': "dil nahi lagta", 'weight': 0.3, 'category': 'sadness', 'critical': False},
    {'phrase': "udaas rehti hoon", 'weight': 0.4, 'category': 'sadness', 'critical': False},
    {'phrase': "aansu nahi rukti", 'weight': 0.5, 'category': 'sadness', 'critical': False},
    {'phrase': "andar se tut chuki hoon", 'weight': 0.6, 'category': 'sadness', 'critical': False},
    {'phrase': "khushi mehsoos nahi hoti", 'weight': 0.5, 'category': 'sadness', 'critical': False},
    {'phrase': "mann bhari rehta hai", 'weight': 0.3, 'category': 'sadness', 'critical': False},

    # Baby-related distress
    {'phrase': "bacche ko nahi pakad sakti", 'weight': 0.6, 'category': 'baby_distress', 'critical': False},
    {'phrase': "bacche se darta hai", 'weight': 0.7, 'category': 'baby_distress', 'critical': False},
    {'phrase': "doodh nahi aata", 'weight': 0.3, 'category': 'baby_distress', 'critical': False},
    {'phrase': "maa nahi ban sakti", 'weight': 0.6, 'category': 'baby_distress', 'critical': False},
    {'phrase': "bacche ke rone se chid hoti hai", 'weight': 0.5, 'category': 'baby_distress', 'critical': False},
    {'phrase': "lagta hai baccha mera nahi hai", 'weight': 0.7, 'category': 'baby_distress', 'critical': False},
    {'phrase': "bacche ko chod kar bhaag jau", 'weight': 0.8, 'category': 'baby_distress', 'critical': False},

    # Isolation
    {'phrase': "kisi se milna nahi", 'weight': 0.4, 'category': 'isolation', 'critical': False},
    {'phrase': "ghar mein band rehti hoon", 'weight': 0.4, 'category': 'isolation', 'critical': False},
    {'phrase': "akeli hoon", 'weight': 0.4, 'category': 'isolation', 'critical': False},
    {'phrase': "koi nahi samajhta", 'weight': 0.5, 'category': 'isolation', 'critical': False},
    {'phrase': "meri baat sunne wala koi nahi", 'weight': 0.4, 'category': 'isolation', 'critical': False},
    {'phrase': "sab chhut gaya", 'weight': 0.3, 'category': 'isolation', 'critical': False},
    {'phrase': "akelepan", 'weight': 0.3, 'category': 'isolation', 'critical': False},

    # CRITICAL (Suicidal ideation / Harm)
    {'phrase': "marna chahti hoon", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
    {'phrase': "khatam karna chahti hoon", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
    {'phrase': "jeena nahi chahti", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
    {'phrase': "khud ko maar daalu", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
    {'phrase': "zindagi se thak gayi", 'weight': 0.8, 'category': 'suicidal', 'critical': True},
    {'phrase': "kash subah na ho", 'weight': 0.9, 'category': 'suicidal', 'critical': True},
    {'phrase': "chhat se kood jau", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
    {'phrase': "zehar kha lu", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
    {'phrase': "nas kaat lu", 'weight': 1.0, 'category': 'suicidal', 'critical': True},
]


# PART 3 — Scoring Functions

def calculate_epds_score(answers: list[int]) -> tuple[int, str]:
    if len(answers) != 10:
        raise ValueError("Must provide exactly 10 answers.")
    
    total_score = 0
    for i, ans in enumerate(answers):
        q_num = i + 1
        q_data = EPDS_QUESTIONS[q_num]
        
        # Handle reverse scoring
        if q_data['scoring'] == 'reverse':
            score = 3 - ans
        else:
            score = ans
            
        total_score += score

    # Risk thresholds
    if answers[9] > 0:  # Q10 override: score > 0 (suicide ideation)
        risk_level = 'HIGH'
    elif total_score >= 13:
        risk_level = 'HIGH'
    elif total_score >= 10:
        risk_level = 'MODERATE'
    else:
        risk_level = 'LOW'

    return total_score, risk_level


def run_lexicon_matching(transcript: str) -> dict:
    if not transcript:
        return {
            'matched_phrases': [],
            'total_weight': 0.0,
            'categories_found': [],
            'has_critical': False
        }

    # Normalize transcript: lowercase, remove punctuation
    trans_lower = transcript.lower()
    trans_clean = trans_lower.translate(str.maketrans('', '', string.punctuation))
    
    matched_phrases = []
    total_weight = 0.0
    categories_found = set()
    has_critical = False

    for item in DEPRESSION_LEXICON:
        phrase = item['phrase'].lower()
        if phrase in trans_clean:
            matched_phrases.append(item['phrase'])
            total_weight += item['weight']
            categories_found.add(item['category'])
            if item['critical']:
                has_critical = True

    # Cap weight at 1.0
    total_weight = min(total_weight, 1.0)

    return {
        'matched_phrases': matched_phrases,
        'total_weight': total_weight,
        'categories_found': list(categories_found),
        'has_critical': has_critical
    }


def compute_ams(epds_score: int, lexicon_result: dict) -> tuple[float, str]:
    if lexicon_result['has_critical']:
        return (1.0, 'RED')

    epds_risk = epds_score / 30.0
    lexicon_weight = lexicon_result['total_weight']

    divergence = abs(lexicon_weight - epds_risk)

    if divergence > 0.4 and lexicon_weight > epds_risk:
        flag = 'RED' if divergence > 0.6 else 'YELLOW'
    elif divergence > 0.2:
        flag = 'YELLOW'
    else:
        flag = 'GREEN'

    return (divergence, flag)


def final_risk_assessment(epds_score: int, divergence_flag: str) -> str:
    _, base_risk = calculate_epds_score([0]*9 + [0]) # dummy just to get base logic if needed, but we already have epds_score
    # We can just recalculate the base risk from the score (excluding Q10 override here since it's already factored in earlier or we can just rely on the score)
    
    if epds_score >= 13:
        base_risk = 'HIGH'
    elif epds_score >= 10:
        base_risk = 'MODERATE'
    else:
        base_risk = 'LOW'

    if divergence_flag == 'RED':
        return 'HIGH'
    elif divergence_flag == 'YELLOW' and base_risk == 'MODERATE':
        return 'HIGH'
    elif divergence_flag == 'YELLOW' and base_risk == 'LOW':
        return 'MODERATE'
    else:
        return base_risk


# PART 4 — ASHA Scripts

ASHA_SCRIPTS = {
    'LOW': {
        'hi': {
            'message': "आप कुल मिलाकर ठीक लग रही हैं। अगर कभी मन भारी लगे या कोई बात परेशान करे, तो आप मुझसे बात कर सकती हैं।",
            'action': "Regular follow-up in next scheduled visit."
        },
        'kn': {
            'message': "ನೀವು ಒಟ್ಟಾರೆಯಾಗಿ ಚೆನ್ನಾಗಿದ್ದೀರಿ. ನಿಮಗೆ ಕಷ್ಟವೆನಿಸಿದರೆ ಯಾವಾಗ ಬೇಕಾದರೂ ನನ್ನ ಬಳಿ ಮಾತನಾಡಬಹುದು.",
            'action': "Regular follow-up in next scheduled visit."
        }
    },
    'MODERATE': {
        'hi': {
            'message': "मुझे लग रहा है कि आप आजकल थोड़ा परेशान हैं और मन कुछ उदास है। यह समय मुश्किल हो सकता है। मैं अगले हफ्ते फिर आऊंगी ताकि हम बात कर सकें। अगर आप चाहें तो PHC में डॉक्टर साहब से भी बात कर सकते हैं।",
            'action': "Schedule a follow-up visit within 7 days. Inform the Medical Officer."
        },
        'kn': {
            'message': "ನೀವು ಇತ್ತೀಚೆಗೆ ಸ್ವಲ್ಪ ಚಿಂತೆಯಲ್ಲಿರುವಂತೆ ಕಾಣುತ್ತಿದೆ. ಈ ಸಮಯ ಸ್ವಲ್ಪ ಕಷ್ಟವಾಗಿರಬಹುದು. ನಾವು ಮುಂದಿನ ವಾರ ಮತ್ತೆ ಮಾತನಾಡೋಣ. ನೀವು ಬಯಸಿದರೆ ಆಸ್ಪತ್ರೆಯ ವೈದ್ಯರ ಬಳಿಯೂ ಮಾತನಾಡಬಹುದು.",
            'action': "Schedule a follow-up visit within 7 days. Inform the Medical Officer."
        }
    },
    'HIGH': {
        'hi': {
            'message': "मुझे लग रहा है कि आपको बहुत तकलीफ हो रही है और आप इस समय बहुत भारीपन महसूस कर रही हैं। आप अकेली नहीं हैं, और इसके लिए मदद मौजूद है। मैं चाहती हूँ कि हम आज या कल में एक बार PHC चलें, ताकि सही डॉक्टर से बात हो सके।",
            'action': "Immediate referral to PHC. Escort the mother within 24-48 hours. Notify Medical Officer immediately."
        },
        'kn': {
            'message': "ನಿಮಗೆ ಬಹಳ ಕಷ್ಟವಾಗುತ್ತಿದೆ ಎಂದು ನನಗೆ ಅರ್ಥವಾಗುತ್ತಿದೆ. ನೀವು ಒಂಟಿಯಲ್ಲ, ಇದಕ್ಕೆ ಸಹಾಯ ಲಭ್ಯವಿದೆ. ನಾವಿಬ್ಬರೂ ಸೇರಿ ಇಂದೇ ಅಥವಾ ನಾಳೆ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ ವೈದ್ಯರ ಬಳಿ ಮಾತನಾಡೋಣ.",
            'action': "Immediate referral to PHC. Escort the mother within 24-48 hours. Notify Medical Officer immediately."
        }
    }
}
