'use strict';
/* ==========================================================
   اختبارات الوحدة 02 · الدرس 03 — سلوك الدرس كما يراه الطالب
   ----------------------------------------------------------
   تُكتب على ما يفعله الطالب ويراه، لا على البنية الداخلية.
   الرصيد الأساسي 155 = 6 (م1) + 38 (م2) + 45 (م3) + 50 (م4) + 16 (م5)،
   والاختياري 8 (u2l3-hip-replacement-bonus). مُثبَّت هنا بالاختبار:
   أي تغيّر فيه مستقبلًا خللٌ لا تحسين.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');
const guards = require('./guards');

const LESSON = 'semester-1/unit-02/lesson-03.html';
const BASE_XP = 155;
const BONUS_XP = 8;

async function page(opts){
  const s = await h.loadLesson(LESSON, opts);
  s.certCalls = [];
  s.w.Certificate = { finish: function(){ s.certCalls.push([].slice.call(arguments)); } };
  return s;
}

function fire(doc, w, id, type){
  doc.getElementById(id).dispatchEvent(new w.MouseEvent(type || 'click', { bubbles: true }));
}
function pick(doc, groupId, value){
  doc.querySelector('#' + groupId + ' input[value="' + value + '"]').click();
}
function chipInto(doc, w, value, slotId){
  const chip = Array.from(doc.querySelectorAll('.chips-pool .chip'))
    .find(function(c){ return c.dataset.value === value && !c.classList.contains('placed'); });
  if(!chip) throw new Error('رقاقة غير موجودة أو موضوعة مسبقًا: ' + value);
  h.selectChip(chip);
  doc.getElementById(slotId).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}
/* نصّ ما يراه الطالب فعلًا: يتخطّى أي شجرة محجوبة بـhidden.
   textContent وحده يقرأ المحجوب أيضًا، فيُنتج إخفاقًا وهميًّا في
   اختبارات «لم يظهر بعد». */
function visibleText(node){
  if(!node) return '';
  if(node.nodeType === 3) return node.textContent;
  if(node.nodeType !== 1) return '';
  if(node.hidden) return '';
  let out = '';
  node.childNodes.forEach(function(c){ out += visibleText(c); });
  return out;
}

function arrow(node, key, times){
  const W = node.ownerDocument.defaultView;
  for(let i = 0; i < (times || 1); i++){
    node.dispatchEvent(new W.KeyboardEvent('keydown', { key: key, bubbles: true }));
  }
}

/* الطبقات تُكشف بالنقر على المسرح نفسه لا بزرّ خارجي */
function peel(doc, w, times){
  for(let i = 0; i < (times || 1); i++) fire(doc, w, 'dissectStage');
}

/* التجربة صارت درجًا بيد الطالب: ثلاث ضغطات لا واحدة */
function runFriction(doc, times){
  for(let i = 0; i < (times || 3); i++) h.click(doc, 's3RunBtn');
}

async function openDissection(s){
  const { doc, w } = s;
  fire(doc, w, 's2MoveBtn');
  await h.tick(w, 40);
}

/* مسار «صحيح مباشرة» عبر الدرس كلّه — مسار انحدار شامل */
async function completeAll(s, opts){
  opts = opts || {};
  const { doc, w } = s;

  pick(doc, 's1DirOptions', 'a');
  pick(doc, 's1HoldOptions', 'b');

  await openDissection(s);
  peel(doc, w, 3);
  h.choose(doc, 'u2l3-muscle-attach', 'correct');
  peel(doc, w, 1);
  h.choose(doc, 'u2l3-tendon-role', 'correct');
  peel(doc, w, 1);
  h.choose(doc, 'u2l3-ligament-role', 'correct');
  peel(doc, w, 1);
  h.type(doc, 's2TearInput', 'تضعف حركته');
  h.click(doc, 's2TearBtn');
  h.choose(doc, 'u2l3-ligament-tear', 'correct');

  pick(doc, 's3PredictOptions', 'b');
  runFriction(doc, 3);
  await h.tick(w, 60);
  h.choose(doc, 'u2l3-friction-pattern', 'correct');
  [['عضلة','s3-slot-muscle'], ['وتر','s3-slot-tendon'], ['رباط','s3-slot-ligament'],
   ['غضروف','s3-slot-cartilage'], ['السائل الزلالي','s3-slot-fluid']]
    .forEach(function(p){ chipInto(doc, w, p[0], p[1]); });
  h.choose(doc, 'u2l3-synovial-name', 'correct');

  arrow(doc.getElementById('humerusRotor'), 'ArrowRight', 5);
  arrow(doc.getElementById('ulnaRotor'), 'ArrowLeft', 10);
  h.choose(doc, 'u2l3-ball-socket', 'correct');
  h.choose(doc, 'u2l3-hinge', 'correct');
  [['الكتف','s4-slot-ball'], ['الورك','s4-slot-ball'],
   ['المرفق','s4-slot-hinge'], ['الركبة','s4-slot-hinge']]
    .forEach(function(p){ chipInto(doc, w, p[0], p[1]); });
  h.choose(doc, 'u2l3-ardha-kick', 'correct');
  pick(doc, 's4CountOptions', 'a');
  h.choose(doc, 'u2l3-type-pattern', 'correct');

  pick(doc, 's5PredictOptions', 'b');
  h.click(doc, 's5ToggleBtn');
  h.choose(doc, 'u2l3-symptoms', 'correct');
  h.type(doc, 's5AthleteInput', 'بسبب التكرار');
  h.click(doc, 's5AthleteBtn');

  if(opts.bonus){
    h.click(doc, 's5BonusLink');
    h.choose(doc, 'u2l3-hip-replacement-bonus', 'correct');
  }
  if(opts.evaluate){
    h.type(doc, 'evalName', 'طالب تجريبي');
    h.click(doc, 'evalStart');
    ['u2l3-e1','u2l3-e2','u2l3-e3','u2l3-e4','u2l3-e5','u2l3-e6','u2l3-e7','u2l3-e8']
      .forEach(function(n){ h.choose(doc, n, 'correct'); });
    h.type(doc, 'e9Input', 'الغضروف'); h.click(doc, 'e9Btn');
    h.type(doc, 'e10Input', 'الكتف');  h.click(doc, 'e10Btn');
    await h.tick(w, 40);
  }
}

/* ---------- الهيكل والوسوم ---------- */
describe('الوحدة 02 · الدرس 03 — الهيكل والوسوم', function(){
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

  it('وسوم المشترك الستّة بترتيبها، وسكربت الدرس بعدها', async function(){
    const { raw } = await page();
    const order = ['sounds/sounds.js', 'xp-system/xp.js', 'faheem-widget/faheem.js',
                   'template-boilerplate/template.js', 'certificate-system/certificate.js',
                   'identity/footer.js'];
    let prev = -1;
    order.forEach(function(src){
      const i = raw.indexOf(src);
      ok(i > prev, 'ترتيب الوسوم مكسور عند: ' + src);
      prev = i;
    });
    ok(raw.indexOf('window.Quiz.practice') > raw.indexOf('template-boilerplate/template.js'),
       'سكربت الدرس ينادي Quiz قبل تحميل template.js');
  });

  it('المسار إلى المشترك مستويان لا ثلاثة', async function(){
    const { raw } = await page();
    no(/\.\.\/\.\.\/\.\.\/shared\//.test(raw), 'مسار بثلاثة مستويات');
    ok(/\.\.\/\.\.\/shared\/identity\/identity\.css/.test(raw));
  });

  it('لا حجب بين المحطات — كلّها مفتوحة منذ التحميل', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.station').forEach(function(sec){
      no(sec.hidden, 'محطة محجوبة عند التحميل: ' + sec.id);
    });
  });

  it('لا معرّفات مكرّرة ولا قيم data-q مكرّرة', async function(){
    const { doc } = await page();
    const ids = Array.prototype.map.call(doc.querySelectorAll('[id]'), function(n){ return n.id; });
    eq(ids.length, new Set(ids).size, 'معرّف مكرّر: ' +
       ids.filter(function(v, i){ return ids.indexOf(v) !== i; }).join(', '));
    const qs = Array.prototype.map.call(doc.querySelectorAll('[data-q]'), function(n){ return n.dataset.q; });
    eq(qs.length, new Set(qs).size, 'data-q مكرّرة');
  });

  it('بطاقة النتيجة تحوي certTriggerSlot داخل محطة التقييم', async function(){
    const { doc } = await page();
    const slot = doc.getElementById('certTriggerSlot');
    ok(slot, 'certTriggerSlot مفقود');
    eq(slot.closest('.station').id, 'station-6');
  });

  it('صورتا المحطة 1 ملفّان بجوار الدرس، ولكلٍّ منهما نصّ بديل عربي', async function(){
    const { doc } = await page();
    const imgs = doc.querySelectorAll('.img-pair img');
    eq(imgs.length, 2);
    ['ardha-silhouette.svg', 'football-kick-silhouette.svg'].forEach(function(src, i){
      eq(imgs[i].getAttribute('src'), src, 'الأصل يعيش بجوار الدرس لا في مجلّد أصول');
      ok((imgs[i].getAttribute('alt') || '').length > 12, 'نصّ بديل ناقص');
      ok(/[\u0621-\u064A]/.test(imgs[i].getAttribute('alt')), 'النصّ البديل ليس عربيًّا');
      eq(imgs[i].getAttribute('loading'), 'lazy');
      ok(imgs[i].getAttribute('width') && imgs[i].getAttribute('height'), 'أبعاد صريحة مفقودة');
    });
  });
});

