'use strict';
/* ==========================================================
   اختبارات سلوك درس 04 — كيف تتكوّن الروابط التساهمية؟
   ----------------------------------------------------------
   تُكتب على ما يراه الطالب ويفعله، لا على البنية الداخلية.
   المجموعات تُلتقط باسم حقل الراديو، والإلكترونات بصنف الدعوة
   إلى النقر — كلاهما جزء من دلالة الواجهة لا من تفاصيل المحرّك.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');
const f = require('./flows-l4');

function scenario(opts) {
  const s = { ready: null };
  s.boot = function () {
    if (!s.ready) s.ready = f.load(opts).then(r => Object.assign(s, r));
    return s.ready;
  };
  return s;
}

/* ---------------------------------------------------------
   1) البنية العامة والتوصيل
   --------------------------------------------------------- */
const A = scenario();
describe('البنية العامة والتوصيل', () => {
  it('الصفحة تُحمّل بلا خطأ في شاشة المطوّر', async () => {
    const { logs } = await A.boot();
    const errs = logs.filter(l => /jsdomError|error:/.test(l) && !/fonts|css/i.test(l));
    eq(errs.length, 0, 'أخطاء: ' + errs.join(' | '));
  });

  it('الوحدات المشتركة الستّ محمّلة', async () => {
    const { w } = await A.boot();
    ok(w.XP, 'xp.js');
    ok(w.Sounds, 'sounds.js');
    ok(w.Quiz, 'template.js');
    ok(w.Certificate, 'certificate.js');
  });

  it('وسوم shared تسبق سكربتات الدرس — وإلا لم يوجد Quiz لحظة النداء', async () => {
    const { raw } = await A.boot();
    const lastShared = raw.lastIndexOf('<script src="../../shared/');
    const firstInline = raw.indexOf('<script>\n/* ====');
    ok(lastShared > 0 && firstInline > lastShared, 'سكربت الدرس يسبق وسوم المشترك');
  });

  it('سبع نقاط تقدّم — وهي مقام عدّاد المحطات', async () => {
    const { doc } = await A.boot();
    eq(doc.querySelectorAll('.progress-dot').length, 7);
  });

  it('سبع محطات معلنة بلا مرحلة داخلية', async () => {
    const { doc } = await A.boot();
    eq(doc.querySelectorAll('section.station').length, 7);
  });

  it('عدّاد المحطات يقول «من 7» مشتقًّا من النقاط', async () => {
    const { doc } = await A.boot();
    const total = doc.querySelector('.station-counter .sc-total');
    ok(total, 'العدّاد لم يُحقن');
    eq(total.textContent.trim(), '7');
  });

  it('محطة التقييم تحوي مرساة زرّ الشهادة', async () => {
    const { doc } = await A.boot();
    ok(doc.getElementById('certTriggerSlot'), 'certTriggerSlot مفقود');
  });

  it('لا سؤال في الوسم بلا تسجيل في الدرس', async () => {
    const { logs } = await A.boot();
    const orphans = logs.filter(l => l.indexOf('بلا تسجيل') !== -1);
    eq(orphans.length, 0, orphans.join(' | '));
  });

  it('قيم data-q فريدة في الصفحة', async () => {
    const { doc } = await A.boot();
    const names = Array.from(doc.querySelectorAll('.quiz-options[data-q]')).map(g => g.dataset.q);
    eq(new Set(names).size, names.length);
  });

  it('لا مُعرّفات مكرّرة', async () => {
    const { doc } = await A.boot();
    const ids = Array.from(doc.querySelectorAll('[id]')).map(n => n.id);
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    eq(dup.length, 0, 'مكرّر: ' + dup.join(','));
  });

  it('زرّ ممتلئ واحد لكل محطة — الحارس لم يهبّط شيئًا', async () => {
    const { doc } = await A.boot();
    eq(doc.querySelectorAll('.station-next.demoted').length, 0);
  });

  it('الرصيد يبدأ من صفر: لا نقاط بالتمرير', async () => {
    const { w } = await A.boot();
    eq(w.XP.total(), 0);
  });
});

/* ---------------------------------------------------------
   2) المحطة 1 — تنبّؤ لا يُصحَّح
   --------------------------------------------------------- */
const B = scenario();
describe('المحطة 1 — التنبّؤ', () => {
  it('زرّ الانتقال مخفيّ قبل التنبّؤ', async () => {
    const { doc } = await B.boot();
    no(h.visible(doc, 'predictDone'));
  });

  it('أي خيار يُقبل: لا صواب ولا خطأ في التنبّؤ', async () => {
    const { w, doc } = await B.boot();
    h.choose(doc, 'l4predict', 'p4');
    await h.tick(w, 20);
    const fb = doc.getElementById('fb-predict');
    ok(fb && !fb.hidden, 'التغذية لم تظهر');
    no(fb.classList.contains('is-correct'), 'التغذية وُسمت صحيحة وهي تنبّؤ');
  });

  it('التنبّؤ يمنح نقاطه ويُقفل ويفتح الانتقال', async () => {
    const { w, doc } = await B.boot();
    eq(w.XP.total(), 3);
    ok(doc.querySelector('input[name="l4predict"]').disabled, 'لم يُقفل');
    ok(h.visible(doc, 'predictDone'), 'الانتقال لم يظهر');
  });
});

