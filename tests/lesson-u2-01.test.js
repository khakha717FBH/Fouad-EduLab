'use strict';
/* ==========================================================
   اختبارات الوحدة 02 · الدرس 01 — سلوك الدرس كما يراه الطالب
   ----------------------------------------------------------
   تُكتب على ما يفعله الطالب ويراه، لا على البنية الداخلية.
   الرصيد الأساسي 143 = 3 (م1) + 35 (م2) + 23 (م3) + 30 (م4) + 52 (م5)،
   والاختياري 8 (u2l1-rib-fracture-bonus). مُثبَّت هنا بالاختبار.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-02/lesson-01.html';
const BASE_XP = 143;
const BONUS_XP = 8;

async function page(opts){
  const s = await h.loadLesson(LESSON, opts);
  s.certCalls = [];
  s.w.Certificate = { finish: function(){ s.certCalls.push([].slice.call(arguments)); } };
  return s;
}

function hidden(doc, id){ return doc.getElementById(id).hidden; }

function clickChipInto(doc, w, value, slotId){
  const chip = Array.from(doc.querySelectorAll('.chips-pool .chip'))
    .find(function(c){ return c.dataset.value === value && !c.classList.contains('placed'); });
  if(!chip) throw new Error('رقاقة غير موجودة أو موضوعة مسبقًا: ' + value);
  h.selectChip(chip);
  doc.getElementById(slotId).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}

function exploreAllBones(doc, w){
  ['g-ribs-2', 'g-skull-2', 'g-pelvis-2', 'g-humerus-2', 'g-femur-2', 'g-spine-2'].forEach(function(t){
    doc.querySelector('#skeleton2 .hitgrp[data-t="' + t + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  });
}

function matchAllBoneChips(doc, w){
  [['الجمجمة', 's2-slot-skull'], ['العمود الفقري', 's2-slot-spine'], ['الضلوع', 's2-slot-ribs'],
   ['عظم العَضُد', 's2-slot-humerus'], ['الحوض', 's2-slot-pelvis'], ['عظم الفخذ', 's2-slot-femur']]
    .forEach(function(pair){ clickChipInto(doc, w, pair[0], pair[1]); });
}

function matchShapeChips(doc, w){
  [['عمود مستقيم طويل', 's5-shape-humerus'],
   ['عمود طويل، أطول عظمة في الجسم', 's5-shape-femur'],
   ['أقواس متتابعة منحنية', 's5-shape-ribs'],
   ['قبّة مستديرة مغلقة', 's5-shape-skull']]
    .forEach(function(pair){ clickChipInto(doc, w, pair[0], pair[1]); });
}

function matchFuncChips(doc, w){
  [['يدعم حركة الذراع عند الكتف والمرفق', 's5-func-humerus'],
   ['يدعم وزن الجسم ويساعد الساق على الحركة عند الورك والركبة', 's5-func-femur'],
   ['يحمي القلب والرئتين ويسمح للصدر بالتمدّد أثناء التنفّس', 's5-func-ribs'],
   ['يحمي الدماغ داخل قبّة عظمية مغلقة', 's5-func-skull']]
    .forEach(function(pair){ clickChipInto(doc, w, pair[0], pair[1]); });
}

/* تُنفَّذ كل الأسئلة والمهامّ بمسار «صحيح مباشرة» — مسار انحدار شامل */
async function completeAll(s){
  const { doc, w } = s;

  doc.querySelector('#s1PredictOptions input[value="a"]').click();

  exploreAllBones(doc, w);
  h.click(doc, 's2ContinueBtn');
  matchAllBoneChips(doc, w);
  h.choose(doc, 'u2l1-teeth', 'correct');

  h.choose(doc, 'u2l1-organ-skull', 'correct');
  h.choose(doc, 'u2l1-organ-ribs', 'correct');
  h.click(doc, 's3RevealBtn');
  h.type(doc, 's3ShortInput', 'لأنها تحمي أعضاء حسّاسة جدًّا وضرورية للحياة');
  h.click(doc, 's3ShortBtn');
  h.choose(doc, 'u2l1-helmet', 'correct');

  h.click(doc, 'silhouetteBtn');
  h.type(doc, 's4SpineInput', 'يدعم الجسم ويحمي الحبل الشوكي');
  h.click(doc, 's4SpineBtn');
  h.choose(doc, 'u2l1-cast', 'correct');
  for(let i = 0; i < 4; i++) h.click(doc, 'strengthLoadBtn');
  h.choose(doc, 'u2l1-support-property', 'correct');

  matchShapeChips(doc, w);
  matchFuncChips(doc, w);
  h.choose(doc, 'u2l1-shape-function-pattern', 'correct');
  h.type(doc, 's5BonusInput', 'يمكن أن يخترق الضلع المكسور الرئة المجاورة له');
  h.click(doc, 's5BonusBtn');

  h.type(doc, 'evalName', 'طالب تجريبي');
  h.click(doc, 'evalStart');
  ['u2l1-e1', 'u2l1-e2', 'u2l1-e3', 'u2l1-e4', 'u2l1-e5', 'u2l1-e6', 'u2l1-e7', 'u2l1-e8']
    .forEach(function(n){ h.choose(doc, n, 'correct'); });
  h.type(doc, 'e9Input', 'عظم الفخذ');
  h.click(doc, 'e9Btn');
  h.type(doc, 'e10Input', 'الضلوع تحمي القلب والرئتين وتسمح بالتمدد أثناء التنفس');
  h.click(doc, 'e10Btn');
  await h.tick(w, 30);
}

