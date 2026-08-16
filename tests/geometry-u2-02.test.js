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

  it('القشرة الخارجية مسارٌ واحد مغلق (رأس + ساق + رأس أصغر) لا شكلان ملصوقان بدرز ظاهر', async function(){
    const { doc } = await page();
    const g = doc.getElementById('g-compact-2');
    eq(g.querySelectorAll('rect').length, 0, 'لم يعد الكفاف مستطيلات');
    const paths = g.querySelectorAll('path.f');
    eq(paths.length, 1, 'كفاف واحد لا أكثر — تعدّده هو ما يُنتج الدرز');
    const d = paths[0].getAttribute('d');
    has(d, 'Z', 'المسار يجب أن يكون مغلقًا');
    eq((d.match(/M/g) || []).length, 1, 'مسار فرعي واحد فقط');
  });

  it('العظم له طرفان لا طرف واحد — والثاني أصغر (النصّ يقول «وفي طرفيه»)', async function(){
    const { doc } = await page();
    ok(doc.getElementById('clipLeftCav2'), 'حدّ قصّ الطرف الأول مفقود');
    ok(doc.getElementById('clipRightCav2'), 'حدّ قصّ الطرف الثاني مفقود');
    const g = doc.getElementById('g-spongy-2');
    eq(g.querySelectorAll('g[clip-path]').length, 2, 'شبكة إسفنجية في كلا الطرفين');
    // مقارنة ارتفاع منطقتَي القصّ: الطرف الثاني أصغر
    function span(id){
      const d = doc.getElementById(id).querySelector('path').getAttribute('d');
      const ys = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(function(_, i){ return i % 2 === 1; });
      return Math.max.apply(null, ys) - Math.min.apply(null, ys);
    }
    ok(span('clipRightCav2') < span('clipLeftCav2'), 'الطرف الثاني يجب أن يكون أصغر من الأول');
  });

  it('لا عُقَد دائرية في الشبكة إطلاقًا — العقدة هي ما جعلها تُقرأ نموذجًا جزيئيًّا', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#boneStage2 circle.node').length, 0);
    eq(doc.querySelectorAll('#boneStage2 .node').length, 0);
  });

  it('العصيّ متفاوتة السُّمك — لا سُمك موحّد واحد', async function(){
    const { doc } = await page();
    const widths = Array.from(doc.querySelectorAll('#g-spongy-2 path.mesh'))
      .map(function(p){ return parseFloat(p.getAttribute('stroke-width')); });
    ok(widths.length >= 8, 'شرائح سُمك قليلة جدًّا: ' + widths.length);
    widths.forEach(function(w){ ok(w > 0, 'عصاة بلا سُمك معلن على مسارها'); });
    const distinct = new Set(widths);
    ok(distinct.size >= 5, 'يجب ألّا يقلّ تفاوت السُّمك عن خمس قيَم، الموجود: ' + distinct.size);
    ok(Math.max.apply(null, widths) / Math.min.apply(null, widths) >= 2,
      'الفارق بين أغلظ عصاة وأرفعها ضئيل — التفاوت لن يُرى');
  });

  it('لكلّ شريحة سُمك هالةٌ داكنة خلفها أوسع منها (تحفظ تباينها فوق النخاع)', async function(){
    const { doc } = await page();
    const mesh = Array.from(doc.querySelectorAll('#g-spongy-2 path.mesh'));
    const outline = Array.from(doc.querySelectorAll('#g-spongy-2 path.mesh-outline'));
    eq(outline.length, mesh.length, 'لكل شريحة عصيّ شريحةُ هالة تقابلها');
    mesh.forEach(function(m){
      const w = parseFloat(m.getAttribute('stroke-width'));
      const twin = outline.find(function(o){ return o.getAttribute('d') === m.getAttribute('d'); });
      ok(twin, 'شريحة بلا هالة مطابقة لمسارها');
      ok(parseFloat(twin.getAttribute('stroke-width')) > w, 'الهالة يجب أن تكون أوسع من عصاتها');
    });
  });

  it('العصيّ غير منتظمة الاتجاه: منحنيات Q، وفراغاتها متفاوتة الاتّساع', async function(){
    const { doc } = await page();
    const ds = Array.from(doc.querySelectorAll('#g-spongy-2 path.mesh'))
      .map(function(p){ return p.getAttribute('d') || ''; });
    ds.forEach(function(d){ has(d, 'Q', 'عصاة مستقيمة لا منحنية'); });
    const total = ds.reduce(function(a, d){ return a + (d.match(/M/g) || []).length; }, 0);
    ok(total >= 120, 'الشبكة أقلّ كثافة ممّا يُقرأ إسفنجًا: ' + total);
    // أطوال الوصلات متفاوتة (لا شبكة منتظمة)
    const lens = [];
    ds.join(' ').split('M').slice(1).forEach(function(seg){
      const n = (seg.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      if(n.length >= 6) lens.push(Math.hypot(n[4] - n[0], n[5] - n[1]));
    });
    const avg = lens.reduce(function(a, b){ return a + b; }, 0) / lens.length;
    const spread = Math.sqrt(lens.reduce(function(a, b){ return a + (b - avg) * (b - avg); }, 0) / lens.length);
    ok(spread / avg > 0.12, 'أطوال الوصلات متقاربة جدًّا — الشبكة تبدو منتظمة');
  });

  it('النخاع شكل واحد مستمرّ، وتدرّجه أحمر عند الطرفين وأصفر في الوسط', async function(){
    const { doc } = await page();
    const grad = doc.getElementById('marrowGrad2');
    ok(grad, 'التدرّج مفقود');
    eq(grad.tagName.toLowerCase(), 'lineargradient');
    const stops = Array.from(grad.querySelectorAll('stop'))
      .map(function(s){ return s.getAttribute('stop-color'); });
    has(stops[0], 'marrow-red', 'الطرف الأول يجب أن يكون أحمر');
    has(stops[stops.length - 1], 'marrow-red', 'الطرف الثاني يجب أن يكون أحمر أيضًا');
    ok(stops.some(function(c){ return /marrow-yellow/.test(c); }), 'الوسط يجب أن يكون أصفر');
    eq(doc.querySelectorAll('#g-marrow-2 .mrw').length, 1, 'شكل واحد مستمرّ لا قطع ملصوقة');
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

  it('بقعة الإسفنجي تقع على تقاطع عصيّ فعليّ لا في فراغ النخاع', async function(){
    const { doc } = await page();
    const dot = doc.querySelector('#hs-spongy .hotspot-dot');
    const hx = parseFloat(dot.getAttribute('cx'));
    const hy = parseFloat(dot.getAttribute('cy'));
    const pts = [];
    Array.from(doc.querySelectorAll('#g-spongy-2 path.mesh')).forEach(function(p){
      (p.getAttribute('d') || '').split('M').slice(1).forEach(function(seg){
        const n = (seg.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
        if(n.length >= 6){ pts.push([n[0], n[1]], [n[2], n[3]], [n[4], n[5]]); }
      });
    });
    const near = pts.some(function(pt){ return Math.hypot(pt[0] - hx, pt[1] - hy) < 1.2; });
    ok(near, 'مركز بقعة الإسفنجي (' + hx + ',' + hy + ') لا يقع على أي عصاة');
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

  it('التحديد لا يملأ الجزء تركوازيًّا — حدّ وتوهّج وإخفات ما عداه، ولون المادّة باقٍ', async function(){
    const { raw } = await page();
    ok(!/\.grp\.on\s+\.f\{[^}]*fill:var\(--turquoise\)/.test(raw),
      'ملء القشرة بالتركوازي يمحو لون المادّة الذي يبني عليه مفتاح المحطة 3');
    ok(!/\.grp\.on\s+\.mesh\{[^}]*stroke:var\(--turquoise\)/.test(raw),
      'صبغ العصيّ نفسها تركوازيًّا يمحو تدرّجها');
    has(raw, '.bone-stage.has-sel .grp:not(.on)', 'لا قاعدة تُخفت الأجزاء غير المحدَّدة');
    has(raw, '.bone-stage .grp.on .f{ stroke:var(--turquoise)', 'الاختيار يُعلَن بحدّ');
    has(raw, 'drop-shadow', 'الاختيار يُعلَن بتوهّج أيضًا');
  });

  it('لا حلقة تركيز افتراضية سوداء على مجموعات المسرح (outline:none في الحالة العادية)', async function(){
    const { raw } = await page();
    const seg = raw.slice(raw.indexOf('.bone-stage .grp{'), raw.indexOf('.bone-stage .grp{') + 140);
    has(seg, 'outline:none');
  });

  it('خانات الإفلات لا ترث الانتقال العام من .slot المشتركة — التوسيط فوريّ لا متحرّك عند كتابة النصّ', async function(){
    const { raw } = await page();
    const seg = raw.slice(raw.indexOf('.bone-slot{'), raw.indexOf('.bone-slot{') + 700);
    has(seg, 'transition:none', 'يجب إلغاء الانتقال الموروث كي لا يظهر توسيط متحرّك عند كتابة اسم الرقاقة');
  });

  /* jsdom لا يشغّل حركة ولا يحسب تخطيطًا، فالفحص على نصّ الأنماط:
     .slot.correct المشتركة تحمل animation:tplPopIn، وإطاراتها تكتب
     transform:scale(...) كاملًا فتمحو translate(-50%,-50%) — فتقفز
     الخانة عن مركزها لحظة النجاح (العلّة نفسها المرصودة في .knee-slot
     بدرس 03، ونفس العلاج: حركة محلّية تحمل الإزاحة في كل إطار). */
  it('نبضة الخانة الموضوعة فوق مسرح تحفظ توسيطها في كل إطار (لا قفزة عند النجاح)', async function(){
    const { raw } = await page();
    const flat = raw.replace(/\s*\n\s*/g, '');
    const rule = /\.bone-slot\.correct\{([^}]*)\}/.exec(flat);
    ok(!!rule, 'خانات المسرح ترث نبضة المشترك التي تمحو التوسيط');
    const name = /animation:\s*([A-Za-z][\w-]*)/.exec(rule[1]);
    ok(!!name, 'لا حركة معلنة لخانة المسرح');
    no(/^tplPopIn$/.test(name[1]), 'الحركة هي نفسها التي تمحو التوسيط');
    const kf = new RegExp('@keyframes ' + name[1] + '\\{([^@]*?)\\}\\}').exec(flat + '}');
    ok(!!kf, 'لم أجد إطارات ' + name[1]);
    const frames = kf[1].match(/transform:[^;}]*/g) || [];
    ok(frames.length >= 3, 'إطارات الحركة أقلّ من ثلاثة');
    frames.forEach(function(f){
      ok(/translate\(-50%,\s*-50%\)/.test(f), 'إطار بلا إزاحة توسيط: ' + f);
    });
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
    for(let i = 0; i < slots.length; i++){
      for(let j = i + 1; j < slots.length; j++){
        const dx = Math.abs(slots[i].left - slots[j].left);
        const dy = Math.abs(slots[i].top - slots[j].top);
        ok(dx > 8 || dy > 8, 'تقارب محتمل بين ' + slots[i].id + ' و' + slots[j].id);
      }
    }
  });

  it('كل خانة إفلات فوق بداية خطّ ربطها لا بعيدًا عنه (النسب تتبع viewBox الجديد)', async function(){
    const { doc } = await page();
    const vb = doc.getElementById('boneStage2').getAttribute('viewBox').split(/\s+/).map(Number);
    const pairs = [['s2-slot-compact', 'compact'], ['s2-slot-spongy', 'spongy'], ['s2-slot-marrow', 'marrow']];
    pairs.forEach(function(pair){
      const el = doc.getElementById(pair[0]);
      const line = doc.querySelector('#boneStage2 .connector[data-t="' + pair[1] + '"]');
      const lx = parseFloat(line.getAttribute('x1'));
      const slotX = pct(el.style.left) / 100 * vb[2] + vb[0];
      ok(Math.abs(slotX - lx) < 3, pair[0] + ': الخانة بعيدة أفقيًّا عن بداية خطّها');
    });
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
    eq(vb3, '1 55 126 170');
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

  it('لا جزء من الساق ولا الطرف الثاني في النسخة المكبَّرة — الطرف الأول وحده', async function(){
    const { doc } = await page();
    eq(doc.getElementById('g-compact-3').querySelectorAll('path').length, 1);
    eq(doc.getElementById('g-marrow-3').querySelectorAll('path').length, 1);
    no(doc.getElementById('marrowGrad3'), 'لا حاجة لتدرّج بعد أن صار الطرف وحده مرئيًّا');
    no(doc.getElementById('clipRightCav3'), 'الطرف الثاني خارج نطاق التكبير');
  });

  it('شبكة المحطة 3 بلا عُقَد كذلك، ومتفاوتة السُّمك، ولها هالاتها', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#boneStage3 circle.node').length, 0);
    const mesh = Array.from(doc.querySelectorAll('#g-spongy-3 path.mesh'));
    const outline = doc.querySelectorAll('#g-spongy-3 path.mesh-outline');
    eq(outline.length, mesh.length);
    ok(new Set(mesh.map(function(p){ return p.getAttribute('stroke-width'); })).size >= 5);
    ok(doc.getElementById('strutGrad3'), 'تدرّج شبكة المحطة 3 مفقود');
  });

  it('وسيلة إيضاح نصّية (Legend) تحمل أسماء الأجزاء الثلاثة كلّها', async function(){
    const { doc } = await page();
    const legend = doc.querySelector('.bone-legend');
    ok(legend, 'وسيلة الإيضاح مفقودة');
    const txt = legend.textContent;
    ok(/العظم الكثيف/.test(txt) && /العظم الإسفنجي/.test(txt) && /نخاع العظم/.test(txt));
  });

  it('شبكة الإسفنجي في نسخة المحطة 3 مقصوصة أيضًا داخل حدود التجويف', async function(){
    const { doc } = await page();
    ok(doc.getElementById('clipLeftCav3'));
    eq(doc.getElementById('g-spongy-3').querySelectorAll('g[clip-path]').length, 1);
  });

  it('شبكتا المحطتين 2 و3 متطابقتان هندسيًّا في الطرف الأول — اتّساق بصري بين النسختين', async function(){
    const { doc } = await page();
    function meshOf(stage, clip){
      const g = Array.from(doc.getElementById(stage).querySelectorAll('g[clip-path]'))
        .find(function(el){ return (el.getAttribute('clip-path') || '').indexOf(clip) > -1; });
      return Array.from(g.querySelectorAll('path.mesh'))
        .map(function(p){ return p.getAttribute('stroke-width') + '|' + p.getAttribute('d'); }).sort();
    }
    eq(JSON.stringify(meshOf('g-spongy-2', 'clipLeftCav2')), JSON.stringify(meshOf('g-spongy-3', 'clipLeftCav3')));
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
