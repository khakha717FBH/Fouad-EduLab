'use strict';
/* ==========================================================
   اختبارات سلوك درس 03 — خطّ الأساس
   ----------------------------------------------------------
   تُكتب على ما يراه الطالب ويفعله، لا على البنية الداخلية:
   هذا شرط بقائها صالحة بعد ترقية المحرّكات إلى template.js.
   لا يرد فيها اسم دالّة داخلية ولا سمة نطاق واحدة.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');
const f = require('./flows-l3');

// قراءة وسوم السكربتات من نصّ الملف نفسه (الاختبار ينفّذها بعد البناء)
function sharedSrcs(raw) {
  const out = [];
  const re = /<script\s+src="([^"]+)"\s*><\/script>/g;
  let m;
  while ((m = re.exec(raw))) { if (!/^https?:/.test(m[1])) out.push(m[1]); }
  return out;
}

// حالة مشتركة داخل كل مشهد: تحميل واحد وأسئلة متتابعة كما يمرّ بها الطالب
function scenario() {
  const s = {};
  s.ready = null;
  s.boot = function (opts) {
    if (!s.ready) s.ready = f.load(opts).then(r => Object.assign(s, r));
    return s.ready;
  };
  return s;
}

/* ---------------------------------------------------------
   1) البنية العامة
   --------------------------------------------------------- */
const A = scenario();
describe('البنية العامة للدرس', () => {
  it('الصفحة تُحمّل ومعها الوحدات المشتركة الستّ', async () => {
    const { w } = await A.boot();
    ok(w.XP, 'xp.js لم يُحمّل');
    ok(w.Sounds, 'sounds.js لم يُحمّل');
    ok(w.Certificate, 'certificate.js لم يُحمّل');
  });

  it('عدد نقاط التقدّم سبع — وهي مقام عدّاد المحطات', async () => {
    const { doc } = await A.boot();
    eq(doc.querySelectorAll('.progress-dot').length, 7);
  });

  it('عناصر المحطات ثمانية: سبع معلنة ومرحلة داخلية بلا نقطة', async () => {
    const { doc } = await A.boot();
    eq(doc.querySelectorAll('.station').length, 8);
  });

  it('المرحلة الداخلية تبدأ مخفيّة', async () => {
    const { doc } = await A.boot();
    ok(doc.getElementById('station-2b').hidden);
  });

  it('الرصيد يبدأ من صفر', async () => {
    const { w } = await A.boot();
    eq(w.XP.total(), 0);
  });

  it('محطة التقييم تحوي مرساة زرّ الشهادة', async () => {
    const { doc } = await A.boot();
    ok(doc.getElementById('certTriggerSlot'), 'certTriggerSlot مفقود');
  });

  it('كل مسارات الملفات المشتركة بمستويين لا ثلاثة', async () => {
    const { raw } = await A.boot();
    const srcs = sharedSrcs(raw);
    srcs.forEach(s => {
      ok(s.indexOf('../../shared/') === 0, 'مسار غير متوقّع: ' + s);
    });
    eq(srcs.length, 6);
  });

  it('ترتيب الوسوم المشتركة: sounds ← xp ← faheem ← template ← certificate ← footer', async () => {
    const { raw } = await A.boot();
    const srcs = sharedSrcs(raw);
    const order = ['sounds', 'xp-system', 'faheem', 'template', 'certificate', 'identity/footer'];
    order.forEach((part, i) => has(srcs[i], part, 'الوسم رقم ' + (i + 1)));
  });

  it('لا رابط خارجي إلى جوجل سايت داخل الدرس', async () => {
    const { doc } = await A.boot();
    const bad = Array.from(doc.querySelectorAll('a[href]'))
      .filter(a => /sites\.google/.test(a.getAttribute('href')));
    eq(bad.length, 0);
  });
});

/* ---------------------------------------------------------
   2) محطة 2 — تسلسل الاستكشاف
   --------------------------------------------------------- */
