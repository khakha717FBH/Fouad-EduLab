'use strict';
/* =========================================================
   فحص هندسي للمسارح
   ---------------------------------------------------------
   الاختبار المنطقي يسأل «هل العنصر موجود؟» ولا يسأل «هل هو
   مقروء؟». هذا الملف يسأل الثاني عدديًّا: هل يخرج شيء عن حدود
   المشهد؟ وهل تتداخل علامةٌ مع علامة؟ وهل يقع إلكترون ذرّةٍ
   داخل مجال الذرّة المقابلة؟
   ========================================================= */
const { describe, it, ok, no, eq, run } = require('./run');
const h = require('./harness');
const f = require('./flows-l4');

function marks(doc, svgId) {
  return Array.from(doc.querySelectorAll('#' + svgId + ' .epos')).map(n => {
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(n.getAttribute('transform') || '');
    return { x: +m[1], y: +m[2], shared: n.classList.contains('shared') };
  });
}
function box(doc, svgId) {
  const svg = doc.getElementById(svgId);
  const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  return { w: vb[2], h: vb[3] };
}
function circles(doc, svgId, sel) {
  return Array.from(doc.querySelectorAll('#' + svgId + ' ' + sel))
    .map(c => ({ cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), r: +c.getAttribute('r') }));
}

/** لا شيء يخرج عن المشهد، مع هامش */
function within(doc, svgId, margin) {
  const b = box(doc, svgId);
  const bad = [];
  circles(doc, svgId, 'circle.orbit').forEach(c => {
    if (c.cx - c.r < margin || c.cx + c.r > b.w - margin ||
        c.cy - c.r < margin || c.cy + c.r > b.h - margin) bad.push('مدار ' + c.cx + ',' + c.cy);
  });
  marks(doc, svgId).forEach(m => {
    if (m.x < margin || m.x > b.w - margin || m.y < margin || m.y > b.h - margin) {
      bad.push('علامة ' + m.x.toFixed(0) + ',' + m.y.toFixed(0));
    }
  });
  return bad;
}

/** أقرب مسافة بين علامتين — يجب أن تبقى فوق حدّ القراءة */
function minGap(list) {
  let min = Infinity, pair = null;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const d = Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y);
      if (d < min) { min = d; pair = [list[i], list[j]]; }
    }
  }
  return { min, pair };
}

const S = { ready: null };
S.boot = function () {
  if (!S.ready) S.ready = f.load().then(r => Object.assign(S, r));
  return S.ready;
};

describe('مشهد المحطة الأولى', () => {
  it('ذرّتا كلور متباعدتان بلا تفاعل ولا عدّاد ولا صيغة', async () => {
    const { doc } = await S.boot();
    const outer = circles(doc, 'stage1', 'circle.orbit-shell-2');
    eq(outer.length, 2, 'ذرّتان');
    const gap = Math.abs(outer[1].cx - outer[0].cx) - outer[0].r - outer[1].r;
    ok(gap > 40, 'الذرّتان متقاربتان: الفرجة ' + gap.toFixed(0));
    eq(doc.querySelectorAll('#stage1 .epos.clickable').length, 0, 'إلكترون قابل للنقر في مشهد ساكن');
    eq(doc.querySelectorAll('#stage1 .ecount').length, 0, 'عدّاد في مشهد التنشيط');
    eq(doc.querySelectorAll('#stage1 .formula-label').length, 0, 'صيغة قبل الارتباط');
  });

  it('والتوزيع كامل: 17 علامة لكل ذرّة، ورمزها في نواتها', async () => {
    const { doc } = await S.boot();
    eq(doc.querySelectorAll('#stage1 .edot').length, 17, 'ذرّة النقاط');
    eq(doc.querySelectorAll('#stage1 .ecross').length, 17, 'ذرّة الصلبان');
    const syms = Array.from(doc.querySelectorAll('#stage1 text.nucleus-label'))
      .map(t => t.textContent.trim());
    eq(syms.join(','), 'Cl,Cl');
  });

  it('ولا شيء يخرج عن حدوده', async () => {
    const { doc } = await S.boot();
    const bad = within(doc, 'stage1', 8);
    eq(bad.length, 0, bad.join(' · '));
  });
});

