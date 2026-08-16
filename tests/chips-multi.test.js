'use strict';
/* ==========================================================
   اختبارات توسعة محرّك الرقاقات — التصنيف متعدّد إلى واحد
   ----------------------------------------------------------
   تحمي ثلاثة وعود: خانة تسع أكثر من رقاقة ولا تُقفل قبل امتلائها ·
   النقاط بالرقاقة لا بالخانة · تلميح نصّي عند الوضع الخاطئ.
   ووعدًا رابعًا لا يقلّ أهمية: الخانة القديمة الطراز لم تتغيّر.

   الاختبار يمشي على مسار «انقر لتختار ثم انقر لتضع» — وهو المسار
   الكوني المتاح لكل طالب، لا مسار اختبار خاصّ.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const FIX = 'tests/fixtures/chips-multi.html';

async function page(opts) {
  return h.loadLesson(FIX, opts);
}

function chip(doc, value) {
  const c = doc.querySelector('.chip[data-value="' + value + '"]');
  if (!c) throw new Error('رقاقة غير موجودة: ' + value);
  return c;
}

function slot(doc, id) {
  const s = doc.getElementById(id);
  if (!s) throw new Error('خانة غير موجودة: ' + id);
  return s;
}

// مسار الطالب كاملًا: اختيار الرقاقة ثم النقر على الخانة
function put(doc, value, slotId) {
  h.selectChip(chip(doc, value));
  h.clickNode(slot(doc, slotId));
}

function items(doc, slotId) {
  return Array.from(slot(doc, slotId).querySelectorAll('.slot-item'))
    .map(n => n.textContent.trim());
}

function fbText(doc) {
  const fb = doc.querySelector('.chips-feedback');
  return fb && !fb.hidden ? fb.textContent.trim() : '';
}

/* ---------- السعة ---------- */
describe('خانة التصنيف — السعة', () => {
  it('الخانة تقبل رقاقة ثانية ولا تُقفل بعد الأولى', async () => {
    const { doc } = await page();
    put(doc, 'ألف', 'cat-1');
    const s = slot(doc, 'cat-1');
    no(s.classList.contains('correct'), 'أُقفلت الخانة قبل امتلائها');
    ok(s.classList.contains('partial'), 'لم تُوسَم الخانة كخانة بدأت تمتلئ');
    eq(items(doc, 'cat-1').length, 1);

    put(doc, 'باء', 'cat-1');
    ok(s.classList.contains('correct'), 'لم تُقفل الخانة عند امتلائها');
    no(s.classList.contains('partial'));
    eq(items(doc, 'cat-1').join('·'), 'ألف·باء');
  });

  it('عنوان الخانة يبقى ظاهرًا بعد امتلائها', async () => {
    const { doc } = await page();
    put(doc, 'ألف', 'cat-1');
    put(doc, 'باء', 'cat-1');
    has(slot(doc, 'cat-1').querySelector('.slot-label').textContent, 'الأولى');
  });

  it('خانة بقيمة واحدة تُقفل من أول رقاقة', async () => {
    const { doc } = await page();
    put(doc, 'هاء', 'cat-3');
    ok(slot(doc, 'cat-3').classList.contains('correct'));
  });

  it('الخانة الممتلئة لا تقبل رقاقة أخرى', async () => {
    const { doc } = await page();
    put(doc, 'هاء', 'cat-3');
    put(doc, 'ألف', 'cat-3');           // خانة مقفلة: لا شيء يقع
    eq(items(doc, 'cat-3').join('·'), 'هاء');
    no(chip(doc, 'ألف').classList.contains('placed'), 'رقاقة دخلت خانة مقفلة');
  });

  it('الرقاقة الموضوعة تختفي من المسبح ولا تُسحب ثانية', async () => {
    const { doc } = await page();
    put(doc, 'جيم', 'cat-2');
    const c = chip(doc, 'جيم');
    ok(c.classList.contains('placed'));
    eq(c.getAttribute('aria-hidden'), 'true');
    eq(c.getAttribute('tabindex'), null);
  });
});

