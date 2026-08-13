'use strict';
/* ==========================================================
   فحص عددي لمسارح الوحدة 02 · الدرس 04
   ----------------------------------------------------------
   ما لا يكشفه اختبار المنطق: أن يكون الشكل صادقًا مع النصّ.
   الدرس يقيس تغيّر طول العضلة وسُمكها، فهذان رقمان يجب أن
   يُقاسا من الرسم لا أن يُوصفا بالنصّ. واختبارٌ يقيس القيمة
   وحدها ليس حارسًا — فالمقاس هنا صفةٌ: أقصر/أطول، أغلظ/أرفع.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const FILE = 'semester-1/unit-02/lesson-04.html';

let cached = null;
async function page(){
  if(!cached) cached = await h.loadLesson(FILE, {});
  return cached;
}

/* ــــ محلّل مسارات مبسّط: يستخرج كل الأزواج العددية ــــ
   يكفي لحساب الحدود والامتداد، ولا يحتاج تفسير الأوامر نفسها
   لأن كل الأوامر المستعملة هنا مطلقة (M L Q Z) بلا صيغ نسبية. */
function pointsOf(d){
  const nums = String(d).match(/-?\d+(?:\.\d+)?/g) || [];
  const pts = [];
  for(let i = 0; i + 1 < nums.length; i += 2){
    pts.push({ x: +nums[i], y: +nums[i + 1] });
  }
  return pts;
}
function boxOf(d){
  const p = pointsOf(d);
  return {
    x0: Math.min.apply(null, p.map(q => q.x)),
    x1: Math.max.apply(null, p.map(q => q.x)),
    y0: Math.min.apply(null, p.map(q => q.y)),
    y1: Math.max.apply(null, p.map(q => q.y)),
    w: Math.max.apply(null, p.map(q => q.x)) - Math.min.apply(null, p.map(q => q.x)),
    h: Math.max.apply(null, p.map(q => q.y)) - Math.min.apply(null, p.map(q => q.y))
  };
}
function pathBox(doc, id){
  const n = doc.getElementById(id);
  if(!n) throw new Error('مسار غير موجود: ' + id);
  return boxOf(n.getAttribute('d'));
}
function viewBoxOf(doc, id){
  const svg = doc.getElementById(id);
  if(!svg) throw new Error('مسرح غير موجود: ' + id);
  const v = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  return { x: v[0], y: v[1], w: v[2], h: v[3] };
}
const STAGES = ['cordStage', 'armStage', 'tornStage', 'bodyFront', 'bodyBack'];

/* ---------------------------------------------------------
   1) حرّاس عامّة على كل المسارح
   --------------------------------------------------------- */