describe('هندسة مسرح الكلور', () => {
  it('الذرّتان متداخلتان من البداية ولا تتحرّكان', async () => {
    const { w, doc } = await S.boot();
    h.choose(doc, 'clValence', 'correct'); await h.tick(w, 20);
    h.choose(doc, 'clNeeds', 'correct'); await h.tick(w, 60);
    const outer = circles(doc, 'stage2', 'circle.orbit-shell-2');
    eq(outer.length, 2, 'مستويان خارجيان');
    const before = outer.map(o => o.cx).join(',');
    await f.makePair(w, doc, 'stage2');
    await h.tick(w, 300);
    const after = circles(doc, 'stage2', 'circle.orbit-shell-2').map(o => o.cx).join(',');
    eq(after, before, 'الذرّتان تحرّكتا — القرار أن يبقيا ثابتتين');
  });

  it('عمق التداخل يسع عمود الزوج المشترك ولا يزيد', async () => {
    const { doc } = await S.boot();
    const o = circles(doc, 'stage2', 'circle.orbit-shell-2');
    const overlap = o[0].r + o[1].r - Math.abs(o[1].cx - o[0].cx);
    ok(overlap >= 26, 'التداخل ' + overlap.toFixed(0) + ' لا يسع عمودًا');
    ok(overlap <= 60, 'التداخل ' + overlap.toFixed(0) + ' عميق: الذرّتان تغوصان');
  });

  it('والصيغة الكيميائية تظهر بعد اكتمال الرابطة لا قبلها', async () => {
    const { doc } = await S.boot();
    const fx = doc.querySelector('#stage2 text.formula-label');
    ok(fx, 'لا صيغة كيميائية في المشهد');
    ok(fx.classList.contains('show'), 'الصيغة لم تظهر بعد اكتمال الرابطة');
    eq(fx.textContent.replace(/\s/g, ''), 'Cl2', 'نصّ الصيغة');
    eq(fx.querySelectorAll('tspan').length, 2, 'الرقم المنخفض ليس tspan');
  });

  it('ولا مستوى داخلي يعبر إلى مجال الذرّة الأخرى', async () => {
    const { doc } = await S.boot();
    const outer = circles(doc, 'stage2', 'circle.orbit-shell-2');
    circles(doc, 'stage2', 'circle.orbit-shell-1').forEach(c => {
      const other = outer.find(o => Math.abs(o.cx - c.cx) > 1);
      const reach = Math.abs(other.cx - c.cx) - c.r;
      ok(reach >= other.r, 'مستوى داخلي يغوص ' + (other.r - reach).toFixed(0) + ' بكسل');
    });
  });

  it('الزوج المشترك عمود: النقطة فوق والصليب تحتها عند الموضع نفسه', async () => {
    const { doc } = await S.boot();
    const shared = marks(doc, 'stage2').filter(m => m.shared);
    eq(shared.length, 2, 'علامتان مشتركتان');
    ok(Math.abs(shared[0].x - shared[1].x) < 1, 'الزوج صفٌّ لا عمود');
    ok(Math.abs(shared[0].y - shared[1].y) >= 20, 'العلامتان متلاصقتان رأسيًّا');
    const o = circles(doc, 'stage2', 'circle.orbit-shell-2');
    const mid = (o[0].cx + o[1].cx) / 2;
    shared.forEach(m => ok(Math.abs(m.x - mid) < 2, 'العمود ليس في منتصف التداخل'));
  });

  it('لا شيء يخرج عن حدود المشهد', async () => {
    const { doc } = await S.boot();
    const bad = within(doc, 'stage2', 10);
    eq(bad.length, 0, 'خارج الحدود: ' + bad.join(' · '));
  });

  it('ولا علامتان متلاصقتان في المشهد كلّه', async () => {
    const { doc } = await S.boot();
    const g = minGap(marks(doc, 'stage2'));
    ok(g.min >= 18, 'أقرب مسافة ' + g.min.toFixed(1) + ' بكسل');
  });
});

