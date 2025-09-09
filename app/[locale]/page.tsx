import {useTranslations} from 'next-intl';

export default function HomePage() {
  const t = useTranslations();
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{t('welcome')}</h1>
      <button className="px-4 py-2 rounded border">{t('login')}</button>
    </main>
  );
}