/* ---------- الهيكل ---------- */
describe('الوحدة 02 · الدرس 01 — الهيكل والوسوم', function(){
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
    eq(doc.querySelectorAll('.quiz-options[data-q]').length, 15);
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

  it('لا نقاط بمجرّد التحميل، والمحطات الستّ كلّها مفتوحة (تنقّل حرّ، لا حجب)', async function(){
    const { doc, w } = await page();
    eq(w.XP.total(), 0);
    for(let i = 1; i <= 6; i++){
      const sec = doc.getElementById('station-' + i);
      no(sec.hidden, 'المحطة ' + i + ' محجوبة');
      ok(!sec.hasAttribute('hidden'), 'المحطة ' + i + ' تحمل سمة hidden');
    }
  });

  it('عنصر تحفيز الشهادة موجود (لمنع تصادمه مع زرّ فهيم)', async function(){
    const { doc } = await page();
    ok(doc.getElementById('certTriggerSlot'));
  });

  it('الدخول من الخارج بمرساة #station-4 يُظهرها ويُفعِّل نقطتها', async function(){
    const { doc } = await page({ hash: '#station-4' });
    no(doc.getElementById('station-4').hasAttribute('hidden'));
    ok(doc.getElementById('station-4').classList.contains('in-view'));
    ok(doc.querySelector('.progress-dot[data-target="station-4"]').classList.contains('active'));
  });
});

/* ---------- محطة 1 ---------- */
describe('المحطة 1 — القنديل والتنبّؤ', function(){
  it('أيّ خيار يُسجَّل بتغذية محايدة لا تُصحَّح، ويمنح 3 نقاط تنبّؤ', async function(){
    const { doc, w } = await page();
    ok(hidden(doc, 's1done'));
    doc.querySelector('#s1PredictOptions input[value="c"]').click();
    has(doc.getElementById('fb-s1predict').textContent, 'لن نخبرك الآن');
    eq(w.XP.total(), 3);
    no(hidden(doc, 's1done'));
  });

  it('سحب القنديل يبدّل تسمية المشهد ولا يمنح نقاطًا', async function(){
    const { doc, w } = await page();
    h.click(doc, 'jellyPullBtn');
    has(doc.getElementById('jellyCaption').textContent, 'الرمل');
    eq(w.XP.total(), 0);
  });
});

