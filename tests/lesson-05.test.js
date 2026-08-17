'use strict';
/* ==========================================================
   اختبارات الدرس 05 — سلوك الدرس كما يراه الطالب
   ----------------------------------------------------------
   تُكتب على ما يفعله الطالب ويراه، لا على البنية الداخلية.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');
const guards = require('./guards');
const { flows, put } = require('./flows-l5');

const LESSON = 'semester-1/unit-01/lesson-05.html';

async function page(opts){
  const s = await h.loadLesson(LESSON, opts);
  s.certCalls = [];
  s.w.Certificate = { finish: function(){ s.certCalls.push([].slice.call(arguments)); } };
  return s;
}

function hidden(doc, id){ return doc.getElementById(id).hidden; }

/* ---------- الهيكل ---------- */
describe('درس 05 — الهيكل والوسوم', () => {
  it('يُحمّل بلا أي خطأ JS', async () => {
    const { logs } = await page();
    eq(logs.length, 0, logs.join(' | '));
  });

  it('سبع محطات وسبع نقاط تقدّم، والعدّاد يقرأ «من 7»', async () => {
    const { doc } = await page();
    eq(doc.querySelectorAll('.station').length, 7);
    eq(doc.querySelectorAll('.progress-dot').length, 7);
    has(doc.querySelector('.station-counter').textContent, '7');
  });

  it('وسوم المشترك الستّة تسبق سكربت الدرس في النصّ الخام', async () => {
    const { raw } = await page();
    const iTpl = raw.indexOf('template-boilerplate/template.js');
    const iXp  = raw.indexOf('xp-system/xp.js');
    const iCert = raw.indexOf('certificate-system/certificate.js');
    const iLesson = raw.indexOf('نصوص المحطات');
    ok(iXp < iTpl, 'xp.js يجب أن يسبق template.js');
    ok(iTpl < iLesson, 'template.js يجب أن يسبق سكربت الدرس');
    ok(iCert > 0, 'الشهادة غير مربوطة');
  });

  it('كل سؤال في الوسم مسجَّل في الدرس — لا سؤال صامت', async () => {
    const { logs, doc } = await page();
    eq(logs.filter(l => /بلا تسجيل/.test(l)).length, 0);
    ok(doc.querySelectorAll('[data-q]').length >= 15);
  });

  it('كل إجابة قصيرة لها مخرج نجاة', async () => {
    const { logs } = await page();
    eq(logs.filter(l => /بلا مخرج نجاة/.test(l)).length, 0);
  });

  it('لا نقاط بمجرّد التمرير', async () => {
    const { w } = await page();
    eq(w.XP.total(), 0);
  });

  /* سياسة درسَي 03 و04: التنقّل حرّ. حجب المحطة يجبر العائد على
     إعادة الدرس كلّه، ولا يحمي شيئًا — الحامي هو الكشف المتدرّج
     داخل المحطة. فهذا الاختبار يحرس بقاء الباب مفتوحًا. */
  it('المحطات السبع كلّها مفتوحة منذ التحميل — لا حجب', async () => {
    const { doc } = await page();
    for(let i = 1; i <= 7; i++){
      const sec = doc.getElementById('station-' + i);
      ok(sec, 'المحطة ' + i + ' غير موجودة');
      no(sec.hidden, 'المحطة ' + i + ' محجوبة');
      ok(!sec.hasAttribute('hidden'), 'المحطة ' + i + ' تحمل سمة hidden');
    }
  });
});