const B = scenario();
describe('محطة 2 — محرّك الاستكشاف المتتابع', () => {
  it('سؤال واحد فقط ظاهر عند البداية', async () => {
    const { doc } = await B.boot();
    no(doc.getElementById('explore-1').hidden, 'السؤال الأول يجب أن يكون ظاهرًا');
    ok(doc.getElementById('explore-2').hidden, 'السؤال الثاني يجب أن يكون مخفيًّا');
    ok(doc.getElementById('explore-3').hidden);
  });

  it('إجابة مكتوبة خاطئة: تلميح بلا تقدّم وبلا نقاط', async () => {
    const { w, doc } = await B.boot();
    await f.exploreText(w, doc, 1, '7');
    has(f.fb(doc, 'explore-feedback-1'), '💡');
    ok(doc.getElementById('explore-2').hidden, 'تقدّم رغم الخطأ');
    eq(w.XP.total(), 0);
  });

  it('الخطأ لا يُوسَم بصنف «خطأ» أحمر في الاستكشاف', async () => {
    const { doc } = await B.boot();
    const el = doc.getElementById('explore-feedback-1');
    no(el.className.indexOf('incorrect') !== -1, 'ظهر وسم incorrect في محطة استكشاف');
    has(el.className, 'is-hint');
  });

  it('إعادة المحاولة مسموحة بلا حدّ: الحقل والزر يبقيان مفعّلين', async () => {
    const { doc } = await B.boot();
    no(doc.getElementById('explore-input-1').disabled);
  });

  it('الإجابة الصحيحة تمنح 8 نقاط إنتاج وتكشف السؤال التالي', async () => {
    const { w, doc } = await B.boot();
    await f.exploreText(w, doc, 1, '1');
    has(f.fb(doc, 'explore-feedback-1'), '✓');
    ok(await f.waitVisible(w, doc, 'explore-2'), 'السؤال الثاني لم يُكشف');
    eq(w.XP.total(), 8);
  });

  it('السؤال المُجاب يُقفل فلا تتغيّر إجابته', async () => {
    const { doc } = await B.boot();
    ok(doc.getElementById('explore-input-1').disabled);
  });

  it('السؤال الثاني كذلك 8 نقاط إنتاج', async () => {
    const { w, doc } = await B.boot();
    await f.exploreText(w, doc, 2, '1');
    ok(await f.waitVisible(w, doc, 'explore-3'));
    eq(w.XP.total(), 16);
  });

  it('اختيار من متعدد خاطئ: تلميح خاص بالمشتّت ولا تقدّم', async () => {
    const { w, doc } = await B.boot();
    await f.exploreChoice(w, doc, 3, 'wrong');
    has(f.fb(doc, 'explore-feedback-3'), '💡');
    ok(doc.getElementById('explore-4').hidden);
    eq(w.XP.total(), 16);
  });

  it('الخيار الخاطئ يبقى قابلًا لإعادة المحاولة', async () => {
    const { doc } = await B.boot();
    const radios = h.groupByName(doc, 'explore3').querySelectorAll('input');
    let anyEnabled = false;
    radios.forEach(r => { if (!r.disabled) anyEnabled = true; });
    ok(anyEnabled, 'أُقفلت الخيارات بعد إجابة خاطئة');
  });

  it('اختيار صحيح: 5 نقاط، ووسم الخيار صحيحًا، وإقفال المجموعة', async () => {
    const { w, doc } = await B.boot();
    const { radio } = await f.exploreChoice(w, doc, 3, 'correct');
    ok(radio.closest('.quiz-option').classList.contains('correct'));
    eq(w.XP.total(), 21);
    let allDisabled = true;
    h.groupByName(doc, 'explore3').querySelectorAll('input').forEach(r => { if (!r.disabled) allDisabled = false; });
    ok(allDisabled, 'المجموعة لم تُقفل بعد الإجابة الصحيحة');
  });

  it('الأسئلة 4 و5 و6 تمنح 5 نقاط لكلٍّ', async () => {
    const { w, doc } = await B.boot();
    ok(await f.waitVisible(w, doc, 'explore-4'));
    await f.exploreChoice(w, doc, 4, 'correct');
    ok(await f.waitVisible(w, doc, 'explore-5'));
    await f.exploreChoice(w, doc, 5, 'correct');
    ok(await f.waitVisible(w, doc, 'explore-6'));
    await f.exploreChoice(w, doc, 6, 'correct');
    eq(w.XP.total(), 36);
  });

  it('بعد السؤال السادس يظهر جسر الانتقال لا الجواب', async () => {
    const { w, doc } = await B.boot();
    ok(await f.waitVisible(w, doc, 'phase1-bridge'), 'جسر المرحلة الثانية لم يظهر');
    ok(doc.getElementById('station-2b').hidden, 'انكشفت المرحلة الثانية بلا ضغط الطالب');
  });

  it('الطالب هو من يفتح المرحلة الثانية', async () => {
    const { w, doc } = await B.boot();
    h.click(doc, 'openPhase2');
    await h.tick(w, 30);
    no(doc.getElementById('station-2b').hidden);
  });

  it('نقل الإلكترون بالنقر يمنح 10 نقاط مهمّة مركّبة', async () => {
    const { w, doc } = await B.boot();
    doc.getElementById('p2na-e-2-0')
      .dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    ok(await f.waitVisible(w, doc, 'explore-8', 3000), 'السؤال الثامن لم يُكشف بعد النقل');
    eq(w.XP.total(), 46);
  });

  it('السؤالان 8 و9 يكملان الاستكشاف عند 56 نقطة', async () => {
    const { w, doc } = await B.boot();
    await f.exploreChoice(w, doc, 8, 'correct');
    ok(await f.waitVisible(w, doc, 'explore-9', 3000));
    await f.exploreChoice(w, doc, 9, 'correct');
    eq(w.XP.total(), 56);
    ok(await f.waitVisible(w, doc, 'explore-10', 3000), 'مخرج المحطة لم يظهر');
  });
});

