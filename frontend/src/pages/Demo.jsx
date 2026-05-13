import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Baby, Plus, Loader2, CheckCircle, AlertOctagon, Send, Activity, AlertTriangle, RotateCcw } from 'lucide-react'
import { EPDS_QUESTIONS } from '@/lib/epds'
import RiskBadge from '@/components/RiskBadge'
import { useTranslation } from '@/hooks/useTranslation'
import { useAppStore } from '@/store/useAppStore'

const STAGES = [
  { duration: 1500, label: 'स्वागत' },
  { duration: 1500, label: 'ASHA होम' },
  { duration: 2000, label: 'माँ की जानकारी' },
  { duration: 2000, label: 'प्रश्न 1' },
  { duration: 2000, label: 'प्रश्न 2' },
  { duration: 2000, label: 'प्रश्न 5' },
  { duration: 3000, label: 'प्रश्न 10 ⚠️' },
  { duration: 3000, label: 'मुक्त भाषण' },
  { duration: 1500, label: 'विश्लेषण' },
  { duration: 3000, label: 'परिणाम' },
  { duration: 2000, label: 'SMS भेजना' },
  { duration: 2000, label: 'डॉक्टर डैशबोर्ड' },
  { duration: 2000, label: 'जिला डैशबोर्ड' },
  { duration: 0, label: 'समाप्त' },
]

const DISTRESS_TEXT = "मुझे बहुत अकेलापन लगता है... बच्चे को देखकर भी खुशी नहीं होती। रात को नींद नहीं आती, बस रोती रहती हूँ।"

