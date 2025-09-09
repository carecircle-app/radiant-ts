import * as React from 'react'
import Providers from './providers'

async function getMessages(locale: string) {
  try {
    const mod = await import(`../../locales/${locale}.json`)
    return mod.default
  } catch {
    const mod = await import('../../locales/en.json')
    return mod.default
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}): Promise<React.ReactNode> {
  const messages = await getMessages(params.locale)

  return (
    <Providers locale={params.locale} messages={messages}>
      {children}
    </Providers>
  )
}