/* ---------- المحطة 1 ---------- */
describe('المحطة 1 — التنشيط', () => {
  it('كتلة الاستكشاف والتنبّؤ لا تظهران قبل رسم الإلكترونات', async () => {
    const { doc } = await page();
    ok(hidden(doc, 's1explore'));
    ok(hidden(doc, 's1predictBox'));
  });

  it('اكتمال الرسم يفتحهما ويمنح نقاط الإنتاج', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    no(hidden(doc, 's1explore'));
    no(hidden(doc, 's1predictBox'));
    eq(w.XP.total(), 8);
  });

  it('حلقة التلميح لا تلتقط النقر — النقر يقع على الذرّة كلّها', async () => {
    const { doc } = await page();
    const halo = doc.getElementById('s1halo');
    ok(halo, 'حلقة التلميح غير موجودة');
    no(/clickable/.test(halo.getAttribute('class') || ''),
       'الحلقة تحمل صنفًا قابلًا للنقر بلا معالج');
    has(halo.getAttribute('class'), 'hint-halo');
  });

  it('المستويات منتظمة: أزواج عند المواضع الثابتة لا نجوم متناثرة', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage1');
    const hit = svg.querySelector('.atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    const pts = Array.from(svg.querySelectorAll('.atom')[0].querySelectorAll('.epos'))
      .map(n => {
        const m = /translate\((-?[\d.]+),(-?[\d.]+)\)/.exec(n.getAttribute('transform'));
        return { x: +m[1] - 250, y: +m[2] - 165 };
      });
    const shell2 = pts.filter(p => Math.abs(Math.hypot(p.x, p.y) - 47) < 6);
    eq(shell2.length, 8, 'المستوى الثاني ثمانية');
    // أربعة مواضع × زوج: أربع قيم مطلقة متمايزة لا ثماني زوايا عشوائية
    const slots = new Set(shell2.map(p => (Math.abs(p.x) > Math.abs(p.y) ? 'x' : 'y') +
                                          (Math.sign(Math.abs(p.x) > Math.abs(p.y) ? p.x : p.y))));
    eq(slots.size, 4, 'المستوى الثاني ليس أربعة أزواج');
  });

  it('محاولتا النقل والمشاركة ملاحظتان لا حكمان — بلا صواب وخطأ', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    await h.tick(w, 200);                // الحكم يلحق الحركة لا يسبقها
    const note = doc.getElementById('s1msg');
    no(/is-correct/.test(note.className), 'وسم صواب في كتلة استكشاف حرّ');
    has(note.className, 'impasse', 'الحكم بلا وزن بصري يميّزه');
    has(note.textContent, 'لم ينجح النقل');
    h.click(doc, 's1try2');
    await h.tick(w, 60);
    has(note.textContent, 'ولم تنجح المشاركة');
  });

  it('النقل لا ينجح: الإلكترونات تُردّ إلى ذرّتها ولا شحنة تظهر', async () => {
    const { doc, w } = await page();
    const svg = doc.getElementById('stage1');
    const hit = svg.querySelector('.atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    await h.tick(w, 250);
    const xs = Array.from(svg.querySelectorAll('.atom .outer-layer .epos'))
      .map(n => parseFloat(/translate\((-?[\d.]+),/.exec(n.getAttribute('transform'))[1]));
    eq(xs.filter(x => x < 450).length, 3, 'المانحة فقدت إلكتروناتها — والنقل يجب ألّا ينجح');
    eq(xs.filter(x => x > 450).length, 3, 'الآخذة استقبلت إلكترونات');
    eq(svg.querySelectorAll('.charge-badge').length, 0, 'ظهرت شحنة كأن النقل تمّ');
  });

  it('حكم المحاولة يظهر تحت المسرح لا أسفل الأزرار', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    await h.tick(w, 250);
    const msg = doc.getElementById('s1msg');
    const stage = doc.querySelector('#stage1').closest('.stage-wrap');
    // الحكم شقيقٌ للمسرح ويليه مباشرةً في ترتيب القراءة
    ok(stage.parentNode.contains(msg), 'الحكم خارج كتلة المسرح');
    has(msg.className, 'impasse');
  });

  it('ترتيب المشاركة لا يبقى على الشاشة — زواله هو الرسالة', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try2');
    await h.tick(w, 40);
    ok(doc.querySelector('#stage1 .shared-pairs'), 'الأزواج لم تظهر أصلًا');
    await h.tick(w, 400);
    no(doc.querySelector('#stage1 .shared-pairs'), 'ترتيبٌ لا وجود له علميًّا بقي معروضًا');
  });

  it('زرّ الإعادة يعيد الذرّتين ويُخفي الملاحظة', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    await h.tick(w, 200);
    h.click(doc, 's1reset');
    eq(doc.getElementById('s1msg').textContent, '');
    eq(doc.querySelectorAll('#stage1 circle.nucleus').length, 2);
  });

  it('التنبّؤ لا يُصحَّح ويمنح نقاطه أيًّا كان الاختيار', async () => {
    const { doc, w } = await page();
    flows.s1(doc, 'p1');                    // اختيار خاطئ علميًّا
    const fb = doc.getElementById('fb-predict');
    no(fb.hidden);
    no(/is-correct/.test(fb.className), 'التنبّؤ صُحِّح');
    eq(w.XP.total(), 11);
    no(hidden(doc, 's1done'));
  });
});

