import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { TicketListClient } from '../../../components/tickets/TicketListClient';
import { fetchTickets } from '../../../lib/ticket-api';
import {
  parseTicketFilters,
  buildTicketListParams,
  ticketListQueryKey,
} from '../../../lib/ticket-filters';

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  // Convert Next.js searchParams into the same shape as useSearchParams().
  const get = (name: string): string | null => {
    const v = sp[name];
    return typeof v === 'string' ? v : null;
  };
  const filters = parseTicketFilters({ get });

  // RSC 首屏预取首页工单，通过 HydrationBoundary 注入客户端缓存，
  // 让列表首屏数据随 HTML 直出（显著改善移动端 LCP / TBT）。
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: ticketListQueryKey(filters),
    queryFn: () => fetchTickets(buildTicketListParams(1, filters)),
    initialPageParam: 1,
  });

  return (
    <Suspense>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TicketListClient />
      </HydrationBoundary>
    </Suspense>
  );
}
