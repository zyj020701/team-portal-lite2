// One-time script: add detail.timeline.heading key to all locale JSON files.
const fs = require('fs');
const path = require('path');

const headings = {
  zh: '处理时间线',
  en: 'Timeline',
  ja: 'タイムライン',
  ko: '타임라인',
  'zh-TW': '處理時間線',
};

const messagesDir = path.join(__dirname, '..', 'apps', 'web-app', 'messages');

for (const [locale, heading] of Object.entries(headings)) {
  const file = path.join(messagesDir, `${locale}.json`);
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  if (!data.detail) data.detail = {};
  if (!data.detail.timeline || typeof data.detail.timeline !== 'object') {
    data.detail.timeline = {};
  }
  data.detail.timeline.heading = heading;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${locale}: detail.timeline.heading = "${heading}"`);
}

console.log('Done.');
