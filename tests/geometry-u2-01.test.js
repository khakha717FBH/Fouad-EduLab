'use strict';
/* ==========================================================
   فحص عددي لمسارح الوحدة 02 · الدرس 01 — ما لا يكشفه اختبار المنطق
   ----------------------------------------------------------
   يتحقّق من عدد العناصر الهندسية في كل مسرح SVG بعد بنائه، لتُلتقط
   أي إغفال بصري لا يغطّيه اختبار السلوك وحده. الفحص بالعين يبقى
   ضروريًّا معه (§9.5 من ملف المعرفة) لا بديلًا عنه.
   ========================================================== */

const { describe, it, eq, ok, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-02/lesson-01.html';

async function page(){
  const s = await h.loadLesson(LESSON, { reduceMotion: true });
  s.w.Certificate = { finish: function(){} };
  return s;
}

describe('هندسة المحطة 1 — مسرح القنديل (حالتان ثابتتان)', function(){
  it('حالتا الماء والرمل موجودتان معًا في الوسم منذ التحميل (تلاشٍ متبادل لا تحويل مشوِّه)', async function(){
    const { doc } = await page();
    ok(doc.getElementById('jellyWater'), 'حالة الماء مفقودة');
    ok(doc.getElementById('jellySand'), 'حالة الرمل مفقودة');
  });

  it('جرس الماء وأذرعه الأربعة أعلى خطّ الرمل (y=170) بمسافة واضحة', async function(){
    const { doc } = await page();
    const water = doc.getElementById('jellyWater');
    const nums = [];
    water.querySelectorAll('path').forEach(function(p){
      (p.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).forEach(function(n){ nums.push(parseFloat(n)); });
    });
    // كل الإحداثيات الرأسية (المواضع الزوجية من زوج x,y) يجب أن تبقى دون 170 بهامش معقول
    eq(water.querySelectorAll('path').length, 5, 'جرس واحد + أربع أذرع');
  });

  it('جرس الرمل قطع ناقص واحد، وأربعة خطوط ملتفّة مسطّحة', async function(){
    const { doc } = await page();
    const sand = doc.getElementById('jellySand');
    eq(sand.querySelectorAll('ellipse').length, 1);
    eq(sand.querySelectorAll('path').length, 4);
  });
});

describe('هندسة المحطة 2 — مسرح استكشاف الهيكل', function(){
  it('ستّ مجموعات عظام قابلة للنقر (hitgrp)، وستّ نقاط تشريح بادئتها -2', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#skeleton2 .hitgrp').length, 6);
    ['g-skull-2', 'g-spine-2', 'g-ribs-2', 'g-humerus-2', 'g-pelvis-2', 'g-femur-2'].forEach(function(id){
      ok(doc.getElementById(id), 'مجموعة مفقودة: ' + id);
    });
  });

  it('العمود الفقري يُبنى بفقرات متعدّدة، والضلوع بسبعة أقواس على كل جانب', async function(){
    const { doc } = await page();
    ok(doc.querySelectorAll('#verts-2 rect').length > 10, 'فقرات العمود الفقري قليلة جدًّا');
    eq(doc.querySelectorAll('#ribsL-2 path').length, 7);
    eq(doc.querySelectorAll('#ribsR-2 path').length, 7);
  });

  it('ستّ خانات مطابقة في نشاط الرقاقات، وستّ رقاقات بالضبط', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('[data-chips="u2l1-bones"] .cat-slot').length, 6);
    eq(doc.querySelectorAll('[data-chips="u2l1-bones"] .chip').length, 6);
  });

  it('لا طبقة أعضاء في مسرح المحطة 2 (الكشف مؤجَّل إلى المحطة 3)', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#skeleton2 .sk-organs').length, 0);
  });
});

