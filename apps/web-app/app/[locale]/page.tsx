import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@team-portal/ui';
import { TicketOverview } from '../../components/features/TicketOverview';
import { fetchTickets } from '../../lib/ticket-api';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const result = await fetchTickets({ page: 1, pageSize: 5 });
  const tickets = result.items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Portal Lite</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('tagline')}</p>
        </div>
        <Link href={`/${locale}/tickets`}>
          <Button>{tNav('tickets')} →</Button>
        </Link>
      </div>

      <TicketOverview tickets={tickets} />
    </div>
  );
}
