import pathlib, json, html
p = pathlib.Path(__file__).parent
findings = json.loads((p / 'evidence-ledger.json').read_text(encoding='utf-8'))
for f in findings:
    f['capture_date'] = '2026-11-01'
(p / 'evidence-ledger.json').write_text(json.dumps(findings, ensure_ascii=False, indent=2), encoding='utf-8')
keys = ['id', 'priority', 'title', 'action', 'owner', 'dependency', 'effort_assumption', 'success_check']
(p / 'fix-backlog.json').write_text(json.dumps([{k: f[k] for k in keys} for f in findings], ensure_ascii=False, indent=2), encoding='utf-8')
e = html.escape
report = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Catharei SEO audit — 1 November 2026</title>
<style>body{font:16px/1.65 system-ui,sans-serif;color:#202326;background:#f7f7f4;margin:0}main{max-width:1020px;margin:auto;padding:40px 24px}h1,h2,h3{line-height:1.25}h1{font-size:34px}h2{margin-top:42px}h3{font-size:21px}article{padding:20px 0;border-top:1px solid #ccd1d4}a{color:#19577a;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:10px;border:1px solid #ccd1d4;text-align:left;vertical-align:top;overflow-wrap:anywhere}p{max-width:95ch}.scroll{overflow:auto}li{margin:8px 0}@media print{body{background:white}article{break-inside:avoid}}</style><main>
<h1>Catharei website SEO audit</h1>
<p>Capture date: <b>1 November 2026</b> (Asia/Riyadh). Site: <a href="https://www.catharei.com/">www.catharei.com</a>. Working goal: improve qualified discovery and orders for sweets, cakes, catering and branch visits in Qatar, in English and Arabic. Goal and market inferred from the site and this chat.</p>
<h2>What matters first</h2>
<p>No unintended site-wide indexing blocker was found in the bounded sample. Start with oversized product images and conflicting branch facts, then repair copied schema and broken schema references. Complete Arabic content and useful buying information before expanding landing pages. No production SEO changes were made.</p>
<h2>Inspection coverage</h2>
<table><tr><th>Area</th><th>Inspected material and evidence</th><th>Limit</th></tr>
<tr><td>Discovery and technical controls</td><td>Homepage and live sitemap; 94 unique sitemap URLs. Offline sitemap validator reported no structural findings. HTTP responses, source controls, metadata and selected references saved.</td><td>Representative sample, not a complete crawl; destination checks cover only the listed sample.</td></tr>
<tr><td>Page families</td><td>16 distinct sitemap pages: homepage, menu, two categories, three products, two branches, two service pages, delivery, contact, blog index, one article and Luqaimat landing page.</td><td>Other products, articles and branch not inspected.</td></tr>
<tr><td>Additional HTTP checks</td><td>Two Arabic query variants, login, robots, sitemap, llms.txt, host/protocol alternatives and selected invalid/reference URLs. 29 HTTP requests total.</td><td>Redirect final destinations logged; hop status codes not separately recorded.</td></tr>
<tr><td>Rendering</td><td>Six views across five URLs: homepage at 1440 and 390 pixels, Arabic homepage, Arabic menu, Mini Sandwich and delivery at 390 pixels; height 844. Desktop Chromium/Edge, fresh contexts, reduced motion. DOMContentLoaded plus 2.5 seconds.</td><td>No device/network throttling; limited views do not establish Googlebot behavior or all-device support.</td></tr>
<tr><td>Content, schema, images and AI accessibility</td><td>Source content, links, image attributes, JSON-LD syntax and selected fact agreement; editorial review and mobile screenshots.</td><td>No full vocabulary validator, Rich Results Test, AI citation tracking, backlink or SERP study.</td></tr>
<tr><td>Performance and search outcomes</td><td>Browser resource-transfer diagnostics only.</td><td>No field CWV, Lighthouse, Search Console, GA4, Business Profile or ranking evidence.</td></tr></table>
<p><b>No overall SEO score assigned.</b> Actual indexing, field/lab CWV, query demand and conversion evidence are unavailable. Resource bytes are diagnostics, not CWV. The native web reader failed to open sitemap.xml with a generic error; a separate direct HTTP request returned 200 and supplied the saved sitemap. That reader failure is not evidence of an outage or robots block.</p>
<h2>What is already working</h2>
<p>The 16 sampled sitemap landing pages returned HTTP 200, with individual titles and descriptions, one H1, self-referencing canonicals and no observed noindex. Their JSON-LD parsed. Catalogue source HTML contains product content and links. HTTP/non-www homepage requests resolved to HTTPS www. A deliberately nonexistent page returned 404. Login is intentionally noindex and is not treated as a public landing-page defect. Robots allows general crawling and disallows /api/; catalogue content was available in source.</p>
<p>No horizontal overflow or page JavaScript exceptions appeared in the six rendered views. All sampled HTML img elements had alt attributes, although attribute presence alone does not establish description quality. The sampled article includes organizational attribution, dates, a relevant cultural source and useful menu links.</p>
<h2>Findings and action plan</h2>
'''
for f in findings:
    report += '<article><h3>' + e(f['id'] + ' · ' + f['priority'] + ' — ' + f['title']) + '</h3><p>' + e(f['observation']) + '</p><p>'
    report += ' · '.join('<a href="' + e(u) + '">' + e(u.replace('https://www.catharei.com', '') or '/') + '</a>' for u in f['urls']) + '</p>'
    for label, key in [('Evidence', 'evidence'), ('Evidence level', 'evidence_level'), ('Confidence', 'confidence'), ('Action', 'action'), ('Owner', 'owner'), ('Dependency', 'dependency'), ('Planning effort', 'effort_assumption'), ('Success check', 'success_check')]:
        report += '<p><b>' + label + ':</b> ' + e(f[key]) + '</p>'
    report += '</article>'
report += '''<h2>Implementation sequence</h2>
<ol><li>Confirm branch hours and service claims (F02/F07) while preparing image derivatives and the upload fix (F01). Set measurement baselines (F08).</li><li>Correct page schema (F03) and repair breadcrumb/image references after asset and hub decisions (F04).</li><li>Pilot complete Arabic pages (F05), addressable variants (F06), and richer buying information (F07). Validate before extending across the catalogue.</li></ol>
<p>Effort ranges are planning assumptions for an existing codebase and exclude waiting for facts, translations and assets. They are not delivery commitments.</p>
<h2>Remaining uncertainty</h2>
<p>No Search Console, GA4, Business Profile, field CWV, ranking or backlink data was supplied. There was no Google URL Inspection, Rich Results Test or Lighthouse run. Rich-result observations compare source data against current documentation and do not certify eligibility. Business hours, dietary information and service promises need owner verification. Unvisited sitemap URLs and most link/asset destinations remain unknown. No traffic growth, conversion lift, ranking penalty or complete index coverage is claimed.</p>
<p>Source-readable content, attribution and public crawl access support agent usability; AI citation visibility was not measured. The live llms.txt returned 200, but its presence is not scored. Google's AI-search guidance relies on ordinary SEO fundamentals rather than special AI markup.</p>
<h2>Sources and supporting files</h2>
<ul><li><a href="evidence-ledger.json">Evidence ledger</a> and <a href="fix-backlog.json">fix backlog</a></li>
<li><a href="crawl-evidence.json">Initial HTTP/source evidence</a>, <a href="followup-evidence.json">targeted follow-ups</a>, <a href="sitemap-validation.json">sitemap validation</a></li>
<li><a href="rendered-evidence.json">Rendered observations</a> and <a href="resource-sample.json">largest resource transfers</a></li>
<li><a href="https://developers.google.com/search/docs/appearance/structured-data/product">Google Product guidance</a>, <a href="https://developers.google.com/search/docs/appearance/structured-data/product-snippet">product snippet requirements</a>, <a href="https://developers.google.com/search/docs/appearance/structured-data/merchant-listing">merchant listing requirements</a></li>
<li><a href="https://developers.google.com/search/docs/specialty/international/localized-versions">Localized pages</a> and <a href="https://developers.google.com/search/docs/appearance/ai-features">AI-search guidance</a>, consulted during this audit.</li></ul>
<h2>Visited URL and response ledger</h2><p>These are final observed statuses after redirects. Saved snapshots are evidence; use live URLs or parsed JSON for browsing.</p><div class="scroll"><table><tr><th>Requested URL</th><th>Status</th><th>Final URL</th><th>Snapshot</th></tr>'''
records = json.loads((p / 'crawl-evidence.json').read_text(encoding='utf-8')) + json.loads((p / 'followup-evidence.json').read_text(encoding='utf-8'))
for r in records:
    report += '<tr><td>' + e(r['url']) + '</td><td>' + e(str(r.get('status', r.get('error', 'unknown')))) + '</td><td>' + e(r.get('final_url', '')) + '</td><td>' + e(pathlib.Path(r['snapshot']).name) + '</td></tr>'
report += '</table></div></main></html>'
(p / 'audit-report.html').write_text(report, encoding='utf-8')
print('Created report, ledger and backlog:', len(findings), 'findings;', len(records), 'HTTP observations')
