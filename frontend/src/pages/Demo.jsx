import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Baby, Plus, Loader2, CheckCircle, AlertOctagon, Send, Activity, AlertTriangle, RotateCcw, FastForward, Play, Pause, HeartPulse, UserCheck, ShieldAlert } from 'lucide-react'
import { EPDS_QUESTIONS } from '@/lib/epds'
import RiskBadge from '@/components/RiskBadge'
import { useTranslation } from '@/hooks/useTranslation'
import { useAppStore } from '@/store/useAppStore'

const STAGES = [
  // ── 0: Welcome ──
  { duration: 2000, label: 'Welcome' },
  
  // ── SCENARIO 1: HIGH RISK ──
  { duration: 2500, label: 'Scenario 1: High Risk' }, 
  { duration: 1500, label: 'ASHA Home' },
  { duration: 2000, label: 'Mother Info (High Risk)' },
  { duration: 2000, label: 'Question 1' },
  { duration: 2000, label: 'Question 5' },
  { duration: 3000, label: 'Question 10 (Critical)' },
  { duration: 4000, label: 'Free Speech' },
  { duration: 2000, label: 'AI Processing' },
  { duration: 4000, label: 'Result: HIGH RISK' },
  { duration: 2500, label: 'SMS Sent' },

  // ── SCENARIO 2: LOW RISK ──
  { duration: 2500, label: 'Scenario 2: Low Risk' },
  { duration: 1500, label: 'ASHA Home' },
  { duration: 2000, label: 'Mother Info (Low Risk)' },
  { duration: 2000, label: 'Question 1' },
  { duration: 2000, label: 'Question 2' },
  { duration: 3000, label: 'Result: LOW RISK' },

  // ── SCENARIO 3: DOCTOR ──
  { duration: 2500, label: 'Scenario 3: Doctor Workflow' },
  { duration: 5000, label: 'Doctor Dashboard' },

  // ── SCENARIO 4: DISTRICT ──
  { duration: 2500, label: 'Scenario 4: District Analytics' },
  { duration: 5000, label: 'District Dashboard' },

  // ── END ──
  { duration: 0, label: 'Demo Complete' },
]

const DISTRESS_TEXT = "मुझे बहुत अकेलापन लगता है... बच्चे को देखकर भी खुशी नहीं होती। रात को नींद नहीं आती, बस रोती रहती हूँ।"

