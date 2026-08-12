'use strict';
/* ==========================================================
   فحص عددي لمسارح الوحدة 02 · الدرس 03 — ما لا يكشفه اختبار المنطق
   ----------------------------------------------------------
   الدرس كلّه دوران: ثلاثة عناصر تدور حول نقطة مفصل. فالفحص هنا
   يقيس نقطة الارتكاز والحدود عند أقصى زاوية، لا وجود العناصر
   وحده. والفحص بالعين يبقى ضروريًّا معه (§9.5) لا بديلًا عنه.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-02/lesson-03.html';

async function page(){
  const s = await h.loadLesson(LESSON, { reduceMotion: true });
  s.w.Certificate = { finish: function(){} };
  return s;
}
function pct(str){ return parseFloat(String(str || '').replace('%', '')); }

/* ---------- محلّل مسارات: يعيد نقاط التحكّم كلّها ----------
   يفهم M/L/Q/A المطلقة (وهي كل ما يستعمله هذا الدرس). نقاط
   التحكّم في Q تُحسب ضمن الحدود عمدًا: منحنى بيزيه لا يتجاوزها
   أبدًا، فالحدّ المحسوب منها متحفّظ لا متساهل. */
function pathPoints(d){
  const toks = String(d).match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
  const pts = [];
  let i = 0, cmd = null;
  while(i < toks.length){
    if(/^[A-Za-z]$/.test(toks[i])){ cmd = toks[i]; i++; continue; }
    const n = k => parseFloat(toks[i + k]);
    if(cmd === 'M' || cmd === 'L'){ pts.push([n(0), n(1)]); i += 2; }
    else if(cmd === 'Q'){ pts.push([n(0), n(1)], [n(2), n(3)]); i += 4; }
    else if(cmd === 'A'){ pts.push([n(5), n(6)]); i += 7; }
    else i++;
  }
  return pts;
}

/* كل نقاط عنصر SVG مع نصف قطر سماكته أو دائرته */
function nodePoints(node){
  const tag = node.tagName.toLowerCase();
  const sw = parseFloat(node.getAttribute('stroke-width') || '0') / 2;
  if(tag === 'path' || tag === 'polyline' || tag === 'polygon'){
    return pathPoints(node.getAttribute('d') || '').map(p => [p[0], p[1], sw]);
  }
  if(tag === 'circle'){
    const r = parseFloat(node.getAttribute('r') || '0');
    return [[parseFloat(node.getAttribute('cx')), parseFloat(node.getAttribute('cy')), r]];
  }
  if(tag === 'ellipse'){
    const cx = parseFloat(node.getAttribute('cx')), cy = parseFloat(node.getAttribute('cy'));
    const rx = parseFloat(node.getAttribute('rx')), ry = parseFloat(node.getAttribute('ry'));
    return [[cx - rx, cy - ry, 0], [cx + rx, cy + ry, 0]];
  }
  if(tag === 'line'){
    return [[parseFloat(node.getAttribute('x1')), parseFloat(node.getAttribute('y1')), sw],
            [parseFloat(node.getAttribute('x2')), parseFloat(node.getAttribute('y2')), sw]];
  }
  if(tag === 'rect'){
    const x = parseFloat(node.getAttribute('x')), y = parseFloat(node.getAttribute('y'));
    return [[x, y, 0], [x + parseFloat(node.getAttribute('width')), y + parseFloat(node.getAttribute('height')), 0]];
  }
  return [];
}

function viewBox(svg){
  const v = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  return { x: v[0], y: v[1], w: v[2], h: v[3] };
}

function rotate(p, cx, cy, deg){
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = p[0] - cx, dy = p[1] - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c, p[2]];
}

/* هل يخرج شيء عن حدود viewBox؟ pivot اختياري لفحص حالة مُدارة */
function outOfBounds(svg, opts){
  opts = opts || {};
  const vb = viewBox(svg);
  const bad = [];
  svg.querySelectorAll('path, circle, ellipse, line, rect, polyline, polygon').forEach(function(node){
    if(opts.only && !opts.only(node)) return;
    nodePoints(node).forEach(function(p){
      let q = p;
      if(opts.pivot) q = rotate(p, opts.pivot[0], opts.pivot[1], opts.deg || 0);
      const pad = q[2] || 0;
      if(q[0] - pad < vb.x - 0.5 || q[0] + pad > vb.x + vb.w + 0.5 ||
         q[1] - pad < vb.y - 0.5 || q[1] + pad > vb.y + vb.h + 0.5){
        bad.push((node.id || node.tagName) + ' @ ' + q[0].toFixed(1) + ',' + q[1].toFixed(1));
      }
    });
  });
  return bad;
}