/* ---------------------------------------------------------
   3) المحطة 2 — العدّاد المزدوج
   --------------------------------------------------------- */
const C = scenario();
describe('المحطة 2 — بناء جزيء الكلور', () => {
  it('الخطأ تلميحٌ لا وسم، ولا يفتح ما بعده ولا يمنح نقاطًا', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clValence', 'w2');
    await h.tick(w, 20);
    has(h.text(doc, 'fb-cl-valence'), '💡');
    no(h.visible(doc, 'clNeedsStep'), 'الخطأ فتح السؤال التالي');
    eq(w.XP.total(), 0);
  });

  it('الصواب يمنح نقاطه ويفتح سؤال النقص وحده', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clValence', 'correct');
    await h.tick(w, 20);
    eq(w.XP.total(), 5);
    ok(h.visible(doc, 'clNeedsStep'));
    no(h.visible(doc, 'clBuildBlock'), 'المسرح ظهر قبل أوانه');
  });

  it('المسرح يظهر بعد سؤال النقص: ذرّة بالنقاط وذرّة بالصلبان', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clNeeds', 'correct');
    await h.tick(w, 60);
    ok(h.visible(doc, 'clBuildBlock'));
    ok(doc.querySelectorAll('#stage2 .edot').length >= 17, 'ذرّة النقاط ناقصة');
    ok(doc.querySelectorAll('#stage2 .ecross').length >= 17, 'ذرّة الصلبان ناقصة');
    // الرمز داخل النواة لا فوق الذرّة — كما في رسم الكتاب
    const syms = Array.from(doc.querySelectorAll('#stage2 text.nucleus-label'))
      .map(t => t.textContent.trim());
    eq(syms.length, 2, 'رمزا العنصر');
    ok(syms.every(t => t === 'Cl'), 'الرمز داخل النواة هو رمز العنصر لا رقمه');
  });

  it('الصليب خطّان مرسومان لا حرف «×» نصّي', async () => {
    const { doc } = await C.boot();
    const asText = Array.from(doc.querySelectorAll('#stage2 text'))
      .some(t => (t.textContent || '').indexOf('×') !== -1);
    no(asText, 'وُجد حرف × نصّي داخل المسرح');
  });

  /* سؤال الاصطلاح يسبق استعماله: المسرح يُتأمَّل قبل أن يُلمَس. */
  it('المسرح يظهر ساكنًا: لا إلكترون قابل للنقر قبل سؤال الاصطلاح', async () => {
    const { doc } = await C.boot();
    ok(h.visible(doc, 'clMarkStep'), 'سؤال النقطة والعلامة لم يظهر مع المسرح');
    eq(f.live(doc, 'stage2').length, 0, 'المسرح تفاعلي قبل سؤال الاصطلاح');
    no(h.visible(doc, 'clGuide'), 'تعليمة البناء ظهرت قبل أوانها');
    no(h.visible(doc, 'clBuildHead'), 'عنوان البناء ظهر قبل أوانه');
  });

  it('مشتّت «نوعان مختلفان» يخاطب المفهوم الخاطئ نفسه', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clMarks', 'w1');
    await h.tick(w, 20);
    has(h.text(doc, 'fb-cl-marks'), 'كلتاهما كلور');
    eq(f.live(doc, 'stage2').length, 0, 'الخطأ فتح المسرح');
  });

  it('الصواب يفتح النقر ويُظهر تعليمة البناء', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clMarks', 'correct');
    await h.tick(w, 40);
    ok(h.visible(doc, 'clGuide'));
    ok(h.visible(doc, 'clBuildHead'));
    eq(w.XP.total(), 15);
  });

  it('إلكترونان فقط قابلان للنقر — واحد من كل ذرّة', async () => {
    const { doc } = await C.boot();
    eq(f.live(doc, 'stage2').length, 2);
  });

  it('العدّاد لا يظهر أثناء البناء: لا يفشي جواب سؤال العدّ', async () => {
    const { doc } = await C.boot();
    const c = doc.querySelectorAll('#stage2 .ecount');
    eq(c.length, 2, 'العدّادان لم يُبنيا');
    no(c[0].classList.contains('show'), 'العدّاد ظاهر قبل السؤال');
  });

  it('الإلكترون الأول: رسالة نصف الزوج، وسؤال العدّ ما زال مغلقًا', async () => {
    const { w, doc } = await C.boot();
    h.clickNode(f.live(doc, 'stage2')[0]);
    await h.tick(w, 70);
    has(h.text(doc, 'clMsg'), 'انقر إلكترون الذرّة الأخرى');
    no(h.visible(doc, 'clCountStep'));
  });

  it('اكتمال الزوج يفتح سؤال العدّ ويُقفل المسرح', async () => {
    const { w, doc } = await C.boot();
    h.clickNode(f.live(doc, 'stage2')[0]);
    await h.tick(w, 80);
    has(h.text(doc, 'clMsg'), 'اكتمل زوج مشترك');
    ok(h.visible(doc, 'clCountStep'));
    eq(doc.querySelectorAll('#stage2 .epos.shared').length, 2);
    eq(f.live(doc, 'stage2').length, 0, 'بقي إلكترون قابل للنقر بعد اكتمال الزوج');
  });

  it('نقاط البناء تُمنح عند اكتمال الزوج', async () => {
    const { w } = await C.boot();
    ok(w.XP.has('l4-cl-build'), 'نقاط البناء لم تُمنح');
    eq(w.XP.total(), 25);
  });

  it('والعدّاد يبقى مخفيًّا حتى يجيب الطالب', async () => {
    const { doc } = await C.boot();
    no(doc.querySelectorAll('#stage2 .ecount')[0].classList.contains('show'));
  });

  it('تلميح المشتّت «6» يخاطب الخطأ نفسه لا السؤال', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clCount', 'w1');
    await h.tick(w, 20);
    has(h.text(doc, 'fb-cl-count'), 'لم تفقد');
  });

  it('الإجابة الصحيحة تُظهر العدّادين على 8 ومعهما طوقا العدّ المزدوج', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'clCount', 'correct');
    await h.tick(w, 40);
    ok(h.visible(doc, 'clCountLine'), 'سطر التثبيت لم يظهر');
    const c = doc.querySelectorAll('#stage2 .ecount');
    ok(c[0].classList.contains('show') && c[1].classList.contains('show'), 'العدّادان لم يظهرا');
    eq(c[0].textContent, '8');
    eq(c[1].textContent, '8');
    eq(doc.querySelectorAll('#stage2 .count-lasso').length, 2);
  });

  it('سؤال سبب المشاركة يظهر بعد انتهاء حركة العدّ', async () => {
    const { w, doc } = await C.boot();
    await h.tick(w, 400);
    ok(h.visible(doc, 'whyShareStep'));
  });

  it('المحطة تُسلَّم برصيد 35', async () => {
    const { w, doc } = await C.boot();
    h.choose(doc, 'whyShare', 'correct');
    await h.tick(w, 30);
    ok(h.visible(doc, 'st2Done'));
    eq(w.XP.total(), 35);
  });
});

