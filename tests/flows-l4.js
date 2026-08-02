'use strict';
/* =========================================================
   مسارات الطالب في درس 04
   ---------------------------------------------------------
   كل دالّة هنا تحاكي ما يفعله الطالب بيده: يختار، ينقر
   إلكترونًا، يسحب رقاقة. لا اسم دالّة داخلية ولا سمة نطاق —
   وهذا شرط بقاء الاختبارات صالحة بعد أي ترقية.
   ========================================================= */
const h = require('./harness');

const FILE = 'semester-1/unit-01/lesson-04.html';

function load(opts) { return h.loadLesson(FILE, opts); }

/** الإلكترونات القابلة للنقر داخل مسرح بعينه */
function live(doc, svgId) {
  return Array.from(doc.querySelectorAll('#' + svgId + ' .epos.clickable'));
}

/** يكوّن زوجًا مشتركًا واحدًا: إلكترون من كل ذرّة */
async function makePair(w, doc, svgId) {
  const c = live(doc, svgId);
  if (c.length < 2) throw new Error('لا إلكترونين مفتوحين في ' + svgId);
  h.clickNode(c[0]);
  await h.tick(w, 60);
  h.clickNode(c[1]);
  await h.tick(w, 200);   // تقارب الذرّتين ثم استقرار الزوج
}

/** يربط ذرّة هيدروجين بالترتيب */
async function bondH(w, doc, svgId, index) {
  const hs = Array.from(doc.querySelectorAll('#' + svgId + ' .h-atom'));
  h.clickNode(hs[index]);
  await h.tick(w, 200);   // طيران الذرّة إلى موضعها ثم استقرار الزوج
  return hs[index];
}

/** يملأ عمود «عدد الروابط» في جدول المحطة 6 */
async function fillTable(w, doc) {
  const rows = [['slot-h', '1'], ['slot-o', '2'], ['slot-n', '3'], ['slot-c', '4']];
  for (const [slotId, value] of rows) {
    const chip = Array.from(doc.querySelectorAll('#bondPool .chip'))
      .find(c => c.dataset.value === value && !c.classList.contains('placed'));
    if (!chip) throw new Error('لا رقاقة متاحة بالقيمة ' + value);
    h.selectChip(chip);
    await h.tick(w, 15);
    h.clickNode(doc.getElementById(slotId));
    await h.tick(w, 15);
  }
  await h.tick(w, 120);
}

/** المسار الكامل من المحطة 1 إلى نهاية المحطة 6 */
async function fullPath(w, doc) {
  h.choose(doc, 'l4predict', 'p3');
  await h.tick(w, 15);

  h.choose(doc, 'clValence', 'correct'); await h.tick(w, 15);
  h.choose(doc, 'clNeeds', 'correct');   await h.tick(w, 40);
  await makePair(w, doc, 'stage2');
  h.choose(doc, 'clCount', 'correct');   await h.tick(w, 320);
  h.choose(doc, 'whyShare', 'correct');  await h.tick(w, 20);

  h.choose(doc, 'identify', 'correct');  await h.tick(w, 20);

  h.choose(doc, 'oNeeds', 'correct');    await h.tick(w, 40);
  await makePair(w, doc, 'stage4o');
  await makePair(w, doc, 'stage4o');
  h.choose(doc, 'cmpPairs', 'correct');  await h.tick(w, 50);
  await makePair(w, doc, 'stage4n');
  await makePair(w, doc, 'stage4n');
  await makePair(w, doc, 'stage4n');
  h.clickNode(doc.getElementById('showModels4')); await h.tick(w, 20);
  h.choose(doc, 'stickQ', 'correct');    await h.tick(w, 20);

  await makePair(w, doc, 'stage5h');
  for (let i = 0; i < 4; i++) await bondH(w, doc, 'stage5c', i);
  await h.tick(w, 60);
  for (let i = 0; i < 3; i++) await bondH(w, doc, 'stage5n', i);
  await h.tick(w, 60);
  for (let i = 0; i < 2; i++) await bondH(w, doc, 'stage5w', i);
  await h.tick(w, 60);
  h.choose(doc, 'sameNum', 'correct');   await h.tick(w, 20);
  h.clickNode(doc.getElementById('showModels5')); await h.tick(w, 20);

  await fillTable(w, doc);
  h.choose(doc, 'valencyQ', 'correct');  await h.tick(w, 20);
  h.choose(doc, 'phosQ', 'correct');     await h.tick(w, 20);
  h.choose(doc, 'shapeQ', 'correct');    await h.tick(w, 50);
}

module.exports = { FILE, load, live, makePair, bondH, fillTable, fullPath };