/* ---------- المسرح 1: التشريح الطبقي ---------- */
describe('هندسة المحطة 2 — مسرح التشريح الطبقي', function(){
  it('ستّ طبقات معلنة، كلٌّ منها مجموعة أو مسار مستقلّ', async function(){
    const { doc } = await page();
    ['lay-skin-a', 'lay-skin-b', 'lay-fat-a', 'lay-fat-b', 'lay-muscle',
     'lay-tendon', 'lay-ligament', 'lay-cartilage-a', 'lay-cartilage-b',
     'lay-bone', 'lay-bone-b'].forEach(function(id){
      ok(doc.getElementById(id), 'طبقة مفقودة: ' + id);
    });
  });

  it('لا شيء يخرج عن حدود المشهد في وضع السكون', async function(){
    const { doc } = await page();
    const bad = outOfBounds(doc.getElementById('dissectStage'));
    eq(bad.length, 0, 'خارج الحدود: ' + bad.join(' · '));
  });

  it('نقطة ارتكاز دوران الساق عند المفصل لا عند مركز العنصر', async function(){
    const { raw } = await page();
    const m = /#legRotor\{[^}]*transform-origin:\s*([\d.]+)px\s+([\d.]+)px/.exec(raw);
    ok(m, 'transform-origin غير معرَّف على #legRotor');
    const ox = parseFloat(m[1]), oy = parseFloat(m[2]);
    ok(/transform-box:\s*view-box/.test(raw), 'transform-box غير مضبوط');
    // المفصل: بين رأس العظم العلوي ورأس العظم السفلي
    const { doc } = await page();
    const upper = doc.querySelectorAll('#lay-bone circle')[1];
    const lower = doc.querySelectorAll('#lay-bone-b circle')[0];
    const jx = (parseFloat(upper.getAttribute('cx')) + parseFloat(lower.getAttribute('cx'))) / 2;
    const jy = (parseFloat(upper.getAttribute('cy')) + parseFloat(lower.getAttribute('cy'))) / 2;
    ok(Math.hypot(ox - jx, oy - jy) < 12,
       'الارتكاز بعيد عن المفصل: (' + ox + ',' + oy + ') مقابل (' + jx.toFixed(1) + ',' + jy.toFixed(1) + ')');
    // ولا يساوي مركز الجزء الدوّار (الافتراضي الذي يُطيّر الطرف)
    const rotorPts = [];
    doc.querySelectorAll('#legRotor path, #legRotor circle').forEach(function(n){
      nodePoints(n).forEach(function(p){ rotorPts.push(p); });
    });
    const cx = (Math.min(...rotorPts.map(p => p[0])) + Math.max(...rotorPts.map(p => p[0]))) / 2;
    ok(Math.abs(ox - cx) > 25, 'الارتكاز عند مركز العنصر لا عند المفصل');
  });

  it('لا شيء يخرج عن الحدود عند أقصى زاويتَي حركة الساق', async function(){
    const { doc, raw } = await page();
    const svg = doc.getElementById('dissectStage');
    /* المسح محصور بكتلة @keyframes legSwing وحدها: مسحُ الملف كلّه
       يلتقط أي rotate() آخر (سهم طيّ، أيقونة، أي حركة قادمة) ويحسبه
       زاويةً للساق. وقد وقع ذلك فعلًا عند إضافة سطر الطيّ. */
    const block = /@keyframes\s+legSwing\s*\{([\s\S]*?)\n\s*\}/.exec(raw);
    ok(!!block, 'لم أجد كتلة @keyframes legSwing');
    const angles = (block[1].match(/rotate\((-?\d+)deg\)/g) || [])
      .map(function(t){ return parseInt(/-?\d+/.exec(t)[0], 10); });
    ok(angles.length >= 2, 'حركة الساق بلا زوايا معلنة');
    const pivot = [159, 100];
    angles.forEach(function(deg){
      const bad = outOfBounds(svg, {
        pivot: pivot, deg: deg,
        only: function(n){ return !!(n.closest && n.closest('#legRotor')); }
      });
      eq(bad.length, 0, 'خارج الحدود عند ' + deg + '°: ' + bad.join(' · '));
    });
  });

  it('العظمان بميلين مختلفين فعلًا — وإلا قُرئا عظمًا واحدًا مستقيمًا', async function(){
    const { doc } = await page();
    function slope(sel){
      const p = pathPoints(doc.querySelector(sel).getAttribute('d'));
      return (p[1][1] - p[0][1]) / (p[1][0] - p[0][0]);
    }
    const a = slope('#lay-bone .bone-shaft'), b = slope('#lay-bone-b .bone-shaft');
    ok(Math.abs(a - b) > 0.1,
       'ميل العظمين متقارب (' + a.toFixed(3) + ' و' + b.toFixed(3) + ') فلا يُقرأ المفصل انثناءً');
  });

  it('طبقتا الجلد والدهن تغطّيان ما تحتهما — الدهن أصغر من الجلد', async function(){
    const { doc } = await page();
    function area(id){
      const p = pathPoints(doc.getElementById(id).getAttribute('d'));
      const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
      return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    }
    ok(area('lay-fat-a') < area('lay-skin-a'), 'الدهن ليس داخل الجلد في الطرف الثابت');
    ok(area('lay-fat-b') < area('lay-skin-b'), 'الدهن ليس داخل الجلد في الطرف الدوّار');
  });

  it('الغضروف يغلّف طرفَي العظمين عند المفصل لا في مكان آخر', async function(){
    const { doc } = await page();
    const upper = doc.querySelectorAll('#lay-bone circle')[1];
    const lower = doc.querySelectorAll('#lay-bone-b circle')[0];
    [['lay-cartilage-a', upper], ['lay-cartilage-b', lower]].forEach(function(pair){
      const pts = pathPoints(doc.getElementById(pair[0]).getAttribute('d'));
      const cx = parseFloat(pair[1].getAttribute('cx')), cy = parseFloat(pair[1].getAttribute('cy'));
      const r = parseFloat(pair[1].getAttribute('r'));
      pts.forEach(function(p){
        ok(Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - r) < 6,
           pair[0] + ' لا يلتصق بطرف العظم');
      });
    });
  });
});

