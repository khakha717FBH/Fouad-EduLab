'use strict';
/* ==========================================================
   اختبارات سلوك — الوحدة 01 · الدرس 01
   "ما تركيب الذرّة؟"
   ----------------------------------------------------------
   كُتبت من جديد كليًّا: النسخة السابقة كانت تفحص درسًا بخمس
   محطات وأسئلة داخلية (‎#q1-options‎) وثلاثة إطارات خارجية،
   وقد أُعيد بناء الدرس من القالب فسقط ذلك كلّه.

   وتُكتب على ما يفعله الطالب ويراه لا على البنية الداخلية:
   المجموعات تُلتقط باسم حقل الراديو، والمقابض بمعرّفاتها لأنها
   جزء من دلالة الواجهة.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');
const guards = require('./guards');
const fs = require('fs');
const path = require('path');

const FILE = 'semester-1/unit-01/lesson-01.html';
const ROOT = process.env.EDULAB_ROOT || path.resolve(__dirname, '..');
const RAW  = fs.readFileSync(path.join(ROOT, FILE), 'utf8');

/* ما يقرأه الطالب وحده: تعليقات الوسم وتعليقات السكربت تُنزع قبل أي
   فحص منع. كتلة قرارات الدرس تذكر بالضرورة ما قُرّر إسقاطه ولماذا
   (الروابط الخارجية القديمة · النظائر · بند الفراغ)، وحارسٌ يقرؤها
   يتّهم التوثيق بأنه تسريب. والقاعدة: الحارس يقيس ما يصل الطالب. */
const BODY = RAW.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

let cached = null;
async function page(){
  if(!cached) cached = await h.loadLesson(FILE, {});
  return cached;
}
function fresh(opts){
  const s = { ready: null };
  s.boot = function(){
    if(!s.ready) s.ready = h.loadLesson(FILE, opts || {}).then(r => Object.assign(s, r));
    return s.ready;
  };
  return s;
}

/* ــــ أدوات محلّية ــــ */
function fillCard(doc, id, p, e, n){
  h.type(doc, id + '-p', String(p));
  h.type(doc, id + '-e', String(e));
  h.type(doc, id + '-n', String(n));
  h.click(doc, id + '-btn');
}
function ringHits(doc){
  return Array.from(doc.querySelectorAll('#atomStage circle.ring-hit'));
}
function buildNucleus(doc){
  for(let i = 0; i < 9;  i++) h.click(doc, 'addProton');
  for(let i = 0; i < 10; i++) h.click(doc, 'addNeutron');
}
function buildLevels(doc){
  const r = ringHits(doc);
  for(let i = 0; i < 2; i++) h.clickNode(r[0]);
  h.click(doc, 'addEOuter');                       /* الطريق الثاني يُمشى مرّة */
  for(let i = 0; i < 6; i++) h.clickNode(ringHits(doc)[1]);
}
function chipInto(doc, w, value, slotId){
  const chip = Array.from(doc.querySelectorAll('#s3pool .chip'))
    .find(c => c.dataset.value === value && !c.classList.contains('placed'));
  if(!chip) throw new Error('رقاقة غير موجودة أو موضوعة مسبقًا: ' + value);
  h.selectChip(chip);
  doc.getElementById(slotId).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}

