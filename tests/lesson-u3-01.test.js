'use strict';
/* الوحدة 03 · الدرس 01 — اختبار سلوكي وهندسي.
   يقيس ما يفعله الطالب ويراه، وصفةَ الرسم لا مجرّد وجوده. */

const path = require('path');
const H = require('./harness.js');

const FILE = 'semester-1/unit-03/lesson-01.html';

let pass = 0, fail = 0;
function ok(name, cond, extra){
  if(cond){ pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  ← ' + extra : '')); }
}
function near(a, b, tol){ return Math.abs(a - b) <= tol; }

function num(el, attr){ return parseFloat(el.getAttribute(attr)); }

/* نقاط على مسار SVG بصيغة M..L أو M..A — نكتفي بنقاط الطرفين للأقواس */
function pathNums(d){ return (d.match(/-?\d+(\.\d+)?/g) || []).map(Number); }

(async function(){
  const { w: window, doc: document, logs, raw } = await H.loadLesson(FILE);
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
  const clickNode = H.clickNode;

  console.log('\n=== الوحدة 03 · الدرس 01 ===');

  /* ───────────── بنية عامّة ───────────── */
  console.log('\n— البنية —');
  /* أسئلة التنبّؤ الثلاثة تُدار يدويًّا لأنّها بلا إجابة صحيحة، فمحرّك
     الأسئلة المشترك يعدّها يتيمة ويحذّر. تحذير معروف ومقصود — يُستثنى
     بالاسم لا بالإهمال، فلو ظهر يتيم رابع كشفه الاختبار. */
  const KNOWN_ORPHANS = 'u3l1-predict-spoon · u3l1-predict-concave · u3l1-predict-convex';
  const realLogs = logs.filter(l => l.indexOf(KNOWN_ORPHANS) === -1);
  ok('لا أخطاء JS عند التحميل', realLogs.length === 0, realLogs.join(' | '));
  ok('لا سؤال يتيم غير أسئلة التنبّؤ الثلاثة',
     logs.length === 0 || logs.length === 1);

  const srcs = (raw.match(/<script\s+src="[^"]+"><\/script>/g) || [])
                 .map(t => t.replace(/.*src="([^"]+)".*/, '$1'));
  const order = ['sounds', 'xp', 'faheem', 'template', 'certificate', 'footer'];
  ok('ترتيب وسوم المشترك الستّة',
     order.every((k, i) => (srcs[i] || '').indexOf(k) !== -1), srcs.join(' , '));
  ok('سكربت الدرس بعد المشترك كلّه',
     raw.lastIndexOf('<script src=') < raw.lastIndexOf('<script>'));

  ok('ستّ نقاط تقدّم لستّ محطات',
     $$('.progress-dot').length === 6 && $$('section.station').length === 6);

  const dq = $$('[data-q]').map(n => n.getAttribute('data-q'));
  ok('data-q فريدة في الصفحة', new Set(dq).size === dq.length, dq.join(','));

  /* التعليقات تُنزع قبل حرّاس اللفظ: كتلة القرارات تسمّي ما هو خارج
     النطاق عمدًا، فحراسة المصدر الخام تُجرّم التوثيق نفسه. */
  const src = raw.replace(/<!--[\s\S]*?-->/g, '')
                 .replace(/\/\*[\s\S]*?\*\//g, '')
                 .replace(/^\s*\/\/.*$/gm, '');
  ok('لا نداء صريح للشهادة في سكربت الدرس', src.indexOf('Certificate.finish') === -1);

  ok('حارس تقليل الحركة بطبقتيه',
     raw.indexOf('prefers-reduced-motion') !== -1 &&
     raw.indexOf('G.reduced()') !== -1);

  /* ───────────── المحطة 1 ───────────── */
  console.log('\n— المحطة 1: الملعقة —');
  const innerBtn = document.getElementById('s1InnerBtn');
  const outerBtn = document.getElementById('s1OuterBtn');
  ok('زرّا الوجهين معطَّلان قبل التنبّؤ', innerBtn.disabled && outerBtn.disabled);

  H.choose(document, 'u3l1-predict-spoon', 'p2');
  ok('زرّا الوجهين يُفتحان بعد التنبّؤ', !innerBtn.disabled && !outerBtn.disabled);

  ok('لا زرّ نشط قبل أي اختيار',
     !innerBtn.classList.contains('is-active') && !outerBtn.classList.contains('is-active'));

  clickNode(innerBtn);
  ok('الزرّ المضغوط يحمل الحالة النشطة وحده',
     innerBtn.classList.contains('is-active') && !outerBtn.classList.contains('is-active'));

  clickNode(outerBtn);
  ok('الحالة النشطة تنتقل ولا تتراكم',
     outerBtn.classList.contains('is-active') && !innerBtn.classList.contains('is-active'));

  const spoon = document.getElementById('spoonStage');
  const bowl = $$('#spoonStage ellipse').filter(e => e.getAttribute('class') === 'spoon-metal')[0];
  ok('كفّة الملعقة أطول رأسيًّا منها عرضًا',
     num(bowl, 'ry') > num(bowl, 'rx') * 1.2,
     'rx=' + num(bowl, 'rx') + ' ry=' + num(bowl, 'ry'));

  /* الشمعة الحقيقية لا تتغيّر بين الحالتين — المرجع ثابت وإلا فسدت المقارنة */
  const realWax = $$('#spoonStage rect').filter(r => r.getAttribute('class') === 'wax');
  ok('شمع واحد خارج الكفّة (المرجع) وآخر داخلها (الصورة)', realWax.length === 2);
  const refH = num(realWax[0], 'height');
  clickNode(innerBtn);
  const afterA = $$('#spoonStage rect').filter(r => r.getAttribute('class') === 'wax');
  ok('حجم الشمعة الحقيقية ثابت بين الوجهين', num(afterA[0], 'height') === refH);

  /* الصورة بلا شفافية: الفرق حجم لا لون */
  const imgWax = afterA[1];
  ok('صورة الشمعة بلا شفافية', !imgWax.getAttribute('opacity'));
  ok('صورة الوجه الداخلي أكبر من الشمعة', num(imgWax, 'height') > refH);

  /* اللهب المكبَّر لا يُقصّ عند حافّة الكفّة */
  const clipEll = $('#spoonStage clipPath ellipse');
  const clipTop = num(clipEll, 'cy') - num(clipEll, 'ry');
  const flames = $$('#spoonStage ellipse').filter(e => e.getAttribute('class') === 'flame');
  const imgFlame = flames[flames.length - 1];
  const flameTop = num(imgFlame, 'cy') - num(imgFlame, 'ry');
  ok('قمّة اللهب المكبَّر داخل حدّ القصّ', flameTop > clipTop + 2,
     'لهب=' + flameTop.toFixed(1) + ' حدّ=' + clipTop.toFixed(1));

  /* النصّ أسفل المسرح لا يلامس ذراع الملعقة */
  const handle = $$('#spoonStage rect').filter(r => r.getAttribute('class') === 'spoon-metal')[0];
  const handleBottom = num(handle, 'y') + num(handle, 'height');
  const notes = $$('#spoonStage text').filter(t => t.getAttribute('class') === 'idle-note');
  const bottomNote = notes.filter(t => num(t, 'y') > 250)[0];
  ok('سطر الوصف بعيد عن ذراع الملعقة',
     num(bottomNote, 'y') - 14 - handleBottom >= 8,
     'ذراع ينتهي ' + handleBottom + ' ونصّ يبدأ ' + (num(bottomNote, 'y') - 14));

  ok('كل عناصر مسرح الملعقة داخل viewBox',
     num(bowl, 'cy') + num(bowl, 'ry') <= 320 && handleBottom <= 320 && num(bottomNote, 'y') <= 320);

  /* ───────────── المحطة 2 ───────────── */
  console.log('\n— المحطة 2: المقاطع الثلاثة —');
  const faces = document.getElementById('facesStage');
  const panels = $$('#facesStage g[data-panel]');
  ok('ثلاثة مقاطع', panels.length === 3);

  /* منطقتا النقر متطابقتان — لا مؤشّر يرجّح جانبًا */
  panels.forEach(function(g){
    const f = g.querySelector('[data-side="front"]');
    const b = g.querySelector('[data-side="back"]');
    const key = g.getAttribute('data-panel');
    ok('منطقتا النقر متطابقتان في المقطع ' + key,
       num(f, 'width') === num(b, 'width') && num(f, 'height') === num(b, 'height') &&
       num(f, 'y') === num(b, 'y'));
    const gap = num(b, 'x') - (num(f, 'x') + num(f, 'width'));
    ok('لا فجوة ميّتة على المرآة في المقطع ' + key, gap <= 6 && gap >= 0, 'فجوة=' + gap);
  });

  /* لمس خارج المنطقتين يومض ولا يمنح شيئًا */
  const p1 = panels[0];
  clickNode(p1.querySelector('.panel-bg'));
  ok('اللمس خارج المنطقتين يومض المنطقتين معًا',
     p1.querySelector('[data-side="front"]').classList.contains('is-flash') &&
     p1.querySelector('[data-side="back"]').classList.contains('is-flash'));
  ok('الومضة لا ترسم تظليلًا ولا تحلّ المقطع',
     p1.querySelector('[data-hatch]').childElementCount === 0);

  /* الجانب الخلفي يلمّح ولا يحلّ */
  clickNode(p1.querySelector('[data-side="back"]'));
  const fb2 = document.getElementById('fb-s2Faces');
  ok('نقر الجانب الخلفي يُظهر التلميح', !fb2.hidden && fb2.textContent.indexOf('يواجه') !== -1);
  ok('نقر الجانب الخلفي لا يرسم التظليل', p1.querySelector('[data-hatch]').childElementCount === 0);

  /* الجانب المواجه يحلّ ويرسم */
  panels.forEach(function(g){ clickNode(g.querySelector('[data-side="front"]')); });
  ok('نقر الجانب المواجه يرسم التظليل في الثلاثة',
     panels.every(g => g.querySelector('[data-hatch]').childElementCount === 9));
  ok('مسرح الكرة يظهر بعد إتمام الثلاثة', !document.getElementById('s2SphereBox').hidden);

  /* التظليل مشتقّ من القوس نفسه: كلّ شرطة تبدأ على المسار المرسوم */
  panels.forEach(function(g){
    const key = g.getAttribute('data-panel');
    const d = g.querySelector('.mirror-body').getAttribute('d');
    const nums = pathNums(d);
    const startX = nums[0], startY = nums[1];
    const marks = Array.prototype.slice.call(g.querySelectorAll('[data-hatch] line'));
    const first = marks[0];
    ok('أوّل شرطة تنطلق من طرف القوس في المقطع ' + key,
       near(num(first, 'x1'), startX, 0.6) && near(num(first, 'y1'), startY, 0.6),
       'قوس(' + startX + ',' + startY + ') شرطة(' + num(first, 'x1') + ',' + num(first, 'y1') + ')');
  });

  /* الشعاع الساقط والمنعكس: اصطلاح واحد */
  const rays1 = $$('#facesStage [data-rays] line');
  ok('لكلّ مقطع محلول شعاع ساقط وآخر منعكس',
     $$('#facesStage [data-rays] line.beam').length === 3 &&
     $$('#facesStage [data-rays] line.beam-out').length === 3);
  ok('رأسا سهم لكلّ مقطع، واحد لكلّ اتّجاه',
     $$('#facesStage [data-rays] path.arrow-in').length === 3 &&
     $$('#facesStage [data-rays] path.arrow-out').length === 3);

  /* الرأسان لا يتراكبان رغم تطابق المسار */
  panels.forEach(function(g){
    const key = g.getAttribute('data-panel');
    const ai = pathNums(g.querySelector('path.arrow-in').getAttribute('d'));
    const ao = pathNums(g.querySelector('path.arrow-out').getAttribute('d'));
    ok('رأسا السهم متباعدان في المقطع ' + key, Math.abs(ai[2] - ao[2]) > 20,
       'فرق=' + Math.abs(ai[2] - ao[2]).toFixed(1));
  });

  /* نصّ مسرح الكرة يبلغه النمط ويبقى داخل المسرح */
  const cap = $$('#sphereStage text').filter(t => t.getAttribute('class') === 'panel-label')[0];
  ok('نصّ مسرح الكرة يحمل صنفًا يبلغه النمط المشترك', !!cap);
  const capRule = raw.indexOf('.optics-stage .panel-label') !== -1;
  ok('قاعدة panel-label مقيَّدة بـ optics-stage لا بمسرح واحد', capRule);
  ok('قاعدة panel-label تحمل توسيطًا',
     /\.optics-stage \.panel-label\{[^}]*text-anchor:middle/.test(raw));

  /* ───────────── المحطة 3 ───────────── */
  console.log('\n— المحطة 3: الحزمة الثلاثية —');
  const beam = document.getElementById('beamStage');
  const btnFlat = document.getElementById('s3BtnFlat');
  const btnCav  = document.getElementById('s3BtnConcave');
  const btnVex  = document.getElementById('s3BtnConvex');

  ok('أزرار المرايا مقفلة قبل أوانها', btnCav.disabled && btnVex.disabled && !btnFlat.disabled);
  ok('زرّ المرآة المعروضة نشط', btnFlat.classList.contains('is-active'));

  /* صندوق الضوء لا يُخرج ضوءًا قبل تشغيله: المسرح مطفأ عند الدخول،
     وإلّا وعد الزرّ بفعلٍ تمّ بعضه قبل الضغط. */
  const s3Next = document.getElementById('s3Next');
  ok('المسرح مطفأ قبل تشغيل الضوء',
     $$('#beamStage [data-in] line').length === 0 &&
     $$('#beamStage [data-out] line').length === 0);
  ok('لا نقطة تجمّع مسجَّلة قبل التشغيل', beam.getAttribute('data-focus-x') === null);
  ok('سطر الخطوة التالية ظاهر عند الدخول', !s3Next.hidden && s3Next.textContent.length > 0);
  ok('السطر يحمل العدّاد على الصفر', s3Next.textContent.indexOf('(0 من 3)') !== -1,
     s3Next.textContent);
  ok('السطر يعلن سبب قفل الزرَّين',
     s3Next.textContent.indexOf('تُفتحان') !== -1, s3Next.textContent);

  /* تسمية المحور: موسَّطة وداخل المسرح */
  const axLbl = $$('#beamStage text').filter(t => t.getAttribute('class') === 'axis-label')[0];
  ok('تسمية المحور موسَّطة لا بمحاذاة end',
     axLbl.getAttribute('text-anchor') === 'middle', axLbl.getAttribute('text-anchor'));
  ok('تسمية المحور داخل عرض المسرح',
     num(axLbl, 'x') + 45 <= 660 && num(axLbl, 'x') - 45 >= 0, 'x=' + num(axLbl, 'x'));
  ok('تسمية المحور فوق الخطّ لا عليه', num(axLbl, 'y') < 180 && num(axLbl, 'y') > 155);

  /* المستوية: لا إزاحة رأسية، ولا سطر اعتذاري */
  H.click(document, 's3RunBtn');
  const inFlat  = $$('#beamStage [data-in] line');
  const outFlat = $$('#beamStage [data-out] line');
  ok('ثلاثة أشعة ساقطة وثلاثة منعكسة في المستوية',
     inFlat.length === 3 && outFlat.length === 3);
  ok('العدّاد ارتفع إلى واحد بعد أوّل تشغيل',
     s3Next.textContent.indexOf('(1 من 3)') !== -1, s3Next.textContent);
  ok('السطر يدلّ على المقعّرة بعد المستوية',
     s3Next.textContent.indexOf('المقعّرة') !== -1, s3Next.textContent);
  ok('الملاحظة الملاصقة للمسرح صارت وصفًا بلا توجيه',
     document.getElementById('fb-s3Stage').textContent.indexOf('جرّبها') === -1);
  outFlat.forEach(function(l, i){
    ok('لا إزاحة رأسية في الشعاع ' + (i + 1),
       num(l, 'y1') === num(inFlat[i], 'y2') && num(l, 'y2') === num(l, 'y1'));
  });
  ok('لا سطر اعتذاري عن الإزاحة',
     raw.indexOf('أُزيحت') === -1);
  ok('الشعاع المنعكس يعود إلى صندوق الضوء ولا يتوقّف في الفراغ',
     outFlat.every(l => num(l, 'x2') <= 80));

  /* رأسا السهم في المستوية لا يتراكبان رغم تطابق المسار */
  const arrIn  = $$('#beamStage [data-in] path.arrow-in');
  const arrOut = $$('#beamStage [data-out] path.arrow-out');
  ok('لكلّ شعاع رأسا سهم', arrIn.length === 3 && arrOut.length === 3);
  for(let i = 0; i < 3; i++){
    const a = pathNums(arrIn[i].getAttribute('d'))[2];
    const b = pathNums(arrOut[i].getAttribute('d'))[2];
    ok('رأسا السهم متباعدان في الشعاع ' + (i + 1), Math.abs(a - b) > 40,
       'فرق=' + Math.abs(a - b).toFixed(1));
  }

  /* المقعّرة: الأشعة تقف عند المحور ولا تتجاوزه */
  clickNode(btnCav);
  ok('تبديل المرآة يُطفئ المسرح',
     $$('#beamStage [data-in] line').length === 0 &&
     $$('#beamStage [data-out] line').length === 0);
  ok('السطر يطلب التوقّع قبل التشغيل',
     s3Next.textContent.indexOf('التوقّع') !== -1, s3Next.textContent);
  ok('العدّاد لا يرتفع بالتبديل وحده',
     s3Next.textContent.indexOf('(1 من 3)') !== -1, s3Next.textContent);
  H.choose(document, 'u3l1-predict-concave', 'p2');
  ok('السطر يطلب التشغيل بعد تسجيل التوقّع',
     s3Next.textContent.indexOf('شغّل الضوء') !== -1, s3Next.textContent);
  H.click(document, 's3RunBtn');
  const outCav = $$('#beamStage [data-out] line');
  const fx = parseFloat(beam.getAttribute('data-focus-x'));
  ok('البعد البؤري في المدى المحسوب (≈ 331)', near(fx, 331, 4), 'fx=' + fx);
  outCav.forEach(function(l, i){
    ok('الشعاع المنعكس ' + (i + 1) + ' يقف على المحور',
       near(num(l, 'y2'), 180, 0.5), 'y2=' + num(l, 'y2'));
    ok('الشعاع المنعكس ' + (i + 1) + ' لا يتجاوز نقطة التجمّع',
       num(l, 'x2') >= fx - 8 && num(l, 'x2') <= fx + 8, 'x2=' + num(l, 'x2'));
  });
  ok('التشتّت الكروي محفوظ لا مزوَّر',
     new Set(outCav.map(l => num(l, 'x2').toFixed(2))).size >= 2);

  /* زاوية السقوط = زاوية الانعكاس — الفحص الجوهري */
  console.log('\n— الفحص الفيزيائي —');
  let angleFails = 0, normalSpread = [];
  const OPTM = { concave: { cx:200, cy:180, R:260, sign:-1 }, convex: { cx:720, cy:180, R:260, sign:1 } };
  ['concave', 'convex'].forEach(function(key){
    const m = OPTM[key];
    const angs = [];
    for(let d = -100; d <= 100; d += 10){
      const h = Math.sqrt(m.R*m.R - d*d);
      const px = m.cx - m.sign*h, py = m.cy + d;
      const nx = m.sign*(px - m.cx)/m.R, ny = m.sign*(py - m.cy)/m.R;
      const v = { x:1, y:0 };
      const dot = v.x*nx + v.y*ny;
      const rx = v.x - 2*dot*nx, ry = v.y - 2*dot*ny;
      const ai = Math.acos(Math.min(1, Math.abs(dot)))*180/Math.PI;
      const dotr = rx*nx + ry*ny;
      const ar = Math.acos(Math.min(1, Math.abs(dotr)))*180/Math.PI;
      if(Math.abs(ai - ar) > 1e-6) angleFails++;
      angs.push(Math.atan2(ny, nx)*180/Math.PI);
    }
    normalSpread.push(Math.abs(angs[0] - angs[angs.length - 1]));
  });
  ok('زاوية السقوط = زاوية الانعكاس عند 42 نقطة في المرآتين', angleFails === 0);
  ok('متّجه العمودي يتغيّر على السطح المنحني بفارق > 15°',
     normalSpread.every(v => v > 15), normalSpread.map(v => v.toFixed(1)).join(' , '));

  /* المحدّبة: لا شيء يغادر إطار المشهد */
  console.log('\n— المحطة 3: المحدّبة والصورة الثابتة —');
  clickNode(btnVex);
  H.choose(document, 'u3l1-predict-convex', 'p3');
  H.click(document, 's3RunBtn');
  const outVex = $$('#beamStage [data-out] line');
  ok('أشعة المحدّبة تتفرّق', outVex.length === 3);
  outVex.forEach(function(l, i){
    const x2 = num(l, 'x2'), y2 = num(l, 'y2');
    ok('الشعاع المنعكس ' + (i + 1) + ' داخل إطار المشهد',
       x2 >= 70 && x2 <= 660 && y2 >= 20 && y2 <= 300, 'x2=' + x2.toFixed(1) + ' y2=' + y2.toFixed(1));
  });
  const lbLabel = $$('#beamStage text').filter(t => t.textContent === 'صندوق ضوء')[0];
  ok('لا شعاع يهبط إلى سطر تسمية صندوق الضوء',
     outVex.every(l => num(l, 'y2') < num(lbLabel, 'y') - 10));

  ok('الأزرار الثلاثة تُفتح بعد تشغيل الثلاثة',
     !btnFlat.disabled && !btnCav.disabled && !btnVex.disabled);
  ok('السطر ينتقل إلى البعد البؤري بعد المرايا الثلاث',
     s3Next.textContent.indexOf('البعد البؤري') !== -1, s3Next.textContent);

  /* الصورة الثابتة */
  const still = document.getElementById('beamStill');
  ok('الصورة الثابتة تُرسم قبل سؤال البعد البؤري', still.childElementCount > 0);
  ok('الصورة الثابتة تسبق السؤال في ترتيب الصفحة',
     still.compareDocumentPosition($('#s3FocalBox .explore-q')) & window.Node.DOCUMENT_POSITION_FOLLOWING);
  ok('الصورة الثابتة تحمل نقطة تجمّع', $$('#beamStill circle').length === 1);
  ok('الصورة الثابتة بالبعد البؤري نفسه',
     near(parseFloat(still.getAttribute('data-focus-x')), fx, 0.2));
  ok('لا قوس مسمًّى على الصورة قبل الإجابة',
     $$('#beamStill .focal-brace').length === 0 && $$('#beamStill .focal-text').length === 0);

  /* السؤال لا يُعيد المسرح الحيّ إلى المقعّرة من خلف الطالب */
  const beforeMirror = beam.getAttribute('data-mirror');
  H.choose(document, 'u3l1-focal-name', 'correct');
  ok('المسرح الحيّ يبقى حيث تركه الطالب',
     beam.getAttribute('data-mirror') === beforeMirror,
     beforeMirror + ' → ' + beam.getAttribute('data-mirror'));
  ok('قوس البعد البؤري يُرسم على الصورة الثابتة بعد الإجابة',
     $$('#beamStill .focal-brace').length === 1 && $$('#beamStill .focal-text').length === 1);
  ok('القوس ممتدّ من سطح المرآة إلى نقطة التجمّع', (function(){
    const nums = pathNums($('#beamStill .focal-brace').getAttribute('d'));
    return near(nums[0], fx, 0.5) && near(nums[6], 460, 0.5);
  })());

  ok('سؤال النمط يظهر بعد سؤال البعد البؤري', !document.getElementById('s3PatternBox').hidden);
  ok('السطر ينتقل إلى سؤال القاعدة الجامعة',
     s3Next.textContent.indexOf('القاعدة الجامعة') !== -1, s3Next.textContent);

  /* السطر يزول بزوال سببه: لم يبقَ في المحطة ما يُطلب */
  H.choose(document, 'u3l1-pattern-beams', 'correct');
  ok('سطر الخطوة التالية يختفي عند اكتمال المحطة',
     s3Next.hidden && s3Next.textContent === '');

  /* حارس الأصناف: صنف يُستعمل في الصفحة ولا يُعرَّف لا محلّيًّا ولا في
     المشترك يقع على تنسيق المتصفّح الافتراضي — وهو خلل لا يظهر في jsdom
     إلا بفحص النصّ، لأن jsdom لا يحسب التخطيط. */
  const sharedCss = require('fs').readFileSync(
    path.join(__dirname, '..', 'shared', 'template-boilerplate', 'template.css'), 'utf8') +
    require('fs').readFileSync(
    path.join(__dirname, '..', 'shared', 'identity', 'identity.css'), 'utf8');
  console.log('\n— حارس تعريف الأصناف —');
  ['explore-answer-row', 'explore-input', 'name-gate', 'fact-line',
   'explore-step', 'explore-q'].forEach(function(c){
    const used = new RegExp('class="[^"]*\\\\b' + c + '\\\\b').test(raw);
    const defined = raw.indexOf('.' + c + '{') !== -1 ||
                    sharedCss.indexOf('.' + c + '{') !== -1;
    ok('الصنف معرَّف حيثما يُستعمل: .' + c, !used || defined);
  });

  /* ═══════════════ المحطة 4 — الشعاع الواحد والعمودي ═══════════════ */
  console.log('\n— المحطة 4: مرجع القياس والعمودي —');

  const s4 = document.getElementById('normalStage');
  const slider = document.getElementById('s4Slider');
  function setD(v){
    slider.value = String(v);
    slider.dispatchEvent(new window.Event('input', { bubbles:true }));
  }
  /* استقرار المنزلق: الرسم يتبع input، والاحتساب يتبع change */
  function settleD(v){
    setD(v);
    slider.dispatchEvent(new window.Event('change', { bubbles:true }));
  }

  /* البوّابة: الاصطلاح يُفهَم قبل أن يُستعمل */
  ok('المسرح مخفيّ قبل حسم مرجع القياس', document.getElementById('s4StageBox').hidden);
  const nOpts = $$('[data-q="u3l1-normal-mcq"] input[type="radio"]');
  ok('أربعة خيارات لسؤال مرجع القياس', nOpts.length === 4);
  ok('الإجابة الصحيحة في الموضع الرابع', nOpts[3].value === 'correct');
  const nLens = $$('[data-q="u3l1-normal-mcq"] .quiz-option').map(o => o.textContent.trim().length);
  ok('لا خيار شاذّ الطول (فارق < 40)', Math.max.apply(null, nLens) - Math.min.apply(null, nLens) < 40,
     'الفارق ' + (Math.max.apply(null, nLens) - Math.min.apply(null, nLens)));
  ok('الإجابة الصحيحة ليست أطول الخيارات', nLens[3] < Math.max.apply(null, nLens));

  H.choose(document, 'u3l1-normal-mcq', 'correct');
  ok('المسرح يظهر بعد الإجابة الصحيحة', !document.getElementById('s4StageBox').hidden);

  /* المستوية: العمودي ثابت الاتّجاه — وهو الفرق الذي تقيسه المحطة */
  [-100, -60, -20, 0, 40, 100].forEach(function(d){
    setD(d);
    ok('المستوية d=' + d + ': العمودي (−1, 0)',
       num(s4, 'data-nx').toFixed(3) === '-1.000' && num(s4, 'data-ny').toFixed(3) === '0.000',
       s4.getAttribute('data-nx') + ' , ' + s4.getAttribute('data-ny'));
    ok('المستوية d=' + d + ': الزاويتان متساويتان',
       near(num(s4, 'data-ai'), num(s4, 'data-ar'), 0.05));
  });

  /* التعليمة تظهر مع المسرح وتسبق الملاحظة */
  ok('تعليمة المهمّة تظهر فور ظهور المسرح',
     document.getElementById('fb-s4Stage').textContent.indexOf('ثلاثة مواضع') !== -1,
     document.getElementById('fb-s4Stage').textContent);
  ok('زرّ الجسر مخفيّ قبل استقرار ثلاثة مواضع', document.getElementById('s4BridgeRow').hidden);

  /* سحبة واحدة متّصلة تُحتسب موضعًا واحدًا لا ثلاثة */
  [-100, -50, 0, 50, 100].forEach(setD);
  ok('السحب المتّصل بلا توقّف لا يفتح الجسر', document.getElementById('s4BridgeRow').hidden);

  settleD(-80);
  ok('موضع واحد مستقرّ لا يكفي', document.getElementById('s4BridgeRow').hidden);
  settleD(0);
  ok('موضعان مستقرّان لا يكفيان', document.getElementById('s4BridgeRow').hidden);
  settleD(80);
  ok('ثلاثة مواضع مستقرّة تفتح الجسر', !document.getElementById('s4BridgeRow').hidden);
  ok('سطر الملاحظة يحلّ محلّ التعليمة',
     document.getElementById('fb-s4Stage').textContent.indexOf('متساويتان') !== -1 &&
     document.getElementById('fb-s4Stage').textContent.indexOf('ثلاثة مواضع') === -1);

  H.click(document, 's4BridgeBtn');
  const bridgeBtn = document.getElementById('s4BridgeBtn');
  ok('زرّ الجسر يُعطَّل بعد ضغطه', bridgeBtn.disabled);
  ok('زرّ الجسر يأخذ صنف demoted', bridgeBtn.classList.contains('demoted'));
  ok('المرآة تبدّلت إلى مقعّرة', s4.getAttribute('data-mirror') === 'concave');

  /* قيَم §5.4 الملزِمة */
  [{ d:0, x:460.0, y:180.0, a:16.7 },
   { d:-60, x:453.0, y:120.0, a:22.0 },
   { d:-100, x:440.0, y:80.0, a:25.6 }].forEach(function(r){
    setD(r.d);
    ok('§5.4 d=' + r.d + ': نقطة السقوط',
       near(num(s4, 'data-px'), r.x, 0.3) && near(num(s4, 'data-py'), r.y, 0.3),
       s4.getAttribute('data-px') + ' , ' + s4.getAttribute('data-py'));
    ok('§5.4 d=' + r.d + ': زاوية السقوط ' + r.a + '°',
       near(num(s4, 'data-ai'), r.a, 0.3), s4.getAttribute('data-ai'));
    ok('§5.4 d=' + r.d + ': الزاويتان متساويتان',
       near(num(s4, 'data-ai'), num(s4, 'data-ar'), 0.05));
  });

  setD(-100); const ny1 = num(s4, 'data-ny');
  setD(0);    const ny0 = num(s4, 'data-ny');
  setD(100);  const ny2 = num(s4, 'data-ny');
  ok('المقعّرة: اتّجاه العمودي يختلف بين النقاط',
     Math.abs(ny1 - ny0) > 0.2 && Math.abs(ny2 - ny0) > 0.2);
  ok('المقعّرة: ميل العمودي ينعكس بين طرفَي المرآة', ny1 * ny2 < 0);

  setD(-60);
  const nLine = $('#normalStage [data-normal] line');
  const px4 = num(s4, 'data-px'), py4 = num(s4, 'data-py');
  ok('العمودي مقطع محدود: 90 أمام السطح',
     near(Math.sqrt(Math.pow(num(nLine, 'x1') - px4, 2) + Math.pow(num(nLine, 'y1') - py4, 2)), 90, 0.5));
  ok('العمودي مقطع محدود: 25 خلف السطح — لا يُكشف مركز التكوّر',
     near(Math.sqrt(Math.pow(num(nLine, 'x2') - px4, 2) + Math.pow(num(nLine, 'y2') - py4, 2)), 25, 0.5));

  let escaped = null;
  for(let d = -100; d <= 100 && !escaped; d += 10){
    setD(d);
    $$('#normalStage [data-rays] line').forEach(function(l){
      ['x1','x2'].forEach(function(k){
        const v = num(l, k); if(v < 0 || v > 660) escaped = 'd=' + d + ' ' + k + '=' + v.toFixed(1);
      });
      ['y1','y2'].forEach(function(k){
        const v = num(l, k); if(v < 0 || v > 380) escaped = 'd=' + d + ' ' + k + '=' + v.toFixed(1);
      });
    });
  }
  ok('لا شعاع يغادر إطار المسرح عند أيّ موضع', escaped === null, escaped);

  ok('نبض العمودي يختلف عن نبض المحور الرئيس',
     /normal-line\{[^}]*stroke-dasharray:3 4/.test(raw) && /axis-line\{[^}]*stroke-dasharray:7 6/.test(raw));

  /* المهمّة: ثلاث نقاط مختلفة فعلًا */
  console.log('\n— المحطة 4: المهمّة والإجابة القصيرة —');
  const table = document.getElementById('s4Table');
  setD(10);
  H.click(document, 's4RecordBtn');
  H.click(document, 's4RecordBtn');
  H.click(document, 's4RecordBtn');
  ok('ثلاث ضغطات في الموضع نفسه لا تملأ الجدول', table.getAttribute('data-rows') === '1',
     'الصفوف ' + table.getAttribute('data-rows'));
  ok('سؤال التفسير لا يظهر بمهمّة ناقصة', document.getElementById('s4WhyBox').hidden);

  [-90, 90].forEach(function(d){ setD(d); H.click(document, 's4RecordBtn'); });
  ok('ثلاث قراءات عند نقاط مختلفة تكتمل', table.getAttribute('data-rows') === '3');
  ok('سؤال التفسير يظهر بعد اكتمال المهمّة', !document.getElementById('s4WhyBox').hidden);
  ok('جدول القراءات من اليسار لليمين', table.getAttribute('dir') === 'ltr');
  const tb = table.tBodies[0];
  ok('الزاويتان متساويتان في الصفوف الثلاثة', [0,1,2].every(function(i){
       return tb.rows[i].cells[1].textContent === tb.rows[i].cells[2].textContent; }));
  ok('أرقام الجدول غربية', [0,1,2].every(function(i){
       return /^[0-9]+\.[0-9]+°$/.test(tb.rows[i].cells[1].textContent); }),
     tb.rows[0].cells[1].textContent);
  ok('زرّ التسجيل يُعطَّل بعد اكتمال الثلاثة', document.getElementById('s4RecordBtn').disabled);

  /* الإجابة القصيرة ومخرج النجاة */
  ok('مخرج النجاة مخفيّ قبل المحاولتين', document.getElementById('s4WhyModelBtn').hidden);
  H.type(document, 's4WhyInput', 'شكل المراه اختلف');
  H.click(document, 's4WhyBtn');
  ok('إجابة بلا ذكر العمودي تُرفض', document.getElementById('s4FactCard').hidden);
  ok('الرفض مصحوب بتلميح لا بصمت',
     document.getElementById('fb-u3l1-why-converge').textContent.length > 10);
  H.type(document, 's4WhyInput', 'العمودي لم يتغير ابدا');
  H.click(document, 's4WhyBtn');
  ok('النفي لا يُقرأ إجابةً صحيحة', document.getElementById('s4FactCard').hidden);
  ok('مخرج النجاة يظهر بعد محاولتين', !document.getElementById('s4WhyModelBtn').hidden);

  H.type(document, 's4WhyInput', 'العمودي يختلف اتجاهه من نقطة الى اخرى');
  H.click(document, 's4WhyBtn');
  ok('الإجابة الصحيحة تُقبل', !document.getElementById('s4FactCard').hidden);
  ok('بطاقة العمودي تظهر بعد الإجابة لا قبلها', !document.getElementById('s4FactCard').hidden);
  ok('الانتقال إلى المحطة 5 يظهر', !document.getElementById('s4done').hidden);

  /* ───────────── المحطة 5: الجسم والصورة ───────────── */
  console.log('\n— المحطة 5: المسرح والمهمّة —');

  function slide(doc, w, id, v){
    const s = doc.getElementById(id);
    s.value = String(v);
    s.dispatchEvent(new w.Event('input', { bubbles:true }));
    s.dispatchEvent(new w.Event('change', { bubbles:true }));
    return s;
  }
  const stage5 = document.getElementById('imageStage');

  ok('مسرح المحطة 5 ظاهر بلا بوّابة', !document.getElementById('s5StageBox').hidden);
  ok('يبدأ الطالب على المقعّرة', stage5.getAttribute('data-mirror') === 'concave');
  ok('الصورة معتدلة عند 8 cm', stage5.getAttribute('data-image') === 'upright');
  ok('المحدّبة والمستوية معطَّلتان قبل المهمّة',
     document.getElementById('s5MirrorCX').disabled &&
     document.getElementById('s5MirrorFL').disabled);
  ok('المهمّة لا تظهر قبل الاستكشاف', document.getElementById('s5TaskBox').hidden);
  ok('لا موضع ثانٍ للتعليمات: سطر المسرح القديم أُزيل',
     !document.getElementById('fb-s5Stage'));
  ok('سطر الخطوة التالية ظاهر منذ فتح المحطة',
     !document.getElementById('s5Next').hidden);
  ok('التعليمة الأولى تُصرّح بالعدد المطلوب',
     H.text(document, 's5Next').indexOf('ثلاثة مواضع متباعدة') !== -1, H.text(document, 's5Next'));
  ok('العدّاد يبدأ من صفر', H.text(document, 's5Next').indexOf('(0 من 3)') !== -1, H.text(document, 's5Next'));

  slide(document, window, 's5Slider', 12);
  slide(document, window, 's5Slider', 16);
  ok('العدّاد يرتفع مع كل موضع متباعد',
     H.text(document, 's5Next').indexOf('(2 من 3)') !== -1, H.text(document, 's5Next'));
  ok('العدّاد بأرقام غربية', /\([0-9] من 3\)/.test(H.text(document, 's5Next')));
  ok('موضعان لا يكفيان لفتح المهمّة', document.getElementById('s5TaskBox').hidden);
  slide(document, window, 's5Slider', 30);
  ok('ثلاثة مواضع مختلفة تفتح المهمّة', !document.getElementById('s5TaskBox').hidden);
  ok('السطر ينتقل إلى الإجابة عن السؤال',
     H.text(document, 's5Next').indexOf('عند أيّ مسافة انقلبت') !== -1, H.text(document, 's5Next'));
  ok('السطر لا يحمل عدّادًا حين لا يُطلب عدّ', H.text(document, 's5Next').indexOf('من 3') === -1);

  slide(document, window, 's5Slider', 20);
  ok('عند 20 cm لا تُرسم صورة', stage5.getAttribute('data-image') === 'none');
  ok('العبارة المعروضة محايدة بلا تفسير',
     (stage5.textContent || '').indexOf('لا تظهر صورة واضحة') !== -1);
  slide(document, window, 's5Slider', 19);
  ok('عند 19 cm الصورة معتدلة يراها الطالب', stage5.getAttribute('data-image') === 'upright');
  slide(document, window, 's5Slider', 21);
  ok('عند 21 cm الصورة مقلوبة يراها الطالب', stage5.getAttribute('data-image') === 'inverted');
  slide(document, window, 's5Slider', 60);
  ok('الصورة البعيدة مقلوبة وأصغر',
     stage5.getAttribute('data-image') === 'inverted' &&
     Math.abs(parseFloat(stage5.getAttribute('data-m'))) < 1);

  H.type(document, 's5FlipInput', '35');
  H.click(document, 's5FlipBtn');
  ok('رقم بعيد يُرفض بتلميح لا بصمت',
     document.getElementById('s5MirrorCX').disabled &&
     H.text(document, 'fb-u3l1-flip-task').length > 15);
  ok('مخرج النجاة مخفيّ بعد محاولة واحدة', document.getElementById('s5FlipHelpBtn').hidden);
  H.type(document, 's5FlipInput', '5');  H.click(document, 's5FlipBtn');
  H.type(document, 's5FlipInput', '40'); H.click(document, 's5FlipBtn');
  ok('مخرج النجاة يظهر بعد ثلاث محاولات', !document.getElementById('s5FlipHelpBtn').hidden);

  H.click(document, 's5FlipHelpBtn');
  ok('أوّل معونة تضع الجسم عند 18 لا تكشف الرقم',
     stage5.getAttribute('data-u') === '18' &&
     document.getElementById('s5MirrorCX').disabled);

  H.type(document, 's5FlipInput', '20');
  H.click(document, 's5FlipBtn');
  ok('إجابة 20 تُقبل', document.getElementById('s5FlipBtn').disabled);
  ok('المحدّبة والمستوية تُفتحان بعد المهمّة',
     !document.getElementById('s5MirrorCX').disabled &&
     !document.getElementById('s5MirrorFL').disabled);
  ok('التحدّي الاختياري يظهر بعد المهمّة', !document.getElementById('s5BonusBox').hidden);
  ok('السطر يوجّه إلى المحدّبة بعدّاد جديد',
     H.text(document, 's5Next').indexOf('المحدّبة') !== -1 && H.text(document, 's5Next').indexOf('(0 من 3)') !== -1, H.text(document, 's5Next'));
  ok('التحدّي الاختياري مذكور جانبًا لا أمرًا',
     H.text(document, 's5Next').indexOf('إن أردته') !== -1);

  const bonusG = H.groupByName(document, 'u3l1-bigger-object-bonus');
  ok('خيارات التحدّي مقفلة قبل تبديل الحجم',
     bonusG.querySelector('input[value="correct"]').disabled);
  H.click(document, 's5SizeBig');
  ok('تبديل الحجم يفتح خيارات التحدّي',
     !bonusG.querySelector('input[value="correct"]').disabled);
  ok('حجم الجسم لا يغيّر موضع الانقلاب', (function(){
    slide(document, window, 's5Slider', 19);
    const a = stage5.getAttribute('data-image');
    slide(document, window, 's5Slider', 21);
    const b = stage5.getAttribute('data-image');
    return a === 'upright' && b === 'inverted';
  })());
  H.choose(document, 'u3l1-bigger-object-bonus', 'correct');
  ok('التحدّي يُحتسب صحيحًا', H.text(document, 'fb-u3l1-bigger-object-bonus').indexOf('✓') === 0);

  console.log('\n— المحطة 5: المحدّبة والمستوية والجدول —');
  ok('سؤال النمط مخفيّ قبل التبديل إلى المحدّبة',
     document.getElementById('s5PatternBox').hidden);
  H.click(document, 's5MirrorCX');
  ok('المحدّبة: الصورة معتدلة وأصغر عند القريب',
     (function(){ slide(document, window, 's5Slider', 10);
       return stage5.getAttribute('data-image') === 'upright' &&
              Math.abs(parseFloat(stage5.getAttribute('data-m'))) < 1; })());
  ok('سؤال النمط لا يظهر بموضعين', document.getElementById('s5PatternBox').hidden);
  ok('عدّاد المحدّبة مستقلّ عن عدّاد المقعّرة',
     H.text(document, 's5Next').indexOf('(2 من 3)') !== -1, H.text(document, 's5Next'));
  slide(document, window, 's5Slider', 50);
  ok('المحدّبة لا تقلب الصورة في المدى كلّه',
     stage5.getAttribute('data-image') === 'upright');
  ok('سؤال النمط يظهر بعد ثلاثة مواضع على المحدّبة',
     !document.getElementById('s5PatternBox').hidden);
  ok('السطر ينتقل إلى سؤال النمط',
     H.text(document, 's5Next').indexOf('سؤال النمط') !== -1, H.text(document, 's5Next'));

  H.choose(document, 'u3l1-pattern-convex', 'w1');
  ok('مشتّت النمط يُقابَل بتلميح لا بصمت',
     H.text(document, 'fb-u3l1-pattern-convex').length > 15);
  H.choose(document, 'u3l1-pattern-convex', 'correct');
  ok('الجدول لا يظهر قبل زيارة المستوية', document.getElementById('s5TableBox').hidden);
  ok('السطر يطلب المستوية صراحةً بعد النمط',
     H.text(document, 's5Next').indexOf('المستوية') !== -1 && H.text(document, 's5Next').indexOf('(0 من 3)') !== -1, H.text(document, 's5Next'));

  H.click(document, 's5MirrorFL');
  slide(document, window, 's5Slider', 15);
  ok('المستوية: الصورة بحجم الجسم نفسه',
     Math.abs(parseFloat(stage5.getAttribute('data-m')) - 1) < 1e-9);
  slide(document, window, 's5Slider', 35);
  slide(document, window, 's5Slider', 55);
  ok('المستوية لا تتغيّر صورتها مع المسافة',
     Math.abs(parseFloat(stage5.getAttribute('data-m')) - 1) < 1e-9);
  ok('الجدول يظهر بعد النمط وزيارة المستوية',
     !document.getElementById('s5TableBox').hidden);
  ok('السطر يشرح مطلوب الجدول',
     H.text(document, 's5Next').indexOf('اسحب الأوصاف الأربعة') !== -1, H.text(document, 's5Next'));

  function chipOf(v){
    return $$('#s5ChipsPool .chip').filter(c => c.dataset.value === v)[0];
  }
  const slotFar = document.getElementById('slot-cc-far');
  H.selectChip(chipOf('معتدلة وأكبر من الجسم'));
  H.clickNode(slotFar);
  ok('وضع خاطئ لا يملأ الخانة', slotFar.querySelector('.slot-items').children.length === 0);
  ok('الوضع الخاطئ مصحوب بتلميح',
     !document.querySelector('#s5TableBox .chips-feedback').hidden);

  ok('سؤال المقارنة مخفيّ قبل اكتمال الجدول',
     document.getElementById('s5CompareBox').hidden);
  [['معتدلة وأكبر من الجسم', 'slot-cc-near'],
   ['مقلوبة وأصغر من الجسم', 'slot-cc-far'],
   ['معتدلة وأصغر من الجسم', 'slot-cx-any'],
   ['معتدلة وبحجم الجسم نفسه', 'slot-fl-any']].forEach(function(pair){
    const c = chipOf(pair[0]);
    if(!c) return;
    H.selectChip(c);
    H.clickNode(document.getElementById(pair[1]));
  });
  ok('الجدول يكتمل بأربع رقاقات في مواضعها',
     $$('#s5TableBox .slot').every(s => s.querySelector('.slot-items').children.length === 1));
  ok('سؤال المقارنة يظهر باكتمال الجدول',
     !document.getElementById('s5CompareBox').hidden);
  ok('السطر ينتقل إلى سؤال المقارنة',
     H.text(document, 's5Next').indexOf('سؤال المقارنة') !== -1, H.text(document, 's5Next'));

  ok('الخاتمة مخفيّة قبل سؤال المقارنة', document.getElementById('s5Closing').hidden);
  H.choose(document, 'u3l1-compare-flat', 'correct');
  ok('دعوة الخاتمة تظهر بعد المقارنة', !document.getElementById('s5Closing').hidden);
  ok('الدعوة تحيل إلى تجربة حسّية بيد الطالب',
     H.text(document, 's5Closing').indexOf('ملعقة') !== -1 &&
     H.text(document, 's5Closing').indexOf('ورقة بيضاء') !== -1);
  ok('الانتقال إلى المحطة 6 يظهر', !document.getElementById('s5done').hidden);
  ok('سطر الخطوة التالية يختفي عند الاكتمال',
     document.getElementById('s5Next').hidden && H.text(document, 's5Next') === '',
     H.text(document, 's5Next'));

  /* ───────────── المحطة 6: التقييم والشهادة ───────────── */
  console.log('\n— المحطة 6: التقييم الختامي —');
  ok('عشرة أسئلة في التقييم',
     $$('#evalQuestions .eval-q').length === 10);
  ok('تسعة أسئلة اختيار وسؤال نصّي واحد',
     $$('#evalQuestions .quiz-options[data-q]').length === 9 &&
     !!document.getElementById('e10Input'));
  ok('الأسئلة مخفيّة قبل بوّابة الاسم', document.getElementById('evalQuestions').hidden);

  H.click(document, 'evalStart');
  ok('بوّابة الاسم لا تُفتح باسم فارغ',
     document.getElementById('evalQuestions').hidden &&
     !document.getElementById('evalNameFb').hidden);

  H.type(document, 'evalName', 'فؤاد');
  H.click(document, 'evalStart');
  ok('الاسم يفتح الأسئلة', !document.getElementById('evalQuestions').hidden);

  H.choose(document, 'u3l1-e1', 'w1');
  const g1 = H.groupByName(document, 'u3l1-e1');
  ok('أول اختيار يقفل السؤال',
     Array.prototype.every.call(g1.querySelectorAll('input'), r => r.disabled));
  ok('الخيار الخاطئ يُوسم والصحيح يُضاء',
     !!g1.querySelector('.quiz-option.incorrect') &&
     !!g1.querySelector('.quiz-option.correct'));
  ok('سطر تفسير مصاحب للخطأ', H.text(document, 'fb-u3l1-e1').length > 10);

  ['u3l1-e2','u3l1-e3','u3l1-e4','u3l1-e5','u3l1-e6','u3l1-e7','u3l1-e8','u3l1-e9']
    .forEach(n => H.choose(document, n, 'correct'));

  H.type(document, 'e10Input', 'تتجمع');
  ok('النتيجة لا تظهر قبل السؤال العاشر', document.getElementById('evalSummary').hidden);
  H.click(document, 'e10Btn');
  ok('«تتجمع» تُرفض في سؤال المرآة المحدّبة',
     H.text(document, 'fb-e10').indexOf('✗') === 0);
  ok('النتيجة تظهر بعد السؤال العاشر', !document.getElementById('evalSummary').hidden);
  ok('النسبة بأرقام غربية', /[0-9]+%/.test(H.text(document, 'evalSummary')));
  ok('الشهادة تُحقن في مكانها المخصّص',
     document.getElementById('certTriggerSlot').children.length > 0);

  /* ───────────── حرّاس المصطلح ───────────── */
  console.log('\n— حدود المصطلح —');
  const body = src;
  ['كاتيون', 'أنيون', 'مركز التكوّر', 'قطب المرآة', 'حقيقية وتقديرية', 'قاعدة الثمانية']
    .forEach(function(w){ ok('لا يظهر لفظ: ' + w, body.indexOf(w) === -1); });
  ok('لفظ «بؤرة» مفردًا لا يظهر', !/بؤرة/.test(body));

  console.log('\n' + '─'.repeat(46));
  console.log('ناجح: ' + pass + '   فاشل: ' + fail);
  process.exit(fail ? 1 : 0);
})().catch(function(e){ console.error(e); process.exit(1); });
