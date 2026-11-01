// Arabic fallback copy for the public catalogue captured 2026-11-01.
// Explicit admin translations win; changed source descriptions are never silently reused.
(function (root) {
  const entries = {
  "Mini Sandwich": {
    "name": "ميني ساندويتش",
    "description": "ساندويتشات صغيرة؛ الحجم الصغير يُعبأ في طبق والكبير في علبة.",
    "sourceDescription": "Mini sandwich, a bite-sized treat. Small size packed in plate, big size in box"
  },
  "Eclair Mix Box": {
    "name": "علبة إكلير مشكل",
    "description": "تشكيلة إكلير وكرات الجبن مع اللوتس والتوفي وكريمة حلا فقا.",
    "sourceDescription": "Eclair mix box cheese ball mixed with lotus, toffee and hala faga cream."
  },
  "Crackers Mix": {
    "name": "كراكرز مشكل",
    "description": "علبة كراكرز مشكلة مع التوفي واللوز والشوكولاتة وجوز البيكان.",
    "sourceDescription": "A box of crackers mix with Toffee, almond and chocolate with pecan nuts"
  },
  "Crispy Mix": {
    "name": "كريسبي مشكل",
    "description": "علبة أرز مقرمش مع المارشميلو وكيندر.",
    "sourceDescription": "A box of rice crispy, marshmallow and kinder"
  },
  "Mini Victoria Cake": {
    "name": "ميني كيك فيكتوريا",
    "description": "كيك زبدة طري بطبقات من كريمة الجبن، مغطى بالفراولة الطازجة.",
    "sourceDescription": "A moist and tender butter cake layered with rich tangy cheese cream, finished with sweet and fresh strawberries on top"
  },
  "Baklava": {
    "name": "بقلاوة",
    "description": "تواصل مع الفرع للاستفسار عن تفاصيل هذا الصنف.",
    "sourceDescription": "T"
  },
  "Eclair Bites": {
    "name": "لقيمات الإكلير",
    "description": "كرات إكلير بحشوة كاسترد كريمية وتغطية بالفستق وكيندر ونوتيلا.",
    "sourceDescription": "Eclair balls with creamy custard and glazed with rich pistachio,Smooth kinder and classic nutella."
  },
  "Cheezy Rolls With Sweet Sauces": {
    "name": "رولات الجبن مع صلصات حلوة",
    "description": "٣٠ قطعة من الرولات المحشوة بالجبن، مع صلصات الفستق ونوتيلا والتمر وشوكولاتة الحليب.",
    "sourceDescription": "30 pieces  Cheese stuffed rolls with pistachio dip, Nutella dip, Dates Dip and Milk Chocolate Dip"
  },
  "Rangeena Thamer": {
    "name": "رنجينة ثامر",
    "description": "حلوى رنجينة ثامر التقليدية.",
    "sourceDescription": "Traditional sweet treat called Rangeena Thamer."
  },
  "Wafer Chocolate Cake": {
    "name": "كيك الشوكولاتة بالويفر",
    "description": "كيك شوكولاتة كريمي مع الويفر.",
    "sourceDescription": "Creamy Chocolate cake with wafer"
  },
  "Oreo Truffle": {
    "name": "ترافل أوريو",
    "description": "ترافل محضر ببسكويت أوريو.",
    "sourceDescription": "Truffle made with Oreo cookies."
  },
  "Fruit Cheesecake": {
    "name": "تشيز كيك بالفواكه",
    "description": "تشيز كيك مغطى بتشكيلة من الفواكه الطازجة.",
    "sourceDescription": "Cheesecake topped with a variety of fresh fruits"
  },
  "Chocolate Crunchy": {
    "name": "شوكولاتة كرانشي",
    "description": "قطع شوكولاتة صغيرة ومقرمشة.",
    "sourceDescription": "Mini chocolate crunchy"
  },
  "Pistachio Kunafa Truffle": {
    "name": "ترافل كنافة بالفستق",
    "description": "كنافة محمصة ممزوجة بكريمة الفستق ومغطاة بشوكولاتة الحليب.",
    "sourceDescription": "Toasted kunafa mixed with pistachio cream and covered by milk chocolate"
  },
  "Thamariya": {
    "name": "ثمارية",
    "description": "حلوى تقليدية.",
    "sourceDescription": "Traditional sweet treat."
  },
  "Galaxy Mix": {
    "name": "جالاكسي مشكل",
    "description": "تشكيلة من حلويات جالاكسي.",
    "sourceDescription": "Assorted mix of galaxy-themed treats."
  },
  "Jullash Mix Box": {
    "name": "علبة جلاش مشكل",
    "description": "علبة تضم تشكيلة من حلويات الجلاش.",
    "sourceDescription": "Box with a mix of Jullash treats."
  },
  "Basbousa Caramel": {
    "name": "بسبوسة بالكراميل",
    "description": "بسبوسة بنكهة الكراميل.",
    "sourceDescription": "Basbousa cake with caramel flavor."
  },
  "Basbousa Mix": {
    "name": "بسبوسة مشكلة",
    "description": "بسبوسة تقليدية بنكهات متنوعة.",
    "sourceDescription": "Traditional Basbousa with a mix of flavors."
  },
  "Deccan Chocolate": {
    "name": "شوكولاتة ديكان",
    "description": "شوكولاتة غنية من منطقة ديكان.",
    "sourceDescription": "Rich chocolate from the Deccan region."
  },
  "Salt Biscuit": {
    "name": "بسكويت مالح",
    "description": "بسكويت بنكهة مالحة.",
    "sourceDescription": "Biscuits with a salty flavor."
  },
  "Mamoul Mix": {
    "name": "معمول مشكل",
    "description": "معمول عربي مشكل بالفستق والتمر واللوز والجوز.",
    "sourceDescription": "Arabic mamoul mixed with pisthachio, Dates, Almond and walnut"
  },
  "Crunchy Camel Eye": {
    "name": "عين الجمل المقرمشة",
    "description": "حلوى مقرمشة على شكل عين الجمل.",
    "sourceDescription": "Crunchy treat resembling camel eyes."
  },
  "Milky Beatifor": {
    "name": "بيتي فور بالحليب",
    "description": "بيتي فور بنكهات الحليب المتنوعة: الفستق والبندق والزعفران واللوتس والفراولة.",
    "sourceDescription": "Beatifor with different milky flavors-Pistachio, Hazelnut, saffron, lotus and strawberry"
  },
  "Nutella Exotic Tart Box": {
    "name": "علبة تارت نوتيلا إكزوتيك",
    "description": "علبة تارت إكزوتيك بنكهة نوتيلا.",
    "sourceDescription": "Box of exotic tarts with Nutella flavor."
  },
  "Pistachio Cake": {
    "name": "كيك الفستق",
    "description": "كيك بطبقات طرية بالفستق المحمص، وكريمة الفستق ورشة من الفستق المجروش.",
    "sourceDescription": "Indulge in the heavenly allure of our Pistachio Cake, with moist layers infused with roasted pistachios, luscious pistachio cream frosting, and a sprinkle of crushed pistachios."
  },
  "Milky Basbousa": {
    "name": "بسبوسة بالحليب",
    "description": "بسبوسة بنكهة الحليب الكريمية.",
    "sourceDescription": "Basbousa with a creamy milk flavor."
  },
  "Kuwaiti Biscuits": {
    "name": "بسكويت كويتي",
    "description": "بسكويت كويتي تقليدي.",
    "sourceDescription": "Traditional Kuwaiti biscuits."
  },
  "Nuts Chocolate": {
    "name": "شوكولاتة بالمكسرات",
    "description": "شوكولاتة بنكهات متنوعة مع المكسرات.",
    "sourceDescription": "Flavored chocolates with nuts."
  },
  "Nutella Cake Box": {
    "name": "علبة كيك نوتيلا",
    "description": "علبة كيك بنكهة نوتيلا.",
    "sourceDescription": "Box of cakes with Nutella flavor."
  },
  "Pistachio Basbousa": {
    "name": "بسبوسة بالفستق",
    "description": "بسبوسة شرقية محضرة بالفستق.",
    "sourceDescription": "Middle Eastern sweet cake made with pistachios."
  },
  "Lotus Basbousa": {
    "name": "بسبوسة اللوتس",
    "description": "سميد، زبدة، سكر، معجون اللوتس، حليب، بيكنج باودر، بيض وفانيليا.",
    "sourceDescription": "Semolina, butter, sugar, lotus paste, milk, baking powder, eggs, vanilla"
  },
  "Pomegranate Biscuits": {
    "name": "بسكويت بالرمان",
    "description": "بسكويت بنكهة الرمان.",
    "sourceDescription": "Biscuits flavored with pomegranate."
  },
  "Lokmat El Kadi": {
    "name": "لقمة القاضي",
    "description": "١ كيلوغرام.",
    "sourceDescription": "1 Kilo."
  },
  "Luqimat Molasses Dates": {
    "name": "لقيمات بدبس التمر",
    "description": "لقيمات حلوة بالتمر مغطاة بالدبس.",
    "sourceDescription": "Sweet dates-based Luqimat drizzled with molasses."
  },
  "Mini Cheese Cake Round": {
    "name": "ميني تشيز كيك دائري",
    "description": "تشكيلة ميني تشيز كيك بنكهات متنوعة.",
    "sourceDescription": "Mini cheese cake with different flavors mix"
  },
  "Brownish Mix Box": {
    "name": "علبة براونيش مشكلة",
    "description": "علبة تضم تشكيلة من الحلويات ذات اللون البني.",
    "sourceDescription": "Box with a mix of brown-colored treats."
  },
  "cake lotus": {
    "name": "كيك اللوتس",
    "description": "كيك اللوتس بحشوة كريمة اللوتس الغنية.",
    "sourceDescription": "Lotus cake filling with rich lotus cream."
  },
  "Raffaello Cake": {
    "name": "كيك رافايلو",
    "description": "كيك إسفنجي، كريمة جوز الهند، حليب مكثف، شرائح لوز، شوكولاتة بيضاء، زبدة ومسحوق كاكاو.",
    "sourceDescription": "Sponge cake, coconut cream, condensed milk, almond slivers, white chocolate, butter, cocoa powder"
  },
  "Red Velvet Cake": {
    "name": "كيك ريد فيلفت",
    "description": "كيك ريد فيلفت كلاسيكي بحشوة كريمة الجبن.",
    "sourceDescription": "Classical red velvet cake filling with cheese cream."
  },
  "Cake Oreo": {
    "name": "كيك أوريو",
    "description": "كيك أوريو محشو بالكريمة.",
    "sourceDescription": "Oreo cake filled with cream"
  },
  "Cake Pistachio": {
    "name": "كيك بالفستق",
    "description": "كيك طري بنكهة الفستق الغنية، مناسب للمناسبات المختلفة.",
    "sourceDescription": "Delicate pistachio-flavored cake with a rich nutty taste and tender crumb. A sophisticated dessert perfect for any occasion."
  },
  "Cake Tiramisu": {
    "name": "كيك تيراميسو",
    "description": "كيك تيراميسو بوزن يزيد على كيلوغرام، بطبقات إسفنجية مشبعة بالقهوة وحشوة كريمة ورشة من مسحوق الكاكاو.",
    "sourceDescription": "Indulge in our decadent Tiramisu cake weighing over 1 kg. This rich dessert features delicate layers of coffee-soaked sponge and cream filling topped with a dusting of cocoa powder"
  },
  "Cake Mango": {
    "name": "كيك المانجو",
    "description": "كيك بالمانجو مع طبقات من الكريمة أو التغطية الحلوة.",
    "sourceDescription": "A delectable cake made with Mango, often layered with cream or frosting"
  },
  "Cake Blueberry": {
    "name": "كيك التوت الأزرق",
    "description": "كيك بنكهة التوت الأزرق.",
    "sourceDescription": "Blueberry-flavored cake."
  },
  "Chocolate Cake": {
    "name": "كيك الشوكولاتة",
    "description": "كيك شوكولاتة بحشوة شوكولاتة غنية.",
    "sourceDescription": "Chocolate cake with rich chocolate filling"
  },
  "Half Half Cake": {
    "name": "كيك نصف ونصف",
    "description": "نصف شوكولاتة ونصف فانيليا.",
    "sourceDescription": "Half chocolate and half vanilla"
  },
  "Fruits Cake": {
    "name": "كيك الفواكه",
    "description": "دقيق، فواكه، بيكنج باودر، بيكربونات الصوديوم، ملح، زبدة، سكر، بيض، فانيليا وحليب.",
    "sourceDescription": "flour, fruits, baking powder, baking soda, salt, butter, sugar, eggs, vanilla and milk"
  },
  "Anood": {
    "name": "عنود",
    "description": "٢٤ قطعة.",
    "sourceDescription": "24 pieces"
  },
  "Cream Shariya": {
    "name": "شعيرية بالكريمة",
    "description": "حلوى كريمية بلمسة من الشعيرية.",
    "sourceDescription": "Creamy dessert with a Shariya twist."
  },
  "Dates Box Mix": {
    "name": "علبة تمر مشكل",
    "description": "تمر محشو بالمكسرات.",
    "sourceDescription": "Dates stuffed with nuts"
  },
  "Snickers Chocolate": {
    "name": "شوكولاتة سنيكرز",
    "description": "شوكولاتة بالفول السوداني والكراميل والنوغا، مغطاة بالشوكولاتة.",
    "sourceDescription": "Popular chocolate bar with peanuts, caramel and nougat covered in chocolate."
  },
  "Galaxy Chocolate": {
    "name": "شوكولاتة جالاكسي",
    "description": "شوكولاتة بتصاميم فنية مستوحاة من الأجرام السماوية.",
    "sourceDescription": "Artistic celestial-patterned chocolate"
  },
  "Mix Cheesecake": {
    "name": "تشيز كيك مشكل",
    "description": "تشكيلة من نكهات التشيز كيك.",
    "sourceDescription": "Assorted cheesecake flavors"
  },
  "Petit Four Mix": {
    "name": "بيتي فور مشكل",
    "description": "بيتي فور بنكهات متنوعة.",
    "sourceDescription": "Mixed flavored petit four"
  },
  "Cheesecake Pops": {
    "name": "كرات التشيز كيك",
    "description": "كرات تشيز كيك مغطاة بتشكيلة من الكريمات.",
    "sourceDescription": "Cheesecake pops topped with variety of creams."
  },
  "Ultimate Mini Tart Box": {
    "name": "علبة ميني تارت متنوعة",
    "description": "تشكيلة من تارت نوتيلا إكزوتيك، وميني تارت الفواكه، وتارت الكنافة بالفستق، وتارت كيندر المقرمش.",
    "sourceDescription": "Ultimate tart box with exotic nutella tart, mini fruit tart, pistachio kunafa tart, and crunchy kinder tart."
  },
  "Cheese Bread": {
    "name": "خبز بالجبن",
    "description": "خبز مع الجبن.",
    "sourceDescription": "bread with cheese"
  },
  "Fatayer": {
    "name": "فطاير",
    "description": "معجنات شرقية مالحة؛ الحجم الصغير يُعبأ في طبق والكبير في علبة.",
    "sourceDescription": "Traditional middle eastern savory pastry, small size packet in plate, big size in box"
  },
  "Mini French Sandwich": {
    "name": "ميني ساندويتش فرنسي",
    "description": "ساندويتشات صغيرة على الطريقة الفرنسية.",
    "sourceDescription": "Small French-style sandwiches."
  },
  "Saj Roll Platter": {
    "name": "طبق رولات الصاج",
    "description": "طبق يضم تشكيلة من رولات الصاج.",
    "sourceDescription": "Platter with various Saj roll options."
  },
  "Chef Special Chicken Sandwich": {
    "name": "ساندويتش دجاج الشيف الخاص",
    "description": "٢٠ قطعة مشكلة من دجاج المسخن وفاهيتا الدجاج وسلطة الدجاج وشاورما الدجاج، مع رقائق بطاطس إضافية.",
    "sourceDescription": "20 pieces mixed pieces of musakhan chicken, fajitas chicken, salad chicken, chicken shawarma with extra chips"
  },
  "Fried Ball Sandwich": {
    "name": "ساندويتش الكرات المقلية",
    "description": "ساندويتش بكرات مقلية ومقرمشة.",
    "sourceDescription": "Sandwich with crispy fried balls."
  },
  "Tortilla Rolls With Chips": {
    "name": "رولات التورتيلا مع رقائق البطاطس",
    "description": "رولات تورتيلا تقدم مع رقائق البطاطس.",
    "sourceDescription": "Tortilla rolls served with chips."
  },
  "Mini Bites": {
    "name": "ميني بايتس",
    "description": "قطع صغيرة من أصناف متنوعة.",
    "sourceDescription": "Small-sized bites of assorted treats."
  },
  "Croissant Sandwich": {
    "name": "ساندويتش كرواسون",
    "description": "دقيق، ماء، خميرة، ملح، سكر، زبدة، حليب وبيض.",
    "sourceDescription": "Flour, Water, Yeast, Salt, Sugar, Butter, Milk and Egg"
  },
  "Vine Leaves": {
    "name": "ورق عنب",
    "description": "ورق عنب يضيف نكهة متوسطية إلى وجبتكم.",
    "sourceDescription": "Add a touch of Mediterranean flavor to your meals with our delicious Vine Leaves."
  },
  "Brown Sandwich": {
    "name": "ساندويتش بني",
    "description": "الحجم الصغير يُعبأ في طبق والكبير في علبة.",
    "sourceDescription": "Small size packet box in plate, big size in box"
  },
  "Fancy Fatayer": {
    "name": "فطاير فاخرة",
    "description": "تشكيلة فاخرة من المعجنات الشرقية.",
    "sourceDescription": "Premium version of Middle Eastern pastries."
  },
  "Musakhan": {
    "name": "مسخن",
    "description": "دجاج طري متبل بمزيج من البهارات، مع البصل المكرمل والخبز.",
    "sourceDescription": "Tender chicken marinated in blend of spices, caramelized onions and fragrant bread."
  },
  "Fathair mix siniya": {
    "name": "صينية فطاير مشكلة",
    "description": "تشكيلة من الفطاير تقدم في صينية.",
    "sourceDescription": "Mixed Fathair (a type of pastry) in a siniya dish."
  },
  "London Cake": {
    "name": "كيك لندن",
    "description": "كيك لندن الطري، بطابع بريطاني كلاسيكي ومذاق غني ومتوازن. مناسب للاحتفالات وشاي العصر أو للاستمتاع بقطعة حلوة.",
    "sourceDescription": "London Cake â€“ A Taste of London in Every Bite\r\n\r\nIndulge in our delicious London Cake, freshly baked to bring a touch of classic British charm to your table. Soft, moist, and beautifully crafted, every bite offers a delightful balance of rich flavor and sweetness. Perfect for celebrations, afternoon tea, or simply treating yourself to something special.\r\n\r\nâœ¨ Freshly baked â€¢ Soft & delicious â€¢ Perfect for every occasion"
  }
};
  function localize(product) {
    const copy = entries[product.name];
    if (!copy) return product;
    return { ...product, name_ar: product.name_ar || copy.name, description_ar: product.description_ar || (String(product.description || '') === copy.sourceDescription ? copy.description : '') };
  }
  if (typeof module === 'object' && module.exports) module.exports = { localize };
  else root.cathareiArabicCatalogue = { localize };
})(typeof window === 'object' ? window : globalThis);
