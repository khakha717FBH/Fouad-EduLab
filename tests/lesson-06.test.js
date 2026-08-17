'use strict';
/* ==========================================================
   اختبارات الدرس 06 — سلوك الدرس كما يراه الطالب
   ----------------------------------------------------------
   تُكتب على ما يفعله الطالب ويراه، لا على البنية الداخلية.

   ملاحظة رصيد: مجموع نقاط المسار الأساسي هنا هو 222 (لا 227) —
   جدول ملخّص الخريطة النصّية أعلن للمحطة 4 المجموع 38 بالخطأ؛
   مجموع نقاط أسئلتها الفعلية (5+10+5+5+8) هو 33. الرقم أدناه
   مشتقّ من محتوى الدرس الفعلي، وهو المُثبَّت هنا بالاختبار.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');
const guards = require('./guards');

const LESSON = 'semester-1/unit-01/lesson-06.html';
const BASE_XP = 222;   // 8 + 60 + 16 + 33 + 60 + 45 + 0
const BONUS_XP = 8;    // l6-graphite

async function page(opts){
  const s = await h.loadLesson(LESSON, opts);
  s.certCalls = [];
  s.w.Certificate = { finish: function(){ s.certCalls.push([].slice.call(arguments)); } };
  return s;
}

function hidden(doc, id){ return doc.getElementById(id).hidden; }

/* تُنفَّذ كل الأسئلة والمهامّ بمسار «صحيح مباشرة» — مسار انحدار
   شامل يمنع أن يتعطّل تدفّق محطة بسبب تعديل في أخرى. */