/* ---------- XP ---------- */
describe('الوحدة 02 · الدرس 03 — نقاط الجهد', function(){
  it('الرصيد الأساسي الكامل = ' + BASE_XP, async function(){
    const s = await page();
    await completeAll(s);
    eq(s.w.XP.total(), BASE_XP);
  });

  it('التحدّي الاختياري يضيف ' + BONUS_XP + ' فوق الأساسي', async function(){
    const s = await page();
    await completeAll(s, { bonus: true });
    eq(s.w.XP.total(), BASE_XP + BONUS_XP);
  });

  it('محطة التقييم لا تمنح نقطة واحدة', async function(){
    const s = await page();
    await completeAll(s, { bonus: true, evaluate: true });
    eq(s.w.XP.total(), BASE_XP + BONUS_XP);
  });

  it('لا كسب مزدوج بعد إعادة تحميل الصفحة', async function(){
    const store = {};
    const s1 = await page({ storage: store });
    await completeAll(s1);
    eq(s1.w.XP.total(), BASE_XP);
    const s2 = await page({ storage: store });
    eq(s2.w.XP.total(), BASE_XP, 'الرصيد تضاعف بعد إعادة التحميل');
    await completeAll(s2);
    eq(s2.w.XP.total(), BASE_XP, 'إعادة الأداء منحت نقاطًا مرّة ثانية');
  });

  it('u2l3-dissect يُمنح مرّة واحدة مهما تكرّر النقر على المسرح', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3); h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-tendon-role', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-ligament-role', 'correct');
    peel(doc, w, 1);
    const after = w.XP.total();
    peel(doc, w, 5);
    eq(w.XP.total(), after, 'النقر بعد آخر طبقة منح نقاطًا مرّة ثانية');
    ok(w.XP.has('u2l3-dissect'));
  });
});

/* ---------- المحطة 1 ---------- */
describe('الوحدة 02 · الدرس 03 — المحطة 1: التنبّؤ المحايد', function(){
  it('السؤال الثاني لا يظهر قبل الإجابة عن الأول', async function(){
    const { doc } = await page();
    no(h.visible(doc, 's1HoldStep'), 'السؤال الثاني مكشوف قبل أوانه');
    pick(doc, 's1DirOptions', 'c');
    ok(h.visible(doc, 's1HoldStep'));
  });

  it('التنبّؤ لا يُصحَّح: الخيارات الثلاثة كلّها تُقبل بتغذية محايدة واحدة', async function(){
    for(const v of ['a', 'b', 'c']){
      const { doc } = await page();
      pick(doc, 's1DirOptions', v);
      const fb = doc.getElementById('fb-s1dir');
      no(fb.hidden);
      ok(fb.classList.contains('is-hint'), 'تغذية التنبّؤ وُسمت صوابًا أو خطأً');
      no(fb.classList.contains('is-correct'));
      has(fb.textContent, 'سجّلنا ملاحظتك');
    }
  });

  it('التنبّؤان معًا يمنحان 6 ويكشفان زرّ الانتقال', async function(){
    const { doc, w } = await page();
    pick(doc, 's1DirOptions', 'a');
    pick(doc, 's1HoldOptions', 'd');
    eq(w.XP.total(), 6);
    ok(h.visible(doc, 's1done'));
  });

  it('جواب «ما الذي يمسك العظمين» لا يُكشف في المحطة 1', async function(){
    const { doc } = await page();
    pick(doc, 's1DirOptions', 'a');
    pick(doc, 's1HoldOptions', 'b');
    const t = visibleText(doc.getElementById('station-1'));
    no(/رباط|أربطة/.test(t), 'اسم الرباط تسرّب إلى المحطة 1');
  });
});

