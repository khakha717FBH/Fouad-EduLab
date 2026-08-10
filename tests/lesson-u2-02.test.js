'use strict';
/* ==========================================================
   اختبارات الوحدة 02 · الدرس 02 — سلوك الدرس كما يراه الطالب
   ----------------------------------------------------------
   تُكتب على ما يفعله الطالب ويراه، لا على البنية الداخلية.
   الرصيد الأساسي 126 = 3 (م1) + 25 (م2) + 30 (م3) + 43 (م4) + 25 (م5)،
   والاختياري 8 (u2l2-osteoporosis-bonus). مُثبَّت هنا بالاختبار.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-02/lesson-02.html';
const BASE_XP = 126;
const BONUS_XP = 8;

async function page(opts){
  const s = await h.loadLesson(LESSON, opts);
  s.certCalls = [];
  s.w.Certificate = { finish: function(){ s.certCalls.push([].slice.call(arguments)); } };
  return s;
}

function clickNode(doc, w, id){
  doc.getElementById(id).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}

function clickChipInto(doc, w, value, slotId){
  const chip = Array.from(doc.querySelectorAll('.chips-pool .chip'))
    .find(function(c){ return c.dataset.value === value && !c.classList.contains('placed'); });
  if(!chip) throw new Error('رقاقة غير موجودة أو موضوعة مسبقًا: ' + value);
  h.selectChip(chip);
  doc.getElementById(slotId).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}

function exploreBoneStage(doc, w){
  ['g-compact-2', 'g-spongy-2', 'g-marrow-2'].forEach(function(id){ clickNode(doc, w, id); });
}

function matchPartsChips(doc, w){
  [['العظم الكثيف', 's2-slot-compact'], ['العظم الإسفنجي', 's2-slot-spongy'], ['نخاع العظم', 's2-slot-marrow']]
    .forEach(function(pair){ clickChipInto(doc, w, pair[0], pair[1]); });
}

function matchMarrowChips(doc, w){
  [['خلايا الدم الحمراء', 's4-slot-red'], ['خلايا الدم البيضاء', 's4-slot-red'],
   ['الصفائح الدموية', 's4-slot-red'], ['الأنسجة الدهنية', 's4-slot-yellow']]
    .forEach(function(pair){ clickChipInto(doc, w, pair[0], pair[1]); });
}

function matchStoreChips(doc, w){
  [['الكالسيوم', 's5-slot-ca'], ['البوتاسيوم', 's5-slot-k']]
    .forEach(function(pair){ clickChipInto(doc, w, pair[0], pair[1]); });
}

/* تُنفَّذ كل الأسئلة والمهامّ بمسار «صحيح مباشرة» — مسار انحدار شامل */
async function completeAll(s){
  const { doc, w } = s;

  doc.querySelector('#s1PredictOptions input[value="d"]').click();

  exploreBoneStage(doc, w);
  matchPartsChips(doc, w);
  h.choose(doc, 'u2l2-all-solid', 'correct');
  h.choose(doc, 'u2l2-locations', 'correct');

  h.choose(doc, 'u2l2-compact-why', 'correct');
  h.choose(doc, 'u2l2-spongy-why', 'correct');
  h.choose(doc, 'u2l2-spine-pattern', 'correct');
  h.type(doc, 's3DescribeInput', 'مليء بالثقوب ومرن');
  h.click(doc, 's3DescribeBtn');

  h.choose(doc, 'u2l2-close-loop', 'correct');
  matchMarrowChips(doc, w);
  h.choose(doc, 'u2l2-stem', 'correct');
  h.type(doc, 's4NutritionInput', 'لأنه يبني خلايا دم جديدة باستمرار');
  h.click(doc, 's4NutritionBtn');
  h.choose(doc, 'u2l2-alive', 'correct');

  doc.querySelector('#s5PredictOptions input[value="b"]').click();
  h.click(doc, 's5RevealBtn');
  matchStoreChips(doc, w);
  h.choose(doc, 'u2l2-density-pattern', 'correct');
  h.type(doc, 's5BonusInput', 'يضعف قدرته على تحمل الوزن ويصبح اكثر عرضة للكسر');
  h.click(doc, 's5BonusBtn');

  h.type(doc, 'evalName', 'طالب تجريبي');
  h.click(doc, 'evalStart');
  ['u2l2-e1', 'u2l2-e2', 'u2l2-e3', 'u2l2-e4', 'u2l2-e5', 'u2l2-e6', 'u2l2-e7', 'u2l2-e8']
    .forEach(function(n){ h.choose(doc, n, 'correct'); });
  h.type(doc, 'e9Input', 'يدعم الجسم ويحميه');
  h.click(doc, 'e9Btn');
  h.type(doc, 'e10Input', 'الأحمر والأصفر');
  h.click(doc, 'e10Btn');
  await h.tick(w, 30);
}

