import type {
  TicketWithRelations,
  User,
  Customer,
  TicketStatus,
  TicketPriority,
  TimelineEvent,
  TicketComment,
  TicketDetail,
} from '@team-portal/types';

const USERS: User[] = [
  { id: 'U-001', name: '张伟' },
  { id: 'U-002', name: '李娜' },
  { id: 'U-003', name: '王芳' },
  { id: 'U-004', name: '刘洋' },
  { id: 'U-005', name: '陈明' },
  { id: 'U-006', name: '赵静' },
  { id: 'U-007', name: '孙磊' },
  { id: 'U-008', name: '周婷' },
];

const CUSTOMERS: Customer[] = [
  { id: 'C-001', name: '阿里巴巴集团', contact: '马经理', company: '阿里巴巴' },
  { id: 'C-002', name: '腾讯科技', contact: '张总监', company: '腾讯' },
  { id: 'C-003', name: '字节跳动', contact: '李主管', company: '字节跳动' },
  { id: 'C-004', name: '华为技术', contact: '王经理', company: '华为' },
  { id: 'C-005', name: '百度在线', contact: '刘总监', company: '百度' },
  { id: 'C-006', name: '京东集团', contact: '陈主管', company: '京东' },
  { id: 'C-007', name: '美团点评', contact: '赵经理', company: '美团' },
  { id: 'C-008', name: '滴滴出行', contact: '孙总监', company: '滴滴' },
  { id: 'C-009', name: '小米科技', contact: '周主管', company: '小米' },
  { id: 'C-010', name: '网易公司', contact: '吴经理', company: '网易' },
];

const TITLES = [
  '登录页面无法加载，显示空白屏幕',
  '导出报表功能异常，文件下载失败',
  '通知推送延迟超过5分钟',
  '主题切换时出现闪烁',
  '工单列表筛选条件不生效',
  '批量操作后页面无响应',
  '搜索功能返回结果不准确',
  '虚拟滚动在快速滚动时出现白屏',
  'WebSocket连接频繁断开重连',
  '用户头像上传失败',
  '权限设置页面加载缓慢',
  '数据统计图表显示异常',
  '邮件通知模板格式错乱',
  '客服转接功能丢失上下文',
  '工单状态自动变更问题',
  '客户信息同步延迟',
  'API接口响应超时',
  '移动端适配问题',
  '暗色模式下文字不可见',
  '快捷键与浏览器冲突',
  '工单备注无法保存',
  '文件附件大小限制不合理',
  '标签筛选多选逻辑错误',
  '时间线排序混乱',
  '分页器在最后一页显示异常',
  '表单验证提示不明确',
  '导航栏在小屏幕下溢出',
  '数据导出CSV格式乱码',
  '在线状态显示不准确',
  '系统通知声音无法关闭',
];

const DESCRIPTIONS = [
  '用户反馈在Chrome浏览器中访问登录页面时，页面显示为空白，控制台有JavaScript错误。已尝试清除缓存和使用无痕模式，问题仍然存在。',
  '在报表页面点击导出按钮后，系统提示下载失败，网络请求返回500错误。影响多个部门的日常工作。',
  '用户反映通知推送存在明显延迟，部分通知延迟超过5分钟才到达，严重影响客服响应效率。',
  '在切换租户主题时，页面会出现短暂的白色闪烁（FOUC），用户体验不佳。',
  '设置筛选条件后，列表数据未按预期过滤，仍然显示全部工单。',
];

