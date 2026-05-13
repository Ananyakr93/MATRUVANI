import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Loader2, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { get } from '@/lib/api'
import RiskBadge from '@/components/RiskBadge'

import { useTranslation } from '@/hooks/useTranslation'

// ── Risk color map ───────────────────────────────────────────────────────
const RISK_COLORS = {
  LOW:      { border: 'border-l-green-500',  bg: 'bg-green-500',  text: 'text-green-700' },
  MODERATE: { border: 'border-l-amber-500',  bg: 'bg-amber-500',  text: 'text-amber-700' },
  HIGH:     { border: 'border-l-red-500',    bg: 'bg-red-500',    text: 'text-red-700' },
}

// ── Relative timestamp helper ────────────────────────────────────────────
function relativeTime(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'अभी'
  if (mins < 60) return `${mins} मिनट पहले`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} घंटे पहले`
  const days = Math.floor(hrs / 24)
  return `${days} दिन पहले`
}

// ── Format date ─────────────────────────────────────────────────
function formatDate(dateStr, language) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { 
    day: 'numeric', month: 'long', year: 'numeric' 
  }).format(d)
}

// ── Cache helpers ────────────────────────────────────────────────────────
function getCacheKey(ashaId) {
  return `matruvani-history-${ashaId}`
}

function readCache(ashaId) {
  try {
    const raw = localStorage.getItem(getCacheKey(ashaId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCache(ashaId, data) {
  try {
    localStorage.setItem(getCacheKey(ashaId), JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn('Cache write failed', e)
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════
export default function SessionHistory() {
  const navigate = useNavigate()
  const { ashaId, isOnline, language } = useAppStore()
  const { t } = useTranslation()

  // ── State ──────────────────────────────────────────────────────────────
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear())
  const [sessions, setSessions]           = useState([])
  const [isLoading, setIsLoading]         = useState(true)
  const [cacheTimestamp, setCacheTimestamp] = useState(null)
  const [expandedId, setExpandedId]       = useState(null)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // ── Fetch / Cache logic ────────────────────────────────────────────────
  const fetchHistory = useCallback(async (showLoader = true) => {
    if (!ashaId) return

    // 1. Show cached data immediately
    const cached = readCache(ashaId)
    if (cached) {
      setSessions(cached.data)
      setCacheTimestamp(cached.timestamp)
      setIsLoading(false)
    }

    // 2. Refresh from API in background
    if (isOnline) {
      if (showLoader && !cached) setIsLoading(true)
      try {
        const freshData = await get(`/screening/history/${ashaId}`)
        setSessions(freshData)
        writeCache(ashaId, freshData)
        setCacheTimestamp(Date.now())
      } catch (err) {
        console.error('Failed to fetch history', err)
        // If we have no cached data either, show empty
        if (!cached) setSessions([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [ashaId, isOnline])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // ── Filter by selected month (client-side) ─────────────────────────────
  const filtered = useMemo(() => {
    return sessions
      .filter(s => {
        const d = new Date(s.session_date)
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
      })
      .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
  }, [sessions, selectedMonth, selectedYear])

  // ── Monthly risk counts ────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { LOW: 0, MODERATE: 0, HIGH: 0 }
    filtered.forEach(s => {
      if (c[s.risk_level] !== undefined) c[s.risk_level]++
    })
    return c
  }, [filtered])

  const totalFiltered = filtered.length

  // ── Month navigation ──────────────────────────────────────────────────
  const goMonth = (delta) => {
    let m = selectedMonth + delta
    let y = selectedYear
    if (m < 0)  { m = 11; y-- }
    if (m > 11) { m = 0;  y++ }
    setSelectedMonth(m)
    setSelectedYear(y)
    setExpandedId(null)
  }

  // Build month-year options for picker (last 12 months)
  const monthOptions = useMemo(() => {
    const opts = []
    const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { month: 'long' })
    for (let i = 0; i < 12; i++) {
      let m = now.getMonth() - i
      let y = now.getFullYear()
      if (m < 0) { m += 12; y-- }
      const tempDate = new Date(y, m, 1)
      opts.push({ month: m, year: y, label: `${formatter.format(tempDate)} ${y}` })
    }
    return opts
  }, [language])

  // ── Toggle accordion ──────────────────────────────────────────────────
  const toggle = (id) => setExpandedId(prev => prev === id ? null : id)

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 shadow-sm">
        <button onClick={() => navigate('/asha/home')} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{t('history.title')}</h1>

        {/* Month selector */}
        <div className="relative">
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
          >
            {new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { month: 'short' }).format(new Date(selectedYear, selectedMonth, 1))} {selectedYear}
            <ChevronDown size={14} />
          </button>

          {showMonthPicker && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 max-h-64 overflow-y-auto">
              {monthOptions.map((opt) => (
                <button
                  key={`${opt.month}-${opt.year}`}
                  onClick={() => {
                    setSelectedMonth(opt.month)
                    setSelectedYear(opt.year)
                    setShowMonthPicker(false)
                    setExpandedId(null)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-green-50 transition-colors
                    ${opt.month === selectedMonth && opt.year === selectedYear 
                      ? 'bg-green-50 text-green-700 font-bold' 
                      : 'text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for month picker */}
      {showMonthPicker && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMonthPicker(false)} />
      )}

      <div className="flex-1 p-4 flex flex-col gap-4">

        {/* ── Monthly Summary Strip ─────────────────────────────────── */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800 text-sm">
              {new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { month: 'long' }).format(new Date(selectedYear, selectedMonth, 1))} {selectedYear}: {totalFiltered} {t('asha.home.stats.screenings')}
            </p>
            {cacheTimestamp && (
              <button 
                onClick={() => fetchHistory(false)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={12} />
                <span>अंतिम अपडेट: {relativeTime(cacheTimestamp)}</span>
              </button>
            )}
          </div>

          {/* Proportional risk bar */}
          {totalFiltered > 0 ? (
            <>
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-200">
                {counts.LOW > 0 && (
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(counts.LOW / totalFiltered) * 100}%` }}
                  />
                )}
                {counts.MODERATE > 0 && (
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${(counts.MODERATE / totalFiltered) * 100}%` }}
                  />
                )}
                {counts.HIGH > 0 && (
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${(counts.HIGH / totalFiltered) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2.5 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-green-700">{counts.LOW} {t('result.risk.low')}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="text-amber-700">{counts.MODERATE} {t('result.risk.moderate')}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span className="text-red-700">{counts.HIGH} {t('result.risk.high')}</span>
                </span>
              </div>
            </>
          ) : !isLoading ? (
            <div className="h-3 rounded-full bg-gray-200" />
          ) : null}
        </div>

        {/* ── Session List ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 size={32} className="text-green-500 animate-spin" />
            <p className="text-gray-500 font-medium text-sm">जाँच लोड हो रही हैं...</p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Plus size={36} className="text-green-500" />
            </div>
            <p className="text-gray-500 font-bold text-lg">{t('history.noResults')}</p>
            <p className="text-gray-400 text-sm text-center px-8">
              {new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { month: 'long' }).format(new Date(selectedYear, selectedMonth, 1))} {selectedYear} - {t('history.noResults')}
            </p>
            <button
              onClick={() => navigate('/asha/screen')}
              className="mt-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-base shadow-md hover:bg-green-700 active:scale-95 transition-all"
            >
              {t('asha.home.btn.newScreening')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((session, idx) => {
              const isExpanded = expandedId === session.id
              const riskStyle = RISK_COLORS[session.risk_level] || RISK_COLORS.LOW

              // Next visit date (2 weeks for HIGH/MODERATE, 4 weeks for LOW)
              const sessionDate = new Date(session.session_date)
              const nextVisit = new Date(sessionDate)
              nextVisit.setDate(nextVisit.getDate() + (session.risk_level === 'LOW' ? 28 : 14))

              return (
                <div
                  key={session.id || idx}
                  className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden transition-all duration-300 ${riskStyle.border}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Collapsed row */}
                  <button
                    onClick={() => toggle(session.id)}
                    className="w-full flex items-center p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Date */}
                    <div className="min-w-[70px]">
                      <p className="text-sm font-bold text-gray-800">{formatDate(session.session_date, language)}</p>
                    </div>

                    {/* Center: village + badge + score */}
                    <div className="flex-1 flex items-center gap-2 ml-3">
                      {session.village_code && (
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {session.village_code}
                        </span>
                      )}
                      <RiskBadge level={session.risk_level} />
                      <span className="text-xs text-gray-600 font-semibold ml-auto mr-1">
                        EPDS {session.epds_score}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronRight
                      size={18}
                      className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded details (accordion) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 animate-fade-in-up">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">{t('result.score')}</p>
                          <p className="text-sm font-bold text-gray-800">{session.epds_score}/30</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">{t('result.riskLevel')}</p>
                          <p className={`text-sm font-bold ${riskStyle.text}`}>{session.risk_level}</p>
                        </div>
                        {session.divergence_flag && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-0.5">Divergence</p>
                            <p className="text-sm font-semibold text-gray-700">{session.divergence_flag}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Next Visit</p>
                          <p className="text-sm font-semibold text-blue-700">{formatDate(nextVisit.toISOString(), language)}</p>
                        </div>
                      </div>

                      {session.asha_script && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-bold mb-1">ASHA स्क्रिप्ट:</p>
                          <p className="text-sm text-green-800 leading-relaxed">{session.asha_script}</p>
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 font-mono mt-3">
                        Session ID: {String(session.id).substring(0, 8)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
