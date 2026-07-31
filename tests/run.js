'use strict';
/* عدّاء اختبارات صغير: لا يعتمد على أي إطار خارجي.
   الغرض أن تبقى الاختبارات قابلة للتشغيل بـnode وحده داخل المستودع. */

const groups = [];
let current = null;

function describe(name, fn) {
  current = { name, tests: [] };
  groups.push(current);
  fn();
  current = null;
}

function it(name, fn) {
  if (!current) throw new Error('it خارج describe');
  current.tests.push({ name, fn });
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg ? msg + ' — ' : '') + 'توقّعتُ ' + JSON.stringify(expected) + ' فجاء ' + JSON.stringify(actual));
  }
}
function ok(v, msg) { if (!v) throw new Error(msg || 'توقّعتُ قيمة صادقة'); }
function no(v, msg) { if (v) throw new Error(msg || 'توقّعتُ قيمة كاذبة'); }
function has(text, part, msg) {
  if (String(text || '').indexOf(part) === -1) {
    throw new Error((msg ? msg + ' — ' : '') + 'لم أجد «' + part + '» في «' + String(text).slice(0, 90) + '»');
  }
}

async function run() {
  let pass = 0, fail = 0;
  const failures = [];
  for (const g of groups) {
    console.log('\n▸ ' + g.name);
    for (const t of g.tests) {
      try {
        await t.fn();
        pass++;
        console.log('  ✓ ' + t.name);
      } catch (e) {
        fail++;
        failures.push(g.name + ' › ' + t.name + '\n      ' + e.message);
        console.log('  ✗ ' + t.name + '\n      ' + e.message);
      }
    }
  }
  console.log('\n' + '='.repeat(60));
  console.log('ناجح: ' + pass + '   فاشل: ' + fail + '   المجموع: ' + (pass + fail));
  if (failures.length) {
    console.log('\nالإخفاقات:');
    failures.forEach(f => console.log(' • ' + f));
  }
  process.exit(fail ? 1 : 0);
}

module.exports = { describe, it, eq, ok, no, has, run };
