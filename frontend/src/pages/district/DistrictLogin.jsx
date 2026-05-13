import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from '@/hooks/useTranslation'

const STATES = ["Karnataka"] // Hackathon scope
const DISTRICTS = [
  "Bengaluru Urban", "Bengaluru Rural", "Ramanagara", "Tumakuru", 
  "Mysuru", "Mandya", "Hassan", "Kolar", "Chikkaballapura"
]

export default function DistrictLogin() {
  const navigate = useNavigate()
  const { setDistrictRole } = useAppStore()
  const { t } = useTranslation()
  
  const [state, setState] = useState("Karnataka")
  const [district, setDistrict] = useState('')

  const handleLogin = () => {
    if (!state || !district) return
    setDistrictRole({ state, district })
    navigate('/district/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 ml-2">{t('district.login.title')}</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
          <p className="text-gray-600 text-sm mb-2">{t('district.login.desc')}</p>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">{t('district.login.stateLabel')}</label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full h-14 rounded-xl border-2 border-gray-200 text-lg">
                <SelectValue placeholder={t('district.login.statePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {STATES.map(s => (
                  <SelectItem key={s} value={s} className="text-lg">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">{t('asha.login.districtLabel')}</label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-full h-14 rounded-xl border-2 border-gray-200 text-lg">
                <SelectValue placeholder={t('asha.login.districtPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => (
                  <SelectItem key={d} value={d} className="text-lg">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          disabled={!district}
          className="w-full h-14 mt-auto bg-purple-600 text-white rounded-xl text-lg font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {t('district.login.btn.login')}
        </button>
      </div>
    </div>
  )
}
