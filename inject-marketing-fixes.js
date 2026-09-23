const fs = require('fs');
const path = require('path');

const syncDir = path.join(__dirname, '.marketing-os');
if (!fs.existsSync(syncDir)) {
  console.log('No .marketing-os directory found. Skipping.');
  process.exit(0);
}

const fixes = fs.readdirSync(syncDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(syncDir, f), 'utf-8')));

if (fixes.length === 0) {
  console.log('No fixes found.');
  process.exit(0);
}

// Pages under public/ (privacy, terms, 404) are copied into dist by expo export and
// already carry the marketing site's own Umami tag. Injecting the app's tracking
// snippet there too double-counts every view under a second website ID, so skip any
// fix that declares a data-website-id on pages that already declare one.
const hasWebsiteId = (html) => /data-website-id=/.test(html);
const codeFor = (html) => fixes
  .filter(f => !(hasWebsiteId(f.code) && hasWebsiteId(html)))
  .map(f => f.code)
  .join('\n');

const findHtmlFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(findHtmlFiles(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
};

// Target the dist folder (after expo export)
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    console.log('Dist directory not found. Injection must happen after build.');
    process.exit(1);
}

const htmlFiles = findHtmlFiles(distDir);

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('</head>')) {
    const injectedCode = codeFor(content);
    if (!injectedCode) {
      console.log(`⏭️  Skipped ${path.relative(distDir, file)} (already has its own analytics tag)`);
    } else if (!content.includes('marketing-os-injected')) {
      const wrappedCode = `\n<!-- marketing-os-injected -->\n${injectedCode}\n`;
      content = content.replace('</head>', wrappedCode + '</head>');
      fs.writeFileSync(file, content);
      console.log(`✅ Injected into ${path.relative(distDir, file)}`);
    }
  }
});
