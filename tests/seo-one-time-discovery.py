"""Read all supplied tables and freeze the pre-edit source for this one-time task."""
import csv, datetime, hashlib, json, shutil
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'SEO_OPTIMIZATION_2026-10-11'
OUT.mkdir(exist_ok=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str), encoding='utf-8')

sources=[]
for source in sorted((ROOT/'SEO_Files').iterdir()):
    if source.suffix not in ['.csv','.xlsx']: continue
    duplicate=ROOT/'SEO_INPUT'/source.name
    record={'file':source.name,'sha256':sha(source),'SEO_INPUT_identical':duplicate.exists() and sha(duplicate)==sha(source)}
    if source.suffix=='.xlsx':
        book=openpyxl.load_workbook(source,read_only=True,data_only=True)
        record['sheets']={sheet.title:list(sheet.values) for sheet in book}
        book.close()
    else:
        record['rows']=list(csv.reader(source.read_text(encoding='utf-8-sig').splitlines()))
    sources.append(record)
write('source-data.json',sources)
manifest=[]
for folder in ['.','navigation','locations','templates','tests']:
    for p in (ROOT/folder).iterdir():
        if not p.is_file() or (p.suffix not in ['.html','.js','.cjs','.css','.json','.txt','.xml','.yaml','.yml'] and p.name!='.gitignore'): continue
        relative=p.relative_to(ROOT)
        dest=OUT/'before'/relative
        if not dest.exists():
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(p,dest)
        manifest.append({'file':relative.as_posix(),'sha256':sha(dest)})
write('starting-source-manifest.json',manifest)
performance=next(s for s in sources if '-Performance-' in s['file'])['sheets']
summary={}
for name,rows in performance.items():
    summary[name]={'rows':len(rows)-1,'header':rows[0],'first':rows[1:2],'last':rows[-1:]}
    if name in ['Chart','Queries','Pages','Countries','Devices','Search appearance']:
        summary[name].update(clicks=sum(r[1] for r in rows[1:]),impressions=sum(r[2] for r in rows[1:]))
write('data-summary.json',summary)
print(json.dumps({'files':len(sources),'copies_identical':all(s['SEO_INPUT_identical'] for s in sources),'sheets':{s['file']:{k:len(v)-1 for k,v in s.get('sheets',{}).items()} for s in sources},'source_snapshot_files':len(manifest)},ensure_ascii=True))