const STATUSES: TicketStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTickets(count: number): TicketWithRelations[] {
  const rand = seededRandom(42);
  const tickets: TicketWithRelations[] = [];

  for (let i = 0; i < count; i++) {
    const userIdx = Math.floor(rand() * USERS.length);
    const customerIdx = Math.floor(rand() * CUSTOMERS.length);
    const titleIdx = Math.floor(rand() * TITLES.length);
    const statusIdx = Math.floor(rand() * STATUSES.length);
    const priorityIdx = Math.floor(rand() * PRIORITIES.length);

    const daysAgo = Math.floor(rand() * 30);
    const hoursAgo = Math.floor(rand() * 24);
    const createdAt = new Date(2026, 7, 19 - daysAgo, hoursAgo, 0, 0);
    const updatedAt = new Date(createdAt.getTime() + Math.floor(rand() * 86400000));

    const assignee = rand() > 0.15 ? (USERS[userIdx] ?? null) : null;

    tickets.push({
      id: `TK-${String(i + 1).padStart(5, '0')}`,
      title: TITLES[titleIdx] ?? '未知问题',
      status: STATUSES[statusIdx] ?? 'pending',
      priority: PRIORITIES[priorityIdx] ?? 'medium',
      assigneeId: assignee?.id ?? null,
      tenantId: 'T-001',
      customerId: CUSTOMERS[customerIdx]?.id ?? 'C-001',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      assignee,
      customer: CUSTOMERS[customerIdx] ?? CUSTOMERS[0]!,
    });
  }

  return tickets;
}

// 10,000 tickets exercise the virtualizer at scale (D27 acceptance: the list
// must remain smooth / 60fps with a ten-thousand-row dataset). Only the rows
// visible in the viewport are rendered by @tanstack/react-virtual, so the
// generation cost is paid once at module load.
export const ALL_TICKETS = generateTickets(10000);
export const ALL_USERS = USERS;
export const ALL_CUSTOMERS = CUSTOMERS;

// ── In-memory detail store ──────────────────────────────────────

const detailStore = new Map<string, TicketDetail>();
const commentStore = new Map<string, TicketComment[]>();

function generateEvents(ticket: TicketWithRelations): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const created = new Date(ticket.createdAt);
  const operator = ticket.assignee ?? USERS[0]!;

  events.push({
    id: `${ticket.id}-evt-created`,
    type: 'created',
    timestamp: created.toISOString(),
    operator: USERS[0]!,
    content: `工单创建：${ticket.title}`,
  });

  if (ticket.assignee) {
    const assignedTime = new Date(created.getTime() + 3600000);
    events.push({
      id: `${ticket.id}-evt-assigned`,
      type: 'assigned',
      timestamp: assignedTime.toISOString(),
      operator: USERS[0]!,
      content: `分配给 ${ticket.assignee.name}`,
      fromAssignee: null,
      toAssignee: ticket.assignee,
    });
  }

  if (
    ticket.status === 'in_progress' ||
    ticket.status === 'resolved' ||
    ticket.status === 'closed'
  ) {
    const statusTime = new Date(created.getTime() + 7200000);
    events.push({
      id: `${ticket.id}-evt-status-progress`,
      type: 'status_changed',
      timestamp: statusTime.toISOString(),
      operator,
      content: '状态变更：待处理 → 处理中',
      fromStatus: 'pending',
      toStatus: 'in_progress',
    });
  }

  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    const statusTime = new Date(created.getTime() + 14400000);
    events.push({
      id: `${ticket.id}-evt-status-resolved`,
      type: 'status_changed',
      timestamp: statusTime.toISOString(),
      operator,
      content: '状态变更：处理中 → 已解决',
      fromStatus: 'in_progress',
      toStatus: 'resolved',
    });
  }

  if (ticket.status === 'closed') {
    const statusTime = new Date(created.getTime() + 21600000);
    events.push({
      id: `${ticket.id}-evt-status-closed`,
      type: 'status_changed',
      timestamp: statusTime.toISOString(),
      operator,
      content: '状态变更：已解决 → 已关闭',
      fromStatus: 'resolved',
      toStatus: 'closed',
    });
  }

  // Add a sample comment
  const commentTime = new Date(created.getTime() + 10800000);
  events.push({
    id: `${ticket.id}-evt-comment-1`,
    type: 'comment',
    timestamp: commentTime.toISOString(),
    operator,
    content: '已联系客户确认问题，正在排查中。初步判断为前端资源加载异常。',
  });

  return events;
}

function generateComments(ticket: TicketWithRelations): TicketComment[] {
  const operator = ticket.assignee ?? USERS[0]!;
  const created = new Date(ticket.createdAt);
  return [
    {
      id: `${ticket.id}-cmt-1`,
      ticketId: ticket.id,
      author: operator,
      content: '已联系客户确认问题，正在排查中。初步判断为前端资源加载异常。',
      createdAt: new Date(created.getTime() + 10800000).toISOString(),
    },
  ];
}

