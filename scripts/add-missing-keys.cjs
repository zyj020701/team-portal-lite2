const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'apps', 'web-app', 'messages');
const locales = ['zh', 'en', 'ja', 'ko', 'zh-TW'];

const additions = {
  zh: {
    metadata: {
      title: 'Team Portal Lite — 高级接单台',
      description: '面向大型企业客服部门的 B2B SaaS 工单管理系统',
    },
    common: { actions: { openMenu: '打开菜单' } },
    dashboard: { trendPlaceholder: '趋势图占位', piePlaceholder: '饼图占位' },
    tickets: {
      overview: {
        title: '工单概览',
        viewDetails: '查看详情',
        ticketDetail: '工单 {id}',
        detailTitle: '工单详情',
        clickToView: '点击表格中的工单行查看详情。',
      },
    },
  },
  en: {
    metadata: {
      title: 'Team Portal Lite — Advanced Ticket Console',
      description: 'B2B SaaS ticket management system for enterprise customer service departments',
    },
    common: { actions: { openMenu: 'Open menu' } },
    dashboard: {
      trendPlaceholder: 'Trend chart placeholder',
      piePlaceholder: 'Pie chart placeholder',
    },
    tickets: {
      overview: {
        title: 'Ticket Overview',
        viewDetails: 'View Details',
        ticketDetail: 'Ticket {id}',
        detailTitle: 'Ticket Detail',
        clickToView: 'Click a ticket row in the table to view details.',
      },
    },
  },
  ja: {
    metadata: {
      title: 'Team Portal Lite — 高度なチケットコンソール',
      description: '大企業のカスタマーサービス部門向けB2B SaaSチケット管理システム',
    },
    common: { actions: { openMenu: 'メニューを開く' } },
    dashboard: {
      trendPlaceholder: 'トレンドチャートのプレースホルダー',
      piePlaceholder: '円グラフのプレースホルダー',
    },
    tickets: {
      overview: {
        title: 'チケット概要',
        viewDetails: '詳細を見る',
        ticketDetail: 'チケット {id}',
        detailTitle: 'チケット詳細',
        clickToView: '詳細を表示するには、表のチケット行をクリックしてください。',
      },
    },
  },
  ko: {
    metadata: {
      title: 'Team Portal Lite — 고급 티켓 콘솔',
      description: '대기업 고객 서비스 부서를 위한 B2B SaaS 티켓 관리 시스템',
    },
    common: { actions: { openMenu: '메뉴 열기' } },
    dashboard: {
      trendPlaceholder: '추세 차트 자리 표시자',
      piePlaceholder: '파이 차트 자리 표시자',
    },
    tickets: {
      overview: {
        title: '티켓 개요',
        viewDetails: '세부 정보 보기',
        ticketDetail: '티켓 {id}',
        detailTitle: '티켓 세부 정보',
        clickToView: '세부 정보를 보려면 표에서 티켓 행을 클릭하세요.',
      },
    },
  },
  'zh-TW': {
    metadata: {
      title: 'Team Portal Lite — 高級接單台',
      description: '面向大型企業客服部門的 B2B SaaS 工單管理系統',
    },
    common: { actions: { openMenu: '打開選單' } },
    dashboard: { trendPlaceholder: '趨勢圖佔位', piePlaceholder: '圓餅圖佔位' },
    tickets: {
      overview: {
        title: '工單概覽',
        viewDetails: '查看詳情',
        ticketDetail: '工單 {id}',
        detailTitle: '工單詳情',
        clickToView: '點擊表格中的工單行查看詳情。',
      },
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(data, additions[locale]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${locale}.json`);
}

console.log('Done!');