/* ---------------------------------------------------------
   4) المحطة 4 — النقص لا يهتزّ، والنموذج يعدّ عصيّه
   --------------------------------------------------------- */
const D = scenario();
describe('المحطة 4 — أنواع الروابط', () => {
  it('مسرح الأكسجين يفتح الزوج الأول وحده، وعدّاده حيّ من 6', async () => {
    const { w, doc } = await D.boot();
    h.choose(doc, 'oNeeds', 'correct');
    await h.tick(w, 60);
    ok(h.visible(doc, 'o2Block'));
    eq(f.live(doc, 'stage4o').length, 2);
    const c = doc.querySelectorAll('#stage4o .ecount');
    ok(c[0].classList.contains('show'), 'عدّاد الأكسجين مخفيّ');
    eq(c[0].textContent, '6');
  });

  it('بعد الزوج الأول: رسالة نقص وسؤال — بلا اهتزاز', async () => {
    const { w, doc } = await D.boot();
    await f.makePair(w, doc, 'stage4o');
    ok(h.visible(doc, 'o2Impasse'), 'رسالة النقص لم تظهر');
    has(h.text(doc, 'o2Impasse'), 'يحتاج 8');
    eq(doc.querySelectorAll('#stage4o .shaking').length, 0, 'اهتزاز في حالة نقص لا منع');
    eq(doc.querySelectorAll('#stage4o .ecount')[0].textContent, '7');
    eq(f.live(doc, 'stage4o').length, 2, 'الزوج الثاني لم يُفتح');
    no(h.visible(doc, 'cmpStep'), 'السؤال ظهر قبل اكتمال البناء');
  });

  it('الزوج الثاني يكمل المستوى ويُسمّي الرابطة الثنائية بعد البناء', async () => {
    const { w, doc } = await D.boot();
    await f.makePair(w, doc, 'stage4o');
    eq(doc.querySelectorAll('#stage4o .ecount')[0].textContent, '8');
    ok(doc.getElementById('o2Impasse').hidden, 'رسالة النقص لم تزل بزوال سببها');
    ok(h.visible(doc, 'o2Name'), 'بطاقة التسمية لم تظهر');
    ok(h.visible(doc, 'cmpStep'));
    eq(doc.querySelectorAll('#stage4o .epos.shared').length, 4);
    ok(w.XP.has('l4-o2-build'));
  });

  it('سؤال المقارنة يقيس الأزواج بوحدة الكتاب لا بعدد الإلكترونات', async () => {
    const { doc } = await D.boot();
    const q = doc.querySelector('#cmpStep .explore-q').textContent;
    has(q, 'قارن');
    const correct = doc.querySelector('input[name="cmpPairs"][value="correct"]');
    has(correct.parentNode.textContent, 'الأزواج');
  });

  it('النيتروجين ثلاثة أزواج بالتتابع، وعدّاده يبلغ 8', async () => {
    const { w, doc } = await D.boot();
    h.choose(doc, 'cmpPairs', 'correct');
    await h.tick(w, 60);
    ok(h.visible(doc, 'n2Block'));
    for (let i = 0; i < 3; i++) {
      eq(f.live(doc, 'stage4n').length, 2, 'الزوج ' + (i + 1) + ' غير مفتوح وحده');
      await f.makePair(w, doc, 'stage4n');
    }
    eq(doc.querySelectorAll('#stage4n .epos.shared').length, 6);
    eq(doc.querySelectorAll('#stage4n .ecount')[0].textContent, '8');
    ok(h.visible(doc, 'n2Name'));
    ok(h.visible(doc, 'stickBlock'));
  });

  it('النماذج مخفيّة حتى يطلبها الطالب — تنبّؤ قبل كشف', async () => {
    const { doc } = await D.boot();
    no(h.visible(doc, 'models4'), 'النماذج ظهرت بلا طلب');
  });

  it('والزرّ يكشفها أسفله، فلا يصعد الطالب باحثًا عمّا تغيّر', async () => {
    const { w, doc } = await D.boot();
    h.click(doc, 'showModels4');
    await h.tick(w, 30);
    ok(h.visible(doc, 'models4'));
    eq(doc.querySelectorAll('#models4 .repr-fig').length, 2, 'نموذجان للمقارنة');
    // الرسم النقطي يبقى فوقها للرجوع
    no(doc.querySelector('#stage4n .dots-view').classList.contains('is-off'),
       'الرسم النقطي اختفى — المطلوب بقاؤه');
  });

  it('عدد العصيّ في كل نموذج = عدد الأزواج المشتركة', async () => {
    const { doc } = await D.boot();
    const figs = doc.querySelectorAll('#models4 .repr-fig');
    eq(figs[0].querySelectorAll('line.stick').length, 2, 'الأكسجين عصاتان');
    eq(figs[1].querySelectorAll('line.stick').length, 3, 'النيتروجين ثلاث');
  });

  it('سؤال معنى العصا يسلّم المحطة', async () => {
    const { w, doc } = await D.boot();
    h.choose(doc, 'stickQ', 'correct');
    await h.tick(w, 30);
    ok(h.visible(doc, 'stickLine'));
    ok(h.visible(doc, 'st4Done'));
  });
});

