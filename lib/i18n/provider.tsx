'use client'

import { createContext, useContext, ReactNode } from 'react'

type Messages = {
  [key: string]: string | Messages
}

type I18nContextType = {
  locale: string
  messages: Messages
}

const I18nContext = createContext<I18nContextType | null>(null)

interface I18nProviderProps {
  children: ReactNode
  locale: string
  messages: Messages
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  )
}

function getNestedValue(obj: Messages, path: string): string {
  const keys = path.split('.')
  let current: string | Messages = obj
  
  for (const key of keys) {
    if (typeof current === 'string' || current === undefined || current === null) {
      return path
    }
    current = current[key]
  }
  
  return typeof current === 'string' ? current : path
}

export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useTranslations must be used within an I18nProvider')
  }
  
  const { messages } = context
  const namespaceMessages = namespace ? (messages[namespace] as Messages || {}) : messages
  
  return function t(key: string, values?: Record<string, string | number>): string {
    let translation = getNestedValue(namespaceMessages, key)
    
    // Handle interpolation {variable}
    if (values && typeof translation === 'string') {
      Object.entries(values).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    
    return translation
  }
}

export function useLocale(): string {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider')
  }
  
  return context.locale
}