describe('هندسة المحطة 3 — مسرح الحماية والكشف', function(){
  it('ثلاثة أعضاء في طبقة الكشف: الدماغ والرئتان والقلب', async function(){
    const { doc } = await page();
    const organs = doc.querySelectorAll('#organs-3 > path');
    eq(organs.length, 5, 'الدماغ (مساران: الشكل والتفاصيل) + رئتان + قلب = 5');
  });

  it('لا طبقة نقر في مسرح المحطة 3 (عرض لا استكشاف)', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#skeleton3 .hitgrp').length, 0);
  });

  it('العمود الفقري والضلوع مبنيّان بنفس هندسة المحطة 2', async function(){
    const { doc } = await page();
    ok(doc.querySelectorAll('#verts-3 rect').length > 10);
    eq(doc.querySelectorAll('#ribsL-3 path').length, 7);
  });
});

describe('هندسة المحطة 4 — الصورة الظلّية وعمودا القوّة', function(){
  it('صورة الإنسان الظلّية تضمّ الرأس والجذع والذراعين والساقين', async function(){
    const { doc } = await page();
    const body = doc.getElementById('humanBody');
    ok(body.querySelector('circle'), 'الرأس مفقود');
    eq(body.querySelectorAll('rect').length, 4, 'ذراعان وساقان');
  });

  it('شكل الكومة المنهارة موجود في الوسم منذ التحميل (تلاشٍ متبادل لا حذف/إضافة)', async function(){
    const { doc } = await page();
    const collapsed = doc.getElementById('bodyCollapsed');
    ok(collapsed, 'شكل الكومة المنهارة مفقود');
    eq(collapsed.tagName.toLowerCase(), 'path');
  });

  it('عمودا القوّة يبدآن بلا حمل، ويتراكم عليهما حمل بمقدار الحمل المضاف', async function(){
    const { doc } = await page();
    eq(doc.getElementById('boneStack').children.length, 0);
    eq(doc.getElementById('steelStack').children.length, 0);
    h.click(doc, 'strengthLoadBtn');
    eq(doc.getElementById('boneStack').children.length, 1);
    eq(doc.getElementById('steelStack').children.length, 1);
  });

  it('عمود العظم أعرض من عمود الفولاذ (الكتلة نفسها، كثافة أقل)', async function(){
    const { doc } = await page();
    const boneW = parseFloat(doc.getElementById('boneCol').getAttribute('width'));
    const steelW = parseFloat(doc.getElementById('steelCol').getAttribute('width'));
    ok(boneW > steelW, 'عمود العظم يجب أن يكون أعرض تعبيرًا عن كثافته الأقلّ بالكتلة نفسها');
  });
});

describe('هندسة المحطة 5 — أيقونات العظام', function(){
  it('أربع بطاقات أيقونة، واحدة لكل عظمة', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('.bone-icon-card').length, 4);
  });

  it('كل بطاقة أيقونة تضمّ SVG واحدًا ونصًّا واحدًا', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.bone-icon-card').forEach(function(card){
      eq(card.querySelectorAll('svg').length, 1);
      eq(card.querySelectorAll('span').length, 1);
    });
  });

  it('ثماني خانات مطابقة إجمالًا (أربع شكل + أربع وظيفة)، وثماني رقاقات', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('[data-chips="u2l1-shape"] .cat-slot').length, 4);
    eq(doc.querySelectorAll('[data-chips="u2l1-function"] .cat-slot').length, 4);
    eq(doc.querySelectorAll('[data-chips="u2l1-shape"] .chip').length, 4);
    eq(doc.querySelectorAll('[data-chips="u2l1-function"] .chip').length, 4);
  });
});

describe('هندسة المحطة 6 — التقييم', function(){
  it('عشرة أسئلة بالضبط: ثمانية اختيار من متعدّد وسؤالان نصّيان', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#evalQuestions .eval-q').length, 10);
    eq(doc.querySelectorAll('#evalQuestions .quiz-options[data-q]').length, 8);
    eq(doc.querySelectorAll('#evalQuestions input[type="text"]').length, 2);
  });
});

run();