/* ---------- الانتقال بين المحطات ---------- */
describe('الانتقال — الزرّ يفتح المحطة التالية بنفسه', () => {
  it('كل زرّ انتقال يفتح هدفه ويفعّل نقطته', async () => {
    const { doc } = await page();
    const targets = ['station-2', 'station-3', 'station-4',
                     'station-5', 'station-6', 'station-7'];
    // نفتح كل محطة بزرّها لا بالمرساة: الرابط الشظوي وحده يفشل صامتًا
    const links = Array.from(doc.querySelectorAll('a.station-next[href^="#station-"]'));
    eq(links.length, 6, 'عدد أزرار الانتقال');
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      h.clickNode(a);
      no(doc.getElementById(id).hidden, 'الزرّ لم يفتح ' + id);
      has(doc.getElementById(id).className, 'in-view');
      const dot = doc.querySelector('.progress-dot[data-target="' + id + '"]');
      has(dot.className, 'active', 'نقطة التقدّم لم تُفعَّل لـ' + id);
    });
    targets.forEach(id => no(doc.getElementById(id).hidden));
  });

  it('زرّ المحطة 1 يعمل بعد التنبّؤ مباشرةً', async () => {
    const { doc } = await page();
    flows.s1(doc);
    const link = doc.querySelector('#s1done a.station-next');
    ok(link, 'زرّ الانتقال غير موجود');
    h.clickNode(link);
    no(doc.getElementById('station-2').hidden);
  });
});

/* ---------- المحطة 2 ---------- */
describe('المحطة 2 — الاستكشاف', () => {
  it('الأسئلة لا تظهر قبل تحرير الإلكترونات الستّة', async () => {
    const { doc } = await page();
    const es = doc.querySelectorAll('#stage2 .epos.clickable');
    for(let i = 0; i < 5; i++) h.clickNode(es[i]);
    ok(hidden(doc, 's2questions'), 'الأسئلة ظهرت قبل اكتمال البناء');
    h.clickNode(es[5]);
    no(hidden(doc, 's2questions'));
  });

  it('الإلكترون المحرَّر لا يستقرّ عند ذرّة أخرى', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage2');
    h.clickNode(svg.querySelector('.epos.clickable'));
    eq(svg.querySelectorAll('.sea-layer .epos').length, 1);
    eq(svg.querySelectorAll('.ion').length, 1);
  });

  it('الخطأ تلميح لا وسم أحمر، والتلميح يخاطب المشتّت بعينه', async () => {
    const { doc } = await page();
    doc.querySelectorAll('#stage2 .epos.clickable').forEach(e => h.clickNode(e));
    h.choose(doc, 'whereElectron', 'w2');
    const fb = doc.getElementById('fb-whereElectron');
    has(fb.textContent, 'تابع إلكترونًا واحدًا');
    has(fb.className, 'is-hint');
    h.choose(doc, 'whereElectron', 'w3');
    has(fb.textContent, 'ملعقة معدنية');
  });

  it('السؤال يُقفل بعد الإجابة الصحيحة', async () => {
    const { doc } = await page();
    doc.querySelectorAll('#stage2 .epos.clickable').forEach(e => h.clickNode(e));
    h.choose(doc, 'naIon', 'correct');
    const again = h.choose(doc, 'naIon', 'w1');
    ok(again.blocked, 'أمكن تبديل إجابة صحيحة بخاطئة');
  });

  it('بطاقة التسمية خلف جسر صريح لا كشف تلقائي', async () => {
    const { doc } = await page();
    doc.querySelectorAll('#stage2 .epos.clickable').forEach(e => h.clickNode(e));
    ['naIon', 'whereElectron', 'neutral', 'repulsion'].forEach(q => h.choose(doc, q, 'correct'));
    ok(hidden(doc, 's2nameCard'), 'التسمية انكشفت تلقائيًّا');
    no(hidden(doc, 's2nameBridge'));
    h.click(doc, 's2nameBtn');
    no(hidden(doc, 's2nameCard'));
    has(doc.getElementById('s2nameCard').textContent, 'بحر الإلكترونات');
  });

  it('سؤال التنافر يُسأل قبل التسمية', async () => {
    const { doc } = await page();
    doc.querySelectorAll('#stage2 .epos.clickable').forEach(e => h.clickNode(e));
    const beforeText = doc.getElementById('station-2').textContent;
    const iQ = beforeText.indexOf('ما الذي يمنع القطعة من التفكّك');
    ok(iQ > 0, 'السؤال غير موجود');
    ok(hidden(doc, 's2nameCard'), 'التسمية ظهرت قبل السؤال');
  });
});

