'use strict';
/* ==========================================================
   فحص عددي لمسارح الدرس 05
   ----------------------------------------------------------
   الاختبار المنطقي يسأل «هل العنصر موجود؟». هذا الملف يسأل
   «هل هو في مكانه؟»: هل يخرج شيء عن حدود المشهد؟ هل تتلاصق
   علامتان؟ هل التداخل ضحل ولا يعبره مستوى داخلي؟ هل الزوج
   عمود أم صفّ؟ هل الأيونات داخل إطار القطعة؟
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-01/lesson-05.html';

async function page(){ return h.loadLesson(LESSON); }

/* ---- أدوات هندسية: تُقرأ من الوسم لا من تخطيط المتصفّح،
        فjsdom لا يحسب تخطيط SVG أصلًا ---- */
function num(el, name, dflt){
  const v = el.getAttribute(name);
  return v === null ? (dflt === undefined ? 0 : dflt) : parseFloat(v);
}

function translateOf(el){
  const t = el.getAttribute('transform') || '';
  const m = /translate\(\s*(-?[\d.]+)\s*,?\s*(-?[\d.]+)?\s*\)/.exec(t);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2] || 0) } : { x: 0, y: 0 };
}

// إزاحة تراكمية حتى جذر الـsvg
function offsetOf(el, root){
  let x = 0, y = 0, n = el;
  while(n && n !== root){
    const t = translateOf(n);
    x += t.x; y += t.y;
    n = n.parentNode;
  }
  return { x, y };
}

function boundsOf(el, root){
  const off = offsetOf(el, root);
  const tag = el.tagName.toLowerCase();
  if(tag === 'circle'){
    const r = num(el, 'r');
    return { x1: off.x + num(el, 'cx') - r, y1: off.y + num(el, 'cy') - r,
             x2: off.x + num(el, 'cx') + r, y2: off.y + num(el, 'cy') + r };
  }
  if(tag === 'rect'){
    return { x1: off.x + num(el, 'x'), y1: off.y + num(el, 'y'),
             x2: off.x + num(el, 'x') + num(el, 'width'),
             y2: off.y + num(el, 'y') + num(el, 'height') };
  }
  if(tag === 'line'){
    return { x1: Math.min(off.x + num(el, 'x1'), off.x + num(el, 'x2')),
             y1: Math.min(off.y + num(el, 'y1'), off.y + num(el, 'y2')),
             x2: Math.max(off.x + num(el, 'x1'), off.x + num(el, 'x2')),
             y2: Math.max(off.y + num(el, 'y1'), off.y + num(el, 'y2')) };
  }
  if(tag === 'text'){
    // تقدير عرض النصّ: كافٍ لكشف الخروج عن الحدود لا لقياس دقيق
    const size = parseFloat((el.getAttribute('class') || '').indexOf('callout') >= 0 ? 12 : 16);
    const w = (el.textContent || '').length * size * 0.55;
    const x = off.x + num(el, 'x'), y = off.y + num(el, 'y');
    return { x1: x - w / 2, y1: y - size, x2: x + w / 2, y2: y + size * 0.35 };
  }
  return null;
}

function viewBox(svg){
  const p = (svg.getAttribute('viewBox') || '0 0 0 0').split(/\s+/).map(Number);
  return { x: p[0], y: p[1], w: p[2], h: p[3] };
}

// كل عنصر مرسوم داخل حدود المشهد؟ ترجع قائمة المخالفات
function outOfBounds(svg, pad){
  pad = pad || 0;
  const vb = viewBox(svg);
  const bad = [];
  svg.querySelectorAll('circle, rect, line, text').forEach(el => {
    if(el.closest('defs')) return;
    const b = boundsOf(el, svg);
    if(!b) return;
    if(b.x1 < vb.x - pad || b.y1 < vb.y - pad ||
       b.x2 > vb.x + vb.w + pad || b.y2 > vb.y + vb.h + pad){
      bad.push(el.tagName + '.' + (el.getAttribute('class') || '') +
               ' [' + b.x1.toFixed(0) + ',' + b.y1.toFixed(0) + ' → ' +
               b.x2.toFixed(0) + ',' + b.y2.toFixed(0) + ']');
    }
  });
  return bad;
}