describe('حرّاس عامّة — المسارح الخمسة', function(){

  it('لكل مسرح viewBox معلن ولا مسرح بأبعاد مطلقة', async function(){
    const { doc } = await page();
    STAGES.forEach(function(id){
      const svg = doc.getElementById(id);
      ok(svg, 'مسرح مفقود: ' + id);
      ok(svg.getAttribute('viewBox'), 'بلا viewBox: ' + id);
      no(svg.getAttribute('width'), 'عرض مطلق على: ' + id);
      no(svg.getAttribute('height'), 'ارتفاع مطلق على: ' + id);
    });
  });

  it('لا عنصر يخرج عن حدود مسرحه', async function(){
    const { doc } = await page();
    STAGES.forEach(function(id){
      const svg = doc.getElementById(id);
      const vb = viewBoxOf(doc, id);
      svg.querySelectorAll('path[d]').forEach(function(n){
        const b = boxOf(n.getAttribute('d'));
        ok(b.x0 >= vb.x - 0.5 && b.x1 <= vb.x + vb.w + 0.5 &&
           b.y0 >= vb.y - 0.5 && b.y1 <= vb.y + vb.h + 0.5,
           id + ': مسار خارج الحدود (' + (n.id || n.getAttribute('class')) + ')');
      });
      svg.querySelectorAll('circle').forEach(function(c){
        const cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy'), r = +c.getAttribute('r');
        ok(cx - r >= vb.x - 0.5 && cx + r <= vb.x + vb.w + 0.5 &&
           cy - r >= vb.y - 0.5 && cy + r <= vb.y + vb.h + 0.5,
           id + ': دائرة خارج الحدود (' + (c.id || c.getAttribute('class')) + ')');
      });
    });
  });

  it('معرّفات SVG فريدة عبر المسارح كلّها', async function(){
    const { doc } = await page();
    const seen = {}, dupes = [];
    doc.querySelectorAll('svg [id]').forEach(function(n){
      const id = n.id;
      if(seen[id]) dupes.push(id); else seen[id] = true;
    });
    eq(dupes.length, 0, 'معرّفات مكرّرة: ' + dupes.join(' · '));
  });

  it('حارس اللصق: لا مساران متطابقان داخل المسرح الواحد', async function(){
    const { doc } = await page();
    /* مسرحا المحطتين 3 و5 متطابقان عمدًا — الفرق في التمزّق وحده،
       ومسرحا الجسد كذلك — الفرق في المناطق. فيُفصل المجال بجذر
       المسرح، ويبقى الحارس عاملًا داخل كلٍّ منها على حدة. */
    const dupes = [];
    STAGES.forEach(function(id){
      const seen = {};
      doc.getElementById(id).querySelectorAll('path[d]').forEach(function(n){
        const d = n.getAttribute('d').replace(/\s+/g, ' ').trim();
        if(d.length < 30) return;
        if(seen[d]) dupes.push(id + ': ' + (seen[d].id || seen[d].getAttribute('class')) +
                               ' = ' + (n.id || n.getAttribute('class')));
        else seen[d] = n;
      });
    });
    eq(dupes.length, 0, 'مسارات ملصوقة: ' + dupes.join(' · '));
  });

  it('لا نصّ عربي داخل أي مسرح — التسميات تعيش في HTML أسفل الشكل', async function(){
    const { doc } = await page();
    STAGES.forEach(function(id){
      const svg = doc.getElementById(id);
      eq(svg.querySelectorAll('text').length, 0, 'نصّ داخل المسرح: ' + id);
    });
  });

  it('لكل مسرح وصف بديل يصف ما يُرى', async function(){
    const { doc } = await page();
    STAGES.forEach(function(id){
      const label = doc.getElementById(id).getAttribute('aria-label') || '';
      ok(label.length > 20, 'وصف بديل ناقص: ' + id);
    });
  });

  it('touch-action:none محصور بالعنصر القابل للسحب لا بالمسرح كاملًا', async function(){
    const { raw } = await page();
    const rules = raw.match(/([^{}]+)\{([^}]*touch-action:\s*none[^}]*)\}/g) || [];
    ok(rules.length > 0, 'لا قاعدة touch-action إطلاقًا');
    rules.forEach(function(rule){
      const sel = rule.slice(0, rule.indexOf('{')).trim().split('\n').pop().trim();
      ok(/\.grip/.test(sel), 'touch-action غير محصور بالمقبض: ' + sel);
    });
  });

  it('لكل حاوية مسرح max-width صريح فلا تتمدّد عموديًّا بلا داعٍ', async function(){
    const { raw } = await page();
    ['.stage-wrap{', '.body-cell{', '.img-cell{'].forEach(function(sel){
      const re = new RegExp(sel.replace('.', '\\.').replace('{', '\\{') + '[^}]*max-width');
      ok(re.test(raw), 'بلا max-width: ' + sel);
    });
  });

  it('scroll-margin-top على المحطة فلا تلتصق بحافّة الشاشة', async function(){
    const { raw } = await page();
    ok(/\.station\{[^}]*scroll-margin-top/.test(raw));
  });

  it('لكل حركة معلنة نظيرٌ يوقفها عند تفضيل تقليل الحركة', async function(){
    const { raw } = await page();
    const names = (raw.match(/@keyframes\s+([A-Za-z][\w-]*)/g) || [])
      .map(s => s.replace(/@keyframes\s+/, ''));
    ok(names.length >= 2, 'حركات الدرس: ' + names.join(' · '));
    const reduced = raw.split('prefers-reduced-motion').slice(1).join(' ');
    /* لكل محدِّد يعلن حركةً باسمها، نظيرٌ بالمحدِّد نفسه يُلغيها.
       فحصُ الاسم وحده داخل كتلة التقليل لا يكفي: الإلغاء يُكتب
       animation:none فيختفي الاسم منه. */
    const declared = [];
    const re = /([^{};]+)\{[^}]*animation:\s*([A-Za-z][\w-]*)\s/g;
    let m;
    while((m = re.exec(raw))){
      const sel = m[1].split('\n').pop().trim();
      if(names.indexOf(m[2]) !== -1 && declared.indexOf(sel) === -1) declared.push(sel);
    }
    ok(declared.length >= 3, 'محدِّدات الحركة: ' + declared.join(' · '));
    declared.forEach(function(sel){
      ok(reduced.indexOf(sel) !== -1,
         'حركة بلا نظير عند تقليل الحركة: ' + sel);
    });
  });
});

