import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from '@/hooks/useTranslation'
import { KARNATAKA_DISTRICTS, getDistrictLabel } from '@/lib/districts'

const PHC_LIST = {
  "Bengaluru Rural": ["Hoskote Town PHC", "Devanahalli PHC", "Nelamangala PHC", "Doddaballapura PHC"],
  "Bengaluru Urban": ["Yelahanka PHC", "Kengeri PHC", "KR Puram PHC"],
  "Mysuru": ["Nanjangud PHC", "Hunsur PHC", "T Narsipur PHC"]
}

export default function DoctorLogin() {
  const navigate = useNavigate()
  const { setDoctor } = useAppStore()
  const { t, language } = useTranslation()
  
  const [district, setDistrict] = useState('')
  const [phcName, setPhcName] = useState('')

  const availablePHCs = district ? (PHC_LIST[district] || ["Central PHC", "North PHC", "South PHC"]) : []

  const handleLogin = () => {
    if (!district || !phcName) return
    setDoctor({ district, phcName, stateName: "Karnataka" })
    navigate('/doctor/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 ml-2">{t('doctor.login.title')}</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
          <p className="text-gray-600 text-sm mb-2">{t('doctor.login.desc')}</p>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">{t('asha.login.districtLabel')}</label>
            <Select value={district} onValueChange={(v) => { setDistrict(v); setPhcName('') }}>
              <SelectTrigger className="w-full h-14 rounded-xl border-2 border-gray-200 text-lg">
                <SelectValue placeholder={t('asha.login.districtPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {KARNATAKA_DISTRICTS.map(d => (
                  <SelectItem key={d} value={d} className="text-lg">{getDistrictLabel(d, language)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">{t('doctor.login.phcLabel')}</label>
            <Select value={phcName} onValueChange={setPhcName} disabled={!district}>
              <SelectTrigger className="w-full h-14 rounded-xl border-2 border-gray-200 text-lg disabled:opacity-50">
                <SelectValue placeholder={t('doctor.login.phcPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {availablePHCs.map(p => (
                  <SelectItem key={p} value={p} className="text-lg">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          disabled={!district || !phcName}
          className="w-full h-14 mt-auto bg-blue-600 text-white rounded-xl text-lg font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {t('doctor.login.btn.login')}
        </button>
      </div>
    </div>
  )
}