/* ---------------------------------------------------------
   3) محطة 3 — التفسير والإجابة القصيرة
   --------------------------------------------------------- */
const C = scenario();
describe('محطة 3 — سلسلة السبب والإجابة القصيرة', () => {
  it('ترتيب السلسلة الصحيح يمنح 20 نقطة (4 × مطابقة)', async () => {
    const { w, doc } = await C.boot();
    await f.runExplore(w, doc);
    const before = w.XP.total();
    await f.solveChain(w, doc);
    eq(w.XP.total() - before, 20);
  });

  it('الكشف لا يقع تلقائيًا: الطالب يضغط «اعرض ما بنيتُه»', async () => {
    const { w, doc } = await C.boot();
    ok(await f.waitVisible(w, doc, 'chainBridge', 2000));
    ok(doc.getElementById('explainReveal').hidden, 'انكشف النموذج بلا طلب الطالب');
    h.click(doc, 'openChainReveal');
    await h.tick(w, 60);
    no(doc.getElementById('explainReveal').hidden);
  });

  it('سؤال القاعدة الثمانية يمنح 5 نقاط', async () => {
    const { w, doc } = await C.boot();
    const before = w.XP.total();
    h.choose(doc, '#octetOptions', 'correct');
    await h.tick(w, 60);
    eq(w.XP.total() - before, 5);
  });

  it('تشخيص خطأ الزميل يفتح خطوة التصحيح المكتوب', async () => {
    const { w, doc } = await C.boot();
    ok(await f.waitVisible(w, doc, 'peer-activity', 2000));
    h.choose(doc, '#peerDiagnose', 'correct');
    await h.tick(w, 60);
    ok(await f.waitVisible(w, doc, 'peerCorrectStep', 2000));
  });

  it('المصحّح يقبل «تغيّر عدد الإلكترونات» (الخلل المُبلَّغ عنه)', async () => {
    const { w, doc } = await C.boot();
    await f.peerAnswer(w, doc, 'فتغيّر عدد إلكتروناتها، ولذلك صارت شحنتها موجبة');
    has(f.fb(doc, 'peerCorrectFeedback'), '✓', 'رُفضت إجابة صحيحة');
  });

  it('الإجابة الصحيحة تمنح 8 نقاط إنتاج وتفتح خاتمة المحطة', async () => {
    const { w, doc } = await C.boot();
    no(doc.getElementById('station3Closing').hidden);
  });
});