/* ══════════════ 1) الهيكل والهوية ══════════════ */
describe('الهيكل والهوية', () => {
  it('الصفحة تُحمّل بلا خطأ ولا تحذير من المحرّكات', async () => {
    const { logs } = await page();
    const noisy = logs.filter(l => /jsdomError|error:|مختبر فؤاد/.test(l));
    eq(noisy.length, 0, 'رسائل: ' + noisy.join(' | '));
  });

  it('سبع محطات وسبع نقاط تقدّم، والعدّاد مشتقّ منها', async () => {
    const { doc } = await page();
    eq(doc.querySelectorAll('.station').length, 7);
    eq(doc.querySelectorAll('.progress-dot').length, 7);
    has(doc.querySelector('.progress-track').textContent, 'من', 'عدّاد المحطات لم يُحقن');
    has(doc.querySelector('.progress-track').textContent, '7', 'مقام العدّاد ليس 7');
  });

  it('وسوم المشترك الستّة بترتيبها الإلزامي وقبل سكربت الدرس', async () => {
    const order = ['sounds/sounds.js', 'xp-system/xp.js', 'faheem-widget/faheem.js',
                   'template-boilerplate/template.js', 'certificate-system/certificate.js',
                   'identity/footer.js'];
    let at = -1;
    order.forEach(src => {
      const i = RAW.indexOf(src);
      ok(i > -1, 'وسم مفقود: ' + src);
      ok(i > at, 'ترتيب الوسوم مكسور عند: ' + src);
      at = i;
    });
    ok(RAW.indexOf('var T = {') > at, 'سكربت الدرس يسبق وسوم المشترك');
  });

  it('ملفّا التصميم مربوطان بمسار مستويين', async () => {
    has(RAW, '../../shared/identity/identity.css');
    has(RAW, '../../shared/template-boilerplate/template.css');
  });

  it('محطة التقييم بالاسم الموحَّد ومعها خانة زرّ الشهادة', async () => {
    const { doc } = await page();
    const last = doc.getElementById('station-7');
    has(last.querySelector('h2').textContent, 'التقييم الختامي');
    ok(doc.getElementById('certTriggerSlot'), 'خانة زرّ الشهادة غائبة');
    ok(/certificate-system\/certificate\.js/.test(RAW), 'وحدة الشهادة غير مربوطة');
    no(/Certificate\.finish/.test(BODY), 'نداء الشهادة يدويّ — والصحيح أن يتولّاه Quiz.evaluate');
  });

  it('كلّ انتقال يحمل حارس تقليل الحركة', async () => {
    const scrolls = RAW.match(/scrollIntoView\(\{[^}]*\}\)/g) || [];
    ok(scrolls.length >= 2, 'كتلتا التنقّل غير مكتملتين');
    scrolls.forEach(s => ok(/G\.reduced\(\)/.test(s), 'انتقال بلا حارس تقليل الحركة: ' + s));
    has(RAW, 'prefers-reduced-motion');
  });

  /* الطبقة الثانية: ما لا يمرّ عبر JS. تمريرٌ يبدأه المتصفّح (مرساة في
     الرابط، تركيز بلوحة المفاتيح) لا يستدعي scrollIntoView فلا يبلغه
     G.reduced() — يحكمه scroll-behavior وحده. والحارس أعلاه يفحص JS
     ويمرّ أخضر على هذا النقص، فلزم فحصٌ مستقلّ. */
  it('scroll-behavior:smooth مقابَل بقاعدة تُعيده إلى auto', async () => {
    const css = RAW.replace(/\/\*[\s\S]*?\*\//g, ' ');
    if(!/scroll-behavior\s*:\s*smooth/.test(css)) return;   // لا انزلاق فلا شيء يُبطَل
    const blocks = css.match(/@media[^{]*prefers-reduced-motion[^{]*\{[\s\S]*?\}\s*\}/g) || [];
    ok(blocks.some(b => /scroll-behavior\s*:\s*auto/.test(b)),
      'الدرس يفرض انزلاق التمرير ولا يُبطله عند تفضيل تقليل الحركة');
  });

  it('كتلة التنقّل مطابقة لنظيرتها في القالب', async () => {
    const tpl = fs.readFileSync(
      path.join(ROOT, 'shared', 'template-boilerplate', 'lesson-template.html'), 'utf8');
    function navOf(src){
      const bare = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
      const i = bare.indexOf('a.station-next[href^="#station-"]');
      const j = bare.indexOf('})();', i);
      return (i === -1 || j === -1) ? null : bare.slice(i, j).replace(/\s+/g, ' ').trim();
    }
    eq(navOf(RAW), navOf(tpl), 'كتلة التنقّل فارقت القالب');
  });

  it('كلّ تنقّل داخل المستودع: لا إطار خارجي ولا رابط إلى موقع آخر', async () => {
    no(/<iframe/i.test(BODY), 'إطار خارجي في الدرس');
    no(/sites\.google\.com/.test(BODY), 'رابط جوجل سايت');
    no(/lumi\.education|genially|view\.genial/i.test(BODY), 'بقيّة من الأنشطة المستضافة خارجيًّا');
    no(/Term-1-U-1-Exam|atom-L1/.test(BODY), 'رابط إلى مستودع آخر');
    const links = (BODY.match(/href="https?:\/\/[^"]+"/g) || [])
      .filter(l => !/fonts\.(googleapis|gstatic)\.com/.test(l));
    eq(links.length, 0, 'روابط خارجية: ' + links.join(' · '));
  });

  it('مصطلحات المنصّة ونطاق الدرس محفوظة في النصّ', async () => {
    no(/كاتيون|أنيون/.test(BODY), 'مصطلح ممنوع على المنصّة');
    no(/نظائر|النظير/.test(BODY), '«النظائر» خارج كتاب الطالب — والفرق يُوصف بعدد النيوترونات');
    no(/99\.9|ملعب كرة/.test(BODY), 'بند الفراغ المُسقَط عاد إلى النصّ');
    no(/الدرس 1-1|1-1:/.test(BODY), 'ترقيم أشكال الكتاب أو دروسه ظاهر للطالب');
    const eastern = BODY.match(/[\u0660-\u0669]/g) || [];
    eq(eastern.length, 0, 'أرقام شرقية في النصّ: ' + eastern.join(''));
  });

  it('كلّ سؤال إجابة قصيرة له مخرج نجاة', async () => {
    const { doc } = await page();
    ['patternModelBtn', 'hydrogenModelBtn', 'atomIonModelBtn'].forEach(id => {
      ok(doc.getElementById(id), 'مخرج نجاة مفقود: ' + id);
    });
  });
});

/* ══════════════ 2) المحطة 1 — التنبّؤ ══════════════ */
describe('المحطة 1 — تنبّؤ لا يُصحَّح', () => {
  const s = fresh();

  it('المشهد مرسوم: سبائك وحبيبات داخل العدسة', async () => {
    const { doc } = await s.boot();
    eq(doc.querySelectorAll('#goldStage rect.bar').length, 3);
    ok(doc.querySelectorAll('#goldStage circle.grain').length > 40, 'حبيبات الذهب قليلة');
  });

  it('التنبّؤ يمنح نقاطه ولا يُوسَم صوابًا ولا خطأً', async () => {
    const { doc, w } = await s.boot();
    h.choose(doc, 'l1predict', 'parts');
    eq(w.XP.total(), 3, 'نقاط التنبّؤ');
    const marked = doc.querySelectorAll('#s1predictOptions .quiz-option.correct, #s1predictOptions .quiz-option.incorrect');
    eq(marked.length, 0, 'التنبّؤ صُحِّح عند لحظته — والقياس قادم في المحطة 3');
    has(h.text(doc, 'fb-s1predict'), 'سجّلنا توقّعك');
  });

  it('التنبّؤ يُقفل بعد أوّل اختيار ويكشف الانتقال', async () => {
    const { doc } = await s.boot();
    ok(h.visible(doc, 's1done'), 'زرّ الانتقال لم يظهر');
    const again = h.choose(doc, 'l1predict', 'solid');
    ok(again.blocked, 'التنبّؤ يقبل تبديلًا بعد التسجيل');
  });
});

/* ══════════════ 3) المحطة 2 — راسم الذرّة ══════════════ */
describe('المحطة 2 — بناء ذرّة الفلور', () => {
  const s = fresh();

  it('المسرح يبدأ فارغًا: لا جسيم ولا إلكترون ولا تسمية', async () => {
    const { doc } = await s.boot();
    eq(doc.querySelectorAll('#atomStage circle.p').length, 0);
    eq(doc.querySelectorAll('#atomStage circle.n').length, 0);
    eq(doc.querySelectorAll('#atomStage circle.e').length, 0);
    eq(doc.querySelectorAll('#atomStage text.tag').length, 0, 'التسمية تسبق البناء');
  });

  it('النواة لا تُمنح نقاطها إلا باكتمالها، والحدّ يفرضه الزرّ', async () => {
    const { doc, w } = await s.boot();
    for(let i = 0; i < 9; i++) h.click(doc, 'addProton');
    eq(w.XP.total(), 0, 'نقاط مُنحت قبل اكتمال النواة');
    ok(doc.getElementById('addProton').disabled, 'زرّ البروتون لم يتعطّل عند 9');
    for(let i = 0; i < 10; i++) h.click(doc, 'addNeutron');
    eq(doc.querySelectorAll('#atomStage circle.p').length, 9);
    eq(doc.querySelectorAll('#atomStage circle.n').length, 10);
    eq(w.XP.total(), 10, 'نقاط بناء النواة');
  });

  it('نقرة زائدة على زرّ معطَّل لا تضيف جسيمًا', async () => {
    const { doc } = await s.boot();
    h.click(doc, 'addProton');
    eq(doc.querySelectorAll('#atomStage circle.p').length, 9);
  });

  it('نموذج النيون يظهر مع مرحلة المستويات لا قبلها', async () => {
    const { doc } = await s.boot();
    ok(h.visible(doc, 's2levelsStep'), 'مرحلة المستويات لم تُكشَف');
    eq(doc.querySelectorAll('#neonFig circle.e').length, 10, 'إلكترونات النيون');
    eq(doc.querySelectorAll('#neonFig circle.ring').length, 2, 'مستويات النيون');
  });

  it('المستوى الداخلي يرفض إلكترونًا ثالثًا ويوجّه إلى النموذج', async () => {
    const { doc } = await s.boot();
    const r = ringHits(doc);
    h.clickNode(r[0]); h.clickNode(r[0]); h.clickNode(r[0]);
    eq(doc.querySelectorAll('#atomStage circle.e').length, 2, 'قُبل ثالثٌ في مستوى سعته اثنان');
    has(h.text(doc, 's2msg'), 'يسع إلكترونين');
  });

  it('زرّا المستويين يظهران مع مرحلة الإلكترونات لا قبلها', async () => {
    const { doc } = await s.boot();
    ok(h.visible(doc, 's2eBtns'), 'صفّ أزرار الإلكترون لم يُكشف بعد اكتمال النواة');
    no(h.visible(doc, 's2nucleusBtns'), 'زرّا النواة باقيان بعد اكتمالها');
    ok(doc.getElementById('addEInner').disabled, 'زرّ المستوى الداخلي لم يتعطّل وهو ممتلئ');
    no(doc.getElementById('addEOuter').disabled, 'زرّ المستوى الخارجي معطّل وفيه متّسع');
  });

  it('الزرّ يضع الإلكترون في مستواه كما يفعل النقر', async () => {
    const { doc } = await s.boot();
    h.click(doc, 'addEOuter');
    eq(doc.querySelectorAll('#atomStage circle.e').length, 3, 'الزرّ لم يضع إلكترونًا');
    eq(doc.querySelectorAll('#atomStage circle.e[data-level="1"]').length, 1, 'وُضع في المستوى الخطأ');
  });

  it('التعليمة تظهر لحظة اكتمال النواة لا بعد أوّل إلكترون', async () => {
    const { doc } = await h.loadLesson(FILE, {});
    buildNucleus(doc);
    has(h.text(doc, 's2msg'), 'الزرّين', 'الطالب لا يعرف ما المطلوب منه عند اكتمال النواة');
  });

  it('أرقام النيون معروضة بإزاء أرقام الفلور فتصحّ المقارنة', async () => {
    const { doc } = await s.boot();
    const t = doc.getElementById('s2levelsStep').textContent.replace(/\s+/g, ' ');
    has(t, 'ذرّة النيون: 10 بروتونات · 10 نيوترونات · 10 إلكترونات');
  });

  it('اكتمال التسعة يمنح النقاط ويكشف التسمية والأسئلة', async () => {
    const { doc, w } = await s.boot();
    const r = ringHits(doc);
    for(let i = 0; i < 6; i++) h.clickNode(r[1]);
    eq(doc.querySelectorAll('#atomStage circle.e').length, 9);
    eq(w.XP.total(), 18, 'نقاط التوزيع الإلكتروني');
    no(h.visible(doc, 's2eBtns'), 'الزرّان باقيان بعد اكتمال البناء');
    ok(doc.querySelectorAll('#atomStage text.tag').length >= 2, 'التسمية لم تلحق البناء');
    ok(h.visible(doc, 's2questions'), 'أسئلة المحطة لم تُكشَف');
  });

  it('المسرح يُقفل بعد الاكتمال فلا يُضاف إلكترون عاشر', async () => {
    const { doc } = await s.boot();
    eq(ringHits(doc).length, 0, 'مناطق النقر باقية بعد اكتمال البناء');
  });

  it('أسئلة ما بعد البناء تمنح نقاطها وتكشف الانتقال', async () => {
    const { doc, w } = await s.boot();
    ['l1-where-e', 'l1-where-pn', 'l1-neutron-clue', 'l1-why-model']
      .forEach(n => h.choose(doc, n, 'correct'));
    eq(w.XP.total(), 38, 'رصيد المحطة 2');
    ok(h.visible(doc, 's2done'));
  });
});

/* ══════════════ 4) المحطة 3 — الشحنة والكتلة ══════════════ */
describe('المحطة 3 — الرقاقات وإغلاق حلقة التنبّؤ', () => {
  const s = fresh();

  it('نشاط الرقاقات لا يظهر قبل تسجيل التنبّؤ', async () => {
    const { doc } = await s.boot();
    no(h.visible(doc, 's3chipsStep'), 'الجدول ظهر قبل التنبّؤ فسقط معنى التنبّؤ');
    h.choose(doc, 'l1massPredict', 'e');
    ok(h.visible(doc, 's3chipsStep'));
  });

  it('لكلّ نشاط رقاقات عنصر تغذية راجعة يكتب فيه المحرّك', async () => {
    const { doc } = await s.boot();
    ok(doc.querySelector('[data-chips="l1-particles"] .chips-feedback'),
       'بغيابه لا يظهر أي تلميح ولا يُطبع تحذير');
  });

  it('رقاقة كتلة في خانة شحنة تُردّ بتلميح يخاطب الخطأ', async () => {
    const { doc, w } = await s.boot();
    chipInto(doc, w, '1', 's3-p-charge');
    const fb = doc.querySelector('[data-chips="l1-particles"] .chips-feedback');
    has(fb.textContent, 'شحنة');
    eq(w.XP.total(), 3, 'مُنحت نقاط على وضع خاطئ فوق نقاط التنبّؤ');
  });

  it('الجدول يكتمل بالوضع الصحيح ويمنح نقطةً لكلّ رقاقة', async () => {
    const { doc, w } = await s.boot();
    chipInto(doc, w, '+1', 's3-p-charge');
    chipInto(doc, w, '0',  's3-n-charge');
    chipInto(doc, w, '-1', 's3-e-charge');
    chipInto(doc, w, '1',  's3-p-mass');
    chipInto(doc, w, '1',  's3-n-mass');
    chipInto(doc, w, '1/1836', 's3-e-mass');
    eq(w.XP.total(), 33, 'التنبّؤ 3 + ستّ رقاقات × 5');
    ok(h.visible(doc, 's3after'), 'ما بعد الجدول لم يُكشَف');
  });

  it('بطاقة النيوكليونات بالجمع ولا تجعل الجسيم الواحد نوعين', async () => {
    const { doc } = await s.boot();
    const line = doc.getElementById('s3after').textContent.replace(/\s+/g, ' ');
    has(line, 'النيوكليونات');
    has(line, 'البروتونات والنيوترونات');
    no(/بروتون أو نيوترون/.test(line), 'صياغة «أو» تصف مفردًا في موضع الجمع');
  });

  it('تفسير الكتلة يشير إلى سطر البطاقة لا إلى عمود لا وجود له', async () => {
    has(BODY, 'سطر الكتلة');
    no(/عمود الكتلة/.test(BODY), 'البطاقات بطاقات لا جدول ذو أعمدة');
  });

  it('سؤال إغلاق الحلقة يشير إلى تنبّؤ المحطة 1 ويمنح نقاطه', async () => {
    const { doc, w } = await s.boot();
    const q = doc.querySelector('.quiz-options[data-q="l1-close-loop"]')
                 .closest('.explore-step').querySelector('.explore-q').textContent;
    has(q, 'المحطة الأولى');
    h.choose(doc, 'l1-neutral', 'correct');
    h.choose(doc, 'l1-close-loop', 'correct');
    eq(w.XP.total(), 43, 'رصيد المحطة 3 بعد التنبّؤ والرقاقات والسؤالين');
    ok(h.visible(doc, 's3done'));
  });
});

/* ══════════════ 5) المحطة 4 — Z و A ══════════════ */
describe('المحطة 4 — البطاقات ومخرج النجاة', () => {
  const s = fresh();

  it('بطاقات الحساب لا تظهر قبل قراءة الرمز', async () => {
    const { doc } = await s.boot();
    no(h.visible(doc, 's4after'), 'البطاقات سبقت فهم الاصطلاح');
    h.choose(doc, 'l1-symbol-read', 'correct');
    ok(h.visible(doc, 's4after'));
    no(h.visible(doc, 'cardK'), 'البطاقات الثلاث ظاهرة معًا — وسقف الكثافة أربعة عناصر');
  });

  it('اصطلاح الرمز مرسوم برمز عامّ لا برمز عنصر بعينه', async () => {
    const { doc } = await s.boot();
    const fig = doc.querySelector('#s4after svg.sym-fig');
    ok(fig, 'رسم اصطلاح الرمز غائب');
    const t = fig.textContent.replace(/\s+/g, ' ');
    has(t, 'X');
    has(t, 'العدد الكتلي');
    has(t, 'العدد الذرّي');
    no(/Na/.test(t), 'الرسم يستعمل رمز الصوديوم فيبدو اصطلاحًا خاصًّا بذرّة واحدة');
    ok(doc.querySelectorAll('#s4after .fact-card').length >= 2, 'البطاقتان أُسقطتا مع الرسم');
  });

  it('إجابة خاطئة تُعطي تلميحًا يخاطب الخانة الخاطئة لا السؤال', async () => {
    const { doc } = await s.boot();
    fillCard(doc, 'cardC', 6, 6, 12);
    has(h.text(doc, 'fb-cardC'), 'أعلى يسار');
    no(h.visible(doc, 'cardC-esc'), 'مخرج النجاة ظهر من المحاولة الأولى');
  });

  it('مخرج النجاة يظهر بعد محاولتين ويمنح نصف النقاط', async () => {
    const { doc, w } = await s.boot();
    fillCard(doc, 'cardC', 6, 6, 12);
    ok(h.visible(doc, 'cardC-esc'), 'لا مخرج بعد محاولتين فاشلتين');
    h.click(doc, 'cardC-esc');
    eq(w.XP.total(), 10, '5 للسؤال المفتوح بنصفه + 5 لقراءة الرمز');
    eq(doc.getElementById('cardC-n').value, '6', 'المخرج لم يُظهر الأعداد');
    ok(doc.getElementById('cardC-btn').disabled, 'البطاقة لم تُقفل بعد المخرج');
    ok(h.visible(doc, 'cardK'), 'البطاقة التالية لم تُكشَف');
  });

  it('البطاقتان الباقيتان تتتابعان، والهيدروجين بصفر نيوترونات', async () => {
    const { doc, w } = await s.boot();
    fillCard(doc, 'cardK', 19, 19, 20);
    ok(h.visible(doc, 'cardH'));
    fillCard(doc, 'cardH', 1, 1, 0);
    has(h.text(doc, 'fb-cardH'), '✓');
    eq(w.XP.total(), 30);
    ok(h.visible(doc, 's4patternStep'), 'سؤال النمط لم يُكشَف بعد البطاقات');
  });

  it('سؤال النمط يقبل الصياغة بالكلمات ويمنح نقاط اكتشاف النمط', async () => {
    const { doc, w } = await s.boot();
    h.type(doc, 'patternInput', 'نطرح العدد الذري من العدد الكتلي');
    h.click(doc, 'patternBtn');
    has(h.text(doc, 'fb-pattern'), '✓');
    eq(w.XP.total(), 42);
    ok(h.visible(doc, 's4hydrogenStep'));
  });

  it('سؤال الهيدروجين يقبل التفسير بالنيوترونات ويكشف الانتقال', async () => {
    const { doc, w } = await s.boot();
    h.type(doc, 'hydrogenInput', 'لأن نواته ليس فيها نيوترونات');
    h.click(doc, 'hydrogenBtn');
    has(h.text(doc, 'fb-hydrogen'), '✓');
    eq(w.XP.total(), 50, 'رصيد المحطة 4 مع نصف نقاط بطاقة الكربون');
    ok(h.visible(doc, 's4done'));
  });
});

/* ══════════════ 6) المحطة 5 — الأيون ══════════════ */
describe('المحطة 5 — ذرّة تفقد وذرّة تكسب', () => {
  const s = fresh();

  it('المسرح لا يظهر قبل التنبّؤ، والشحنة لا تظهر قبل الفعل', async () => {
    const { doc } = await s.boot();
    no(h.visible(doc, 's5stageStep'));
    h.choose(doc, 'l1ionPredict', 'p');
    ok(h.visible(doc, 's5stageStep'));
    no(/الشحنة/.test(h.text(doc, 's5count')), 'الشحنة ظهرت قبل أن يفعل الطالب شيئًا');
    eq(doc.querySelectorAll('#ionStage circle.e').length, 11, 'إلكترونات الصوديوم');
    eq(doc.querySelectorAll('#ionStage circle.p').length, 11);
  });

  it('نزع الإلكترون يترك البروتونات كما هي ويُظهر شحنة موجبة', async () => {
    const { doc } = await s.boot();
    h.click(doc, 'ionRemove');
    eq(doc.querySelectorAll('#ionStage circle.e').length, 10);
    eq(doc.querySelectorAll('#ionStage circle.p').length, 11, 'تغيّر عدد البروتونات — وهو الخطأ الذي يقيسه السؤال');
    eq(doc.querySelectorAll('#ionStage circle.n').length, 12);
    has(h.text(doc, 's5count'), '1+');
    const badge = doc.querySelector('#ionStage text.charge-badge');
    ok(badge, 'شحنة الأيون غير معروضة على المسرح');
    eq(badge.textContent, '1+', 'الإشارة يسار الرقم — والكتاب يكتبها يمينه');
    ok(badge.getAttribute('class').indexOf('pos') > -1, 'الشارة بلا دلالة الإشارة');
    eq(doc.querySelectorAll('#ionStage circle.charge-ring').length, 0,
       'دائرة حول الشارة تجعلها تُقرأ جسيمًا في مدار');
    const cxBadge = Number(badge.getAttribute('x'));
    const cyBadge = Number(badge.getAttribute('y'));
    const rings = Array.from(doc.querySelectorAll('#ionStage circle.ring'));
    const rMax = Math.max(...rings.map(c => Number(c.getAttribute('r'))));
    const cx0 = Number(rings[0].getAttribute('cx')), cy0 = Number(rings[0].getAttribute('cy'));
    ok(Math.hypot(cxBadge - cx0, cyBadge - cy0) > rMax + 20,
       'الشارة داخل مدارات الذرّة فتُقرأ جسيمًا ثالثًا');
  });

  it('الذرّة المتعادلة بلا شارة، والشارة تزول بإعادة الذرّة', async () => {
    const { doc } = await h.loadLesson(FILE, {});
    h.choose(doc, 'l1ionPredict', 'p');
    eq(doc.querySelectorAll('#ionStage text.charge-badge').length, 0, 'شارة على ذرّة متعادلة');
    h.click(doc, 'ionRemove');
    eq(doc.querySelectorAll('#ionStage text.charge-badge').length, 1);
    h.click(doc, 'ionReset');
    eq(doc.querySelectorAll('#ionStage text.charge-badge').length, 0, 'الشارة بقيت بعد إعادة الذرّة');
  });

  it('الانتقال إلى الفلور ثمّ كسب إلكترون يُظهر شحنة سالبة ويمنح النقاط', async () => {
    const { doc, w } = await s.boot();
    h.click(doc, 'ionSwitch');
    eq(doc.querySelectorAll('#ionStage circle.p').length, 9, 'لم تتبدّل الذرّة');
    no(/الشحنة/.test(h.text(doc, 's5count')), 'شحنة معروضة على ذرّة متعادلة');
    h.click(doc, 'ionAdd');
    eq(doc.querySelectorAll('#ionStage circle.e').length, 10);
    has(h.text(doc, 's5count'), '1−');
    eq(doc.querySelector('#ionStage text.charge-badge').textContent, '1−');
    eq(w.XP.total(), 13, 'التنبّؤ + بناء الأيونين');
    ok(h.visible(doc, 's5after'), 'ما بعد المسرح لم يُكشَف');
  });

  it('بطاقات الأيونات تتتابع وتحسب الإلكترونات من الشحنة', async () => {
    const { doc, w } = await s.boot();
    h.choose(doc, 'l1-charge-rule', 'correct');
    h.choose(doc, 'l1-ion-what-changes', 'correct');
    no(h.visible(doc, 's5cards'), 'البطاقات سبقت إغلاق حلقة الهوية');
    h.choose(doc, 'l1-identity', 'correct');
    ok(h.visible(doc, 's5cards'));
    fillCard(doc, 'cardMg', 12, 12, 12);
    has(h.text(doc, 'fb-cardMg'), 'الشحنة الموجبة تعني فقد');
    fillCard(doc, 'cardMg', 12, 10, 12);
    ok(h.visible(doc, 'cardCl'));
    fillCard(doc, 'cardCl', 17, 18, 18);
    fillCard(doc, 'cardO',  8, 10, 8);
    eq(w.XP.total(), 58);
    ok(h.visible(doc, 's5closeStep'));
  });

  it('سؤال المقارنة يقبل ذكر ما ثبت وما تغيّر', async () => {
    const { doc, w } = await s.boot();
    h.type(doc, 'atomIonInput', 'البروتونات والنيوترونات نفسها ويختلف عدد الإلكترونات');
    h.click(doc, 'atomIonBtn');
    has(h.text(doc, 'fb-atomIon'), '✓');
    eq(w.XP.total(), 66, 'رصيد المحطة 5');
    ok(h.visible(doc, 's5done'));
  });
});

/* ══════════════ 7) المحطة 6 — الأوجانيسون ══════════════ */
describe('المحطة 6 — التوسّع والتحدّي الاختياري', () => {
  const s = fresh();

  it('التحدّي الاختياري لا يظهر قبل أوّل تفاعل في المحطة', async () => {
    const { doc } = await s.boot();
    no(h.visible(doc, 's6bonus'), 'التحدّي ظهر تصنيفًا مسبقًا لا خيارًا بعد تفاعل');
    no(h.visible(doc, 's6after'));
  });

  it('بطاقة الأوجانيسون تُحسب من رمزها وحده', async () => {
    const { doc, w } = await s.boot();
    fillCard(doc, 'cardOg', 118, 118, 176);
    has(h.text(doc, 'fb-cardOg'), '✓');
    eq(w.XP.total(), 10);
    ok(h.visible(doc, 's6after'));
  });

  it('سؤالا المحطة يكشفان التحدّي والانتقال معًا', async () => {
    const { doc, w } = await s.boot();
    h.choose(doc, 'l1-og-295', 'correct');
    h.choose(doc, 'l1-cl-difference', 'correct');
    eq(w.XP.total(), 20, 'رصيد المحطة 6 الأساسي');
    ok(h.visible(doc, 's6bonus'));
    ok(h.visible(doc, 's6done'));
  });

  it('التحدّي الاختياري يمنح نقاط التحدّي لا نقاط المهمّة', async () => {
    const { doc, w } = await s.boot();
    fillCard(doc, 'cardFe', 26, 23, 30);
    eq(w.XP.total(), 28, 'التحدّي 8 نقاط');
  });
});

/* ══════════════ 8) المحطة 7 — التقييم والشهادة ══════════════ */
describe('المحطة 7 — التقييم الختامي', () => {
  const s = fresh();

  it('الأسئلة محجوبة حتى يكتب الطالب اسمه', async () => {
    const { doc } = await s.boot();
    no(h.visible(doc, 'evalQuestions'));
    h.click(doc, 'evalStart');
    has(h.text(doc, 'evalNameFb'), 'اسمك');
    no(h.visible(doc, 'evalQuestions'), 'الأسئلة ظهرت بلا اسم');
    h.type(doc, 'evalName', 'طالب المختبر');
    h.click(doc, 'evalStart');
    ok(h.visible(doc, 'evalQuestions'));
  });

  it('عشرة أسئلة: ثمانية اختيار وسؤالان مكتوبان', async () => {
    const { doc } = await s.boot();
    eq(doc.querySelectorAll('#evalQuestions .quiz-options[data-q]').length, 8);
    eq(doc.querySelectorAll('#evalQuestions input[type="text"]').length, 2);
  });

  it('محاولة واحدة: الخطأ يُقفل السؤال ويُضيء الصحيح مع سببه', async () => {
    const { doc } = await s.boot();
    h.choose(doc, 'e1', 'w1');
    const group = h.groupByName(doc, 'e1');
    ok(group.querySelector('input[value="correct"]').closest('.quiz-option').classList.contains('correct'),
       'الإجابة الصحيحة لم تُضَأ');
    has(h.text(doc, 'fb-e1'), '✗');
    ok(h.choose(doc, 'e1', 'correct').blocked, 'السؤال يقبل محاولة ثانية');
  });

  it('السؤال المكتوب يقبل صياغة مكافئة ورقمًا بوحدته', async () => {
    const { doc } = await s.boot();
    ['e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'].forEach(n => h.choose(doc, n, 'correct'));
    h.type(doc, 'e9Input', 'لأن عدد البروتونات وعدد النيوترونات لم يتغير');
    h.click(doc, 'e9Btn');
    has(h.text(doc, 'fb-e9'), '✓');
    h.type(doc, 'e10Input', '20 نيوترونا');
    h.click(doc, 'e10Btn');
    has(h.text(doc, 'fb-e10'), '✓');
  });

  it('النتيجة تظهر بالنسبة والشارة، والشهادة تُنادى بعنوان الدرس', async () => {
    const { doc, w } = await s.boot();
    const sum = h.text(doc, 'evalSummary');
    has(sum, '90');
    has(sum, 'متميز');
    eq(w.__certCall && w.__certCall.title, undefined, 'اختبار الشهادة يقع في سيناريو مستقلّ');
    eq(w.XP.total(), 0, 'التقييم منح نقاطًا — ومكافأته الشارة والشهادة');
  });
});

describe('الشهادة تُنادى ببيانات الطالب', () => {
  it('اسم الطالب وعنوان الدرس والنسبة تصل إلى وحدة الشهادة', async () => {
    const s = await h.loadLesson(FILE, {});
    let call = null;
    s.w.Certificate = s.w.Certificate || {};
    s.w.Certificate.finish = (name, title, pct) => { call = { name, title, pct }; };
    h.type(s.doc, 'evalName', 'فؤاد حوراني');
    h.click(s.doc, 'evalStart');
    ['e1','e2','e3','e4','e5','e6','e7','e8'].forEach(n => h.choose(s.doc, n, 'correct'));
    h.type(s.doc, 'e9Input', 'البروتونات والنيوترونات نفسها لم تتغير');
    h.click(s.doc, 'e9Btn');
    h.type(s.doc, 'e10Input', '20');
    h.click(s.doc, 'e10Btn');
    ok(call, 'وحدة الشهادة لم تُنادَ');
    eq(call.title, 'ما تركيب الذرّة؟');
    eq(call.name, 'فؤاد حوراني');
    eq(call.pct, 100);
  });
});

/* ══════════════ 9) الرصيد الكامل ولا كسب مزدوج ══════════════ */
describe('الرصيد ومنع الكسب المزدوج', () => {
  async function walkAll(store){
    const s = await h.loadLesson(FILE, { storage: store });
    const { doc, w } = s;
    h.choose(doc, 'l1predict', 'parts');
    buildNucleus(doc);
    buildLevels(doc);
    ['l1-where-e', 'l1-where-pn', 'l1-neutron-clue', 'l1-why-model']
      .forEach(n => h.choose(doc, n, 'correct'));
    h.choose(doc, 'l1massPredict', 'pn');
    chipInto(doc, w, '+1', 's3-p-charge');
    chipInto(doc, w, '0',  's3-n-charge');
    chipInto(doc, w, '-1', 's3-e-charge');
    chipInto(doc, w, '1',  's3-p-mass');
    chipInto(doc, w, '1',  's3-n-mass');
    chipInto(doc, w, '1/1836', 's3-e-mass');
    h.choose(doc, 'l1-neutral', 'correct');
    h.choose(doc, 'l1-close-loop', 'correct');
    h.choose(doc, 'l1-symbol-read', 'correct');
    fillCard(doc, 'cardC', 6, 6, 6);
    fillCard(doc, 'cardK', 19, 19, 20);
    fillCard(doc, 'cardH', 1, 1, 0);
    h.type(doc, 'patternInput', 'العدد الكتلي ناقص العدد الذري');
    h.click(doc, 'patternBtn');
    h.type(doc, 'hydrogenInput', 'لا تحتوي نواته على نيوترونات');
    h.click(doc, 'hydrogenBtn');
    h.choose(doc, 'l1ionPredict', 'e');
    h.click(doc, 'ionRemove');
    h.click(doc, 'ionSwitch');
    h.click(doc, 'ionAdd');
    h.choose(doc, 'l1-charge-rule', 'correct');
    h.choose(doc, 'l1-ion-what-changes', 'correct');
    h.choose(doc, 'l1-identity', 'correct');
    fillCard(doc, 'cardMg', 12, 10, 12);
    fillCard(doc, 'cardCl', 17, 18, 18);
    fillCard(doc, 'cardO',  8, 10, 8);
    h.type(doc, 'atomIonInput', 'يتشابهان في البروتونات والنيوترونات ويختلفان في الإلكترونات');
    h.click(doc, 'atomIonBtn');
    fillCard(doc, 'cardOg', 118, 118, 176);
    h.choose(doc, 'l1-og-295', 'correct');
    h.choose(doc, 'l1-cl-difference', 'correct');
    return s;
  }

  it('الرصيد الأساسي 225 نقطة، والتحدّي الاختياري ثمانٍ فوقها', async () => {
    const store = {};
    const s = await walkAll(store);
    eq(s.w.XP.total(), 225, 'الرصيد الأساسي');
    fillCard(s.doc, 'cardFe', 26, 23, 30);
    eq(s.w.XP.total(), 233, 'الرصيد مع التحدّي');
  });

  it('إعادة تحميل الصفحة لا تُعيد منح ما كُسب', async () => {
    const store = {};
    await walkAll(store);
    const again = await h.loadLesson(FILE, { storage: store });
    eq(again.w.XP.total(), 225, 'الرصيد بعد إعادة التحميل');
    h.choose(again.doc, 'l1predict', 'parts');
    buildNucleus(again.doc);
    eq(again.w.XP.total(), 225, 'كسبٌ مزدوج بعد إعادة التحميل');
  });
});

/* ــــ قواعد أسئلة الاختيار — حرّاس مشتركة (tests/guards.js) ــــ */
async function guardDoc(){ return (await page()).doc; }
const api = { describe, it, eq, ok, no, has };
guards.describeMcqRules(api, guardDoc, {
  evalSpread:   { expect: 8, minDistinct: 4, maxAtOne: 2 },
  lessonSpread: { minDistinct: 4 }
});

run();
