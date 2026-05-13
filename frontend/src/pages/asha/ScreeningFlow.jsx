import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Volume2, Pause, Loader2, Mic, VolumeX } from 'lucide-react'
import { useScreening } from '@/hooks/useScreening'
import { useAppStore } from '@/store/useAppStore'
import { EPDS_QUESTIONS, calculate_epds_score } from '@/lib/epds'
import { post } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

export default function ScreeningFlow() {
  const navigate = useNavigate()
  const { language, isOnline } = useAppStore()
  const { t } = useTranslation()
  const screening = useScreening()
  const {
    step, setStep,
    motherData, setMotherData,
    answers, setAnswer,
    transcript, setTranscript,
    setIsProcessing,
    clearDraft,
  } = screening

  // ── TTS (all hooks must live here at the component level) ──────────────────
  const tts = useSpeechSynthesis(language)

  // ── Local UI state (lifted out of render sub-functions) ───────────────────
  const [selectedOption, setSelectedOption] = useState(null)
  const [isListening, setIsListening] = useState(false)

  // ── Auto-read the question whenever the active step changes ───────────────
  useEffect(() => {
    if (step >= 1 && step <= 10) {
      const qData = EPDS_QUESTIONS[step]
      const text = qData[language] || qData['en']
      // Small delay lets the slide-in animation finish first
      const timer = setTimeout(() => tts.speak(text), 350)
      return () => {
        clearTimeout(timer)
        tts.stop()
      }
    } else {
      tts.stop()
    }
  }, [step, language]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Processing logic (was incorrectly inside renderProcessing) ────────────
  useEffect(() => {
    if (step !== 12) return

    const handleOfflineFallback = () => {
      const localResult = calculate_epds_score(answers)
      const fakeResponse = {
        epds_score: localResult.epds_score,
        risk_level: localResult.risk_level,
        divergence_flag: 'GREEN',
        ams_score: 0.0,
        asha_script: null,
        matched_phrases: [],
        isOffline: true,
      }
      clearDraft()
      navigate('/asha/result', { state: { result: fakeResponse, motherData, answers, transcript } })
    }

    const process = async () => {
      setIsProcessing(true)
      await new Promise(r => setTimeout(r, 1500))

      if (isOnline) {
        try {
          const res = await post('/screening/analyze', { answers, transcript, language })
          clearDraft()
          navigate('/asha/result', { state: { result: res, motherData, answers, transcript } })
        } catch (e) {
          console.error(e)
          handleOfflineFallback()
        }
      } else {
        handleOfflineFallback()
      }
    }

    process()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBack = () => {
    tts.stop()
    if (step > 0) setStep(step - 1)
    else navigate('/asha/home')
  }

  const handleOptionSelect = (qIndex, ansIndex) => {
    setSelectedOption(ansIndex)
    setAnswer(qIndex, ansIndex)
    setTimeout(() => {
      setSelectedOption(null)
      setStep(step + 1)
    }, 500)
  }

  // ── Step 0: Mother info form ───────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="flex flex-col flex-1 p-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-green-900 mb-6">{t('demo.motherInfo')}</h2>

      <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col gap-6">

        {/* Toggle Status */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">{t('demo.status')}</label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMotherData({ isPregnant: true })}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${motherData.isPregnant ? 'bg-white shadow text-green-800' : 'text-gray-500'}`}
            >
              {t('demo.pregnant')}
            </button>
            <button
              onClick={() => setMotherData({ isPregnant: false })}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${!motherData.isPregnant ? 'bg-white shadow text-green-800' : 'text-gray-500'}`}
            >
              {t('demo.postpartum')}
            </button>
          </div>
        </div>

        {/* Conditional Inputs */}
        {motherData.isPregnant ? (
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">{t('screening.weeksPregnant')}</label>
            <input
              type="range" min="1" max="40"
              value={motherData.gestationalWeek}
              onChange={(e) => setMotherData({ gestationalWeek: parseInt(e.target.value) })}
              className="w-full accent-green-600"
            />
            <div className="text-center mt-2 font-bold text-green-800">{motherData.gestationalWeek} {t('screening.weeks')}</div>
          </div>
        ) : (
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">{t('screening.daysPostpartum')}</label>
            <input
              type="number" min="0" max="365"
              value={motherData.daysPostpartum}
              onChange={(e) => setMotherData({ daysPostpartum: e.target.value })}
              className="w-full h-14 border-2 border-green-300 rounded-xl px-4 text-xl"
              placeholder={t('screening.daysPlaceholder')}
            />
          </div>
        )}

        {/* Village Code */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">{t('screening.villageCodeLabel')}</label>
          <p className="text-xs text-amber-600 italic mb-2">{t('screening.noNameDesc')}</p>
          <input
            type="text" maxLength={6}
            value={motherData.villageCode}
            onChange={(e) => setMotherData({ villageCode: e.target.value.toUpperCase() })}
            className="w-full h-14 border-2 border-green-300 rounded-xl px-4 text-xl uppercase tracking-widest"
            placeholder={t('screening.villageCodePlaceholder')}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          disabled={!motherData.villageCode || (!motherData.isPregnant && !motherData.daysPostpartum)}
          onClick={() => setStep(1)}
          className="w-full h-16 bg-green-600 text-white rounded-2xl text-xl font-bold disabled:opacity-50"
        >
          {t('screening.btn.start')}
        </button>
      </div>
    </div>
  )

  // ── Steps 1–10: EPDS question cards ──────────────────────────────────────
  const renderQuestionStep = () => {
    const qIndex = step - 1
    const qNum = step
    const qData = EPDS_QUESTIONS[qNum]
    const questionText = qData[language] || qData['en']
    const options = qData[`options_${language}`] || qData['options_en']

    return (
      <div className="flex flex-col flex-1 pb-6 animate-fade-in-up">

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(qNum / 10) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center mt-2 font-medium">
            {t('screening.question')} {qNum} / 10
          </p>
        </div>

        {/* TTS Audio Button */}
        <div className="flex flex-col items-center mt-6">
          <div className="relative">
            {/* Pulse ring while speaking */}
            {tts.isPlaying && (
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30 scale-125" />
            )}
            <button
              onClick={() => tts.toggle(questionText)}
              disabled={!tts.isSupported}
              aria-label={tts.isPlaying ? t('audio.pause') : t('audio.play')}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                !tts.isSupported
                  ? 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  : tts.isPlaying
                    ? 'bg-green-500 text-white shadow-lg border-4 border-green-600'
                    : 'bg-green-50 border-4 border-green-400 text-green-700 hover:bg-green-100'
              }`}
            >
              {!tts.isSupported
                ? <VolumeX size={32} />
                : tts.isPlaying
                  ? <Pause size={32} fill="currentColor" />
                  : <Volume2 size={36} />}
            </button>
          </div>
          <span className="text-sm font-medium text-green-800 mt-3">
            {!tts.isSupported
                ? t('audio.notAvailable')
                : tts.isPlaying
                  ? t('audio.pause')
                  : t('audio.play')}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="mt-6 px-6 text-2xl font-semibold text-green-900 text-center leading-relaxed">
          {questionText}
        </h2>

        {/* Answer Options */}
        <div className="mt-8 px-4 space-y-3 flex-1 flex flex-col justify-end">
          {options.map((optText, i) => {
            const isSelected = selectedOption === i || answers[qIndex] === i
            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(qIndex, i)}
                className={`w-full min-h-[64px] rounded-xl border-2 text-lg font-medium px-4 text-left transition-colors flex items-center ${
                  isSelected
                    ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-800 active:bg-gray-50'
                }`}
              >
                {optText}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Step 11: Free speech / dictation ─────────────────────────────────────
  const renderFreeSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const isMicSupported = !!SpeechRecognition

    const startDictation = () => {
      if (!isMicSupported) return
      const recognition = new SpeechRecognition()
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'hi-IN'
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript
        setTranscript(prev => prev ? prev + ' ' + text : text)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognition.start()
    }

    const handleNext = () => setStep(12)

    return (
      <div className="flex flex-col flex-1 p-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-green-900 mb-2">{t('screening.freeSpeech.title')}</h2>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl mb-6">
          <p className="text-green-800 font-medium text-lg leading-snug">
            {t('screening.freeSpeech.desc')}
          </p>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={t('screening.freeSpeech.placeholder')}
          className="flex-1 min-h-[200px] max-h-[300px] w-full border-2 border-gray-200 rounded-2xl p-4 text-lg focus:border-green-400 focus:outline-none resize-none"
        />

        <div className="mt-4 flex gap-3">
          {isMicSupported && (
            <button
              onClick={startDictation}
              className={`h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-colors ${
                isListening
                  ? 'bg-red-500 border-red-500 text-white animate-pulse'
                  : 'bg-white border-green-500 text-green-600'
              }`}
            >
              <Mic size={28} />
            </button>
          )}
          <button
            disabled={!transcript.trim()}
            onClick={handleNext}
            className="flex-1 h-16 bg-green-600 text-white rounded-2xl text-xl font-bold disabled:opacity-50"
          >
            {t('screening.btn.submit')}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 12: Processing spinner (effect handled at component level) ───────
  const renderProcessing = () => (
    <div className="flex flex-col flex-1 items-center justify-center p-6 bg-green-50 animate-fade-in-up">
      <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
        <Loader2 size={48} className="animate-spin text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-900">{t('screening.saving')}</h2>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      {step < 12 && (
        <div className="h-14 flex items-center px-2 border-b border-gray-100">
          <button
            onClick={handleBack}
            className="p-3 text-gray-500 hover:bg-gray-50 rounded-full"
          >
            <ChevronLeft size={28} />
          </button>
          <span className="font-semibold text-gray-700 ml-2">
            {step === 0
              ? t('demo.motherInfo')
              : step <= 10
                ? t('screening.question')
                : t('screening.freeSpeech.title')}
          </span>
        </div>
      )}

      {/* Dynamic Content */}
      {step === 0 && renderStep0()}
      {step >= 1 && step <= 10 && renderQuestionStep()}
      {step === 11 && renderFreeSpeech()}
      {step === 12 && renderProcessing()}
    </div>
  )
}
