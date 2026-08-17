'use strict';
/* ==========================================================
   حرّاس مشتركة معامَلة — tests/guards.js
   ----------------------------------------------------------
   قاعدتان منصّيتان تسريان على كل درس فيه أسئلة اختيار، فتُكتبان
   هنا مرّة واحدة وتُنادى من مجموعة كل درس بمعطياته:

     1) تنويع موضع الإجابة الصحيحة بين أ/ب/ج/د
     2) ألّا يفضح طولُ الإجابة الصحيحة الإجابةَ

   ولماذا هنا لا في كل درس: الحارسان كُتبا من جديد سبع مرّات،
   فتبدّلا في كل مرّة. أربع نسخ من حارس التنويع كانت تفرض أربع
   شدّات مختلفة للقاعدة نفسها (3 مرّات · 4 مرّات · نصف الأسئلة ·
   أربعة مواضع بالضبط). والقاعدة الواحدة لا تُفرض بأربعة أحكام.

   وما لا يدخل هنا: كل حارس يخصّ مسرحًا بعينه. توحيدها يصنع
   طبقة تجريد تجعل كل فحص أصعب تتبّعًا — وهي المشكلة المعاكسة.
   ========================================================== */

/* ــــ التقاط مجموعات الاختيار ــــ
   المجموعة تُعرَف بوجود خيار صحيح معلن، لا بموضعها في الوسم:
   مجموعات التصنيف والرقاقات تحمل data-q أيضًا ولا خيار صحيح
   فيها بهذا المعنى. */
function correctIndexOf(group){
  const inputs = Array.prototype.slice.call(
    group.querySelectorAll('.quiz-option input'));
  return inputs.findIndex(function(i){
    return i.value === 'correct' || i.value === 'ok';
  });
}

/* طول ما يقرأه الطالب فعلًا: المسافات المتتالية تُطوى إلى واحدة،
   وإلا حُسبت مسافات الوسم داخل الخيار حروفًا. */
function optionLengthsOf(group){
  return Array.prototype.map.call(
    group.querySelectorAll('.quiz-option'),
    function(o){ return o.textContent.replace(/\s+/g, ' ').trim().length; });
}

/* سؤالٌ خياراته رسوم لا نصّ (أ/ب/ج/د فوق مخطّطات) لا يُقاس طوله:
   ما يقارنه الطالب شكلٌ لا جملة، والحرف الواحد تحت كل رسم يجعل
   القياس بلا معنى. رُصد في الوحدة 01 · درس 04 · سؤال ev2. */
function hasVisualOptions(group){
  return Array.prototype.some.call(
    group.querySelectorAll('.quiz-option'),
    function(o){ return !!o.querySelector('svg, img'); });
}

/* كل أسئلة الاختيار في الصفحة — تدريبًا وتقييمًا */
function mcqGroups(doc){
  return Array.prototype.slice.call(doc.querySelectorAll('.quiz-options[data-q]'))
    .filter(function(g){ return correctIndexOf(g) >= 0; });
}

/* أسئلة التقييم الختامي وحدها */
function evalGroups(doc){
  return mcqGroups(doc).filter(function(g){ return !!g.closest('#evalQuestions'); });
}

/* عدّ المواضع الأربعة */
function spreadOf(groups){
  const at = [0, 0, 0, 0];
  groups.forEach(function(g){
    const i = correctIndexOf(g);
    if(i >= 0 && i < 4) at[i]++;
  });
  return at;
}

/* ==========================================================
   1) تنويع موضع الإجابة الصحيحة

   الحكم الموحَّد: ثلاثة مواضع مختلفة على الأقلّ، ولا موضع
   يحمل أكثر من نصف الإجابات الصحيحة. ويُشدَّد بـminDistinct
   حيث يحتمله الدرس، ولا يُرخَّى تحت هذا الحدّ.
   ========================================================== */
function assertPositionSpread(api, groups, opts){
  const o = opts || {};
  const label = o.label || 'أسئلة الاختيار';
  const at = spreadOf(groups);
  const n = groups.length;
  const distinct = at.filter(function(c){ return c > 0; }).length;
  const most = Math.max.apply(null, at);

  if(o.expect) api.eq(n, o.expect, label + ': عدد الأسئلة ' + n + ' والمتوقَّع ' + o.expect);
  api.ok(n > 0, label + ': لا سؤال اختيار واحد — الحارس يقيس فراغًا');

  api.ok(distinct >= (o.minDistinct || 3),
    label + ': المواضع المستعملة [' + at.join('/') + '] — المطلوب ' +
    (o.minDistinct || 3) + ' مواضع مختلفة على الأقلّ');

  const ceiling = o.maxAtOne || Math.ceil(n / 2);
  api.ok(most <= ceiling,
    label + ': موضع واحد يحمل ' + most + ' من ' + n +
    ' إجابة صحيحة [' + at.join('/') + '] — السقف ' + ceiling);
}

