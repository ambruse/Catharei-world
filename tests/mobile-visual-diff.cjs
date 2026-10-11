// Compare saved baseline/final screenshots; no production assets are edited.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { PNG } = require('pngjs');
const pm = require('pixelmatch');
const pixelmatch = pm.default || pm;
const base = path.join(__dirname, 'mobile-artifacts');
const out = path.join(base, 'visual-comparison');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const desktop = [];
  for (const name of fs.readdirSync(path.join(base, 'before')).filter(n => /-1440-en\.png$/.test(n))) {
    const before = PNG.sync.read(fs.readFileSync(path.join(base,'before',name)));
    const after = PNG.sync.read(fs.readFileSync(path.join(base,'after',name)));
    // Compare the matching first viewport; full-page height changes are separately recorded.
    const width = 1440, height = Math.min(844,before.height,after.height);
    const extract = async phase => sharp(path.join(base,phase,name)).extract({left:0,top:0,width,height}).ensureAlpha().raw().toBuffer();
    const [a,b] = await Promise.all([extract('before'),extract('after')]);
    const diff = new PNG({width,height});
    const pixels = pixelmatch(a,b,diff.data,width,height,{threshold:.1});
    fs.writeFileSync(path.join(out,name.replace('.png','-diff.png')),PNG.sync.write(diff));
    desktop.push({name,width,height,pixels,percentage:100*pixels/(width*height),beforeHeight:before.height,afterHeight:after.height});
  }
  for (const name of ['home-390-en','menu_html-320-en','navigation_cart_html-320-en','checkout_html-390-en','contact_html-320-en','locations_al_aziziya_html-320-en','login_html-390-en','account_html-390-en','thankyou_html-390-en','blog_history_of_luqaimat-320-en']) {
    const buffers=[];
    for (const phase of ['before','after']) {
      const file=path.join(base,phase,name+'.png'),meta=await sharp(file).metadata();
      buffers.push(await sharp(file).extract({left:0,top:0,width:Math.min(meta.width,390),height:Math.min(meta.height,1000)}).resize({width:390,height:1000,fit:'contain',background:'#161616'}).png().toBuffer());
    }
    await sharp({create:{width:790,height:1000,channels:4,background:'#888'}}).composite([{input:buffers[0],left:0,top:0},{input:buffers[1],left:400,top:0}]).png().toFile(path.join(out,name+'-before-after.png'));
  }
  fs.writeFileSync(path.join(out,'desktop-diff.json'),JSON.stringify(desktop,null,2));
  console.log(JSON.stringify(desktop,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