/* ---------------------------------------------------------
   المحطة 5 — بناء الجزيئات الأربعة
   --------------------------------------------------------- */
const F = scenario();
describe('المحطة 5 — بناء الجزيئات', () => {
  it('الهيدروجين أوّلها: مستوى واحد يكتمل بإلكترونين لا بثمانية', async () => {
    const { w, doc } = await F.boot();
    eq(doc.querySelectorAll('#stage5h circle.orbit').length, 2, 'مستوى واحد لكل ذرّة');
    const c = doc.querySelectorAll('#stage5h .ecount');
    eq(c[0].textContent, '1', 'العدّاد يبدأ من 1');
    no(h.visible(doc, 'ch4Block'), 'الميثان ظهر قبل الهيدروجين');
    await f.makePair(w, doc, 'stage5h');
    eq(doc.querySelectorAll('#stage5h .ecount')[0].textContent, '2', 'الهيدروجين يكتمل باثنين');
    ok(h.visible(doc, 'h2Name'), 'بطاقة «يكتمل بإلكترونين» لم تظهر');
    ok(w.XP.has('l4-h2-build'));
    ok(h.visible(doc, 'ch4Block'));
  });

  it('الميثان أربع روابط، وذرّاته تبدأ في صفّ أسفل المشهد', async () => {
    const { w, doc } = await F.boot();
    eq(doc.querySelectorAll('#stage5c .h-atom').length, 4);
    no(h.visible(doc, 'nh3Block'));
    for (let i = 0; i < 4; i++) await f.bondH(w, doc, 'stage5c', i);
    await h.tick(w, 80);
    eq(doc.querySelectorAll('#stage5c .h-atom.bonded').length, 4);
    eq(doc.querySelectorAll('#stage5c .epos.shared').length, 8);
    ok(w.XP.has('l4-ch4-build'));
    ok(h.visible(doc, 'nh3Block'));
  });

  it('الأمونيا ثلاث روابط، والرابعة تُمنع ولا يُمنع الطالب', async () => {
    const { w, doc } = await F.boot();
    eq(doc.querySelectorAll('#stage5n .h-atom').length, 4);
    for (let i = 0; i < 3; i++) await f.bondH(w, doc, 'stage5n', i);
    await h.tick(w, 80);
    eq(doc.querySelectorAll('#stage5n .h-atom.bonded').length, 3);
    has(h.text(doc, 'nh3Msg'), 'ثلاث روابط أحادية');
    ok(w.XP.has('l4-nh3-build'));
    const fourth = await f.bondH(w, doc, 'stage5n', 3);
    await h.tick(w, 1400);
    eq(doc.querySelectorAll('#stage5n .h-atom.bonded').length, 3, 'الرابعة ارتبطت');
    ok(h.visible(doc, 'nh3Impasse'));
    has(h.text(doc, 'nh3Impasse'), 'اكتمل');
    ok(fourth.classList.contains('dim'), 'الرابعة لم تبهت');
  });

  it('الماء محتوى مقرَّر لا تحدٍّ اختياري', async () => {
    const { w, doc } = await F.boot();
    ok(h.visible(doc, 'h2oBlock'), 'مسرح الماء لم يظهر بعد الأمونيا');
    eq(doc.querySelectorAll('#stage5w .h-atom').length, 2);
    for (let i = 0; i < 2; i++) await f.bondH(w, doc, 'stage5w', i);
    await h.tick(w, 80);
    ok(w.XP.has('l4-h2o-build'));
    has(h.text(doc, 'h2oMsg'), 'رابطتان أحاديتان');
    ok(h.visible(doc, 'sameNumStep'));
  });

  it('سؤال المقارنة يفتح كتلة النماذج ولا يسلّم المحطة بعد', async () => {
    const { w, doc } = await F.boot();
    h.choose(doc, 'sameNum', 'correct');
    await h.tick(w, 40);
    ok(h.visible(doc, 'sameNumLine'));
    ok(h.visible(doc, 'modelBlock'));
    no(h.visible(doc, 'models5'), 'النماذج ظهرت بلا طلب');
    no(h.visible(doc, 'st5Done'), 'المحطة سُلّمت قبل رؤية النماذج');
  });

  it('والزرّ يكشف الأربعة أسفله ويسلّم المحطة', async () => {
    const { w, doc } = await F.boot();
    h.click(doc, 'showModels5');
    await h.tick(w, 40);
    ok(h.visible(doc, 'models5'));
    eq(doc.querySelectorAll('#models5 .repr-fig').length, 4);
    ok(h.visible(doc, 'st5Done'));
    // الرسوم النقطية تبقى فوقها للرجوع
    ['stage5h', 'stage5c', 'stage5n', 'stage5w'].forEach(id => {
      no(doc.querySelector('#' + id + ' .dots-view').classList.contains('is-off'), id);
    });
  });

  it('وبطاقة «الروابط التساهمية حولك» تربط بقطر وبعود الثقاب معًا', async () => {
    const { doc } = await F.boot();
    const card = doc.querySelector('#st5Done .fact-card');
    ok(card, 'البطاقة غائبة');
    has(card.textContent, 'قطر');
    has(card.textContent, 'الثقاب');
  });
});