/* ---------- المحطة 2 ---------- */
describe('الوحدة 02 · الدرس 03 — المحطة 2: التشريح الطبقي', function(){
  it('الكشف الطبقي لا يبدأ قبل تحريك الساق', async function(){
    const s = await page();
    no(h.visible(s.doc, 's2DissectStep'));
    await openDissection(s);
    ok(h.visible(s.doc, 's2DissectStep'));
  });

  it('ترتيب الطبقات ثابت: كل نقرة تكشف الطبقة التالية بملاحظتها', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    const notes = [];
    for(let i = 0; i < 3; i++){ peel(doc, w, 1); notes.push(doc.getElementById('s2Readout').textContent); }
    has(notes[0], 'الجلد');
    has(notes[0], 'نسيج دهني');
    has(notes[1], 'وردي');
    has(notes[2], 'عضلة');
  });

  /* ═══ حرّاس المزامنة والتوجيه — أُضيفت في 12 أغسطس 2026 ═══
     العلّة الأصلية: السطر يسمّي طبقة اختفت من المسرح. والاختبار
     القديم كان يفحص النصّ وحده ولا يسأل: هل الطبقة التي يسمّيها
     ظاهرة؟ فمرّ الخلل أخضر. الحارس التالي يقرن الاثنين. */

  it('كل ملاحظة تسمّي طبقةً ظاهرة على المسرح لا طبقةً اختفت', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    /* [الكلمة في السطر, مُعرّف الطبقة التي يجب أن تكون ظاهرة] */
    const PAIRS = [
      ['دهني',  'lay-fat-a'],
      ['وردي',  'lay-muscle'],
      ['عضلة',  'lay-muscle']
    ];
    for(let i = 0; i < PAIRS.length; i++){
      peel(doc, w, 1);
      const line  = doc.getElementById('s2Readout').textContent;
      const layer = doc.getElementById(PAIRS[i][1]);
      has(line, PAIRS[i][0]);
      no(layer.classList.contains('off'),
         'السطر يسمّي «' + PAIRS[i][0] + '» وطبقتها مخفيّة عن المسرح');
    }
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1);
    no(doc.getElementById('lay-tendon').classList.contains('off'), 'الوتر غائب وسطره يصفه');
    h.choose(doc, 'u2l3-tendon-role', 'correct');
    peel(doc, w, 1);
    no(doc.getElementById('lay-ligament').classList.contains('off'), 'الرباط غائب وسطره يصفه');
    h.choose(doc, 'u2l3-ligament-role', 'correct');
    peel(doc, w, 1);
    no(doc.getElementById('lay-cartilage-a').classList.contains('off'), 'الغضروف غائب وسطره يصفه');
  });

  it('زرّ «تابع التشريح» مخفيّ قبل الإجابة الصحيحة وظاهر بعدها', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    no(h.visible(doc, 's2Back1'), 'الزرّ ظهر قبل الإجابة');
    h.choose(doc, 'u2l3-muscle-attach', 'w1');
    no(h.visible(doc, 's2Back1'), 'الزرّ ظهر بعد إجابة خاطئة');
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    ok(h.visible(doc, 's2Back1'), 'الزرّ لم يظهر بعد الإجابة الصحيحة');
  });

  it('تسمية الزرّ تحمل عدد الخطوات الباقية فلا يتوهّم الطالب الانتهاء', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    has(doc.getElementById('s2Back1').textContent, 'بقيت 3');
    h.click(doc, 's2Back1');
    peel(doc, w, 1);
    h.choose(doc, 'u2l3-tendon-role', 'correct');
    has(doc.getElementById('s2Back2').textContent, 'بقيت 2');
    h.click(doc, 's2Back2');
    peel(doc, w, 1);
    h.choose(doc, 'u2l3-ligament-role', 'correct');
    has(doc.getElementById('s2Back3').textContent, 'بقيت 1');
  });

  it('ضغط الزرّ يطوي السؤال المُجاب وينقل التركيز إلى المسرح', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    const box = doc.getElementById('s2Q1Box');
    ok(box.classList.contains('is-answered'), 'سطر الطيّ لم يظهر بعد الإجابة');
    no(box.classList.contains('is-folded'), 'طُوي قبل أن يضغط الطالب الزرّ');
    h.click(doc, 's2Back1');
    ok(box.classList.contains('is-folded'), 'الزرّ لم يطوِ السؤال');
    eq(doc.getElementById('s2Sum1').getAttribute('aria-expanded'), 'false');
    eq(doc.activeElement.id, 'dissectStage', 'التركيز لم ينتقل إلى المسرح');
  });

  it('سطر الطيّ زرّ حقيقي يعيد فتح السؤال ويعلن حالته', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    const sum = doc.getElementById('s2Sum1');
    eq(sum.tagName, 'BUTTON', 'سطر الطيّ ليس زرًّا فلا يبلغه المفتاح');
    eq(sum.getAttribute('aria-controls'), 's2Body1');
    h.click(doc, 's2Back1');
    h.click(doc, 's2Sum1');
    no(doc.getElementById('s2Q1Box').classList.contains('is-folded'), 'النقر لم يعِد الفتح');
    eq(sum.getAttribute('aria-expanded'), 'true');
    h.click(doc, 's2Sum1');
    ok(doc.getElementById('s2Q1Box').classList.contains('is-folded'), 'النقرة الثانية لم تطوِ');
  });

  it('النقر على المسرح مباشرةً يطوي السؤال السابق أيضًا', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1);            /* الطالب صعد ونقر بلا استعمال الزرّ */
    ok(doc.getElementById('s2Q1Box').classList.contains('is-folded'),
       'السؤال بقي مفتوحًا فتتراكم الصناديق كما كانت');
  });

  it('السؤال المطويّ تبقى خياراته معطّلة فلا يُجاب ثانيةً', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    h.click(doc, 's2Back1');
    const radios = doc.querySelectorAll('.quiz-options[data-q="u2l3-muscle-attach"] input');
    ok(Array.from(radios).every(function(r){ return r.disabled; }), 'خيار غير معطّل بعد الطيّ');
  });

  it('عدّاد الخطوات يتقدّم مع كل نقرة ويقف عند 6', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    const cnt = function(){ return doc.getElementById('s2PeelCount').textContent; };
    has(cnt(), 'الخطوة 0 من 6');
    peel(doc, w, 1); has(cnt(), 'الخطوة 1 من 6');
    peel(doc, w, 2); has(cnt(), 'الخطوة 3 من 6');
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1);
    h.choose(doc, 'u2l3-tendon-role', 'correct');
    peel(doc, w, 1);
    h.choose(doc, 'u2l3-ligament-role', 'correct');
    peel(doc, w, 1);
    has(cnt(), 'الخطوة 6 من 6');
    peel(doc, w, 3);
    has(cnt(), 'الخطوة 6 من 6');
  });

  it('نبضة المسرح تعمل حين يكون النقر متاحًا وتقف عند النقر وعند القفل', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    const stage = doc.getElementById('dissectStage');
    ok(stage.classList.contains('awaiting'), 'المسرح لا ينبض وهو ينتظر النقرة الأولى');
    peel(doc, w, 1);
    no(stage.classList.contains('awaiting'), 'النبضة بقيت بعد النقر');
    peel(doc, w, 2);
    no(stage.classList.contains('awaiting'), 'المسرح ينبض وهو مقفل بانتظار الإجابة');
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    ok(stage.classList.contains('awaiting'), 'النبضة لم تعد بعد فتح القفل');
  });

  it('الكشف لا يُتخطّى: النقر مقفل حتى يُجاب عن سؤال الطبقة', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    ok(h.visible(doc, 's2Q1Box'), 'سؤال العضلة لم يظهر');
    const before = doc.getElementById('s2Readout').textContent;
    peel(doc, w, 4);
    eq(doc.getElementById('s2Readout').textContent, before, 'الطالب تخطّى الطبقة بلا إجابة');
    no(h.visible(doc, 's2Q2Box'));
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1);
    ok(h.visible(doc, 's2Q2Box'));
  });

  it('كل سؤال يُقفل بعد الإجابة الصحيحة', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    h.choose(doc, 'u2l3-muscle-attach', 'correct');
    const again = h.choose(doc, 'u2l3-muscle-attach', 'w1');
    ok(again.blocked, 'السؤال لم يُقفل بعد الصواب');
  });

  it('لكل مشتّت تلميحه الخاصّ لا تلميح واحد للسؤال', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3);
    const seen = new Set();
    ['w1', 'w2', 'w3'].forEach(function(v){
      h.choose(doc, 'u2l3-muscle-attach', v);
      seen.add(doc.getElementById('fb-u2l3-muscle-attach').textContent);
    });
    eq(seen.size, 3, 'التلميحات الثلاثة ليست متمايزة');
  });

  it('اسم النسيج لا يظهر قبل أن يجيب الطالب — التسمية تلحق الملاحظة', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 4);
    const svgText = doc.getElementById('dissectStage').textContent;
    no(/وتر|رباط|غضروف/.test(svgText), 'اسم النسيج مكتوب داخل المسرح');
    no(/الوتر/.test(doc.getElementById('s2Readout').textContent), 'الملاحظة سمّت الوتر قبل السؤال');
    h.choose(doc, 'u2l3-tendon-role', 'correct');
    has(doc.getElementById('fb-u2l3-tendon-role').textContent, 'الوتر');
  });

  it('سطر الربط بدرس 02 يظهر بعد كشف الغضروف لا قبله', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3); h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-tendon-role', 'correct');
    peel(doc, w, 1);
    no(h.visible(doc, 's2SpongyLink'), 'سطر الربط ظهر قبل الغضروف');
    h.choose(doc, 'u2l3-ligament-role', 'correct');
    peel(doc, w, 1);
    ok(h.visible(doc, 's2SpongyLink'));
    has(h.text(doc, 's2SpongyLink'), 'إسفنجي');
  });

  it('حلقة تنبّؤ المحطة 1 تُغلق صراحةً عند ظهور الرباط', async function(){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3); h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-tendon-role', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-ligament-role', 'correct');
    has(doc.getElementById('fb-u2l3-ligament-role').textContent, 'بداية الدرس');
  });
});