function centers(svg, sel){
  return Array.from(svg.querySelectorAll(sel)).map(n => {
    const off = offsetOf(n, svg);
    return { x: off.x + num(n, 'cx'), y: off.y + num(n, 'cy'), r: num(n, 'r'), node: n };
  });
}

function pos(node, root){
  const off = offsetOf(node, root);
  return { x: off.x, y: off.y };
}

function dist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }

/* ================= المحطة 1 ================= */
describe('المحطة 1 — ذرّة الألومنيوم', () => {
  it('لا شيء يخرج عن حدود المشهد في الحالة الأولى', async () => {
    const { doc } = await page();
    const bad = outOfBounds(doc.getElementById('stage1'));
    eq(bad.length, 0, bad.join(' · '));
  });

  it('ثلاث نقاط لا أكثر، وكلّها على المستوى الخارجي', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage1');
    const hit = svg.querySelector('.atom-hit');
    for(let i = 0; i < 5; i++) h.clickNode(hit);   // خمس نقرات: الرابعة فأكثر مرفوضة
    const dots = Array.from(svg.querySelectorAll('.atom .epos'));
    // 2 + 8 داخليًّا + 3 خارجيًّا للذرّة الأولى، ومثلها للثانية
    const outer = dots.map(d => pos(d, svg))
                      .filter(p => Math.abs(Math.hypot(p.x - 250, p.y - 165) - 68) < 2);
    eq(outer.length, 3, 'عدد إلكترونات المستوى الخارجي');
  });

  it('النقرة الرابعة تُبلَّغ ولا تُبتلع', async () => {
    const { doc } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 4; i++) h.clickNode(hit);
    has(doc.getElementById('s1msg').textContent, 'ثلاثة إلكترونات فقط');
  });

  it('محاولة النقل: الإلكترونات تعود إلى ذرّتها — ثلاثة لكلٍّ', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    await h.tick(w, 250);           // الحركة والارتداد ينتهيان أولًا
    const svg = doc.getElementById('stage1');
    [250, 650].forEach(cx => {
      const outer = Array.from(svg.querySelectorAll('.atom .outer-layer .epos'))
        .map(d => pos(d, svg))
        .filter(p => Math.abs(Math.hypot(p.x - cx, p.y - 165) - 68) < 9);
      eq(outer.length, 3, 'إلكترونات المستوى الخارجي عند ' + cx);
    });
  });

  it('محاولة النقل: لا شيء يخرج عن الحدود ولا إلكترون طائر خارج المستوى', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    await h.tick(w, 250);
    const svg = doc.getElementById('stage1');
    eq(outOfBounds(svg).length, 0);
    const stray = Array.from(svg.querySelectorAll('.atom .outer-layer .epos'))
      .map(d => pos(d, svg))
      .filter(p => Math.min(Math.hypot(p.x - 650, p.y - 165),
                            Math.hypot(p.x - 250, p.y - 165)) > 76);
    eq(stray.length, 0, 'إلكترون خارج أبعد مستوى');
  });

  it('محاولة المشاركة: التداخل ضحل ولا يعبره مستوى داخلي', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try2');
    await h.tick(w, 40);            // لحظة الاقتراب قبل العودة
    const svg = doc.getElementById('stage1');
    const nuclei = centers(svg, 'circle.nucleus');
    eq(nuclei.length, 2, 'ذرّتان');
    const d = Math.abs(nuclei[0].x - nuclei[1].x);
    const R = 68, R1 = 47;
    const overlap = 2 * R - d;
    ok(overlap > 20 && overlap < 50, 'عمق التداخل خارج المدى الضحل: ' + overlap.toFixed(1));
    ok(d / 2 > R1, 'المستوى الداخلي يعبر إلى مجال الذرّة الأخرى');
  });

  it('محاولة المشاركة: الأزواج أعمدة لا صفوف، وفي عمود واحد', async () => {
    const { doc, w } = await page();
    const hit = doc.querySelector('#stage1 .atom-hit');
    for(let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try2');
    await h.tick(w, 40);
    const svg = doc.getElementById('stage1');
    const pts = Array.from(svg.querySelectorAll('.shared-pairs .epos')).map(n => pos(n, svg));
    eq(pts.length, 6, 'ثلاثة أزواج');
    const xs = new Set(pts.map(p => p.x.toFixed(1)));
    eq(xs.size, 1, 'الأزواج ليست في عمود واحد');
    // كل زوج: فرق رأسي صغير وفرق أفقي معدوم
    const ys = pts.map(p => p.y).sort((a, b) => a - b);
    for(let i = 0; i < 6; i += 2){
      const gap = ys[i + 1] - ys[i];
      ok(gap > 6 && gap < 18, 'تباعد الزوج الرأسي غير سليم: ' + gap);
    }
  });
});

