'use strict';
/* ==========================================================
   فحص عددي لمسارح الوحدة 02 · الدرس 02 — ما لا يكشفه اختبار المنطق
   ----------------------------------------------------------
   يتحقّق من عدد العناصر الهندسية وموضع خانات الإفلات بعد بنائها،
   لتُلتقط أي إغفال بصري لا يغطّيه اختبار السلوك وحده. الفحص
   بالعين يبقى ضروريًّا معه (§9.5 من ملف المعرفة) لا بديلًا عنه.
   ========================================================== */

const { describe, it, eq, ok, has, no, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-02/lesson-02.html';

async function page(){
  const s = await h.loadLesson(LESSON, { reduceMotion: true });
  s.w.Certificate = { finish: function(){} };
  return s;
}

function pct(str){ return parseFloat(String(str || '').replace('%', '')); }

describe('هندسة المحطة 2 — مسرح المقطع الطولي (تفاعلي)', function(){
  it('ثلاث مجموعات قابلة للنقر: القشرة والإسفنجي والنخاع', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#boneStage2 .hitgrp').length, 3);
    ['g-compact-2', 'g-spongy-2', 'g-marrow-2'].forEach(function(id){
      ok(doc.getElementById(id), 'مجموعة مفقودة: ' + id);
    });
  });

  it('القشرة الخارجية شكلان (طرف واحد وعمود)، والإسفنجي شبكة عُقَد متّصلة مقصوصة داخل الطرف', async function(){
    const { doc } = await page();
    eq(doc.getElementById('g-compact-2').querySelectorAll('rect').length, 2);
    eq(doc.getElementById('g-spongy-2').querySelectorAll('path.mesh').length, 26);
    eq(doc.getElementById('g-spongy-2').querySelectorAll('circle.node').length, 22);
    eq(doc.getElementById('g-spongy-2').querySelectorAll('g[clip-path]').length, 1);
  });

  it('عُقَد الشبكة وخيوطها بتدرّج أحمر/أصفر لا شاحب — بحدّ داكن خلفي يحفظ وضوحها فوق النخاع', async function(){
    const { doc } = await page();
    const grad = doc.getElementById('strutGrad2');
    ok(grad, 'تدرّج الشبكة مفقود');
    eq(grad.tagName.toLowerCase(), 'radialgradient');
    doc.querySelectorAll('#g-spongy-2 path.mesh').forEach(function(p){
      has(p.getAttribute('stroke') || '', 'strutGrad2');
    });
    eq(doc.getElementById('g-spongy-2').querySelectorAll('path.mesh-outline').length, 26,
      'حدّ داكن خلف كل خيط للحفاظ على تباينه فوق النخاع الأحمر');
  });

  it('خطوط الشبكة منحنية (Q — Bezier تربيعي) لا مستقيمة، بإحساس عضوي غير منتظم', async function(){
    const { doc } = await page();
    doc.querySelectorAll('#g-spongy-2 path.mesh').forEach(function(p){
      has(p.getAttribute('d') || '', 'Q');
    });
  });

  it('النخاع شكل واحد مستمرّ بتدرّج أفقي (لا فجوة كحليّة بينه وبين الإسفنجي)', async function(){
    const { doc } = await page();
    const grad = doc.getElementById('marrowGrad2');
    ok(grad, 'التدرّج مفقود');
    eq(grad.tagName.toLowerCase(), 'lineargradient');
    const marrowRects = doc.querySelectorAll('#g-marrow-2 .mrw');
    eq(marrowRects.length, 2, 'شكلان (الطرف والعمود) يشتركان التدرّج نفسه');
    // الطرف والعمود متلاصقان تمامًا (بلا فجوة) على محور x
    const xs = Array.from(marrowRects).map(function(r){ return parseFloat(r.getAttribute('x')); });
    const ws = Array.from(marrowRects).map(function(r){ return parseFloat(r.getAttribute('width')); });
    ok(xs[0] + ws[0] >= xs[1], 'فجوة بين الطرف والعمود');
  });

  it('عُصَيّات الإسفنجي مقصوصة داخل حدود التجويف بدقّة (clipPath) فلا تتجاوز القشرة الخارجية', async function(){
    const { doc } = await page();
    ok(doc.getElementById('clipLeftCav2'));
    const clips = doc.querySelectorAll('#g-spongy-2 g[clip-path]');
    eq(clips.length, 1);
  });

  it('ثلاثة خطوط ربط رفيعة من التسميات إلى مواضعها الدقيقة', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#boneStage2 .connector').length, 3);
  });

  it('كل خطّ ربط يلامس مركز بقعته بالضبط (لا فجوة بين نهاية الخطّ والبقعة)', async function(){
    const { doc } = await page();
    ['hs-compact', 'hs-spongy', 'hs-marrow'].forEach(function(id){
      var hs = doc.getElementById(id);
      var dot = hs.querySelector('.hotspot-dot');
      var hx = parseFloat(dot.getAttribute('cx'));
      var hy = parseFloat(dot.getAttribute('cy'));
      var connectors = doc.querySelectorAll('#boneStage2 .connector');
      var found = Array.from(connectors).some(function(line){
        var lx = parseFloat(line.getAttribute('x2'));
        var ly = parseFloat(line.getAttribute('y2'));
        return Math.abs(lx - hx) < 0.5 && Math.abs(ly - hy) < 0.5;
      });
      ok(found, 'لا خطّ ربط ينتهي عند مركز ' + id + ' بالضبط');
    });
  });

  it('كل مجموعة تفاعلية تحمل بقعة نابضة واحدة (ring+dot) بمُعرّف مطابق لاسمها', async function(){
    const { doc } = await page();
    ['hs-compact', 'hs-spongy', 'hs-marrow'].forEach(function(id){
      const hs = doc.getElementById(id);
      ok(hs, 'بقعة مفقودة: ' + id);
      eq(hs.querySelectorAll('.hotspot-ring').length, 1);
      eq(hs.querySelectorAll('.hotspot-dot').length, 1);
    });
  });

  it('لا حلقة تركيز افتراضية سوداء على مجموعات المسرح (outline:none في الحالة العادية)', async function(){
    const { raw } = await page();
    const seg = raw.slice(raw.indexOf('.bone-stage .grp{'), raw.indexOf('.bone-stage .grp{') + 120);
    has(seg, 'outline:none');
  });

  it('خانات الإفلات لا ترث الانتقال العام من .slot المشتركة — التوسيط فوريّ لا متحرّك عند كتابة النصّ', async function(){
    const { raw } = await page();
    const seg = raw.slice(raw.indexOf('.bone-slot{'), raw.indexOf('.bone-slot{') + 700);
    has(seg, 'transition:none', 'يجب إلغاء الانتقال الموروث كي لا يظهر توسيط متحرّك عند كتابة اسم الرقاقة');
  });

  it('خانات الإفلات الثلاث فوق المسرح بنسب مئوية، ولا تراكب بين أيّ اثنتين منها', async function(){
    const { doc } = await page();
    const slots = ['s2-slot-compact', 's2-slot-spongy', 's2-slot-marrow'].map(function(id){
      const el = doc.getElementById(id);
      return { id: id, left: pct(el.style.left), top: pct(el.style.top) };
    });
    slots.forEach(function(s){
      ok(s.left >= 0 && s.left <= 100, s.id + ': نسبة left خارج الحدود');
      ok(s.top >= 0 && s.top <= 100, s.id + ': نسبة top خارج الحدود');
    });
    // فحص فروق كافية بين كل زوج (لا نقطتان بفارق أقلّ من 8% على أيّ محور معًا)
    for(let i = 0; i < slots.length; i++){
      for(let j = i + 1; j < slots.length; j++){
        const dx = Math.abs(slots[i].left - slots[j].left);
        const dy = Math.abs(slots[i].top - slots[j].top);
        ok(dx > 8 || dy > 8, 'تقارب محتمل بين ' + slots[i].id + ' و' + slots[j].id);
      }
    }
  });

  it('الخانات الثلاث محجوبة قبل اكتمال الاستكشاف', async function(){
    const { doc } = await page();
    ['s2-slot-compact', 's2-slot-spongy', 's2-slot-marrow'].forEach(function(id){
      ok(doc.getElementById(id).hidden, id + ' يجب أن تكون محجوبة عند التحميل');
    });
  });
});