/* ---------- مصحّحا الإجابات القصيرة ---------- */
describe('الوحدة 02 · الدرس 03 — مصحّح u2l3-tendon-tear', function(){
  async function tear(answer){
    const s = await page();
    const { doc, w } = s;
    await openDissection(s);
    peel(doc, w, 3); h.choose(doc, 'u2l3-muscle-attach', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-tendon-role', 'correct');
    peel(doc, w, 1); h.choose(doc, 'u2l3-ligament-role', 'correct');
    peel(doc, w, 1);
    h.type(doc, 's2TearInput', answer);
    h.click(doc, 's2TearBtn');
    return { s, doc, w, fb: doc.getElementById('fb-u2l3-tendon-tear') };
  }

  it('يقبل «تضعف حركته»', async function(){
    const r = await tear('تضعف حركته');
    ok(r.fb.classList.contains('is-correct'), r.fb.textContent);
  });

  it('يقبل «لا يتحرّك الطرف»', async function(){
    const r = await tear('لا يتحرّك الطرف');
    ok(r.fb.classList.contains('is-correct'), r.fb.textContent);
  });

  it('يقبل «تتوقّف حركة الطرف»', async function(){
    const r = await tear('تتوقّف حركة الطرف');
    ok(r.fb.classList.contains('is-correct'), r.fb.textContent);
  });

  it('يرفض «يتحرّك بشكل طبيعي» — مزلق النفي', async function(){
    const r = await tear('يتحرّك بشكل طبيعي');
    no(r.fb.classList.contains('is-correct'), 'قُبلت إجابة عكس الصواب لأنها تحمل جذر «حرك»');
  });

  it('مخرج النجاة يظهر بعد محاولتين ويمنح نصف النقاط (4)', async function(){
    const r = await tear('لا أعرف');
    const { doc, w } = r;
    no(h.visible(doc, 's2TearModelBtn'), 'مخرج النجاة ظهر بعد محاولة واحدة');
    h.type(doc, 's2TearInput', 'ربما شيء ما');
    h.click(doc, 's2TearBtn');
    ok(h.visible(doc, 's2TearModelBtn'), 'مخرج النجاة لم يظهر بعد محاولتين');
    const before = w.XP.total();
    h.click(doc, 's2TearModelBtn');
    eq(w.XP.total() - before, 4, 'مخرج النجاة لم يمنح نصف نقاط PRODUCE');
    ok(h.visible(doc, 's2TearModel'));
    ok(h.visible(doc, 's2Q4Box'), 'إيقاع الدرس توقّف عند مخرج النجاة');
  });
});

describe('الوحدة 02 · الدرس 03 — مصحّح u2l3-athlete', function(){
  async function athlete(answer){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's5PredictOptions', 'b');
    h.click(doc, 's5ToggleBtn');
    h.choose(doc, 'u2l3-symptoms', 'correct');
    h.type(doc, 's5AthleteInput', answer);
    h.click(doc, 's5AthleteBtn');
    return doc.getElementById('fb-u2l3-athlete');
  }

  it('يقبل «بسبب التكرار»', async function(){
    const fb = await athlete('بسبب التكرار');
    ok(fb.classList.contains('is-correct'), fb.textContent);
  });

  it('يقبل «يتآكل من كثرة الاحتكاك» — والهمزة مطبَّعة', async function(){
    const fb = await athlete('يتآكل من كثرة الاحتكاك');
    ok(fb.classList.contains('is-correct'), fb.textContent);
  });

  it('يقبل صيغة تحمل ضميرًا ملحَقًا: «كثرة استعماله وإجهاده»', async function(){
    const fb = await athlete('كثرة استعماله وإجهاده');
    ok(fb.classList.contains('is-correct'), fb.textContent);
  });

  it('مخرج النجاة يظهر بعد محاولتين ويمنح 4', async function(){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's5PredictOptions', 'b');
    h.click(doc, 's5ToggleBtn');
    h.choose(doc, 'u2l3-symptoms', 'correct');
    h.type(doc, 's5AthleteInput', 'لا أدري'); h.click(doc, 's5AthleteBtn');
    h.type(doc, 's5AthleteInput', 'لا أدري بعد'); h.click(doc, 's5AthleteBtn');
    ok(h.visible(doc, 's5AthleteModelBtn'));
    const before = w.XP.total();
    h.click(doc, 's5AthleteModelBtn');
    eq(w.XP.total() - before, 4);
  });
});

