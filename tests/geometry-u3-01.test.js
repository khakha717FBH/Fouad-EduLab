'use strict';
/* الوحدة 03 · الدرس 01 — فحص عددي لمسرح المحطة 5، وحرّاس أسئلة الاختيار.
   اختبار المنطق يسأل: هل ظهر العنصر؟ وهذا يسأل: هل ظهر في مكانه
   الصحيح وبالمقدار الصحيح؟ مسرحٌ يرسم صورةً مقلوبة خارج وجه المرآة
   يمرّ من ذاك ويسقط في هذا. */

const H = require('./harness.js');
const guards = require('./guards.js');

const FILE = 'semester-1/unit-03/lesson-01.html';

let pass = 0, fail = 0;
function ok(name, cond, extra){
  if(cond){ pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  ← ' + extra : '')); }
}
function eq(a, b, msg){ ok(msg, a === b, 'وجدنا ' + a); }
function near(a, b, tol){ return Math.abs(a - b) <= (tol || 1e-6); }

/* المرجع النظري: 1/u + 1/v = 1/f · m = −v/u — يُحسب هنا استقلالًا
   عن الدرس، فلو انزلق ثابت في الدرس انكشف الانزلاق. */
function magOf(u, kind){
  if(kind === 'flat') return 1;
  const f = kind === 'concave' ? 20 : -20;
  if(kind === 'concave' && u === 20) return null;
  const v = 1 / (1/f - 1/u);
  return -v / u;
}

function slide(doc, w, v){
  const s = doc.getElementById('s5Slider');
  s.value = String(v);
  s.dispatchEvent(new w.Event('input', { bubbles:true }));
  s.dispatchEvent(new w.Event('change', { bubbles:true }));
}

/* يفتح المحطة 5 كاملةً: ثلاثة مواضع ← المهمّة ← فتح المرآتين */
function unlockStation5(doc, w){
  slide(doc, w, 12); slide(doc, w, 16); slide(doc, w, 30);
  H.type(doc, 's5FlipInput', '20');
  H.click(doc, 's5FlipBtn');
}

(async function(){
  const { w: window, doc: document } = await H.loadLesson(FILE);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
  const stage = document.getElementById('imageStage');

  console.log('\n=== الوحدة 03 · الدرس 01 — هندسة المسرح والحرّاس ===');

  /* ───────────── إطار المسرح ───────────── */
  console.log('\n— إطار المحطة 5 —');
  const vb = (stage.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  ok('viewBox معلن بأربعة أرقام', vb.length === 4 && vb[2] === 660 && vb[3] === 380);

  ok('حدّ القصّ معرَّف ومربوط بمجموعة الصورة',
     !!document.getElementById('s5BandClip') &&
     (stage.querySelector('g[clip-path]') || {}).getAttribute &&
     stage.querySelector('g[clip-path]').getAttribute('clip-path') === 'url(#s5BandClip)');

  const bandPath = stage.querySelector('.mirror-body');
  ok('وجه المرآة مسار مغلق لا خطّ',
     !!bandPath && /Z\s*$/.test(bandPath.getAttribute('d')));
  ok('وجه المقعّرة قوسان لا قوس واحد',
     (bandPath.getAttribute('d').match(/A /g) || []).length === 2);

  /* شرطات الجانب غير العاكس: تتّجه بعيدًا عن الضوء في المرايا الثلاث */
  function hatchAway(){
    const g = stage.querySelector('g');
    const lines = $$('#imageStage .ruler-tick').filter(function(l){
      return Math.abs(parseFloat(l.getAttribute('x2')) - parseFloat(l.getAttribute('x1'))) > 1;
    });
    return lines.length >= 9 &&
           lines.every(l => parseFloat(l.getAttribute('x2')) > parseFloat(l.getAttribute('x1')));
  }
  ok('شرطات الجانب غير العاكس تتّجه بعيدًا عن الضوء — المقعّرة', hatchAway());

  /* ───────────── المسطرة ───────────── */
  console.log('\n— المسطرة والعين —');
  const nums = $$('#imageStage .ruler-num');
  eq(nums.length, 6, 'ستّة أرقام على المسطرة (10 إلى 60)');
  ok('أرقام المسطرة غربية لا هندية',
     nums.every(t => /^[0-9]+$/.test(t.textContent.trim())));
  const xs = nums.map(t => ({ v:+t.textContent.trim(), x:+t.getAttribute('x') }))
                 .sort((a, b) => a.v - b.v);
  ok('المسطرة من اليسار لليمين: كلّما بعُد الجسم صغُر x',
     xs.every((p, i) => i === 0 || p.x < xs[i-1].x));
  ok('المسطرة تحمل 10 و60 طرفيها',
     xs[0].v === 10 && xs[xs.length-1].v === 60);

  ok('رمز العين حاضر على المسرح', !!stage.querySelector('.eye-pupil'));
  const eyeNote = stage.querySelector('.eye-note');
  ok('سطر العين يقول من أين ينظر الطالب',
     !!eyeNote && eyeNote.textContent.indexOf('تنظر') !== -1);
  ok('سطر العين بلا مصطلح مؤجَّل',
     !/حائل|حقيقي|تقديري/.test(eyeNote.textContent));

  /* ───────────── الجسم والصورة ───────────── */
  console.log('\n— الجسم والصورة: أرقام لا انطباع —');
  const objG = stage.querySelectorAll('g')[3];
  function objBase(){
    const r = stage.querySelector('.obj-shape');
    return +r.getAttribute('y') + +r.getAttribute('height');
  }
  ok('قاعدة الجسم على المحور تمامًا', near(objBase(), 180, 0.01), objBase());

  function objX(){
    const r = stage.querySelector('rect.obj-shape');
    return +r.getAttribute('x') + (+r.getAttribute('width'))/2;
  }
  slide(document, window, 5);
  const x5 = objX();
  slide(document, window, 60);
  const x60 = objX();
  ok('الجسم يبتعد عن المرآة كلّما زاد الرقم', x60 < x5, x5 + ' → ' + x60);
  ok('مقياس المسطرة ثابت 6.6 بكسل للسنتيمتر',
     near((x5 - x60) / 55, 6.6, 0.01), ((x5 - x60)/55).toFixed(3));

  [8, 10, 15, 19, 25, 40, 60].forEach(function(u){
    slide(document, window, u);
    const want = magOf(u, 'concave');
    const got  = parseFloat(stage.getAttribute('data-m'));
    ok('المقعّرة عند u=' + u + ': التكبير يطابق 1/u+1/v=1/f',
       near(got, want, 0.001), 'المطلوب ' + want.toFixed(4) + ' والموجود ' + got);
  });

  slide(document, window, 20);
  ok('عند u=f لا صورة ولا رقم تكبير',
     stage.getAttribute('data-image') === 'none' && !stage.getAttribute('data-m'));
  ok('مجموعة الصورة تفرغ تمامًا عند u=f',
     stage.querySelectorAll('.img-shape').length === 0);
  ok('الجسم يبقى مرسومًا وإن غابت صورته',
     stage.querySelectorAll('.obj-shape').length === 3);

  /* الصورة لا تخرج من وجه المرآة مهما بلغ التكبير */
  function imgExtent(){
    const c = stage.querySelector('circle.img-shape');
    return { cy:+c.getAttribute('cy'), r:+c.getAttribute('r') };
  }
  slide(document, window, 21);
  const e21 = imgExtent();
  ok('أعلى تكبير: رأس الصورة داخل وجه المرآة رأسيًّا',
     e21.cy + e21.r <= 310 && e21.cy - e21.r >= 50,
     'cy=' + e21.cy + ' r=' + e21.r);
  ok('الصورة عند 21 cm مقلوبة (أسفل المحور)',
     e21.cy > 180 && stage.getAttribute('data-image') === 'inverted');
  slide(document, window, 19);
  ok('الصورة عند 19 cm معتدلة (أعلى المحور)', imgExtent().cy < 180);

  /* مقياس الرسم محصور، والفيزياء ليست كذلك — الفرق مقصود ويُقاس */
  slide(document, window, 21);
  const rSmall = +stage.querySelector('circle.img-shape').getAttribute('r');
  ok('مقياس الرسم لا يتجاوز 2.2 مهما بلغ التكبير',
     near(rSmall, 0.12 * 36 * 2.2, 0.01), rSmall);

  unlockStation5(document, window);
  H.click(document, 's5SizeBig');
  slide(document, window, 21);
  const rBig = +stage.querySelector('circle.img-shape').getAttribute('r');
  ok('الجسم الأكبر صورته أكبر بالنسبة نفسها (54÷36)',
     near(rBig / rSmall, 54/36, 0.01), (rBig/rSmall).toFixed(3));
  ok('حجم الجسم لا يزحزح موضع الانقلاب',
     (function(){
       slide(document, window, 19); const a = stage.getAttribute('data-image');
       slide(document, window, 21); const b = stage.getAttribute('data-image');
       return a === 'upright' && b === 'inverted';
     })());
  H.click(document, 's5SizeSmall');

  /* ───────────── المرآتان الأخريان ───────────── */
  console.log('\n— المحدّبة والمستوية —');
  H.click(document, 's5MirrorCX');
  [5, 20, 40, 60].forEach(function(u){
    slide(document, window, u);
    const want = magOf(u, 'convex');
    ok('المحدّبة عند u=' + u + ': معتدلة ومصغَّرة بالمقدار المحسوب',
       near(parseFloat(stage.getAttribute('data-m')), want, 0.001) &&
       stage.getAttribute('data-image') === 'upright',
       'المطلوب ' + want.toFixed(4));
  });
  ok('المحدّبة لا تنقلب صورتها عند أيّ مسافة في المدى',
     (function(){
       for(let u = 5; u <= 60; u++){
         slide(document, window, u);
         if(stage.getAttribute('data-image') !== 'upright') return false;
       }
       return true;
     })());
  ok('شرطات المحدّبة أيضًا تتّجه بعيدًا عن الضوء', hatchAway());

  H.click(document, 's5MirrorFL');
  ok('المستوية: التكبير 1 عند كل مسافة',
     [5, 25, 45, 60].every(function(u){
       slide(document, window, u);
       return near(parseFloat(stage.getAttribute('data-m')), 1, 1e-9) &&
              stage.getAttribute('data-image') === 'upright';
     }));
  ok('وجه المستوية مستطيل بلا أقواس',
     (stage.querySelector('.mirror-body').getAttribute('d').indexOf('A ') === -1));

  /* ───────────── لا شيء يغادر الإطار ───────────── */
  console.log('\n— حدود الإطار —');
  function outOfFrame(){
    const bad = [];
    $$('#imageStage line').forEach(function(l){
      ['x1','x2'].forEach(function(k){
        const v = +l.getAttribute(k); if(v < 0 || v > 660) bad.push('line.' + k + '=' + v); });
      ['y1','y2'].forEach(function(k){
        const v = +l.getAttribute(k); if(v < 0 || v > 380) bad.push('line.' + k + '=' + v); });
    });
    $$('#imageStage rect').forEach(function(r){
      const x = +r.getAttribute('x'), y = +r.getAttribute('y');
      if(x < 0 || x + (+r.getAttribute('width')) > 660) bad.push('rect.x=' + x);
      if(y < 0 || y + (+r.getAttribute('height')) > 380) bad.push('rect.y=' + y);
    });
    $$('#imageStage circle').forEach(function(c){
      const x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), r = +c.getAttribute('r');
      if(x - r < 0 || x + r > 660) bad.push('circle.cx=' + x);
      if(y - r < 0 || y + r > 380) bad.push('circle.cy=' + y);
    });
    return bad;
  }
  ['s5MirrorCC', 's5MirrorCX', 's5MirrorFL'].forEach(function(btn){
    H.click(document, btn);
    const bad = [];
    [5, 19, 21, 40, 60].forEach(function(u){
      slide(document, window, u);
      Array.prototype.push.apply(bad, outOfFrame());
    });
    ok('لا عنصر يغادر الإطار — ' + btn.replace('s5Mirror', ''),
       bad.length === 0, bad.slice(0, 3).join(' · '));
  });

  /* ───────────── مخرج النجاة الكامل ───────────── */
  console.log('\n— مخرج النجاة في مهمّة الانقلاب —');
  const b = await H.loadLesson(FILE);
  slide(b.doc, b.w, 12); slide(b.doc, b.w, 16); slide(b.doc, b.w, 30);
  ['33', '44', '55'].forEach(function(v){
    H.type(b.doc, 's5FlipInput', v);
    H.click(b.doc, 's5FlipBtn');
  });
  ok('زرّ المعونة يظهر بعد ثلاث محاولات', !b.doc.getElementById('s5FlipHelpBtn').hidden);
  H.click(b.doc, 's5FlipHelpBtn');
  ok('المعونة الأولى لا تُنهي المهمّة',
     !b.doc.getElementById('s5FlipBtn').disabled &&
     b.doc.getElementById('imageStage').getAttribute('data-u') === '18');
  H.click(b.doc, 's5FlipHelpBtn');
  ok('المعونة الثانية تكشف الرقم وتُنهي المهمّة',
     b.doc.getElementById('s5FlipBtn').disabled &&
     b.doc.getElementById('s5FlipInput').value === '20');
  ok('لا طالب يعلَق: المرآتان تُفتحان بمخرج النجاة أيضًا',
     !b.doc.getElementById('s5MirrorCX').disabled &&
     !b.doc.getElementById('s5MirrorFL').disabled);
  ok('مخرج النجاة يمنح نصف نقاط المهمّة',
     b.w.XP.has('u3l1-flip-task') && b.w.XP.total() === 5,
     'المجموع ' + b.w.XP.total());

  /* ───────────── حرّاس أسئلة الاختيار ───────────── */
  console.log('\n— حرّاس أسئلة الاختيار —');
  const api = { ok: (c, m) => ok(m, c), eq: (a, x, m) => ok(m, a === x, 'وجدنا ' + a) };
  guards.assertPositionSpread(api, guards.evalGroups(document),
    { label:'التقييم', expect:9, minDistinct:4, maxAtOne:3 });
  guards.assertPositionSpread(api, guards.mcqGroups(document),
    { label:'الدرس كلّه', minDistinct:4 });
  guards.assertLengthGap(api, guards.mcqGroups(document), { limit:12 });
  guards.assertLengthBand(api, guards.mcqGroups(document), { spread:40 });

  console.log('\n' + '─'.repeat(46));
  console.log('ناجح: ' + pass + '   فاشل: ' + fail);
  process.exit(fail ? 1 : 0);
})().catch(function(e){ console.error(e); process.exit(1); });