/* ---------- المسرح 2: الاحتكاك ---------- */
describe('هندسة المحطة 3 — مسرح الاحتكاك', function(){
  /* استثناء مسمّى ومعلَّل، والحارس يبقى عاملًا على كل ما عداه:
     ساقا العظمين تتجاوزان الحافّة عمدًا فتقصّهما، لأن طرفًا ينتهي
     بحدّ حادّ داخل المشهد يُقرأ عظمًا مقطوعًا. وأيّ عنصر آخر يخرج
     فخروجه سهو. */
  it('لا شيء يخرج عن حدود المشهد إلا ساقَي العظمين عمدًا', async function(){
    const { doc } = await page();
    const bad = outOfBounds(doc.getElementById('fricStage'), {
      only: function(n){ return !n.classList.contains('bone-end'); }
    });
    eq(bad.length, 0, 'خارج الحدود: ' + bad.join(' · '));
  });

  it('طرفا العظمين يتجاوزان الحافّة فلا يُقرآن مقطوعين', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('fricStage');
    const vb = viewBox(svg);
    const ends = svg.querySelectorAll('.bone-end');
    eq(ends.length, 2);
    const xs = Array.from(ends).map(function(n){
      const v = (n.getAttribute('d').match(/-?[\d.]+/g) || []).map(Number).filter(function(_, i){ return i % 2 === 0; });
      return [Math.min.apply(null, v), Math.max.apply(null, v)];
    });
    ok(xs[0][0] < vb.x, 'الطرف الثابت لا يبلغ الحافّة اليسرى: ' + xs[0][0]);
    ok(xs[1][1] > vb.x + vb.w, 'الطرف المتحرّك لا يبلغ الحافّة اليمنى: ' + xs[1][1]);
    /* والمتحرّك يتجاوزها بأكثر من أقصى إزاحته، وإلا انكشف فراغ أثناء الحركة */
    const raw2 = svg.ownerDocument.documentElement.outerHTML;
    const shifts = (raw2.match(/translateX\((\d+)px\)/g) || []).map(function(t){ return parseInt(/\d+/.exec(t)[0], 10); });
    const maxShift = Math.max.apply(null, shifts.concat([0]));
    ok(xs[1][1] >= vb.x + vb.w + maxShift,
       'تجاوز الطرف المتحرّك (' + xs[1][1] + ') أقلّ من أقصى إزاحته (' + maxShift + ')');
  });

  it('طرفان عظميّان وغضروفان وسائل واحد', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('fricStage');
    eq(svg.querySelectorAll('.bone-end').length, 2);
    eq(svg.querySelectorAll('.cart').length, 2);
    eq(svg.querySelectorAll('.fluid').length, 1);
  });

  it('قيم المؤشّر في الحالات الثلاث متدرّجة نزولًا فعليًّا', async function(){
    const { raw } = await page();
    /* تُقرأ من إعلان الحالات نفسه لا بالتقاطها أثناء التشغيل: تحت
       «تقليل الحركة» تتعاقب الحالات الثلاث في نبضة واحدة، فالمراقبة
       الزمنية تلتقط الأخيرة وحدها وتُنتج إخفاقًا وهميًّا. */
    const block = /states:\s*\[([\s\S]*?)\]/.exec(raw);
    ok(block, 'حالات مسرح الاحتكاك غير معلنة');
    const nums = (block[1].match(/n:\s*(\d+)/g) || []).map(function(t){
      return parseInt(/\d+/.exec(t)[0], 10);
    });
    eq(nums.length, 3, 'عدد الحالات ليس ثلاثًا: ' + nums);
    for(let i = 1; i < nums.length; i++){
      ok(nums[i] < nums[i - 1], 'المؤشّر لم ينزل: ' + nums.join(' → '));
    }
    ok(nums[0] - nums[2] > 40, 'الفرق بين أعلى قيمة وأدناها غير محسوس: ' + nums.join(' → '));
  });

  it('أشرطة السجلّ الثلاثة تبلغ نسبها المعلنة وتتدرّج نزولًا', async function(){
    const s = await page();
    const { doc, w } = s;
    doc.querySelector('#s3PredictOptions input[value="a"]').click();
    for(let i = 0; i < 3; i++){ h.click(doc, 's3RunBtn'); await h.tick(w, 60); }
    eq(pct(doc.getElementById('fricFill1').style.width), 88);
    eq(pct(doc.getElementById('fricFill2').style.width), 52);
    eq(pct(doc.getElementById('fricFill3').style.width), 18);
    eq(doc.getElementById('fricStage').getAttribute('class'), 'stage fric s3');
  });

  it('السائل يقع في الفراغ بين الطرفين لا فوق أحدهما', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('fricStage');
    const fluid = svg.querySelector('.fluid');
    const cx = parseFloat(fluid.getAttribute('cx'));
    const ends = Array.prototype.map.call(svg.querySelectorAll('.bone-end'), function(n){
      const xs = pathPoints(n.getAttribute('d')).map(p => p[0]);
      return { min: Math.min(...xs), max: Math.max(...xs) };
    });
    const leftMax = Math.min(...ends.map(e => e.max));
    const rightMin = Math.max(...ends.map(e => e.min));
    ok(cx > Math.min(leftMax, rightMin) - 40 && cx < Math.max(leftMax, rightMin) + 40,
       'مركز السائل خارج منطقة الفراغ');
  });
});

