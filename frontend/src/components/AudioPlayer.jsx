import { Volume2, Pause, Loader2, VolumeX } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useTranslation } from '@/hooks/useTranslation'

export default function AudioPlayer({ language, questionNumber, autoPlay = false }) {
  const { isPlaying, isLoading, error, togglePlay } = useAudio(language, questionNumber)
  const { t } = useTranslation()

  // Determine styles and labels based on state
  let ringClass = "border-green-400 bg-green-50 text-green-600"
  let label = t('audio.play')
  let Icon = Volume2

  if (error) {
    ringClass = "border-red-300 bg-red-50 text-red-400"
    label = t('audio.error')
    Icon = VolumeX
  } else if (isLoading) {
    ringClass = "border-gray-300 bg-gray-50 text-gray-400"
    label = t('audio.loading')
    Icon = Loader2
  } else if (isPlaying) {
    ringClass = "border-green-600 bg-green-500 text-white shadow-lg"
    label = t('audio.pause')
    Icon = Pause
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Pulse ring animation behind the button when playing */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30 scale-125"></div>
        )}
        
        <button 
          onClick={togglePlay}
          disabled={error}
          className={`relative z-10 w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 ${ringClass}`}
          aria-label={label}
        >
          <Icon size={36} className={isLoading ? "animate-spin" : ""} fill={isPlaying ? "currentColor" : "none"} />
        </button>
      </div>
      <span className={`text-sm font-medium mt-3 ${error ? 'text-red-500' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}
