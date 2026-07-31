'use strict';
/* ==========================================================
   اختبارات محرّكات Quiz المشتركة — على صفحة فحص محايدة
   ----------------------------------------------------------
   هذه هي الاختبارات التي تحمي الدروس القادمة: درس 03 يثبت أن
   الترقية لم تكسر ما كان، وهذه تثبت أن المحرّك نفسه يتصرّف كما
   وُصف — وهو ما ستُبنى عليه الدروس 04 وما بعدها.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const FIX = 'tests/fixtures/quiz-engines.html';

async function page() {
  const s = await h.loadLesson(FIX);
  s.certCalls = [];
  s.w.Certificate = { finish: function () { s.certCalls.push([].slice.call(arguments)); } };
  return s;
}

/* ---------- التطبيع ---------- */
describe('Quiz — التطبيع العربي', () => {
  it('يوحّد الهمزات والألف المقصورة والتاء المربوطة', async () => {
    const { w } = await page();
    eq(w.Quiz.normalizeAr('إلكترون'), w.Quiz.normalizeAr('الكترون'));
    eq(w.Quiz.normalizeAr('ذرّة'), w.Quiz.normalizeAr('ذره'));
    eq(w.Quiz.normalizeAr('على'), w.Quiz.normalizeAr('علي'));
  });

  it('يحذف التشكيل والتطويل والترقيم ولا يمسّ «ال» التعريف', async () => {
    const { w } = await page();
    eq(w.Quiz.normalizeAr('الأيـــونُ، الموجب!'), 'الايون الموجب');
  });
});

describe('Quiz — تطبيع الصيغة الكيميائية', () => {
  it('يقبل الأرقام المنخفضة والمسافات وحالة الأحرف', async () => {
    const { w } = await page();
    eq(w.Quiz.normalizeFormula('K₂O'), 'k2o');
    eq(w.Quiz.normalizeFormula(' k 2 o '), 'k2o');
    eq(w.Quiz.normalizeFormula('K2O'), 'k2o');
  });

  it('ولا يخلط صيغتين مختلفتين', async () => {
    const { w } = await page();
    no(w.Quiz.normalizeFormula('K2O') === w.Quiz.normalizeFormula('KO2'));
  });
});

/* ---------- بانِي المصحّحات ---------- */
describe('Quiz — بانِي المصحّحات الوصفي', () => {
  it('يقبل حين يتحقّق عنصر من كل قائمة', async () => {
    const { w } = await page();
    const m = w.Quiz.matcher({ paths: [{ all: [['الكترون'], ['نقص', 'تغير']] }] });
    ok(m('نقص عدد الالكترونات'));
    ok(m('تغير عدد الالكترونات'));
  });

  it('ويرفض حين تنقص إحدى القائمتين', async () => {
    const { w } = await page();
    const m = w.Quiz.matcher({ paths: [{ all: [['الكترون'], ['نقص', 'تغير']] }] });
    no(m('نقص عدد البروتونات'));
    no(m('الالكترونات موجوده'));
  });

  it('يقبل بمسار بديل واحد يكفي', async () => {
    const { w } = await page();
    const m = w.Quiz.matcher({ paths: [
      { all: [['بروتون'], ['لم يتغير']] },
      { all: [['الكترون'], ['نقص']] }
    ] });
    ok(m('البروتون لم يتغير'));
    ok(m('نقص الالكترون'));
  });

  it('حارس النفي يفحص كلمات مستقلّة لا أجزاء كلمات', async () => {
    const { w } = await page();
    const m = w.Quiz.matcher({ paths: [
      { all: [['الكترون'], ['تغير']], rejectTokens: ['لم', 'لا'] }
    ] });
    ok(m('تغير عدد الالكترونات'), '«تغير» تحوي «غير» وليست نفيًا');
    no(m('لم يتغير عدد الالكترونات'), 'قُبل نفي صريح');
  });

  it('يقبل تعابير نمطية داخل القوائم', async () => {
    const { w } = await page();
    const m = w.Quiz.matcher({ paths: [{ all: [[/مغنيسيوم|ماغنسيوم/]] }] });
    ok(m('كلوريد ماغنسيوم'));
    no(m('كلوريد الصوديوم'));
  });
});