/* ---------------------------------------------------------
   المحطة 6 — الجدول والتكافؤ
   --------------------------------------------------------- */
const E = scenario();
describe('المحطة 6 — عدد الروابط والتكافؤ', () => {
  it('أربعة عناصر كما في دليل المعلّم', async () => {
    const { doc } = await E.boot();
    eq(doc.querySelectorAll('.bond-table tbody tr').length, 4);
    eq(doc.querySelectorAll('.bond-table tbody .slot').length, 4);
  });

  it('عمود التكافؤ مغطًّى قبل اكتمال عمود الروابط — وإلا نُسخ منه', async () => {
    const { doc } = await E.boot();
    const veiled = doc.querySelectorAll('.bond-table .veiled');
    eq(veiled.length, 4);
    veiled.forEach(v => ok(v.hidden, 'قيمة تكافؤ مكشوفة قبل أوانها'));
    no(h.visible(doc, 'patternStep'));
  });

  it('الرقاقات أكثر من الخانات فلا يُحلّ الجدول بالاستبعاد', async () => {
    const { doc } = await E.boot();
    eq(doc.querySelectorAll('#bondPool .chip').length, 8);
  });

  it('اكتمال الجدول يكشف التكافؤ ويفتح سؤال العلاقة ويمنح 20', async () => {
    const { w, doc } = await E.boot();
    const before = w.XP.total();
    await f.fillTable(w, doc);
    eq(doc.querySelectorAll('.bond-table tbody .slot.correct').length, 4);
    doc.querySelectorAll('.bond-table .veiled').forEach(v => no(v.hidden, 'التكافؤ لم يُكشف'));
    ok(doc.getElementById('veilNote').hidden, 'سطر التغطية بقي بعد الكشف');
    ok(h.visible(doc, 'patternStep'));
    eq(w.XP.total() - before, 20);
  });

  it('العلاقة هي التكافؤ نفسه لا معادلة — كما في دليل المعلّم', async () => {
    const { doc } = await E.boot();
    const correct = doc.querySelector('input[name="valencyQ"][value="correct"]');
    has(correct.parentNode.textContent, 'التكافؤ');
    const all = doc.querySelector('.quiz-options[data-q="valency"]').textContent;
    no(all.indexOf('8 −') !== -1 || all.indexOf('8 -') !== -1, 'بقيت معادلة «8 ناقص» في الخيارات');
  });

  it('تلميح مشتّت الضعف يخاطبه بعينه', async () => {
    const { w, doc } = await E.boot();
    h.choose(doc, 'valencyQ', 'w1');
    await h.tick(w, 20);
    has(h.text(doc, 'fb-valency'), 'تكافؤ الكربون');
  });

  it('الصواب يفتح سؤال الفوسفور ويمنح نقاط النمط', async () => {
    const { w, doc } = await E.boot();
    const before = w.XP.total();
    h.choose(doc, 'valencyQ', 'correct');
    await h.tick(w, 30);
    eq(w.XP.total() - before, 12);
    ok(h.visible(doc, 'phosStep'));
  });

  it('الفوسفور عنصر لم يبنِه الطالب — تطبيق لا استرجاع', async () => {
    const { w, doc } = await E.boot();
    h.choose(doc, 'phosQ', 'correct');
    await h.tick(w, 30);
    ok(h.visible(doc, 'shapeBlock'));
  });

  it('نماذج المقارنة أربعة، وجوابها جزيء بناه الطالب ورأى نموذجه', async () => {
    const { doc } = await E.boot();
    eq(doc.querySelectorAll('#shapeBlock .repr-fig').length, 4);
    const caps = Array.from(doc.querySelectorAll('#shapeBlock .repr-cap'))
      .map(n => n.textContent.replace(/\s+/g, ''));
    ok(caps.some(t => t.indexOf('N') !== -1 && t.indexOf('2') !== -1), 'نموذج النيتروجين غائب');
    const correct = doc.querySelector('input[name="shapeQ"][value="correct"]');
    has(correct.parentNode.textContent, 'النيتروجين');
  });

  it('وسؤال الشكل يسلّم المحطة', async () => {
    const { w, doc } = await E.boot();
    h.choose(doc, 'shapeQ', 'correct');
    await h.tick(w, 40);
    ok(h.visible(doc, 'st6Done'));
  });
});

