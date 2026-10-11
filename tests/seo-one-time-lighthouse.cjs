// Reuse the same lab configuration without overwriting the earlier mobile audit.
const fs = require('node:fs');
const path = require('node:path');
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Unknown phase');
let source = fs.readFileSync(path.join(__dirname, 'mobile-performance.cjs'), 'utf8');
source = source.replace("path.join(__dirname, 'mobile-artifacts', 'performance')", `path.join(root, 'SEO_OPTIMIZATION_2026-10-11', '${phase}', 'performance')`);
source = source.replace("process.argv[2] || 'all'", "'lighthouse'");
// Compile as a module with the original directory so dependencies resolve normally.
const Module = require('node:module');
const runner = new Module(__filename, module);
runner.filename = __filename;
runner.paths = module.paths;
runner._compile(source, __filename);