describe('هندسة مسرحَي الأكسجين والنيتروجين', () => {
  const T = { ready: null };
  T.boot = function () {
    if (!T.ready) T.ready = f.load().then(async r => {
      h.choose(r.doc, 'oNeeds', 'correct'); await h.tick(r.w, 60);
      await f.makePair(r.w, r.doc, 'stage4o');
      await f.makePair(r.w, r.doc, 'stage4o');
      h.choose(r.doc, 'cmpPairs', 'correct'); await h.tick(r.w, 60);
      await f.makePair(r.w, r.doc, 'stage4n');
      await f.makePair(r.w, r.doc, 'stage4n');
      await f.makePair(r.w, r.doc, 'stage4n');
      return Object.assign(T, r);
    });
    return T.ready;
  };

  it('الأكسجين: زوجان فوق بعضهما في عمود واحد', async () => {
    const { doc } = await T.boot();
    const shared = marks(doc, 'stage4o').filter(m => m.shared);
    eq(shared.length, 4);
    const cols = [...new Set(shared.map(m => Math.round(m.x)))];
    eq(cols.length, 1, 'الأزواج مصفوفة أفقيًّا لا رأسيًّا');
    const ys = shared.map(m => m.y).sort((a, b) => a - b);
    ok(ys[1] - ys[0] >= 20, 'علامتا الزوج الأول متلاصقتان');
    ok(ys[2] - ys[1] >= 20, 'الزوجان متلاصقان');
  });

  it('النيتروجين: ثلاثة أزواج، وزوج غير مشارك في الجهة المقابلة', async () => {
    const { doc } = await T.boot();
    const all = marks(doc, 'stage4n');
    eq(all.filter(m => m.shared).length, 6);
    const outer = circles(doc, 'stage4n', 'circle.orbit-shell-1');
    const touch = (outer[0].cx + outer[1].cx) / 2;
    // الزوج غير المشارك على الطرف البعيد من محور الرابطة
    const lone = all.filter(m => !m.shared && Math.abs(m.y - outer[0].cy) < 22);
    ok(lone.length >= 2, 'لا زوج على المحور بعيدًا عن الرابطة');
    lone.forEach(m => ok(Math.abs(m.x - touch) > 100, 'زوج غير مشارك قريب من الرابطة'));
    const shared = all.filter(m => m.shared);
    eq([...new Set(shared.map(m => Math.round(m.x)))].length, 1,
       'الأزواج الثلاثة ليست في عمود واحد');
    const ys = shared.map(m => m.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) ok(ys[i] - ys[i - 1] >= 20, 'علامتان متلاصقتان في العمود');
  });

  it('كل مسرح ثنائي يعرض صيغته بعد الاكتمال', async () => {
    const { doc } = await T.boot();
    ['stage4o', 'stage4n'].forEach(id => {
      const fx = doc.querySelector('#' + id + ' text.formula-label');
      ok(fx && fx.classList.contains('show'), 'لا صيغة في ' + id);
    });
  });

  it('لا شيء يخرج عن حدود المشهدين', async () => {
    const { doc } = await T.boot();
    eq(within(doc, 'stage4o', 10).length, 0, 'الأكسجين: ' + within(doc, 'stage4o', 10).join(' · '));
    eq(within(doc, 'stage4n', 10).length, 0, 'النيتروجين: ' + within(doc, 'stage4n', 10).join(' · '));
  });

  it('والعلامات لا تتلاصق في أيّهما', async () => {
    const { doc } = await T.boot();
    ok(minGap(marks(doc, 'stage4o')).min >= 20, 'الأكسجين متلاصق');
    ok(minGap(marks(doc, 'stage4n')).min >= 20, 'النيتروجين متلاصق');
  });
});

