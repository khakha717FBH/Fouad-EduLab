'use strict';
/* =========================================================
   مولّد لقطات المسارح
   ---------------------------------------------------------
   node tests/snapshot-l4.js
   يُشغّل الدرس، يمرّ بالمسارح في حالتيها (قبل الربط وبعده)،
   ثم يُخرج صفحة واحدة فيها كل اللقطات لفحصها بالعين — وهو
   الفحص الوحيد الذي لا يؤدّيه أي اختبار منطقي.
   ========================================================= */
const fs = require('fs');
const path = require('path');
const h = require('./harness');
const f = require('./flows-l4');

const OUT = path.resolve(__dirname, '..', 'lesson-04-snapshots.html');

function grab(doc, id) {
  const svg = doc.getElementById(id);
  return svg ? svg.outerHTML : '<p>مفقود: ' + id + '</p>';
}

/** بطاقات النماذج ليست مسرحًا: تُلتقط بوصفها كتلة كاملة */
function grabBlock(doc, id) {
  const n = doc.getElementById(id);
  return n ? n.innerHTML : '<p>مفقود: ' + id + '</p>';
}

(async () => {
  const shots = [];
  const blocks = [];
  const { w, doc } = await f.load();

  shots.push(['المحطة 1 — أزمة في عالم الكلور', grab(doc, 'stage1')]);

  h.choose(doc, 'clValence', 'correct'); await h.tick(w, 20);
  h.choose(doc, 'clNeeds', 'correct'); await h.tick(w, 80);
  h.choose(doc, 'clMarks', 'correct'); await h.tick(w, 30);
  shots.push(['الكلور — قبل الربط (الذرّتان متباعدتان)', grab(doc, 'stage2')]);

  await f.makePair(w, doc, 'stage2');
  await h.tick(w, 200);
  h.choose(doc, 'clCount', 'correct'); await h.tick(w, 400);
  shots.push(['الكلور — بعد الربط والعدّادين', grab(doc, 'stage2')]);

  h.choose(doc, 'whyShare', 'correct'); await h.tick(w, 30);
  h.choose(doc, 'identify', 'correct'); await h.tick(w, 30);

  h.choose(doc, 'oNeeds', 'correct'); await h.tick(w, 80);
  shots.push(['الأكسجين — قبل الربط', grab(doc, 'stage4o')]);
  await f.makePair(w, doc, 'stage4o');
  await f.makePair(w, doc, 'stage4o');
  await h.tick(w, 200);
  shots.push(['الأكسجين — رابطة ثنائية', grab(doc, 'stage4o')]);

  h.choose(doc, 'cmpPairs', 'correct'); await h.tick(w, 80);
  await f.makePair(w, doc, 'stage4n');
  await f.makePair(w, doc, 'stage4n');
  await f.makePair(w, doc, 'stage4n');
  await h.tick(w, 200);
  shots.push(['النيتروجين — رابطة ثلاثية', grab(doc, 'stage4n')]);
  h.click(doc, 'showModels4'); await h.tick(w, 60);
  h.choose(doc, 'stickQ', 'correct'); await h.tick(w, 40);

  shots.push(['الهيدروجين — قبل الربط', grab(doc, 'stage5h')]);
  await f.makePair(w, doc, 'stage5h');
  await h.tick(w, 200);
  shots.push(['الهيدروجين — رابطة أحادية', grab(doc, 'stage5h')]);

  shots.push(['الميثان — قبل الربط (الهيدروجين في البِركة)', grab(doc, 'stage5c')]);
  for (let i = 0; i < 4; i++) await f.bondH(w, doc, 'stage5c', i);
  await h.tick(w, 250);
  shots.push(['الميثان — بعد الربط', grab(doc, 'stage5c')]);

  for (let i = 0; i < 3; i++) await f.bondH(w, doc, 'stage5n', i);
  await h.tick(w, 250);
  await f.bondH(w, doc, 'stage5n', 3);
  await h.tick(w, 1600);
  shots.push(['الأمونيا — ثلاث روابط والرابعة مرتدّة', grab(doc, 'stage5n')]);

  for (let i = 0; i < 2; i++) await f.bondH(w, doc, 'stage5w', i);
  await h.tick(w, 250);
  shots.push(['الماء — رابطتان أحاديتان', grab(doc, 'stage5w')]);

  h.choose(doc, 'sameNum', 'correct'); await h.tick(w, 60);
  h.click(doc, 'showModels5'); await h.tick(w, 80);

  blocks.push(['نموذجا المحطة 4 — الأكسجين والنيتروجين', grabBlock(doc, 'models4')]);
  blocks.push(['نماذج المحطة 5 — الجزيئات الأربعة', grabBlock(doc, 'models5')]);

  const raw = fs.readFileSync(path.resolve(__dirname, '..', f.FILE), 'utf8');
  const css = /<style>([\s\S]*?)<\/style>/.exec(raw)[1];

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>لقطات مسارح درس 04</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="shared/identity/identity.css">
<link rel="stylesheet" href="shared/template-boilerplate/template.css">
<style>${css}
  body{padding:24px;}
  h2{font-size:1rem;color:var(--turquoise);margin:34px 0 10px;}
  .shot{max-width:920px;margin:0 auto 10px;}
</style></head><body>
<h1 style="text-align:center;font-size:1.2rem">لقطات مسارح درس 04 — للفحص البصري</h1>
${shots.map(([t, s]) => `<h2>${t}</h2><div class="shot stage-wrap">${s}</div>`).join('\n')}
${blocks.map(([t, s]) => `<h2>${t}</h2><div class="shot">${s}</div>`).join('\n')}
</body></html>`;

  fs.writeFileSync(OUT, html, 'utf8');
  console.log('كُتبت اللقطات: ' + OUT);
  console.log('عددها: ' + (shots.length + blocks.length));
})().catch(e => { console.error(e); process.exit(1); });
