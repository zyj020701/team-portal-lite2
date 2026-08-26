const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'apps', 'web-app', 'messages');
const locales = ['zh', 'en', 'ja', 'ko', 'zh-TW'];

const additions = {
  zh: {
    virtualList: {
      description: '虚拟滚动列表演示，支持 10 万条数据流畅渲染。',
      placeholder: '虚拟列表组件占位区域',
    },
  },
  en: {
    virtualList: {
      description: 'Virtual scrolling list demo, supports smooth rendering of 100,000 items.',
      placeholder: 'Virtual list component placeholder area',
    },
  },
  ja: {
    virtualList: {
      description: '仮想スクロールリストのデモ。10万件のデータをスムーズにレンダリングします。',
      placeholder: '仮想リストコンポーネントのプレースホルダー領域',
    },
  },
  ko: {
    virtualList: {
      description: '가상 스크롤 목록 데모, 10만 개 데이터를 부드럽게 렌더링합니다.',
      placeholder: '가상 목록 컴포넌트 자리 표시자 영역',
    },
  },
  'zh-TW': {
    virtualList: {
      description: '虛擬滾動列表示範，支援 10 萬筆資料流暢渲染。',
      placeholder: '虛擬列表元件佔位區域',
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