/* ---------- المسرح 3: مقطع الركبة وخانات البناء ---------- */
describe('هندسة المحطة 3 — مقطع الركبة وخانات الإفلات', function(){
  const SLOTS = ['s3-slot-muscle', 's3-slot-cartilage', 's3-slot-ligament',
                 's3-slot-tendon', 's3-slot-fluid'];

  it('خمس خانات إفلات، خانة واحدة لكل رقاقة', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('[data-chips="u2l3-build"] .slot').length, 5);
    SLOTS.forEach(function(id){
      const slot = doc.getElementById(id);
      ok(slot, 'خانة مفقودة: ' + id);
      eq((slot.dataset.answer || '').split('|').length, 1, id + ' سعته أكثر من واحد');
    });
  });

  it('كل خانة تقع فوق بداية خطّ ربطها بفارق أقلّ من 3 وحدات', async function(){
    const { doc } = await page();
    const vb = viewBox(doc.getElementById('kneeStage'));
    SLOTS.forEach(function(id){
      const slot = doc.getElementById(id);
      const key = id.replace('s3-slot-', '');
      const line = doc.querySelector('.connector[data-t="' + key + '"]');
      ok(line, 'خطّ ربط مفقود لـ' + key);
      const x = vb.x + pct(slot.style.left) / 100 * vb.w;
      const y = vb.y + pct(slot.style.top) / 100 * vb.h;
      const d = Math.hypot(x - parseFloat(line.getAttribute('x1')),
                           y - parseFloat(line.getAttribute('y1')));
      ok(d < 3, key + ': الخانة بعيدة عن بداية خطّها بـ' + d.toFixed(2) + ' وحدة');
    });
  });

  it('الخانات الخمس لا تتداخل', async function(){
    const { doc } = await page();
    const pts = SLOTS.map(function(id){
      const s = doc.getElementById(id);
      return { id: id, x: pct(s.style.left), y: pct(s.style.top) };
    });
    for(let i = 0; i < pts.length; i++){
      for(let j = i + 1; j < pts.length; j++){
        const dx = Math.abs(pts[i].x - pts[j].x), dy = Math.abs(pts[i].y - pts[j].y);
        ok(dx > 24 || dy > 14, 'تداخل محتمل: ' + pts[i].id + ' و' + pts[j].id);
      }
    }
  });

  it('كل خطّ ربط ينتهي عند موضعه التشريحي الصحيح', async function(){
    const { doc } = await page();
    function endOf(key){
      const l = doc.querySelector('.connector[data-t="' + key + '"]');
      return [parseFloat(l.getAttribute('x2')), parseFloat(l.getAttribute('y2'))];
    }
    function near(node, p, tol){
      const pts = nodePoints(node);
      return pts.some(function(q){ return Math.hypot(q[0] - p[0], q[1] - p[1]) < tol; });
    }
    const svg = doc.getElementById('kneeStage');
    ok(near(svg.querySelector('.muscle-f'), endOf('muscle'), 26), 'خطّ العضلة لا يشير إليها');
    const sinews = svg.querySelectorAll('.sinew-f');
    ok(near(sinews[0], endOf('tendon'), 30), 'خطّ الوتر لا يشير إليه');
    ok(near(sinews[1], endOf('ligament'), 30), 'خطّ الرباط لا يشير إليه');
    const cavity = svg.querySelector('.cavity-f');
    const fl = endOf('fluid');
    const ys = pathPoints(cavity.getAttribute('d')).map(p => p[1]);
    ok(fl[1] >= Math.min(...ys) - 4 && fl[1] <= Math.max(...ys) + 4, 'خطّ التجويف لا ينتهي داخله');
    const carts = svg.querySelectorAll('.cart-f');
    ok(near(carts[0], endOf('cartilage'), 24) || near(carts[1], endOf('cartilage'), 24),
       'خطّ الغضروف لا يشير إلى طبقته');
  });

  it('الغضروف طبقتان تغطّيان طرفَي العظمين، والتجويف بينهما', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('kneeStage');
    eq(svg.querySelectorAll('.cart-f').length, 2);
    const cav = pathPoints(svg.querySelector('.cavity-f').getAttribute('d')).map(p => p[1]);
    const c0 = pathPoints(svg.querySelectorAll('.cart-f')[0].getAttribute('d')).map(p => p[1]);
    const c1 = pathPoints(svg.querySelectorAll('.cart-f')[1].getAttribute('d')).map(p => p[1]);
    ok(Math.min(...cav) >= Math.min(...c0), 'التجويف يعلو الغضروف العلوي');
    ok(Math.max(...cav) <= Math.max(...c1) + 1, 'التجويف يهبط تحت الغضروف السفلي');
  });

  it('العضلة تلامس العظم العلوي — لا كتلة معلّقة بلا رابط', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('kneeStage');
    const muscle = pathPoints(svg.querySelector('.muscle-f').getAttribute('d'));
    const bone = pathPoints(svg.querySelectorAll('.bone-f')[0].getAttribute('d'));
    const gap = Math.min.apply(null, muscle.map(function(m){
      return Math.min.apply(null, bone.map(function(b){ return Math.hypot(m[0] - b[0], m[1] - b[1]); }));
    }));
    ok(gap < 20, 'العضلة بعيدة عن العظم بـ' + gap.toFixed(1) + ' وحدة');
  });

  it('لا شيء يخرج عن حدود مقطع الركبة', async function(){
    const { doc } = await page();
    const bad = outOfBounds(doc.getElementById('kneeStage'));
    eq(bad.length, 0, 'خارج الحدود: ' + bad.join(' · '));
  });

  /* التسمية خرجت من الرسم إلى سطر ثابت أسفله: كانت نصًّا عائمًا بخطّ
     إشارة فتصادمت مع خانة «غضروف»، وكل موضع بديل داخل الرسم يحجبه
     قوس الرباط. والحارس يمنع عودتها إلى الداخل. */
  it('تسمية الغشاء أسفل الشكل لا داخله، وتصف موضعه بما يراه الطالب', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('kneeStage');
    no(svg.querySelector('.memb-cap'), 'التسمية عادت إلى داخل الرسم');
    no(/الغشاء/.test(svg.textContent), 'نصّ الغشاء داخل الرسم');
    const cap = doc.querySelector('.stage-caption');
    ok(!!cap, 'لا تسمية ثابتة أسفل الشكل');
    ok(/الغشاء الزلالي/.test(cap.textContent));
    /* تصف الموضع بما يُرى، وإلا فقدت وظيفة خطّ الإشارة الذي حلّت محلّه */
    ok(/جانب/.test(cap.textContent) && /التجويف/.test(cap.textContent),
       'التسمية لا تدلّ على موضع الغشاء');
    /* والغشاء نفسه ما زال مرسومًا قوسين */
    eq(svg.querySelectorAll('.memb').length, 2);
  });

  /* القاعدة أوسع من هذا الشكل: أي نصّ عربي داخل أي SVG في الدرس */
  it('لا نصّ عربي داخل أي SVG وُضع على direction:ltr', async function(){
    const { doc } = await page();
    doc.querySelectorAll('svg text').forEach(function(t){
      if(!/[\u0600-\u06FF]/.test(t.textContent)) return;
      no(/ltr/.test(t.getAttribute('direction') || ''), 'نصّ عربي على direction:ltr');
      no(/direction:\s*ltr/.test(t.getAttribute('style') || ''), 'نصّ عربي على direction:ltr');
    });
  });

  /* الخانة قد تقع فوق العظم أو قرب الحافّة فلا يراها الطالب — وهذا
     ما وقع لخانة السائل: فوق ساق العظم وعلى بُعد 26 وحدة من الحافّة
     السفلى، وخطّ إشارتها مدفون في العظم 85% من طوله. والاختبارات
     كانت تتحقّق أنّ الخانة فوق بداية خطّها ولا تسأل: هل تُرى؟ */
  /* jsdom لا يشغّل حركة ولا يحسب تخطيطًا، فالفحص على نصّ الأنماط:
     أي حركة تُطبَّق على خانة موضوعة بالتوسيط يجب أن تحمل الإزاحة في
     كل إطار، وإلا محت `translate(-50%,-50%)` فقفزت الخانة عن مركزها
     طوال الحركة ثم عادت. */
  it('نبضة الخانة الموضوعة فوق مسرح تحفظ توسيطها في كل إطار', async function(){
    const { raw } = await page();
    const flat = raw.replace(/\s*\n\s*/g, '');
    const rule = /\.knee-slot\.correct\{([^}]*)\}/.exec(flat);
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

  it('كل خانة في فراغ مرئي: لا فوق عظم ولا ملتصقة بحافّة المشهد', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('kneeStage');
    const vb = viewBox(svg);
    const bones = Array.from(svg.querySelectorAll('.bone-f')).map(function(n){
      const v = (n.getAttribute('d').match(/-?[\d.]+/g) || []).map(Number);
      const xs = v.filter(function(_, i){ return i % 2 === 0; });
      const ys = v.filter(function(_, i){ return i % 2 === 1; });
      return { x1: Math.min.apply(null, xs), x2: Math.max.apply(null, xs),
               y1: Math.min.apply(null, ys), y2: Math.max.apply(null, ys) };
    });
    SLOTS.forEach(function(id){
      const s = doc.getElementById(id);
      const x = vb.x + pct(s.style.left) / 100 * vb.w;
      const y = vb.y + pct(s.style.top) / 100 * vb.h;
      const edge = Math.min(x - vb.x, vb.x + vb.w - x, y - vb.y, vb.y + vb.h - y);
      ok(edge >= 30, id + ': على بُعد ' + edge.toFixed(0) + ' وحدة من الحافّة فتبدو مقصوصة');
      bones.forEach(function(b){
        no(x > b.x1 && x < b.x2 && y > b.y1 && y < b.y2, id + ': مركزها فوق عظم');
      });
    });
  });
});