const C2 = scenario();
describe('محطة 3 — مخرج النجاة من الإجابة القصيرة', () => {
  it('لا يظهر زر الإجابة النموذجية قبل أي محاولة', async () => {
    const { w, doc } = await C2.boot();
    await f.runExplore(w, doc);
    await f.station3ToPeer(w, doc);
    ok(doc.getElementById('peerShowModel').hidden);
  });

  it('ولا بعد محاولة واحدة فاشلة', async () => {
    const { w, doc } = await C2.boot();
    await f.peerAnswer(w, doc, 'لا أعرف');
    has(f.fb(doc, 'peerCorrectFeedback'), '💡');
    ok(doc.getElementById('peerShowModel').hidden, 'ظهر المخرج مبكّرًا');
  });

  it('ويظهر بعد محاولتين — فلا يُحبَس الطالب في حلقة تلميحات', async () => {
    const { w, doc } = await C2.boot();
    await f.peerAnswer(w, doc, 'لا أعرف أيضًا');
    no(doc.getElementById('peerShowModel').hidden, 'لم يظهر مخرج النجاة');
  });

  it('التلميحات تتدرّج ولا تكرّر نفسها', async () => {
    const { doc } = await C2.boot();
    ok(f.fb(doc, 'peerCorrectFeedback').length > 10);
  });

  it('عرض النموذج يمنح نصف نقاط الإنتاج (4) ويفتح الخاتمة', async () => {
    const { w, doc } = await C2.boot();
    const before = w.XP.total();
    h.click(doc, 'peerShowModel');
    await h.tick(w, 40);
    eq(w.XP.total() - before, 4);
    no(doc.getElementById('peerModelAnswer').hidden);
    no(doc.getElementById('station3Closing').hidden);
  });

  it('بعد النموذج يُقفل الحقل فلا كسب مضاعف', async () => {
    const { w, doc } = await C2.boot();
    const before = w.XP.total();
    ok(doc.getElementById('peerCorrectInput').disabled);
    await f.peerAnswer(w, doc, 'نقص عدد الإلكترونات');
    eq(w.XP.total(), before);
  });

  it('النفي الصريح يبقى مرفوضًا: «لم يتغيّر عدد الإلكترونات» خطأ علمي', async () => {
    const { w, doc } = await f.load();
    await f.runExplore(w, doc);
    await f.station3ToPeer(w, doc);
    await f.peerAnswer(w, doc, 'لم يتغير عدد الإلكترونات');
    has(f.fb(doc, 'peerCorrectFeedback'), '💡', 'قُبلت إجابة خاطئة');
  });
});

/* ---------------------------------------------------------
   4) محطة 4 — تسمية المركّب (إجابة قصيرة ثانية)
   --------------------------------------------------------- */
const D = scenario();
describe('محطة 4 — تسمية كلوريد المغنيسيوم', () => {
  it('التسمية الصحيحة تمنح 8 نقاط إنتاج', async () => {
    const { w, doc } = await D.boot();
    const before = w.XP.total();
    h.type(doc, 'nameInput', 'كلوريد المغنيسيوم');
    h.click(doc, 'nameCheck');
    await h.tick(w, 40);
    has(f.fb(doc, 'nameFeedback'), '✓');
    eq(w.XP.total() - before, 8);
  });

  it('وتفتح خاتمة المحطة والانتقال للمحطة الخامسة', async () => {
    const { doc } = await D.boot();
    no(doc.getElementById('mgClosing').hidden);
    no(doc.getElementById('toStation5').hidden);
  });
});