/* ---------------------------------------------------------
   2) مسرح الخيط والمعجون
   --------------------------------------------------------- */
describe('هندسة المحطة 2 — الخيط والمعجون', function(){

  it('حالات الخيط الثلاث مرسومة في الوسم منذ التحميل', async function(){
    const { doc } = await page();
    ['cordRest', 'cordTaut', 'cordBuckled'].forEach(function(id){
      ok(doc.getElementById(id), 'حالة مفقودة: ' + id);
    });
  });

  it('التبديل بين الحالات بالعتامة لا بتحويل هندسي على الخيط', async function(){
    const { raw } = await page();
    ok(/\.str\.pulling \.state-pull\{ opacity:1; \}/.test(raw));
    ok(/\.str\.pushing \.state-push\{ opacity:1; \}/.test(raw));
    no(/\.str\.(pulling|pushing) #cordGroup\{ transform/.test(raw),
       'الخيط يُحوَّل هندسيًّا بدل أن تُبدَّل حالته المرسومة');
  });

  it('الخيط لا يطول عند السحب — طوله ثابت وموضعه هو ما ينتقل', async function(){
    const { doc } = await page();
    function span(id){
      const p = pointsOf(doc.getElementById(id).getAttribute('d'));
      const a = p[0], b = p[p.length - 1];
      return Math.hypot(b.x - a.x, b.y - a.y);
    }
    const rest = span('cordRest'), taut = span('cordTaut'), buck = span('cordBuckled');
    ok(Math.abs(taut - rest) < 1.5,
       'الخيط استطال عند السحب: ' + rest.toFixed(1) + ' ← ' + taut.toFixed(1));
    ok(buck < rest - 20,
       'الالتواء لم يقرّب الطرفين: ' + rest.toFixed(1) + ' ← ' + buck.toFixed(1));
  });

  it('الملتوي منحنٍ فعلًا لا خطّ مستقيم', async function(){
    const { doc } = await page();
    const d = doc.getElementById('cordBuckled').getAttribute('d');
    ok((d.match(/Q/g) || []).length >= 2, 'الخيط الملتوي بلا انحناءات');
    const straight = doc.getElementById('cordRest').getAttribute('d');
    eq(/Q/.test(straight), false, 'الخيط الساكن منحنٍ وهو مشدود');
  });

  it('إزاحة المقبض تطابق فرق إحداثيات طرفَي الخيط في الحالتين', async function(){
    const { doc, raw } = await page();
    const restEnd = pointsOf(doc.getElementById('cordRest').getAttribute('d')).slice(-1)[0];
    const tautEnd = pointsOf(doc.getElementById('cordTaut').getAttribute('d')).slice(-1)[0];
    const buckEnd = pointsOf(doc.getElementById('cordBuckled').getAttribute('d')).slice(-1)[0];

    const pull = /\.str\.pulling #gripGroup\{ transform:translate\((-?\d+)px,(-?\d+)px\); \}/.exec(raw);
    const push = /\.str\.pushing #gripGroup\{ transform:translate\((-?\d+)px,(-?\d+)px\); \}/.exec(raw);
    ok(pull && push, 'إزاحة المقبض غير معلنة');
    eq(+pull[1], tautEnd.x - restEnd.x, 'إزاحة السحب الأفقية');
    eq(+pull[2], tautEnd.y - restEnd.y, 'إزاحة السحب الرأسية');
    eq(+push[1], buckEnd.x - restEnd.x, 'إزاحة الدفع الأفقية');
    eq(+push[2], buckEnd.y - restEnd.y, 'إزاحة الدفع الرأسية');
  });

  it('المعجون يُزاح عند السحب ولا يُزاح عند الدفع', async function(){
    const { raw } = await page();
    ok(/\.str\.pulling #doughGroup\{ transform:translate\(\d+px,0px\); \}/.test(raw),
       'المعجون لا يتحرّك عند السحب');
    no(/\.str\.pushing #doughGroup\{ transform/.test(raw),
       'المعجون يتحرّك عند الدفع — وهو نقيض ما يقيسه النشاط');
  });

  it('طرف الخيط المشدود يزحف مع المعجون بالمقدار نفسه فلا ينفصل عنه', async function(){
    const { doc, raw } = await page();
    const restStart = pointsOf(doc.getElementById('cordRest').getAttribute('d'))[0];
    const tautStart = pointsOf(doc.getElementById('cordTaut').getAttribute('d'))[0];
    const m = /\.str\.pulling #doughGroup\{ transform:translate\((-?\d+)px,(-?\d+)px\); \}/.exec(raw);
    ok(m, 'إزاحة المعجون غير معلنة');
    eq(tautStart.x - restStart.x, +m[1], 'طرف الخيط لا يزحف مع المعجون');
    eq(tautStart.y - restStart.y, +m[2]);
  });

  it('المعجون يزحف أبعد من المقبض — وهو شرط بقاء طول الخيط ثابتًا', async function(){
    const { raw } = await page();
    const g = /\.str\.pulling #gripGroup\{ transform:translate\((-?\d+)px/.exec(raw);
    const d = /\.str\.pulling #doughGroup\{ transform:translate\((-?\d+)px/.exec(raw);
    ok(+d[1] > +g[1],
       'الإزاحتان متساويتان فيُمطّ الخيط: المقبض ' + g[1] + ' والمعجون ' + d[1]);
  });

  it('المعجون يقف على السطح المرسوم لا معلّقًا فوقه', async function(){
    const { doc } = await page();
    const dough = boxOf(doc.querySelector('#doughGroup .dough-f').getAttribute('d'));
    const ground = +doc.querySelector('#cordStage .ground').getAttribute('y1');
    ok(Math.abs(dough.y1 - ground) <= 6,
       'أسفل المعجون ' + dough.y1 + ' والسطح ' + ground);
  });

  it('المقبض أكبر من الحدّ الأدنى للمسّ ولا يتراكب على المعجون', async function(){
    const { doc } = await page();
    const grip = doc.getElementById('cordGrip');
    const r = +grip.getAttribute('r');
    ok(r >= 11, 'نصف قطر المقبض ' + r);
    const dough = boxOf(doc.querySelector('#doughGroup .dough-f').getAttribute('d'));
    ok(+grip.getAttribute('cx') - r > dough.x1, 'المقبض يتراكب على المعجون');
  });
});