/* ---------- Quiz.practice ---------- */
const P = {};
describe('Quiz.practice — سلوك أسئلة التدريب', () => {
  it('الخطأ يعطي تلميح المشتّت نفسه بلا نقاط وبلا إقفال', async () => {
    const s = await page();
    P.s = s;
    P.solved = [];
    s.w.Quiz.practice({
      demo1: { xpId: 'demo-1', xp: 'MCQ', reason: 'سبب', hints: { w1: 'تلميح الأول', w2: 'تلميح الثاني' } },
      demo2: { xpId: 'demo-2', xp: 'PATTERN', reason: 'سبب', fb: 'custom-fb-2', hints: { any: 'تلميح عام' } }
    }, {
      onSolved: function (n) { P.solved.push(n); },
      onAllSolved: function () { P.all = true; }
    });
    h.choose(s.doc, 'demo1', 'w1');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'fb-demo1'), 'تلميح الأول');
    eq(s.w.XP.total(), 0);
    no(s.doc.querySelector('input[name="demo1"]').disabled, 'أُقفلت المجموعة بعد خطأ');
  });

  it('كل مشتّت يأخذ تلميحه لا تلميحًا واحدًا للجميع', async () => {
    const s = P.s;
    h.choose(s.doc, 'demo1', 'w2');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'fb-demo1'), 'تلميح الثاني');
  });

  it('الصواب يمنح نقاط الفئة ويُقفل المجموعة ويستدعي onSolved', async () => {
    const s = P.s;
    h.choose(s.doc, 'demo1', 'correct');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'fb-demo1'), '✓');
    eq(s.w.XP.total(), 5, 'نقاط MCQ');
    eq(P.solved[0], 'demo1');
    let allDisabled = true;
    s.doc.querySelectorAll('input[name="demo1"]').forEach(r => { if (!r.disabled) allDisabled = false; });
    ok(allDisabled);
  });

  it('الفئة تُقرأ من سلّم XP لا من رقم مكتوب', async () => {
    const s = P.s;
    h.choose(s.doc, 'demo2', 'correct');
    await h.tick(s.w, 20);
    eq(s.w.XP.total(), 17, '5 + 12 (PATTERN)');
  });

  it('مُعرّف تغذية مخالف للاصطلاح يُحترم عبر fb', async () => {
    const s = P.s;
    has(h.text(s.doc, 'custom-fb-2'), '✓');
  });

  it('onAllSolved يُستدعى مرّة واحدة بعد آخر سؤال', async () => {
    ok(P.all, 'لم يُستدعَ onAllSolved');
    eq(P.solved.length, 2);
  });

  it('التكرار لا يضاعف النقاط', async () => {
    const s = P.s;
    const before = s.w.XP.total();
    h.choose(s.doc, 'demo2', 'correct');
    await h.tick(s.w, 20);
    eq(s.w.XP.total(), before);
  });

  it('سؤال في الوسم بلا تسجيل يُبلَّغ عنه في شاشة المطوّر', async () => {
    const s = P.s;
    ok(s.logs.some(l => /بلا تسجيل/.test(l) && /orphan/.test(l)), 'لم يُبلَّغ عن السؤال غير المسجَّل');
  });
});

/* ---------- Quiz.short ---------- */
const SH = {};
function mountShort(s, extra) {
  const cfg = Object.assign({
    input: 'shortInput', button: 'shortBtn', feedback: 'shortFb',
    modelBtn: 'shortModelBtn', model: 'shortModel',
    accept: { paths: [{ all: [['الكترون'], ['نقص', 'تغير']], rejectTokens: ['لم', 'لا'] }] },
    hints: ['تلميح أول', 'تلميح ثانٍ'],
    modelText: 'الإجابة النموذجية',
    xpId: 'short-1', xp: 'PRODUCE', reason: 'سبب',
    onDone: function (viaModel) { SH.done = true; SH.viaModel = viaModel; }
  }, extra || {});
  s.w.Quiz.short(cfg);
}

