import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mic, MicOff, Volume2, Pause, Send, Edit3, RotateCcw, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useScreening } from '@/hooks/useScreening'
import { useTranslation } from '@/hooks/useTranslation'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { post } from '@/lib/api'
import { calculate_epds_score } from '@/lib/epds'

const LANG_MAP = {
  hi: 'hi-IN', kn: 'kn-IN', en: 'en-IN',
  ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN',
  bn: 'bn-IN', gu: 'gu-IN', or: 'or-IN',
}

const MAX_RECORDING_SECONDS = 90

export default function FreeSpeech() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { t } = useTranslation()
  const tts = useSpeechSynthesis(language)
  const screening = useScreening()
  const { motherData, answers, transcript, setTranscript, clearDraft } = screening

  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const isMicSupported = !!SpeechRecognition

  const promptText = t('screening.freeSpeech.desc')

  // Auto-play prompt on mount
  useEffect(() => {
    const timeout = setTimeout(() => tts.speak(promptText), 600)
    return () => {
      clearTimeout(timeout)
      tts.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    clearInterval(timerRef.current)
    setIsListening(false)
    setInterimText('')
    setHasRecorded(true)
  }, [])

  const startRecording = useCallback(() => {
    if (!isMicSupported) return
    tts.stop()

    const recognition = new SpeechRecognition()
    recognition.lang = LANG_MAP[language] || 'hi-IN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setSecondsLeft(MAX_RECORDING_SECONDS)
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += text + ' '
        } else {
          interim += text
        }
      }
      if (final) setTranscript(prev => (prev ? prev + ' ' + final.trim() : final.trim()))
      setInterimText(interim)
    }

    recognition.onerror = (e) => {
      console.warn('SpeechRecognition error', e.error)
      stopRecording()
    }

    recognition.onend = () => {
      stopRecording()
    }

    recognitionRef.current = recognition
    recognition.start()

    // Auto-stop after MAX_RECORDING_SECONDS
    let secs = MAX_RECORDING_SECONDS
    timerRef.current = setInterval(() => {
      secs -= 1
      setSecondsLeft(secs)
      if (secs <= 0) stopRecording()
    }, 1000)
  }, [isMicSupported, language, tts, setTranscript, stopRecording, SpeechRecognition])

  const handleToggleMic = () => {
    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleClear = () => {
    setTranscript('')
    setHasRecorded(false)
    setInterimText('')
  }

  const handleNext = async () => {
    tts.stop()
    setIsAnalyzing(true)
    try {
      const res = await post('/screening/analyze', { answers: answers || Array(10).fill(0), transcript, language })
      navigate('/asha/result', { state: { result: res, transcript, motherData, answers } })
    } catch (e) {
      // Offline fallback
      const local = calculate_epds_score(answers || [])
      navigate('/asha/result', {
        state: {
          result: { ...local, divergence_flag: 'GREEN', ams_score: 0, asha_script: null, matched_phrases: [], isOffline: true },
          transcript, motherData, answers
        }
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSkip = () => {
    tts.stop()
    navigate('/asha/result', {
      state: { result: null, transcript: '', motherData, answers }
    })
  }

  const displayTranscript = transcript + (interimText ? ' ' + interimText : '')

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="h-14 flex items-center px-2 border-b border-gray-100">
        <button
          onClick={() => { tts.stop(); navigate(-1) }}
          className="p-3 text-gray-500 hover:bg-gray-50 rounded-full"
        >
          <ChevronLeft size={28} />
        </button>
        <span className="font-semibold text-gray-700 ml-2">
          {t('screening.freeSpeech.title')}
        </span>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">

        {/* Prompt card with TTS button */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-2xl flex gap-3 items-start">
          <button
            onClick={() => tts.toggle(promptText)}
            disabled={!tts.isSupported}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              tts.isPlaying
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white border-2 border-green-400 text-green-600'
            }`}
          >
            {tts.isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
          </button>
          <p className="text-green-900 font-medium text-base leading-relaxed pt-1">
            {promptText}
          </p>
        </div>

        {/* Mic button */}
        {isMicSupported ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40 scale-125" />
              )}
              <button
                onClick={handleToggleMic}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 text-white border-4 border-red-600'
                    : 'bg-green-50 text-green-700 border-4 border-green-400 hover:bg-green-100'
                }`}
              >
                {isListening ? <MicOff size={36} /> : <Mic size={36} />}
              </button>
            </div>

            {isListening ? (
              <div className="flex flex-col items-center gap-1">
                <p className="text-red-600 font-semibold text-base animate-pulse">
                  Recording... {secondsLeft}s left
                </p>
                <p className="text-gray-500 text-xs">Tap to stop</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm font-medium">
                {hasRecorded ? 'Tap to record again' : 'Tap to start recording'}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <MicOff size={28} className="mx-auto text-amber-500 mb-2" />
            <p className="text-amber-800 font-medium text-sm">
              Microphone not supported on this device.
            </p>
            <p className="text-amber-600 text-xs mt-1">Type the mother's words below.</p>
          </div>
        )}

        {/* Live / Final transcript */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">
              Transcript {isListening && <span className="text-red-500 ml-1">● Live</span>}
            </label>
            <div className="flex gap-2">
              {transcript && (
                <button
                  onClick={handleClear}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              {transcript && !isListening && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full min-h-[140px] border-2 border-green-300 rounded-2xl p-4 text-base focus:border-green-500 focus:outline-none resize-none"
              placeholder={t('screening.freeSpeech.placeholder')}
              autoFocus
            />
          ) : (
            <div className={`min-h-[140px] rounded-2xl p-4 text-base border-2 ${
              displayTranscript
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}>
              {displayTranscript || t('screening.freeSpeech.placeholder')}
              {isListening && interimText && (
                <span className="text-gray-400 italic"> {interimText}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-6 pt-3 flex gap-3 border-t border-gray-100">
        <button
          onClick={handleSkip}
          className="flex-shrink-0 h-14 px-5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-base"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={(!transcript.trim() && !hasRecorded) || isAnalyzing}
          className="flex-1 h-14 bg-green-600 text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform shadow-md"
        >
          {isAnalyzing ? <Loader2 size={22} className="animate-spin" /> : <Send size={20} />}
          {isAnalyzing ? 'Analyzing...' : t('screening.btn.submit')}
        </button>
      </div>
    </div>
  )
}