async function completeAll(s){
  const { doc, w } = s;

  doc.querySelector('#s1predictOptions input[value="water"]').click();
  h.choose(doc, 'bondTypes', 'correct');

  h.click(doc, 's2aHeatBtn'); await h.tick(w, 30);
  h.choose(doc, 'meltQ', 'correct'); h.choose(doc, 'stateQ', 'correct');
  h.choose(doc, 'waterPredict', 'yes');
  ['nacl-solid', 'cacl2-solid', 'wax', 'al', 'cu', 'water'].forEach(function(k){
    doc.querySelector('#s2bSamples [data-sample="' + k + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  });
  ['sol-nacl', 'sol-cacl2', 'sol-wax'].forEach(function(k){
    doc.querySelector('#s2cSamples [data-sample="' + k + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  });
  h.choose(doc, 'paradoxQ', 'correct'); h.choose(doc, 'dissolveQ', 'correct');

  doc.querySelector('#s3predictOptions input[value="p3"]').click();
  h.click(doc, 's3HeatBtn'); await h.tick(w, 30);
  h.choose(doc, 'znWhen', 'correct');
  h.type(doc, 'znExplainInput', 'الأيونات صارت حرّة الحركة عند الانصهار');
  h.click(doc, 'znExplainBtn');

  h.choose(doc, 'breakIonic', 'correct');
  h.click(doc, 's4IceHeatBtn'); await h.tick(w, 30);
  h.choose(doc, 'iceWhatBroke', 'correct');
  h.choose(doc, 'imfStrength', 'correct');
  h.type(doc, 'compareExplainInput', 'القوى الجزيئية البينية ضعيفة بين الجزيئات');
  h.click(doc, 'compareExplainBtn');

  const ions = doc.querySelectorAll('#stage5lattice .lattice-ion');
  for(let i = 0; i < 3; i++) ions[i].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  h.choose(doc, 'latticeQ', 'correct');
  h.click(doc, 's5MeltBtn'); await h.tick(w, 30);
  h.choose(doc, 'solutionQ', 'correct');
  h.click(doc, 's5ConnectBtn');
  h.choose(doc, 'metalCarrier', 'correct'); h.choose(doc, 'metalSolid', 'correct');
  h.type(doc, 'covalentWhyInput', 'لا تحتوي على أيونات ولا إلكترونات حرّة');
  h.click(doc, 'covalentWhyBtn');
  h.choose(doc, 'closeLoop', 'correct');

  [['كلوريد المغنيسيوم', 'cat-ionic'], ['أكسيد البوتاسيوم', 'cat-ionic'],
   ['الأكسجين', 'cat-covalent'], ['الكلور', 'cat-covalent'],
   ['الذهب', 'cat-metal'], ['التيتانيوم', 'cat-metal']].forEach(function(pair){
    const chip = Array.from(doc.querySelectorAll('.chips-pool .chip')).find(function(c){ return c.dataset.value === pair[0]; });
    const slot = doc.getElementById(pair[1]);
    h.selectChip(chip);
    slot.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  });
  h.choose(doc, 'etheneBond', 'correct');
  h.choose(doc, 'etheneState', 'correct');
  h.choose(doc, 'etheneConduct', 'correct');
  h.choose(doc, 'graphiteQ', 'correct');

  h.type(doc, 'evalName', 'طالب تجريبي');
  h.click(doc, 'evalStart');
  ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'].forEach(function(n){ h.choose(doc, n, 'correct'); });
  h.type(doc, 'e9Input', 'كلوريد الصوديوم');
  h.click(doc, 'e9Btn');
  h.type(doc, 'e10Input', 'المركّب لم ينصهر بعد فالأيونات لم تكن حرّة الحركة');
  h.click(doc, 'e10Btn');
  await h.tick(w, 30);
}

/* ---------- الهيكل ---------- */
describe('درس 06 — الهيكل والوسوم', function(){
  it('يُحمّل بلا أي خطأ JS', async function(){
    const { logs } = await page();
    eq(logs.length, 0, logs.join(' | '));
  });

  it('سبع محطات وسبع نقاط تقدّم، والعدّاد يقرأ «من 7»', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('.station').length, 7);
    eq(doc.querySelectorAll('.progress-dot').length, 7);
    has(doc.querySelector('.station-counter').textContent, '7');
  });

  it('وسوم المشترك تسبق سكربت الدرس، وسكربت الدرس يسبق نصوص المحطات', async function(){
    const { raw } = await page();
    const iXp = raw.indexOf('xp-system/xp.js');
    const iTpl = raw.indexOf('template-boilerplate/template.js');
    const iCert = raw.indexOf('certificate-system/certificate.js');
    const iLesson = raw.indexOf('نصوص المحطات كلّها');
    ok(iXp < iTpl, 'xp.js يجب أن يسبق template.js');
    ok(iTpl < iLesson, 'template.js يجب أن يسبق سكربت الدرس');
    ok(iCert > 0, 'الشهادة غير مربوطة');
  });

  it('كل سؤال في الوسم مسجَّل — لا سؤال صامت، ولا مخرج نجاة مفقود', async function(){
    const { logs, doc } = await page();
    eq(logs.filter(function(l){ return /بلا تسجيل/.test(l); }).length, 0);
    eq(logs.filter(function(l){ return /بلا مخرج نجاة/.test(l); }).length, 0);
    eq(doc.querySelectorAll('.quiz-options[data-q]').length, 26);
  });

  it('لا معرّفات مكرّرة في الصفحة', async function(){
    const { doc } = await page();
    const seen = {};
    let dup = null;
    doc.querySelectorAll('[id]').forEach(function(el){
      if(seen[el.id]) dup = el.id;
      seen[el.id] = true;
    });
    eq(dup, null, 'معرّف مكرّر: ' + dup);
  });

  it('لا نقاط بمجرّد التحميل، والمحطات السبع كلّها مفتوحة (تنقّل حرّ، لا حجب)', async function(){
    const { doc, w } = await page();
    eq(w.XP.total(), 0);
    for(let i = 1; i <= 7; i++){
      const sec = doc.getElementById('station-' + i);
      no(sec.hidden, 'المحطة ' + i + ' محجوبة');
      ok(!sec.hasAttribute('hidden'), 'المحطة ' + i + ' تحمل سمة hidden');
    }
  });

  it('عنصر تحفيز الشهادة موجود (لمنع تصادمه مع زرّ فهيم)', async function(){
    const { doc } = await page();
    ok(doc.getElementById('certTriggerSlot'));
  });
});

