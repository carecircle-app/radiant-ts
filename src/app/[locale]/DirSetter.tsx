'use client'
import { useEffect } from 'react'

// Languages that should render RTL
const RTL = new Set(['ar', 'he', 'fa', 'ur'])

export default function DirSetter({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.setAttribute(
      'dir',
      RTL.has(locale) ? 'rtl' : 'ltr',
    )
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  return null
}