describe('Quiz.short — الإجابة القصيرة', () => {
  it('الحقل الفارغ لا يُقابَل بصمت', async () => {
    const s = await page();
    SH.s = s;
    mountShort(s);
    h.click(s.doc, 'shortBtn');
    await h.tick(s.w, 20);
    no(s.doc.getElementById('shortFb').hidden);
  });

  it('محاولة خاطئة أولى: تلميح، ولا مخرج نجاة بعد', async () => {
    const s = SH.s;
    h.type(s.doc, 'shortInput', 'لا أعرف');
    h.click(s.doc, 'shortBtn');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'shortFb'), 'تلميح أول');
    ok(s.doc.getElementById('shortModelBtn').hidden, 'ظهر المخرج مبكّرًا');
  });

  it('محاولة ثانية: تلميح مختلف ويظهر مخرج النجاة', async () => {
    const s = SH.s;
    h.type(s.doc, 'shortInput', 'لا أعرف أيضًا');
    h.click(s.doc, 'shortBtn');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'shortFb'), 'تلميح ثانٍ');
    no(s.doc.getElementById('shortModelBtn').hidden, 'لم يظهر مخرج النجاة');
  });

  it('عرض النموذج يمنح نصف النقاط ويُقفل الحقل ويستدعي onDone', async () => {
    const s = SH.s;
    h.click(s.doc, 'shortModelBtn');
    await h.tick(s.w, 20);
    eq(s.w.XP.total(), 4, 'نصف نقاط الإنتاج');
    has(h.text(s.doc, 'shortModel'), 'الإجابة النموذجية');
    ok(s.doc.getElementById('shortInput').disabled);
    ok(SH.done);
    eq(SH.viaModel, true);
  });

  it('الإجابة الصحيحة تمنح النقاط كاملة', async () => {
    const s = await page();
    SH.done = false;
    mountShort(s);
    h.type(s.doc, 'shortInput', 'تغير عدد الإلكترونات');
    h.click(s.doc, 'shortBtn');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'shortFb'), '✓');
    eq(s.w.XP.total(), 8);
    eq(SH.viaModel, false);
  });

  it('النفي الصريح يبقى مرفوضًا', async () => {
    const s = await page();
    mountShort(s);
    h.type(s.doc, 'shortInput', 'لم يتغير عدد الإلكترونات');
    h.click(s.doc, 'shortBtn');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'shortFb'), '💡');
    eq(s.w.XP.total(), 0);
  });

  it('Enter يعمل عمل زرّ التحقّق', async () => {
    const s = await page();
    mountShort(s);
    const input = h.type(s.doc, 'shortInput', 'نقص عدد الإلكترونات');
    input.dispatchEvent(new s.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await h.tick(s.w, 20);
    eq(s.w.XP.total(), 8);
  });

  it('إجابة قصيرة بلا مخرج نجاة تُبلَّغ كخرق لقاعدة المنصّة', async () => {
    const s = await page();
    s.w.Quiz.short({
      input: 'badInput', button: 'badBtn', feedback: 'badFb',
      accept: function () { return true; },
      xpId: 'bad-1'
    });
    ok(s.logs.some(l => /بلا مخرج نجاة/.test(l)), 'مرّ خرق القاعدة بلا تحذير');
  });
});

/* ---------- Quiz.evaluate ---------- */
const EV = {};
function mountEval(s, extra) {
  s.w.Quiz.evaluate(Object.assign({
    title: 'درس تجريبي',
    questions: [
      { name: 'q1', why: 'سبب الأول' },
      { name: 'q2', why: 'سبب الثاني' },
      { name: 'q3', type: 'text', input: 'q3Input', button: 'q3Btn', feedback: 'fb-q3',
        answer: 'K2O', why: 'الإجابة الصحيحة: K2O' },
      { name: 'q4', why: 'سبب الرابع' }
    ]
  }, extra || {}));
}

describe('Quiz.evaluate — بوابة الاسم', () => {
  it('الأسئلة مخفيّة قبل الاسم، والبدء الفارغ يُرفض برسالة', async () => {
    const s = await page();
    EV.s = s;
    mountEval(s);
    ok(s.doc.getElementById('evalQuestions').hidden);
    h.click(s.doc, 'evalStart');
    await h.tick(s.w, 20);
    ok(s.doc.getElementById('evalQuestions').hidden);
    no(s.doc.getElementById('evalNameFb').hidden);
  });

  it('الاسم يفتح الأسئلة ويبقى الحقل قابلًا للتصحيح', async () => {
    const s = EV.s;
    h.type(s.doc, 'evalName', 'طالب');
    h.click(s.doc, 'evalStart');
    await h.tick(s.w, 20);
    no(s.doc.getElementById('evalQuestions').hidden);
    no(s.doc.getElementById('evalName').disabled);
  });
});

