const fs = require('fs');
const path = require('path');

const possible = [
  path.join(process.cwd(), 'web-build', 'index.html'),
  path.join(process.cwd(), 'dist', 'index.html'),
  path.join(process.cwd(), 'web-build', 'index.html'),
];

const target = possible.find((p) => fs.existsSync(p));
if (!target) {
  console.error('index.html not found in web-build or dist. Skipping patch.');
  process.exit(0);
}

let html = fs.readFileSync(target, 'utf8');

// Insert base href if not present
if (!/\<base href=/i.test(html)) {
  html = html.replace(/<head>/i, '<head>\n  <base href="/ACHOU_ANDROID_RN/">\n  <script>globalThis.__EXPO_ROUTER_HYDRATE__ = false;</script>');
  console.log('Inserted <base href="/ACHOU_ANDROID_RN/"> and hydration flag into', target);
}

// Fix absolute paths produced by expo to include repo prefix
html = html.replace(/src="\/_expo\//g, 'src="/ACHOU_ANDROID_RN/_expo/');
html = html.replace(/href="\/favicon.ico"/g, 'href="/ACHOU_ANDROID_RN/favicon.ico"');

fs.writeFileSync(target, html, 'utf8');
console.log('Patched asset paths in', target);