/* ---------- المسرحان 4 و5: الكتف والمرفق ---------- */
describe('هندسة المحطة 4 — الكتف والمرفق', function(){
  it('نقطة ارتكاز كلٍّ منهما عند المفصل لا عند مركز العنصر', async function(){
    const { doc, raw } = await page();
    const cases = [
      { rotor: 'humerusRotor', ball: '#humerusRotor circle' },
      { rotor: 'ulnaRotor', pivot: '#elbowStage circle' }
    ];
    const m1 = /#humerusRotor\{[^}]*transform-origin:\s*([\d.]+)px\s+([\d.]+)px/.exec(raw);
    ok(m1, 'ارتكاز الكتف غير معرَّف');
    const ball = doc.querySelector('#humerusRotor circle');
    ok(Math.abs(parseFloat(m1[1]) - parseFloat(ball.getAttribute('cx'))) < 2 &&
       Math.abs(parseFloat(m1[2]) - parseFloat(ball.getAttribute('cy'))) < 2,
       'ارتكاز الكتف ليس عند مركز الكرة');

    const m2 = /#ulnaRotor\{[^}]*transform-origin:\s*([\d.]+)px\s+([\d.]+)px/.exec(raw);
    ok(m2, 'ارتكاز المرفق غير معرَّف');
    const knob = Array.prototype.slice.call(doc.querySelectorAll('#elbowStage > circle')).pop();
    ok(Math.abs(parseFloat(m2[1]) - parseFloat(knob.getAttribute('cx'))) < 3 &&
       Math.abs(parseFloat(m2[2]) - parseFloat(knob.getAttribute('cy'))) < 3,
       'ارتكاز المرفق ليس عند محور الدوران المرسوم');
    void cases;
  });

  it('لا شيء يخرج عن الحدود عند أقصى زاوية للكتف (±70)', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('shoulderStage');
    [-70, -35, 0, 35, 70].forEach(function(deg){
      const bad = outOfBounds(svg, {
        pivot: [128, 96], deg: deg,
        only: function(n){ return !!(n.closest && n.closest('#humerusRotor')); }
      });
      eq(bad.length, 0, 'الكتف خارج الحدود عند ' + deg + '°: ' + bad.join(' · '));
    });
  });

  it('لا شيء يخرج عن الحدود عبر مدى المرفق كلّه (-140 إلى 0)', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('elbowStage');
    [-140, -105, -70, -35, 0].forEach(function(deg){
      const bad = outOfBounds(svg, {
        pivot: [150, 150], deg: deg,
        only: function(n){ return !!(n.closest && n.closest('#ulnaRotor')); }
      });
      eq(bad.length, 0, 'المرفق خارج الحدود عند ' + deg + '°: ' + bad.join(' · '));
    });
  });

  /* أُعيدت صياغته في 12 أغسطس 2026. كان يعرّف «المرفق مفصل رزّي»
     بأنّ حدّه الأقصى صفر — أي أنّ العظم يبدأ واقفًا عند حدّه فلا
     يتحرّك إلا في جهة واحدة. وهذا وصفٌ لوضع البداية لا لطبيعة
     المفصل: المرفق الحقيقي يثني ويمدّ حول المحور نفسه.
     والفرق الحقيقي بين المفصلين اثنان: سعة المدى، ووجود دوران
     العظم حول نفسه في الكروي دون الرزّي. */
  it('الكتف أوسع مدى من المرفق، وهو وحده يدير العظم حول نفسه', async function(){
    const { doc } = await page();
    function span(n){
      return Math.abs(parseFloat(n.getAttribute('aria-valuemax')) -
                      parseFloat(n.getAttribute('aria-valuemin')));
    }
    const sh = doc.getElementById('humerusRotor');
    const el = doc.getElementById('ulnaRotor');
    ok(span(sh) > span(el), 'مدى الكتف ليس أوسع: ' + span(sh) + ' مقابل ' + span(el));
    ok(!!doc.getElementById('humerusSpin'), 'الكتف بلا دوران حول المحور الطولي');
    no(el.querySelector('[id$="Spin"]'), 'المرفق يدير العظم حول نفسه وهو رزّي');
    /* والمرفق محدود من الطرفين: مدى مغلق لا دوران مفتوح */
    ok(span(el) > 60 && span(el) < 160, 'مدى المرفق خارج المعقول: ' + span(el));
  });

  it('كرة الكتف تستقرّ داخل التجويف لا بجواره', async function(){
    const { doc } = await page();
    const svg = doc.getElementById('shoulderStage');
    const ball = svg.querySelector('#humerusRotor circle');
    const bx = parseFloat(ball.getAttribute('cx')), by = parseFloat(ball.getAttribute('cy'));
    const r = parseFloat(ball.getAttribute('r'));
    const socket = Array.prototype.find.call(svg.querySelectorAll('path.bone-f'), function(p){
      return /A /.test(p.getAttribute('d') || '');
    });
    ok(socket, 'التجويف غير مرسوم كقوس');
    const pts = pathPoints(socket.getAttribute('d'));
    pts.forEach(function(p){
      const d = Math.hypot(p[0] - bx, p[1] - by);
      ok(d > r - 4 && d < r * 2.2,
         'حافّة التجويف على بعد ' + d.toFixed(1) + ' من مركز الكرة (نصف قطرها ' + r + ')');
    });
  });

  it('touch-action:none محصور بالعنصر القابل للسحب لا بالـSVG كاملًا', async function(){
    const { raw } = await page();
    ok(/\.jt \.grip\{[^}]*touch-action:\s*none/.test(raw), 'الإمساك بلا touch-action');
    no(/svg\.jt\{[^}]*touch-action:\s*none/.test(raw), 'touch-action وُضع على الـSVG كاملًا');
  });
});