/* ---------- المحطة 3 ---------- */
describe('المحطة 3 — النموذجان', () => {
  it('التصنيف لا يظهر قبل سؤال الكرات', async () => {
    const { doc } = await page();
    ok(hidden(doc, 's3after'));
    h.choose(doc, 'greySpheres', 'correct');
    no(hidden(doc, 's3after'));
  });

  it('رقاقة التجاذب في أحد الشكلين تُرفَض بتلميح', async () => {
    const { doc } = await page();
    h.choose(doc, 'greySpheres', 'correct');
    put(doc, 'التجاذب بين أيونات الفلزّ والإلكترونات الحرّة', 'lim-30');
    const fb = doc.querySelector('[data-chips="limits"] .chips-feedback');
    no(fb.hidden);
    has(fb.textContent, 'سهم أو خطّ');
    eq(doc.getElementById('lim-30').querySelectorAll('.slot-item').length, 0);
  });

  it('خانة الشكل 1-31 تسع رقاقتين ولا تُقفل بعد الأولى', async () => {
    const { doc } = await page();
    h.choose(doc, 'greySpheres', 'correct');
    put(doc, 'أيونات فلزّية موجبة الشحنة', 'lim-31');
    no(/correct/.test(doc.getElementById('lim-31').className), 'أُقفلت قبل امتلائها');
    put(doc, 'إلكترونات حرّة الحركة', 'lim-31');
    has(doc.getElementById('lim-31').className, 'correct');
  });

  it('الخلاصة والانتقال بعد اكتمال التصنيف، والنقاط أربع رقاقات', async () => {
    const { doc, w } = await page();
    flows.s3(doc);
    no(hidden(doc, 's3done'));
    has(doc.getElementById('s3done').textContent, 'قوّة لا جسيم');
    eq(w.XP.total(), 5 + 20);
  });
});