export function getTicketDetail(ticket: TicketWithRelations): TicketDetail {
  const cached = detailStore.get(ticket.id);
  if (cached) return cached;

  const descIdx = Math.abs(ticket.id.charCodeAt(3) - 48) % DESCRIPTIONS.length;
  const detail: TicketDetail = {
    ...ticket,
    description: DESCRIPTIONS[descIdx] ?? DESCRIPTIONS[0]!,
    events: generateEvents(ticket),
  };
  detailStore.set(ticket.id, detail);

  if (!commentStore.has(ticket.id)) {
    commentStore.set(ticket.id, generateComments(ticket));
  }

  return detail;
}

export function getTicketComments(ticketId: string): TicketComment[] {
  return commentStore.get(ticketId) ?? [];
}

export function addTicketComment(ticketId: string, author: User, content: string): TicketComment {
  const comment: TicketComment = {
    id: `${ticketId}-cmt-${Date.now()}`,
    ticketId,
    author,
    content,
    createdAt: new Date().toISOString(),
  };
  const existing = commentStore.get(ticketId) ?? [];
  commentStore.set(ticketId, [comment, ...existing]);

  // Also add to timeline events
  const detail = detailStore.get(ticketId);
  if (detail) {
    detail.events = [
      {
        id: `${ticketId}-evt-comment-${Date.now()}`,
        type: 'comment',
        timestamp: comment.createdAt,
        operator: author,
        content,
      },
      ...detail.events,
    ];
  }

  return comment;
}

export function updateTicketStatus(ticketId: string, status: TicketStatus, operator: User): void {
  const ticket = ALL_TICKETS.find((t) => t.id === ticketId);
  if (!ticket) return;

  const prevStatus = ticket.status;
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  const detail = detailStore.get(ticketId);
  if (detail) {
    detail.status = status;
    detail.updatedAt = ticket.updatedAt;
    detail.events = [
      {
        id: `${ticketId}-evt-status-${Date.now()}`,
        type: 'status_changed',
        timestamp: ticket.updatedAt,
        operator,
        content: `状态变更：${prevStatus} → ${status}`,
        fromStatus: prevStatus,
        toStatus: status,
      },
      ...detail.events,
    ];
  }
}

export function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority,
  operator: User,
): void {
  const ticket = ALL_TICKETS.find((t) => t.id === ticketId);
  if (!ticket) return;

  const prevPriority = ticket.priority;
  ticket.priority = priority;
  ticket.updatedAt = new Date().toISOString();

  const detail = detailStore.get(ticketId);
  if (detail) {
    detail.priority = priority;
    detail.updatedAt = ticket.updatedAt;
    detail.events = [
      {
        id: `${ticketId}-evt-priority-${Date.now()}`,
        type: 'priority_changed',
        timestamp: ticket.updatedAt,
        operator,
        content: `优先级变更：${prevPriority} → ${priority}`,
        fromPriority: prevPriority,
        toPriority: priority,
      },
      ...detail.events,
    ];
  }
}

export function assignTicket(ticketId: string, assignee: User, operator: User): void {
  const ticket = ALL_TICKETS.find((t) => t.id === ticketId);
  if (!ticket) return;

  const prevAssignee = ticket.assignee;
  ticket.assigneeId = assignee.id;
  ticket.assignee = assignee;
  ticket.updatedAt = new Date().toISOString();

  const detail = detailStore.get(ticketId);
  if (detail) {
    detail.assigneeId = assignee.id;
    detail.assignee = assignee;
    detail.updatedAt = ticket.updatedAt;
    detail.events = [
      {
        id: `${ticketId}-evt-assign-${Date.now()}`,
        type: 'assigned',
        timestamp: ticket.updatedAt,
        operator,
        content: `分配给 ${assignee.name}`,
        fromAssignee: prevAssignee,
        toAssignee: assignee,
      },
      ...detail.events,
    ];
  }
}
