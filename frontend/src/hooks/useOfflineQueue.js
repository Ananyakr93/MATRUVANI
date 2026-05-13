import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { processQueue, getQueue } from '@/lib/offline-queue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'

export function useOfflineQueue() {
  const { setOnline } = useAppStore()
  const [queueCount, setQueueCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const updateCount = async () => {
    try {
      const items = await getQueue()
      setQueueCount(items.length)
      // We could also update the zustand store count if needed
    } catch (e) {
      console.error("Failed to count offline queue", e)
    }
  }

  const processNow = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await processQueue(API_BASE)
    } catch (e) {
      console.error("Failed processing queue", e)
    } finally {
      setIsProcessing(false)
      updateCount()
    }
  }, [isProcessing])

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      processNow()
    }

    const handleOffline = () => {
      setOnline(false)
      updateCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    updateCount()
    if (navigator.onLine) {
      processNow()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [processNow, setOnline])

  return { queueCount, isProcessing, processNow }
}