export default function Demo() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [typedText, setTypedText] = useState('')
  const [smsState, setSmsState] = useState('sending')
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

  // Typing effect for step 7
  useEffect(() => {
    if (step !== 7) { setTypedText(''); return }
    let i = 0
    const iv = setInterval(() => {
      i++
      setTypedText(DISTRESS_TEXT.slice(0, i))
      if (i >= DISTRESS_TEXT.length) clearInterval(iv)
    }, 60)
    return () => clearInterval(iv)
  }, [step])

  // SMS animation for step 10
  useEffect(() => {
    if (step !== 10) { setSmsState('sending'); return }
    const t = setTimeout(() => setSmsState('sent'), 1200)
    return () => clearTimeout(t)
  }, [step])

  // District counter for step 12
  useEffect(() => {
    if (step !== 12) { setDistrictCount(47); return }
    const t = setTimeout(() => setDistrictCount(48), 800)
    return () => clearTimeout(t)
  }, [step])

  const restart = () => { setStep(0); setIsPlaying(true) }

  const renderContent = () => {
    switch (step) {
      // ── Welcome ──
      case 0: return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><Baby size={48} className="text-red-900" /></div>
          <h1 className="text-3xl font-bold text-green-900">MATRUVANI</h1>
          <p className="text-green-700 font-medium">{t('welcome.tagline1')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
            {['हिन्दी','ಕನ್ನಡ','मराठी','English'].map((l,i) => (
              <div key={l} className={`py-3 rounded-xl text-center text-sm font-semibold border transition-all duration-500 ${i===0 && 'bg-green-600 text-white border-green-600 shadow-md scale-105'} ${i!==0 && 'bg-white text-green-900 border-green-200'}`}>{l}</div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-green-600 text-sm font-medium"><Loader2 size={16} className="animate-spin" /> {t('demo.languageSelect')}...</div>
        </div>
      )

      // ── ASHA Home ──
      case 1: return (
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

      // ── Mother Setup ──
      case 2: return (
        <div className="flex flex-col flex-1 p-6 gap-6">
          <h2 className="text-2xl font-bold text-green-900">{t('demo.motherInfo')}</h2>
          <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col gap-5">
            <div><label className="text-sm font-semibold text-gray-700 mb-2 block">{t('demo.status')}</label>
              <div className="flex bg-gray-100 p-1 rounded-xl"><div className="flex-1 py-3 rounded-lg text-sm font-semibold bg-white shadow text-green-800 text-center">{t('demo.pregnant')}</div><div className="flex-1 py-3 text-sm font-semibold text-gray-500 text-center">{t('demo.postpartum')}</div></div>
            </div>
            <div><label className="text-sm font-semibold text-gray-700 block mb-2">{t('demo.villageCode')}</label>
              <div className="w-full h-14 border-2 border-green-500 rounded-xl px-4 text-xl uppercase tracking-widest flex items-center font-mono bg-green-50 text-green-900">KA001<span className="animate-pulse ml-0.5">|</span></div>
            </div>
          </div>
        </div>
      )

      // ── Questions ──
      case 3: case 4: case 5: case 6: {
        const qMap = { 3: 1, 4: 2, 5: 5, 6: 10 }
        const ansMap = { 3: 1, 4: 0, 5: 0, 6: 1 }
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

      // ── Free Speech ──
      case 7: return (
        <div className="flex flex-col flex-1 p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-2">{t('screening.freeSpeech.title')}</h2>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl mb-6"><p className="text-green-800 font-medium text-lg leading-snug">{t('screening.freeSpeech.desc')}</p></div>
          <div className="flex-1 min-h-[180px] w-full border-2 border-amber-400 rounded-2xl p-4 text-lg bg-amber-50 text-gray-800 leading-relaxed">{typedText}<span className="animate-pulse text-amber-600">|</span></div>
        </div>
      )

      // ── Processing ──
      case 8: return (
        <div className="flex flex-col flex-1 items-center justify-center p-6 bg-green-50">
          <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6"><Loader2 size={48} className="animate-spin text-green-600" /></div>
          <h2 className="text-2xl font-bold text-green-900">विश्लेषण हो रहा है...</h2>
          <p className="text-green-700 mt-2 text-center">AI जवाबों और भाषाई पैटर्न का अध्ययन कर रहा है।</p>
          <div className="mt-6 flex gap-2">{[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-green-500 animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}</div>
        </div>
      )

      // ── HIGH RISK Result ──
      case 9: return (
        <div className="flex flex-col flex-1 p-6 gap-6">
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
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-1">PHC जानकारी (Hoskote Town PHC):</p>
            <p className="text-gray-600 font-medium">+91 9876543210</p>
          </div>
        </div>
      )

      // ── SMS ──
      case 10: return (
        <div className="flex flex-col flex-1 items-center justify-center p-6 gap-6">
          {smsState === 'sending' ? (<>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"><Send size={36} className="text-red-600 animate-pulse" /></div>
            <h2 className="text-xl font-bold text-red-800">PHC को SMS भेजा जा रहा है...</h2>
            <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-red-400 animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}</div>
          </>) : (<>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle size={48} className="text-green-600" /></div>
            <h2 className="text-xl font-bold text-green-800">✓ SMS भेजा गया</h2>
            <p className="text-gray-600 text-center font-medium">Hoskote Town PHC को HIGH RISK अलर्ट भेजा गया।<br/>Session ID: 1a2b3c4d</p>
          </>)}
        </div>
      )

      // ── Doctor Dashboard ──
      case 11: return (
        <div className="flex flex-col flex-1">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div><h1 className="text-lg font-bold text-gray-900">👩‍⚕️ Hoskote Town PHC</h1><p className="text-xs text-gray-500">Doctor Dashboard</p></div>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">🔔 NEW ALERT</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="bg-white rounded-2xl border-l-4 border-red-500 shadow-sm p-4 ring-2 ring-red-200 animate-pulse">
              <div className="flex items-center gap-2 mb-2"><AlertOctagon size={20} className="text-red-600" /><RiskBadge level="HIGH" /><span className="text-xs text-gray-400 ml-auto font-mono">अभी</span></div>
              <p className="font-bold text-gray-900">Village: KA001</p>
              <div className="flex gap-2 mt-2"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">EPDS: 19/30</span><span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded text-sm font-bold">⚠️ Divergence</span></div>
            </div>
            <div className="bg-white rounded-2xl border-l-4 border-amber-500 shadow-sm p-4 opacity-60">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle size={20} className="text-amber-500" /><RiskBadge level="MODERATE" /></div>
              <p className="font-bold text-gray-900">Village: VIL004</p>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">EPDS: 12/30</span>
            </div>
          </div>
        </div>
      )

      // ── District Dashboard ──
      case 12: return (
        <div className="flex flex-col flex-1">
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <h1 className="text-lg font-bold text-gray-900">📊 {t('district.login.title')}: Bengaluru Rural</h1>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.screenings')}</p><p className="text-3xl font-bold text-gray-900 transition-all duration-500">{districtCount}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-red-200 bg-red-50/30"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.highRisk')}</p><p className="text-3xl font-bold text-red-600">{districtCount === 48 ? 9 : 8}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.detection')}</p><p className="text-2xl font-bold text-amber-500">{districtCount === 48 ? '18.8' : '17.0'}%</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 font-bold mb-1">{t('district.dashboard.coverage')}</p><p className="text-2xl font-bold text-blue-600">35</p></div>
          </div>
          {districtCount === 48 && (
            <div className="mx-4 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 animate-fade-in-up">
              <p className="text-amber-800 font-bold flex items-center gap-2"><AlertTriangle size={18} /> ⚠️ 1 New {t('district.dashboard.darkVillages')} — KA001</p>
              <p className="text-amber-700 text-sm mt-1">{t('district.dashboard.darkVillagesDesc')}</p>
            </div>
          )}
        </div>
      )

      // ── End ──
      case 13: return (
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
          <button onClick={() => navigate('/')} className="mt-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-green-700 active:scale-95 transition-all">Go To App →</button>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {/* DEMO BANNER */}
      <div className="fixed top-0 inset-x-0 bg-amber-400 text-amber-900 text-sm py-1.5 px-4 text-center z-50 font-bold tracking-wide shadow-md">
        {t('demo.banner')}
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
      <div className="mt-20 mb-16 w-full max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 min-h-[600px] flex flex-col relative">
          <div className={`flex-1 flex flex-col transition-all duration-300 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Restart */}
      <button onClick={restart} className="fixed bottom-4 right-4 z-50 bg-white text-green-700 border-2 border-green-300 px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-green-50 active:scale-95 transition-all flex items-center gap-2">
        <RotateCcw size={18} /> {t('demo.restart')}
      </button>

      {/* Pause/Play */}
      <button onClick={() => setIsPlaying(!isPlaying)} className="fixed bottom-4 left-4 z-50 bg-white text-gray-600 border border-gray-300 px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-gray-50 active:scale-95 transition-all text-sm">
        {isPlaying ? `⏸ ${t('demo.pause')}` : `▶ ${t('demo.play')}`}
      </button>
    </div>
  )
}