/* ---------- المحطة 3 ---------- */
describe('الوحدة 02 · الدرس 03 — المحطة 3: الاحتكاك والبناء', function(){
  it('سؤال التنبّؤ يسبق المسرح، والمسرح لا يظهر قبله', async function(){
    const { doc } = await page();
    no(h.visible(doc, 's3FricWrap'), 'المسرح ظاهر قبل التنبّؤ');
    no(h.visible(doc, 's3RunRow'));
    pick(doc, 's3PredictOptions', 'b');
    ok(h.visible(doc, 's3RunRow'));
  });


  /* ═══ حرّاس الدرج والمؤشّر — أُضيفت في 12 أغسطس 2026 ═══ */

  it('سجلّ القياس يتراكم: شريط مسمّى لكل حالة يبقى ظاهرًا للمقارنة', async function(){
    const s = await page();
    const { doc, w } = s;
    const width = function(n){ return parseFloat(doc.getElementById('fricFill' + n).style.width); };
    pick(doc, 's3PredictOptions', 'a');
    for(let i = 1; i <= 3; i++){
      h.click(doc, 's3RunBtn');
      await h.tick(w, 60);
      for(let k = 1; k <= 3; k++){
        eq(h.visible(doc, 'fricRow' + k), k <= i,
           'صفّ ' + k + ' في حال خاطئة بعد ' + i + ' ضغطات');
      }
    }
    ok(width(1) > width(2) && width(2) > width(3),
       'الأشرطة الثلاثة لا تتدرّج: ' + [width(1), width(2), width(3)].join(' → '));
    ok(width(3) > 0, 'الشريط الأخير بلغ الصفر — والاحتكاك لا ينعدم');
  });

  it('لا وصف نصّي للحالتين الأوليين: الشريط المسمّى والحركة يغنيان', async function(){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's3PredictOptions', 'a');
    h.click(doc, 's3RunBtn'); await h.tick(w, 30);
    no(h.visible(doc, 'fricWord'), 'وصف ظهر عند الحالة الأولى');
    h.click(doc, 's3RunBtn'); await h.tick(w, 30);
    no(h.visible(doc, 'fricWord'), 'وصف ظهر عند الحالة الثانية');
    h.click(doc, 's3RunBtn'); await h.tick(w, 30);
    ok(h.visible(doc, 'fricWord'), 'سطر التسمية لم يظهر عند الحالة الثالثة');
    has(h.text(doc, 'fricWord'), 'السائل الزلالي');
  });

  it('لكل شريط قراءة مسموعة، فلا يفقد الطالب الكفيف المقدار', async function(){
    const { doc, raw } = await page();
    const reads = [1, 2, 3].map(function(n){
      const el = doc.getElementById('fricSr' + n);
      ok(!!el, 'الصفّ ' + n + ' بلا قراءة مسموعة');
      return el.textContent.trim();
    });
    has(reads[0], 'شديد');
    has(reads[1], 'أقلّ');
    has(reads[2], 'سلس');
    /* مخفيّة عن العين لا عن قارئ الشاشة: display:none يُسقطها منه أيضًا */
    const rule = /\.sr-only\{([^}]*)\}/.exec(raw.replace(/\s*\n\s*/g, ''));
    ok(!!rule, 'لا صنف إخفاء بصري');
    no(/display:none/.test(rule[1]), 'الإخفاء يمنع قارئ الشاشة أيضًا');
    ok(/clip:/.test(rule[1]) || /clip-path:/.test(rule[1]));
  });

  it('الغشاء الزلالي لا يشترك في النحو البصري للخانة الفارغة', async function(){
    const { doc, raw } = await page();
    const flat = raw.replace(/\s*\n\s*/g, '');
    const memb = /\.knee \.memb\{([^}]*)\}/.exec(flat);
    ok(!!memb, 'لم أجد قاعدة الغشاء');
    /* متقطّع + لون قريب من التركوازي = نحو الخانة الفارغة وخطّ الربط */
    no(/stroke-dasharray/.test(memb[1]), 'الغشاء متقطّع فيُقرأ خانة تنتظر رقاقة');
    no(/turquoise/.test(memb[1]), 'الغشاء بلون التفاعل');
    /* ولا يُبيَّض لئلا يُخلط بالغضروف */
    const cart = /\.knee \.cart-f\{([^}]*)\}/.exec(flat);
    const c1 = /stroke:\s*([^;]+)/.exec(memb[1]);
    if(c1 && cart){
      no(new RegExp(c1[1].trim()).test(cart[1]), 'الغشاء بلون الغضروف نفسه');
    }
    /* والخانات تبقى متقطّعة: هي وحدها من يحمل هذا النحو */
    const slot = /\.slot\{([^}]*)\}/.exec(flat) || /\.knee-slot\{([^}]*)\}/.exec(flat);
    ok(doc.querySelectorAll('.knee-slot').length >= 5);
  });

  it('لكل صفّ تسمية تقول ما أُضيف، فلا يبقى شريط بلا تفسير', async function(){
    const { doc } = await page();
    const labels = Array.from(doc.querySelectorAll('#s3Gauge .gauge-label'))
                        .map(function(n){ return n.textContent.trim(); });
    eq(labels.length, 3);
    has(labels[0], 'بلا شيء');
    has(labels[1], 'الطبقة الملساء');
    has(labels[2], 'السائل');
    /* الاسم الكامل «السائل الزلالي» يبقى لسطر القراءة بعد الظهور */
    no(/الزلالي/.test(labels.join(' ')), 'الاسم سبق رؤية أثره');
  });

  it('الأشرطة الثلاثة تتدرّج لونًا من المرجاني ولا يبلغ أيٌّ منها التركوازي', async function(){
    const { doc, raw } = await page();
    const cls = function(n){ return doc.getElementById('fricFill' + n).className; };
    no(/lvl-/.test(cls(1)), 'الشريط الأول ليس بلون التحذير الأساسي');
    has(cls(2), 'lvl-2');
    has(cls(3), 'lvl-3');
    /* التركوازي يعني «قابل للنقر» على المنصّة — فلا يحمل معنى ثانيًا */
    const flat = raw.replace(/\s*\n\s*/g, '');
    ['\\.gauge-fill\\{', '\\.gauge-fill\\.lvl-2\\{', '\\.gauge-fill\\.lvl-3\\{'].forEach(function(r){
      const m = new RegExp(r + '([^}]*)\\}').exec(flat);
      ok(!!m, 'لم أجد قاعدة ' + r);
      no(/turquoise/.test(m[1]), 'شريط بلون التفاعل');
    });
    no(doc.getElementById('fricGhost'), 'الأثر الباهت ما زال في الوسم');
  });

  it('الأشرطة عناصر مرسومة تنشأ من اليمين، لا عناصر سطريّة', async function(){
    const { doc, raw } = await page();
    const flat = raw.replace(/\s*\n\s*/g, '');
    const fill = /\.gauge-fill\{([^}]*)\}/.exec(flat);
    ok(!!fill, 'لم أجد قاعدة الشريط');
    ok(/display:\s*block/.test(fill[1]) || /position:\s*absolute/.test(fill[1]),
       'الشريط سطريّ فلا يُرسم له عرض ولا ارتفاع');
    ok(/right:0/.test(fill[1]) && !/left:0/.test(fill[1]), 'الشريط ما زال مثبَّتًا عند اليسار');
    const track = /\.gauge-track\{([^}]*)\}/.exec(flat);
    ok(/direction:rtl/.test(track[1]), 'المسار ما زال ينشأ من اليسار');
    /* العظم المتحرّك على يمين المسرح — وهو ما يجب أن يوافقه المنشأ */
    const right = doc.getElementById('fricRight');
    const x = parseFloat(/M\s*(-?[\d.]+)/.exec(right.querySelector('.bone-end').getAttribute('d'))[1]);
    ok(x > 170, 'العظم المتحرّك ليس على يمين المسرح — يسقط سبب اتّجاه المؤشّر');
    for(let n = 1; n <= 3; n++){
      eq(doc.getElementById('fricFill' + n).parentElement.className, 'gauge-track');
    }
  });

  it('لا رقم معروض على المؤشّر: وحدةٌ لا سند لها في الكتاب', async function(){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's3PredictOptions', 'a');
    runFriction(doc, 3);
    await h.tick(w, 60);
    no(doc.getElementById('fricNum'), 'خانة الرقم ما زالت في الوسم');
    const gaugeTxt = visibleText(doc.getElementById('s3Gauge'));
    no(/\d/.test(gaugeTxt), 'رقم معروض داخل المؤشّر: ' + gaugeTxt.trim());
  });

  it('التجربة درج بيد الطالب: كل ضغطة حالة واحدة لا ثلاث', async function(){
    const s = await page();
    const { doc, w } = s;
    const cls = function(){ return doc.getElementById('fricStage').getAttribute('class'); };
    pick(doc, 's3PredictOptions', 'a');
    h.click(doc, 's3RunBtn');
    await h.tick(w, 60);
    eq(cls(), 'stage fric s1', 'الضغطة الأولى تخطّت الحالة الأولى');
    no(h.visible(doc, 's3PatternBox'), 'سؤال النمط ظهر عند الحالة الأولى');
    h.click(doc, 's3RunBtn');
    await h.tick(w, 60);
    eq(cls(), 'stage fric s2');
    no(h.visible(doc, 's3PatternBox'), 'سؤال النمط ظهر عند الحالة الثانية');
    h.click(doc, 's3RunBtn');
    await h.tick(w, 60);
    eq(cls(), 'stage fric s3');
    ok(h.visible(doc, 's3PatternBox'));
  });

  it('تسمية الزرّ تعلن الفعل التالي، ويُهبَّط عند آخر حالة', async function(){
    const s = await page();
    const { doc, w } = s;
    const btn = doc.getElementById('s3RunBtn');
    pick(doc, 's3PredictOptions', 'a');
    has(btn.textContent, 'شغّل التجربة');
    h.click(doc, 's3RunBtn'); await h.tick(w, 20);
    has(btn.textContent, 'الطبقة الملساء');
    ok(h.visible(doc, 's3Watch'), 'سطر «راقب المؤشّر» لم يظهر');
    h.click(doc, 's3RunBtn'); await h.tick(w, 20);
    has(btn.textContent, 'سائلًا');
    h.click(doc, 's3RunBtn'); await h.tick(w, 20);
    ok(btn.disabled, 'الزرّ ما زال فعّالًا بعد آخر حالة');
    ok(btn.classList.contains('demoted'));
    /* النصّ لا يَعِد بفعلٍ استُهلك: «أضِف سائلًا» بعد إضافة السائل */
    has(btn.textContent, 'اكتملت التجربة');
    no(/أضِف/.test(btn.textContent), 'الزرّ ما زال يدعو إلى فعلٍ انتهى');
    no(h.visible(doc, 's3Watch'), 'سطر المراقبة بقي بعد انتهاء التجربة');
  });



  /* العطل الأصلي: عنصرا الشريط <span> سطريّان بطبعهما، والسطريّ
     يتجاهل العرض والارتفاع بالنسبة المئوية — فلم يُرسم الشريط قطّ
     منذ بناء الدرس. والاختبار القديم كان يقرأ قيمة العرض المكتوبة
     ولا يسأل هل للعنصر صندوق يُرسم أصلًا. */

  it('طرفا المقياس يُحاذيان الشريط ببنية الصفّ لا بحشوة مقدَّرة', async function(){
    const { doc, raw } = await page();
    const ends = doc.querySelectorAll('.gauge-scale-ends span');
    eq(ends.length, 2);
    /* المنشأ عند اليمين، فـ«سلس» (الصفر) عنده و«شديد» في أقصى المدى */
    /* الصفّ direction:rtl، فأوّل عنصر يقع يمينًا — وهو منشأ الشريط
       أي الصفر. وقلبُ الترتيب مع قلبِ الاتجاه معًا كان يعكس الكلمتين. */
    eq(ends[0].textContent, 'سلس');
    eq(ends[1].textContent, 'شديد');
    const flat = raw.replace(/\s*\n\s*/g, '');
    const row = /\.gauge-scale-ends\{([^}]*)\}/.exec(flat);
    const track = /\.gauge-track\{([^}]*)\}/.exec(flat);
    eq(/direction:(rtl|ltr)/.exec(row[1])[1], /direction:(rtl|ltr)/.exec(track[1])[1],
       'اتجاه صفّ الكلمتين يخالف اتجاه الشريط فتظهران معكوستين');
    ok(!!doc.querySelector('.gauge-scale-pad'), 'لا عمود موازٍ لتسمية المؤشّر');
    no(/padding-inline-start:98px/.test(raw), 'الحشوة المقدَّرة ما زالت في الأنماط');
  });


  it('قراءة المؤشّر تعيش داخل البطاقة تحت الشريط لا بعد الزرّ', async function(){
    const { doc } = await page();
    const wrap = doc.getElementById('s3FricWrap');
    ok(wrap.contains(doc.getElementById('fricWord')), 'الوصف انفصل عن الشريط الذي يصفه');
    const inner = doc.getElementById('s3Gauge').innerHTML;
    ok(inner.indexOf('gauge-track') < inner.indexOf('id="fricWord"'), 'الوصف قبل الشريط');
  });


  it('المؤشّر داخل بطاقة المسرح، والزرّ أسفلها', async function(){
    const { doc } = await page();
    const wrap = doc.getElementById('s3FricWrap');
    ok(wrap.contains(doc.getElementById('s3Gauge')), 'المؤشّر خارج بطاقة المسرح');
    no(wrap.contains(doc.getElementById('s3RunBtn')), 'الزرّ داخل البطاقة');
    /* ترتيب المعنى: أرى ← أقيس ← أضيف */
    const order = doc.getElementById('station-3').innerHTML;
    ok(order.indexOf('id="s3FricWrap"') < order.indexOf('id="s3RunRow"'),
       'الزرّ ما زال قبل المسرح');
  });

  it('السائل الزلالي يُسمّى بعد رؤيته لا قبله', async function(){
    const { doc } = await page();
    pick(doc, 's3PredictOptions', 'a');
    no(/السائل الزلالي/.test(visibleText(doc.getElementById('station-3'))),
       'اسم السائل الزلالي ظهر للطالب قبل تشغيل التجربة');
  });

  it('سؤال النمط لا يظهر قبل انتهاء الحالات الثلاث', async function(){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's3PredictOptions', 'a');
    no(h.visible(doc, 's3PatternBox'));
    runFriction(doc, 2);
    await h.tick(w, 60);
    no(h.visible(doc, 's3PatternBox'), 'ظهر قبل الحالة الثالثة');
    runFriction(doc, 1);
    await h.tick(w, 60);
    ok(h.visible(doc, 's3PatternBox'));
  });

  it('نشاط البناء لا يكتمل إلا بخمس خانات، والتسمية تلحقه', async function(){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's3PredictOptions', 'a');
    runFriction(doc, 3);
    await h.tick(w, 60);
    h.choose(doc, 'u2l3-friction-pattern', 'correct');
    eq(doc.querySelectorAll('[data-chips="u2l3-build"] .slot').length, 5);
    const pairs = [['عضلة','s3-slot-muscle'], ['وتر','s3-slot-tendon'], ['رباط','s3-slot-ligament'],
                   ['غضروف','s3-slot-cartilage'], ['السائل الزلالي','s3-slot-fluid']];
    pairs.slice(0, 4).forEach(function(p){ chipInto(doc, w, p[0], p[1]); });
    no(h.visible(doc, 's3NameLine'), 'اسم المفصل الزلالي ظهر قبل اكتمال البناء');
    chipInto(doc, w, pairs[4][0], pairs[4][1]);
    ok(h.visible(doc, 's3NameLine'));
    has(h.text(doc, 's3NameLine'), 'المفصل الزلالي');
    ok(h.visible(doc, 's3NameBox'));
  });

  it('رقاقة في خانة خطأ تُعطي تلميحًا مركّبًا يخاطب الخطأ نفسه', async function(){
    const s = await page();
    const { doc, w } = s;
    pick(doc, 's3PredictOptions', 'a');
    runFriction(doc, 3);
    await h.tick(w, 60);
    h.choose(doc, 'u2l3-friction-pattern', 'correct');
    chipInto(doc, w, 'وتر', 's3-slot-ligament');
    const slot = doc.getElementById('s3-slot-ligament');
    no(slot.classList.contains('correct'), 'الخانة قبلت رقاقة خاطئة');
    const fb = doc.querySelector('[data-chips="u2l3-build"] .chips-feedback');
    ok(fb && !fb.hidden, 'لا عنصر تلميح للرقاقات — التلميحات المكتوبة لا تصل الطالب');
    has(fb.textContent, 'يصل بين عظم وعظم');
  });

  it('الغشاء الزلالي مرسوم ومسمّى بلا خانة وبلا رقاقة', async function(){
    const { doc } = await page();
    has(doc.querySelector('.stage-caption').textContent, 'الغشاء الزلالي');
    eq(doc.querySelectorAll('.chip[data-value*="الغشاء"]').length, 0);
    eq(doc.querySelectorAll('.slot[data-answer*="الغشاء"]').length, 0);
    no(/الغشاء/.test(doc.getElementById('station-6').textContent),
       'الغشاء الزلالي دخل التقييم وهو خارج قائمة المصطلحات المقرَّرة');
  });
});