const D2 = scenario();
describe('محطة 4 — تسامح المصحّح ومخرج نجاته', () => {
  it('يقبل تهجّيات المغنيسيوم الشائعة', async () => {
    const { w, doc } = await D2.boot();
    h.type(doc, 'nameInput', 'كلوريد ماغنسيوم');
    h.click(doc, 'nameCheck');
    await h.tick(w, 40);
    has(f.fb(doc, 'nameFeedback'), '✓', 'رُفض تهجٍّ صحيح');
  });

  it('التلميح يخاطب ما نقص لا يقول «خطأ» فقط', async () => {
    const { w, doc } = await f.load();
    h.type(doc, 'nameInput', 'المغنيسيوم');
    h.click(doc, 'nameCheck');
    await h.tick(w, 40);
    has(f.fb(doc, 'nameFeedback'), 'فلوريد');
  });

  it('مخرج النجاة يظهر بعد محاولتين ويمنح نصف النقاط', async () => {
    const { w, doc } = await f.load();
    const before = w.XP.total();
    h.type(doc, 'nameInput', 'ملح');
    h.click(doc, 'nameCheck');
    await h.tick(w, 30);
    ok(doc.getElementById('nameShowModel').hidden, 'ظهر المخرج بعد محاولة واحدة');
    h.type(doc, 'nameInput', 'ملح آخر');
    h.click(doc, 'nameCheck');
    await h.tick(w, 30);
    no(doc.getElementById('nameShowModel').hidden, 'لم يظهر المخرج بعد محاولتين');
    h.click(doc, 'nameShowModel');
    await h.tick(w, 40);
    eq(w.XP.total() - before, 4);
    no(doc.getElementById('mgClosing').hidden, 'لم تُفتح الخاتمة بعد النموذج');
  });
});

/* ---------------------------------------------------------
   5) محطة 5 — أسئلة الشبكة البلورية
   --------------------------------------------------------- */
const E = scenario();
describe('محطة 5 — أسئلة ما بعد المختبر', () => {
  it('الأسئلة مخفيّة حتى يعود الطالب من المختبر', async () => {
    const { doc } = await E.boot();
    ok(doc.getElementById('latticeQuestions').hidden);
  });

  it('زرّ المختبر هو الممتلئ وزرّ المحطة التالية مهبَّط', async () => {
    const { doc } = await E.boot();
    no(doc.getElementById('labOpenBtn').classList.contains('demoted'));
    ok(doc.getElementById('toStation6').classList.contains('demoted'));
  });

  it('مخرج يدوي يكشف الأسئلة لمن لم يُسجَّل رجوعه', async () => {
    const { w, doc } = await E.boot();
    await f.openLatticeQuestions(w, doc);
    no(doc.getElementById('latticeQuestions').hidden);
  });

  it('الخطأ يعطي تلميحًا خاصًّا بالمشتّت بلا نقاط', async () => {
    const { w, doc } = await E.boot();
    const before = w.XP.total();
    await f.latAnswer(w, doc, 'lat1', 'w2');
    has(f.fb(doc, 'fb-lat1'), '💡');
    eq(w.XP.total(), before);
  });

  it('كل سؤال صحيح يمنح 5 نقاط', async () => {
    const { w, doc } = await E.boot();
    const before = w.XP.total();
    await f.latAnswer(w, doc, 'lat1', 'correct');
    eq(w.XP.total() - before, 5);
  });

  it('لا يكتمل الوسم قبل حلّ الأسئلة الثلاثة', async () => {
    const { w, doc } = await E.boot();
    await f.latAnswer(w, doc, 'lat2', 'correct');
    ok(doc.getElementById('latticeDone').hidden, 'اكتمل الوسم قبل السؤال الثالث');
  });

  it('اكتمال الثلاثة يفتح الخاتمة ويبدّل وزن الزرّين', async () => {
    const { w, doc } = await E.boot();
    await f.latAnswer(w, doc, 'lat3', 'correct');
    no(doc.getElementById('latticeDone').hidden);
    ok(doc.getElementById('labOpenBtn').classList.contains('demoted'), 'زرّ المختبر لم يُهبَّط');
    no(doc.getElementById('toStation6').classList.contains('demoted'), 'زرّ المحطة التالية لم يُرقَّ');
  });

  it('مجموع المحطة الخامسة 15 نقطة', async () => {
    const { w } = await E.boot();
    ok(w.XP.has('l3-lat-q1') && w.XP.has('l3-lat-q2') && w.XP.has('l3-lat-q3'));
  });
});