/* ================= المحطة 2 ================= */
describe('المحطة 2 — قطعة الصوديوم', () => {
  it('لا شيء يخرج عن حدود المشهد', async () => {
    const { doc } = await page();
    eq(outOfBounds(doc.getElementById('stage2')).length, 0);
  });

  it('الذرّات الستّ داخل إطار القطعة', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage2');
    const frame = svg.querySelector('.piece-frame rect') || svg.querySelector('rect');
    const fb = boundsOf(frame, svg);
    const nuclei = centers(svg, 'circle.nucleus');
    eq(nuclei.length, 6);
    nuclei.forEach(n => {
      ok(n.x - 68 >= fb.x1 && n.x + 68 <= fb.x2 &&
         n.y - 68 >= fb.y1 && n.y + 68 <= fb.y2,
         'ذرّة تتجاوز إطار القطعة عند ' + n.x + ',' + n.y);
    });
  });

  it('الذرّات لا يتداخل بعضها في بعض', async () => {
    const { doc } = await page();
    const nuclei = centers(doc.getElementById('stage2'), 'circle.nucleus');
    for(let i = 0; i < nuclei.length; i++){
      for(let j = i + 1; j < nuclei.length; j++){
        ok(dist(nuclei[i], nuclei[j]) >= 2 * 68 - 6,
           'تداخل بين ذرّتين: ' + dist(nuclei[i], nuclei[j]).toFixed(1));
      }
    }
  });

  it('بعد التحرير: ستّة أيونات وستّة إلكترونات حرّة داخل الإطار', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage2');
    svg.querySelectorAll('.epos.clickable').forEach(e => h.clickNode(e));
    eq(svg.querySelectorAll('.ion').length, 6);
    const free = Array.from(svg.querySelectorAll('.sea-layer .epos')).map(n => pos(n, svg));
    eq(free.length, 6);
    const fb = boundsOf(svg.querySelector('rect'), svg);
    free.forEach(p => ok(p.x > fb.x1 && p.x < fb.x2 && p.y > fb.y1 && p.y < fb.y2,
                         'إلكترون حرّ خارج إطار القطعة'));
  });

  it('لا تكرار لرمز العنصر خارج القرص — الاسم والشحنة معًا داخله وحده', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage2');
    svg.querySelectorAll('.epos.clickable').forEach(e => h.clickNode(e));
    const ion = svg.querySelector('.ion');
    eq(ion.querySelectorAll('.ion-symbol').length, 0, 'رمز مكرَّر تحت الدائرة');
    const sign = ion.querySelector('.ion-sign');
    has(sign.textContent, 'Na');
    has(sign.textContent, '+');
    const body = ion.querySelector('.ion-body');
    ok(num(sign, 'y') > num(body, 'cy') - num(body, 'r') &&
       num(sign, 'y') < num(body, 'cy') + num(body, 'r'),
       'رمز الأيون يقع خارج دائرته');
  });
});