describe('هندسة المحطة 3 — النسخة الثانية المكبَّرة (بلا تفاعل)', function(){
  it('غلاف مسرح المحطة 3 له حجم أقصى مستقلّ (zoom) لا يمسّ حجم غلاف المحطة 2', async function(){
    const { doc } = await page();
    const wrap3 = doc.getElementById('boneStage3').closest('.bone-stage-wrap');
    ok(wrap3.classList.contains('zoom'), 'غلاف المحطة 3 يجب أن يحمل صنف الحجم المستقلّ');
    const wrap2 = doc.getElementById('boneStage2').closest('.bone-stage-wrap');
    no(wrap2.classList.contains('zoom'), 'غلاف المحطة 2 يجب ألّا يتأثّر بصنف حجم المحطة 3');
  });

  it('viewBox مختلف عن مسرح المحطة 2 (تكبير حقيقي لا تحويل CSS)', async function(){
    const { doc } = await page();
    const vb2 = doc.getElementById('boneStage2').getAttribute('viewBox');
    const vb3 = doc.getElementById('boneStage3').getAttribute('viewBox');
    ok(vb2 !== vb3, 'يجب أن يختلف viewBox بين النسختين');
    eq(vb3, '0 45 130 190');
  });

  it('لا طبقة نقر في مسرح المحطة 3 (عرض لا استكشاف)', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#boneStage3 .hitgrp').length, 0);
  });

  it('لا تحويل transform:scale على مسرح المحطة 3 أو غلافه', async function(){
    const { raw } = await page();
    const seg = raw.slice(raw.indexOf('id="boneStage3"') - 200, raw.indexOf('id="boneStage3"') + 2000);
    ok(!/transform\s*:\s*scale/.test(seg), 'التكبير يجب أن يكون بـviewBox لا بـtransform:scale');
  });

  it('عصيّات المحطة 3 بنفس تدرّج المحطة 2 وحدّها الداكن (اتّساق بصري بين النسختين)', async function(){
    const { doc } = await page();
    const grad = doc.getElementById('strutGrad3');
    ok(grad, 'تدرّج شبكة المحطة 3 مفقود');
    eq(doc.getElementById('g-spongy-3').querySelectorAll('path.mesh-outline').length, 26);
  });

  it('لا جزء من الساق (العمود) ظاهر في النسخة المكبَّرة — القشرة والنخاع محصوران بالطرف وحده', async function(){
    const { doc } = await page();
    eq(doc.getElementById('g-compact-3').querySelectorAll('rect').length, 1, 'يجب ألّا يبقى مقطع الساق المقصوص');
    eq(doc.getElementById('g-marrow-3').querySelectorAll('rect').length, 1);
    no(doc.getElementById('marrowGrad3'), 'لا حاجة لتدرّج بعد أن صار الطرف وحده مرئيًّا');
  });

  it('وسيلة إيضاح نصّية (Legend) تحمل أسماء الأجزاء الثلاثة كلّها الآن', async function(){
    const { doc } = await page();
    const legend = doc.querySelector('.bone-legend');
    ok(legend, 'وسيلة الإيضاح مفقودة');
    const txt = legend.textContent;
    ok(/العظم الكثيف/.test(txt) && /العظم الإسفنجي/.test(txt) && /نخاع العظم/.test(txt));
  });

  it('شبكة الإسفنجي في نسخة المحطة 3 مقصوصة أيضًا داخل حدود التجويف', async function(){
    const { doc } = await page();
    ok(doc.getElementById('clipLeftCav3'));
    eq(doc.getElementById('g-spongy-3').querySelectorAll('path.mesh').length, 26);
    eq(doc.getElementById('g-spongy-3').querySelectorAll('circle.node').length, 22);
  });

  it('شبكتا المحطتين 2 و3 متطابقتان هندسيًّا (نفس العُقَد) — اتّساق بصري بين النسختين', async function(){
    const { doc } = await page();
    const nodes2 = Array.from(doc.getElementById('g-spongy-2').querySelectorAll('circle.node'))
      .map(function(c){ return c.getAttribute('cx') + ',' + c.getAttribute('cy'); }).sort();
    const nodes3 = Array.from(doc.getElementById('g-spongy-3').querySelectorAll('circle.node'))
      .map(function(c){ return c.getAttribute('cx') + ',' + c.getAttribute('cy'); }).sort();
    eq(JSON.stringify(nodes2), JSON.stringify(nodes3));
  });
});

