'use strict';
/* ==========================================================
   فحص هندسي عددي — الوحدة 01 · الدرس 01
   ----------------------------------------------------------
   jsdom لا يحسب تخطيطًا ولا يرسم، فسؤال «هل يبدو هذا صحيحًا؟»
   يُترجَم هنا إلى حساب على قيَم السمات: مسافات، وأنصاف أقطار،
   وزوايا، وتراكب. وما لا يُترجَم يبقى للعين وحدها.

   والاختبارات تقيس صفةً لا وجودًا: «هل تتراكب النيوكليونات؟»
   لا «هل هي موجودة؟» — فعدّ العناصر لا يكشف نواةً تُقرأ لطخةً
   واحدة، ولا مستوى إلكتروناته متكدّسة في جهة.
   ========================================================== */

const { describe, it, eq, ok, no, run } = require('./run');
const h = require('./harness');

const FILE = 'semester-1/unit-01/lesson-01.html';

let cached = null;
async function page(){
  if(!cached) cached = await h.loadLesson(FILE, {});
  return cached;
}

/* ــــ أدوات قياس ــــ */
const num = (n, a) => parseFloat(n.getAttribute(a));
function viewBox(svg){
  const v = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  return { x: v[0], y: v[1], w: v[2], h: v[3], cx: v[0] + v[2] / 2, cy: v[1] + v[3] / 2 };
}
function circles(svg, sel){ return Array.from(svg.querySelectorAll(sel)); }
function centerDist(c, vb){ return Math.hypot(num(c, 'cx') - vb.cx, num(c, 'cy') - vb.cy); }
function minPairGap(list){
  let m = Infinity;
  for(let i = 0; i < list.length; i++){
    for(let j = i + 1; j < list.length; j++){
      const d = Math.hypot(num(list[i], 'cx') - num(list[j], 'cx'),
                           num(list[i], 'cy') - num(list[j], 'cy'));
      if(d < m) m = d;
    }
  }
  return m;
}
function outOfBounds(svg){
  const vb = viewBox(svg);
  return circles(svg, 'circle').filter(c => {
    const x = num(c, 'cx'), y = num(c, 'cy'), r = num(c, 'r');
    return x - r < vb.x || y - r < vb.y || x + r > vb.x + vb.w || y + r > vb.y + vb.h;
  }).map(c => c.getAttribute('class'));
}
function angles(list, vb){
  return list.map(c => {
    let a = Math.atan2(num(c, 'cy') - vb.cy, num(c, 'cx') - vb.cx) * 180 / Math.PI;
    return (a + 360) % 360;
  }).sort((p, q) => p - q);
}
function minAngularGap(list, vb){
  const a = angles(list, vb);
  if(a.length < 2) return 360;
  let m = 360;
  for(let i = 0; i < a.length; i++){
    const gap = i === a.length - 1 ? (360 - a[i] + a[0]) : (a[i + 1] - a[i]);
    if(gap < m) m = gap;
  }
  return m;
}
function buildFluorine(doc){
  for(let i = 0; i < 9;  i++) h.click(doc, 'addProton');
  for(let i = 0; i < 10; i++) h.click(doc, 'addNeutron');
  const rings = Array.from(doc.querySelectorAll('#atomStage circle.ring-hit'));
  for(let i = 0; i < 2; i++) h.clickNode(rings[0]);
  for(let i = 0; i < 7; i++) h.clickNode(rings[1]);
}

/* ══════════════ 1) مشهد الذهب ══════════════ */
describe('المحطة 1 — مشهد سبيكة الذهب', () => {
  it('حبيبات الذهب داخل العدسة لا خارجها', async () => {
    const { doc } = await page();
    const svg  = doc.getElementById('goldStage');
    const lens = svg.querySelector('circle.lens');
    const lx = num(lens, 'cx'), ly = num(lens, 'cy'), lr = num(lens, 'r');
    const stray = circles(svg, 'circle.grain').filter(g => {
      const d = Math.hypot(num(g, 'cx') - lx, num(g, 'cy') - ly);
      return d - num(g, 'r') > lr;
    });
    eq(stray.length, 0, 'حبيبات خارج دائرة العدسة كليًّا — القصّ يخفيها والرسم يحملها بلا داع');
    ok(svg.querySelector('clipPath'), 'العدسة بلا حدّ قصّ فتفيض حبيباتها على المشهد');
  });

  it('السبائك لا تتراكب مع العدسة فيبقى المشهدان مقروءَين', async () => {
    const { doc } = await page();
    const svg  = doc.getElementById('goldStage');
    const lens = svg.querySelector('circle.lens');
    const lx = num(lens, 'cx'), lr = num(lens, 'r');
    const bars = Array.from(svg.querySelectorAll('rect.bar'));
    eq(bars.length, 3);
    bars.forEach(b => {
      const right = num(b, 'x') + num(b, 'width');
      ok(right < lx - lr, 'سبيكة تدخل في دائرة العدسة');
    });
  });

  it('لا شيء يخرج عن حدود المشهد', async () => {
    const { doc } = await page();
    eq(outOfBounds(doc.getElementById('goldStage')).length, 0);
  });
});