/* ================= المحطة 3 ================= */
describe('المحطة 3 — الشكلان', () => {
  it('الكرات كلّها داخل حدود الشكل 1-30', async () => {
    const { doc } = await page();
    eq(outOfBounds(doc.getElementById('fig30')).length, 0);
  });

  it('الشكل 1-30 بلا أي إشارة شحنة ولا إلكترون ظاهر', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('fig30');
    eq(svg.querySelectorAll('.ion-sign').length, 0);
    eq(svg.querySelectorAll('.edot').length, 0);
  });

  it('الشكل 1-31 فيه أيونات موجبة وإلكترونات حرّة معًا', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('fig31');
    ok(svg.querySelectorAll('.ion-sign').length >= 12, 'أيونات الشكل المسطّح');
    ok(svg.querySelectorAll('.edot.free').length >= 12, 'إلكترونات الشكل المسطّح');
  });

  it('التسميات لا تظهر قبل الإجابة ولا تخرج عن الحدود بعدها', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('fig31');
    has(svg.querySelector('.fig31-callouts').getAttribute('class'), 'is-off');
    h.choose(doc, 'greySpheres', 'correct');
    no(/is-off/.test(svg.querySelector('.fig31-callouts').getAttribute('class')));
    eq(outOfBounds(svg, 4).length, 0, 'تسمية تخرج عن حدود الشكل');
  });
});

/* ================= المحطة 4 ================= */
describe('المحطة 4 — بناء البحر', () => {
  it('الأيونات داخل إطار القطعة في المسرحين', async () => {
    const { doc } = await page();
    ['stage4a', 'stage4b'].forEach(id => {
      const svg = doc.getElementById(id);
      const fb = boundsOf(svg.querySelector('.piece-frame rect'), svg);
      centers(svg, '.ion-body').forEach(c => {
        ok(c.x - c.r >= fb.x1 && c.x + c.r <= fb.x2, id + ': أيون خارج الإطار');
      });
    });
  });

  it('الإلكترونات المضافة تقع داخل الإطار', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage4a');
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    const fb = boundsOf(svg.querySelector('.piece-frame rect'), svg);
    const free = Array.from(svg.querySelectorAll('.sea-layer .epos')).map(n => pos(n, svg));
    eq(free.length, 8);
    free.forEach(p => ok(p.x > fb.x1 && p.x < fb.x2 && p.y > fb.y1 && p.y < fb.y2,
                         'إلكترون مضاف خارج إطار القطعة'));
  });

  it('لا شيء يخرج عن حدود المشهدين', async () => {
    const { doc } = await page();
    h.type(doc, 's4aInput', '8'); h.click(doc, 's4aCheck');
    eq(outOfBounds(doc.getElementById('stage4a')).length, 0);
    eq(outOfBounds(doc.getElementById('stage4b')).length, 0);
  });
});

/* ================= المحطة 5 ================= */
describe('المحطة 5 — السلك واللوحان', () => {
  it('أيونات السلك وإلكتروناته داخل جسم السلك', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage5a');
    const wire = boundsOf(svg.querySelector('.wire-body'), svg);
    centers(svg, '.ion-body').forEach(c => {
      ok(c.x - c.r >= wire.x1 && c.x + c.r <= wire.x2 &&
         c.y - c.r >= wire.y1 && c.y + c.r <= wire.y2, 'أيون خارج السلك');
    });
    const free = Array.from(svg.querySelectorAll('.sea-layer .epos')).map(n => pos(n, svg));
    ok(free.length >= 10, 'السلك مليء بالإلكترونات قبل وصل البطارية');
    free.forEach(p => ok(p.x > wire.x1 && p.x < wire.x2 && p.y > wire.y1 && p.y < wire.y2,
                         'إلكترون خارج السلك'));
  });

  it('البطارية خارج السلك لا فوقه', async () => {
    const { doc } = await page();
    const svg = doc.getElementById('stage5a');
    const wire = boundsOf(svg.querySelector('.wire-body'), svg);
    const box = boundsOf(svg.querySelector('.battery-box'), svg);
    ok(box.x2 <= wire.x1, 'صندوق البطارية يتداخل مع السلك');
  });

  it('لوحا الحرارة لا يتداخلان ولا يخرجان عن الحدود', async () => {
    const { doc } = await page();
    h.click(doc, 's5connect');
    h.choose(doc, 'whatMoves', 'correct');
    const svg = doc.getElementById('stage5b');
    eq(outOfBounds(svg, 14).length, 0, outOfBounds(svg, 14).join(' · '));
    const panes = Array.from(svg.querySelectorAll('rect')).filter(r => num(r, 'width') === 380);
    eq(panes.length, 2, 'لوحان');
    const a = boundsOf(panes[0], svg), b = boundsOf(panes[1], svg);
    ok(a.x1 > b.x2 || b.x1 > a.x2, 'اللوحان متداخلان');
  });

  it('لوح المادة الأخرى بلا إلكترونات حرّة — وهو الفرق المقصود', async () => {
    const { doc } = await page();
    h.click(doc, 's5connect');
    h.choose(doc, 'whatMoves', 'correct');
    const svg = doc.getElementById('stage5b');
    const plain = Array.from(svg.querySelectorAll('.plain-particle'));
    ok(plain.length >= 12, 'جسيمات المادة الأخرى');
    // البحر الوحيد يعيش في نصف الفلزّ (اليمين)
    const free = Array.from(svg.querySelectorAll('.sea-layer .epos')).map(n => pos(n, svg));
    ok(free.length > 0, 'لوح الفلزّ بلا بحر');
    free.forEach(p => ok(p.x > 450, 'إلكترون حرّ ظهر في لوح المادة الأخرى'));
  });
});