/* ==========================================================
   2) فارق طول الإجابة الصحيحة

   الحدّ 12 حرفًا. والعلاج المفضَّل عند تجاوزه إطالة صياغة
   المشتّتات لا تقصير الإجابة الصحيحة.

   وخيار known: مخالفات قائمة مسجَّلة بقيمها الفعلية. ليست
   إعفاءً — هي سقف معلن ينهار إن ازدادت المخالفة. وكل مدخلة
   تحمل سبب بقائها وشرط خروجها، وتُحذف عند إصلاح النصّ.
   ========================================================== */
function assertLengthGap(api, groups, opts){
  const o = opts || {};
  const limit = o.limit || 12;
  const known = o.known || {};
  const offenders = [];

  groups.forEach(function(g){
    const i = correctIndexOf(g);
    if(hasVisualOptions(g)) return;
    const L = optionLengthsOf(g);
    if(i < 0 || L.length < 2) return;
    const wrong = L.filter(function(_, k){ return k !== i; });
    const gap = L[i] - Math.max.apply(null, wrong);
    const q = g.getAttribute('data-q') || '(بلا data-q)';

    if(Object.prototype.hasOwnProperty.call(known, q)){
      api.ok(gap <= known[q],
        q + ': مخالفة مسجَّلة ازدادت — كانت +' + known[q] + ' فصارت +' + gap +
        '. الاستثناء سقفٌ لا إذن.');
      return;
    }
    if(gap > limit) offenders.push(q + ' (+' + gap + ')');
  });

  api.eq(offenders.length, 0,
    'خيارات صحيحة أطول من أطول مشتّت بأكثر من ' + limit + ' حرفًا: ' +
    offenders.join(' · '));
}

/* ==========================================================
   3) الدلالة المعكوسة

   علاج فارق الطول هو إطالة المشتّتات. وإفراط الإطالة يصنع
   الدلالة المقلوبة: «الخيار الشاذّ في طوله هو الجواب» يصير
   «الأقصر هو الجواب». فالمقياس ليس اتّجاه الفارق بل شذوذ
   الطول في أي اتّجاه: لا خيار يفارق وسط إخوته بأكثر من
   spread حرفًا.
   ========================================================== */
function assertLengthBand(api, groups, opts){
  const o = opts || {};
  const spread = o.spread || 40;
  const offenders = [];

  groups.forEach(function(g){
    if(hasVisualOptions(g)) return;
    const L = optionLengthsOf(g);
    if(L.length < 2) return;
    const range = Math.max.apply(null, L) - Math.min.apply(null, L);
    if(range > spread){
      offenders.push((g.getAttribute('data-q') || '?') + ' (مدى ' + range + ')');
    }
  });

  api.eq(offenders.length, 0,
    'أسئلة تتفاوت أطوال خياراتها بأكثر من ' + spread + ' حرفًا، فيصير الطول دلالة: ' +
    offenders.join(' · '));
}

/* ==========================================================
   تركيب المجموعتين دفعةً واحدة — الاستعمال المعتاد في كل درس
   ========================================================== */
function describeMcqRules(api, getDoc, opts){
  const o = opts || {};
  api.describe(o.title || 'قواعد أسئلة الاختيار — حرّاس مشتركة', function(){

    api.it('تنويع موضع الإجابة الصحيحة في التقييم الختامي', async function(){
      const doc = await getDoc();
      assertPositionSpread(api, evalGroups(doc),
        Object.assign({ label: 'التقييم' }, o.evalSpread || {}));
    });

    api.it('تنويع موضع الإجابة الصحيحة في الدرس كلّه لا التقييم وحده', async function(){
      const doc = await getDoc();
      assertPositionSpread(api, mcqGroups(doc),
        Object.assign({ label: 'الدرس كلّه' }, o.lessonSpread || {}));
    });

    api.it('طول الإجابة الصحيحة لا يفضحها — في الدرس كلّه', async function(){
      const doc = await getDoc();
      assertLengthGap(api, mcqGroups(doc), o.lengthGap || {});
    });

    api.it('لا خيار شاذّ الطول في أيّ اتّجاه — التقييم الختامي', async function(){
      const doc = await getDoc();
      assertLengthBand(api, evalGroups(doc), o.lengthBand || {});
    });
  });
}

module.exports = {
  correctIndexOf, optionLengthsOf, hasVisualOptions, mcqGroups, evalGroups, spreadOf,
  assertPositionSpread, assertLengthGap, assertLengthBand, describeMcqRules
};
