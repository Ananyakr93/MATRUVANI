import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { sha256 } from '@/lib/crypto'
import { post } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from '@/hooks/useTranslation'

const DISTRICTS = [
  "Bengaluru Urban", "Bengaluru Rural", "Ramanagara", "Tumakuru", 
  "Mysuru", "Mandya", "Hassan", "Kolar", "Chikkaballapura"
]

export default function ASHALogin() {
  const navigate = useNavigate()
  const { setAsha } = useAppStore()
  const { t } = useTranslation()
  
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [subCentre, setSubCentre] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isNewUser, setIsNewUser] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setIsNewUser(false)
    
    // Basic validation
    if (!phone.match(/^[0-9]{10}$/)) {
      setError(t('asha.login.error.invalidPhone'))
      return
    }

    setIsLoading(true)
    try {
      const phone_hash = await sha256(phone)
      
      try {
        // Attempt login
        const res = await post('/asha/login', { phone_hash })
        setAsha({
          ashaId: res.asha_id,
          district: res.district,
          state: res.state,
          sub_centre: res.sub_centre
        })
        navigate('/asha/home', { replace: true })
      } catch (err) {
        // If 404, prompt to register
        if (err.message.includes("404")) {
          setIsNewUser(true)
        } else {
          setError(err.message || t('asha.login.error.loginFail'))
        }
      }
    } catch (err) {
      setError(t('asha.login.error.network'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!district || !subCentre) {
      setError(t('asha.login.error.selectFields'))
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      const phone_hash = await sha256(phone)
      const res = await post('/asha/register', {
        phone_hash,
        district,
        sub_centre: subCentre,
        state: "Karnataka" // Hardcoded for hackathon scope
      })
      
      // Auto-login after registration
      setAsha({
        ashaId: res.asha_id,
        district,
        state: "Karnataka",
        sub_centre: subCentre
      })
      navigate('/asha/home', { replace: true })
    } catch (err) {
      setError(t('asha.login.error.registerFail'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setAsha({
      ashaId: 'demo-asha-0000-0000-000000000001',
      district: 'Bengaluru Rural',
      state: 'Karnataka',
      sub_centre: 'Hoskote Town',
    })
    navigate('/asha/home', { replace: true })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-green-100 bg-green-50">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-green-200/50 text-green-800"
          aria-label="Back"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-green-900 ml-2">{t('asha.login.title')}</h1>
      </div>

      {/* ── Hackathon Demo Shortcut ─────────────────────────────────────── */}
      <div className="mx-6 mt-5 mb-1 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col gap-2">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">⚡ Hackathon Demo Mode</p>
        <p className="text-sm text-amber-800 font-medium">
          Skip login and explore the full ASHA workflow instantly.
        </p>
        <button
          onClick={handleDemoLogin}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          🎯 Try Demo — Skip Login
        </button>
      </div>

      {/* Form Area */}
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">{t('asha.login.phoneLabel')}</label>
          <input 
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^0-9]/g, ''))
              setError(null)
            }}
            placeholder={t('asha.login.phonePlaceholder')}
            className={`w-full h-14 rounded-xl border-2 px-4 text-xl tracking-wider transition-colors
              ${error && !isNewUser ? 'border-red-500 bg-red-50 focus:outline-red-500' : 'border-green-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20'}`}
          />
          {error && !isNewUser && (
            <p className="text-red-500 text-sm font-medium animate-fade-in-up mt-1">{error}</p>
          )}
        </div>

        {isNewUser && (
          <div className="flex flex-col gap-6 animate-fade-in-up p-4 bg-green-50 rounded-2xl border border-green-200">
            <p className="text-green-800 font-medium text-sm">{t('asha.login.error.notFound')}</p>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">{t('asha.login.districtLabel')}</label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="w-full h-14 rounded-xl border-2 border-green-300 text-lg">
                  <SelectValue placeholder={t('asha.login.districtPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map(d => (
                    <SelectItem key={d} value={d} className="text-lg">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">{t('asha.login.subcentreLabel')}</label>
              <input 
                type="text"
                value={subCentre}
                onChange={(e) => setSubCentre(e.target.value)}
                placeholder={t('asha.login.subcentrePlaceholder')}
                className="w-full h-14 rounded-xl border-2 border-green-300 px-4 text-lg focus:border-green-500 focus:outline-none"
              />
            </div>
            
            {error && isNewUser && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
          </div>
        )}

        <div className="mt-auto pt-6">
          {!isNewUser ? (
            <button 
              onClick={handleSubmit}
              disabled={isLoading || phone.length < 10}
              className="w-full h-14 bg-green-600 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : t('asha.login.btn.login')}
            </button>
          ) : (
            <button 
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full h-14 bg-green-700 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : t('asha.login.btn.register')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
