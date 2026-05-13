import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, AlertTriangle, AlertOctagon, Download, LineChart as LineChartIcon, Activity, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { get } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from '@/hooks/useTranslation'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { district, phcName, state, clearSession } = useAppStore()
  const { t } = useTranslation()

  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [stats, setStats] = useState(null)
  
  const [referrals, setReferrals] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [followedUpIds, setFollowedUpIds] = useState(new Set())

  // Filters for Table
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [divFilter, setDivFilter] = useState('ALL')

  const fetchData = async () => {
    setIsLoading(true)
    const activeState = state || 'Karnataka'
    try {
      const [statsRes, referralsRes, sessionsRes] = await Promise.all([
        get(`/dashboard/stats?district=${district}&state=${activeState}`),
        get(`/screening/referrals?district=${district}&state=${activeState}`),
        get(`/screening/sessions?district=${district}&state=${activeState}`),
      ])
      setStats(statsRes)
      setReferrals(referralsRes)
      setAllSessions(sessionsRes)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [district])

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const toggleFollowUp = (id) => {
    setFollowedUpIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const downloadCSV = () => {
    if (!allSessions.length) return
    const dataToDownload = filteredSessions
    const csv = [Object.keys(dataToDownload[0]).join(','), ...dataToDownload.map(r => Object.values(r).join(','))].join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {href:url, download:'matruvani_export.csv'}).click()
  }

  const filteredSessions = allSessions.filter(s => {
    if (riskFilter !== 'ALL' && s.risk_level !== riskFilter) return false
    if (divFilter === 'FLAGGED' && s.divergence_flag === 'GREEN') return false
    return true
  })

  // Format Recharts Data
  const chartData = stats?.trend_last_30_days?.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Total: item.count,
    "High Risk": item.high_risk_count
  }))?.reverse() || []

  return (
    <div className="min-h-screen bg-gray-50 md:flex md:flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{phcName}</h1>
          <p className="text-sm text-gray-500 font-medium">District: {district} | Last updated: {lastUpdated.toLocaleTimeString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Refresh">
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
            <LogOut size={18} />
            <span className="hidden md:inline">{t('asha.login.btnLogout')}</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1">
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-14 bg-gray-200 rounded-xl mb-6">
            <TabsTrigger value="referrals" className="text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              {t('doctor.dashboard.tab.referrals')}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              {t('doctor.dashboard.tab.sessions')}
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              {t('doctor.dashboard.tab.trends')}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Referrals */}
          <TabsContent value="referrals" className="animate-fade-in-up">
            {referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-green-800">{t('doctor.dashboard.noReferrals')}</h2>
                <p className="text-gray-500 mt-2">{t('doctor.dashboard.noReferralsDesc')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {referrals.map(ref => (
                  <div key={String(ref.session_id)} className={`bg-white rounded-2xl border-l-4 shadow-sm p-5 transition-all ${ref.risk_level === 'HIGH' ? 'border-red-500' : 'border-amber-500'} ${followedUpIds.has(String(ref.session_id)) ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        {ref.risk_level === 'HIGH' ? <AlertOctagon size={24} className="text-red-600" /> : <AlertTriangle size={24} className="text-amber-500" />}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${ref.risk_level === 'HIGH' ? 'bg-red-600' : 'bg-amber-500'}`}>
                          {ref.risk_level}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">ID: {String(ref.session_id).slice(0, 8)}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Village: {ref.village_code}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">EPDS: {ref.epds_score}/30</span>
                      {ref.days_postpartum && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">{ref.days_postpartum} days PP</span>}
                      {ref.gestational_week && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">Week {ref.gestational_week}</span>}
                      {(ref.divergence_flag === 'YELLOW' || ref.divergence_flag === 'RED') && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded text-sm font-bold flex items-center gap-1">
                          ⚠️ Divergence
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 font-medium mb-5">
                      Sub-centre: {ref.sub_centre} • {ref.session_time || 'N/A'}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => toggleFollowUp(String(ref.session_id))}
                        className={`flex-1 h-12 rounded-xl font-bold transition-colors ${followedUpIds.has(String(ref.session_id)) ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {followedUpIds.has(String(ref.session_id)) ? '✅ Follow-up Started' : 'Start Follow-up'}
                      </button>
                      <button className="flex-1 h-12 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold">
                        📋 Full EPDS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: All Sessions */}
          <TabsContent value="all" className="animate-fade-in-up">
            <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 flex flex-wrap items-center gap-4">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Risks</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MODERATE">Moderate</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={divFilter} onValueChange={setDivFilter}>
                <SelectTrigger className="w-48 h-10"><SelectValue placeholder="Divergence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Analytics</SelectItem>
                  <SelectItem value="FLAGGED">Flagged (Yellow/Red)</SelectItem>
                </SelectContent>
              </Select>

              <button onClick={downloadCSV} className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium">
                <Download size={18} /> CSV
              </button>
            </div>

            <div className="bg-white rounded-b-2xl border border-gray-100 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Village Code</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>EPDS</TableHead>
                    <TableHead>Divergence</TableHead>
                    <TableHead>Sub-centre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((s, i) => (
                    <TableRow key={s.session_id || i}>
                      <TableCell className="font-medium text-gray-900">{s.session_date}</TableCell>
                      <TableCell className="font-mono text-gray-600">{s.village_code}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${s.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' : s.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                          {s.risk_level}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{s.epds_score}</TableCell>
                      <TableCell>
                        {s.divergence_flag !== 'GREEN' ? <span className="text-amber-600 font-bold text-sm">⚠️ {s.divergence_flag}</span> : <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className="text-gray-600">{s.sub_centre}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">No sessions match filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 3: Trends */}
          <TabsContent value="trends" className="animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Screened (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_screened || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats?.high_risk_count || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Detection Rate</p>
                <p className="text-2xl font-bold text-amber-600">{stats ? (stats.detection_rate * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">ASHA Coverage</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.asha_coverage || 0}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <LineChartIcon className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">30-Day Screening Volume</h3>
              </div>
              
              {chartData.length > 0 ? (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="Total" stroke="#16a34a" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="High Risk" stroke="#dc2626" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  <p>No trend data available for this district.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