/* ---------- المسرح 6: السليم مقابل المتضرّر ---------- */
describe('هندسة المحطة 5 — المفصل السليم والمتضرّر', function(){
  it('الحالتان مرسومتان معًا في الوسم منذ التحميل', async function(){
    const { doc } = await page();
    ok(doc.getElementById('kneeHealthy'));
    ok(doc.getElementById('kneeDamaged'));
  });

  it('التبديل بتلاشٍ متبادل بـopacity لا بتحويل هندسي', async function(){
    const { raw } = await page();
    ok(/#dmgStage\.dmg #kneeDamaged\{\s*opacity:1/.test(raw), 'لا تلاشي متبادل');
    const block = /#kneeDamaged\{[^}]*\}/.exec(raw);
    no(/transform/.test(block[0]), 'الحالة المتضرّرة تُبنى بتحويل هندسي لا برسم مستقلّ');
  });

  /* أُعيد في 12 أغسطس 2026. كان يشترط تطابق العظمين حرفيًّا بين
     الحالتين — فيمنع ضيق المسافة عند المفصل، وبغيره يقول الرسم إنّ
     الغضروف ذهب وحلّ محلّه سائل أكثر. والحارس الآن يحرس الصدق
     العلمي: الكفاف الخارجي ثابت، والمسافة تضيق، والضيق يساوي ما
     فُقد من الغضروف — فالسائل لم يُمسّ. */
  it('المسافة عند المفصل تضيق بمقدار ما فُقد من الغضروف، والكفاف ثابت', async function(){
    const { doc } = await page();
    function ys(id, cls){
      return Array.prototype.map.call(doc.querySelectorAll('#' + id + ' path.' + cls), function(n){
        const v = (n.getAttribute('d').match(/-?[\d.]+/g) || []).map(Number);
        return v.filter(function(_, k){ return k % 2 === 1; });
      });
    }
    const hb = ys('kneeHealthy', 'bone-f'), db = ys('kneeDamaged', 'bone-f');
    eq(hb.length, 2); eq(db.length, 2);
    /* الكفاف الخارجي ثابت: طرفا الساقين البعيدان لم يتحرّكا */
    eq(Math.min.apply(null, hb[0]), Math.min.apply(null, db[0]), 'طرف العظم العلوي البعيد تحرّك');
    eq(Math.max.apply(null, hb[1]), Math.max.apply(null, db[1]), 'طرف العظم السفلي البعيد تحرّك');
    /* المسافة عند المفصل: من أسفل العلوي إلى أعلى السفلي */
    const gapH = Math.min.apply(null, hb[1]) - Math.max.apply(null, hb[0]);
    const gapD = Math.min.apply(null, db[1]) - Math.max.apply(null, db[0]);
    ok(gapD < gapH, 'المسافة لم تضق: ' + gapH + ' ← ' + gapD);
    ok(gapD > gapH * 0.5, 'ضاقت أكثر ممّا يفسّره فقد الغضروف: ' + gapH + ' ← ' + gapD);
    /* والضيق يساوي ما فُقد من الغضروف: فالسائل لم يُمسّ */
    function cartThick(id){
      return ys(id, 'cart-f').reduce(function(a, v){
        return a + (Math.max.apply(null, v) - Math.min.apply(null, v));
      }, 0);
    }
    const lost = cartThick('kneeHealthy') - cartThick('kneeDamaged');
    const narrowed = gapH - gapD;
    ok(Math.abs(lost - narrowed) <= 4,
       'الضيق (' + narrowed + ') لا يطابق فقد الغضروف (' + lost + ') — فالفرق يقع على السائل');
  });


  it('غضروف الحالة المتضرّرة أرقّ ومفقود في موضع', async function(){
    const { doc } = await page();
    function cartWidth(id){
      return Array.prototype.map.call(doc.querySelectorAll('#' + id + ' .cart-f'), function(n){
        const xs = pathPoints(n.getAttribute('d')).map(p => p[0]);
        return Math.max(...xs) - Math.min(...xs);
      });
    }
    const healthy = cartWidth('kneeHealthy'), damaged = cartWidth('kneeDamaged');
    eq(healthy.length, 2, 'السليم ليس فيه طبقتا غضروف');
    ok(damaged.length > 2, 'الغضروف المتضرّر ليس مقطّعًا — لا يظهر أنه مفقود في موضع');
    const totalD = damaged.reduce(function(a, b){ return a + b; }, 0);
    const totalH = healthy.reduce(function(a, b){ return a + b; }, 0);
    ok(totalD < totalH, 'مجموع امتداد الغضروف المتضرّر ليس أقلّ من السليم');
  });

  /* لا تورّم في هذا المشهد: ليس فيه نسيج يتورّم (لا جلد ولا دهن ولا
     عضلة)، فأي هالة حوله تُقرأ ضبابًا. والمشهد مجرَّد عمدًا ليعزل
     الغضروف. وحُذف معه ذكرُه من الخيار والتغذية: ما لا يُعطى لا يُقاس. */
  it('لا تورّم مرسومًا، ولا ذكر له في خيار ولا تغذية', async function(){
    const { doc, raw } = await page();
    eq(doc.querySelectorAll('#kneeDamaged .swell-f').length, 0, 'التورّم عاد إلى الرسم');
    const grp = doc.querySelector('.quiz-options[data-q="u2l3-symptoms"]');
    const right = grp.querySelector('input[value="correct"]').parentElement.textContent;
    no(/تورّم|تورم/.test(right), 'الخيار الصحيح يذكر تورّمًا غير مرسوم: ' + right);
    /* والفرق المقيس هو الغضروف — وهو ما يطلبه سطر وصف المشهد */
    ok(/غضروف/.test(right), 'الخيار لا يذكر الغضروف');
    const fb = /correct:\s*'✓ صحيح![^']*'/.exec(raw.slice(raw.indexOf('symptoms:')));
    if(fb) no(/تورّم|تورم/.test(fb[0]), 'التغذية تذكر تورّمًا غير مرسوم');
  });

  /* ما يُختار في الرسم لأجل الوضوح لا يُصاغ في الجواب كأنه قاعدة:
     تآكل الغضروف يبدأ حيث يقع الحمل والاحتكاك، ويختلف بالمفصل
     والسبب — فلا يُقال إنّ موضعه الوسط. */
  it('الخيار لا يثبّت موضع اختفاء الغضروف كأنه قاعدة علمية', async function(){
    const { doc } = await page();
    const grp = doc.querySelector('.quiz-options[data-q="u2l3-symptoms"]');
    const right = grp.querySelector('input[value="correct"]').parentElement.textContent;
    no(/وسط/.test(right), 'الخيار يجعل الوسط موضعًا لازمًا: ' + right);
    ok(/موضع/.test(right), 'الخيار لا يترك الموضع مفتوحًا');
  });

  it('لا شيء يخرج عن الحدود في أيٍّ من الحالتين', async function(){
    const { doc } = await page();
    const bad = outOfBounds(doc.getElementById('dmgStage'));
    eq(bad.length, 0, 'خارج الحدود: ' + bad.join(' · '));
  });
});

