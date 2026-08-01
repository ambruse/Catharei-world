const fs = require('fs');
const path = require('path');

const arabicKeywords = ", حلويات عربية قريبة مني، أفضل مخبز عربي في الدوحة، طلب بقلاوة عبر الإنترنت، توصيل بقلاوة أصلية، مخبز حلال قريب مني، متجر حلويات لبنانية في الدوحة، معجنات عربية طازجة يومياً، متجر حلويات شرق أوسطية مفتوح الآن، بقلاوة بالفستق الحلبي، توصيل بقلاوة بالفستق ساخنة، معمول بالتمر، بسبوسة / هريسة، حلوى أم علي التقليدية، حلاوة الجبن الطازجة، عوامة / لقيمات، خبز عربي طازج، مناقيش زعتر وجبن، فطائر سبانخ ولحم، خبز الكعك التقليدي، صندوق معجنات مالحة شرق أوسطية، صناديق حلويات رمضان، تقديم حلويات العيد، توصيل صناديق هدايا الحلويات العربية، طاولة حلويات للأعراس، هدايا حلويات عربية للشركات، أطباق حلويات الإفطار، أفضل لقيمات، حلويات عربية طريق سلوى، متجر حلويات طريق سلوى الدوحة، أفضل مخبز طريق سلوى، مخبز كاثاري الدوحة، شراء حلويات عربية الدوحة، أماكن حلويات قرب طريق سلوى، حلويات عربية تقليدية الدوحة، بقلاوة طريق سلوى، شوكولاتة فاخرة الدوحة، صناديق حلويات فاخرة طريق سلوى، متجر بقلاوة الدوحة، حلويات عربية الوكرة، مخبز الوكرة، متجر حلويات في الوكرة، مخبز كاثاري الوكرة، متجر حلويات قريب مني في الوكرة، أفضل حلويات في الوكرة، متجر حلويات عائلي الوكرة، حلويات عربية طازجة الوكرة، شوكولاتة عالية الجودة الوكرة، هدايا حلويات فاخرة الوكرة، حلويات عربية الخريطيات، مخبز أم صلال محمد، متجر حلويات أم صلال، متجر حلويات شمال الدوحة، مخبز قرب الخريطيات، حلويات للمناسبات أم صلال، حلويات للطلبات الخارجية شمال الدوحة، حلويات عربية أصلية الخريطيات، صناديق حلويات مخصصة أم صلال محمد، شوكولاتة فاخرة شمال الدوحة، سلوى، الدوحة، كاثاري، طعام، رائج، الأفضل، فطائر، دبس";

function appendKeywords(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        appendKeywords(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const metaKeywordsRegex = /<meta\s+name="keywords"\s+content="([^"]*)"\s*\/?>/i;
      const match = content.match(metaKeywordsRegex);
      
      if (match) {
        let existingKeywords = match[1];
        if (!existingKeywords.includes("حلويات عربية قريبة مني")) {
          const updatedKeywords = existingKeywords + arabicKeywords;
          const newMeta = `<meta name="keywords" content="${updatedKeywords}">`;
          content = content.replace(match[0], newMeta);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Appended Arabic keywords to ${fullPath}`);
        }
      }
    }
  }
}

appendKeywords('.');