/* ---------- المحطة 4 ---------- */
describe('الوحدة 02 · الدرس 03 — المحطة 4: أنواع المفاصل', function(){
  it('سؤال الكتف لا يظهر قبل تحريكه فعلًا', async function(){
    const { doc } = await page();
    no(h.visible(doc, 's4BallBox'));
    arrow(doc.getElementById('humerusRotor'), 'ArrowRight', 5);
    ok(h.visible(doc, 's4BallBox'));
  });

  it('المرفق يقف عند حدّه ويعلن ذلك برسالة لا باهتزاز', async function(){
    const { doc } = await page();
    const ulna = doc.getElementById('ulnaRotor');
    arrow(ulna, 'ArrowLeft', 12);
    eq(ulna.style.transform, 'rotate(-140.00deg)', 'المرفق تجاوز حدّه أو لم يبلغه');
    has(h.text(doc, 'elbowMsg'), 'لا يمضي أبعد');
    no(ulna.classList.contains('shake'), 'الاهتزاز محجوز للممنوع لا للناقص');
  });

  it('الكتف يدور في مدى أوسع من المرفق وفي الاتجاهين', async function(){
    const { doc } = await page();
    const hum = doc.getElementById('humerusRotor');
    arrow(hum, 'ArrowRight', 30);
    eq(hum.style.transform, 'rotate(95.00deg)');
    arrow(hum, 'ArrowLeft', 60);
    eq(hum.style.transform, 'rotate(-70.00deg)');
    /* مدى الكتف أوسع من مدى المرفق — وهو أصل المقارنة في هذه المحطة */
    const ulna = doc.getElementById('ulnaRotor');
    const rng = function(n){
      return Math.abs(parseFloat(n.getAttribute('aria-valuemax')) -
                      parseFloat(n.getAttribute('aria-valuemin')));
    };
    ok(rng(hum) > rng(ulna), 'مدى الكتف لم يعد أوسع: ' + rng(hum) + ' مقابل ' + rng(ulna));
  });

  /* ═══ حرّاس مدى المفصلين — أُضيفت في 12 أغسطس 2026 ═══ */

  it('المرفق يقف عند استقامة الذراع ولا ينثني إلى الخلف', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('elbowStage');
    const ulna = doc.getElementById('ulnaRotor');
    /* ميل العَضُد: من طرفه الحرّ إلى المحور */
    const humAng = Math.atan2(150 - 118, 154 - 18) * 180 / Math.PI;
    /* ميل الساعد المرسوم: من المحور إلى طرفه الحرّ */
    const rad = ulna.querySelector('circle');
    const ulAng = Math.atan2(parseFloat(rad.getAttribute('cy')) - 150,
                             parseFloat(rad.getAttribute('cx')) - 150) * 180 / Math.PI;
    const maxA = parseFloat(ulna.getAttribute('aria-valuemax'));
    /* عند أقصى تمدّد يجب ألّا يهبط الساعد تحت خطّ العَضُد */
    const openAt = ulAng + maxA - humAng;
    ok(openAt <= 1.5,
       'الساعد يمضي ' + openAt.toFixed(1) + '° بعد الاستقامة — انثناء إلى الخلف');
    ok(openAt > -12, 'الحدّ ضيّق أكثر ممّا ينبغي: ' + openAt.toFixed(1) + '°');
  });

  it('طرف الذراع يبقى داخل مشهد الكتف عند حدّي الحركة', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('shoulderStage');
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const hum = doc.getElementById('humerusRotor');
    const circles = Array.from(hum.querySelectorAll('circle'));
    const pivot = circles[0], tip = circles[circles.length - 1];
    const px = parseFloat(pivot.getAttribute('cx')), py = parseFloat(pivot.getAttribute('cy'));
    const tx = parseFloat(tip.getAttribute('cx')),  ty = parseFloat(tip.getAttribute('cy'));
    const r  = parseFloat(tip.getAttribute('r'));
    const len = Math.hypot(tx - px, ty - py);
    const base = Math.atan2(ty - py, tx - px);
    [parseFloat(hum.getAttribute('aria-valuemin')),
     parseFloat(hum.getAttribute('aria-valuemax'))].forEach(function(a){
      const th = base + a * Math.PI / 180;
      const x = px + len * Math.cos(th), y = py + len * Math.sin(th);
      ok(x - r >= vb[0] && x + r <= vb[0] + vb[2] &&
         y - r >= vb[1] && y + r <= vb[1] + vb[3],
         'عند ' + a + '° يخرج طرف الذراع إلى (' + x.toFixed(0) + ',' + y.toFixed(0) + ')');
    });
  });

  it('سؤال النمط يجعل الكرة طرفَ العظم لا جسمًا يقترب منه', async function(){
    const { doc } = await page();
    const grp = doc.querySelector('.quiz-options[data-q="u2l3-type-pattern"]');
    const right = grp.querySelector('input[value="correct"]').parentElement.textContent.trim();
    /* «اقترب من كرة» فعل مسافة، والمشهد فيه جسمان أصلًا — فتُقرأ
       الكرة جسمًا ثالثًا خارج العظم. */
    no(/اقترب/.test(right), 'الجواب يوحي بأنّ الكرة جسم منفصل: ' + right);
    ok(/طرف العظم\s+كرة/.test(right), 'الجواب لا يقرّر أنّ طرف العظم هو الكرة: ' + right);
  });

  it('سطر التسمية يسمّي المفصلين ولا يشير إليهما بترتيب لا مرجع له', async function(){
    const { doc } = await page();
    const line = doc.getElementById('s4NameLine').textContent;
    has(line, 'الكتف');
    has(line, 'المرفق');
    /* «الأول/الثاني» بلا مرجع: ترتيب البطاقتين يتبدّل بتبدّل عرض
       الشاشة (flex-wrap)، وقارئ الشاشة يتبع ترتيب الوسم لا العرض. */
    no(/الأول|الثاني/.test(line), 'التسمية تشير بالترتيب لا بالاسم: ' + line);
    /* والاسمان موجودان على البطاقتين فعلًا، وإلا فالربط بلا سند */
    const caps = Array.from(doc.querySelectorAll('.cell-cap')).map(function(n){ return n.textContent; }).join(' ');
    has(caps, 'الكتف');
    has(caps, 'المرفق');
    /* وكل مفصل مقرون بنوعه الصحيح في السطر نفسه */
    ok(line.indexOf('الكتف') < line.indexOf('كروي'), 'الكتف غير مقرون بالكروي');
    ok(line.indexOf('المرفق') < line.indexOf('رزّي'), 'المرفق غير مقرون بالرزّي');
  });

  it('تعليمة المرفق تدعو إلى المحاولة ولا تَعِد بفعل لا يستطيعه', async function(){
    const { doc } = await page();
    const caps = Array.from(doc.querySelectorAll('.cell-cap')).map(function(n){ return n.textContent; });
    const elbow = caps.filter(function(t){ return /المرفق/.test(t); })[0];
    ok(!!elbow, 'لا تعليمة للمرفق');
    ok(/جرّب/.test(elbow), 'تعليمة المرفق تأمر بسحبه في أي اتجاه وهو لا يستجيب لكلّها');
  });

  it('سطر التسمية لا يظهر إلا بعد الإجابة عن السؤالين معًا', async function(){
    const { doc } = await page();
    arrow(doc.getElementById('humerusRotor'), 'ArrowRight', 5);
    arrow(doc.getElementById('ulnaRotor'), 'ArrowLeft', 12);
    h.choose(doc, 'u2l3-ball-socket', 'correct');
    no(h.visible(doc, 's4NameLine'), 'التسمية ظهرت بعد سؤال واحد');
    h.choose(doc, 'u2l3-hinge', 'correct');
    ok(h.visible(doc, 's4NameLine'));
  });

  it('خانتا التصنيف متعدّدتا السعة لا تُقفلان إلا باكتمال رقاقتيهما', async function(){
    const { doc, w } = await page();
    arrow(doc.getElementById('humerusRotor'), 'ArrowRight', 5);
    arrow(doc.getElementById('ulnaRotor'), 'ArrowLeft', 12);
    h.choose(doc, 'u2l3-ball-socket', 'correct');
    h.choose(doc, 'u2l3-hinge', 'correct');
    const ball = doc.getElementById('s4-slot-ball');
    eq(ball.dataset.answer, 'الكتف|الورك');
    chipInto(doc, w, 'الكتف', 's4-slot-ball');
    no(ball.classList.contains('correct'), 'الخانة أُقفلت برقاقة واحدة من رقاقتين');
    ok(ball.classList.contains('partial'));
    chipInto(doc, w, 'الورك', 's4-slot-ball');
    ok(ball.classList.contains('correct'));
  });

  it('جدول الأعداد لا يظهر قبل الإجابة عن u2l3-joint-count', async function(){
    const s = await page();
    const { doc, w } = s;
    arrow(doc.getElementById('humerusRotor'), 'ArrowRight', 5);
    arrow(doc.getElementById('ulnaRotor'), 'ArrowLeft', 12);
    h.choose(doc, 'u2l3-ball-socket', 'correct');
    h.choose(doc, 'u2l3-hinge', 'correct');
    [['الكتف','s4-slot-ball'], ['الورك','s4-slot-ball'],
     ['المرفق','s4-slot-hinge'], ['الركبة','s4-slot-hinge']]
      .forEach(function(p){ chipInto(doc, w, p[0], p[1]); });
    h.choose(doc, 'u2l3-ardha-kick', 'correct');
    no(h.visible(doc, 's4TableBox'), 'الجدول كُشف قبل التنبّؤ');
    pick(doc, 's4CountOptions', 'c');
    ok(h.visible(doc, 's4TableBox'));
  });

  it('أرقام الجدول غربية، ولا تُوصف مفاصله بأنها زلالية، ولا يُطلب حفظها', async function(){
    const { doc } = await page();
    const table = doc.querySelector('.count-table');
    const nums = Array.prototype.map.call(table.querySelectorAll('td.n'), function(n){ return n.textContent.trim(); });
    eq(nums.join(' '), '27 3 3 128 3 2 33');
    nums.forEach(function(n){ ok(/^[0-9]+$/.test(n), 'رقم غير غربي: ' + n); });
    const box = doc.getElementById('s4TableBox').textContent;
    no(/زلالي/.test(box), 'مفاصل الجدول وُصفت بأنها زلالية — والكتاب لا يقولها');
    has(box, 'لا يُطلب منك حفظ');
  });
});

