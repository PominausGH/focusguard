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

const injectedCode = fixes.map(f => f.code).join('\n');

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
    if (!content.includes('marketing-os-injected')) {
      const wrappedCode = `\n<!-- marketing-os-injected -->\n${injectedCode}\n`;
      content = content.replace('</head>', wrappedCode + '</head>');
      fs.writeFileSync(file, content);
      console.log(`✅ Injected into ${path.relative(distDir, file)}`);
    }
  }
});
