const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

const root = path.resolve(__dirname, '..', 'apps', 'web-app');
const files = walk(root);
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('ticket-list-store') || content.includes('useTicketListStore')) {
    content = content
      .replace(/ticket-list-store/g, 'ticket-store')
      .replace(/useTicketListStore/g, 'useTicketStore');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', path.relative(root, file));
    count++;
  }
}

console.log(`Done. ${count} files updated.`);
