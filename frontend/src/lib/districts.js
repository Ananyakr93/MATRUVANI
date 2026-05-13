// Karnataka districts with localized display names
// value = English (used for API), label = script-localized (shown in UI)

export const KARNATAKA_DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
  "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
  "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
]

const DISTRICT_LABELS = {
  en: {
    "Bagalkot": "Bagalkot", "Ballari": "Ballari", "Belagavi": "Belagavi",
    "Bengaluru Rural": "Bengaluru Rural", "Bengaluru Urban": "Bengaluru Urban",
    "Bidar": "Bidar", "Chamarajanagar": "Chamarajanagar", "Chikkaballapura": "Chikkaballapura",
    "Chikkamagaluru": "Chikkamagaluru", "Chitradurga": "Chitradurga",
    "Dakshina Kannada": "Dakshina Kannada", "Davanagere": "Davanagere",
    "Dharwad": "Dharwad", "Gadag": "Gadag", "Hassan": "Hassan",
    "Haveri": "Haveri", "Kalaburagi": "Kalaburagi", "Kodagu": "Kodagu",
    "Kolar": "Kolar", "Koppal": "Koppal", "Mandya": "Mandya",
    "Mysuru": "Mysuru", "Raichur": "Raichur", "Ramanagara": "Ramanagara",
    "Shivamogga": "Shivamogga", "Tumakuru": "Tumakuru", "Udupi": "Udupi",
    "Uttara Kannada": "Uttara Kannada", "Vijayanagara": "Vijayanagara",
    "Vijayapura": "Vijayapura", "Yadgir": "Yadgir"
  },
  kn: {
    "Bagalkot": "ಬಾಗಲಕೋಟೆ", "Ballari": "ಬಳ್ಳಾರಿ", "Belagavi": "ಬೆಳಗಾವಿ",
    "Bengaluru Rural": "ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ", "Bengaluru Urban": "ಬೆಂಗಳೂರು ನಗರ",
    "Bidar": "ಬೀದರ್", "Chamarajanagar": "ಚಾಮರಾಜನಗರ", "Chikkaballapura": "ಚಿಕ್ಕಬಳ್ಳಾಪುರ",
    "Chikkamagaluru": "ಚಿಕ್ಕಮಗಳೂರು", "Chitradurga": "ಚಿತ್ರದುರ್ಗ",
    "Dakshina Kannada": "ದಕ್ಷಿಣ ಕನ್ನಡ", "Davanagere": "ದಾವಣಗೆರೆ",
    "Dharwad": "ಧಾರವಾಡ", "Gadag": "ಗದಗ", "Hassan": "ಹಾಸನ",
    "Haveri": "ಹಾವೇರಿ", "Kalaburagi": "ಕಲಬುರಗಿ", "Kodagu": "ಕೊಡಗು",
    "Kolar": "ಕೋಲಾರ", "Koppal": "ಕೊಪ್ಪಳ", "Mandya": "ಮಂಡ್ಯ",
    "Mysuru": "ಮೈಸೂರು", "Raichur": "ರಾಯಚೂರು", "Ramanagara": "ರಾಮನಗರ",
    "Shivamogga": "ಶಿವಮೊಗ್ಗ", "Tumakuru": "ತುಮಕೂರು", "Udupi": "ಉಡುಪಿ",
    "Uttara Kannada": "ಉತ್ತರ ಕನ್ನಡ", "Vijayanagara": "ವಿಜಯನಗರ",
    "Vijayapura": "ವಿಜಯಪುರ", "Yadgir": "ಯಾದಗಿರಿ"
  },
  te: {
    "Bagalkot": "బాగల్‌కోట్", "Ballari": "బళ్లారి", "Belagavi": "బెళగావి",
    "Bengaluru Rural": "బెంగళూరు గ్రామీణ", "Bengaluru Urban": "బెంగళూరు పట్టణ",
    "Bidar": "బీదర్", "Chamarajanagar": "చామరాజనగర్", "Chikkaballapura": "చిక్కబళ్లాపుర",
    "Chikkamagaluru": "చిక్కమగళూరు", "Chitradurga": "చిత్రదుర్గ",
    "Dakshina Kannada": "దక్షిణ కన్నడ", "Davanagere": "దావణగెరె",
    "Dharwad": "ధార్వాడ", "Gadag": "గదగ్", "Hassan": "హాసన్",
    "Haveri": "హావేరి", "Kalaburagi": "కలబురగి", "Kodagu": "కొడగు",
    "Kolar": "కోలార్", "Koppal": "కొప్పల్", "Mandya": "మండ్య",
    "Mysuru": "మైసూరు", "Raichur": "రాయచూరు", "Ramanagara": "రామనగర",
    "Shivamogga": "శివమొగ్గ", "Tumakuru": "తుమకూరు", "Udupi": "ఉడుపి",
    "Uttara Kannada": "ఉత్తర కన్నడ", "Vijayanagara": "విజయనగర",
    "Vijayapura": "విజయపుర", "Yadgir": "యాద్గీర్"
  },
  hi: {
    "Bagalkot": "बागलकोट", "Ballari": "बल्लारी", "Belagavi": "बेलगावी",
    "Bengaluru Rural": "बेंगलुरु ग्रामीण", "Bengaluru Urban": "बेंगलुरु शहरी",
    "Bidar": "बीदर", "Chamarajanagar": "चामराजनगर", "Chikkaballapura": "चिक्काबल्लापुर",
    "Chikkamagaluru": "चिक्कमगलुरू", "Chitradurga": "चित्रदुर्ग",
    "Dakshina Kannada": "दक्षिण कन्नड", "Davanagere": "दावणगेरे",
    "Dharwad": "धारवाड़", "Gadag": "गदग", "Hassan": "हासन",
    "Haveri": "हावेरी", "Kalaburagi": "कलबुर्गी", "Kodagu": "कोडगु",
    "Kolar": "कोलार", "Koppal": "कोप्पल", "Mandya": "मंड्या",
    "Mysuru": "मैसूर", "Raichur": "रायचूर", "Ramanagara": "रामनगर",
    "Shivamogga": "शिवमोग्गा", "Tumakuru": "तुमकुरू", "Udupi": "उडुपी",
    "Uttara Kannada": "उत्तर कन्नड", "Vijayanagara": "विजयनगर",
    "Vijayapura": "विजयपुर", "Yadgir": "यादगीर"
  },
  mr: {
    "Bagalkot": "बागलकोट", "Ballari": "बल्लारी", "Belagavi": "बेळगाव",
    "Bengaluru Rural": "बेंगळुरू ग्रामीण", "Bengaluru Urban": "बेंगळुरू शहरी",
    "Bidar": "बीदर", "Chamarajanagar": "चामराजनगर", "Chikkaballapura": "चिक्काबल्लापूर",
    "Chikkamagaluru": "चिक्कमगळूर", "Chitradurga": "चित्रदुर्ग",
    "Dakshina Kannada": "दक्षिण कन्नड", "Davanagere": "दावणगेरे",
    "Dharwad": "धारवाड", "Gadag": "गदग", "Hassan": "हासन",
    "Haveri": "हावेरी", "Kalaburagi": "कलबुर्गी", "Kodagu": "कोडगू",
    "Kolar": "कोलार", "Koppal": "कोप्पल", "Mandya": "मंड्या",
    "Mysuru": "म्हैसूर", "Raichur": "रायचूर", "Ramanagara": "रामनगर",
    "Shivamogga": "शिवमोग्गा", "Tumakuru": "तुमकुरू", "Udupi": "उडुपी",
    "Uttara Kannada": "उत्तर कन्नड", "Vijayanagara": "विजयनगर",
    "Vijayapura": "विजापूर", "Yadgir": "यादगीर"
  },
  ta: {
    "Bagalkot": "பாகல்கோட்", "Ballari": "பல்லாரி", "Belagavi": "பெலகாவி",
    "Bengaluru Rural": "பெங்களூரு கிராமம்", "Bengaluru Urban": "பெங்களூரு நகரம்",
    "Bidar": "பீதர்", "Chamarajanagar": "சாமராஜநகர்", "Chikkaballapura": "சிக்கபல்லாபுரா",
    "Chikkamagaluru": "சிக்கமகளூரு", "Chitradurga": "சித்ரதுர்கா",
    "Dakshina Kannada": "தெற்கு கன்னட", "Davanagere": "தாவணகெரே",
    "Dharwad": "தார்வாட்", "Gadag": "கடக்", "Hassan": "ஹாசன்",
    "Haveri": "ஹாவேரி", "Kalaburagi": "கலபுராகி", "Kodagu": "கொடகு",
    "Kolar": "கோலார்", "Koppal": "கொப்பல்", "Mandya": "மண்ட்யா",
    "Mysuru": "மைசூரு", "Raichur": "ராய்சூர்", "Ramanagara": "ராமநகர்",
    "Shivamogga": "சிவமொக்க", "Tumakuru": "துமகுரு", "Udupi": "உடுப்பி",
    "Uttara Kannada": "வட கன்னட", "Vijayanagara": "விஜயநகர்",
    "Vijayapura": "விஜயபுரம்", "Yadgir": "யாத்கீர்"
  }
}

/**
 * Returns localized district label for display, falls back to English.
 */
export function getDistrictLabel(districtValue, language) {
  const langMap = DISTRICT_LABELS[language] || DISTRICT_LABELS['en']
  return langMap[districtValue] || districtValue
}
