export type Locale = 'zh-CN' | 'en-US';
type Dict = Record<string, string>;
const dictionaries: Record<Locale, Dict> = {
  'zh-CN': {
    'app.title': '工单管理系统',
    'ticket.list': '工单列表',
    'ticket.detail': '工单详情',
    'ticket.status.pending': '待处理',
    'ticket.status.in_progress': '处理中',
    'ticket.status.resolved': '已解决',
    'ticket.status.closed': '已关闭',
    'common.search': '搜索',
    'common.confirm': '确认',
    'common.cancel': '取消',
  },
  'en-US': {
    'app.title': 'Ticket Management',
    'ticket.list': 'Ticket List',
    'ticket.detail': 'Ticket Detail',
    'ticket.status.pending': 'Pending',
    'ticket.status.in_progress': 'In Progress',
    'ticket.status.resolved': 'Resolved',
    'ticket.status.closed': 'Closed',
    'common.search': 'Search',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
  },
};
export function getDictionary(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries['zh-CN'];
}
export function t(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? key;
}
