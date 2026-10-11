// Preserve earlier QA artifacts and run the existing route/viewport matrix anew.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
let source=fs.readFileSync(path.join(__dirname,'mobile-audit.cjs'),'utf8');
source=source.replace("path.join(root, 'tests', 'mobile-artifacts', phase)","path.join(root, 'SEO_OPTIMIZATION_2026-10-11', 'mobile')");
source=source.replace("h1:[...document.querySelectorAll('h1')]", "josefinUses:[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).fontFamily.includes('Josefin')).map(e=>e.tagName),h1:[...document.querySelectorAll('h1')]");
const runner=new Module(__filename,module);runner.filename=__filename;runner.paths=module.paths;runner._compile(source,__filename);
