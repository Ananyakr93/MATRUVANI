import { useAppStore } from '@/store/useAppStore'
import { translations } from '@/lib/i18n'

export function useTranslation() {
  const language = useAppStore((state) => state.language)

  const t = (key) => {
    if (!translations[language]) {
      return translations['en'][key] || key
    }
    return translations[language][key] || translations['en'][key] || key
  }

  return { t, language }
}