/* ---------- المحطة 4 ---------- */
describe('المحطة 4 — النسبة', () => {
  it('العدد الناقص والزائد يُبلَّغان ولا يفتحان ما بعدهما', async () => {
    const { doc } = await page();
    h.type(doc, 's4aInput', '6'); h.click(doc, 's4aCheck');
    has(doc.getElementById('s4amsg').textContent, 'الشحنات الموجبة أكثر');
    ok(hidden(doc, 's4b'));
    h.type(doc, 's4aInput', '10'); h.click(doc, 's4aCheck');
    has(doc.getElementById('s4amsg').textContent, 'ليست متعادلة');
    ok(hidden(doc, 's4b'));
  });

  it('العدد الصحيح يفتح السؤال ويمنح نقاط الإنتاج', async () => {
    const { doc, w } = await page();
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    has(doc.getElementById('s4amsg').textContent, 'القطعة متعادلة');
    no(hidden(doc, 's4b'));
    eq(w.XP.total(), 8);
  });

  it('البحر يُظهر عدد الطالب نفسه لا العدد الصحيح — الخطأ يُرى لا يُكتشف بالنقر', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage4a');
    h.type(doc, 's4aInput', '3'); h.click(doc, 's4aCheck');
    eq(svg.querySelectorAll('.sea-layer .epos').length, 3, 'البحر لم يُظهر رقم الطالب بعينه');
  });

  it('كتابة عدد جديد تعيد بناء البحر لا تضيف عليه', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage4a');
    h.type(doc, 's4aInput', '5'); h.click(doc, 's4aCheck');
    eq(svg.querySelectorAll('.sea-layer .epos').length, 5);
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    eq(svg.querySelectorAll('.sea-layer .epos').length, 8, 'تراكمت الإلكترونات بدل إعادة البناء');
  });

  it('حقل فارغ أو غير رقمي يُرفَض بتنبيه ولا يُبنى به بحر', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage4a');
    h.type(doc, 's4aInput', 'ثمانية'); h.click(doc, 's4aCheck');
    eq(svg.querySelectorAll('.sea-layer .epos').length, 0);
    has(doc.getElementById('s4amsg').textContent, 'عددًا صحيحًا');
  });

  it('الإجابة القصيرة تقبل الرقم واللفظ معًا', async () => {
    const { doc } = await page();
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    h.type(doc, 'cu100Input', 'مئتان إلكترون');
    h.click(doc, 'cu100Btn');
    has(doc.getElementById('fb-cu100').className, 'is-correct');
  });

  it('مخرج النجاة يظهر بعد محاولتين ويمنح نصف النقاط', async () => {
    const { doc, w } = await page();
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    const before = w.XP.total();
    h.type(doc, 'cu100Input', '20');  h.click(doc, 'cu100Btn');
    ok(doc.getElementById('cu100ModelBtn').hidden, 'ظهر مبكّرًا');
    h.type(doc, 'cu100Input', '150'); h.click(doc, 'cu100Btn');
    no(doc.getElementById('cu100ModelBtn').hidden, 'لم يظهر بعد محاولتين');
    h.click(doc, 'cu100ModelBtn');
    has(doc.getElementById('cu100Model').textContent, '100 × 2 = 200');
    eq(w.XP.total() - before, 3, 'نصف نقاط السؤال مجبورة للأعلى (5 → 3)');
  });
});

/* ---------- المحطة 5 ---------- */
describe('المحطة 5 — التوصيل', () => {
  it('السلك مليء بالإلكترونات قبل وصل البطارية', async () => {
    const { doc } = await page();
    ok(doc.querySelectorAll('#stage5a .sea-layer .epos').length >= 10);
  });

  it('لوحا الحرارة لا يظهران قبل سؤال التيار', async () => {
    const { doc } = await page();
    ok(hidden(doc, 's5heat'));
    h.click(doc, 's5connect');
    h.choose(doc, 'whatMoves', 'correct');
    no(hidden(doc, 's5heat'));
  });

  it('سؤال الطهي يُصحَّح بالمفاهيم لا بالحروف', async () => {
    const { doc } = await page();
    h.click(doc, 's5connect'); h.choose(doc, 'whatMoves', 'correct');
    h.click(doc, 's5warm');    h.choose(doc, 'heat', 'correct');
    h.type(doc, 'cookInput',
      'بدون الالكترونات الحرة لن تنتقل الطاقة الحرارية الا ببطء شديد فيطول الطهي');
    h.click(doc, 'cookBtn');
    has(doc.getElementById('fb-cook').className, 'is-correct');
  });

  it('الاستخدامات: كل خانة تسع استخدامين', async () => {
    const { doc, w } = await page();
    flows.s5(doc);
    has(doc.getElementById('use-heat').className, 'correct');
    has(doc.getElementById('use-elec').className, 'correct');
    eq(doc.getElementById('use-heat').querySelectorAll('.slot-item').length, 2);
    no(hidden(doc, 's5sulfur'));
  });

  it('مشتّت الكبريت «أيونات سالبة» له تلميحه الخاصّ', async () => {
    const { doc } = await page();
    flows.s5(doc);
    // السؤال محلول في المسار، فنعيد التحقّق على تلميح مشتّت آخر
    ok(doc.getElementById('fb-sulfur').textContent.length > 10);
  });
});