/* ---------- الهيكل ---------- */
describe('الوحدة 02 · الدرس 02 — الهيكل والوسوم', function(){
  it('يُحمّل بلا أي خطأ JS', async function(){
    const { logs } = await page();
    eq(logs.length, 0, logs.join(' | '));
  });

  it('ستّ محطات وستّ نقاط تقدّم، والعدّاد يقرأ «من 6»', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('.station').length, 6);
    eq(doc.querySelectorAll('.progress-dot').length, 6);
    has(doc.querySelector('.station-counter').textContent, '6');
  });

  it('وسوم المشترك تسبق سكربت الدرس، وسكربت الدرس يسبق نصوص المحطات', async function(){
    const { raw } = await page();
    const iXp = raw.indexOf('xp-system/xp.js');
    const iTemplate = raw.indexOf('template-boilerplate/template.js');
    const iCert = raw.indexOf('certificate-system/certificate.js');
    const iQuiz = raw.indexOf('window.Quiz.practice');
    ok(iXp > 0 && iTemplate > iXp && iCert > iTemplate, 'ترتيب الوسوم الستّة غير صحيح');
    ok(iQuiz > iTemplate, 'سكربت الدرس ينادي Quiz قبل تحميل template.js');
  });

  it('لا محطة محجوبة بـhidden منذ التحميل (التنقّل حرّ بين المحطات)', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.station').forEach(function(s){ no(s.hidden, s.id + ' محجوبة'); });
  });

  it('كل سؤال في الوسم مسجَّل — لا سؤال صامت، ولا مخرج نجاة مفقود', async function(){
    const { logs, doc } = await page();
    eq(logs.filter(function(l){ return /بلا تسجيل/.test(l); }).length, 0);
    eq(logs.filter(function(l){ return /بلا مخرج نجاة/.test(l); }).length, 0);
    eq(doc.querySelectorAll('.quiz-options[data-q]').length, 17);
  });

  it('معرّفات id وdata-q كلّها فريدة عبر الصفحة', async function(){
    const { doc } = await page();
    const ids = Array.from(doc.querySelectorAll('[id]')).map(function(e){ return e.id; });
    eq(new Set(ids).size, ids.length, 'معرّفات id مكرَّرة');
    const dq = Array.from(doc.querySelectorAll('[data-q]')).map(function(e){ return e.getAttribute('data-q'); });
    eq(new Set(dq).size, dq.length, 'قيم data-q مكرَّرة');
  });

  it('certTriggerSlot موجود داخل بطاقة النتيجة', async function(){
    const { doc } = await page();
    ok(doc.getElementById('certTriggerSlot'));
  });
});

/* ---------- محطة 1 ---------- */
describe('المحطة 1 — من أين يأتي الدم الجديد؟', function(){
  it('التنبّؤ غير مُصحَّح: أيّ خيار يمنح نفس التغذية المحايدة ونقاط PREDICT', async function(){
    const { doc, w } = await page();
    doc.querySelector('#s1PredictOptions input[value="a"]').click();
    has(doc.getElementById('fb-s1predict').textContent, 'سجّلنا توقّعك');
    eq(w.XP.total(), 3);
    no(doc.getElementById('s1done').hidden);
  });

  it('لا يُمنح XP مرّتين عند تغيير الاختيار', async function(){
    const { doc, w } = await page();
    doc.querySelector('#s1PredictOptions input[value="a"]').click();
    doc.querySelector('#s1PredictOptions input[value="d"]').click();
    eq(w.XP.total(), 3);
  });
});