const G = scenario();
describe('المحطة 7 — التقييم', () => {
  it('عشرة أسئلة، وكلّها مخفيّة قبل بوابة الاسم', async () => {
    const { doc } = await G.boot();
    eq(doc.querySelectorAll('#evalQuestions .eval-q').length, 10);
    ok(doc.getElementById('evalQuestions').hidden);
  });

  it('لا يبدأ التقييم بلا اسم', async () => {
    const { w, doc } = await G.boot();
    h.click(doc, 'evalStart');
    await h.tick(w, 20);
    ok(doc.getElementById('evalQuestions').hidden, 'بدأ بلا اسم');
  });

  it('الاسم يفتح الأسئلة', async () => {
    const { w, doc } = await G.boot();
    h.type(doc, 'evalName', 'فؤاد حوراني');
    h.click(doc, 'evalStart');
    await h.tick(w, 20);
    no(doc.getElementById('evalQuestions').hidden);
  });

  it('الخطأ يُوسَم ويُضاء الصحيح معه ومعهما سطر «لماذا»', async () => {
    const { w, doc } = await G.boot();
    h.choose(doc, 'ev1', 'w1');
    await h.tick(w, 20);
    const g = doc.querySelector('.quiz-options[data-q="ev1"]');
    ok(g.querySelector('input[value="w1"]').closest('.quiz-option').classList.contains('incorrect'));
    ok(g.querySelector('input[value="correct"]').closest('.quiz-option').classList.contains('correct'));
    has(h.text(doc, 'fb-ev1'), '✗');
  });

  it('الإقفال يقع فور أول اختيار لا فور الصواب — هذا تقييم لا تدريب', async () => {
    const { doc } = await G.boot();
    const g = doc.querySelector('.quiz-options[data-q="ev1"]');
    ok(g.querySelector('input[value="correct"]').disabled);
  });

  it('رسوم سؤال الماء أربعة، وتختلف في عدد الروابط لا في غيرها', async () => {
    const { doc } = await G.boot();
    const g = doc.querySelector('.quiz-options[data-q="ev2"]');
    eq(g.querySelectorAll('svg').length, 4);
    g.querySelectorAll('svg').forEach(s => {
      ok(s.getAttribute('aria-label'), 'رسم بلا وصف لقارئ الشاشة');
      // العلامات غير المشاركة أربع في كل رسم: الفرق في الروابط وحدها
      eq(s.querySelectorAll('circle.edot[cy="26"], circle.edot[cy="22"]').length, 4);
    });
  });

  it('الإجابة القصيرة تقبل «ثلاثة» كما تقبل 3', async () => {
    const { w, doc } = await G.boot();
    ['ev2', 'ev3', 'ev4', 'ev5', 'ev6', 'ev8', 'ev9'].forEach(n => h.choose(doc, n, 'correct'));
    await h.tick(w, 20);
    h.type(doc, 'ev7Input', 'ثلاثة');
    h.click(doc, 'ev7Check');
    await h.tick(w, 30);
    has(h.text(doc, 'fb-ev7'), '✓');
  });

  it('النتيجة لا تظهر قبل آخر سؤال', async () => {
    const { doc } = await G.boot();
    ok(doc.getElementById('evalSummary').hidden);
  });

  it('آخر سؤال يُنهي التقييم وينادي الشهادة بعنوان بلا بادئة', async () => {
    const { w, doc } = await G.boot();
    const calls = [];
    w.Certificate.finish = (name, title, percent) => calls.push({ name, title, percent });
    h.choose(doc, 'ev10', 'correct');
    await h.tick(w, 40);
    eq(calls.length, 1, 'الشهادة لم تُنادَ مرّة واحدة');
    eq(calls[0].title, 'كيف تتكوّن الروابط التساهمية؟');
    eq(calls[0].name, 'فؤاد حوراني');
    eq(calls[0].percent, 90);
    no(doc.getElementById('evalSummary').hidden);
    has(doc.getElementById('evalSummary').textContent, 'متميز');
  });

  it('محطة التقييم لا تمنح نقطة واحدة', async () => {
    const { w } = await G.boot();
    eq(w.XP.total(), 0);
  });
});

