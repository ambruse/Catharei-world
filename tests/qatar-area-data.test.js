const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const crypto=require('node:crypto');
const data=require('../data/qatar-areas.json');
test('every local area point and alias comes from the licensed Qatar source extract',()=>{
 const source=fs.readFileSync(require.resolve('../data/geonames-source/QA.txt'),'utf8');
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),data.sourceSha256);
 const rows=new Map(source.trim().split('\n').map(r=>{const columns=r.split('\t');return[Number(columns[0]),columns]}));
 assert.ok(data.areas.length>100);assert.equal(new Set(data.areas.map(a=>a.id)).size,data.areas.length);
 for(const area of data.areas){const row=rows.get(area.id);assert.equal(row[8],'QA');assert.equal(area.lat,Number(row[4]));assert.equal(area.lng,Number(row[5]));assert.equal(area.kind,row[7]);const names=[row[1],row[2],...row[3].split(',')];assert.ok(area.aliases.every(a=>names.includes(a)));if(area.ar)assert.ok(names.includes(area.ar));}
});