/* ---------- حرّاس عامّة ---------- */
describe('هندسة الدرس 03 — حرّاس عامّة', function(){
  it('حارس اللصق: لا عنصران مختلفان دلاليًّا يحملان مسار d متطابقًا', async function(){
    const { doc } = await page();
    const seen = {}, dupes = [];
    doc.querySelectorAll('svg path[d]').forEach(function(n){
      const d = n.getAttribute('d').replace(/\s+/g, ' ').trim();
      if(d.length < 30) return;                       // أقواس قصيرة تتكرّر بلا دلالة
      /* عظما الحالتين السليمة والمتضرّرة متطابقان عمدًا — الفرق في
         الغضروف والتجويف وحدهما. فيُفصل مجالهما بالمجموعة، ويبقى
         الحارس عاملًا داخل كل مجموعة على حدة. */
      const grp = n.closest('#kneeHealthy') ? 'H:' : (n.closest('#kneeDamaged') ? 'D:' : '');
      const key = grp + d;
      if(seen[key]) dupes.push((seen[key].id || seen[key].getAttribute('class')) + ' = ' +
                               (n.id || n.getAttribute('class')));
      else seen[key] = n;
    });
    eq(dupes.length, 0, 'مسارات ملصوقة: ' + dupes.join(' · '));
  });

  it('لكل حاوية مسرح max-width صريح فلا تتمدّد عموديًّا بلا داعٍ', async function(){
    const { raw } = await page();
    ['.stage-wrap{', '.knee-wrap{', '.joint-cell{', '.img-cell{'].forEach(function(sel){
      const block = new RegExp(sel.replace('.', '\\.').replace('{', '\\{') + '[^}]*max-width');
      ok(block.test(raw), 'بلا max-width: ' + sel);
    });
  });

  it('لكل مسرح viewBox معلن ولا مسرح بأبعاد مطلقة', async function(){
    const { doc } = await page();
    ['dissectStage', 'fricStage', 'kneeStage', 'shoulderStage', 'elbowStage', 'dmgStage']
      .forEach(function(id){
        const svg = doc.getElementById(id);
        ok(svg, 'مسرح مفقود: ' + id);
        ok(svg.getAttribute('viewBox'), id + ' بلا viewBox');
        no(svg.hasAttribute('width'), id + ' بعرض مطلق');
      });
  });

  it('معرّفات SVG فريدة عبر المسارح كلّها', async function(){
    const { doc } = await page();
    const ids = [];
    doc.querySelectorAll('svg [id]').forEach(function(n){ ids.push(n.id); });
    eq(ids.length, new Set(ids).size, 'معرّف SVG مكرّر: ' +
       ids.filter(function(v, i){ return ids.indexOf(v) !== i; }).join(', '));
  });

  it('scroll-margin-top على .station', async function(){
    const { raw } = await page();
    ok(/\.station\{\s*scroll-margin-top:\s*14px/.test(raw));
  });
});

run();