/* ---------- محطة 2 ---------- */
describe('المحطة 2 — ماذا يوجد داخل العظم؟ (مشطورة ثلاث مراحل)', function(){
  it('لا تظهر مرحلة التسمية قبل نقر المناطق الثلاث', async function(){
    const { doc, w } = await page();
    ok(doc.getElementById('s2NameStep').hidden);
    clickNode(doc, w, 'g-compact-2');
    clickNode(doc, w, 'g-spongy-2');
    ok(doc.getElementById('s2NameStep').hidden, 'لا تزال محجوبة بعد نقرتين فقط');
    clickNode(doc, w, 'g-marrow-2');
    no(doc.getElementById('s2NameStep').hidden, 'يجب أن تظهر بعد النقرات الثلاث');
  });

  it('خانات المطابقة محجوبة حتى اكتمال الاستكشاف، ثم تظهر الثلاث معًا', async function(){
    const { doc, w } = await page();
    ok(doc.getElementById('s2-slot-compact').hidden);
    exploreBoneStage(doc, w);
    no(doc.getElementById('s2-slot-compact').hidden);
    no(doc.getElementById('s2-slot-spongy').hidden);
    no(doc.getElementById('s2-slot-marrow').hidden);
  });

  it('النقر على منطقة يعرض وصفها لا اسمها', async function(){
    const { doc, w } = await page();
    clickNode(doc, w, 'g-compact-2');
    has(doc.getElementById('boneReadout2').textContent, 'صلب');
    no(/العظم الكثيف/.test(doc.getElementById('boneReadout2').textContent), 'الاسم لا يظهر في مرحلة الاستكشاف');
  });

  it('تمييز آخر جزء يُنقر (اللون التركوازي) يُزال فور اكتمال الاستكشاف الثلاثي', async function(){
    const { doc, w } = await page();
    clickNode(doc, w, 'g-compact-2');
    clickNode(doc, w, 'g-marrow-2');
    clickNode(doc, w, 'g-spongy-2');
    eq(doc.querySelectorAll('#boneStage2 .grp.on').length, 0, 'لا يجب أن يبقى أيّ جزء مميَّزًا بعد اكتمال الاستكشاف');
  });

  it('ثلاث بقع نابضة تدلّ على مواضع النقر، وكل بقعة تخفت بعد نقر منطقتها فقط', async function(){
    const { doc, w } = await page();
    eq(doc.querySelectorAll('#boneStage2 .hotspot').length, 3);
    no(doc.getElementById('hs-compact').classList.contains('done'));
    no(doc.getElementById('hs-spongy').classList.contains('done'));
    clickNode(doc, w, 'g-compact-2');
    ok(doc.getElementById('hs-compact').classList.contains('done'), 'بقعة القشرة يجب أن تخفت بعد نقرها');
    no(doc.getElementById('hs-spongy').classList.contains('done'), 'بقعة الإسفنجي يجب أن تبقى نابضة');
    no(doc.getElementById('hs-marrow').classList.contains('done'), 'بقعة النخاع يجب أن تبقى نابضة');
  });

  it('كل خطّ ربط يظهر فقط بعد نقر منطقته هو تحديدًا — لا خطوط ظاهرة قبل أي نقر', async function(){
    const { doc, w } = await page();
    const connCompact = doc.querySelector('.connector[data-t="compact"]');
    const connSpongy = doc.querySelector('.connector[data-t="spongy"]');
    const connMarrow = doc.querySelector('.connector[data-t="marrow"]');
    no(connCompact.classList.contains('shown'), 'خطّ القشرة يجب ألّا يظهر قبل أي نقر');
    no(connSpongy.classList.contains('shown'), 'خطّ الإسفنجي يجب ألّا يظهر قبل أي نقر');
    no(connMarrow.classList.contains('shown'), 'خطّ النخاع يجب ألّا يظهر قبل أي نقر');
    clickNode(doc, w, 'g-spongy-2');
    ok(connSpongy.classList.contains('shown'), 'خطّ الإسفنجي يجب أن يظهر بعد نقر منطقته');
    no(connCompact.classList.contains('shown'), 'خطّ القشرة يجب ألّا يظهر قبل نقر منطقته هو');
    no(connMarrow.classList.contains('shown'), 'خطّ النخاع يجب ألّا يظهر قبل نقر منطقته هو');
  });

  it('وصف آخر جزء يُنقر لا يُستبدَل فورًا برسالة الاكتمال — الرسالتان في عنصرين مستقلّين', async function(){
    const { doc, w } = await page();
    clickNode(doc, w, 'g-compact-2');
    clickNode(doc, w, 'g-marrow-2');
    clickNode(doc, w, 'g-spongy-2');
    has(doc.getElementById('boneReadout2').textContent, 'مليء بالثقوب', 'وصف الإسفنجي يجب أن يبقى ظاهرًا بعد آخر نقرة');
    no(doc.getElementById('boneReadoutDone').hidden, 'رسالة الاكتمال يجب أن تظهر في عنصرها المستقلّ');
  });

  it('المسار الكوني للرقاقات (Enter) يعمل، والمطابقة الثلاث تمنح 15 نقطة', async function(){
    const { doc, w } = await page();
    exploreBoneStage(doc, w);
    matchPartsChips(doc, w);
    eq(w.XP.total(), 15);
    no(doc.getElementById('s2FactBox').hidden);
    no(doc.getElementById('s2SolidBox').hidden);
  });

  it('تلميح خانة خاطئة يخاطب سبب الخطأ', async function(){
    const { doc, w } = await page();
    exploreBoneStage(doc, w);
    const chip = Array.from(doc.querySelectorAll('.chips-pool .chip')).find(function(c){ return c.dataset.value === 'العظم الإسفنجي'; });
    h.selectChip(chip);
    doc.getElementById('s2-slot-compact').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    has(doc.querySelector('#station-2 .chips-feedback').textContent, 'الإسفنج');
  });

  it('سؤال «العظم كلّه صلب» يظهر بعد المطابقة، و«الموضع» يظهر بعده', async function(){
    const { doc, w } = await page();
    exploreBoneStage(doc, w);
    matchPartsChips(doc, w);
    ok(doc.getElementById('s2LocBox').hidden);
    h.choose(doc, 'u2l2-all-solid', 'correct');
    no(doc.getElementById('s2LocBox').hidden);
  });

  it('رصيد المحطة الكامل 25، وزرّ الانتقال يظهر في النهاية', async function(){
    const { doc, w } = await page();
    exploreBoneStage(doc, w);
    matchPartsChips(doc, w);
    h.choose(doc, 'u2l2-all-solid', 'correct');
    h.choose(doc, 'u2l2-locations', 'correct');
    eq(w.XP.total(), 25);
    no(doc.getElementById('s2done').hidden);
  });
});

