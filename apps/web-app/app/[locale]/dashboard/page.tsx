import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { DashboardClient } from '../../../components/dashboard/DashboardClient';
import { fetchDashboardData } from '../../../lib/dashboard-api';
import { dashboardKeys } from '../../../lib/query-keys';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // RSC 首屏预取数据，通过 HydrationBoundary 注入客户端缓存
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: dashboardKeys.stats(locale),
    queryFn: () => fetchDashboardData(locale),
  });

  return (
    <Suspense>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardClient locale={locale} />
      </HydrationBoundary>
    </Suspense>
  );
}