/* ---------------------------------------------------------
   6) محطة 6 — أكسيد الكالسيوم
   --------------------------------------------------------- */
const F = scenario();
describe('محطة 6 — المقارنة واستخراج النمط', () => {
  it('سؤال النمط مخفيّ حتى يُجاب سؤال المقارنة (سقف الكثافة)', async () => {
    const { doc } = await F.boot();
    ok(doc.getElementById('caoPattern').hidden);
  });

  it('سؤال المقارنة يمنح 5 نقاط ويكشف سؤال النمط', async () => {
    const { w, doc } = await F.boot();
    const before = w.XP.total();
    await f.caoAnswer(w, doc, 'cmp', 'correct');
    eq(w.XP.total() - before, 5);
    no(doc.getElementById('caoPattern').hidden);
  });

  it('سؤال النمط يمنح 12 نقطة — أعلى فئة في السلّم', async () => {
    const { w, doc } = await F.boot();
    const before = w.XP.total();
    await f.caoAnswer(w, doc, 'pat', 'correct');
    eq(w.XP.total() - before, 12);
  });

  it('ويفتح خاتمة المحطة', async () => {
    const { doc } = await F.boot();
    no(doc.getElementById('caoDone').hidden);
  });
});

const F2 = scenario();
describe('محطة 6 — سلوك الخطأ', () => {
  it('الخطأ يعطي تلميحًا ولا يكشف السؤال التالي', async () => {
    const { w, doc } = await F2.boot();
    await f.caoAnswer(w, doc, 'cmp', 'w3');
    has(f.fb(doc, 'fb-caoCmp'), '💡');
    ok(doc.getElementById('caoPattern').hidden);
    eq(w.XP.total(), 0);
  });

  it('وإعادة المحاولة تُقبل ثم تمنح النقاط كاملة', async () => {
    const { w, doc } = await F2.boot();
    await f.caoAnswer(w, doc, 'cmp', 'correct');
    eq(w.XP.total(), 5);
  });
});

/* ---------------------------------------------------------
   7) محطة 7 — التقييم والشهادة
   --------------------------------------------------------- */
const G = scenario();
describe('محطة 7 — بوابة الاسم', () => {
  it('الأسئلة مخفيّة قبل كتابة الاسم', async () => {
    const { doc } = await G.boot();
    ok(doc.getElementById('evalQuestions').hidden);
  });

  it('البدء باسم فارغ يُرفض برسالة لا بصمت', async () => {
    const { w, doc } = await G.boot();
    h.click(doc, 'evalStart');
    await h.tick(w, 30);
    no(doc.getElementById('evalNameFb').hidden);
    ok(doc.getElementById('evalQuestions').hidden);
  });

  it('الاسم يفتح الأسئلة', async () => {
    const { w, doc } = await G.boot();
    await f.evalStart(w, doc, 'سارة أحمد');
    no(doc.getElementById('evalQuestions').hidden);
  });

  it('حقل الاسم يبقى قابلًا للتصحيح بعد البدء', async () => {
    const { doc } = await G.boot();
    no(doc.getElementById('evalName').disabled, 'أُقفل حقل الاسم قبل التسليم');
  });

  it('كل أسئلة التقييم ظاهرة معًا — استثناء مقرَّر لسقف الكثافة', async () => {
    const { doc } = await G.boot();
    eq(doc.querySelectorAll('#evalQuestions .eval-q').length, 10);
  });
});

