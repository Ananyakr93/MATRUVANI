import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, AlertOctagon, Loader2, Send, FileText } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { post } from '@/lib/api'
import { generateReferral } from '@/lib/generateReferral'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

export default function ResultCard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { ashaId, isOnline, language } = useAppStore()
  const { t } = useTranslation()

  const stateData = location.state || {}
  const { result, motherData } = stateData

  // Fallback if no result (navigated directly)
  useEffect(() => {
    if (!result) {
      navigate('/asha/home')
    }
  }, [result, navigate])

  const [sessionRecord, setSessionRecord] = useState(null)
  const [saveStatus, setSaveStatus] = useState(t('screening.saving')) 
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [smsStatus, setSmsStatus] = useState("idle") // idle, loading, success, error

  // Auto-save on mount
  useEffect(() => {
    if (!result || sessionRecord) return

    const saveSession = async () => {
      const payload = {
        mother_id: "00000000-0000-0000-0000-000000000000", // placeholder mother UUID for hackathon
        asha_id: ashaId,
        epds_score: result.epds_score,
        epds_answers: stateData.answers || Array(10).fill(0),
        free_speech_transcript: stateData.transcript || "",
        divergence_flag: result.divergence_flag || "GREEN",
        ams_score: result.ams_score || 0.0,
        risk_level: result.risk_level,
        session_date: new Date().toISOString().split('T')[0]
      }

      if (isOnline && !result.isOffline) {
        try {
          const res = await post('/api/v1/screening/session', payload)
          setSessionRecord(res)
          setSaveStatus("✓") // Or a translated saved string if available
          toast.success("✓")
        } catch (err) {
          console.error("Failed to save session", err)
          setSaveStatus("Error")
        }
      } else {
        setSaveStatus(t('offline.offline'))
        setSessionRecord({ id: "offline-" + Date.now() })
        // Add to offline queue logic would go here
      }
    }

    saveSession()
  }, [result, ashaId, isOnline, stateData, sessionRecord])

  if (!result) return null

  const { risk_level, divergence_flag, ams_score, epds_score, asha_script } = result
  
  // Fake PHC Data based on motherData district
  const phcData = {
    name: motherData?.district ? `${motherData.district} Primary Health Centre` : "Local PHC",
    phc_name: motherData?.district ? `${motherData.district} Primary Health Centre` : "Local PHC",
    phone: "+91 9876543210",
    address: "Main Road, Block A"
  }

  const handleSendSMS = async () => {
    if (!sessionRecord || sessionRecord.id.startsWith('offline')) {
      alert("Please wait for the session to save online before sending SMS.")
      return
    }
    setSmsStatus("loading")
    try {
      await post('/api/v1/sms/send-referral', {
        session_id: sessionRecord.id,
        phc_phone: phcData.phone,
        phc_name: phcData.name,
        risk_level,
        village_code: motherData?.villageCode || "UNKNOWN"
      })
      setSmsStatus("success")
      toast.success(t('result.referralSuccess'))
      setTimeout(() => setSmsStatus("idle"), 3000)
    } catch (err) {
      console.error(err)
      setSmsStatus("error")
      toast.error("Error sending SMS")
      setTimeout(() => setSmsStatus("idle"), 3000)
    }
  }

  const handleFinish = () => {
    navigate('/asha/home')
  }

  // Calculate next checkup date
  const today = new Date()
  let nextCheckup = new Date()
  if (risk_level === 'LOW') {
    nextCheckup.setDate(today.getDate() + 28) // 4 weeks
  } else {
    nextCheckup.setDate(today.getDate() + 14) // 2 weeks
  }
  const nextCheckupStr = nextCheckup.toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`, { day: 'numeric', month: 'short', year: 'numeric' })

  // Render variables based on risk
  let Icon = CheckCircle
  let iconColor = "text-green-500"
  let titleText = t('result.risk.low')
  let titleColor = "text-green-800"
  let cardBg = "bg-green-50 border-green-200 text-green-900"
  let scoreColor = "bg-green-500"
  let needsConfirmation = false

  if (risk_level === 'MODERATE') {
    Icon = AlertTriangle
    iconColor = "text-amber-500"
    titleText = t('result.risk.moderate')
    titleColor = "text-amber-800"
    cardBg = "bg-amber-50 border-amber-200 text-amber-900"
    scoreColor = "bg-amber-500"
    needsConfirmation = true
  } else if (risk_level === 'HIGH') {
    Icon = AlertOctagon
    iconColor = "text-red-600 animate-pulse"
    titleText = t('result.risk.high')
    titleColor = "text-red-800"
    cardBg = "bg-red-50 border-red-200 text-red-900"
    scoreColor = "bg-red-600"
    needsConfirmation = true
  }

  // Q10 Logic
  const hasSuicideRisk = stateData.answers && stateData.answers[9] > 0

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative pb-20">
      
      {/* HEADER (No back button) */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <div>
          <p className="text-xs text-gray-500 font-medium">SESSION ID</p>
          <p className="text-sm text-gray-700 font-mono">
            {sessionRecord ? String(sessionRecord.id).substring(0, 8) : "--------"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium">{today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {saveStatus === "सहेजा जा रहा है..." && <Loader2 size={12} className="animate-spin text-amber-500" />}
            <p className="text-xs font-semibold text-gray-600">{saveStatus}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 animate-fade-in-up">
        
        {/* Main Status */}
        <div className="flex flex-col items-center text-center mt-2">
          <Icon size={64} className={`${iconColor} mb-3`} />
          <h1 className={`text-2xl font-bold ${titleColor} mb-3`}>{titleText}</h1>
          
          <div className="flex flex-col items-center gap-2">
            <div className={`px-4 py-1.5 rounded-full text-white font-bold text-sm ${scoreColor} shadow-sm`}>
              {t('result.score')}: {epds_score}/30
            </div>
            {ams_score > 0.5 && (
              <div 
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300"
                title="माँ के शब्द EPDS स्कोर से मेल नहीं खाते — clinical review flag"
              >
                ⚠️ भाषाई असंगति
              </div>
            )}
          </div>
        </div>

        {/* Q10 Special Alert for HIGH risk */}
        {hasSuicideRisk && risk_level === 'HIGH' && (
          <div className="bg-amber-100 border-2 border-amber-400 p-4 rounded-xl shadow-sm">
            <p className="text-amber-900 font-bold text-lg mb-1">{t('demo.q10')} Alert</p>
          </div>
        )}

        <div className={`border-2 rounded-2xl p-5 ${cardBg}`}>
          <p className="font-bold text-sm mb-2 opacity-80">{t('result.action.title')}</p>
          <p className="text-lg font-medium leading-relaxed">
            {asha_script?.message || (risk_level === 'LOW' ? t('result.action.low') : risk_level === 'MODERATE' ? t('result.action.moderate') : t('result.action.high'))}
          </p>
        </div>

        {/* Action Panel for MODERATE & HIGH Risk */}
        {(risk_level === 'MODERATE' || risk_level === 'HIGH') && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-800 mb-1">PHC जानकारी ({phcData.name}):</p>
              <p className="text-gray-600 font-medium">{phcData.phone}</p>
              {risk_level === 'HIGH' && <p className="text-gray-600 text-sm mt-1">{phcData.address}</p>}
            </div>

            <button 
              onClick={handleSendSMS}
              className={`w-full h-14 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-colors
                ${risk_level === 'HIGH' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-500 text-white hover:bg-amber-600'}
              `}
            >
              {smsStatus === "loading" ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {smsStatus === "success" ? t('result.referralSuccess') : t('result.btn.referral')}
            </button>

            {risk_level === 'HIGH' && (
              <>
                <button
                  onClick={() => generateReferral({
                    id: sessionRecord?.id || '',
                    session_date: new Date().toISOString().split('T')[0],
                    village_code: motherData?.villageCode || 'UNKNOWN',
                    epds_score,
                    risk_level,
                    divergence_flag: divergence_flag || 'GREEN',
                  }, phcData)}
                  className="w-full h-14 bg-white border-2 border-red-400 text-red-700 rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-red-50 active:scale-95 transition-all"
                >
                  <FileText size={20} /> {t('result.btn.referral')}
                </button>
              </>
            )}

            <label className="flex items-start gap-3 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input 
                type="checkbox" 
                className="w-6 h-6 mt-0.5 accent-green-600"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <span className="text-gray-800 font-medium">
                {t('result.action.title')}
              </span>
            </label>
          </div>
        )}

        {/* Schedule */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mt-2">
          <span className="font-semibold text-blue-800">अगली जाँच:</span>
          <span className="font-bold text-blue-900">{nextCheckupStr}</span>
        </div>

      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-200 max-w-md mx-auto">
        <button 
          disabled={needsConfirmation && !isConfirmed}
          onClick={handleFinish}
          className="w-full h-16 bg-gray-900 text-white rounded-2xl text-lg font-bold disabled:opacity-50 disabled:bg-gray-400 transition-colors"
        >
          {t('result.btn.home')}
        </button>
      </div>

    </div>
  )
}