/* ---------- محطة 3 ---------- */
describe('المحطة 3 — لماذا هذا الشكل بالذات؟', function(){
  it('سؤالا القشرة والإسفنجي يظهران معًا، ثمّ النمط، ثمّ الوصف', async function(){
    const { doc } = await page();
    no(doc.getElementById('fb-u2l2-compact-why').closest('.explore-step').hidden === undefined);
    ok(doc.getElementById('s3PatternBox').hidden);
    ok(doc.getElementById('s3DescribeBox').hidden);
  });

  it('تسلسل الكشف: القشرة+الإسفنجي ← النمط ← الوصف', async function(){
    const { doc } = await page();
    h.choose(doc, 'u2l2-compact-why', 'correct');
    ok(doc.getElementById('s3PatternBox').hidden, 'لا يزال محجوبًا بعد سؤال واحد فقط');
    h.choose(doc, 'u2l2-spongy-why', 'correct');
    no(doc.getElementById('s3PatternBox').hidden);
    ok(doc.getElementById('s3DescribeBox').hidden);
    h.choose(doc, 'u2l2-spine-pattern', 'correct');
    no(doc.getElementById('s3DescribeBox').hidden);
  });

  it('الإجابة القصيرة تقبل جذر «ثق» في صيغة الجمع (ثقوب/مثقوب) لا «ثقب» وحدها', async function(){
    const { doc } = await page();
    h.type(doc, 's3DescribeInput', 'فيه ثقوب كثيرة تجعله مرنًا');
    h.click(doc, 's3DescribeBtn');
    has(doc.getElementById('fb-u2l2-spongy-describe').textContent, '✓');
  });

  it('مخرج النجاة يظهر بعد محاولتين فاشلتين ويمنح نصف نقاط PRODUCE', async function(){
    const { doc, w } = await page();
    h.type(doc, 's3DescribeInput', 'لا أعرف'); h.click(doc, 's3DescribeBtn');
    h.type(doc, 's3DescribeInput', 'شيء ما'); h.click(doc, 's3DescribeBtn');
    no(doc.getElementById('s3DescribeModelBtn').hidden);
    const before = w.XP.total();
    h.click(doc, 's3DescribeModelBtn');
    eq(w.XP.total() - before, 4);
  });

  it('رصيد المحطة الكامل 30', async function(){
    const s = await page();
    const { doc, w } = s;
    h.choose(doc, 'u2l2-compact-why', 'correct');
    h.choose(doc, 'u2l2-spongy-why', 'correct');
    h.choose(doc, 'u2l2-spine-pattern', 'correct');
    h.type(doc, 's3DescribeInput', 'مليء بالثقوب ومرن'); h.click(doc, 's3DescribeBtn');
    eq(w.XP.total(), 30);
    no(doc.getElementById('s3done').hidden);
  });
});

