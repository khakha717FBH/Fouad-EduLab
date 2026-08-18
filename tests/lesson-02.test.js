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

/* ==========================================================
   حارس تقليل الحركة — بند وصول (UDL)
   ----------------------------------------------------------
   قاعدة CSS الشاملة في الدرس تُبطل الحركات، لكنّ أمر
   scrollIntoView الصريح بـ'smooth' يتجاوزها. فكل تمرير يبدأه
   كود الدرس يجب أن يقرأ التفضيل قبل أن يقرّر.
   والفحص على الأثر لا على اسم الدالّة: أي أمر تمرير بلا فحص
   يُسقط الحارس، سمّيت الدالّة goTo أو غيره.
   ========================================================== */
describe('درس 02 — حارس تقليل الحركة', () => {
  it('لا أمر تمرير يفرض الانزلاق بلا فحص التفضيل', async () => {
    const { raw } = await boot();
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, ' ');
    const calls = src.match(/scrollIntoView\s*\(\s*\{[^}]*\}\s*\)/g) || [];
    ok(calls.length > 0, 'اختفت أوامر التمرير من الدرس — تغيّرت بنيته');
    calls.forEach(function (c) {
      if (!/smooth/.test(c)) return;            // انزلاق غير مطلوب أصلًا
      ok(/\?|prefersReducedMotion|reduced/.test(c),
        'أمر تمرير يفرض الانزلاق بلا فحص تقليل الحركة: ' + c);
    });
  });

  it('أزرار شريط التقدّم التسعة تمرّ كلّها عبر المسار المحروس', async () => {
    const { doc } = await boot();
    const segs = Array.from(doc.querySelectorAll('.stepper .step-seg'));
    eq(segs.length, 9, 'عدد شرائح شريط التقدّم تغيّر');
    segs.forEach(function (b) {
      const on = b.getAttribute('onclick') || '';
      no(/scrollIntoView/.test(on),
        'شريحة تمرّر مباشرةً بدل المسار المحروس: ' + on);
    });
  });

  it('الفحص يقرأ التفضيل من النظام فعلًا لا يفترضه', async () => {
    const { raw } = await boot();
    ok(/matchMedia\s*\(\s*['"]\(prefers-reduced-motion:\s*reduce\)['"]\s*\)/.test(raw),
      'الدرس لا يقرأ تفضيل تقليل الحركة من النظام');
  });
});

run();