describe('هندسة الميثان والأمونيا', () => {
  const U = { ready: null };
  U.boot = function () {
    if (!U.ready) U.ready = f.load().then(r => Object.assign(U, r));
    return U.ready;
  };

  it('ذرّات الهيدروجين تبدأ خارج مجال الذرّة المركزية', async () => {
    const { w, doc } = await U.boot();
    await f.makePair(w, doc, 'stage5h');   // الهيدروجين يفتح الميثان
    const central = circles(doc, 'stage5c', 'circle.orbit-shell-1')[0];
    const rings = circles(doc, 'stage5c', 'circle.h-ring');
    eq(rings.length, 4, 'أربع ذرّات هيدروجين');
    rings.forEach(hr => {
      const d = Math.hypot(hr.cx - central.cx, hr.cy - central.cy);
      ok(d - hr.r > central.r + 10, 'ذرّة هيدروجين تلامس المركزية قبل الربط');
    });
  });

  it('وبعد الربط تتلامس كلٌّ منها مع الذرّة المركزية عند نقطة', async () => {
    const { w, doc } = await U.boot();
    for (let i = 0; i < 4; i++) await f.bondH(w, doc, 'stage5c', i);
    await h.tick(w, 200);
    const central = circles(doc, 'stage5c', 'circle.orbit-shell-1')[0];
    circles(doc, 'stage5c', 'circle.h-ring').forEach(hr => {
      const d = Math.hypot(hr.cx - central.cx, hr.cy - central.cy);
      ok(Math.abs(d - (central.r + hr.r)) < 3, 'تلامس غير دقيق: ' + d.toFixed(0));
    });
  });

  it('لا شيء يخرج عن حدود مشاهد المحطة 5 كلها', async () => {
    const { w, doc } = await U.boot();
    for (let i = 0; i < 3; i++) await f.bondH(w, doc, 'stage5n', i);
    await h.tick(w, 120);
    for (let i = 0; i < 2; i++) await f.bondH(w, doc, 'stage5w', i);
    await h.tick(w, 120);
    ['stage5h', 'stage5c', 'stage5n', 'stage5w'].forEach(id => {
      const bad = within(doc, id, 8);
      eq(bad.length, 0, id + ': ' + bad.join(' · '));
    });
  });

  it('الأمونيا: الذرّة الرابعة ترجع إلى مكانها ولا تبقى فوق الزوج', async () => {
    const { w, doc } = await U.boot();
    for (let i = 0; i < 3; i++) await f.bondH(w, doc, 'stage5n', i);
    await h.tick(w, 200);
    const rings0 = circles(doc, 'stage5n', 'circle.h-ring');
    const before = rings0[3];
    await f.bondH(w, doc, 'stage5n', 3);
    await h.tick(w, 1600);
    const after = circles(doc, 'stage5n', 'circle.h-ring')[3];
    ok(Math.hypot(after.cx - before.cx, after.cy - before.cy) < 4,
       'الذرّة الرابعة لم ترجع إلى موضعها');
  });
});

const M = { ready: null };
M.boot = function () {
  if (!M.ready) M.ready = f.load().then(async r => {
    await f.makePair(r.w, r.doc, 'stage5h');
    for (let i = 0; i < 4; i++) await f.bondH(r.w, r.doc, 'stage5c', i);
    await h.tick(r.w, 80);
    for (let i = 0; i < 3; i++) await f.bondH(r.w, r.doc, 'stage5n', i);
    await h.tick(r.w, 80);
    for (let i = 0; i < 2; i++) await f.bondH(r.w, r.doc, 'stage5w', i);
    await h.tick(r.w, 80);
    h.choose(r.doc, 'sameNum', 'correct'); await h.tick(r.w, 40);
    h.click(r.doc, 'showModels5'); await h.tick(r.w, 40);
    return Object.assign(M, r);
  });
  return M.ready;
};

