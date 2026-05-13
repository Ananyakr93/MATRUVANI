import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from '@/hooks/useTranslation'

export default function OfflineBanner() {
  const { isOnline, setOnline } = useAppStore()
  const [showOnlineBanner, setShowOnlineBanner] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      setShowOnlineBanner(true)
      setTimeout(() => setShowOnlineBanner(false), 3000)
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  if (!isOnline) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-400 text-amber-900 px-4 py-2 text-center text-sm font-medium shadow-lg animate-fade-in-up">
        {t('offline.offline')}
      </div>
    )
  }

  if (showOnlineBanner) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg animate-fade-in-up">
        {t('offline.online')}
      </div>
    )
  }

  return null
}