/* ---------- محطة 2 ---------- */
describe('المحطة 2 — استكشاف الهيكل (أربع مراحل بنقطة واحدة)', function(){
  it('مرحلة المحوري/الطرفي لا تظهر إلا بعد استكشاف العظام الستّ جميعها', async function(){
    const { doc, w } = await page();
    ok(hidden(doc, 's2AxialBox'));
    ['g-ribs-2', 'g-skull-2', 'g-pelvis-2', 'g-humerus-2', 'g-femur-2'].forEach(function(t){
      doc.querySelector('#skeleton2 .hitgrp[data-t="' + t + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    });
    ok(hidden(doc, 's2AxialBox'), 'لم تُستكشف العظمة السادسة بعد');
    doc.querySelector('#skeleton2 .hitgrp[data-t="g-spine-2"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    no(hidden(doc, 's2AxialBox'));
  });

  it('النقر يُقفل تلقائيًّا في مرحلة العرض المحوري/الطرفي', async function(){
    const { doc, w } = await page();
    exploreAllBones(doc, w);
    const hits = doc.getElementById('hits-2');
    eq(hits.style.pointerEvents, 'none');
  });

  it('متابعة تكشف نشاط الرقاقات، ورقاقة في خانة خاطئة تُظهر تلميحًا مركّبًا ولا تُثبَّت', async function(){
    const { doc, w } = await page();
    exploreAllBones(doc, w);
    h.click(doc, 's2ContinueBtn');
    no(hidden(doc, 's2ChipsBox'));
    clickChipInto(doc, w, 'عظم العَضُد', 's2-slot-femur');
    const fb = doc.querySelector('[data-chips="u2l1-bones"] .chips-feedback');
    no(fb.hidden);
    has(fb.textContent, 'ذراعك لا في ساقك');
    const chip = Array.from(doc.querySelectorAll('.chips-pool .chip')).find(function(c){ return c.dataset.value === 'عظم العَضُد'; });
    no(chip.classList.contains('placed'));
  });

  it('ستّ مطابقات صحيحة تمنح 30 نقطة وتكشف سؤال الأسنان، وإجابته الصحيحة تمنح 5 وتُغلق المحطة', async function(){
    const { doc, w } = await page();
    exploreAllBones(doc, w);
    h.click(doc, 's2ContinueBtn');
    matchAllBoneChips(doc, w);
    eq(w.XP.total(), 30);
    no(hidden(doc, 's2ChipsDone'));
    no(hidden(doc, 's2TeethBox'));
    h.choose(doc, 'u2l1-teeth', 'w1');
    has(doc.getElementById('fb-u2l1-teeth').textContent, 'تركيبها الداخلي');
    eq(w.XP.total(), 30);
    h.choose(doc, 'u2l1-teeth', 'correct');
    eq(w.XP.total(), 35);
    no(hidden(doc, 's2done'));
  });
});

/* ---------- محطة 3 ---------- */
describe('المحطة 3 — الحماية والكشف', function(){
  it('زرّ الكشف لا يظهر قبل حلّ سؤالَي التنبّؤ، ويكشف الأعضاء ويُقفل بعد الاستعمال', async function(){
    const { doc } = await page();
    ok(hidden(doc, 's3RevealRow'));
    h.choose(doc, 'u2l1-organ-skull', 'correct');
    ok(hidden(doc, 's3RevealRow'), 'سؤال واحد لا يكفي');
    h.choose(doc, 'u2l1-organ-ribs', 'correct');
    no(hidden(doc, 's3RevealRow'));
    h.click(doc, 's3RevealBtn');
    ok(document_hasClass(doc, 'organs-3', 'show'));
    ok(document_hasClass(doc, 'skeleton3', 'xray'));
    ok(doc.getElementById('s3RevealBtn').disabled);
    no(hidden(doc, 's3ShortBox'));
  });

  it('الإجابة القصيرة بلا مخرج نجاة إلزامي، ونصف النقاط بعد محاولتين فاشلتين', async function(){
    const { doc, w } = await page();
    h.choose(doc, 'u2l1-organ-skull', 'correct');
    h.choose(doc, 'u2l1-organ-ribs', 'correct');
    h.click(doc, 's3RevealBtn');
    ok(doc.getElementById('s3ShortModelBtn').hidden);
    h.type(doc, 's3ShortInput', 'لا أعرف');
    h.click(doc, 's3ShortBtn');
    h.type(doc, 's3ShortInput', 'ربما لأنها مهمة');
    h.click(doc, 's3ShortBtn');
    no(doc.getElementById('s3ShortModelBtn').hidden, 'مخرج النجاة يجب أن يظهر بعد محاولتين فاشلتين');
    h.click(doc, 's3ShortModelBtn');
    eq(w.XP.total(), 10 + 4, 'نصف نقاط PRODUCE (8) = 4 مع 10 من سؤالَي التنبّؤ');
    no(hidden(doc, 's3HelmetBox'));
  });

  it('سؤال الخوذة يميّز حدود الحماية الطبيعية ويُغلق المحطة بإجمالي 23', async function(){
    const s = await page();
    const { doc, w } = s;
    h.choose(doc, 'u2l1-organ-skull', 'correct');
    h.choose(doc, 'u2l1-organ-ribs', 'correct');
    h.click(doc, 's3RevealBtn');
    h.type(doc, 's3ShortInput', 'لأنها حسّاسة جدًّا وتحمي الحياة');
    h.click(doc, 's3ShortBtn');
    h.choose(doc, 'u2l1-helmet', 'correct');
    eq(w.XP.total(), 10 + 8 + 5);
    no(hidden(doc, 's3done'));
  });
});

/* ---------- محطة 4 ---------- */
describe('المحطة 4 — الدعامة والقوّة', function(){
  it('إطفاء الهيكل يبدّل صنف الحالة على المسرح فيُخفي الجسد الواقف ويُظهر الكومة المنهارة، ويكشف سؤال العمود الفقري', async function(){
    const { doc } = await page();
    ok(hidden(doc, 's4SpineBox'));
    h.click(doc, 'silhouetteBtn');
    ok(document_hasClass(doc, 'stageSilhouette', 'collapsed'));
    ok(doc.getElementById('bodyCollapsed'), 'شكل الكومة المنهارة يجب أن يكون موجودًا في الوسم دائمًا (تلاشٍ لا حذف)');
    no(hidden(doc, 's4SpineBox'));
  });

  it('عمود الفولاذ ينحني عند الحمل الرابع، وعمود العظم يبقى ثابتًا، ونقطة النمط تُمنح مرّة واحدة', async function(){
    const { doc, w } = await page();
    h.click(doc, 'silhouetteBtn');
    h.type(doc, 's4SpineInput', 'يدعم الجسم');
    h.click(doc, 's4SpineBtn');
    h.choose(doc, 'u2l1-cast', 'correct');
    for(let i = 0; i < 3; i++) h.click(doc, 'strengthLoadBtn');
    no(document_hasClass(doc, 'steelCol', 'bent'));
    h.click(doc, 'strengthLoadBtn');
    ok(document_hasClass(doc, 'steelCol', 'bent'));
    ok(document_hasClass(doc, 'boneCol', 'holding'));
    ok(doc.getElementById('strengthLoadBtn').disabled);
    eq(doc.getElementById('boneStack').children.length, 4);
    eq(doc.getElementById('steelStack').children.length, 4);
    const xpAfterFail = w.XP.total();
    h.click(doc, 'strengthLoadBtn'); // زر معطَّل، لا أثر
    eq(w.XP.total(), xpAfterFail, 'لا تُمنح نقاط النمط مرّتين');
    no(hidden(doc, 's4SupportBox'));
  });

  it('رصيد المحطة الرابعة بالضبط 30', async function(){
    const { doc, w } = await page();
    h.click(doc, 'silhouetteBtn');
    h.type(doc, 's4SpineInput', 'يدعم الجسم ويحمي الحبل الشوكي');
    h.click(doc, 's4SpineBtn');
    h.choose(doc, 'u2l1-cast', 'correct');
    for(let i = 0; i < 4; i++) h.click(doc, 'strengthLoadBtn');
    h.choose(doc, 'u2l1-support-property', 'correct');
    eq(w.XP.total(), 8 + 5 + 12 + 5);
    no(hidden(doc, 's4done'));
  });
});

/* ---------- محطة 5 ---------- */
describe('المحطة 5 — الشكل يخدم الوظيفة', function(){
  it('خانات الوظيفة مخفيّة حتى تكتمل خانات الشكل الأربع', async function(){
    const { doc, w } = await page();
    ok(hidden(doc, 's5FuncWrap'));
    clickChipInto(doc, w, 'عمود مستقيم طويل', 's5-shape-humerus');
    clickChipInto(doc, w, 'عمود طويل، أطول عظمة في الجسم', 's5-shape-femur');
    clickChipInto(doc, w, 'أقواس متتابعة منحنية', 's5-shape-ribs');
    ok(hidden(doc, 's5FuncWrap'), 'خانة شكل واحدة ناقصة بعد');
    clickChipInto(doc, w, 'قبّة مستديرة مغلقة', 's5-shape-skull');
    no(hidden(doc, 's5FuncWrap'));
    eq(w.XP.total(), 20);
  });

  it('اكتمال عمودَي الشكل والوظيفة يمنح 40 نقطة ويكشف سؤال النمط', async function(){
    const { doc, w } = await page();
    matchShapeChips(doc, w);
    matchFuncChips(doc, w);
    eq(w.XP.total(), 40);
    no(hidden(doc, 's5PatternBox'));
  });

  it('سؤال النمط الصحيح يمنح 12 ويكشف الامتداد الاختياري والتحدّي', async function(){
    const { doc, w } = await page();
    matchShapeChips(doc, w);
    matchFuncChips(doc, w);
    h.choose(doc, 'u2l1-shape-function-pattern', 'correct');
    eq(w.XP.total(), 52);
    no(hidden(doc, 's5PostPattern'));
  });

  it('الامتداد الاختياري يكشف نصًّا دون تقييم ولا نقاط', async function(){
    const { doc, w } = await page();
    matchShapeChips(doc, w);
    matchFuncChips(doc, w);
    h.choose(doc, 'u2l1-shape-function-pattern', 'correct');
    const before = w.XP.total();
    h.click(doc, 's5ExtBtn');
    no(hidden(doc, 's5ExtText'));
    has(doc.getElementById('s5ExtText').textContent, 'الطحال');
    eq(w.XP.total(), before);
  });

  it('التحدّي الاختياري (BONUS) له مخرج نجاة ويُضاف فوق الرصيد الأساسي', async function(){
    const { doc, w } = await page();
    matchShapeChips(doc, w);
    matchFuncChips(doc, w);
    h.choose(doc, 'u2l1-shape-function-pattern', 'correct');
    const base = w.XP.total();
    eq(base, 52);
    ok(doc.getElementById('s5BonusModelBtn').hidden);
    h.type(doc, 's5BonusInput', 'لا أعرف');
    h.click(doc, 's5BonusBtn');
    h.type(doc, 's5BonusInput', 'ربما شيء ما');
    h.click(doc, 's5BonusBtn');
    no(doc.getElementById('s5BonusModelBtn').hidden);
    h.click(doc, 's5BonusModelBtn');
    eq(w.XP.total(), base + 4, 'نصف نقاط BONUS (8) = 4');
  });
});

/* ---------- محطة 6 ---------- */
describe('المحطة 6 — التقييم الختامي والشهادة، ورصيد المسار الكامل', function(){
  it('لا يتجاوز طول الخيار الصحيح أطول مشتّت بأكثر من 12 حرفًا في أيّ سؤال (منع الاستبعاد اللغوي)', async function(){
    const s = await page();
    const { doc } = s;
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    ['u2l1-e1', 'u2l1-e2', 'u2l1-e3', 'u2l1-e4', 'u2l1-e5', 'u2l1-e6', 'u2l1-e7', 'u2l1-e8'].forEach(function(name){
      const opts = Array.from(doc.querySelectorAll('[name="' + name + '"]'));
      const lens = opts.map(function(o){ return o.closest('.quiz-option').textContent.trim().length; });
      const correctIdx = opts.findIndex(function(o){ return o.value === 'correct'; });
      const maxOther = Math.max.apply(null, lens.filter(function(_, i){ return i !== correctIdx; }));
      const diff = lens[correctIdx] - maxOther;
      ok(diff <= 12, name + ': الخيار الصحيح أطول من أطول مشتّت بـ' + diff + ' حرفًا');
    });
  });

  it('مواضع الإجابة الصحيحة بين أسئلة الاختيار الثمانية متنوّعة، لا نمطًا واحدًا', async function(){
    const { doc } = await page();
    const positions = ['u2l1-e1', 'u2l1-e2', 'u2l1-e3', 'u2l1-e4', 'u2l1-e5', 'u2l1-e6', 'u2l1-e7', 'u2l1-e8']
      .map(function(name){
        const opts = Array.from(doc.querySelectorAll('[name="' + name + '"]'));
        return opts.findIndex(function(o){ return o.value === 'correct'; });
      });
    const distinctPositions = new Set(positions);
    ok(distinctPositions.size >= 3, 'المواضع المستعملة: ' + positions.join(',') + ' — يجب أن تتنوّع بين 3 مواضع مختلفة على الأقلّ');
    const maxRepeat = Math.max.apply(null, [0, 1, 2, 3].map(function(pos){
      return positions.filter(function(p){ return p === pos; }).length;
    }));
    ok(maxRepeat <= 3, 'موضع واحد لا يتكرّر أكثر من ثلاث مرّات من أصل ثمانية أسئلة (تكرّر ' + maxRepeat + ' مرّات)');
  });

  it('السؤال 9 لا يذكر الجمجمة أو الضلوع كاستثناء من الهيكل الطرفي (هما أصلًا من الهيكل المحوري)', async function(){
    const { doc } = await page();
    const q9Text = doc.querySelector('#evalQuestions .eval-q:nth-of-type(9) .explore-q, #e9Input')
      .closest('.eval-q').querySelector('.explore-q').textContent;
    no(/غير الجمجمة/.test(q9Text), 'الاستثناء المربك ما زال موجودًا: ' + q9Text);
  });

  it('إجابة خاطئة تكشف الصحيحة وتشرح السبب، والتقييم محاولة واحدة لكل سؤال', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.choose(doc, 'u2l1-e1', 'w1');
    has(doc.getElementById('fb-u2l1-e1').textContent, 'الضلوع تحمي عضوين');
    ok(doc.querySelector('[name="u2l1-e1"][value="correct"]').closest('.quiz-option').classList.contains('correct'));
    ok(doc.querySelector('[name="u2l1-e1"][value="w1"]').disabled, 'محاولة واحدة فقط');
  });

  it('يقبل السؤال 9 أيّ عظمة طرفية واحدة من الأربع', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'عظم العضد');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
  });

  it('يقبل السؤال 9 «الحوض» و«العمود الفقري» أيضًا', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e9Input', 'الحوض يدعم الجسم');
    h.click(doc, 'e9Btn');
    has(doc.getElementById('fb-e9').textContent, '✓');
  });

  it('يقبل السؤال 10 صياغات مرادفة لوظيفة الضلوع', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'تحمي القلب والرئتين وتسمح بتمدد الصدر');
    h.click(doc, 'e10Btn');
    has(doc.getElementById('fb-e10').textContent, '✓');
  });

  it('يرفض السؤال 10 إجابة تذكر عضوًا بلا فعل الحماية', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'م');
    h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'القلب والرئتان داخل الصدر');
    h.click(doc, 'e10Btn');
    has(doc.getElementById('fb-e10').textContent, '✗');
  });

  it('رصيد المسار الأساسي بالضبط 143، ومع التحدّي الاختياري 151، والشهادة تُنادى بالعنوان الصحيح', async function(){
    const s = await page();
    await completeAll(s);
    eq(s.w.XP.total(), BASE_XP + BONUS_XP);
    eq(s.certCalls.length, 1);
    eq(s.certCalls[0][1], 'ما وظائف العظام الرئيسة في الهيكل العظمي لجسم الإنسان؟');
    eq(s.certCalls[0][2], 100);
    no(hidden(s.doc, 'evalSummary'));
  });
});

/* أداة صغيرة: فحص صنف على عنصر بمُعرّف، بمعزل عن svg/html */
function document_hasClass(doc, id, cls){
  const el = doc.getElementById(id);
  return !!el && el.classList.contains(cls);
}

run();
