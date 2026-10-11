"""Idempotent, narrowly scoped content edits; the initial source is archived separately."""
import json, re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=root/'admin.html'
s=p.read_text(encoding='utf-8')
s=re.sub(r'<!-- Google tag \(gtag.js\) -->[\s\S]*?<!-- End Google Tag Manager -->\s*','',s,count=1)
s=re.sub(r'<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\s*','',s,count=1)
p.write_text(s,encoding='utf-8')
posts=json.loads((root/'posts.json').read_text(encoding='utf-8'))
for post in posts:
    if post['slug']=='history-of-luqaimat':
        post['desc']='What are Luqaimat? Explore their place in Qatari food culture, names and syrup variations, with links to CATHAREi’s current sweets menu.'
        # Retain the introduction and branch paragraph; replace the unreferenced judge anecdote.
        paragraphs=re.findall(r'<p>[\s\S]*?</p>',post['body'])
        if 'judge\'s ruling' in post['body']:
            post['body']=paragraphs[0]+paragraphs[1]+'''<h2>Luqaimat in Qatari food culture</h2><p>Qatar Tourism includes Luqaimat among the country’s traditional dishes and describes it as a popular Ramadan sweet. This establishes its place in Qatar’s food culture; it does not establish one country or date as its sole origin. Read <a href="https://visitqatar.com/intl-en/things-to-do/get-inspired/street-food">Visit Qatar’s guide to local street food</a> for that cultural context.</p><h2>Names, texture and toppings</h2><p>You may see the spellings Luqaimat, Luqimat or Lokma. These small fried sweets are known for the contrast between their outer crust and soft centre. Syrups and toppings vary between recipes, so check the product description when choosing a portion rather than assuming every version uses the same ingredients.</p><h2>Choosing Luqaimat from the current menu</h2>'''+paragraphs[-1]+'''<!-- luqaimat-link --><p>For a gathering, ask your preferred branch about portions, preparation time and allergens. If you are comparing sweets for an event, explore our <a href="/catering.html">catering and occasions information</a>.</p><div lang="ar" dir="rtl"><h2>اللقيمات في المطبخ القطري</h2><p>اللقيمات من الحلويات المعروفة في قطر، وترتبط أيضاً بمائدة رمضان. تختلف الإضافات وطرق التقديم؛ تصفح <a href="/navigation/Arabic_sweets.html">قائمة الحلويات العربية</a> لمعرفة الأصناف والأسعار الحالية، واسأل الفرع عن الكميات ومسببات الحساسية ووقت التحضير.</p></div>'''
        post['modified']='2026-10-11'
    if post['slug']=='best-arabic-sweets-gifting':
        if '<h2>Planning a corporate sweets order</h2>' not in post['body']:
            post['body']+='''<h2>Planning a corporate sweets order</h2><p>Start with the number of recipients, your preferred collection or delivery date, and the budget for each gift. Decide whether you need individual gifts or sweets to share at an event. Compare the products and listed portions on our <a href="/navigation/Arabic_sweets.html">Arabic sweets menu</a>, then ask the branch to confirm suitable quantities.</p><h2>Details to confirm before ordering</h2><p>Ask about available packaging, ingredients and allergens, preparation time, and arrangements for the intended destination. Do not assume a particular presentation or delivery time is included without confirming it. Our <a href="/corporate-gifting.html">corporate gifting page</a> explains the existing service; for a larger gathering, see <a href="/catering.html">catering and occasions</a> or <a href="/contact.html">contact a CATHAREi branch</a>.</p><div lang="ar" dir="rtl"><h2>تخطيط هدايا الحلويات للشركات</h2><p>حدد عدد المستلمين والميزانية والموعد المطلوب، ثم استفسر من الفرع عن الكميات والتغليف والمكونات ومسببات الحساسية ووقت التحضير. اطلع على <a href="/corporate-gifting.html">هدايا الشركات</a> أو <a href="/contact.html">تواصل مع فروعنا</a> لتأكيد التفاصيل قبل الطلب.</p></div>'''
        post['desc']='Plan Arabic sweet gifts for clients and colleagues in Qatar: compare portions and confirm packaging, allergens and timing with CATHAREi.'
        post['modified']='2026-10-11'
(root/'posts.json').write_text(json.dumps(posts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
