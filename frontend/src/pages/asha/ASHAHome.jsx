import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, History, Activity } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { get } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'

export default function ASHAHome() {
  const navigate = useNavigate()
  const { ashaId, sub_centre, isOnline, language } = useAppStore()
  const { t } = useTranslation()
  
  const [stats, setStats] = useState({ total: 0, highRisk: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      if (!isOnline) {
        setIsLoading(false)
        return
      }
      try {
        const history = await get(`/api/v1/screening/history/${ashaId}`)
        
        // Calculate this month's stats
        const currentMonth = new Date().getMonth()
        let thisMonthTotal = 0
        let thisMonthHighRisk = 0
        
        history.forEach(session => {
          const sessionMonth = new Date(session.session_date).getMonth()
          if (sessionMonth === currentMonth) {
            thisMonthTotal++
            if (session.risk_level === 'HIGH') {
              thisMonthHighRisk++
            }
          }
        })
        
        setStats({ total: thisMonthTotal, highRisk: thisMonthHighRisk })
      } catch (err) {
        console.error("Failed to load history stats", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (ashaId) {
      fetchHistory()
    }
  }, [ashaId, isOnline])

  // Format date: e.g., "13 May 2026, बुधवार"
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  // use the current language for the date day
  const dayNameHi = new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { weekday: 'long' }).format(today)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      
      {/* Top Header Section */}
      <div className="bg-green-700 text-white p-6 rounded-b-3xl shadow-md relative">
        {/* Offline/Online Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-300' : 'bg-amber-400'}`}></span>
          <span>{isOnline ? t('asha.home.online') : t('asha.home.offline')}</span>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-1">{t('asha.home.greeting')}</h1>
          <p className="text-green-100 text-lg font-medium">{sub_centre}</p>
          <div className="mt-4 inline-block bg-green-800/50 rounded-lg px-3 py-1.5 text-sm font-medium">
            {dateStr} • {dayNameHi}
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex-1 p-6 flex flex-col gap-6 mt-4">
        
        {/* Primary CTA */}
        <button 
          onClick={() => navigate('/asha/screen')}
          className="w-full h-24 bg-green-600 text-white rounded-2xl flex items-center px-6 shadow-lg active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-left flex-1 tracking-wide">{t('asha.home.btn.newScreening')}</span>
        </button>

        {/* Secondary Action */}
        <button 
          onClick={() => navigate('/asha/history')}
          className="w-full h-16 bg-white text-green-700 border-2 border-green-200 rounded-xl flex items-center justify-center gap-3 font-semibold text-lg shadow-sm active:bg-green-50 transition-colors"
        >
          <History size={22} />
          <span>{t('asha.home.btn.history')}</span>
        </button>

      </div>

      {/* Stats Strip */}
      <div className="p-6 mt-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-700 font-medium">
            <Activity className="text-green-600" size={20} />
            <span>{t('asha.home.stats.title')}</span>
          </div>
          
          {isLoading ? (
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{stats.total} {t('asha.home.stats.screenings')}</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">{stats.highRisk} {t('asha.home.stats.highRisk')}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