describe('بطاقات نماذج الكرات والعصيّ', () => {
  function figs(doc, containerId) {
    return Array.from(doc.querySelectorAll('#' + containerId + ' .repr-fig'));
  }
  function sticksOf(fig) { return Array.from(fig.querySelectorAll('line.stick')); }
  function ballsOf(fig)  { return Array.from(fig.querySelectorAll('circle.ball')); }

  it('نماذج المحطة 5 أربعة، ولكل ذرّة هيدروجين عصا ظاهرة', async () => {
    const { doc } = await M.boot();
    const list = figs(doc, 'models5');
    eq(list.length, 4);
    list.forEach((fig, i) => {
      const sticks = sticksOf(fig);
      ok(sticks.length > 0, 'نموذج ' + i + ' بلا عصيّ');
      sticks.forEach(l => {
        const len = Math.hypot(+l.getAttribute('x2') - +l.getAttribute('x1'),
                               +l.getAttribute('y2') - +l.getAttribute('y1'));
        ok(len > 26, 'عصا أقصر من أن تُرى في نموذج ' + i);
      });
    });
  });

  it('وكل نموذج داخل حدود إطاره', async () => {
    const { doc } = await M.boot();
    figs(doc, 'models5').forEach((fig, i) => {
      const vb = fig.querySelector('svg').getAttribute('viewBox').split(/\s+/).map(Number);
      ballsOf(fig).forEach(b => {
        const cx = +b.getAttribute('cx'), cy = +b.getAttribute('cy'), r = +b.getAttribute('r');
        ok(cx - r >= 0 && cx + r <= vb[2] && cy - r >= 0 && cy + r <= vb[3],
           'كرة خارج الإطار في نموذج ' + i);
      });
    });
  });

  it('الميثان أربع روابط متعامدة كما في الشكل 1-27', async () => {
    const { doc } = await M.boot();
    const fig = figs(doc, 'models5')[1];
    const c = { x: 70, y: 60 };
    const angs = sticksOf(fig)
      .map(l => Math.round(Math.atan2(+l.getAttribute('y2') - c.y, +l.getAttribute('x2') - c.x) * 180 / Math.PI))
      .sort((a, b) => a - b);
    eq(angs.join(','), '-90,0,90,180', 'زوايا الميثان: ' + angs.join(','));
  });

  it('والأمونيا هرمٌ: النيتروجين أعلى وثلاث ذرّات تحته', async () => {
    const { doc } = await M.boot();
    const fig = figs(doc, 'models5')[2];
    const n = +fig.querySelector('circle.ball-n').getAttribute('cy');
    const hs = Array.from(fig.querySelectorAll('circle.ball-h')).map(b => +b.getAttribute('cy'));
    eq(hs.length, 3);
    hs.forEach(y => ok(y > n, 'ذرّة هيدروجين ليست أسفل النيتروجين'));
  });

  it('والماء منحنٍ: ذرّتا الهيدروجين على جانبَي الأكسجين لا على خطّ واحد معه', async () => {
    const { doc } = await M.boot();
    const fig = figs(doc, 'models5')[3];
    const o = fig.querySelector('circle.ball-o');
    const ox = +o.getAttribute('cx'), oy = +o.getAttribute('cy');
    const hs = Array.from(fig.querySelectorAll('circle.ball-h'))
      .map(b => ({ x: +b.getAttribute('cx'), y: +b.getAttribute('cy') }));
    eq(hs.length, 2);
    const a1 = Math.atan2(hs[0].y - oy, hs[0].x - ox);
    const a2 = Math.atan2(hs[1].y - oy, hs[1].x - ox);
    const angle = Math.abs(a1 - a2) * 180 / Math.PI;
    ok(angle > 60 && angle < 160, 'زاوية الماء ' + angle.toFixed(0) + ' — ليست منحنية');
  });

  it('ونموذجا المحطة 4: عصاتان للأكسجين وثلاث للنيتروجين', async () => {
    const r = await f.load();
    h.choose(r.doc, 'oNeeds', 'correct'); await h.tick(r.w, 60);
    await f.makePair(r.w, r.doc, 'stage4o');
    await f.makePair(r.w, r.doc, 'stage4o');
    h.choose(r.doc, 'cmpPairs', 'correct'); await h.tick(r.w, 60);
    await f.makePair(r.w, r.doc, 'stage4n');
    await f.makePair(r.w, r.doc, 'stage4n');
    await f.makePair(r.w, r.doc, 'stage4n');
    ok(h.visible(r.doc, 'stickBlock'), 'كتلة النماذج لم تظهر');
    no(h.visible(r.doc, 'models4'), 'النماذج ظهرت بلا طلب');
    h.click(r.doc, 'showModels4');
    await h.tick(r.w, 40);
    ok(h.visible(r.doc, 'models4'));
    const list = figs(r.doc, 'models4');
    eq(list.length, 2);
    eq(sticksOf(list[0]).length, 2, 'الأكسجين');
    eq(sticksOf(list[1]).length, 3, 'النيتروجين');
    r.dom.window.close();
  });
});

run();
