import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mic, Loader2, Play, Pause, Volume2, VolumeX, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { post } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

export default function FreeSpeech() {
  const navigate = useNavigate()
  const { language, isOnline } = useAppStore()
  const { t } = useTranslation()
  const tts = useSpeechSynthesis(language)

  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const isMicSupported = !!SpeechRecognition

  const startDictation = () => {
    if (!isMicSupported) return
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN'
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

  const handleAnalyze = async () => {
    if (!transcript.trim()) return
    setIsAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      const res = await post('/screening/analyze', { 
        answers: Array(10).fill(0), // Dummy answers for pure NLP analysis
        transcript, 
        language 
      })
      setAnalysisResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClear = () => {
    setTranscript('')
    setAnalysisResult(null)
    tts.stop()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="h-14 bg-white flex items-center px-2 border-b border-gray-200 shadow-sm">
        <button
          onClick={() => { tts.stop(); navigate('/asha/home') }}
          className="p-3 text-gray-500 hover:bg-gray-50 rounded-full"
        >
          <ChevronLeft size={28} />
        </button>
        <span className="font-bold text-gray-800 text-lg ml-2">Voice Notes Practice</span>
      </div>

      <div className="flex-1 p-6 flex flex-col overflow-y-auto">
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-6 shadow-sm">
          <p className="text-blue-800 font-medium text-sm leading-relaxed">
            Use this tool to practice dictation. Speak in your selected language, and the AI will analyze your words for clinical risk markers.
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Tap the microphone to start speaking, or type here..."
              className="w-full min-h-[200px] border-2 border-gray-200 rounded-2xl p-4 text-lg focus:border-blue-400 focus:outline-none resize-none shadow-sm"
            />
            {transcript && (
              <button 
                onClick={handleClear}
                className="absolute top-3 right-3 p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            {isMicSupported ? (
              <button
                onClick={startDictation}
                className={`flex-1 h-16 rounded-2xl flex items-center justify-center border-2 font-bold text-lg shadow-sm transition-all ${
                  isListening
                    ? 'bg-red-50 border-red-500 text-red-600 animate-pulse'
                    : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Mic size={24} className="mr-2" />
                {isListening ? 'Listening...' : 'Dictate'}
              </button>
            ) : (
              <div className="flex-1 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border-2 border-gray-200">
                Microphone Not Supported
              </div>
            )}
            
            <button
              disabled={!transcript.trim() || isAnalyzing || !isOnline}
              onClick={handleAnalyze}
              className="flex-1 h-16 bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-md disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center"
            >
              {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : 'Analyze Text'}
            </button>
          </div>
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <div className="mt-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
              <h3 className="font-bold text-gray-800">NLP Analysis Result</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                analysisResult.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                analysisResult.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {analysisResult.risk_level} RISK
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Divergence</p>
                <p className="font-semibold text-gray-800">{analysisResult.divergence_flag}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Matched Phrases</p>
                <p className="font-semibold text-gray-800">{analysisResult.matched_phrases?.length || 0} found</p>
              </div>
            </div>

            {analysisResult.asha_script && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl relative">
                <button
                  onClick={() => tts.toggle(analysisResult.asha_script.message)}
                  disabled={!tts.isSupported}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full text-blue-600 shadow-sm border border-blue-100"
                >
                  {tts.isPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
                </button>
                <p className="text-xs font-bold text-blue-800 mb-2">Suggested ASHA Script:</p>
                <p className="text-sm text-blue-900 pr-8">{analysisResult.asha_script.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
