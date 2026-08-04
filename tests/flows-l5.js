'use strict';
/* مسارات الطالب في الدرس 05: تُكتب مرّة وتُستعمل في كل اختبار يحتاج
   الوصول إلى محطة متقدّمة. المسار يمشي كما يمشي الطالب — بالنقر
   والكتابة — لا بنداء دوالّ داخلية. */

const h = require('./harness');

function chip(doc, value){
  const c = doc.querySelector('.chip[data-value="' + value + '"]');
  if(!c) throw new Error('رقاقة غير موجودة: ' + value);
  return c;
}
function put(doc, value, slotId){
  h.selectChip(chip(doc, value));
  h.clickNode(doc.getElementById(slotId));
}

const flows = {
  // المحطة 1: رسم النقاط الثلاث ثم التنبّؤ
  s1(doc, predict){
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.choose(doc, '#predictOptions', predict || 'p3');
  },

  // المحطة 2: تحرير الإلكترونات الستّة ثم الأسئلة الأربعة ثم التسمية
  s2(doc){
    doc.querySelectorAll('#stage2 .epos.clickable').forEach(e => h.clickNode(e));
    ['naIon', 'whereElectron', 'neutral', 'repulsion']
      .forEach(q => h.choose(doc, q, 'correct'));
    h.click(doc, 's2nameBtn');
  },

  // المحطة 3: سؤال الكرات ثم تصنيف حدود النموذجين
  s3(doc){
    h.choose(doc, 'greySpheres', 'correct');
    put(doc, 'أيونات فلزّية موجبة الشحنة', 'lim-31');
    put(doc, 'إلكترونات حرّة الحركة', 'lim-31');
    put(doc, 'شبكة بلّورية فلزّية ثلاثية الأبعاد', 'lim-30');
    put(doc, 'التجاذب بين أيونات الفلزّ والإلكترونات الحرّة', 'lim-none');
  },

  // المحطة 4: بناء بحرَي النحاس والألومنيوم والسؤالان والنمط
  s4(doc){
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    h.type(doc, 'cu100Input', '200'); h.click(doc, 'cu100Btn');
    h.type(doc, 's4cInput', '9'); h.click(doc, 's4cCheck');
    h.type(doc, 'al100Input', '300'); h.click(doc, 'al100Btn');
    h.choose(doc, 'ratioPattern', 'correct');
  },

  // المحطة 5: البطارية والتسخين والسؤالان والطهي والاستخدامات والكبريت
  s5(doc){
    h.click(doc, 's5connect');
    h.choose(doc, 'whatMoves', 'correct');
    h.click(doc, 's5warm');
    h.choose(doc, 'heat', 'correct');
    h.type(doc, 'cookInput',
      'الالكترونات حرة الحركة تنقل الطاقة الحرارية بسرعة وبدونها تنتقل ببطء فيصير الطهي اطول');
    h.click(doc, 'cookBtn');
    put(doc, 'قاع القِدر على النار', 'use-heat');
    put(doc, 'صينية الفرن المعدنية', 'use-heat');
    put(doc, 'أسلاك التمديدات في المنزل', 'use-elec');
    put(doc, 'الأجزاء المعدنية داخل المقبس', 'use-elec');
    h.choose(doc, 'sulfur', 'correct');
  },

  // المحطة 6: المقارنة والانزلاق والطرق والجدول والتحدّي
  s6(doc, withBonus){
    h.choose(doc, 'naVsMg', 'correct');
    h.click(doc, 's6keyboard');
    h.choose(doc, 'malleable', 'correct');
    put(doc, 'الصلابة', 'prop-strong');
    put(doc, 'درجة الانصهار المرتفعة', 'prop-strong');
    put(doc, 'التوصيل الحراري', 'prop-free');
    put(doc, 'التوصيل الكهربائي', 'prop-free');
    put(doc, 'قابلية الطرق والسحب', 'prop-slide');
    if(withBonus !== false){
      ['Li₂O', 'LiF', 'MgO', 'MgF₂'].forEach(v => put(doc, v, 'trio-ionic'));
      ['O₂', 'F₂'].forEach(v => put(doc, v, 'trio-cov'));
      ['Li', 'Mg'].forEach(v => put(doc, v, 'trio-metal'));
    }
  },

  // المحطة 7: بوابة الاسم ثم الأسئلة العشرة
  s7(doc, name, wrong){
    h.type(doc, 'evalName', name || 'طالب');
    h.click(doc, 'evalStart');
    ['e1', 'e2', 'e3', 'e4', 'e7', 'e8', 'e9', 'e10'].forEach(q => {
      h.choose(doc, q, (wrong && wrong.indexOf(q) >= 0) ? 'w1' : 'correct');
    });
    h.type(doc, 'e5Input', (wrong && wrong.indexOf('e5') >= 0)
      ? 'لا اعرف'
      : 'لان فيها الكترونات حرة الحركة تتحرك وتحمل الشحنة الكهربائية');
    h.click(doc, 'e5Btn');
    h.type(doc, 'e6Input', (wrong && wrong.indexOf('e6') >= 0) ? '50' : '100');
    h.click(doc, 'e6Btn');
  },

  // كل المحطات بالترتيب
  all(doc){
    flows.s1(doc); flows.s2(doc); flows.s3(doc);
    flows.s4(doc); flows.s5(doc); flows.s6(doc);
  }
};

module.exports = { flows, put, chip };