export default function Demo() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [typedText, setTypedText] = useState('')
  const [smsState, setSmsState] = useState('sending')
  const [docState, setDocState] = useState('pending')
  const [districtCount, setDistrictCount] = useState(47)
  const [fade, setFade] = useState(true)
  const { t } = useTranslation()
  const { language } = useAppStore()

  const goToStep = useCallback((s) => {
    setFade(false)
    setTimeout(() => { setStep(s); setFade(true) }, 200)
  }, [])

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || step >= STAGES.length - 1) return
    const t = setTimeout(() => goToStep(step + 1), STAGES[step].duration)
    return () => clearTimeout(t)
  }, [step, isPlaying, goToStep])

  // Typing effect for Free Speech (Step 7)
  useEffect(() => {
    if (step !== 7) { setTypedText(''); return }
    let i = 0
    const iv = setInterval(() => {
      i++
      setTypedText(DISTRESS_TEXT.slice(0, i))
      if (i >= DISTRESS_TEXT.length) clearInterval(iv)
    }, 50)
    return () => clearInterval(iv)
  }, [step])

  // SMS animation (Step 10)
  useEffect(() => {
    if (step !== 10) { setSmsState('sending'); return }
    const t = setTimeout(() => setSmsState('sent'), 1200)
    return () => clearTimeout(t)
  }, [step])

  // Doctor review animation (Step 18)
  useEffect(() => {
    if (step !== 18) { setDocState('pending'); return }
    const t = setTimeout(() => setDocState('reviewed'), 2500)
    return () => clearTimeout(t)
  }, [step])

  // District counter animation (Step 20)
  useEffect(() => {
    if (step !== 20) { setDistrictCount(47); return }
    const t = setTimeout(() => setDistrictCount(49), 1000)
    return () => clearTimeout(t)
  }, [step])

  const restart = () => { setStep(0); setIsPlaying(true) }
  
  const skipToNextScenario = () => {
    let nextStep = STAGES.length - 1
    if (step < 1) nextStep = 1
    else if (step < 11) nextStep = 11
    else if (step < 17) nextStep = 17
    else if (step < 19) nextStep = 19
    setStep(nextStep)
    setFade(true)
  }

  const renderContent = () => {
    switch (step) {
      // ── 0: Welcome ──
      case 0: return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><Baby size={48} className="text-red-900" /></div>
          <h1 className="text-3xl font-bold text-green-900">MATRUVANI</h1>
          <p className="text-green-700 font-medium text-center">{t('welcome.tagline1')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
            {['हिन्दी','ಕನ್ನಡ','मराठी','English'].map((l,i) => (
              <div key={l} className={`py-3 rounded-xl text-center text-sm font-semibold border transition-all duration-500 ${i===0 && 'bg-green-600 text-white border-green-600 shadow-md scale-105'} ${i!==0 && 'bg-white text-green-900 border-green-200'}`}>{l}</div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-green-600 text-sm font-medium"><Loader2 size={16} className="animate-spin" /> {t('demo.languageSelect') || 'Selecting language'}...</div>
        </div>
      )

      // ── Title Cards (1, 11, 17, 19) ──
      case 1: return (
        <div className="flex flex-col items-center justify-center flex-1 p-8 bg-red-900 text-white text-center">
          <ShieldAlert size={64} className="mb-4 text-red-300" />
          <h2 className="text-3xl font-bold mb-2">{t('demo.titleCard.s1')}</h2>
          <p className="text-xl text-red-200">{t('demo.titleCard.s1Desc')}</p>
        </div>
      )
      case 11: return (
        <div className="flex flex-col items-center justify-center flex-1 p-8 bg-green-900 text-white text-center">
          <HeartPulse size={64} className="mb-4 text-green-300" />
          <h2 className="text-3xl font-bold mb-2">{t('demo.titleCard.s2')}</h2>
          <p className="text-xl text-green-200">{t('demo.titleCard.s2Desc')}</p>
        </div>
      )
      case 17: return (
        <div className="flex flex-col items-center justify-center flex-1 p-8 bg-blue-900 text-white text-center">
          <UserCheck size={64} className="mb-4 text-blue-300" />
          <h2 className="text-3xl font-bold mb-2">{t('demo.titleCard.s3')}</h2>
          <p className="text-xl text-blue-200">{t('demo.titleCard.s3Desc')}</p>
        </div>
      )
      case 19: return (
        <div className="flex flex-col items-center justify-center flex-1 p-8 bg-purple-900 text-white text-center">
          <Activity size={64} className="mb-4 text-purple-300" />
          <h2 className="text-3xl font-bold mb-2">{t('demo.titleCard.s4')}</h2>
          <p className="text-xl text-purple-200">{t('demo.titleCard.s4Desc')}</p>
        </div>
      )

      // ── ASHA Home (2, 12) ──
      case 2:
      case 12: return (
        <div className="flex flex-col flex-1">
          <div className="bg-green-700 text-white p-6 rounded-b-3xl">
            <div className="mt-4"><h1 className="text-3xl font-bold mb-1">{t('asha.home.greeting')}</h1><p className="text-green-100 text-lg font-medium">Hoskote Town</p></div>
          </div>
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="w-full h-24 bg-green-600 text-white rounded-2xl flex items-center px-6 shadow-lg animate-pulse ring-4 ring-green-300">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4"><Plus size={28} strokeWidth={2.5} /></div>
              <span className="text-2xl font-bold">{t('asha.home.btn.newScreening')}</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium justify-center mt-2"><Loader2 size={14} className="animate-spin" /> {t('demo.tapping')}...</div>
          </div>
        </div>
      )

      // ── Mother Setup (3: High Risk, 13: Low Risk) ──
      case 3:
      case 13: {
        const isHighRisk = step === 3;
        const village = isHighRisk ? 'KA001' : 'VIL004';
        return (
          <div className="flex flex-col flex-1 p-6 gap-6">
            <h2 className="text-2xl font-bold text-green-900">{t('demo.motherInfo')}</h2>
            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col gap-5">
              <div><label className="text-sm font-semibold text-gray-700 mb-2 block">{t('demo.status')}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <div className="flex-1 py-3 rounded-lg text-sm font-semibold bg-white shadow text-green-800 text-center">{t('demo.pregnant')}</div>
                  <div className="flex-1 py-3 text-sm font-semibold text-gray-500 text-center">{t('demo.postpartum')}</div>
                </div>
              </div>
              <div><label className="text-sm font-semibold text-gray-700 block mb-2">{t('demo.villageCode')}</label>
                <div className="w-full h-14 border-2 border-green-500 rounded-xl px-4 text-xl uppercase tracking-widest flex items-center font-mono bg-green-50 text-green-900">{village}<span className="animate-pulse ml-0.5">|</span></div>
              </div>
            </div>
          </div>
        )
      }

      // ── Questions (High Risk: 4,5,6 / Low Risk: 14,15) ──
      case 4: case 5: case 6: case 14: case 15: {
        // qNum mapping
        const qMap = { 4: 1, 5: 5, 6: 10, 14: 1, 15: 2 }
        // Answer index mapping
        const ansMap = { 4: 1, 5: 0, 6: 1, 14: 3, 15: 3 } // High risk picks top answers, Low risk picks bottom answers
        const qNum = qMap[step]
        const selAns = ansMap[step]
        const qData = EPDS_QUESTIONS[qNum]
        const isCritical = step === 6
        return (
          <div className="flex flex-col flex-1 pb-6">
            <div className="px-6 pt-4"><div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(qNum / 10) * 100}%` }} /></div><p className="text-sm text-gray-500 text-center mt-2 font-medium">{t('screening.question')} {qNum} / 10</p></div>
            <h2 className={`mt-6 px-6 text-2xl font-semibold text-center leading-relaxed ${isCritical ? 'text-red-800' : 'text-green-900'}`}>{qData[language] || qData.hi}</h2>
            {isCritical && <p className="text-center text-red-600 font-bold text-sm mt-2 animate-pulse">⚠️ {t('demo.q10')}</p>}
            <div className="mt-8 px-4 space-y-3 flex-1 flex flex-col justify-end">
              {(qData[`options_${language}`] || qData.options_hi).map((opt, i) => (
                <div key={i} className={`w-full min-h-[64px] rounded-xl border-2 text-lg font-medium px-4 flex items-center transition-all duration-700 ${i === selAns ? 'border-green-500 bg-green-50 text-green-800 shadow-sm scale-[1.02]' : 'border-gray-200 bg-white text-gray-800'}`}>{opt}</div>
              ))}
            </div>
          </div>
        )
      }

      // ── Free Speech (7) ──
      case 7: return (
        <div className="flex flex-col flex-1 p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-2">{t('screening.freeSpeech.title')}</h2>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl mb-6"><p className="text-green-800 font-medium text-lg leading-snug">{t('screening.freeSpeech.desc')}</p></div>
          <div className="flex-1 min-h-[180px] w-full border-2 border-amber-400 rounded-2xl p-4 text-lg bg-amber-50 text-gray-800 leading-relaxed">{typedText}<span className="animate-pulse text-amber-600">|</span></div>
        </div>
      )

      // ── Processing (8) ──
      case 8: return (
        <div className="flex flex-col flex-1 items-center justify-center p-6 bg-green-50">
          <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6"><Loader2 size={48} className="animate-spin text-green-600" /></div>
          <h2 className="text-2xl font-bold text-green-900">{t('demo.processing.title')}</h2>
          <p className="text-green-700 mt-2 text-center">{t('demo.processing.desc')}</p>
          <div className="mt-6 flex gap-2">{[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-green-500 animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}</div>
        </div>
      )

      // ── HIGH RISK Result (9) ──
      case 9: return (
        <div className="flex flex-col flex-1 p-6 gap-6 bg-red-50/50">
          <div className="flex flex-col items-center text-center mt-2">
            <AlertOctagon size={64} className="text-red-600 animate-pulse mb-3" />
            <h1 className="text-2xl font-bold text-red-800 mb-3">{t('result.risk.high')}</h1>
            <div className="px-4 py-1.5 rounded-full text-white font-bold text-sm bg-red-600 shadow-sm">{t('result.score')}: 19/30</div>
            <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 mt-2">⚠️ Linguistic Divergence</div>
          </div>
          <div className="border-2 rounded-2xl p-5 bg-red-50 border-red-200 text-red-900">
            <p className="font-bold text-sm mb-2 opacity-80">{t('result.action.title')}</p>
            <p className="text-lg font-medium leading-relaxed">{t('result.action.high')}</p>
          </div>
          <div className="bg-white border-2 border-red-100 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-1">PHC जानकारी (Hoskote Town PHC):</p>
            <p className="text-gray-600 font-medium">+91 9876543210</p>
          </div>
        </div>
      )

      // ── LOW RISK Result (16) ──
      case 16: return (
        <div className="flex flex-col flex-1 p-6 gap-6 bg-green-50/50">
          <div className="flex flex-col items-center text-center mt-2">
            <CheckCircle size={64} classNa      // ── SMS (10) ──
      case 10: return (
        <div className="flex flex-col flex-1 items-center justify-center p-6 gap-6">
          {smsState === 'sending' ? (<>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"><Send size={36} className="text-red-600 animate-pulse" /></div>
            <h2 className="text-xl font-bold text-red-800">{t('demo.sms.sending')}</h2>
            <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-red-400 animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}</div>
          </>) : (<>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle size={48} className="text-green-600" /></div>
            <h2 className="text-xl font-bold text-green-800">{t('demo.sms.sent')}</h2>
            <p className="text-gray-600 text-center font-medium">{t('demo.sms.desc')}<br/>Session ID: 1a2b3c4d</p>
          </>)}
        </div>
      )

      // ── Doctor Dashboard (18) ──
      case 18: return (
        <div className="flex flex-col flex-1 bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div><h1 className="text-lg font-bold text-gray-900">👩‍⚕️ Hoskote Town PHC</h1><p className="text-xs text-gray-500">Doctor Dashboard</p></div>
            {docState === 'pending' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">1 {t('demo.doc.pending')}</span>}
          </div>
          <div className="flex border-b border-gray-200 bg-white">
            <div className={`flex-1 text-center py-2 text-sm font-bold ${docState === 'pending' ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-500'}`}>{t('demo.doc.pending')} (1)</div>
            <div className={`flex-1 text-center py-2 text-sm font-bold ${docState === 'reviewed' ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-500'}`}>{t('demo.doc.reviewed')}</div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {docState === 'pending' ? (
              <div className="bg-white rounded-2xl border-l-4 border-red-500 shadow-sm p-4 ring-2 ring-red-200 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><AlertOctagon size={20} className="text-red-600" /><RiskBadge level="HIGH" /></div>
                  <span className="text-xs text-gray-400 font-mono">1m ago</span>
                </div>
                <p className="font-bold text-gray-900 mb-1">Village: KA001</p>
                <div className="flex gap-2 mt-2 mb-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">Score: 19</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold">⚠️ Linguistic</span>
                </div>
                <button className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700 transition-colors">{t('demo.doc.reviewCase')}</button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-l-4 border-green-500 shadow-sm p-4 opacity-80">
                <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className="text-green-500" /><RiskBadge level="HIGH" /></div>
                <p className="font-bold text-gray-900">Village: KA001</p>
                <p className="text-xs text-gray-500 mt-1">Status: Reviewed & Action Taken</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border-l-4 border-amber-500 shadow-sm p-4 opacity-60">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle size={20} className="text-amber-500" /><RiskBadge level="MODERATE" /></div>
              <p className="font-bold text-gray-900">Village: VIL004</p>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold inline-block mt-2">Score: 12/30</span>
            </div>
          </div>
        </div>
      )

      // ── District Dashboard (20) ──
      case 20: return (
        <div className="flex flex-col flex-1 bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <h1 className="text-lg font-bold text-gray-900">📊 {t('district.login.title') || 'District Dashboard'}: Bengaluru Rural</h1>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.stats.screenings')}</p><p className="text-3xl font-bold text-gray-900 transition-all duration-500">{districtCount}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-red-200 bg-red-50/30"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.stats.highRisk')}</p><p className="text-3xl font-bold text-red-600">{districtCount === 49 ? 9 : 8}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.stats.detectionRate')}</p><p className="text-2xl font-bold text-amber-500">{districtCount === 49 ? '18.3' : '17.0'}%</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.stats.coverage')}</p><p className="text-2xl font-bold text-blue-600">35</p></div>
          </div>
          {districtCount === 49 && (
            <div className="mx-4 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 animate-fade-in-up shadow-sm">
              <p className="text-amber-800 font-bold flex items-center gap-2"><AlertTriangle size={18} /> ⚠️ 1 {t('demo.dist.darkVillage')}</p>
              <p className="text-amber-700 text-sm mt-1 mb-3">KA001 has reached 42% high-risk rate.</p>
              <button className="w-full bg-amber-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-700">{t('demo.dist.assign')}</button>
            </div>
          )}
        </div>
      )

      // ── End (21) ──
      case 21: return (
        <div className="flex flex-col items-center justify-center flex-1 p-8 gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle size={48} className="text-green-600" /></div>
          <h1 className="text-2xl font-bold text-green-900 leading-snug">MATRUVANI<br/><span className="text-lg text-green-700 font-medium">One Screen, Four Changes</span></h1>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-2">
            <div className="bg-green-50 rounded-xl p-3 border border-green-200"><p className="text-2xl font-bold text-green-700">4 min</p><p className="text-xs text-green-600 font-medium">Per Screen</p></div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200"><p className="text-2xl font-bold text-blue-700">8</p><p className="text-xs text-blue-600 font-medium">Languages</p></div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200"><p className="text-2xl font-bold text-amber-700">100%</p><p className="text-xs text-amber-600 font-medium">Offline</p></div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-200"><p className="text-2xl font-bold text-red-700">DPDP</p><p className="text-xs text-red-600 font-medium">Compliant</p></div>
          </div>
          <p className="text-sm text-gray-500 font-semibold mt-4">Team CARECODERS</p>
          <button onClick={() => navigate('/')} className="mt-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-green-700 active:scale-95 transition-all">Exit Demo →</button>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {/* DEMO BANNER */}
      <div className="fixed top-0 inset-x-0 bg-amber-400 text-amber-900 text-sm py-1.5 px-4 text-center z-50 font-bold tracking-wide shadow-md flex justify-between items-center">
        <span>{t('demo.banner') || 'Live Demo — Not Real Data'}</span>
      </div>

      {/* Progress bar */}
      <div className="fixed top-8 inset-x-0 z-40 px-4">
        <div className="max-w-md mx-auto flex items-center gap-1">
          {STAGES.map((s, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300" style={{ background: i <= step ? '#16a34a' : '#d1d5db' }} title={s.label} />
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 font-semibold mt-1">{STAGES[step]?.label} ({step + 1}/{STAGES.length})</p>
      </div>

      {/* Phone frame */}
      <div className="mt-20 mb-20 w-full max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 min-h-[600px] flex flex-col relative">
          <div className={`flex-1 flex flex-col transition-all duration-300 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Controls Container (Bottom) */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-200 z-50 flex items-center justify-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <button onClick={restart} className="bg-gray-100 text-gray-700 p-3 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all">
          <RotateCcw size={20} />
        </button>
        
        <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 ${isPlaying ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-green-600 text-white shadow-md hover:bg-green-700'}`}>
          {isPlaying ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Play</>}
        </button>

        <button onClick={skipToNextScenario} className="bg-blue-100 text-blue-700 p-3 rounded-xl font-bold hover:bg-blue-200 active:scale-95 transition-all flex items-center gap-1">
          Skip <FastForward size={20} />
        </button>
      </div>
    </div>
  )
}
