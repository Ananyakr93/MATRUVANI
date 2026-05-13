import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, UserCheck, AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { get } from '@/lib/api'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from '@/hooks/useTranslation'

export default function DistrictDashboard() {
  const navigate = useNavigate()
  const { state, district, clearSession } = useAppStore()
  const { t } = useTranslation()

  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [stats, setStats] = useState(null)
  const [heatmap, setHeatmap] = useState([])
  
  const [trendDays, setTrendDays] = useState(30)
  
  // Mock data for coverage table
  const [coverageData, setCoverageData] = useState([])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, heatmapRes] = await Promise.all([
        get(`/dashboard/stats?district=${district}&state=${state}`),
        get(`/dashboard/heatmap?state=${state}`)
      ])
      
      setStats(statsRes)
      setHeatmap(heatmapRes)
      
      // Mock ASHA Coverage Data
      setCoverageData([
        { sub_centre: "Hoskote Town", asha_count: 12, sessions: 145, high_risk: 22, coverage_rate: "85%" },
        { sub_centre: "Devanahalli", asha_count: 8, sessions: 90, high_risk: 10, coverage_rate: "92%" },
        { sub_centre: "Nelamangala", asha_count: 15, sessions: 110, high_risk: 18, coverage_rate: "70%" }
      ])
      
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [district, state])

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const downloadCSV = () => {
    if (!coverageData.length) return
    const csv = [Object.keys(coverageData[0]).join(','), ...coverageData.map(r => Object.values(r).join(','))].join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {href:url, download:'asha_coverage_export.csv'}).click()
  }

  // Calculate colors for stat cards
  const highRiskRate = stats ? (stats.high_risk_count / stats.total_screened) * 100 : 0
  const detectionRate = stats ? stats.detection_rate * 100 : 0
  
  let detectionColor = "text-green-600"
  if (detectionRate < 15) detectionColor = "text-red-600"
  else if (detectionRate <= 35) detectionColor = "text-amber-500"

  // Prepare Bar Chart Data (grouped by district from heatmap)
  const districtRiskMap = {}
  heatmap.forEach(h => {
    if (!districtRiskMap[h.district]) {
      districtRiskMap[h.district] = { total: 0, high: 0 }
    }
    districtRiskMap[h.district].total += h.total_sessions
    districtRiskMap[h.district].high += (h.risk_rate * h.total_sessions)
  })
  const barChartData = Object.keys(districtRiskMap).map(d => ({
    name: d,
    rate: districtRiskMap[d].total > 0 ? (districtRiskMap[d].high / districtRiskMap[d].total) * 100 : 0
  })).sort((a,b) => b.rate - a.rate)

  const getBarColor = (rate) => {
    if (rate > 30) return "#dc2626" // red
    if (rate >= 15) return "#f59e0b" // amber
    return "#16a34a" // green
  }

  // Trend Data filtering
  const trendData = stats?.trend_last_30_days?.slice(0, trendDays)?.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Total: item.count,
    "High Risk": item.high_risk_count
  })).reverse() || []

  // Dark Villages logic - using heatmap data mapped to current district for demo
  const darkVillages = heatmap.filter(h => h.district === district && h.risk_rate > 0.4 && h.total_sessions > 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-10 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('district.login.title')}: {district}</h1>
          <p className="text-sm text-gray-500 font-medium">State: {state} | Last updated: {lastUpdated.toLocaleTimeString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="p-2 text-purple-600 hover:bg-purple-50 rounded-full">
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
            <LogOut size={18} />
            <span className="hidden md:inline">{t('asha.login.btnLogout')}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full animate-fade-in-up">
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 font-bold">{t('district.dashboard.screenings')}</span>
              <Users className="text-purple-600" size={20} />
            </div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <span className="text-3xl font-bold text-gray-900">{stats?.total_screened || 0}</span>}
          </div>
          
          <div className={`bg-white rounded-2xl shadow-sm p-5 border flex flex-col ${highRiskRate > 20 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 font-bold">{t('district.dashboard.highRisk')}</span>
              <AlertTriangle className={highRiskRate > 20 ? "text-red-500" : "text-amber-500"} size={20} />
            </div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{stats?.high_risk_count || 0}</span>
                <span className={`text-sm font-bold ${highRiskRate > 20 ? 'text-red-600' : 'text-gray-500'}`}>({highRiskRate.toFixed(1)}%)</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 font-bold">{t('district.dashboard.detection')}</span>
            </div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <span className={`text-3xl font-bold ${detectionColor}`}>{detectionRate.toFixed(1)}%</span>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 font-bold">{t('district.dashboard.coverage')}</span>
              <UserCheck className="text-blue-600" size={20} />
            </div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <span className="text-3xl font-bold text-gray-900">{stats?.asha_coverage || 0}</span>}
          </div>
        </div>

        {/* DARK VILLAGES ALERT */}
        {!isLoading && darkVillages.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2 mb-2">
              <AlertTriangle size={24} /> 
              ⚠️ {darkVillages.length} {t('district.dashboard.darkVillages')}
            </h2>
            <p className="text-amber-700 font-medium mb-4">{t('district.dashboard.darkVillagesDesc')}</p>
            
            <div className="grid md:grid-cols-2 gap-3">
              {darkVillages.map(dv => (
                <div key={dv.village_code} className="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">VIL: {dv.village_code}</p>
                    <p className="text-sm text-gray-600 font-medium">Risk: {(dv.risk_rate * 100).toFixed(1)}% | Sessions: {dv.total_sessions}</p>
                  </div>
                  <button onClick={() => console.log(`Allocating counselor for ${dv.village_code}`)} className="px-4 py-2 bg-amber-100 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition-colors text-sm">
                    {t('district.dashboard.allocate')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* DISTRICT RISK BAR CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('district.dashboard.chartTitle')}</h3>
            <div className="h-[300px]">
              {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(val) => `${val.toFixed(1)}% High Risk`} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* TREND CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t('district.dashboard.trends')}</h3>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setTrendDays(30)} className={`px-3 py-1 text-xs font-bold rounded-md ${trendDays===30?'bg-white shadow text-gray-900':'text-gray-500'}`}>30d</button>
                <button onClick={() => setTrendDays(60)} className={`px-3 py-1 text-xs font-bold rounded-md ${trendDays===60?'bg-white shadow text-gray-900':'text-gray-500'}`}>60d</button>
                <button onClick={() => setTrendDays(90)} className={`px-3 py-1 text-xs font-bold rounded-md ${trendDays===90?'bg-white shadow text-gray-900':'text-gray-500'}`}>90d</button>
              </div>
            </div>
            <div className="h-[300px] flex-1">
              {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="Total" stroke="#16a34a" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="High Risk" stroke="#dc2626" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ASHA COVERAGE TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">{t('district.dashboard.coverage')} (Sub-centres)</h3>
            <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 font-bold text-sm">
              <Download size={16} /> CSV
            </button>
          </div>
          <Table>
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead className="font-bold text-gray-900">Sub-centre</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">ASHA Count</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">Sessions (Month)</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">High Risk Found</TableHead>
                <TableHead className="font-bold text-gray-900 text-right">Coverage Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                coverageData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold text-gray-700">{row.sub_centre}</TableCell>
                    <TableCell className="text-center font-medium">{row.asha_count}</TableCell>
                    <TableCell className="text-center font-medium">{row.sessions}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">{row.high_risk}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">{row.coverage_rate}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* FOOTER */}
      <div className="bg-gray-100 py-4 px-6 text-center border-t border-gray-200 mt-auto">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
          {t('welcome.footer')}
        </p>
        <p className="text-xs text-gray-400 font-medium">
          Last updated: {lastUpdated.toLocaleString('en-IN')} • MATRUVANI v1.0.0
        </p>
      </div>

    </div>
  )
}