/* ---------------------------------------------------------
   8) الرصيد الكامل — رقم مُثبَّت
   --------------------------------------------------------- */
describe('رصيد المسار', () => {
  it('المسار الكامل 155 نقطة — رقم مُثبَّت', async () => {
    const store = {};
    const { w, doc, dom } = await f.load({ storage: store });
    await f.fullPath(w, doc);
    eq(w.XP.total(), 155, 'رصيد المسار');
    dom.window.close();

    // إعادة تحميل بالتخزين نفسه: لا كسب مزدوج
    const again = await f.load({ storage: store });
    eq(again.w.XP.total(), 155, 'الرصيد بعد إعادة التحميل');
    h.choose(again.doc, 'l4predict', 'p1');
    await h.tick(again.w, 20);
    eq(again.w.XP.total(), 155, 'كُسبت نقاط مُعرّف سبق كسبه');
    again.dom.window.close();
  });
});

/* ---------------------------------------------------------
   9) الدخول من الخارج بالـhash
   --------------------------------------------------------- */
describe('الدخول بالـhash', () => {
  it('المحطة المقصودة وما قبلها تُفتح وتُفعَّل نقطتها', async () => {
    const { w, doc } = await h.loadLesson(f.FILE, { hash: '#station-5' });
    await h.tick(w, 40);
    ok(doc.getElementById('station-5').classList.contains('in-view'));
    ok(doc.getElementById('station-1').classList.contains('in-view'));
    ok(doc.querySelector('.progress-dot[data-target="station-5"]').classList.contains('active'));
  });
});

/* ---------------------------------------------------------
   10) قواعد الدقّة النصّية
   --------------------------------------------------------- */
