const fs = require('fs');
const path = require('path');

const dirs = ['dist'];

function patchPublicPaths(content) {
  let html = content;

  // Normalize any stale old Pages subpath first.
  html = html.replace(/\/achou-web\//g, '/achou.web/');

  // Ensure hydration flag is false (replace true -> false)
  html = html.replace(/globalThis\.__EXPO_ROUTER_HYDRATE__\s*=\s*true;/g, 'globalThis.__EXPO_ROUTER_HYDRATE__=false;');

  // Insert base href if not present
  if (!/\<base href=/i.test(html)) {
    html = html.replace(/<head>/i, '<head>\n  <base href="/achou.web/">\n  <script>globalThis.__EXPO_ROUTER_HYDRATE__ = false;</script>');
  }

  // Fix absolute paths produced by expo to include repo prefix
  html = html.replace(/src="\/_expo\//g, 'src="/achou.web/_expo/');
  html = html.replace(/href="\/favicon.ico"/g, 'href="/achou.web/favicon.ico"');

  // Fix absolute asset paths (e.g., /assets/...) to include repo prefix for GitHub Pages
  html = html.replace(/src=\"\/assets\//g, 'src="/achou.web/assets/');
  html = html.replace(/src=\'\/assets\//g, "src='/achou.web/assets/");
  html = html.replace(/href=\"\/assets\//g, 'href="/achou.web/assets/');
  html = html.replace(/href=\'\/assets\//g, "href='/achou.web/assets/");
  html = html.replace(/url\(\"\/assets\//g, 'url("/achou.web/assets/');
  html = html.replace(/url\(\'\/assets\//g, "url('/achou.web/assets/");

  // Specific fix for expo-router unmatched asset path observed in production
  html = html.replace(/\/assets\/node_modules\//g, '/achou.web/assets/node_modules/');

  return html;
}

function walkHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && (full.endsWith('.html') || full.endsWith('.js'))) {
      results.push(full);
    }
  }
  return results;
}

let any = false;
for (const d of dirs) {
  const dirPath = path.join(process.cwd(), d);
  const files = walkHtmlFiles(dirPath);
  for (const target of files) {
    try {
      let html = fs.readFileSync(target, 'utf8');
      any = true;

      const before = html;
      html = patchPublicPaths(html);

      if (target.endsWith('.html') && before !== html && !/\<base href=/i.test(before)) {
        console.log('Inserted <base href="/achou.web/"> and hydration flag into', target);
      }

      fs.writeFileSync(target, html, 'utf8');
      console.log('Patched asset paths in', target);

      // Also write a 404.html next to the index to ensure GitHub Pages serves the SPA
      try {
        const dir = path.dirname(target);
        const notFoundPath = path.join(dir, '404.html');
        fs.writeFileSync(notFoundPath, html, 'utf8');
        console.log('Wrote 404.html to', notFoundPath);
      } catch (err) {
        console.warn('Could not write 404.html for', target, err.message);
      }
    } catch (err) {
      console.error('Error patching', target, err.message);
    }
  }
}

if (!any) {
  console.error('No HTML files found in web-build or dist. Skipping patch.');
  process.exit(0);
}