/* ---------- الوضع الخاطئ والتلميح ---------- */
describe('خانة التصنيف — الخطأ يُلمَّح له لا يُهزّ فقط', () => {
  it('الرقاقة الخاطئة تعود ولا تُحسب', async () => {
    const { doc } = await page();
    put(doc, 'ألف', 'cat-2');
    eq(items(doc, 'cat-2').length, 0);
    no(chip(doc, 'ألف').classList.contains('placed'));
  });

  it('تلميح موجّه بحسب الخانة الخاطئة', async () => {
    const { doc } = await page();
    put(doc, 'ألف', 'cat-2');
    has(fbText(doc), 'ألف ليست هنا');
  });

  it('تلميح احتياطي بقيمة الرقاقة وحدها', async () => {
    const { doc } = await page();
    put(doc, 'جيم', 'cat-1');
    has(fbText(doc), 'تلميح عامّ لجيم');
  });

  it('لا تلميح مسجَّل = لا صندوق تغذية ظاهر', async () => {
    const { doc } = await page();
    put(doc, 'دال', 'cat-1');           // لا تلميح لدال
    eq(fbText(doc), '');
  });

  it('التلميح يزول بزوال سببه', async () => {
    const { doc } = await page();
    put(doc, 'ألف', 'cat-2');
    ok(fbText(doc), 'لم يظهر التلميح أصلًا');
    put(doc, 'ألف', 'cat-1');           // الوضع الصحيح
    eq(fbText(doc), '', 'بقي التلميح بعد التصحيح');
  });
});

/* ---------- النقاط ---------- */
describe('خانة التصنيف — النقاط بالرقاقة', () => {
  it('كل رقاقة تمنح 5 نقاط بمُعرّفها الخاصّ', async () => {
    const { w, doc } = await page();
    eq(w.XP.total(), 0);
    put(doc, 'ألف', 'cat-1');
    eq(w.XP.total(), 5);
    put(doc, 'باء', 'cat-1');
    eq(w.XP.total(), 10, 'الخانة الواحدة منحت مرّة واحدة لا مرّتين');
    ok(w.XP.has('c-alef'));
    ok(w.XP.has('c-baa'));
  });

  it('الوضع الخاطئ لا يمنح ولا يخصم', async () => {
    const { w, doc } = await page();
    put(doc, 'ألف', 'cat-2');
    eq(w.XP.total(), 0);
  });

  it('النشاط كاملًا = خمس رقاقات × 5', async () => {
    const { w, doc } = await page();
    [['ألف', 'cat-1'], ['باء', 'cat-1'], ['جيم', 'cat-2'],
     ['دال', 'cat-2'], ['هاء', 'cat-3']].forEach(p => put(doc, p[0], p[1]));
    eq(w.XP.total(), 25, 'خمس رقاقات × 5 = 25');
  });

  it('لا كسب مزدوج بعد إعادة تحميل الصفحة', async () => {
    const store = {};
    const first = await page({ storage: store });
    put(first.doc, 'ألف', 'cat-1');
    eq(first.w.XP.total(), 5);

    const again = await page({ storage: store });
    eq(again.w.XP.total(), 5, 'الرصيد لم يُستعَد كما هو');
    put(again.doc, 'ألف', 'cat-1');
    eq(again.w.XP.total(), 5, 'كُسبت النقطة مرّتين');
  });
});