/* ---------- المحطة 5 ---------- */
describe('الوحدة 02 · الدرس 03 — المحطة 5: تلف الغضروف', function(){
  it('المسرح لا يظهر قبل التنبّؤ، والزرّ يبدّل بين الحالتين', async function(){
    const { doc } = await page();
    no(h.visible(doc, 's5StageWrap'));
    pick(doc, 's5PredictOptions', 'b');
    ok(h.visible(doc, 's5StageWrap'));
    const stage = doc.getElementById('dmgStage');
    no(stage.classList.contains('dmg'));
    h.click(doc, 's5ToggleBtn');
    ok(stage.classList.contains('dmg'));
    h.click(doc, 's5ToggleBtn');
    no(stage.classList.contains('dmg'), 'التبديل في اتجاه واحد فقط');
  });

  it('التحدّي الاختياري خلف رابط نصّي ولا يظهر قبل الإجابة القصيرة', async function(){
    const { doc } = await page();
    pick(doc, 's5PredictOptions', 'b');
    h.click(doc, 's5ToggleBtn');
    h.choose(doc, 'u2l3-symptoms', 'correct');
    no(h.visible(doc, 's5BonusRow'));
    h.type(doc, 's5AthleteInput', 'بسبب تكرار الحركة');
    h.click(doc, 's5AthleteBtn');
    ok(h.visible(doc, 's5BonusRow'));
    ok(doc.getElementById('s5BonusLink').classList.contains('link-btn'), 'التحدّي ليس رابطًا نصّيًّا');
    no(h.visible(doc, 's5BonusBox'));
    h.click(doc, 's5BonusLink');
    ok(h.visible(doc, 's5BonusBox'));
  });

  it('الانتقال إلى التقييم متاح بلا حلّ التحدّي الاختياري', async function(){
    const { doc } = await page();
    pick(doc, 's5PredictOptions', 'b');
    h.click(doc, 's5ToggleBtn');
    h.choose(doc, 'u2l3-symptoms', 'correct');
    h.type(doc, 's5AthleteInput', 'بسبب تكرار الحركة');
    h.click(doc, 's5AthleteBtn');
    ok(h.visible(doc, 's5done'));
  });
});