/* ---------- محطة 1 ---------- */
describe('المحطة 1 — التنشيط', function(){
  it('التنبّؤ لا يُصحَّح: أوّل اختيار يفتح سؤال الرابطة بلا حكم صواب أو خطأ', async function(){
    const { doc } = await page();
    ok(hidden(doc, 's1bondBox'));
    doc.querySelector('#s1predictOptions input[value="copper"]').click();
    no(hidden(doc, 's1bondBox'));
    has(doc.getElementById('fb-s1predict').textContent, 'لن نخبرك الآن');
  });

  it('إجابة خاطئة عن نوع الروابط تُظهر تلميحًا ولا تمنح نقاطًا، والصحيحة تمنح 3+5=8', async function(){
    const { doc, w } = await page();
    doc.querySelector('#s1predictOptions input[value="water"]').click();
    h.choose(doc, 'bondTypes', 'w2');
    has(doc.getElementById('fb-bondTypes').textContent, 'النحاس عنصر فلزّي واحد');
    eq(w.XP.total(), 3);
    h.choose(doc, 'bondTypes', 'correct');
    eq(w.XP.total(), 8);
    no(hidden(doc, 's1done'));
  });
});

/* ---------- محطة 2 ---------- */
describe('المحطة 2 — المختبر (مرحلتان بنقطة تقدّم واحدة)', function(){
  it('المرحلة ب لا تظهر قبل إكمال أسئلة مرحلة التسخين، وتظهر تلقائيًّا بعدها', async function(){
    const { doc, w } = await page();
    h.click(doc, 's2aHeatBtn');
    await h.tick(w, 30);
    no(hidden(doc, 's2aQBox'));
    ok(hidden(doc, 's2b'));
    h.choose(doc, 'meltQ', 'correct');
    ok(hidden(doc, 's2b'), 'لا تظهر المرحلة ب بعد سؤال واحد فقط');
    h.choose(doc, 'stateQ', 'correct');
    no(hidden(doc, 's2b'));
  });

  it('عيّنة الماء المقطَّر مقفلة حتى يُجاب سؤال التنبّؤ الخاصّ بها', async function(){
    const { doc } = await page();
    ok(doc.getElementById('tile-water').disabled);
    h.choose(doc, 'waterPredict', 'yes');
    no(doc.getElementById('tile-water').disabled);
  });

  it('التوصيل يكشف المرحلة ج تلقائيًّا، وإذابة الأملاح تكمل الجدول وتُنهي المحطة بـ 60 نقطة', async function(){
    const s = await page();
    const { doc, w } = s;
    doc.querySelector('#s1predictOptions input[value="water"]').click();
    h.choose(doc, 'bondTypes', 'correct');
    h.click(doc, 's2aHeatBtn'); await h.tick(w, 30);
    h.choose(doc, 'meltQ', 'correct'); h.choose(doc, 'stateQ', 'correct');
    h.choose(doc, 'waterPredict', 'yes');
    ['nacl-solid', 'cacl2-solid', 'wax', 'al', 'cu'].forEach(function(k){
      doc.querySelector('#s2bSamples [data-sample="' + k + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    });
    ok(hidden(doc, 's2c'), 'لا تظهر المرحلة ج قبل اختبار الماء أيضًا');
    doc.querySelector('#s2bSamples [data-sample="water"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    ok(hidden(doc, 's2bWaterMsg'), 'تُطوى رسالة الماء فور اكتمال المرحلة ب وكشف المرحلة ج');
    ok(hidden(doc, 's2bMsg'), 'تُطوى رسالة ملخّص الدائرة فور اكتمال المرحلة ب وكشف المرحلة ج');
    no(hidden(doc, 's2c'));
    ['sol-nacl', 'sol-cacl2', 'sol-wax'].forEach(function(k){
      doc.querySelector('#s2cSamples [data-sample="' + k + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    });
    no(hidden(doc, 's2cWaxNote'));
    h.choose(doc, 'paradoxQ', 'correct'); h.choose(doc, 'dissolveQ', 'correct');
    no(hidden(doc, 's2done'));
    eq(w.XP.total(), 68); // 8 (محطة 1) + 60 (محطة 2)
    eq(doc.getElementById('td-cond-ionic').textContent, 'لا توصّل صلبة، وتوصّل محلولًا');
    eq(doc.getElementById('td-dis-cov').textContent, 'الشمع لا يذوب');
    const recapTables = doc.querySelectorAll('#s2done table.data-table');
    eq(recapTables.length, 1, 'يظهر جدول مستنسخ واحد فقط عند اكتمال المحطة');
    eq(recapTables[0].querySelectorAll('[id]').length, 0, 'لا معرّفات في النسخة المستنسخة إطلاقًا — لتفادي تكرارها في الصفحة');
    ok(doc.getElementById('propTable') !== null, 'الجدول الأصلي في مكانه ولم يُمسّ');
    eq(recapTables[0].querySelectorAll('td.filled').length,
       doc.getElementById('propTable').querySelectorAll('td.filled').length,
       'النسخة المستنسخة مطابقة للجدول الأصلي المكتمل');
    const seenIds = {};
    let dupId = null;
    doc.querySelectorAll('[id]').forEach(function(el){
      if(seenIds[el.id]) dupId = el.id;
      seenIds[el.id] = true;
    });
    eq(dupId, null, 'لا معرّفات مكرّرة بعد ظهور النسخة المستنسخة: ' + dupId);
  });
});

/* ---------- محطة 3 ---------- */
describe('المحطة 3 — عرض كلوريد الخارصين', function(){
  it('الأميتر يبقى 0.00 A أثناء التسخين ويقفز إلى 0.42 A عند الانصهار', async function(){
    const s = await page({ reduceMotion: true });
    const { doc, w } = s;
    doc.querySelector('#s3predictOptions input[value="p3"]').click();
    no(hidden(doc, 's3HeatBtn'));
    h.click(doc, 's3HeatBtn');
    await h.tick(w, 30);
    has(doc.getElementById('stage3').textContent, '0.42 A');
    has(doc.getElementById('stage3').textContent, '290');
  });
});

/* ---------- محطة 4 ---------- */
describe('المحطة 4 — ما الذي ينكسر عند الانصهار', function(){
  it('انصهار الثلج لا يكسر الروابط التساهمية — العصيّ تبقى موجودة، ويظهر مصطلح القوى البينيّة بعد السؤال لا قبله', async function(){
    const s = await page({ reduceMotion: true });
    const { doc, w } = s;
    h.choose(doc, 'breakIonic', 'correct');
    ok(hidden(doc, 'imfTermCard'), 'المصطلح لا يظهر قبل السؤال — التسمية تلحق البناء');
    h.click(doc, 's4IceHeatBtn');
    await h.tick(w, 30);
    eq(doc.querySelectorAll('#stage4ice .covalent-stick').length, 12, 'اثنا عشر رابطة تساهمية (رابطتان × ستّ جزيئات) تبقى سليمة');
    h.choose(doc, 'iceWhatBroke', 'correct');
    no(hidden(doc, 'imfTermCard'));
  });
});

/* ---------- محطة 5 ---------- */
describe('المحطة 5 — من يحمل الشحنة', function(){
  it('يحتاج ثلاثة أيونات مختلفة لإكمال المهمّة، لا محاولات متكرّرة على نفس الأيون', async function(){
    const s = await page({ reduceMotion: true });
    const { doc, w } = s;
    const ions = doc.querySelectorAll('#stage5lattice .lattice-ion');
    const msg = doc.getElementById('s5latticeMsg');
    for(let i = 0; i < 3; i++) ions[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    eq(w.XP.total(), 0, 'محاولات متكرّرة على نفس الأيون لا تُكمل المهمّة ولا تمنح نقاطًا');
    has(msg.textContent, 'جرّب أيونًا آخر', 'رسالة تنبّه لتجربة أيون مختلف بعد التكرار');
    ions[1].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    has(msg.textContent, 'أيونين', 'تحديث حيّ بعد ثاني أيون مختلف');
    eq(w.XP.total(), 0);
    ions[2].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    eq(w.XP.total(), 10, 'اكتملت المهمّة بثلاثة أيونات مختلفة');
    no(hidden(doc, 's5Q1Box'));
    ions[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    eq(w.XP.total(), 10, 'لا تكرار للنقاط بعد محاولات إضافية');
  });

  it('تحريك الشبكة عند الانصهار يتنقّل بعدّة قفزات قبل الاستقرار (بلا تقليل حركة)', async function(){
    const s = await page({ reduceMotion: false });
    const { doc, w } = s;
    const ions = doc.querySelectorAll('#stage5lattice .lattice-ion');
    for(let i = 0; i < 3; i++) ions[i].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    h.choose(doc, 'latticeQ', 'correct');
    h.click(doc, 's5MeltBtn');
    await h.tick(w, 30);
    const posInitial = ions[0].style.transform;
    ok(posInitial, 'قفزة أولى فور النقر');
    ok(hidden(doc, 's5Q2Box'), 'لم تنتهِ الحركة عند القفزة الأولى وحدها');
    await h.tick(w, 520);
    const posHop1 = ions[0].style.transform;
    ok(posHop1 !== posInitial, 'قفزة ثانية تُغيّر الموضع فعليًّا لا تكرر الأولى');
    ok(hidden(doc, 's5Q2Box'), 'لم تنتهِ الحركة بعد القفزة الثانية');
    await h.tick(w, 520);
    const posHop2 = ions[0].style.transform;
    ok(posHop2 !== posHop1, 'قفزة ثالثة تُغيّر الموضع فعليًّا لا تكرر الثانية');
    await h.tick(w, 520);
    no(hidden(doc, 's5Q2Box'), 'تنتهي الحركة بعد القفزات الثلاث وتظهر الرسالة والسؤال التالي');
    ok(doc.getElementById('s5MeltMsg').classList.contains('done'));
  });
});

/* ---------- محطة 6 ---------- */
describe('المحطة 6 — التصنيف والإيثين', function(){
  it('التصنيف الخاطئ يُظهر تلميحًا مركّبًا (رقاقة + خانة) ولا يُقفل الخانة', async function(){
    const { doc } = await page();
    const chip = Array.from(doc.querySelectorAll('.chips-pool .chip')).find(function(c){ return c.dataset.value === 'الذهب'; });
    const wrongSlot = doc.getElementById('cat-ionic');
    h.selectChip(chip);
    wrongSlot.dispatchEvent(new (chip.ownerDocument.defaultView.MouseEvent)('click', { bubbles: true }));
    no(wrongSlot.classList.contains('correct'));
    has(doc.querySelector('[data-chips="classify"] .chips-feedback').textContent, 'الذهب عنصر واحد');
  });

  it('تحدّي الجرافيت اختياري: لا يمنع ظهور زرّ الخروج إن لم يُجَب', async function(){
    const s = await page();
    const { doc, w } = s;
    [['كلوريد المغنيسيوم', 'cat-ionic'], ['أكسيد البوتاسيوم', 'cat-ionic'],
     ['الأكسجين', 'cat-covalent'], ['الكلور', 'cat-covalent'],
     ['الذهب', 'cat-metal'], ['التيتانيوم', 'cat-metal']].forEach(function(pair){
      const chip = Array.from(doc.querySelectorAll('.chips-pool .chip')).find(function(c){ return c.dataset.value === pair[0]; });
      const slot = doc.getElementById(pair[1]);
      h.selectChip(chip);
      slot.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    });
    h.choose(doc, 'etheneBond', 'correct');
    h.choose(doc, 'etheneState', 'correct');
    h.choose(doc, 'etheneConduct', 'correct');
    no(hidden(doc, 's6done'), 'زرّ الخروج يظهر دون الحاجة لحلّ التحدّي الاختياري');
    eq(w.XP.total(), 45); // نقاط المحطة 6 وحدها (30 تصنيف + 15 أسئلة الإيثين)، بلا التحدّي الاختياري
  });
});

/* ---------- محطة 7 والرصيد الكامل ---------- */
describe('المحطة 7 — التقييم الختامي والشهادة، ورصيد المسار الكامل', function(){
  it('إجابة خاطئة تكشف الصحيحة وتشرح السبب، والتقييم محاولة واحدة لكل سؤال', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.choose(doc, 'e1', 'w1');
    has(doc.getElementById('fb-e1').textContent, 'شبكة بلّورية عملاقة');
    ok(doc.querySelector('[name="e1"][value="correct"]').closest('.quiz-option').classList.contains('correct'));
    ok(doc.querySelector('[name="e1"][value="w1"]').disabled, 'محاولة واحدة فقط — الخيارات تُقفل بعد الاختيار');
  });

  it('يقبل السؤال 9 أيّ مركّب أيوني من مفردات الوحدة، ويقبل السؤال 10 صياغات مرادفة', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'أكسيد المغنيسيوم');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
    h.type(doc, 'e10Input', 'لأن الأيونات لم تكن حرّة الحركة إلا بعد الانصهار');
    h.click(doc, 'e10Btn');
    has(doc.getElementById('fb-e10').textContent, '✓');
  });

  it('يقبل السؤال 9 الصيغة الكيميائية أيضًا، بمرونة في الحالة والأرقام السفلية', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'nacl');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
  });

  it('يقبل السؤال 9 صيغة بها رقم سفليّ (CaCl₂)', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'CaCl₂');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
  });

  it('يقبل السؤال 10 وصف حالة التقييد قبل الانصهار (الصياغة المعاكسة)', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'لأن الأيونات مقيدة');
    h.click(doc, 'e10Btn');
    has(doc.getElementById('fb-e10').textContent, '✓');
  });

  it('يرفض السؤال 10 نفي حالة التقييد (الأيونات ليست مقيدة) رغم احتوائها على الكلمة المفتاحية', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'الأيونات ليست مقيدة');
    h.click(doc, 'e10Btn');
    no(hidden(doc, 'fb-e10'));
    has(doc.getElementById('fb-e10').textContent, '✗', 'لا يُقبَل النفي رغم وجود كلمة مقيدة نصًّا');
  });

  it('رصيد المسار الأساسي بالضبط 222، ومع التحدّي الاختياري 230، والشهادة تُنادى بالعنوان الصحيح', async function(){
    const s = await page();
    await completeAll(s);
    eq(s.w.XP.total(), BASE_XP + BONUS_XP);
    eq(s.certCalls.length, 1);
    eq(s.certCalls[0][1], 'كيف تشرح الفرق بين خصائص المركّبات الأيونية والمواد التساهمية والفلزّات؟');
    eq(s.certCalls[0][2], 100);
    no(hidden(s.doc, 'evalSummary'));
  });
});