/* ══════════════ 2) راسم الذرّة — الفلور ══════════════ */
describe('المحطة 2 — هندسة راسم الذرّة', () => {
  let S = null;
  async function built(){
    if(!S){
      S = await h.loadLesson(FILE, {});
      buildFluorine(S.doc);
    }
    return S;
  }

  it('النيوكليونات كلّها داخل النواة ولا واحد منها يتجاوز حدّها', async () => {
    const { doc } = await built();
    const svg = doc.getElementById('atomStage');
    const vb  = viewBox(svg);
    const rNuc = num(svg.querySelector('circle.nucleus-bg'), 'r');
    const parts = circles(svg, 'circle.p, circle.n');
    eq(parts.length, 19, 'عدد نيوكليونات الفلور');
    const far = Math.max.apply(null, parts.map(c => centerDist(c, vb) + num(c, 'r')));
    ok(far <= rNuc, 'نيوكليون يتجاوز حدّ النواة: ' + far.toFixed(2) + ' > ' + rNuc);
  });

  it('النيوكليونات لا تتراكب فلا تُقرأ النواة لطخةً واحدة', async () => {
    const { doc } = await built();
    const svg = doc.getElementById('atomStage');
    const parts = circles(svg, 'circle.p, circle.n');
    const r = num(parts[0], 'r');
    const gap = minPairGap(parts);
    ok(gap >= 2 * r, 'تراكب: أقلّ تباعد ' + gap.toFixed(2) + ' وقطر الجسيم ' + (2 * r).toFixed(2));
    ok(gap <= 2 * r + 6, 'النواة مفكّكة: فراغ ' + (gap - 2 * r).toFixed(2) + ' بين جسيمين');
  });

  it('الفرق بين البروتون والنيوترون يحمله الشكل لا اللون وحده', async () => {
    const { doc } = await built();
    const svg = doc.getElementById('atomStage');
    eq(svg.querySelectorAll('.nuc text').length, 9, 'علامة + على كل بروتون');
    const size = parseFloat(svg.querySelector('.nuc text').getAttribute('font-size'));
    const r = num(svg.querySelector('circle.p'), 'r');
    ok(size >= r, 'العلامة أصغر من أن تُقرأ داخل الجسيم');
  });

  it('كلّ إلكترون يقع على مستواه بلا انحراف', async () => {
    const { doc } = await built();
    const svg = doc.getElementById('atomStage');
    const vb = viewBox(svg);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r'));
    eq(radii.length, 2, 'مستويا ذرّة الفلور');
    circles(svg, 'circle.e').forEach(e => {
      const d = centerDist(e, vb);
      const near = Math.min.apply(null, radii.map(r => Math.abs(d - r)));
      ok(near < 0.6, 'إلكترون خارج مستواه بمقدار ' + near.toFixed(2));
    });
  });

  it('إلكترونا المستوى الداخلي متقابلان، وسبعة الخارجي موزّعة بالتساوي', async () => {
    const { doc } = await built();
    const svg = doc.getElementById('atomStage');
    const vb = viewBox(svg);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
    const inner = circles(svg, 'circle.e').filter(e => Math.abs(centerDist(e, vb) - radii[0]) < 0.6);
    const outer = circles(svg, 'circle.e').filter(e => Math.abs(centerDist(e, vb) - radii[1]) < 0.6);
    eq(inner.length, 2, 'إلكترونات المستوى الداخلي');
    eq(outer.length, 7, 'إلكترونات المستوى الخارجي');
    ok(Math.abs(minAngularGap(inner, vb) - 180) < 1, 'الإلكترونان غير متقابلين');
    const gap = minAngularGap(outer, vb);
    ok(gap > 40, 'إلكترونان متجاوران في المستوى الخارجي يكادان يتلامسان: ' + gap.toFixed(1) + '°');
  });

  /* قرار نطاق يُحرَس هندسيًّا: سبعة إلكترونات موزّعة بانتظام على
     المستوى الخارجي، بلا خانة شاغرة ثامنة. الخانة الشاغرة تعلن سعةً
     مقدارها ثمانية — وسعة المستويات محتوى درس 02 لا هذا الدرس. */
  it('المستوى الخارجي بلا خانة شاغرة تعلن سعةً لم تُدرَّس بعد', async () => {
    const { doc } = await built();
    const svg = doc.getElementById('atomStage');
    const vb = viewBox(svg);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
    const outer = circles(svg, 'circle.e').filter(e => Math.abs(centerDist(e, vb) - radii[1]) < 0.6);
    const a = angles(outer, vb);
    let widest = 360 - a[a.length - 1] + a[0], narrowest = widest;
    for(let i = 0; i < a.length - 1; i++){
      const gap = a[i + 1] - a[i];
      widest = Math.max(widest, gap);
      narrowest = Math.min(narrowest, gap);
    }
    ok(widest - narrowest < 3,
       'تفاوت الفجوات ' + (widest - narrowest).toFixed(1) + '° — خانة شاغرة تُقرأ سعةً');
  });

  it('لا شيء يخرج عن حدود المسرح', async () => {
    const { doc } = await built();
    eq(outOfBounds(doc.getElementById('atomStage')).length, 0);
  });
});