describe('Quiz.evaluate — المحاولة الواحدة', () => {
  it('الخطأ يُوسَم ويُضاء الصحيح معه ومعهما سبب', async () => {
    const s = EV.s;
    const { radio } = h.choose(s.doc, 'q1', 'w1');
    await h.tick(s.w, 20);
    ok(radio.closest('.quiz-option').classList.contains('incorrect'));
    ok(h.groupByName(s.doc, 'q1').querySelector('input[value="correct"]')
        .closest('.quiz-option').classList.contains('correct'));
    has(h.text(s.doc, 'fb-q1'), 'سبب الأول');
  });

  it('الإقفال يقع فور أول اختيار لا فور الصواب', async () => {
    const s = EV.s;
    let allDisabled = true;
    h.groupByName(s.doc, 'q1').querySelectorAll('input').forEach(r => { if (!r.disabled) allDisabled = false; });
    ok(allDisabled);
  });

  it('لا نقاط XP في محطة التقييم إطلاقًا', async () => {
    const s = EV.s;
    h.choose(s.doc, 'q2', 'correct');
    await h.tick(s.w, 20);
    eq(s.w.XP.total(), 0);
  });

  it('السؤال المكتوب يتسامح كتابيًا ويُقفل بعد محاولة واحدة', async () => {
    const s = EV.s;
    h.type(s.doc, 'q3Input', ' k₂o ');
    h.click(s.doc, 'q3Btn');
    await h.tick(s.w, 20);
    has(h.text(s.doc, 'fb-q3'), '✓');
    ok(s.doc.getElementById('q3Input').disabled);
  });

  it('النتيجة لا تظهر قبل آخر سؤال', async () => {
    const s = EV.s;
    ok(s.doc.getElementById('evalSummary').hidden);
  });

  it('آخر سؤال يُنهي التقييم ويعرض النسبة والشارة', async () => {
    const s = EV.s;
    h.choose(s.doc, 'q4', 'correct');
    await h.tick(s.w, 40);
    no(s.doc.getElementById('evalSummary').hidden);
    has(s.doc.getElementById('evalSummary').textContent, '75%');
    has(s.doc.getElementById('evalSummary').textContent, 'متمكن');
  });

  it('الشهادة تُنادى تلقائيًا: لا يمكن بناء تقييم بلا شهادة', async () => {
    const s = EV.s;
    eq(s.certCalls.length, 1);
    eq(s.certCalls[0][0], 'طالب');
    eq(s.certCalls[0][1], 'درس تجريبي');
    eq(s.certCalls[0][2], 75);
  });

  it('حقل الاسم يُقفل عند التسليم', async () => {
    ok(EV.s.doc.getElementById('evalName').disabled);
  });

  it('سلّم الشارات: متميز عند 100%', async () => {
    const s = await page();
    mountEval(s);
    h.type(s.doc, 'evalName', 'ليان');
    h.click(s.doc, 'evalStart');
    await h.tick(s.w, 20);
    ['q1', 'q2', 'q4'].forEach(n => h.choose(s.doc, n, 'correct'));
    h.type(s.doc, 'q3Input', 'K2O');
    h.click(s.doc, 'q3Btn');
    await h.tick(s.w, 40);
    has(s.doc.getElementById('evalSummary').textContent, 'متميز');
    eq(s.certCalls[0][2], 100);
  });

  it('وشارة مشارك عند صفر — والمحاولة تُصوَّر مثابرة', async () => {
    const s = await page();
    mountEval(s);
    h.type(s.doc, 'evalName', 'خالد');
    h.click(s.doc, 'evalStart');
    await h.tick(s.w, 20);
    ['q1', 'q2', 'q4'].forEach(n => h.choose(s.doc, n, 'w1'));
    h.type(s.doc, 'q3Input', 'XY');
    h.click(s.doc, 'q3Btn');
    await h.tick(s.w, 40);
    has(s.doc.getElementById('evalSummary').textContent, 'مشارك');
    eq(s.certCalls[0][2], 0);
  });

  it('التقييم لا يُنهى مرّتين ولو أُعيد النقر', async () => {
    const s = EV.s;
    h.choose(s.doc, 'q4', 'correct');
    await h.tick(s.w, 30);
    eq(s.certCalls.length, 1);
  });
});

run();