describe('هندسة المحطة 1 — كيس التبرّع', function(){
  it('الكيس يضمّ حاوية وسائلًا وغطاءً', async function(){
    const { doc } = await page();
    const bag = doc.querySelector('.bloodbag');
    eq(bag.querySelectorAll('.bag').length, 1);
    eq(bag.querySelectorAll('.liquid').length, 1);
    eq(bag.querySelectorAll('.cap').length, 1);
  });
});

describe('هندسة المحطة 4 — مسرح الحلقة المصغّر', function(){
  it('ثلاث خلايا (حمراء وبيضاء وصفيحة) بين سهمين', async function(){
    const { doc } = await page();
    const stage = doc.querySelector('.flow-stage');
    eq(stage.querySelectorAll('.cell-rbc').length, 1);
    eq(stage.querySelectorAll('.cell-wbc').length, 1);
    eq(stage.querySelectorAll('.cell-plt').length, 1);
    eq(stage.querySelectorAll('.flow-arrow').length, 2);
  });

  it('ثلاث تسميات نصّية تحت المراحل الثلاث', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('.flow-stage .flow-cap').length, 3);
  });

  it('تسمية المرحلة الأخيرة تصف اتجاه العملية الصحيح — لا توحي بأن الدم "عاد" من مكان آخر', async function(){
    const { doc } = await page();
    const caps = Array.from(doc.querySelectorAll('.flow-stage .flow-cap')).map(function(t){ return t.textContent; });
    no(caps.some(function(t){ return /يعود/.test(t); }), 'العبارة تناقض إنتاج خلايا جديدة');
    ok(caps.some(function(t){ return /مجرى الدم/.test(t); }), 'يجب أن تصف دخول الخلايا الجديدة مجرى الدم');
  });

  it('أيقونة نسيج دهني بلون النخاع الأصفر مرافقة لبطاقة حقيقته', async function(){
    const { doc } = await page();
    const wrap = doc.querySelector('#s4FactBox .fat-icon-wrap');
    ok(wrap, 'أيقونة النسيج الدهني مفقودة');
    eq(wrap.querySelectorAll('circle').length, 5);
  });

  it('خانتا التصنيف بسعتين مختلفتين: ثلاثة للأحمر وواحدة للأصفر', async function(){
    const { doc } = await page();
    const red = doc.getElementById('s4-slot-red');
    const yellow = doc.getElementById('s4-slot-yellow');
    eq(red.dataset.answer.split('|').length, 3);
    eq(yellow.dataset.answer.split('|').length, 1);
  });
});

