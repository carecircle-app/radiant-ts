'use client';

import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

type Messages = Record<string, any>;

export default function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: Messages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