/* ---------- الانحدار: الطراز القديم ---------- */
describe('خانة الطراز القديم — لم يتغيّر فيها شيء', () => {
  it('تُقفل من أول رقاقة ويحلّ نصّها محلّ محتواها', async () => {
    const { doc } = await page();
    put(doc, 'قديم', 'legacy');
    const s = slot(doc, 'legacy');
    ok(s.classList.contains('correct'));
    eq(s.textContent.trim(), 'قديم');
    eq(s.querySelectorAll('.slot-item').length, 0, 'حُقنت رقاقة في خانة بلا سلّة');
  });

  it('مُعرّف نقاطها من الخانة لا من الرقاقة', async () => {
    const { w, doc } = await page();
    put(doc, 'قديم', 'legacy');
    ok(w.XP.has('slot-legacy'), 'تغيّر مُعرّف الخانة القديمة');
    eq(w.XP.total(), 5);
  });

  it('خانة خارج [data-chips] لا تكسر التلميح', async () => {
    const { doc, logs } = await page();
    put(doc, 'قديم', 'cat-1');          // وضع خاطئ يستدعي البحث عن تغذية
    put(doc, 'ألف', 'legacy');          // وخطأ في الاتجاه المعاكس
    eq(logs.filter(l => /jsdomError/.test(l)).length, 0, 'خطأ JS عند البحث عن التغذية');
  });
});

/* ---------- التحميل ---------- */
describe('صفحة التصنيف — سلامة التحميل', () => {
  it('لا أخطاء JS عند التحميل', async () => {
    const { logs } = await page();
    eq(logs.filter(l => /jsdomError|error:/.test(l)).length, 0, logs.join(' | '));
  });

  it('Chips.hints متاحة قبل وجود أي رقاقة مسحوبة', async () => {
    const { w } = await page();
    eq(typeof w.Chips.hints, 'function');
  });
});

/* ---------- الاكتمال والتسعير بالنشاط ---------- */
describe('خانة التصنيف — نداء الاكتمال', () => {
  it('لا يُنادى قبل امتلاء كل الخانات', async () => {
    const { doc } = await page();
    put(doc, 'واو', 'bon-1');
    ok(doc.getElementById('bonusFlag').hidden, 'نُودي قبل الاكتمال');
  });

  it('يُنادى مرّة واحدة عند اكتمال النشاط', async () => {
    const { w, doc } = await page();
    put(doc, 'واو', 'bon-1');
    put(doc, 'زاي', 'bon-1');
    no(doc.getElementById('bonusFlag').hidden, 'لم يُنادَ عند الاكتمال');
    eq(w.XP.total(), 8, 'النقاط للنشاط ككلّ لا لرقاقاته');
  });

  it('رقاقة بمُعرّف none لا تمنح نقاطًا', async () => {
    const { w, doc } = await page();
    put(doc, 'واو', 'bon-1');
    eq(w.XP.total(), 0);
  });

  it('اكتمال نشاط لا يُطلق نداء نشاط آخر', async () => {
    const { doc } = await page();
    [['ألف', 'cat-1'], ['باء', 'cat-1'], ['جيم', 'cat-2'],
     ['دال', 'cat-2'], ['هاء', 'cat-3']].forEach(p => put(doc, p[0], p[1]));
    ok(doc.getElementById('bonusFlag').hidden);
  });
});

/* ==========================================================
   عتبة السحب — النقرة الثابتة لا تنتزع الرقاقة من المسبح
   ----------------------------------------------------------
   العلّة التي تحرسها: كان الضغط وحده يكفي لانتزاع الرقاقة إلى <body>
   وتثبيتها بـposition:fixed ووضع شبح مكانها، ثم يُلغى ذلك عند الرفع.
   فالنقرة الواحدة رحلة ذهاب وإياب يراها الطالب: الرقاقة تبدو "نازلة"
   عن مكانها قبل أن تُضيء (رصدها فؤاد بالعين، الوحدة 02 · درس 02).
   والاختبار يقيس ما يراه الطالب — أين تعيش الرقاقة لحظة الضغط —
   لا اسم متغيّر داخلي.
   ========================================================== */
