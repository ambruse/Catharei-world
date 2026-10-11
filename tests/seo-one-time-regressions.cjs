const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const choice=process.argv[2];
if(!['navigation','commerce','webkit','axe'].includes(choice))throw Error('Unknown check');
const file=choice==='axe'?'mobile-performance.cjs':`mobile-${choice}.cjs`;
let source=fs.readFileSync(path.join(__dirname,file),'utf8');
source=source.replaceAll("'mobile-artifacts'", "'../SEO_OPTIMIZATION_2026-10-11'");
if(choice==='axe')source=source.replace("process.argv[2] || 'all'", "'axe'");
const runner=new Module(__filename,module);runner.filename=__filename;runner.paths=module.paths;runner._compile(source,__filename);
