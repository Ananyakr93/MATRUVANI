import { useAppStore } from '@/store/useAppStore'

export default function LanguageSelector() {
  const { language, setLanguage } = useAppStore()
  return (
    <select 
      value={language} 
      onChange={(e) => setLanguage(e.target.value)}
      className="p-2 border rounded"
    >
      <option value="hi">हिंदी</option>
      <option value="en">English</option>
    </select>
  )
}
