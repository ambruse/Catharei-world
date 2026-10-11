const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'SEO_OPTIMIZATION_2026-10-11', 'live');
fs.mkdirSync(out, { recursive: true });
const data = JSON.parse(fs.readFileSync(path.join(root, 'SEO_OPTIMIZATION_2026-10-11/source-data.json')));
fs.writeFileSync(path.join(out, 'parsed_exports.json'), JSON.stringify({ sources: data.filter(s => s.sheets).map(s => ({ file: s.file, category: 'GSC', tables: Object.entries(s.sheets).map(([sheet, rows]) => ({ sheet, rows })) })) }));
let source = fs.readFileSync(path.join(root, 'SEO_MONITORING/crawl.cjs'), 'utf8');
source = source.replace("path.join(__dirname, 'REPORTS', cycle)", "path.join(__dirname, '../SEO_OPTIMIZATION_2026-10-11/live')");
source = source.replace("['/', '/?lang=ar'", "['/luqaimat-qatar.html', '/navigation/special.html', '/navigation/special_cakes.html', 'http://catharei.com/', 'http://www.catharei.com/', 'https://catharei.com/', '/', '/?lang=ar'");
// The source collector expects relative probes. Absolute host probes are added separately below.
source = source.replace("add(origin + route, 'Technical probe')", "add(route.startsWith('http') ? route : origin + route, 'Technical probe')");
const Module = require('node:module');
const runner = new Module(__filename, module); runner.filename = __filename; runner.paths = module.paths;
runner._compile(source, __filename);
