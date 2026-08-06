'use strict';
/* ==========================================================
   فحص عددي لمسارح درس 06 — ما لا يكشفه اختبار المنطق
   ----------------------------------------------------------
   يتحقّق من عدد العناصر الهندسية في كل مسرح SVG بعد بنائه، لتُلتقط
   أي إغفال بصري (رقاقة ناقصة، خطّ IMF مفقود، جزيء غير مكتمل...)
   لا يغطّيه اختبار السلوك وحده. الفحص بالعين يبقى ضروريًّا معه
   (§9.5 من ملف المعرفة) لا بديلًا عنه.
   ========================================================== */

const { describe, it, eq, ok, run } = require('./run');
const h = require('./harness');

const LESSON = 'semester-1/unit-01/lesson-06.html';

async function page(){
  const s = await h.loadLesson(LESSON, { reduceMotion: true });
  s.w.Certificate = { finish: function(){} };
  return s;
}

describe('هندسة المحطة 2 — موقد التسخين', function(){
  it('خمس عيّنات على العلبة، وبركة شمع واحدة، وشعلة واحدة', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#stage2a .heat-sample').length, 5);
    eq(doc.querySelectorAll('#stage2a .wax-pool').length, 1);
    eq(doc.querySelectorAll('#stage2a .flame').length, 1);
    eq(doc.querySelectorAll('#stage2a .tripod-leg').length, 3);
  });
});

describe('هندسة المحطة 2 — الدائرة الكهربائية', function(){
  it('ستّ عيّنات صلبة/سائلة قابلة للنقر، وثلاث محاليل بعد الجسر', async function(){
    const s = await page();
    const { doc, w } = s;
    doc.querySelector('#s1predictOptions input[value="water"]').click();
    h.choose(doc, 'bondTypes', 'correct');
    h.click(doc, 's2aHeatBtn'); await h.tick(w, 30);
    h.choose(doc, 'meltQ', 'correct'); h.choose(doc, 'stateQ', 'correct');
    eq(doc.querySelectorAll('#s2bSamples .sample-tile').length, 6);
    eq(doc.querySelectorAll('#s2cSamples .sample-tile').length, 3);
    // عناصر الدائرة: بطارية (مستطيل واحد) ومصباح (دائرة واحدة زجاجية)
    eq(doc.querySelectorAll('#stage2b .battery-box').length, 1);
    eq(doc.querySelectorAll('#stage2b .bulb-glass').length, 1);
  });
});

describe('هندسة المحطة 3 — البوتقة', function(){
  it('قطبان اثنان، وبوتقة واحدة، وصندوق أميتر واحد', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#stage3 .electrode').length, 2);
    eq(doc.querySelectorAll('#stage3 .crucible-body').length, 1);
    eq(doc.querySelectorAll('#stage3 .ammeter-box').length, 1);
  });
});

describe('هندسة المحطة 4 — شبكة الثلج', function(){
  it('ستّة جزيئات ماء، كل جزيء فيه رابطتان تساهميتان وذرّتا هيدروجين وذرّة أكسجين واحدة', async function(){
    const s = await page();
    const { doc, w } = s;
    h.choose(doc, 'breakIonic', 'correct');
    eq(doc.querySelectorAll('#stage4ice .water-molecule').length, 6);
    eq(doc.querySelectorAll('#stage4ice .covalent-stick').length, 12);
    eq(doc.querySelectorAll('#stage4ice .molecule-h').length, 12);
    eq(doc.querySelectorAll('#stage4ice .molecule-o').length, 6);
  });

  it('خطوط القوى الجزيئية البينيّة تفنى عند التسخين ولا الروابط التساهمية', async function(){
    const s = await page();
    const { doc, w } = s;
    h.choose(doc, 'breakIonic', 'correct');
    const imfCountBefore = doc.querySelectorAll('#stage4ice .imf-dots').length;
    ok(imfCountBefore > 0, 'يجب أن توجد خطوط بينيّة قبل التسخين');
    h.click(doc, 's4IceHeatBtn');
    await h.tick(w, 30);
    // العصيّ التساهمية تبقى بالعدد نفسه بعد التسخين — لا كسر لها
    eq(doc.querySelectorAll('#stage4ice .covalent-stick').length, 12);
    doc.querySelectorAll('#stage4ice .imf-dots').forEach(function(l){
      eq(l.style.opacity, '0', 'خطّ بينيّ لم يتلاشَ بعد التسخين');
    });
  });
});

describe('هندسة المحطة 5 — الشبكتان', function(){
  it('اثنا عشر أيونًا في الشبكة الأيونية، بينها ستّة سالبة الشحنة', async function(){
    const { doc } = await page();
    const ions = doc.querySelectorAll('#stage5lattice .lattice-ion');
    eq(ions.length, 12);
    eq(doc.querySelectorAll('#stage5lattice .ion-body.negative').length, 6);
  });

  it('الشبكة الفلزّية: ثمانية عشر قرصًا موجبًا ثابتًا وإلكترونات حرّة الحركة', async function(){
    const s = await page();
    const { doc, w } = s;
    h.choose(doc, 'breakIonic', 'correct'); // لا علاقة، فقط لضمان تحميل عادي
    const ions = doc.querySelectorAll('#stage5lattice .lattice-ion');
    for(let i = 0; i < 3; i++) ions[i].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    h.choose(doc, 'latticeQ', 'correct');
    h.click(doc, 's5MeltBtn'); await h.tick(w, 30);
    h.choose(doc, 'solutionQ', 'correct');
    eq(doc.querySelectorAll('#stage5metal .ion').length, 18);
    ok(doc.querySelectorAll('#stage5metal .edot.free').length >= 16);
  });
});

describe('هندسة المحطة 6 — الإيثين', function(){
  it('ذرّتا كربون، وأربع ذرّات هيدروجين، وستّ روابط (رابطة مزدوجة + أربع مفردة)', async function(){
    const s = await page();
    const { doc, w } = s;
    [['كلوريد المغنيسيوم', 'cat-ionic'], ['أكسيد البوتاسيوم', 'cat-ionic'],
     ['الأكسجين', 'cat-covalent'], ['الكلور', 'cat-covalent'],
     ['الذهب', 'cat-metal'], ['التيتانيوم', 'cat-metal']].forEach(function(pair){
      const chip = Array.from(doc.querySelectorAll('.chips-pool .chip')).find(function(c){ return c.dataset.value === pair[0]; });
      const slot = doc.getElementById(pair[1]);
      h.selectChip(chip);
      slot.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    });
    eq(doc.querySelectorAll('#stage6ethene .ethene-carbon').length, 2);
    eq(doc.querySelectorAll('#stage6ethene .ethene-hydrogen').length, 4);
    eq(doc.querySelectorAll('#stage6ethene .ethene-bond').length, 6);
    eq(doc.querySelectorAll('#stage6ethene .ethene-bond.double').length, 2);
  });
});

describe('هندسة المحطة 7 — رسم السؤال 6', function(){
  it('اثنا عشر كرة متبادلة اللون (ستّ خضراء وستّ بيضاء)', async function(){
    const { doc } = await page();
    const circles = doc.querySelectorAll('#stageE6 circle');
    eq(circles.length, 12);
    const green = Array.from(circles).filter(function(c){ return c.getAttribute('fill') === '#2ecc9f'; });
    eq(green.length, 6);
  });
});

run();
