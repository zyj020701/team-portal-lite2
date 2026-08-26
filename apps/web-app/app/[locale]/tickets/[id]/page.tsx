import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { fetchTicketDetail } from '../../../../lib/ticket-api';
import { TicketDetailClient } from '../../../../components/ticket-detail/TicketDetailClient';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ticket = await fetchTicketDetail(id);

  if (!ticket) {
    notFound();
  }

  return <TicketDetailClient id={id} initialData={ticket} />;
}
