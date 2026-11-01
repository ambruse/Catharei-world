import sys,json,urllib.request,urllib.error,concurrent.futures,pathlib,xml.etree.ElementTree as ET,datetime
sys.path.insert(0,r'C:/Users/WORK/.codex/plugins/cache/created-by-me-remote/ai-marketing-hub-seo/0.2.16/scripts')
from analyze_html import analyze_html
out=pathlib.Path('SEO_AUDIT_2026-11-01'); origin='https://www.catharei.com'
def fetch(url):
 name=(url.replace('https://','').replace('http://','').replace('/','_').replace('?','_').replace('=','_'))
 r={'url':url,'captured_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  try: response=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; CathareiSiteAudit/1.0)'}),timeout=35)
  except urllib.error.HTTPError as e: response=e
  body=response.read(); text=body.decode('utf-8','replace'); r.update(status=response.status,final_url=response.url,headers=dict(response.headers),bytes=len(body))
  suffix='.html' if 'text/html' in response.headers.get('content-type','') else '.txt'
  file=out/(name+suffix);file.write_text(text,encoding='utf-8');r['snapshot']=str(file)
  if suffix=='.html':
   a=analyze_html(text,response.url); r['analysis']=a
  else:r['text']=text
 except Exception as e:r['error']=str(e)
 return r
first=list(concurrent.futures.ThreadPoolExecutor(3).map(fetch,[origin+'/',origin+'/robots.txt',origin+'/sitemap.xml']))
(out/'discovery.json').write_text(json.dumps(first,ensure_ascii=False,indent=2),encoding='utf-8')
sitemap=next(x for x in first if x['url'].endswith('sitemap.xml'))
urls=[e.text for e in ET.fromstring(sitemap['text']).iter() if e.tag.endswith('}loc')]
print('SITEMAP URLS',len(urls));print('\n'.join(urls))
paths=['/menu.html','/navigation/Arabic_sweets.html','/navigation/cakes.html','/locations/al-aziziya.html','/locations/al-wakrah.html','/catering.html','/corporate-gifting.html','/blog','/blog/history-of-luqaimat','/contact.html','/delivery.html','/login.html','/?lang=ar','/menu.html?lang=ar']
products=[u for u in urls if '/menu/' in u][:2]
more=list(concurrent.futures.ThreadPoolExecutor(5).map(fetch,[origin+p for p in paths]+products+['http://catharei.com/','https://catharei.com/',origin+'/seo-audit-missing-page-20261101']))
records=first+more
(out/'crawl-evidence.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
for r in records:
 a=r.get('analysis',{}); print(json.dumps({k:v for k,v in {'url':r['url'],'status':r.get('status'),'error':r.get('error'),'final':r.get('final_url'),'title':a.get('titles'),'h1':[h for h in a.get('headings',[]) if h['level']==1],'canonical':a.get('canonicals'),'robots':a.get('robots'),'hreflang':a.get('hreflang'),'schema':a.get('json_ld'),'findings':a.get('findings')}.items() if v},ensure_ascii=False))