/* ══════════════ 3) ثبات المواضع أثناء البناء ══════════════ */
describe('المحطة 2 — ما وُضع لا يقفز حين يُضاف ما بعده', () => {
  it('مواضع النيوكليونات الموضوعة لا تتبدّل بإضافة غيرها', async () => {
    const s = await h.loadLesson(FILE, {});
    const doc = s.doc;
    for(let i = 0; i < 3; i++) h.click(doc, 'addProton');
    const before = circles(doc.getElementById('atomStage'), 'circle.p')
      .map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy'));
    for(let i = 0; i < 4; i++) h.click(doc, 'addNeutron');
    for(let i = 0; i < 3; i++) h.click(doc, 'addProton');
    const after = circles(doc.getElementById('atomStage'), 'circle.p')
      .map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy')).slice(0, 3);
    eq(after.join(' | '), before.join(' | '), 'ما وضعه الطالب أوّلًا زحف عن مكانه');
  });

  it('مواضع الإلكترونات الموضوعة لا تتبدّل بإضافة غيرها', async () => {
    const s = await h.loadLesson(FILE, {});
    const doc = s.doc;
    for(let i = 0; i < 9;  i++) h.click(doc, 'addProton');
    for(let i = 0; i < 10; i++) h.click(doc, 'addNeutron');
    const rings = () => Array.from(doc.querySelectorAll('#atomStage circle.ring-hit'));
    h.clickNode(rings()[1]);
    const first = circles(doc.getElementById('atomStage'), 'circle.e')
      .map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy'))[0];
    h.clickNode(rings()[1]);
    h.clickNode(rings()[1]);
    const still = circles(doc.getElementById('atomStage'), 'circle.e')
      .map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy'))[0];
    eq(still, first, 'الإلكترون الأوّل انزاح حين أُضيف الذي بعده');
  });
});

