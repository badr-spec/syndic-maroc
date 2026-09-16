import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../lib/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sm_lang') || 'fr')

  useEffect(() => {
    localStorage.setItem('sm_lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  function t(path) {
    const keys = path.split('.')
    let value = translations[lang]
    for (const k of keys) {
      value = value?.[k]
    }
    return value ?? path
  }

  function toggleLang() {
    setLang(prev => (prev === 'fr' ? 'ar' : 'fr'))
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