/* ---------- المحطة 6 ---------- */
describe('الوحدة 02 · الدرس 03 — المحطة 6: التقييم والشهادة', function(){
  it('عشرة أسئلة: ثمانية اختيار وسؤالان نصّيان', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#evalQuestions .eval-q').length, 10);
    eq(doc.querySelectorAll('#evalQuestions .quiz-options').length, 8);
    eq(doc.querySelectorAll('#evalQuestions .explore-answer-row').length, 2);
  });

  it('الأسئلة لا تظهر قبل بوابة الاسم', async function(){
    const { doc } = await page();
    no(h.visible(doc, 'evalQuestions'));
    h.type(doc, 'evalName', 'فؤاد');
    h.click(doc, 'evalStart');
    ok(h.visible(doc, 'evalQuestions'));
  });

  it('محاولة واحدة: تُقفل عند أول اختيار أيًّا كان', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.choose(doc, 'u2l3-e1', 'w1');
    const again = h.choose(doc, 'u2l3-e1', 'correct');
    ok(again.blocked, 'التقييم سمح بمحاولة ثانية');
  });

  it('عند الخطأ يُوسَم اختيار الطالب ويُضاء الصحيح مع سطر يشرح', async function(){
    const { doc } = await page();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.choose(doc, 'u2l3-e1', 'w1');
    const group = h.groupByName(doc, 'u2l3-e1');
    ok(group.querySelector('input[value="w1"]').closest('.quiz-option').classList.contains('incorrect'));
    ok(group.querySelector('input[value="correct"]').closest('.quiz-option').classList.contains('correct'));
    has(h.text(doc, 'fb-u2l3-e1'), 'الرباط');
  });

  it('السؤال 9 يقبل «الغضروف» و«غضاريف»', async function(){
    for(const ans of ['الغضروف', 'غضاريف', 'غضروف']){
      const { doc } = await page();
      h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
      h.type(doc, 'e9Input', ans); h.click(doc, 'e9Btn');
      ok(doc.getElementById('fb-e9').classList.contains('is-correct'), 'رُفضت: ' + ans);
    }
  });

  it('السؤال 10 يقبل «الكتف» و«الورك» ويرفض «الركبة»', async function(){
    for(const ans of ['الكتف', 'الورك', 'مفصل الحوض']){
      const { doc } = await page();
      h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
      h.type(doc, 'e10Input', ans); h.click(doc, 'e10Btn');
      ok(doc.getElementById('fb-e10').classList.contains('is-correct'), 'رُفضت: ' + ans);
    }
    for(const ans of ['الركبة', 'المرفق', 'الركبة والكتف']){
      const { doc } = await page();
      h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
      h.type(doc, 'e10Input', ans); h.click(doc, 'e10Btn');
      no(doc.getElementById('fb-e10').classList.contains('is-correct'), 'قُبلت: ' + ans);
    }
  });

  it('الشهادة تُستدعى بعنوان الدرس بلا بادئة «الدرس رقم»', async function(){
    const s = await page();
    await completeAll(s, { evaluate: true });
    eq(s.certCalls.length, 1, 'الشهادة لم تُستدعَ مرّة واحدة');
    eq(s.certCalls[0][1], 'ما تركيب المفاصل الزلالية؟');
    eq(s.certCalls[0][0], 'طالب تجريبي');
    eq(s.certCalls[0][2], 100);
  });
});

/* ---------- حرّاس جودة التقييم ---------- */
describe('الوحدة 02 · الدرس 03 — حرّاس جودة الأسئلة', function(){
  function mcqGroups(doc){
    return Array.prototype.filter.call(doc.querySelectorAll('.quiz-options[data-q]'), function(g){
      return !!g.querySelector('input[value="correct"]');
    });
  }
  function positionOf(group){
    const radios = Array.prototype.slice.call(group.querySelectorAll('input[type="radio"]'));
    return radios.findIndex(function(r){ return r.value === 'correct'; });
  }

  it('لكل سؤال اختيار أربعة خيارات أو ثلاثة، وواحد صحيح لا أكثر', async function(){
    const { doc } = await page();
    mcqGroups(doc).forEach(function(g){
      const n = g.querySelectorAll('.quiz-option').length;
      ok(n === 3 || n === 4, g.dataset.q + ' عدد خياراته ' + n);
      eq(g.querySelectorAll('input[value="correct"]').length, 1, g.dataset.q + ' فيه أكثر من إجابة صحيحة');
    });
  });
});

/* ---------- النطاق ---------- */
describe('الوحدة 02 · الدرس 03 — حدود النطاق', function(){
  it('لا لفظ خارج نطاق الدرس في أي نصّ يراه الطالب', async function(){
    const { doc } = await page();
    const body = doc.body.textContent;
    ['رافعة', 'منزلق', 'محوري', 'تنقبض', 'تنبسط', 'الانقباض', 'العضلات المتضادة',
     'ذات الرأسين', 'ثلاثية الرؤوس', 'المأبضية', 'رباعية الرؤوس']
      .forEach(function(w){ no(body.indexOf(w) !== -1, 'لفظ خارج النطاق ظهر للطالب: ' + w); });
  });

  it('لفظ «محور» وحده مسموح كما في الكتاب، بلا بناء عليه', async function(){
    const { doc } = await page();
    has(doc.body.textContent, 'محور');
  });

  it('المصطلحات المقرَّرة السبعة كلّها تظهر في الدرس', async function(){
    const { doc } = await page();
    const body = doc.body.textContent;
    ['الوتر', 'الرباط', 'الغضروف', 'المفصل الزلالي', 'مفصل كروي', 'مفصل رزّي', 'السائل الزلالي']
      .forEach(function(t){ has(body, t, 'مصطلح مقرَّر مفقود: ' + t); });
  });

  it('لا اسم عظم خارج ما دُرِّس في هذه الوحدة', async function(){
    const { doc } = await page();
    const body = doc.body.textContent;
    ['عظم الساق', 'الظنبوب', 'القصبة', 'الشظية', 'الكعبرة', 'الزند', 'لوح الكتف']
      .forEach(function(w){ no(body.indexOf(w) !== -1, 'اسم عظم خارج الكتاب: ' + w); });
  });
});

/* ــــ قواعد أسئلة الاختيار — حرّاس مشتركة (tests/guards.js) ــــ
   القاعدتان منصّيّتان لا خاصّتين بهذا الدرس، فتُقرآن من موضع
   واحد. والعتبات هنا لأنّ الدرس يحتملها لا لأنها القاعدة. */
async function guardDoc(){ return (await page()).doc; }
const api = { describe, it, eq, ok, no, has };
guards.describeMcqRules(api, guardDoc, {
    evalSpread:   { expect: 8, minDistinct: 4, maxAtOne: 2 },
    lessonSpread: { minDistinct: 4 }
  });

run();
