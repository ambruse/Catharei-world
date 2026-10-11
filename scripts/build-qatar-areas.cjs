// Reproducible offline conversion of the CC BY 4.0 GeoNames Qatar download.
// Download https://download.geonames.org/export/dump/QA.zip and extract QA.txt first.
const fs = require('node:fs');
const crypto = require('node:crypto');
const input = fs.readFileSync('data/geonames-source/QA.txt', 'utf8');
const rows = input.trim().split('\n').map(row => row.split('\t'));
const municipalities = Object.fromEntries(rows.filter(row => row[7] === 'ADM1').map(row => [row[10], { name: row[2], ar: row[3].split(',').find(name => /^[\u0621-\u0670\s\d]+$/.test(name)) || '' }]));
const areas = rows
  .filter(row => row[8] === 'QA' && ['PPL', 'PPLA', 'PPLA2', 'PPLC', 'PPLX', 'ADM1'].includes(row[7]))
  .map(row => {
    const aliases = [...new Set([row[1], row[2], ...row[3].split(',')].filter(Boolean))];
    return { id: Number(row[0]), name: row[2], ar: aliases.find(name => /^[\u0621-\u0670\s\d]+$/.test(name)) || '', aliases,
      lat: Number(row[4]), lng: Number(row[5]), kind: row[7], municipality: row[10], updated: row[18].trim() };
  });
for (const area of areas) {
  if (!Number.isFinite(area.lat) || !Number.isFinite(area.lng) || area.lat < 24 || area.lat > 27 || area.lng < 50 || area.lng > 52) throw new Error('Invalid source point: ' + area.id);
}
fs.writeFileSync('data/qatar-areas.json', JSON.stringify({ source: 'GeoNames', license: 'CC BY 4.0', sourceUrl: 'https://download.geonames.org/export/dump/QA.zip', retrieved: '2026-10-11', sourceSha256: crypto.createHash('sha256').update(input).digest('hex'), municipalities, areas }));
console.log(`${areas.length} Qatar place/municipality points; ${areas.filter(a => a.ar).length} Arabic names; ${fs.statSync('data/qatar-areas.json').size} bytes`);