/* ــــ قواعد أسئلة الاختيار — حرّاس مشتركة (tests/guards.js) ــــ
   القاعدتان منصّيّتان لا خاصّتين بهذا الدرس، فتُقرآن من موضع
   واحد. والعتبات هنا لأنّ الدرس يحتملها لا لأنها القاعدة. */
async function guardDoc(){ return (await page()).doc; }
const api = { describe, it, eq, ok, no, has };
guards.describeMcqRules(api, guardDoc, {
    evalSpread:   { expect: 8, minDistinct: 4, maxAtOne: 2 },
    lessonSpread: { minDistinct: 4 },
    /* e8 أُصلح (17 أغسطس): كان +30 في التقييم المرتبط بالشهادة،
       وعولج بإطالة المشتّتات الثلاثة لا بتقصير الصحيحة. فصار
       الفارق سالبًا، ولا مدخلة له هنا.

       والخمسة الباقية داخل الدرس لا في التقييم — الطالب يرى
       تصحيحها وتفسيرها فورًا. أرقامها سقوفٌ معلنة لا إعفاء:
       يسقط الحارس إن ازدادت. وتُحذف عند إصلاح نصوصها في جلسة
       مراجعة الوحدة 01. */
    lengthGap:    { known: {
      'meltQ': 15, 'paradoxQ': 13, 'breakIonic': 21,
      'etheneConduct': 13, 'graphiteQ': 24
    } }
  });

run();
