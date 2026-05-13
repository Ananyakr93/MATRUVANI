import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Baby, Activity, Building, PlayCircle } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

const LANGUAGES = [
  { code: 'hi', native: 'हिन्दी', roman: 'Hindi' },
  { code: 'kn', native: 'ಕನ್ನಡ', roman: 'Kannada' },
  { code: 'mr', native: 'मराठी', roman: 'Marathi' },
  { code: 'te', native: 'తెలుగు', roman: 'Telugu' },
  { code: 'ta', native: 'தமிழ்', roman: 'Tamil' },
  { code: 'bn', native: 'বাংলা', roman: 'Bengali' },
  { code: 'or', native: 'ଓଡ଼ିଆ', roman: 'Odia' },
  { code: 'en', native: 'English', roman: 'English' },
]



export default function Welcome() {
  const navigate = useNavigate()
  const { language, setLanguage } = useAppStore()
  const { t } = useTranslation()
  const [showRoles, setShowRoles] = useState(false)

  const handleLanguageSelect = (code) => {
    setLanguage(code)
    setShowRoles(true)
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col p-6 max-w-md mx-auto">
      {/* Top Section */}
      <div className="flex flex-col items-center mt-8 mb-10 text-center">
        {/* Placeholder for Pregnant Woman Logo, using Baby icon colored maroon */}
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Baby size={48} className="text-red-900" />
        </div>
        <h1 className="text-3xl font-bold text-green-900 mb-2 tracking-tight">{t('app.title')}</h1>
        <p className="text-green-700 font-medium">{t('app.tagline')}</p>
      </div>

      {/* Language Selector Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`min-h-[64px] w-full rounded-xl flex flex-col items-center justify-center p-2 transition-colors duration-200 border
                ${isSelected 
                  ? 'bg-green-600 text-white border-green-600 shadow-md' 
                  : 'bg-white text-green-900 border-green-200 hover:bg-green-50'
                }`}
            >
              <span className="font-semibold text-base">{lang.native}</span>
              <span className={`text-xs ${isSelected ? 'text-green-100' : 'text-green-600'}`}>
                {lang.roman}
              </span>
            </button>
          )
        })}
      </div>

      {/* Role Buttons */}
      {showRoles && (
        <div className="flex flex-col gap-4 animate-fade-in-up">
          <button 
            onClick={() => navigate('/asha/login')}
            className="w-full min-h-[72px] rounded-2xl text-lg font-semibold flex items-center gap-4 px-6 bg-green-600 text-white shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl">🏥</span>
            <span className="flex-1 text-left">{t('role.asha')}</span>
          </button>
          
          <button 
            onClick={() => navigate('/doctor/login')}
            className="w-full min-h-[72px] rounded-2xl text-lg font-semibold flex items-center gap-4 px-6 bg-blue-600 text-white shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl">👩‍⚕️</span>
            <span className="flex-1 text-left">{t('role.doctor')}</span>
          </button>
          
          <button 
            onClick={() => navigate('/district/login')}
            className="w-full min-h-[72px] rounded-2xl text-lg font-semibold flex items-center gap-4 px-6 bg-purple-600 text-white shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl">📊</span>
            <span className="flex-1 text-left">{t('role.district')}</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 flex flex-col items-center gap-4">
        <button 
          onClick={() => navigate('/demo')}
          className="flex items-center gap-2 text-green-700 font-medium py-2 px-4 rounded-full border border-green-300 hover:bg-green-100 transition-colors"
        >
          <PlayCircle size={18} />
          <span>{t('btn.demo')}</span>
        </button>
        <p className="text-xs text-green-600/70 font-medium pb-2">
          {t('footer.text')}
        </p>
      </div>
    </div>
  )
}