/* ================= المحطة 6 ================= */
describe('المحطة 6 — الشبكة والانزلاق', () => {
  async function reach(){
    const s = await page();
    h.choose(s.doc, 'naVsMg', 'correct');
    return s;
  }

  it('الأيونات كلّها داخل إطار القطعة قبل الانزلاق', async () => {
    const { doc } = await reach();
    const svg = doc.getElementById('stage6');
    const fb = boundsOf(svg.querySelector('.piece-frame rect'), svg);
    centers(svg, '.ion-body').forEach(c => {
      ok(c.x - c.r >= fb.x1 && c.x + c.r <= fb.x2 &&
         c.y - c.r >= fb.y1 && c.y + c.r <= fb.y2, 'أيون خارج الإطار');
    });
  });

  it('صفوف ثلاثة، والعلوي وحده قابل للسحب', async () => {
    const { doc } = await reach();
    const svg = doc.getElementById('stage6');
    eq(svg.querySelectorAll('.slide-row').length, 1);
    eq(svg.querySelectorAll('.lattice-row').length, 2);
  });

  it('بعد الانزلاق: الصفّ تحرّك والبحر ما زال محيطًا بالأيونات كلّها', async () => {
    const { doc } = await reach();
    const svg = doc.getElementById('stage6');
    h.click(doc, 's6keyboard');
    const t = translateOf(svg.querySelector('.slide-row'));
    ok(Math.abs(t.x) >= 60, 'الصفّ لم ينزلق فعليًّا: ' + t.x);
    const fb = boundsOf(svg.querySelector('.piece-frame rect'), svg);
    centers(svg, '.ion-body').forEach(c => {
      ok(c.x - c.r >= fb.x1 - 2 && c.x + c.r <= fb.x2 + 2, 'أيون خرج من القطعة بعد الانزلاق');
    });
    ok(svg.querySelectorAll('.sea-layer .epos').length >= 10, 'البحر اختفى بعد الانزلاق');
  });

  it('البحر خلف الأيونات لا فوقها', async () => {
    const { doc } = await reach();
    const svg = doc.getElementById('stage6');
    const kids = Array.from(svg.childNodes).filter(n => n.nodeType === 1);
    const seaIdx = kids.findIndex(n => (n.getAttribute('class') || '').indexOf('sea-layer') >= 0);
    const rowIdx = kids.findIndex(n => (n.getAttribute('class') || '').indexOf('slide-row') >= 0);
    ok(seaIdx >= 0 && rowIdx > seaIdx, 'ترتيب الرسم يضع البحر فوق الأيونات');
  });

  it('لا شيء يخرج عن حدود المشهد بعد الانزلاق', async () => {
    const { doc } = await reach();
    h.click(doc, 's6keyboard');
    eq(outOfBounds(doc.getElementById('stage6')).length, 0);
  });
});

run();
