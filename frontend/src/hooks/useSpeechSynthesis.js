/**
 * useSpeechSynthesis
 *
 * Wraps the browser's native window.speechSynthesis API.
 * Provides speak / stop / toggle and reactive isPlaying / isSupported state.
 *
 * Language codes are mapped to BCP-47 locale tags so the browser selects the
 * best available voice for each Indian language automatically.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

// MATRUVANI language code → BCP-47 locale for SpeechSynthesisUtterance.lang
const LANG_MAP = {
  hi: 'hi-IN',
  kn: 'kn-IN',
  en: 'en-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
}

export function useSpeechSynthesis(language = 'hi') {
  const [isPlaying, setIsPlaying] = useState(false)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const currentTextRef = useRef('')

  // Cancel any ongoing speech when the hook unmounts (e.g. navigating away)
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel()
    }
  }, [isSupported])

  const speak = useCallback(
    (text) => {
      if (!isSupported || !text) return

      // Cancel anything currently playing
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = LANG_MAP[language] || 'hi-IN'
      utterance.rate = 0.85  // Slightly slower for rural/low-literacy users
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      currentTextRef.current = text
      window.speechSynthesis.speak(utterance)
    },
    [language, isSupported]
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }, [isSupported])

  /**
   * toggle(text?)
   * - If currently playing  → stops speech.
   * - If not playing        → speaks `text` (or the last spoken text if omitted).
   */
  const toggle = useCallback(
    (text) => {
      if (isPlaying) {
        stop()
      } else {
        speak(text || currentTextRef.current)
      }
    },
    [isPlaying, speak, stop]
  )

  return { speak, stop, toggle, isPlaying, isSupported }
}
