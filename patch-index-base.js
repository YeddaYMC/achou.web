const fs = require('fs');
const path = require('path');
const distDir = path.join(__dirname, '..', 'dist');

function patchIndex(indexPath) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('<base href="/achou-web/">')) {
    html = html.replace(/<head>/i, '<head>\n <base href="/achou-web/">');
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Patched base href in', indexPath);
  } else {
    console.log('Base href already present in', indexPath);
  }
}

if (fs.existsSync(distDir)) {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    patchIndex(indexPath);
  } else {
    console.warn('index.html not found in dist/');
  }
} else {
  console.warn('dist/ not found, skipping patch');
}