/* ---------- محطة 4 ---------- */
describe('المحطة 4 — المصنع الذي بداخلك', function(){
  it('خانة النخاع الأحمر لا تُقفَل قبل استقبال الرقاقات الثلاث', async function(){
    const { doc, w } = await page();
    h.choose(doc, 'u2l2-close-loop', 'correct');
    clickChipInto(doc, w, 'خلايا الدم الحمراء', 's4-slot-red');
    no(doc.getElementById('s4-slot-red').classList.contains('correct'));
    clickChipInto(doc, w, 'خلايا الدم البيضاء', 's4-slot-red');
    no(doc.getElementById('s4-slot-red').classList.contains('correct'));
    clickChipInto(doc, w, 'الصفائح الدموية', 's4-slot-red');
    ok(doc.getElementById('s4-slot-red').classList.contains('correct'));
  });

  it('بطاقة الحقائق تظهر فقط بعد اكتمال الخانتين معًا', async function(){
    const { doc, w } = await page();
    h.choose(doc, 'u2l2-close-loop', 'correct');
    clickChipInto(doc, w, 'خلايا الدم الحمراء', 's4-slot-red');
    clickChipInto(doc, w, 'خلايا الدم البيضاء', 's4-slot-red');
    clickChipInto(doc, w, 'الصفائح الدموية', 's4-slot-red');
    ok(doc.getElementById('s4FactBox').hidden, 'الخانة الصفراء لم تكتمل بعد');
    clickChipInto(doc, w, 'الأنسجة الدهنية', 's4-slot-yellow');
    no(doc.getElementById('s4FactBox').hidden);
  });

  it('يقبل السؤال النصّي جذورًا مع ضمائر ولواحق: «لبنائها» و«ليكوّنها» و«لإنتاجها»', async function(){
    const cases = ['خلايا الدم لبنائها باستمرار', 'خلايا جديدة ليكوّنها النخاع', 'خلايا الدم لإنتاجها'];
    for(const phrase of cases){
      const { doc } = await page();
      h.type(doc, 's4NutritionInput', phrase);
      h.click(doc, 's4NutritionBtn');
      has(doc.getElementById('fb-u2l2-marrow-nutrition').textContent, '✓', 'فشلت العبارة: ' + phrase);
    }
  });

  it('مخرج نجاة السؤال النصّي يمنح نصف نقاط PRODUCE بعد محاولتين', async function(){
    const { doc, w } = await page();
    h.type(doc, 's4NutritionInput', 'لا أعرف'); h.click(doc, 's4NutritionBtn');
    h.type(doc, 's4NutritionInput', 'ربما'); h.click(doc, 's4NutritionBtn');
    no(doc.getElementById('s4NutritionModelBtn').hidden);
    const before = w.XP.total();
    h.click(doc, 's4NutritionModelBtn');
    eq(w.XP.total() - before, 4);
  });

  it('المفهوم الخاطئ «العظام ليست حيّة»: الخيار (د) بتعليل خاطئ لا يُقبل', async function(){
    const { doc } = await page();
    h.choose(doc, 'u2l2-alive', 'w3');
    has(doc.getElementById('fb-u2l2-alive').textContent, 'النموّ');
  });

  it('رصيد المحطة الكامل 43', async function(){
    const { doc, w } = await page();
    h.choose(doc, 'u2l2-close-loop', 'correct');
    matchMarrowChips(doc, w);
    h.choose(doc, 'u2l2-stem', 'correct');
    h.type(doc, 's4NutritionInput', 'لأنه يبني خلايا دم جديدة'); h.click(doc, 's4NutritionBtn');
    h.choose(doc, 'u2l2-alive', 'correct');
    eq(w.XP.total(), 43);
    no(doc.getElementById('s4done').hidden);
  });
});

