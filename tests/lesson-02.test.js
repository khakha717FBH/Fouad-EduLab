'use strict';
/* ==========================================================
   درس 02 — فحص حصانة
   ----------------------------------------------------------
   درس 02 لا يربط template.js إطلاقًا (أنماطه ومحرّكاته داخلية،
   بقايا بنائه قبل البنية المشتركة). فهو محصَّن بنيويًا من أي
   ترقية في المشترك. هذه الاختبارات توثّق الحصانة وتكشف انكسارها
   لو تغيّر ذلك يومًا.
   ========================================================== */

const { describe, it, eq, ok, no, run } = require('./run');
const h = require('./harness');

const L2 = 'semester-1/unit-01/lesson-02.html';
let S = null;
async function boot() {
  if (!S) S = await h.loadLesson(L2);
  return S;
}

describe('درس 02 — حصانة من ترقية المشترك', () => {
  it('الصفحة تُحمّل بلا أخطاء', async () => {
    const { logs } = await boot();
    const errs = logs.filter(l => /jsdomError|error:/.test(l) && !/fonts|h5p|Lumi/i.test(l));
    eq(errs.length, 0, 'أخطاء: ' + errs.join(' | '));
  });

  it('لا يربط template.js — فلا يرث شيئًا من الترقية', async () => {
    const { w } = await boot();
    no(w.Quiz, 'الدرس صار يرث المحرّكات — الحصانة انكسرت والتوثيق لم يعد صحيحًا');
  });

  it('ولا شريط تقدّم فيه أصلًا (تفاوت مرصود لا خلل جديد)', async () => {
    const { doc } = await boot();
    eq(doc.querySelectorAll('.progress-dot').length, 0);
  });

  it('محطة التقييم فيه ما زالت تنادي الشهادة', async () => {
    const { raw } = await boot();
    ok(/Certificate\.finish/.test(raw), 'نداء الشهادة اختفى من درس 02');
  });
});

run();
