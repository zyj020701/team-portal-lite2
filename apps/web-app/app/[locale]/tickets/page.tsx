import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { TicketListClient } from '../../../components/tickets/TicketListClient';

export default async function TicketsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <TicketListClient />
    </Suspense>
  );
}