/* ---------- محطة 5 ---------- */
describe('المحطة 5 — ما الذي يخزّنه العظم؟', function(){
  it('التنبّؤ غير مُصحَّح، والزرّ الجسر يظهر بعده', async function(){
    const { doc, w } = await page();
    doc.querySelector('#s5PredictOptions input[value="a"]').click();
    eq(w.XP.total(), 3);
    no(doc.getElementById('s5RevealRow').hidden);
  });

  it('الكشف يبدّل حالة الكأس بـopacity لا بتحويل هندسي، ويظهر بعده الآن كاشف الكالسيوم', async function(){
    const { doc, w } = await page();
    doc.querySelector('#s5PredictOptions input[value="b"]').click();
    h.click(doc, 's5RevealBtn');
    ok(doc.getElementById('stageWater').classList.contains('cloudy'));
    no(doc.getElementById('s5WaterFact').hidden);
    no(doc.getElementById('s5StoreBox').hidden);
  });

  it('ممنوع توسّع دور البوتاسيوم — النصّ حرفيّ كما ورد بالكتاب', async function(){
    const { doc } = await page();
    const label = doc.getElementById('s5-slot-k').querySelector('.slot-label').textContent;
    eq(label, 'يساهم في تقوية العظم والمحافظة على صحّة الجهاز العصبي');
  });

  it('شريطا 20/80 يعكسان نصيب العظم الكثيف، وسؤال النمط يظهر بعدهما', async function(){
    const { doc } = await page();
    doc.querySelector('#s5PredictOptions input[value="b"]').click();
    h.click(doc, 's5RevealBtn');
    const fills = Array.from(doc.querySelectorAll('.density-fill')).map(function(e){ return e.style.width; });
    eq(fills[0], '20%');
    eq(fills[1], '80%');
    ok(doc.getElementById('s5DensityBox').hidden, 'محجوب حتى تكتمل خانتا التخزين');
  });

  it('التحدّي الاختياري (BONUS) له مخرج نجاة ويُضاف فوق الرصيد الأساسي', async function(){
    const { doc, w } = await page();
    doc.querySelector('#s5PredictOptions input[value="b"]').click();
    h.click(doc, 's5RevealBtn');
    matchStoreChips(doc, w);
    h.choose(doc, 'u2l2-density-pattern', 'correct');
    const base = w.XP.total();
    eq(base, 25);
    h.type(doc, 's5BonusInput', 'لا أعرف'); h.click(doc, 's5BonusBtn');
    h.type(doc, 's5BonusInput', 'ربما شيء'); h.click(doc, 's5BonusBtn');
    no(doc.getElementById('s5BonusModelBtn').hidden);
    h.click(doc, 's5BonusModelBtn');
    eq(w.XP.total(), base + 4, 'نصف نقاط BONUS (8) = 4');
  });
});