describe('عتبة السحب — الضغط لا يرفع، الحركة ترفع', function(){
  function press(el, x, y){
    const W = el.ownerDocument.defaultView;
    const e = new W.MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y });
    el.dispatchEvent(e);
  }
  function move(el, x, y){
    const W = el.ownerDocument.defaultView;
    el.dispatchEvent(new W.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
  }
  function release(el, x, y){
    const W = el.ownerDocument.defaultView;
    el.dispatchEvent(new W.MouseEvent('pointerup', { bubbles: true, clientX: x, clientY: y }));
  }
  const inPool = c => !!(c.parentNode && c.parentNode.classList.contains('chips-pool'));

  it('الضغط وحده لا يُخرج الرقاقة من المسبح ولا يضع شبحًا مكانها', async () => {
    const { doc } = await page();
    const c = chip(doc, 'ألف');
    press(c, 100, 100);
    ok(inPool(c), 'الرقاقة غادرت المسبح بمجرّد الضغط');
    no(c.classList.contains('dragging'), 'وضع السحب بدأ قبل أي حركة');
    eq(doc.querySelectorAll('.chip-ghost').length, 0, 'شبحٌ وُضع لنقرة لم تصر سحبًا');
  });

  it('حركة أقلّ من العتبة لا ترفع — ارتجاف الإصبع ليس سحبًا', async () => {
    const { doc } = await page();
    const c = chip(doc, 'ألف');
    press(c, 100, 100);
    move(c, 103, 102);
    ok(inPool(c), 'ارتجافة صغيرة انتزعت الرقاقة');
    eq(doc.querySelectorAll('.chip-ghost').length, 0);
  });

  it('حركة تتجاوز العتبة ترفع الرقاقة ويحلّ الشبح مكانها', async () => {
    const { doc } = await page();
    const c = chip(doc, 'ألف');
    press(c, 100, 100);
    move(c, 140, 130);
    no(inPool(c), 'السحب لم يُخرج الرقاقة من المسبح');
    ok(c.classList.contains('dragging'), 'الرقاقة تُسحب بلا وضع سحب');
    eq(doc.querySelectorAll('.chip-ghost').length, 1, 'المسبح بلا حاجز فتزحف أخواتها');
  });

  it('النقرة الثابتة تختار الرقاقة كما كانت تفعل', async () => {
    const { doc } = await page();
    const c = chip(doc, 'ألف');
    press(c, 100, 100);
    release(c, 100, 100);
    ok(c.classList.contains('selected'), 'النقرة لم تعد تختار');
    ok(inPool(c), 'الرقاقة استقرّت خارج المسبح بعد نقرة');
  });

  it('والسحب إلى خانة صحيحة ما زال يضع الرقاقة', async () => {
    const { w, doc } = await page();
    const c = chip(doc, 'ألف');
    const target = slot(doc, 'cat-1');
    press(c, 100, 100);
    move(c, 160, 160);
    // slotFromPoint يعتمد elementFromPoint وهو غير مُنفَّذ في jsdom،
    // فيُحاكى بإرجاع الخانة المقصودة — المقيس هنا مسار الوضع لا القياس.
    doc.elementFromPoint = () => target;
    release(c, 160, 160);
    eq(items(doc, 'cat-1').length, 1, 'السحب لم يعد يضع الرقاقة');
    ok(w.XP.total() > 0, 'الوضع بالسحب لم يمنح نقاطًا');
  });

  it('إلغاء الضغط قبل الرفع لا يترك شبحًا ولا يزيح الرقاقة', async () => {
    const { doc } = await page();
    const c = chip(doc, 'ألف');
    const W = doc.defaultView;
    press(c, 100, 100);
    c.dispatchEvent(new W.MouseEvent('pointercancel', { bubbles: true }));
    ok(inPool(c), 'الإلغاء أزاح رقاقة لم تُنتزع أصلًا');
    eq(doc.querySelectorAll('.chip-ghost').length, 0);
    // وبعد الإلغاء يبقى المحرّك قابلًا لبدء تفاعل جديد
    press(c, 100, 100);
    release(c, 100, 100);
    ok(c.classList.contains('selected'), 'المحرّك عَلِق بعد الإلغاء');
  });
});

run();
