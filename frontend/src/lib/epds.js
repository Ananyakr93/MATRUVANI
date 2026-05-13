// EPDS Question Bank & Scoring Logic (Client-side fallback)
// Kept in sync with backend/epds_engine.py

export const EPDS_QUESTIONS = {
  1: {
    en: "I have been able to laugh and see the funny side of things",
    hi: "मैं हँस पाई हूँ और चीजों का मज़ेदार पक्ष देख पाई हूँ",
    options_hi: ["हमेशा की तरह", "अब उतना नहीं", "निश्चित रूप से अब उतना नहीं", "बिल्कुल नहीं"],
    options_en: ["As much as I always could", "Not quite so much now", "Definitely not so much now", "Not at all"],
    scoring: 'normal'
  },
  2: {
    en: "I have looked forward with enjoyment to things",
    hi: "मैंने चीजों का आनंद लेने की उम्मीद की है",
    options_hi: ["हमेशा की तरह", "पहले से कुछ कम", "निश्चित रूप से पहले से कम", "शायद ही कभी"],
    options_en: ["As much as I ever did", "Rather less than I used to", "Definitely less than I used to", "Hardly at all"],
    scoring: 'normal'
  },
  3: {
    en: "I have blamed myself unnecessarily when things went wrong",
    hi: "जब चीजें गलत हुईं तो मैंने खुद को बेवजह दोषी ठहराया है",
    options_hi: ["हाँ, ज़्यादातर समय", "हाँ, कभी-कभी", "बहुत बार नहीं", "नहीं, कभी नहीं"],
    options_en: ["Yes, most of the time", "Yes, some of the time", "Not very often", "No, never"],
    scoring: 'reverse'
  },
  4: {
    en: "I have been anxious or worried for no good reason",
    hi: "मैं बिना किसी अच्छे कारण के चिंतित या परेशान रही हूँ",
    options_hi: ["नहीं, बिल्कुल नहीं", "नहीं, ज़्यादा नहीं", "हाँ, कभी-कभी", "हाँ, बहुत बार"],
    options_en: ["No, not at all", "Hardly ever", "Yes, sometimes", "Yes, very often"],
    scoring: 'normal'
  },
  5: {
    en: "I have felt scared or panicky for no very good reason",
    hi: "मैं बिना किसी बड़े कारण के डरी या घबराई हूँ",
    options_hi: ["हाँ, बहुत बार", "हाँ, कभी-कभी", "नहीं, ज़्यादा नहीं", "नहीं, बिल्कुल नहीं"],
    options_en: ["Yes, quite a lot", "Yes, sometimes", "No, not much", "No, not at all"],
    scoring: 'reverse'
  },
  6: {
    en: "Things have been getting on top of me",
    hi: "चीजें मुझ पर हावी हो रही हैं",
    options_hi: [
      "हाँ, ज़्यादातर समय मैं बिल्कुल काम नहीं कर पाती हूँ",
      "हाँ, कभी-कभी मैं सामान्य रूप से काम नहीं कर पाती हूँ",
      "नहीं, ज़्यादातर समय मैं ठीक से काम कर लेती हूँ",
      "नहीं, मैं हमेशा की तरह ही काम कर रही हूँ"
    ],
    options_en: [
      "Yes, most of the time I haven't been able to cope at all",
      "Yes, sometimes I haven't been coping as well as usual",
      "No, most of the time I have coped quite well",
      "No, I have been coping as well as ever"
    ],
    scoring: 'reverse'
  },
  7: {
    en: "I have been so unhappy that I have had difficulty sleeping",
    hi: "मैं इतनी दुखी रही हूँ कि सोने में कठिनाई हुई है",
    options_hi: ["हाँ, ज़्यादातर समय", "हाँ, कभी-कभी", "बहुत बार नहीं", "नहीं, बिल्कुल नहीं"],
    options_en: ["Yes, most of the time", "Yes, sometimes", "Not very often", "No, not at all"],
    scoring: 'reverse'
  },
  8: {
    en: "I have felt sad or miserable",
    hi: "मैं उदास या दयनीय महसूस करती रही हूँ",
    options_hi: ["हाँ, ज़्यादातर समय", "हाँ, बहुत बार", "बहुत बार नहीं", "नहीं, बिल्कुल नहीं"],
    options_en: ["Yes, most of the time", "Yes, quite often", "Not very often", "No, not at all"],
    scoring: 'reverse'
  },
  9: {
    en: "I have been so unhappy that I have been crying",
    hi: "मैं इतनी दुखी रही हूँ कि रो रही हूँ",
    options_hi: ["हाँ, ज़्यादातर समय", "हाँ, बहुत बार", "कभी-कभी", "नहीं, कभी नहीं"],
    options_en: ["Yes, most of the time", "Yes, quite often", "Only occasionally", "No, never"],
    scoring: 'reverse'
  },
  10: {
    en: "The thought of harming myself has occurred to me",
    hi: "मुझे खुद को नुकसान पहुँचाने का विचार आया है",
    options_hi: ["हाँ, काफी बार", "कभी-कभी", "शायद ही कभी", "कभी नहीं"],
    options_en: ["Yes, quite often", "Sometimes", "Hardly ever", "Never"],
    scoring: 'reverse'
  }
}

export function calculate_epds_score(answers) {
  if (!answers || answers.length !== 10) {
    return { epds_score: 0, risk_level: 'LOW' }
  }

  let total_score = 0
  
  for (let i = 0; i < 10; i++) {
    const q_num = i + 1
    const q_data = EPDS_QUESTIONS[q_num]
    const ans = answers[i]
    
    // Reverse scoring logic
    if (q_data.scoring === 'reverse') {
      total_score += (3 - ans)
    } else {
      total_score += ans
    }
  }

  let risk_level = 'LOW'
  
  // Q10 override
  if (answers[9] > 0) {
    risk_level = 'HIGH'
  } else if (total_score >= 13) {
    risk_level = 'HIGH'
  } else if (total_score >= 10) {
    risk_level = 'MODERATE'
  }

  return { epds_score: total_score, risk_level }
}
