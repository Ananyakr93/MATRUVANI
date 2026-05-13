import { useState, useEffect, useRef } from 'react'

export function useAudio(language, questionNumber) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const src = `/audio/${language}/q${questionNumber}.mp3`

  // Preload next audio
  useEffect(() => {
    if (questionNumber < 10) {
      const nextAudio = new Audio(`/audio/${language}/q${questionNumber + 1}.mp3`)
      nextAudio.preload = 'auto'
    }
  }, [language, questionNumber])

  useEffect(() => {
    setIsPlaying(false)
    setIsLoading(true)
    setError(false)

    if (!src) return

    const audio = new Audio(src)
    audioRef.current = audio

    const handleCanPlayThrough = () => setIsLoading(false)
    const handlePlaying = () => { setIsPlaying(true); setIsLoading(false) }
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      setError(true)
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('canplaythrough', handleCanPlayThrough)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Check if network is offline and audio is unlikely to be cached
    // We try to load anyway, as it might be in cache from service worker
    audio.load()

    return () => {
      audio.pause()
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audioRef.current = null
    }
  }, [src])

  const togglePlay = () => {
    if (!audioRef.current || error) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      setIsLoading(true)
      audioRef.current.play().catch((e) => {
        console.error("Audio playback failed", e)
        setError(true)
        setIsLoading(false)
        setIsPlaying(false)
      })
    }
  }

  return { isPlaying, isLoading, error, togglePlay }
}