/* ══════════════ 4) نموذج النيون المرجعي ══════════════ */
describe('المحطة 2 — نموذج النيون المرجعي', () => {
  it('عشرون نيوكليونًا ومستويان بإلكترونين وثمانية', async () => {
    const s = await h.loadLesson(FILE, {});
    const doc = s.doc;
    for(let i = 0; i < 9;  i++) h.click(doc, 'addProton');
    for(let i = 0; i < 10; i++) h.click(doc, 'addNeutron');
    const svg = doc.getElementById('neonFig');
    const vb  = viewBox(svg);
    eq(circles(svg, 'circle.p').length, 10);
    eq(circles(svg, 'circle.n').length, 10);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
    eq(radii.length, 2);
    const inner = circles(svg, 'circle.e').filter(e => Math.abs(centerDist(e, vb) - radii[0]) < 0.6);
    const outer = circles(svg, 'circle.e').filter(e => Math.abs(centerDist(e, vb) - radii[1]) < 0.6);
    eq(inner.length, 2, 'المستوى الداخلي في نموذج النيون');
    eq(outer.length, 8, 'المستوى الخارجي في نموذج النيون');
    eq(outOfBounds(svg).length, 0);
  });

  it('المستوى الخارجي للنيون ممتلئ بلا فجوة — وهو ما يميّزه عن الفلور', async () => {
    const s = await h.loadLesson(FILE, {});
    const doc = s.doc;
    for(let i = 0; i < 9;  i++) h.click(doc, 'addProton');
    for(let i = 0; i < 10; i++) h.click(doc, 'addNeutron');
    const svg = doc.getElementById('neonFig');
    const vb  = viewBox(svg);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
    const outer = circles(svg, 'circle.e').filter(e => Math.abs(centerDist(e, vb) - radii[1]) < 0.6);
    const a = angles(outer, vb);
    let widest = 360 - a[a.length - 1] + a[0];
    for(let i = 0; i < a.length - 1; i++) widest = Math.max(widest, a[i + 1] - a[i]);
    ok(widest < 55, 'فجوة في مستوى النيون الخارجي رغم امتلائه: ' + widest.toFixed(1) + '°');
  });
});

/* ══════════════ 5) مسرح تكوين الأيون ══════════════ */
describe('المحطة 5 — هندسة مسرح الأيون', () => {
  let S = null;
  async function stage(){
    if(!S){
      S = await h.loadLesson(FILE, {});
      h.choose(S.doc, 'l1ionPredict', 'e');
    }
    return S;
  }

  it('الصوديوم: ثلاثة مستويات بإلكترونات 2 و8 و1', async () => {
    const { doc } = await stage();
    const svg = doc.getElementById('ionStage');
    const vb  = viewBox(svg);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
    eq(radii.length, 3);
    const per = radii.map(r => circles(svg, 'circle.e')
      .filter(e => Math.abs(centerDist(e, vb) - r) < 0.6).length);
    eq(per.join('-'), '2-8-1', 'توزيع إلكترونات الصوديوم على مستوياته');
    eq(circles(svg, 'circle.p').length, 11);
    eq(circles(svg, 'circle.n').length, 12);
    eq(outOfBounds(svg).length, 0);
  });

  it('بعد نزع الإلكترون لا تبقى حلقة فارغة تُقرأ مستوًى موجودًا', async () => {
    const { doc } = await stage();
    h.click(doc, 'ionRemove');
    const svg = doc.getElementById('ionStage');
    const vb  = viewBox(svg);
    const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
    eq(radii.length, 2, 'المستوى الذي فرغ ما زال مرسومًا');
    const per = radii.map(r => circles(svg, 'circle.e')
      .filter(e => Math.abs(centerDist(e, vb) - r) < 0.6).length);
    eq(per.join('-'), '2-8');
    eq(circles(svg, 'circle.p').length, 11, 'النواة تغيّرت وما كان يجب أن تتغيّر');
  });

  it('الفلور في المسرح نفسه: 2 و7 قبل الكسب، و2 و8 بعده', async () => {
    const { doc } = await stage();
    h.click(doc, 'ionSwitch');
    const svg = doc.getElementById('ionStage');
    const vb  = viewBox(svg);
    const read = () => {
      const radii = circles(svg, 'circle.ring').map(c => num(c, 'r')).sort((a, b) => a - b);
      return radii.map(r => circles(svg, 'circle.e')
        .filter(e => Math.abs(centerDist(e, vb) - r) < 0.6).length).join('-');
    };
    eq(read(), '2-7', 'ذرّة الفلور قبل الكسب');
    eq(circles(svg, 'circle.p').length, 9);
    h.click(doc, 'ionAdd');
    eq(read(), '2-8', 'أيون الفلوريد بعد الكسب');
    eq(circles(svg, 'circle.n').length, 10, 'النيوترونات تغيّرت وما كان يجب');
    eq(outOfBounds(svg).length, 0);
  });
});

/* ══════════════ 6) المعرّفات داخل SVG ══════════════ */
describe('معرّفات SVG لا تتصادم', () => {
  it('كلّ معرّف في الصفحة فريد', async () => {
    const { doc } = await page();
    const seen = {}, dup = [];
    Array.from(doc.querySelectorAll('[id]')).forEach(n => {
      const id = n.id;
      if(seen[id]) dup.push(id);
      seen[id] = true;
    });
    eq(dup.length, 0, 'معرّفات مكرّرة: ' + dup.join(' · '));
  });
});

run();
