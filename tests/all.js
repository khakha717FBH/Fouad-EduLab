'use strict';
/* عدّاء جامع: node tests/all.js
   يشغّل كل مجموعات الاختبار الواحدة تلو الأخرى ويلخّص النتيجة. */

const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = [
  'quiz-engines.test.js',   // المحرّكات المشتركة نفسها
  'chips-multi.test.js',    // توسعة التصنيف متعدّد إلى واحد
  'lesson-03.test.js',      // الدرس المُهاجَر إليها
  'lesson-04.test.js',      // أول درس بُني على المحرّكات من أوّله
  'geometry-l4.test.js',    // فحص عددي للمسارح: ما لا يكشفه اختبار المنطق
  'lesson-05.test.js',      // الرابطة الفلزّية — أول درس على محرّك التصنيف
  'geometry-l5.test.js',    // فحص عددي لمسارح درس 05
  'lesson-06.test.js',      // الخصائص الثلاث — أوّل درس بلا توسعة في المشترك
  'geometry-l6.test.js',    // فحص عددي لمسارح مختبر درس 06
  'lesson-01.test.js',      // انحدار: درس يرث template.js ولا يستعملها
  'lesson-02.test.js',      // حصانة: درس لا يربط المشترك أصلًا
  'lesson-u2-01.test.js',   // الوحدة 02 · الدرس 01 — أوّل درس أحياء
  'geometry-u2-01.test.js', // فحص عددي لمسارح الوحدة 02 · الدرس 01
  'lesson-u2-02.test.js',   // الوحدة 02 · الدرس 02 — إنتاج خلايا الدم
  'geometry-u2-02.test.js'  // فحص عددي لمسارح الوحدة 02 · الدرس 02
];

let pass = 0, fail = 0, broken = [];

SUITES.forEach(function (file) {
  console.log('\n' + '#'.repeat(60));
  console.log('# ' + file);
  console.log('#'.repeat(60));
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], {
    stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'
  });
  process.stdout.write(r.stdout || '');
  const m = /ناجح:\s*(\d+)\s+فاشل:\s*(\d+)/.exec(r.stdout || '');
  if (m) { pass += +m[1]; fail += +m[2]; }
  else { broken.push(file); }
});

console.log('\n' + '='.repeat(60));
console.log('المجموع الكلّي — ناجح: ' + pass + '   فاشل: ' + fail);
if (broken.length) console.log('مجموعات لم تُنتج ملخّصًا: ' + broken.join(' · '));
process.exit(fail || broken.length ? 1 : 0);