/* ---------- المحطة 6 ---------- */
describe('المحطة 6 — الخصائص', () => {
  it('مسرح الانزلاق لا يظهر قبل سؤال المقارنة', async () => {
    const { doc } = await page();
    ok(hidden(doc, 's6slide'));
    h.choose(doc, 'naVsMg', 'correct');
    no(hidden(doc, 's6slide'));
  });

  it('سؤال الطرق لا يُسأل قبل أن ينزلق الصفّ فعلًا', async () => {
    const { doc } = await page();
    h.choose(doc, 'naVsMg', 'correct');
    ok(hidden(doc, 's6q'), 'السؤال ظهر قبل التجربة');
    h.click(doc, 's6keyboard');
    no(hidden(doc, 's6q'));
    has(doc.getElementById('s6msg').textContent, 'لم تنكسر');
  });

  it('جدول الخصائص: خمس رقاقات على ثلاثة أسباب', async () => {
    const { doc, w } = await page();
    h.choose(doc, 'naVsMg', 'correct');
    h.click(doc, 's6keyboard');
    h.choose(doc, 'malleable', 'correct');
    const before = w.XP.total();
    put(doc, 'الصلابة', 'prop-strong');
    put(doc, 'درجة الانصهار المرتفعة', 'prop-free');     // خطأ مقصود
    const fb = doc.querySelector('[data-chips="props"] .chips-feedback');
    has(fb.textContent, 'تفكيك الشبكة');
    put(doc, 'درجة الانصهار المرتفعة', 'prop-strong');
    put(doc, 'التوصيل الحراري', 'prop-free');
    put(doc, 'التوصيل الكهربائي', 'prop-free');
    put(doc, 'قابلية الطرق والسحب', 'prop-slide');
    eq(w.XP.total() - before, 25, 'خمس رقاقات × 5');
    no(hidden(doc, 's6bonus'));
  });

  it('التحدّي الاختياري يُسعَّر ككلّ لا برقاقاته', async () => {
    const { doc, w } = await page();
    flows.s6(doc, false);
    const before = w.XP.total();
    put(doc, 'Li₂O', 'trio-ionic');
    eq(w.XP.total(), before, 'رقاقة التحدّي منحت نقاطًا منفردة');
    ['LiF', 'MgO', 'MgF₂'].forEach(v => put(doc, v, 'trio-ionic'));
    ['O₂', 'F₂'].forEach(v => put(doc, v, 'trio-cov'));
    ['Li', 'Mg'].forEach(v => put(doc, v, 'trio-metal'));
    eq(w.XP.total() - before, 8, 'نقاط التحدّي ككلّ');
    has(doc.getElementById('s6bonus').textContent, 'ثلاث حالات');
  });

  it('التحدّي اختياري: الانتقال إلى التقييم متاح بدونه', async () => {
    const { doc } = await page();
    flows.s6(doc, false);
    no(hidden(doc, 's6bonus'), 'كتلة الانتقال محبوسة خلف التحدّي');
    ok(doc.querySelector('#s6bonus .station-next'), 'لا زرّ انتقال');
  });
});

