import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function VirtualListDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('virtualList');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        {t('placeholder')}
      </div>
    </div>
  );
}