/* ---------------------------------------------------------
   3) مسرح الذراع — قلب الدرس
   --------------------------------------------------------- */
describe('هندسة المحطة 3 — الذراع', function(){

  it('الوضعان مرسومان معًا في الوسم منذ التحميل', async function(){
    const { doc } = await page();
    ok(doc.getElementById('armExtended') && doc.getElementById('armFlexed'));
    ok(doc.getElementById('armExtended').classList.contains('pose'));
    ok(doc.getElementById('armFlexed').classList.contains('pose'));
  });

  it('التبديل بتلاشٍ متبادل بالعتامة لا بتحويل هندسي', async function(){
    const { raw } = await page();
    ok(/#armStage\.flexed #armExtended\{ opacity:0; \}/.test(raw));
    ok(/#armStage\.flexed #armFlexed\{ opacity:1; \}/.test(raw));
    no(/#armStage\.flexed [^{]*\{ transform/.test(raw), 'الوضع يُنتَج بتحويل');
  });

  it('العضلة الأمامية أقصر في وضع الثني — وهذا هو المفهوم المقيس', async function(){
    const { doc } = await page();
    const ext = pathBox(doc, 'bicepsExt');
    const flex = pathBox(doc, 'bicepsFlex');
    ok(flex.h < ext.h, 'الأمامية لم تقصُر عند الثني: ' + ext.h + ' ← ' + flex.h);
    ok(ext.h - flex.h >= 12, 'الفرق غير مرئي: ' + (ext.h - flex.h));
  });

  it('العضلة الأمامية أغلظ في وضع الثني', async function(){
    const { doc } = await page();
    const ext = pathBox(doc, 'bicepsExt');
    const flex = pathBox(doc, 'bicepsFlex');
    ok(flex.w > ext.w, 'الأمامية لم تنتفخ عند الثني: ' + ext.w + ' ← ' + flex.w);
  });

  it('العضلة الخلفية تسلك عكس الأمامية تمامًا — أطول وأرفع عند الثني', async function(){
    const { doc } = await page();
    const ext = pathBox(doc, 'tricepsExt');
    const flex = pathBox(doc, 'tricepsFlex');
    ok(flex.h > ext.h, 'الخلفية لم تستطل عند الثني: ' + ext.h + ' ← ' + flex.h);
    ok(flex.w < ext.w, 'الخلفية لم ترقّ عند الثني: ' + ext.w + ' ← ' + flex.w);
  });

  it('العضلتان متعاكستان في كلّ وضع: إحداهما قصيرة غليظة والأخرى طويلة رفيعة', async function(){
    const { doc } = await page();
    const bExt = pathBox(doc, 'bicepsExt'), tExt = pathBox(doc, 'tricepsExt');
    const bFlx = pathBox(doc, 'bicepsFlex'), tFlx = pathBox(doc, 'tricepsFlex');
    ok(bExt.h > tExt.h && bExt.w < tExt.w, 'وضع المدّ: العضلتان ليستا متعاكستين');
    ok(bFlx.h < tFlx.h && bFlx.w > tFlx.w, 'وضع الثني: العضلتان ليستا متعاكستين');
  });

  it('العضلتان على جانبَي العظم لا على جانب واحد', async function(){
    const { doc } = await page();
    const bone = pathBox(doc, 'bicepsExt');
    const humerus = boxOf('M 100,62 L 116,62 L 116,180 L 100,180 Z');
    const tri = pathBox(doc, 'tricepsExt');
    ok(bone.x0 >= humerus.x0, 'الأمامية ليست أمام العظم');
    ok(tri.x1 <= humerus.x1, 'الخلفية ليست خلف العظم');
    ok(tri.x0 < humerus.x0 && bone.x1 > humerus.x1, 'العضلتان في جهة واحدة');
  });

  it('ميل الساعد يفارق ميل العضد فيُقرأ مفصلًا لا عظمًا واحدًا مستقيمًا', async function(){
    const { doc } = await page();
    /* العضد رأسيّ: ميله لانهائي. فالمقاس هنا زاوية الساعد عن الرأسي،
       ويجب أن تكون كبيرة في الوضعين وأن تختلف بينهما اختلافًا بيّنًا. */
    function armAngle(id){
      const p = pointsOf(doc.getElementById(id).querySelector('.bone-f').getAttribute('d'));
      const a = p[0], b = p[1];
      return Math.abs(Math.atan2(b.x - a.x, b.y - a.y) * 180 / Math.PI);
    }
    const ext = armAngle('armExtended');
    const flex = armAngle('armFlexed');
    ok(ext > 25, 'الساعد الممدود يوازي العضد تقريبًا: ' + ext.toFixed(1));
    ok(flex > 25, 'الساعد المثنيّ يوازي العضد تقريبًا: ' + flex.toFixed(1));
    ok(Math.abs(ext - flex) > 25,
       'الوضعان متقاربان فلا يُقرأ الفرق: ' + ext.toFixed(1) + ' و' + flex.toFixed(1));
  });

  it('الساعد يدور حول المرفق: طرفه القريب ثابت وطرفه البعيد يتحرّك', async function(){
    const { doc } = await page();
    const e = pointsOf(doc.getElementById('armExtended').querySelector('.bone-f').getAttribute('d'));
    const f = pointsOf(doc.getElementById('armFlexed').querySelector('.bone-f').getAttribute('d'));
    const elbow = { x: 108, y: 180 };
    const nearE = Math.hypot(e[0].x - elbow.x, e[0].y - elbow.y);
    const nearF = Math.hypot(f[0].x - elbow.x, f[0].y - elbow.y);
    ok(nearE < 14 && nearF < 14, 'الساعد لا يبدأ عند المرفق');
    const farE = doc.getElementById('armExtended').querySelector('.joint-f + circle, circle.joint-f');
    ok(Math.hypot(e[1].x - f[1].x, e[1].y - f[1].y) > 60, 'الطرف البعيد لم يتحرّك');
  });

  it('طول الساعد لا يتغيّر بين الوضعين — العظم لا يطول ولا يقصر', async function(){
    const { doc } = await page();
    function len(id){
      const p = pointsOf(doc.getElementById(id).querySelector('.bone-f').getAttribute('d'));
      return Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
    }
    const d = Math.abs(len('armExtended') - len('armFlexed'));
    ok(d < 6, 'فرق طول الساعد بين الوضعين: ' + d.toFixed(1));
  });

  it('لكل عضلة وترٌ يصلها بالعظم فلا تبقى كتلة معلّقة بلا رابط', async function(){
    const { doc } = await page();
    ['armExtended', 'armFlexed'].forEach(function(id){
      eq(doc.getElementById(id).querySelectorAll('.sinew').length, 2,
         'وتر ناقص في: ' + id);
    });
  });

  it('العضلة الخلفية ومقبضها محجوبان حتى تُكتشف الحاجة إليهما', async function(){
    const { raw } = await page();
    ok(/\.arm:not\(\.has-tri\) \.tri\{ display:none; \}/.test(raw));
    ok(/\.arm:not\(\.has-tri\) #tricepsGrip\{ display:none; \}/.test(raw));
  });

  it('المقبضان خارج مجموعتَي الوضع فلا يتلاشيان مع التبديل', async function(){
    const { doc } = await page();
    ['bicepsGrip', 'tricepsGrip'].forEach(function(id){
      const g = doc.getElementById(id);
      no(g.closest('.pose'), 'المقبض داخل مجموعة وضع: ' + id);
    });
  });

  it('كل مقبض يقع داخل عضلته في الوضعين معًا', async function(){
    const { doc } = await page();
    const pairs = [
      ['bicepsGrip', 'bicepsExt', 'bicepsFlex'],
      ['tricepsGrip', 'tricepsExt', 'tricepsFlex']
    ];
    pairs.forEach(function(p){
      const g = doc.getElementById(p[0]);
      const cx = +g.getAttribute('cx'), cy = +g.getAttribute('cy');
      [p[1], p[2]].forEach(function(mid){
        const b = pathBox(doc, mid);
        ok(cx >= b.x0 && cx <= b.x1 && cy >= b.y0 && cy <= b.y1,
           p[0] + ' خارج ' + mid);
      });
    });
  });

  it('المقبضان متباعدان فلا يُخطئ الإصبع بينهما', async function(){
    const { doc } = await page();
    const a = doc.getElementById('bicepsGrip'), b = doc.getElementById('tricepsGrip');
    const dist = Math.hypot(+a.getAttribute('cx') - +b.getAttribute('cx'),
                            +a.getAttribute('cy') - +b.getAttribute('cy'));
    const rr = +a.getAttribute('r') + +b.getAttribute('r');
    ok(dist > rr + 12, 'المقبضان متلاصقان: المسافة ' + dist + ' والقطران ' + rr);
  });
});

/* ---------------------------------------------------------
   4) مسرح الجسد
   --------------------------------------------------------- */
describe('هندسة المحطة 4 — الجسد', function(){

  it('خمس مناطق موزّعة على المسرحين: ثلاث أمامًا واثنتان خلفًا', async function(){
    const { doc } = await page();
    eq(doc.getElementById('bodyFront').querySelectorAll('.zone').length, 3);
    eq(doc.getElementById('bodyBack').querySelectorAll('.zone').length, 2);
  });

  it('لكل منطقة رقعة وسهما اتجاه وبقعة دعوة ومساحة نقر', async function(){
    const { doc } = await page();
    doc.querySelectorAll('svg.body .zone').forEach(function(z){
      const name = z.getAttribute('data-zone');
      ok(z.querySelector('.patch'), 'بلا رقعة: ' + name);
      ok(z.querySelector('.arrows'), 'بلا أسهم: ' + name);
      ok(z.querySelector('.dot'), 'بلا بقعة دعوة: ' + name);
      ok(z.querySelector('.hit'), 'بلا مساحة نقر: ' + name);
      ok(z.querySelectorAll('.arrows polygon').length >= 2,
         'سهم باتجاه واحد — والمنطقة تتحرّك في اتجاهين: ' + name);
    });
  });

  it('مساحة النقر تغطّي رقاع منطقتها كلّها', async function(){
    const { doc } = await page();
    doc.querySelectorAll('svg.body .zone').forEach(function(z){
      const hits = Array.from(z.querySelectorAll('.hit')).map(function(r){
        return {
          x0: +r.getAttribute('x'), y0: +r.getAttribute('y'),
          x1: +r.getAttribute('x') + +r.getAttribute('width'),
          y1: +r.getAttribute('y') + +r.getAttribute('height')
        };
      });
      z.querySelectorAll('ellipse.patch').forEach(function(e){
        const cx = +e.getAttribute('cx'), cy = +e.getAttribute('cy');
        const rx = +e.getAttribute('rx'), ry = +e.getAttribute('ry');
        const covered = hits.some(function(b){
          return cx - rx >= b.x0 - 1 && cx + rx <= b.x1 + 1 &&
                 cy - ry >= b.y0 - 1 && cy + ry <= b.y1 + 1;
        });
        ok(covered, 'رقعة خارج مساحة النقر في: ' + z.getAttribute('data-zone'));
      });
    });
  });

  it('مساحات النقر لا تتراكب داخل المسرح الواحد فلا يلتبس المقصود', async function(){
    const { doc } = await page();
    ['bodyFront', 'bodyBack'].forEach(function(sid){
      const hits = Array.from(doc.getElementById(sid).querySelectorAll('.zone .hit'))
        .map(function(r){
          return {
            n: r.closest('.zone').getAttribute('data-zone'),
            z: r.closest('.zone').getAttribute('data-zone'),
            x0: +r.getAttribute('x'), y0: +r.getAttribute('y'),
            x1: +r.getAttribute('x') + +r.getAttribute('width'),
            y1: +r.getAttribute('y') + +r.getAttribute('height')
          };
        });
      for(let i = 0; i < hits.length; i++){
        for(let j = i + 1; j < hits.length; j++){
          const a = hits[i], b = hits[j];
          if(a.z === b.z) continue;        // مساحتان لمنطقة واحدة (الذراعان) لا تتنافسان
          const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
          no(overlap, sid + ': تراكب بين ' + a.n + ' و' + b.n);
        }
      }
    });
  });

  it('الإخفات معرَّف على جذر المسرح لا على المجموعة المحدَّدة', async function(){
    const { raw } = await page();
    ok(/\.body\.has-sel \.zone:not\(\.on\)\{ opacity:\.32; \}/.test(raw),
       'الإخفات ليس على الجذر — فيخفت الجزء نفسه بدل أخواته');
  });

  it('التحديد بحدّ وتوهّج لا بملء يمحو لون المادّة', async function(){
    const { raw } = await page();
    ok(/\.body \.zone\.on \.patch\{[^}]*stroke:var\(--turquoise\)/.test(raw));
    ok(/\.body \.zone\.on\{ filter:drop-shadow/.test(raw));
    no(/\.body \.zone\.on \.patch\{[^}]*fill:var\(--turquoise\)/.test(raw),
       'الملء التركوازي يمحو لون النسيج');
  });

  it('بقعة الدعوة تختفي بعد استكشاف منطقتها', async function(){
    const { raw } = await page();
    ok(/\.body \.zone\.on \.dot, \.body \.zone\.seen \.dot\{ opacity:0; \}/.test(raw));
  });

  it('كفاف الجسد مسار واحد مغلق لا أشكال ملصوقة', async function(){
    const { doc } = await page();
    ['bodyFront', 'bodyBack'].forEach(function(id){
      const outlines = doc.getElementById(id).querySelectorAll('.body-f');
      eq(outlines.length, 1, id + ': الكفاف أكثر من شكل — يظهر درزٌ عند التماس');
      const d = outlines[0].getAttribute('d');
      ok(/Z\s*$/.test(d.trim()), id + ': الكفاف غير مغلق');
    });
  });

  it('لا رقعة تخرج عن كفاف الجسد', async function(){
    const { doc } = await page();
    ['bodyFront', 'bodyBack'].forEach(function(id){
      const body = boxOf(doc.getElementById(id).querySelector('.body-f').getAttribute('d'));
      doc.getElementById(id).querySelectorAll('ellipse.patch').forEach(function(e){
        const cx = +e.getAttribute('cx'), cy = +e.getAttribute('cy');
        const rx = +e.getAttribute('rx'), ry = +e.getAttribute('ry');
        ok(cx - rx >= body.x0 && cx + rx <= body.x1 &&
           cy - ry >= body.y0 && cy + ry <= body.y1,
           id + ': رقعة خارج الجسد في ' + e.closest('.zone').getAttribute('data-zone'));
      });
    });
  });
});

/* ---------------------------------------------------------
   5) مسرح الذراع المتضرّرة
   --------------------------------------------------------- */
describe('هندسة المحطة 5 — الذراع المتضرّرة', function(){

  it('العظام والعضلة الأمامية مطابقة لمسرح المحطة 3 — هي الذراع نفسها', async function(){
    const { doc } = await page();
    eq(doc.getElementById('tornBicepsExt').getAttribute('d'),
       doc.getElementById('bicepsExt').getAttribute('d'));
    eq(doc.getElementById('tornBicepsFlex').getAttribute('d'),
       doc.getElementById('bicepsFlex').getAttribute('d'));
  });

  it('العضلة الخلفية باهتة في الوضعين', async function(){
    const { doc, raw } = await page();
    ['tornTricepsExt', 'tornTricepsFlex'].forEach(function(id){
      ok(doc.getElementById(id).closest('.torn'), 'العضلة الممزّقة غير موسومة: ' + id);
    });
    ok(/\.arm \.torn\{ opacity:\.42; \}/.test(raw));
  });

  it('فجوة التمزّق تقع داخل العضلة الممزّقة لا خارجها', async function(){
    const { doc } = await page();
    const pairs = [['tornExtended', 'tornTricepsExt'], ['tornFlexed', 'tornTricepsFlex']];
    pairs.forEach(function(p){
      const gap = boxOf(doc.getElementById(p[0]).querySelector('.tear-gap').getAttribute('d'));
      const mus = pathBox(doc, p[1]);
      ok(gap.x0 >= mus.x0 - 1 && gap.x1 <= mus.x1 + 1 &&
         gap.y0 >= mus.y0 && gap.y1 <= mus.y1,
         'الفجوة خارج العضلة في: ' + p[0]);
    });
  });

  it('الفجوة تُرسم بلون خلفية المشهد فتُقرأ قطعًا لا ثقبًا في الفراغ', async function(){
    const { raw } = await page();
    ok(/\.arm \.tear-gap\{[^}]*stroke:var\(--navy-darker\)/.test(raw),
       'الفجوة تكشف خلفية الصفحة بدل أن يبلغها ما حولها');
  });

  it('العضلة الأمامية سليمة: ليست داخل مجموعة التمزّق', async function(){
    const { doc } = await page();
    ['tornBicepsExt', 'tornBicepsFlex'].forEach(function(id){
      no(doc.getElementById(id).closest('.torn'), 'الأمامية موسومة ممزّقة: ' + id);
    });
  });
});

run();