const H = scenario();
describe('قواعد الدقّة', () => {
  function visibleClone(doc) {
    const b = doc.body.cloneNode(true);
    Array.from(b.querySelectorAll('script')).forEach(n => n.remove());
    return b;
  }

  it('لا «كاتيون» ولا «أنيون» في الدرس كلّه', async () => {
    const { doc } = await H.boot();
    const t = visibleClone(doc).textContent;
    no(t.indexOf('كاتيون') !== -1 || t.indexOf('أنيون') !== -1);
  });

  it('لا مصطلح «الزوج المنفرد» — غير موجود في الكتاب', async () => {
    const { doc } = await H.boot();
    no(visibleClone(doc).textContent.indexOf('الزوج المنفرد') !== -1);
  });

  it('ولا لفظ «إلكترونات التكافؤ» — الكتاب يستعمل التكافؤ بمعنى عدد الروابط', async () => {
    const { doc } = await H.boot();
    no(visibleClone(doc).textContent.indexOf('إلكترونات التكافؤ') !== -1);
  });

  it('مصطلح واحد للمستوى الخارجي — لفظ الكتاب، بلا مرادف يواجه الطالب لفظين', async () => {
    const { doc } = await H.boot();
    const t = visibleClone(doc).textContent;
    ok(t.indexOf('المستوى الخارجي') !== -1, 'لفظ الكتاب غائب');
    no(/المستوى الأخير|مستواها الأخير|مستواه الأخير/.test(t), 'بقي لفظ «الأخير» في موضع ما');
  });

  it('وسطر وصف المحطة لا يَعِد بفعل لا يستطيعه الطالب بعدُ', async () => {
    const { doc } = await H.boot();
    const t2 = doc.querySelector('#station-2 .station-tagline').textContent;
    no(t2.indexOf('انقل') !== -1, 'وصف المحطة 2 يَعِد بالنقل قبل ظهور المسرح');
    const t4 = doc.querySelector('#station-4 .station-tagline').textContent;
    no(t4.indexOf('ابنِ') !== -1, 'وصف المحطة 4 يَعِد بالبناء قبل ظهور المسرح');
    const t6 = doc.querySelector('#station-6 .station-tagline').textContent;
    no(t6.indexOf('استخرج') !== -1, 'وصف المحطة 6 يَعِد باستخراج قبل الجدول');
  });

  it('أرقام غربية فقط', async () => {
    const { doc } = await H.boot();
    no(/[\u0660-\u0669]/.test(visibleClone(doc).textContent));
  });

  it('الأرقام المنخفضة بـ<sub> لا برمز يونيكود', async () => {
    const { doc } = await H.boot();
    const html = visibleClone(doc).innerHTML;
    no(/[\u2080-\u2089]/.test(html), 'وُجد رمز يونيكود للرقم المنخفض');
    ok(doc.querySelectorAll('sub').length > 0, 'لا <sub> في الدرس');
  });

  it('صندوق المصطلحات بلا ألفاظ إنجليزية', async () => {
    const { doc } = await H.boot();
    no(/[A-Za-z]/.test(doc.querySelector('.terms-box').textContent));
  });

  it('كل سؤال عدّ يحمل معطاه: بطاقات العدد الذرّي حاضرة', async () => {
    const { doc } = await H.boot();
    ok(doc.querySelectorAll('.given-row').length >= 7);
  });

  it('مواقع الإجابة الصحيحة في التقييم موزّعة لا مجمّعة', async () => {
    const { doc } = await H.boot();
    const pos = [];
    doc.querySelectorAll('#evalQuestions .quiz-options[data-q]').forEach(g => {
      const opts = Array.from(g.querySelectorAll('input[type="radio"]'));
      pos.push(opts.findIndex(o => o.value === 'correct'));
    });
    ok(new Set(pos).size >= 3, 'المواقع أقلّ من ثلاثة');
    const maxSame = Math.max(...[0, 1, 2, 3].map(i => pos.filter(p => p === i).length));
    ok(maxSame <= 4, 'تجمّعت الإجابات على حرف واحد');
  });

  it('الخيار الصحيح ليس أطول الخيارات في كل أسئلة التقييم', async () => {
    const { doc } = await H.boot();
    let offenders = 0;
    doc.querySelectorAll('#evalQuestions .quiz-options[data-q]').forEach(g => {
      const opts = Array.from(g.querySelectorAll('.quiz-option'))
        .map(o => ({ len: o.textContent.trim().length, ok: !!o.querySelector('input[value="correct"]') }));
      const longest = Math.max(...opts.map(o => o.len));
      const correct = opts.find(o => o.ok);
      if (correct && correct.len === longest && longest > 0) {
        const second = Math.max(...opts.filter(o => !o.ok).map(o => o.len));
        if (correct.len - second > 12) offenders++;
      }
    });
    eq(offenders, 0, 'أسئلة يُحلّ صحيحها بالاستبعاد اللغوي: ' + offenders);
  });

  it('كل تنقّل داخل بنية GitHub Pages — لا رابط جوجل سايت', async () => {
    const { doc } = await H.boot();
    const bad = Array.from(doc.querySelectorAll('a[href]'))
      .filter(a => /sites\.google/.test(a.getAttribute('href')));
    eq(bad.length, 0);
  });
});

run();
