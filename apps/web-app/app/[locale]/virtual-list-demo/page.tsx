import { setRequestLocale } from 'next-intl/server';
import { VirtualListDemo } from '../../../components/virtual-list/VirtualListDemo';

export default async function VirtualListDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VirtualListDemo />;
}
