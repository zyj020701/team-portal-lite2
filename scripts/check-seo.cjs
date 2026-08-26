const http = require('http');
const url = process.argv[2] || 'http://localhost:3100/zh';
http
  .get(url, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => {
      console.log('STATUS:', r.statusCode);
      const m = d.match(/<link[^>]*(canonical|hreflang|alternate)[^>]*>/gi);
      console.log(m ? m.join('\n') : 'NO LINKS FOUND');
      const title = d.match(/<title[^>]*>([^<]*)<\/title>/i);
      console.log('TITLE:', title ? title[1] : 'NONE');
    });
  })
  .on('error', (e) => console.error('ERROR:', e.message));
