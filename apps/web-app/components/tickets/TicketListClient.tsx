'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTicketsInfiniteQuery, flattenPages } from '../../hooks/use-tickets';
import { parseTicketFilters } from '../../lib/ticket-filters';
import { TicketList } from './TicketList';

export function TicketListClient() {
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseTicketFilters(searchParams), [searchParams]);

  const { data, isLoading } = useTicketsInfiniteQuery(filters);

  const tickets = useMemo(() => flattenPages(data), [data]);

  return <TicketList tickets={tickets} isLoading={isLoading} />;
}
