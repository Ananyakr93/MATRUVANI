import { useState, useEffect } from 'react'

const DRAFT_KEY = 'matruvani-screening-draft'

export function useScreening() {
  const [state, setState] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        return JSON.parse(draft)
      }
    } catch (e) {
      console.error("Failed to load draft", e)
    }
    return {
      step: 0,
      answers: Array(10).fill(null),
      transcript: "",
      motherData: {
        isPregnant: true,
        daysPostpartum: "",
        gestationalWeek: 20,
        villageCode: ""
      },
      isProcessing: false
    }
  })

  // Auto-save on state change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  }, [state])

  const setStep = (step) => setState(s => ({ ...s, step }))
  
  const setAnswer = (questionIndex, answerValue) => {
    setState(s => {
      const newAnswers = [...s.answers]
      newAnswers[questionIndex] = answerValue
      return { ...s, answers: newAnswers }
    })
  }

  const setTranscript = (transcript) => setState(s => ({ ...s, transcript }))
  
  const setMotherData = (updates) => setState(s => ({ 
    ...s, 
    motherData: { ...s.motherData, ...updates }
  }))

  const setIsProcessing = (isProcessing) => setState(s => ({ ...s, isProcessing }))

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setState({
      step: 0,
      answers: Array(10).fill(null),
      transcript: "",
      motherData: {
        isPregnant: true,
        daysPostpartum: "",
        gestationalWeek: 20,
        villageCode: ""
      },
      isProcessing: false
    })
  }

  return {
    ...state,
    setStep,
    setAnswer,
    setTranscript,
    setMotherData,
    setIsProcessing,
    clearDraft
  }
}