describe('هندسة المحطة 5 — كأس الماء وشريطا الحجم/الكتلة', function(){
  it('حالتا الماء الصافي والعَكِر موجودتان معًا في الوسم منذ التحميل', async function(){
    const { doc } = await page();
    ok(doc.getElementById('waterClear'), 'حالة الماء الصافي مفقودة');
    ok(doc.getElementById('waterCloudy'), 'حالة الماء العَكِر مفقودة');
  });

  it('التبديل بين الحالتين بصنف CSS (opacity) لا بحذف/إضافة عناصر', async function(){
    const { doc, w } = await page();
    const stage = doc.getElementById('stageWater');
    ok(!stage.classList.contains('cloudy'));
    doc.querySelector('#s5PredictOptions input[value="a"]').click();
    h.click(doc, 's5RevealBtn');
    ok(stage.classList.contains('cloudy'));
    ok(doc.getElementById('waterClear'), 'العنصر يبقى في الوسم بعد التبديل');
    ok(doc.getElementById('waterCloudy'), 'العنصر يبقى في الوسم بعد التبديل');
  });

  it('شريطا الحجم والكتلة بنسبتَي 20% و80% بالضبط', async function(){
    const { doc } = await page();
    const fills = Array.from(doc.querySelectorAll('.density-fill')).map(function(e){ return pct(e.style.width); });
    eq(fills.length, 2);
    eq(fills[0], 20);
    eq(fills[1], 80);
  });

  it('لا تصادم بين تسميتَي الشريطين (نصّان مختلفان بوضوح)', async function(){
    const { doc } = await page();
    const labels = Array.from(doc.querySelectorAll('.density-label')).map(function(e){ return e.textContent.trim(); });
    eq(new Set(labels).size, 2);
  });
});

describe('هندسة المحطة 6 — التقييم', function(){
  it('عشرة أسئلة بالضبط: ثمانية اختيار من متعدّد وسؤالان نصّيان', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#evalQuestions .eval-q').length, 10);
    eq(doc.querySelectorAll('#evalQuestions .quiz-options[data-q]').length, 8);
    eq(doc.querySelectorAll('#evalQuestions input[type="text"]').length, 2);
  });

  it('صورة السؤال 8 داخل بطاقة بخلفية فاتحة (لا مربّع أبيض عائم على الكحلي)', async function(){
    const { doc } = await page();
    const card = doc.querySelector('.photo-card');
    ok(card, 'بطاقة الصورة مفقودة');
    eq(card.querySelectorAll('img').length, 1);
  });
});

run();
