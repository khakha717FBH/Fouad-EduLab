'use strict';
/* ==========================================================
   اختبار انحدار على درس 01
   ----------------------------------------------------------
   درس 01 يربط template.js فيرث كل تغيير فيه. الغرض هنا واحد:
   التأكّد أن ترقية المحرّكات لم تمسّ درسًا لم يُهاجَر إليها.
   ========================================================== */

const { describe, it, eq, ok, no, run } = require('./run');
const h = require('./harness');

const L1 = 'semester-1/unit-01/lesson-01.html';
let S = null;
async function boot() {
  if (!S) S = await h.loadLesson(L1);
  return S;
}

describe('درس 01 — انحدار بعد ترقية template.js', () => {
  it('الصفحة تُحمّل بلا أي خطأ في شاشة المطوّر', async () => {
    const { logs } = await boot();
    const errs = logs.filter(l => /jsdomError|error:/.test(l) && !/h5p|Lumi|fonts/i.test(l));
    eq(errs.length, 0, 'أخطاء: ' + errs.join(' | '));
  });

  it('الوحدات المشتركة محمّلة', async () => {
    const { w } = await boot();
    ok(w.XP, 'xp.js');
    ok(w.Sounds, 'sounds.js');
  });

  it('محرّكات الأسئلة المشتركة متاحة للدرس ولو لم يستعملها', async () => {
    const { w } = await boot();
    ok(w.Quiz && w.Quiz.practice && w.Quiz.short && w.Quiz.evaluate);
  });

  it('خمس محطات وخمس نقاط تقدّم', async () => {
    const { doc } = await boot();
    eq(doc.querySelectorAll('.station').length, 5);
    eq(doc.querySelectorAll('.progress-dot').length, 5);
  });

  it('عدّاد المحطات يُحقن تلقائيًا ومقامه مشتقّ من النقاط', async () => {
    const { doc } = await boot();
    const track = doc.querySelector('.progress-track');
    ok(track && /من\s*5|5/.test(track.textContent), 'العدّاد لم يُحقن');
  });

  it('الرصيد يبدأ صفرًا: لا نقاط بالتمرير', async () => {
    const { w } = await boot();
    eq(w.XP.total(), 0);
  });

  it('محرّك تظليل الخيارات يعمل على أسئلة الدرس القديمة', async () => {
    const { w, doc } = await boot();
    const opt = doc.querySelector('#q1-options .quiz-option');
    opt.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    ok(opt.classList.contains('selected'));
  });

  it('محرّك السحب والإفلات ما زال يجهّز الشرائح', async () => {
    const { doc } = await boot();
    const chip = doc.querySelector('.chips-pool .chip');
    ok(chip, 'لا شرائح في الدرس');
    eq(chip.getAttribute('role'), 'button');
    eq(chip.getAttribute('tabindex'), '0');
  });

  it('تشخيص «أسئلة بلا تسجيل» لا يُطلق على درس لا يستعمل data-q', async () => {
    const { doc, logs } = await boot();
    eq(doc.querySelectorAll('.quiz-options[data-q]').length, 0);
    eq(logs.filter(l => /بلا تسجيل/.test(l)).length, 0);
  });

  it('لا نقاط تقدّم مرئية — سياسة المنصّة موروثة لا مكتوبة في الدرس', async () => {
    const { doc } = await boot();
    ok(doc.querySelectorAll('.progress-dot').length > 0, 'النقاط محذوفة من الوسم');
  });
});

run();