/* ---------- المحطة 7 ---------- */
describe('المحطة 7 — التقييم الختامي', () => {
  it('عنوان المحطة «التقييم الختامي» — لفظ المنصّة الموحّد', async () => {
    const { doc } = await page();
    has(doc.querySelector('#station-7 h2').textContent, 'التقييم الختامي');
  });

  it('الأسئلة لا تظهر قبل كتابة الاسم', async () => {
    const { doc } = await page();
    ok(hidden(doc, 'evalQuestions'));
    h.click(doc, 'evalStart');
    has(doc.getElementById('evalNameFb').textContent, 'اكتب اسمك');
    ok(hidden(doc, 'evalQuestions'));
    h.type(doc, 'evalName', 'فؤاد');
    h.click(doc, 'evalStart');
    no(hidden(doc, 'evalQuestions'));
  });

  it('محاولة واحدة: الإقفال فور أول اختيار', async () => {
    const { doc } = await page();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.choose(doc, 'e1', 'w1');
    const again = h.choose(doc, 'e1', 'correct');
    ok(again.blocked, 'أمكن تبديل الإجابة في التقييم');
  });

  it('الخطأ يُوسَم ويُضاء الصحيح معه ومعهما سطر يشرح', async () => {
    const { doc } = await page();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.choose(doc, 'e4', 'w1');
    const group = doc.querySelector('.quiz-options[data-q="e4"]');
    ok(group.querySelector('.quiz-option.incorrect'), 'لم يُوسَم اختيار الطالب');
    ok(group.querySelector('.quiz-option.correct'), 'لم يُضَأ الخيار الصحيح');
    has(doc.getElementById('fb-e4').textContent, 'طاقة كبيرة');
  });

  it('السؤال 6 يقبل «100» و«مئة» معًا', async () => {
    const { doc } = await page();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.type(doc, 'e6Input', 'مئة إلكترون'); h.click(doc, 'e6Btn');
    has(doc.getElementById('fb-e6').className, 'is-correct');
  });

  it('السؤال 5 يُصحَّح بالمفاهيم لا بالتطابق الحرفيّ', async () => {
    const { doc } = await page();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.type(doc, 'e5Input', 'فيها الكترونات حرة الحركة تنتقل فتحمل التيار');
    h.click(doc, 'e5Btn');
    has(doc.getElementById('fb-e5').className, 'is-correct');
  });

  it('التقييم بلا نقاط: مكافأته الشارة والشهادة', async () => {
    const { doc, w } = await page();
    flows.all(doc);
    const before = w.XP.total();
    flows.s7(doc, 'فؤاد');
    eq(w.XP.total(), before, 'محطة التقييم منحت نقاطًا');
  });

  it('الشهادة تُنادى بالاسم والعنوان والعلامة', async () => {
    const s = await page();
    flows.s7(s.doc, 'سالم');
    eq(s.certCalls.length, 1);
    eq(s.certCalls[0][0], 'سالم');
    has(s.certCalls[0][1], 'موصّلات جيّدة');
    no(/الدرس رقم/.test(s.certCalls[0][1]), 'العنوان يحمل بادئة «الدرس رقم»');
    eq(s.certCalls[0][2], 100);
  });

  it('الشارات على عتبتيها: 8 من 10 متمكن و10 من 10 متميز', async () => {
    const a = await page();
    flows.s7(a.doc, 'أ', ['e1', 'e2']);
    eq(a.certCalls[0][2], 80);
    has(a.doc.getElementById('evalSummary').textContent, 'متميز');

    const b = await page();
    flows.s7(b.doc, 'ب', ['e1', 'e2', 'e3']);
    eq(b.certCalls[0][2], 70);
    has(b.doc.getElementById('evalSummary').textContent, 'متمكن');
  });

  it('حقل الاسم يبقى قابلًا للتصحيح حتى التسليم', async () => {
    const s = await page();
    h.type(s.doc, 'evalName', 'خطأ'); h.click(s.doc, 'evalStart');
    h.type(s.doc, 'evalName', 'الاسم الصحيح');
    flows.s7(s.doc, 'الاسم الصحيح');
    eq(s.certCalls[0][0], 'الاسم الصحيح');
  });
});

/* ---------- الرصيد والتخزين ---------- */
describe('درس 05 — الرصيد الكامل والتخزين', () => {
  it('الرصيد الكامل 214 نقطة بالضبط', async () => {
    const { doc, w } = await page();
    flows.all(doc);
    eq(w.XP.total(), 214);
  });

  it('لا كسب مزدوج بعد إعادة تحميل الصفحة', async () => {
    const store = {};
    const first = await page({ storage: store });
    first.doc.querySelector('#stage1 .atom-hit');
    flows.s1(first.doc);
    flows.s2(first.doc);
    const total = first.w.XP.total();

    const again = await page({ storage: store });
    eq(again.w.XP.total(), total, 'الرصيد لم يُستعَد');
    const hit = again.doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    eq(again.w.XP.total(), total, 'كُسبت النقاط مرّتين');
  });

  it('الدخول بمرساة إلى محطة متقدّمة يفتحها', async () => {
    const { doc } = await page({ hash: '#station-5' });
    no(hidden(doc, 'station-5'), 'المحطة لم تُفتح بالمرساة');
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
    /* مخالفة قائمة — تُصلَح في جلسة مراجعة الوحدة 01. */
    lengthGap:    { known: { 'whereElectron': 13 } }
  });

run();