/* ---------- محطة 6 ---------- */
describe('المحطة 6 — التقييم الختامي والشهادة، ورصيد المسار الكامل', function(){
  it('لا يتجاوز طول الخيار الصحيح أطول مشتّت بأكثر من 12 حرفًا في أيّ سؤال', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    ['u2l2-e1', 'u2l2-e2', 'u2l2-e3', 'u2l2-e4', 'u2l2-e5', 'u2l2-e6', 'u2l2-e7', 'u2l2-e8'].forEach(function(name){
      const opts = Array.from(doc.querySelectorAll('[name="' + name + '"]'));
      const lens = opts.map(function(o){ return o.closest('.quiz-option').textContent.trim().length; });
      const correctIdx = opts.findIndex(function(o){ return o.value === 'correct'; });
      const maxOther = Math.max.apply(null, lens.filter(function(_, i){ return i !== correctIdx; }));
      const diff = lens[correctIdx] - maxOther;
      ok(diff <= 12, name + ': الخيار الصحيح أطول من أطول مشتّت بـ' + diff + ' حرفًا');
    });
  });

  it('مواضع الإجابة الصحيحة بين الأسئلة الثمانية متنوّعة، لا نمطًا واحدًا', async function(){
    const { doc } = await page();
    const positions = ['u2l2-e1', 'u2l2-e2', 'u2l2-e3', 'u2l2-e4', 'u2l2-e5', 'u2l2-e6', 'u2l2-e7', 'u2l2-e8']
      .map(function(name){
        const opts = Array.from(doc.querySelectorAll('[name="' + name + '"]'));
        return opts.findIndex(function(o){ return o.value === 'correct'; });
      });
    const distinctPositions = new Set(positions);
    ok(distinctPositions.size >= 3, 'المواضع المستعملة: ' + positions.join(',') + ' — يجب أن تتنوّع بين 3 مواضع مختلفة على الأقلّ');
    const maxRepeat = Math.max.apply(null, [0, 1, 2, 3].map(function(pos){
      return positions.filter(function(p){ return p === pos; }).length;
    }));
    ok(maxRepeat <= 4, 'موضع واحد لا يتكرّر أكثر من نصف الأسئلة تقريبًا (تكرّر ' + maxRepeat + ' مرّات)');
  });

  it('السؤال 8 يعرض الصورة الواقعية ببديل نصّي ونسبة ترخيص', async function(){
    const { doc } = await page();
    const img = doc.querySelector('#evalQuestions img');
    ok(img, 'الصورة غير موجودة');
    eq(img.getAttribute('src'), 'bone-section.jpg');
    ok((img.getAttribute('alt') || '').length > 10, 'alt وصفي مفقود');
    has(doc.querySelector('.photo-credit').textContent, 'CC BY 4.0');
  });

  it('إجابة خاطئة تكشف الصحيحة وتشرح السبب، والتقييم محاولة واحدة لكل سؤال', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.choose(doc, 'u2l2-e1', 'w1');
    has(doc.getElementById('fb-u2l2-e1').textContent, 'المحطة الثانية');
    ok(doc.querySelector('[name="u2l2-e1"][value="correct"]').closest('.quiz-option').classList.contains('correct'));
    ok(doc.querySelector('[name="u2l2-e1"][value="w1"]').disabled, 'محاولة واحدة فقط');
  });

  it('السؤال 9 يقبل «دعم» أو «حماي» منفردَين (أيّهما يكفي)', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م'); h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'يدعم الجسم فقط');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
  });

  it('السؤال 9 يقبل «حمايتها» بلاحقة الضمير', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م'); h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'حمايتها');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
  });

  it('السؤال 10 يتطلّب اللونين معًا — لون واحد فقط لا يكفي', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م'); h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'الأحمر فقط');
    h.click(doc, 'e10Btn');
    has(doc.getElementById('fb-e10').textContent, '✗');
  });

  it('السؤال 10 يقبل «الأحمر والأصفر» معًا بصيغ مختلفة', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م'); h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'نخاع أحمر ونخاع اصفر');
    h.click(doc, 'e10Btn');
    has(doc.getElementById('fb-e10').textContent, '✓');
  });

  it('رصيد المسار الأساسي بالضبط 126، ومع التحدّي الاختياري 134، والشهادة تُنادى بالعنوان الصحيح', async function(){
    const s = await page();
    await completeAll(s);
    eq(s.w.XP.total(), BASE_XP + BONUS_XP);
    eq(s.certCalls.length, 1);
    eq(s.certCalls[0][1], 'ما دور العظام في إنتاج خلايا الدم وتوفير بعض المواد للجسم؟');
    eq(s.certCalls[0][2], 100);
  });
});

run();