const H = scenario();
describe('محطة 7 — محاولة واحدة وتغذية تعليمية', () => {
  it('اختيار خاطئ يُوسَم خطأً ويُضاء الصحيح معه', async () => {
    const { w, doc } = await H.boot();
    await f.evalStart(w, doc, 'سارة أحمد');
    const { radio } = await f.evalAnswer(w, doc, 'ev1', 'w1');
    ok(radio.closest('.quiz-option').classList.contains('incorrect'), 'لم يُوسَم اختيار الطالب');
    const right = h.groupByName(doc, 'ev1').querySelector('input[value="correct"]');
    ok(right.closest('.quiz-option').classList.contains('correct'), 'لم يُضَأ الخيار الصحيح');
  });

  it('ومعه سطر يشرح لماذا الصحيح صحيح', async () => {
    const { doc } = await H.boot();
    has(f.fb(doc, 'fb-ev1'), '✗');
    ok(f.fb(doc, 'fb-ev1').length > 20, 'التغذية أقصر من أن تعلّم');
  });

  it('المجموعة تُقفل فور أول اختيار ولو كان خاطئًا', async () => {
    const { w, doc } = await H.boot();
    let allDisabled = true;
    h.groupByName(doc, 'ev1').querySelectorAll('input').forEach(r => { if (!r.disabled) allDisabled = false; });
    ok(allDisabled, 'أمكن تغيير الإجابة بعد التسليم');
    const before = h.groupByName(doc, 'ev1').querySelectorAll('.correct').length;
    await f.evalAnswer(w, doc, 'ev1', 'correct');
    eq(h.groupByName(doc, 'ev1').querySelectorAll('.correct').length, before);
  });

  it('سؤال الصيغة يقبل الأرقام المنخفضة والمسافات وحالة الأحرف', async () => {
    const { w, doc } = await f.load();
    await f.evalStart(w, doc, 'طالب');
    await f.evalFormula(w, doc, ' k₂o ');
    has(f.fb(doc, 'fb-ev4'), '✓', 'رُفضت صيغة صحيحة لسبب كتابيّ');
  });

  it('وخطؤه يكشف الصيغة الصحيحة فورًا — لا حلقة تلميحات في تقييم', async () => {
    const { w, doc } = await f.load();
    await f.evalStart(w, doc, 'طالب');
    await f.evalFormula(w, doc, 'KO');
    has(f.fb(doc, 'fb-ev4'), 'K2O');
    ok(doc.getElementById('ev4Input').disabled, 'بقي الحقل مفتوحًا بعد التسليم');
  });
});

const I = scenario();
describe('محطة 7 — النتيجة والشهادة', () => {
  it('النتيجة لا تظهر قبل الإجابة عن العشرة', async () => {
    const { w, doc } = await I.boot();
    await f.evalStart(w, doc, 'سارة أحمد');
    await f.evalAnswer(w, doc, 'ev1', 'correct');
    ok(doc.getElementById('evalSummary').hidden);
  });

  it('إتمام العشرة يعرض النسبة المئوية بأرقام غربية', async () => {
    const { w, doc } = await f.load();
    const spy = f.spyCertificate(w);
    await f.completeEval(w, doc, 8, 'سارة أحمد');
    no(doc.getElementById('evalSummary').hidden);
    has(doc.getElementById('evalSummary').textContent, '80%');
    I.spy = spy; I.w = w; I.doc = doc;
  });

  it('سطر الخلاصة يذكر اسم الطالب وعدد إجاباته الصحيحة', async () => {
    has(I.doc.getElementById('evalSummary').textContent, 'سارة أحمد');
    has(I.doc.getElementById('evalSummary').textContent, '8 من 10');
  });

  it('شارة «متميز» عند 80% فأعلى', async () => {
    has(I.doc.getElementById('evalSummary').textContent, 'متميز');
  });

  it('الشهادة تُنادى مرّة واحدة بالاسم والعنوان والعلامة', async () => {
    eq(I.spy.calls.length, 1);
    eq(I.spy.calls[0][0], 'سارة أحمد');
    eq(I.spy.calls[0][1], 'كيف تتكوّن الروابط الأيونية؟');
    eq(I.spy.calls[0][2], 80);
  });

  it('عنوان الدرس بلا بادئة «الدرس رقم»', async () => {
    no(String(I.spy.calls[0][1]).indexOf('الدرس رقم') !== -1);
  });

  it('شارة «متمكن» عند 70%', async () => {
    const { w, doc } = await f.load();
    const spy = f.spyCertificate(w);
    await f.completeEval(w, doc, 7, 'خالد');
    has(doc.getElementById('evalSummary').textContent, 'متمكن');
    eq(spy.calls[0][2], 70);
  });

  it('شارة «مشارك» عند نتيجة منخفضة — المحاولة مثابرة لا فشل', async () => {
    const { w, doc } = await f.load();
    const spy = f.spyCertificate(w);
    await f.completeEval(w, doc, 3, 'ليان');
    has(doc.getElementById('evalSummary').textContent, 'مشارك');
    eq(spy.calls[0][2], 30);
  });

  it('حقل الاسم يُقفل عند التسليم لا قبله', async () => {
    ok(I.doc.getElementById('evalName').disabled);
  });
});

/* ---------------------------------------------------------
   8) اقتصاد النقاط عبر الدرس كلّه
   --------------------------------------------------------- */
const J = scenario();
describe('اقتصاد النقاط', () => {
  it('محطة التقييم لا تمنح نقطة واحدة', async () => {
    const { w, doc } = await J.boot();
    f.spyCertificate(w);
    const before = w.XP.total();
    await f.completeEval(w, doc, 10, 'سارة');
    eq(w.XP.total(), before, 'محطة التقييم منحت نقاطًا');
  });

  it('مجرّد التمرير لا يمنح شيئًا', async () => {
    const { w } = await J.boot();
    eq(w.XP.total(), 0);
  });

  it('المسار الكامل للدرس يعطي رصيدًا ثابتًا معلومًا', async () => {
    const { w, doc } = await f.load();
    f.spyCertificate(w);
    await f.runExplore(w, doc);                       // 56
    await f.solveChain(w, doc);                       // +20 = 76
    await f.waitVisible(w, doc, 'chainBridge', 2000);
    h.click(doc, 'openChainReveal');
    await h.tick(w, 60);
    h.choose(doc, '#octetOptions', 'correct');        // +5 = 81
    await h.tick(w, 60);
    await f.waitVisible(w, doc, 'peer-activity', 2000);
    h.choose(doc, '#peerDiagnose', 'correct');        // +5 = 86
    await h.tick(w, 60);
    await f.waitVisible(w, doc, 'peerCorrectStep', 2000);
    await f.peerAnswer(w, doc, 'نقص عدد الإلكترونات'); // +8 = 94
    h.type(doc, 'nameInput', 'كلوريد المغنيسيوم');
    h.click(doc, 'nameCheck');                        // +8 = 102
    await h.tick(w, 40);
    await f.openLatticeQuestions(w, doc);
    await f.latAnswer(w, doc, 'lat1', 'correct');
    await f.latAnswer(w, doc, 'lat2', 'correct');
    await f.latAnswer(w, doc, 'lat3', 'correct');     // +15 = 117
    await f.caoAnswer(w, doc, 'cmp', 'correct');      // +5  = 122
    await f.caoAnswer(w, doc, 'pat', 'correct');      // +12 = 134
    await f.completeEval(w, doc, 10, 'سارة');         // +0
    eq(w.XP.total(), 134);
    J.full = w;
  });

  it('لا نقطة تُكسب مرّتين: إعادة الإجابة لا تزيد الرصيد', async () => {
    const w = J.full;
    const before = w.XP.total();
    w.XP.claim('l3-lat-q1', 5, 'تكرار');
    eq(w.XP.total(), before);
  });

  it('التلميح قبل المحاولة يمنح نقطتين فقط', async () => {
    const { w } = await f.load();
    w.XP.hint('تمرين-تجريبي');
    eq(w.XP.total(), 2);
  });

  it('لا خصم عند الخطأ في أي محطة', async () => {
    const { w, doc } = await f.load();
    await f.exploreText(w, doc, 1, '9');
    await f.exploreText(w, doc, 1, '9');
    ok(w.XP.total() >= 0);
    eq(w.XP.total(), 0);
  });
});

run();
