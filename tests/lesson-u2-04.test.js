'use strict';
/* ==========================================================
   اختبارات سلوك — الوحدة 02 · الدرس 04
   "كيف تساعدك العضلات الثنائية المتضادة على الحركة؟"
   ----------------------------------------------------------
   تُكتب على ما يراه الطالب ويفعله، لا على البنية الداخلية.
   المجموعات تُلتقط باسم حقل الراديو، والمقابض بمعرّفاتها لأنها
   جزء من دلالة الواجهة (أزرار معلنة بـrole) لا من تفاصيل المحرّك.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const h = require('./harness');

const FILE = 'semester-1/unit-02/lesson-04.html';

function scenario(opts){
  const s = { ready: null };
  s.boot = function(){
    if(!s.ready) s.ready = h.loadLesson(FILE, opts || {}).then(r => Object.assign(s, r));
    return s.ready;
  };
  return s;
}

let cached = null;
async function page(){
  if(!cached) cached = await h.loadLesson(FILE, {});
  return cached;
}

/* ــــ أدوات محلّية ــــ */
function keyOn(node, key){
  const W = node.ownerDocument.defaultView;
  node.dispatchEvent(new W.KeyboardEvent('keydown', { key, bubbles: true }));
}
function chipInto(doc, w, value, slotId){
  const chip = Array.from(doc.querySelectorAll('.chips-pool .chip'))
    .find(c => c.dataset.value === value && !c.classList.contains('placed'));
  if(!chip) throw new Error('رقاقة غير موجودة أو موضوعة مسبقًا: ' + value);
  h.selectChip(chip);
  doc.getElementById(slotId).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}
function visibleText(node){
  if(!node) return '';
  if(node.nodeType === 3) return node.textContent;
  if(node.nodeType !== 1) return '';
  if(node.hidden) return '';
  let out = '';
  node.childNodes.forEach(c => { out += visibleText(c); });
  return out;
}
function optionTexts(doc, name){
  return Array.from(h.groupByName(doc, name).querySelectorAll('.quiz-option'))
    .map(o => (o.textContent || '').trim());
}
function correctIndex(doc, name){
  const opts = Array.from(h.groupByName(doc, name).querySelectorAll('.quiz-option'));
  return opts.findIndex(o => o.querySelector('input').value === 'correct');
}
const PRACTICE_Q = [
  'u2l4-push-result', 'u2l4-bring-down', 'u2l4-contract-means',
  'u2l4-extend-pattern', 'u2l4-close-count', 'u2l4-two-way-pattern',
  'u2l4-tear-symptom', 'u2l4-model-critique-bonus'
];
const EVAL_Q = ['u2l4-e1','u2l4-e2','u2l4-e3','u2l4-e4','u2l4-e5','u2l4-e6','u2l4-e7','u2l4-e8'];

/* ---------------------------------------------------------
   1) البنية العامة والتوصيل
   --------------------------------------------------------- */
describe('البنية والتوصيل', function(){

  it('ستّ محطات وستّ نقاط تقدّم — والنقاط لا تُحذف ولا تُنقص', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('.station').length, 6);
    eq(doc.querySelectorAll('.progress-dot').length, 6);
  });

  it('كل نقطة تقدّم تشير إلى محطة موجودة، ولا مرحلة داخلية تأخذ نقطة', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.progress-dot').forEach(function(dot){
      const id = dot.getAttribute('data-target');
      ok(doc.getElementById(id), 'نقطة تشير إلى محطة غير موجودة: ' + id);
      ok(doc.getElementById(id).classList.contains('station'), id + ' ليست محطة');
    });
  });

  it('وسوم shared/ الستّة تسبق سكربت الدرس بالترتيب المعتمد', async function(){
    const { raw } = await page();
    const srcs = [];
    const re = /<script\s+src="([^"]+)"\s*><\/script>/g;
    let m;
    while((m = re.exec(raw))) srcs.push(m[1]);
    eq(srcs.join(' | '), [
      '../../shared/sounds/sounds.js',
      '../../shared/xp-system/xp.js',
      '../../shared/faheem-widget/faheem.js',
      '../../shared/template-boilerplate/template.js',
      '../../shared/certificate-system/certificate.js',
      '../../shared/identity/footer.js'
    ].join(' | '));
    const lastShared = raw.lastIndexOf('<script src="../../shared/identity/footer.js">');
    const inline = raw.indexOf('<script>\n/* ═');
    ok(inline > lastShared, 'سكربت الدرس يسبق وسوم المشترك — عطل صامت');
  });

  it('المحرّكات المشتركة حاضرة، ولا تحذير «سؤال بلا تسجيل» ولا خطأ', async function(){
    const { w, logs } = await page();
    ok(w.Quiz && w.Chips && w.XP, 'محرّك مفقود');
    const bad = logs.filter(l => /jsdomError|بلا تسجيل|بلا وسم|ناقصة العناصر/.test(l));
    eq(bad.length, 0, logs.join(' \n '));
  });

  it('الشهادة مربوطة، ولا نداء Certificate.finish مكتوبًا في سكربت الدرس', async function(){
    const { raw } = await page();
    has(raw, '../../shared/certificate-system/certificate.js');
    has(raw, "title: 'كيف تساعدك العضلات الثنائية المتضادة على الحركة؟'");
    eq(/Certificate\.finish\s*\(/.test(raw), false, 'نداء الشهادة يدويّ — يجب أن يبقى بنيويًّا');
  });

  it('حاوية زرّ الشهادة موجودة فلا يُحقن الزرّ عائمًا فوق زرّ فهيم', async function(){
    const { doc } = await page();
    ok(doc.getElementById('certTriggerSlot'));
  });

  it('المحطات كلّها في الوسم منذ التحميل بلا hidden', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.station').forEach(function(sec){
      no(sec.hidden, 'محطة محجوبة عند التحميل: ' + sec.id);
    });
  });

  it('لكل نشاط رقاقات عنصر chips-feedback داخل حاويته — وإلا ضاعت التلميحات صامتة', async function(){
    const { doc } = await page();
    const wraps = doc.querySelectorAll('[data-chips]');
    ok(wraps.length >= 2, 'نشاطا الرقاقات غير موجودين');
    wraps.forEach(function(wrap){
      ok(wrap.querySelector('.chips-feedback'),
         'نشاط بلا chips-feedback: ' + wrap.getAttribute('data-chips'));
    });
  });

  it('data-q سمة مفردة فريدة لكل سؤال، بلا سمات شقيقة', async function(){
    const { doc } = await page();
    const seen = {};
    doc.querySelectorAll('.quiz-options[data-q]').forEach(function(g){
      const q = g.getAttribute('data-q');
      no(seen[q], 'data-q مكرّر: ' + q);
      seen[q] = true;
      const radio = g.querySelector('input[type="radio"]');
      eq(radio.getAttribute('name'), q, 'اسم الحقل يخالف data-q في ' + q);
    });
    eq(Object.keys(seen).length, PRACTICE_Q.length + EVAL_Q.length);
  });

  it('لكل مجموعة سؤال عنصر تغذية باصطلاح fb-الاسم', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.quiz-options[data-q]').forEach(function(g){
      const q = g.getAttribute('data-q');
      ok(doc.getElementById('fb-' + q), 'تغذية مفقودة: fb-' + q);
    });
  });
});

/* ---------------------------------------------------------
   2) المحطة 1 — التنبّؤان
   --------------------------------------------------------- */
describe('المحطة 1 — أين تشعر بالشدّ', function(){

  it('التنبّؤ الأول لا يُصحَّح، والثاني لا يظهر قبله', async function(){
    const s = scenario(); const { doc } = await s.boot();
    no(h.visible(doc, 's1CountStep'), 'سؤال العدد ظهر قبل سؤال الموضع');
    h.choose(doc, 's1where', 'b');
    ok(h.visible(doc, 's1CountStep'));
    const fb = doc.getElementById('fb-s1where');
    ok(fb.classList.contains('is-hint'), 'التنبّؤ صُحِّح وهو محايد');
    no(fb.classList.contains('is-correct'));
  });

  it('أي خيار في التنبّؤ يمضي بالطالب — لا خيار «صحيح» فيه', async function(){
    const { doc } = await page();
    ['s1where', 's1count', 's2predict', 's4predict', 's5predict'].forEach(function(name){
      const g = h.groupByName(doc, name);
      const c = g.querySelector('input[value="correct"]');
      no(c, 'تنبّؤ يحمل إجابة صحيحة: ' + name);
    });
  });

  it('زرّ الانتقال لا يظهر قبل التنبّؤين', async function(){
    const s = scenario(); const { doc } = await s.boot();
    no(h.visible(doc, 's1done'));
    h.choose(doc, 's1where', 'a');
    no(h.visible(doc, 's1done'), 'ظهر بعد تنبّؤ واحد');
    h.choose(doc, 's1count', 'b');
    ok(h.visible(doc, 's1done'));
  });

  it('الظلّية ملفّ مستقلّ بجوار الدرس، ولها نصّ بديل يصف الوضع', async function(){
    const { doc } = await page();
    const img = doc.querySelector('#station-1 img');
    eq(img.getAttribute('src'), 'weightlifter-silhouette.svg');
    ok((img.getAttribute('alt') || '').length > 25, 'نصّ بديل ناقص');
  });

  it('المحطة 1 لا تسمّي عضلةً ولا مصطلحًا من مصطلحات الدرس', async function(){
    const { doc } = await page();
    const t = visibleText(doc.getElementById('station-1'));
    ['ذات الرأسين', 'ثلاثية الرؤوس', 'متضادة', 'تنقبض', 'تنبسط'].forEach(function(w){
      eq(t.indexOf(w), -1, 'مصطلح سبق محطته في المحطة 1: ' + w);
    });
  });
});

/* ---------------------------------------------------------
   3) المحطة 2 — الخيط والمعجون
   --------------------------------------------------------- */
describe('المحطة 2 — الخيط لا يدفع', function(){

  it('المسرح لا يظهر قبل التنبّؤ — والأداة مرئية في السؤال', async function(){
    const s = scenario(); const { doc } = await s.boot();
    no(h.visible(doc, 's2StageBox'), 'المسرح سبق التنبّؤ');
    ok(h.visible(doc, 's2LabCard'), 'بطاقة الأداة تسبق المسرح');
    h.choose(doc, 's2predict', 'b');
    ok(h.visible(doc, 's2StageBox'));
  });

  it('السحب يزيح المعجون، والدفع لا يزيحه', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's2predict', 'a');
    const stage = doc.getElementById('cordStage');

    keyOn(stage, 'ArrowRight');
    ok(stage.classList.contains('pulling'), 'السحب لم يغيّر الحالة');
    no(stage.classList.contains('pushing'));

    keyOn(stage, 'ArrowLeft');
    ok(stage.classList.contains('pushing'), 'الدفع لم يغيّر الحالة');
    no(stage.classList.contains('pulling'));
  });

  it('عدّاد المحاولتين يتقدّم بالفعل لا بالزمن، والسؤال لا يظهر قبل اكتمالهما', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's2predict', 'a');
    const stage = doc.getElementById('cordStage');
    eq(h.text(doc, 's2TryCount'), 'جرّبتَ 0 من 2');
    keyOn(stage, 'ArrowRight');
    eq(h.text(doc, 's2TryCount'), 'جرّبتَ 1 من 2');
    no(h.visible(doc, 's2ResultBox'), 'السؤال ظهر بعد محاولة واحدة');
    keyOn(stage, 'ArrowLeft');
    eq(h.text(doc, 's2TryCount'), 'جرّبتَ 2 من 2');
    ok(h.visible(doc, 's2ResultBox'));
  });

  it('تكرار الفعل نفسه لا يقدّم العدّاد', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's2predict', 'a');
    const stage = doc.getElementById('cordStage');
    keyOn(stage, 'ArrowRight');
    keyOn(stage, 'ArrowRight');
    keyOn(stage, 'ArrowRight');
    eq(h.text(doc, 's2TryCount'), 'جرّبتَ 1 من 2');
  });

  it('نبضة الدعوة تزول بزوال سببها — عند استهلاك المحاولتين', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's2predict', 'a');
    const stage = doc.getElementById('cordStage');
    const grip = doc.getElementById('cordGrip');
    ok(grip.classList.contains('invite'), 'المقبض بلا دعوة عند البداية');
    keyOn(stage, 'ArrowRight');
    keyOn(stage, 'ArrowLeft');
    no(grip.classList.contains('invite'), 'الدعوة بقيت بعد استهلاكها');
  });

  it('سؤال العضلة الواحدة لا يظهر قبل تفسير الدفع، والحقيقة لا تُعرض قبله', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's2predict', 'a');
    const stage = doc.getElementById('cordStage');
    keyOn(stage, 'ArrowRight'); keyOn(stage, 'ArrowLeft');
    no(h.visible(doc, 's2OneBox'));
    no(h.visible(doc, 's2FactLine'), 'بطاقة الحقيقة سبقت الاستنتاج');
    h.choose(doc, 'u2l4-push-result', 'correct');
    ok(h.visible(doc, 's2OneBox'));
    no(h.visible(doc, 's2FactLine'));
  });

  it('الإجابة القصيرة تقبل صياغات مكافئة', async function(){
    for(const answer of [
      'يذهب في اتجاه واحد فقط',
      'يُسحب نحو العضلة ولا يعود',
      'العضلة تسحبه ولا تدفعه'
    ]){
      const s = scenario(); const { doc } = await s.boot();
      h.choose(doc, 's2predict', 'a');
      const stage = doc.getElementById('cordStage');
      keyOn(stage, 'ArrowRight'); keyOn(stage, 'ArrowLeft');
      h.choose(doc, 'u2l4-push-result', 'correct');
      h.type(doc, 's2OneInput', answer);
      h.click(doc, 's2OneBtn');
      const fb = doc.getElementById('fb-u2l4-one-muscle');
      ok(fb.classList.contains('is-correct'), 'رُفضت إجابة صحيحة: ' + answer);
    }
  });

  it('مخرج النجاة يظهر بعد محاولتين فاشلتين ويمنح نصف النقاط', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's2predict', 'a');
    const stage = doc.getElementById('cordStage');
    keyOn(stage, 'ArrowRight'); keyOn(stage, 'ArrowLeft');
    h.choose(doc, 'u2l4-push-result', 'correct');
    const before = w.XP.total();
    h.type(doc, 's2OneInput', 'لا اعرف'); h.click(doc, 's2OneBtn');
    no(h.visible(doc, 's2OneModelBtn'), 'المخرج ظهر بعد محاولة واحدة');
    h.type(doc, 's2OneInput', 'لا اعرف ايضا'); h.click(doc, 's2OneBtn');
    ok(h.visible(doc, 's2OneModelBtn'), 'المخرج لم يظهر بعد محاولتين');
    h.click(doc, 's2OneModelBtn');
    eq(w.XP.total() - before, 4, 'نصف نقاط PRODUCE = 4');
    ok(h.visible(doc, 's2OneModel'));
  });

  it('سطر التمهيد يذكر ما رآه الطالب ولا يسمّي مفهوم المحطة التالية', async function(){
    const { doc } = await page();
    const t = (doc.getElementById('s2Teaser').textContent || '');
    ['متضادة', 'ذات الرأسين', 'ثلاثية الرؤوس', 'زوج', 'تنقبض', 'تنبسط'].forEach(function(wd){
      eq(t.indexOf(wd), -1, 'التمهيد يسمّي المفهوم القادم: ' + wd);
    });
    has(t, 'تشدّ');
  });
});

/* ---------------------------------------------------------
   4) المحطة 3 — الذراع
   --------------------------------------------------------- */
describe('المحطة 3 — ذراع بعضلة واحدة', function(){

  it('العضلة الخلفية ومقبضها لا يظهران قبل اكتشاف الحاجة إليهما', async function(){
    const s = scenario(); const { doc } = await s.boot();
    const stage = doc.getElementById('armStage');
    no(stage.classList.contains('has-tri'), 'الزوج ظاهر منذ البداية');
    ok(stage.querySelectorAll('.tri').length >= 2, 'العضلة الخلفية غير مرسومة في الوضعين');
    ok(doc.getElementById('tricepsGrip'), 'مقبض العضلة الخلفية مفقود');
  });

  it('سحب العضلة الأمامية يثني الذراع، ودفعها لا يفعل شيئًا', async function(){
    const s = scenario(); const { doc } = await s.boot();
    const stage = doc.getElementById('armStage');
    const bg = doc.getElementById('bicepsGrip');
    keyOn(bg, 'ArrowDown');
    no(stage.classList.contains('flexed'), 'الدفع حرّك الساعد');
    has(h.text(doc, 's3StageMsg'), 'تشدّ ولا تدفع');
    keyOn(bg, 'Enter');
    ok(stage.classList.contains('flexed'), 'السحب لم يثنِ الذراع');
  });

  it('سحب العضلة الخلفية قبل ظهورها لا يمدّ الذراع', async function(){
    const s = scenario(); const { doc } = await s.boot();
    const stage = doc.getElementById('armStage');
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    ok(stage.classList.contains('flexed'), 'مُدّت الذراع بعضلة لم تظهر بعد');
  });

  it('سؤال «كيف نُعيده» يظهر بعد الثني، وحلُّه يُظهر العضلة الثانية', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    no(h.visible(doc, 's3DownBox'));
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    ok(h.visible(doc, 's3DownBox'), 'السؤال لم يظهر بعد أن علق الساعد');
    h.choose(doc, 'u2l4-bring-down', 'correct');
    ok(doc.getElementById('armStage').classList.contains('has-tri'));
    ok(doc.getElementById('tricepsGrip').classList.contains('invite'));
  });

  it('التسمية تلحق البناء: الأسماء لا تظهر قبل تحريك الاتجاهين', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    no(h.visible(doc, 's3NameLine'), 'الأسماء ظهرت قبل البناء');
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    no(h.visible(doc, 's3NameLine'), 'الأسماء ظهرت قبل سحب العضلة الثانية');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    ok(h.visible(doc, 's3NameLine'));
    ok(h.visible(doc, 's3ContractBox'));
  });

  it('نقطة المهمّة تُمنح مرّة واحدة مهما تكرّر التحريك', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    const before = w.XP.total();
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    const after = w.XP.total();
    eq(after - before, w.XP.POINTS.TASK);
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    eq(w.XP.total(), after, 'كُسبت المهمّة مرّتين');
  });

  it('المصطلحان يُعطيان بعد قياس تغيّر الطول لا قبله', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    no(h.visible(doc, 's3TermLine'), 'المصطلحان سبقا القياس');
    h.choose(doc, 'u2l4-contract-means', 'correct');
    ok(h.visible(doc, 's3TermLine'));
    has(h.text(doc, 's3TermLine'), 'تنقبض');
    has(h.text(doc, 's3TermLine'), 'تنبسط');
    ok(h.visible(doc, 's3StatesBox'));
  });

  it('التصنيف يمنح نقطة لكل رقاقة، ويفتح سؤال النمط عند اكتماله', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    h.choose(doc, 'u2l4-contract-means', 'correct');
    const before = w.XP.total();
    chipInto(doc, w, 'منقبضة', 's3-slot-biceps');
    chipInto(doc, w, 'منبسطة', 's3-slot-triceps');
    eq(w.XP.total() - before, w.XP.POINTS.MATCH * 2);
    ok(h.visible(doc, 's3PatternBox'));
  });

  it('رقاقة في الخانة الخاطئة تُنتج تلميحًا ولا تُقفل الخانة', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    h.choose(doc, 'u2l4-contract-means', 'correct');
    chipInto(doc, w, 'منقبضة', 's3-slot-triceps');
    const fb = doc.querySelector('#s3StatesBox .chips-feedback');
    no(fb.hidden, 'لا تلميح عند الخطأ');
    ok(fb.classList.contains('is-hint'));
    no(doc.getElementById('s3-slot-triceps').classList.contains('correct'));
  });

  it('حلقة تنبّؤ العدد تُغلق صراحةً في هذه المحطة', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    h.choose(doc, 'u2l4-contract-means', 'correct');
    chipInto(doc, w, 'منقبضة', 's3-slot-biceps');
    chipInto(doc, w, 'منبسطة', 's3-slot-triceps');
    no(h.visible(doc, 's3CountBox'));
    h.choose(doc, 'u2l4-extend-pattern', 'correct');
    ok(h.visible(doc, 's3AntagLine'));
    ok(h.visible(doc, 's3RelaxFact'));
    ok(h.visible(doc, 's3CountBox'));
    has(h.text(doc, 's3CountBox'), 'في بداية الدرس');
    h.choose(doc, 'u2l4-close-count', 'correct');
    ok(h.visible(doc, 's3done'));
  });

  it('بطاقة العضلات المتضادة تعرّف ما هو الشيء لا ما ليس هو', async function(){
    const { doc } = await page();
    const t = doc.getElementById('s3AntagLine').textContent || '';
    has(t, 'العضلات المتضادة');
    eq(/ليست|ليس /.test(t), false, 'بطاقة التعريف تنفي بدل أن تُثبت');
  });

  it('لا ذكر لقصر العضلات المتضادة على المفاصل الرزّية — نقضٌ لدرس 03', async function(){
    const { doc } = await page();
    const t = visibleText(doc.body);
    eq(t.indexOf('رزّي'), -1, 'ذُكر المفصل الرزّي قيدًا على العضلات المتضادة');
    eq(t.indexOf('رزي'), -1);
  });
});

/* ---------------------------------------------------------
   5) المحطة 4 — الجسد
   --------------------------------------------------------- */
describe('المحطة 4 — أزواج الجسد الخمسة', function(){

  it('المسرح لا يظهر قبل التنبّؤ، والرقاقات لا تظهر قبل الاستكشاف', async function(){
    const s = scenario(); const { doc } = await s.boot();
    no(h.visible(doc, 's4StageBox'));
    h.choose(doc, 's4predict', 'c');
    ok(h.visible(doc, 's4StageBox'));
    no(h.visible(doc, 's4PairsBox'), 'الرقاقات ظهرت قبل الاستكشاف');
  });

  it('خمس مناطق، والعدّاد يتقدّم بالنقر ولا يتقدّم بتكرار المنطقة نفسها', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's4predict', 'c');
    const zones = Array.from(doc.querySelectorAll('#s4StageBox .zone'));
    eq(zones.length, 5);
    eq(h.text(doc, 's4ZoneCount'), 'استكشفتَ 0 من 5');
    h.clickNode(zones[0]);
    eq(h.text(doc, 's4ZoneCount'), 'استكشفتَ 1 من 5');
    h.clickNode(zones[0]);
    eq(h.text(doc, 's4ZoneCount'), 'استكشفتَ 1 من 5', 'تكرار المنطقة قدّم العدّاد');
    h.clickNode(zones[1]);
    eq(h.text(doc, 's4ZoneCount'), 'استكشفتَ 2 من 5');
  });

  it('الإخفات يخصّ الأخوات، ويُرفع عند انتهاء الاستكشاف', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's4predict', 'c');
    const zones = Array.from(doc.querySelectorAll('#s4StageBox .zone'));
    h.clickNode(zones[0]);
    const bodies = Array.from(doc.querySelectorAll('#s4StageBox svg.body'));
    ok(bodies.every(b => b.classList.contains('has-sel')), 'الإخفات لم يُطبَّق على الجذر');
    zones.forEach(z => h.clickNode(z));
    await h.tick(w, 1400);
    ok(bodies.every(b => !b.classList.contains('has-sel')), 'بقي الإخفات بعد الاستكشاف');
    ok(zones.every(z => !z.classList.contains('on')), 'بقيت منطقة مميّزة عن أخواتها');
    ok(h.visible(doc, 's4PairsBox'));
  });

  it('كل منطقة تعرض وصفًا يذكر اتجاهين', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's4predict', 'c');
    const zones = Array.from(doc.querySelectorAll('#s4StageBox .zone'));
    zones.forEach(function(z){
      h.clickNode(z);
      has(h.text(doc, 's4ZoneMsg'), 'اتجاهان', 'وصف بلا اتجاهين: ' + z.getAttribute('data-zone'));
    });
  });

  it('الأزواج الخمسة بأسماء الكتاب، وزوج الصدر «شبه المنحرفة» لا «الظهرية العريضة»', async function(){
    const { doc } = await page();
    const map = {
      's4-slot-arm':   'ذات الرأسين وثلاثية الرؤوس',
      's4-slot-thigh': 'المأبضية ورباعية الرؤوس',
      's4-slot-chest': 'الصدرية الكبرى وشبه المنحرفة',
      's4-slot-back':  'الدالية والظهرية العريضة',
      's4-slot-hip':   'الألوية الكبرى والمثنية للورك'
    };
    Object.keys(map).forEach(function(id){
      eq(doc.getElementById(id).getAttribute('data-answer'), map[id]);
    });
  });

  it('كل رقاقة تحمل معرّف نقاط ثابتًا وسببًا', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.chip').forEach(function(c){
      ok(c.dataset.xpId, 'رقاقة بلا معرّف: ' + c.dataset.value);
      ok(/^u2l4-/.test(c.dataset.xpId), 'بادئة خاطئة: ' + c.dataset.xpId);
      ok(c.dataset.xpReason, 'رقاقة بلا سبب: ' + c.dataset.value);
    });
  });

  it('التصنيف الكامل يمنح خمس نقاط مطابقة ويفتح سؤال النمط', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's4predict', 'c');
    const zones = Array.from(doc.querySelectorAll('#s4StageBox .zone'));
    zones.forEach(z => h.clickNode(z));
    await h.tick(w, 1400);
    const before = w.XP.total();
    chipInto(doc, w, 'ذات الرأسين وثلاثية الرؤوس', 's4-slot-arm');
    chipInto(doc, w, 'المأبضية ورباعية الرؤوس', 's4-slot-thigh');
    chipInto(doc, w, 'الصدرية الكبرى وشبه المنحرفة', 's4-slot-chest');
    chipInto(doc, w, 'الدالية والظهرية العريضة', 's4-slot-back');
    chipInto(doc, w, 'الألوية الكبرى والمثنية للورك', 's4-slot-hip');
    eq(w.XP.total() - before, w.XP.POINTS.MATCH * 5);
    ok(h.visible(doc, 's4PatternBox'));
    h.choose(doc, 'u2l4-two-way-pattern', 'correct');
    ok(h.visible(doc, 's4done'));
  });
});

/* ---------------------------------------------------------
   6) المحطة 5 — التمزّق والتحدّي
   --------------------------------------------------------- */
describe('المحطة 5 — حين تتمزّق عضلة', function(){

  it('المسرح لا يظهر قبل التنبّؤ', async function(){
    const s = scenario(); const { doc } = await s.boot();
    no(h.visible(doc, 's5StageBox'));
    h.choose(doc, 's5predict', 'b');
    ok(h.visible(doc, 's5StageBox'));
  });

  it('العضلة السليمة تعمل والممزّقة لا تعمل', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's5predict', 'b');
    const stage = doc.getElementById('tornStage');
    keyOn(doc.getElementById('tornTricepsGrip'), 'Enter');
    no(stage.classList.contains('flexed'));
    has(h.text(doc, 's5StageMsg'), 'ممزّقة');
    keyOn(doc.getElementById('tornBicepsGrip'), 'Enter');
    ok(stage.classList.contains('flexed'), 'العضلة السليمة لم تعمل');
  });

  it('السؤال لا يظهر إلا بعد تجربة المقبضين معًا', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's5predict', 'b');
    keyOn(doc.getElementById('tornBicepsGrip'), 'Enter');
    await h.tick(w, 1100);
    no(h.visible(doc, 's5SymptomBox'), 'ظهر بعد مقبض واحد');
    keyOn(doc.getElementById('tornTricepsGrip'), 'Enter');
    await h.tick(w, 1100);
    ok(h.visible(doc, 's5SymptomBox'));
  });

  it('التحدّي الاختياري خلف رابط، ولا يظهر قبل إتمام الإجابة القصيرة', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's5predict', 'b');
    keyOn(doc.getElementById('tornBicepsGrip'), 'Enter');
    keyOn(doc.getElementById('tornTricepsGrip'), 'Enter');
    await h.tick(w, 1100);
    h.choose(doc, 'u2l4-tear-symptom', 'correct');
    no(h.visible(doc, 's5BonusRow'));
    h.type(doc, 's5ExplainInput', 'لأنها تسحب في اتجاه واحد إلى أعلى فقط');
    h.click(doc, 's5ExplainBtn');
    ok(h.visible(doc, 's5BonusRow'));
    no(h.visible(doc, 's5BonusBox'), 'التحدّي مفتوح بلا طلب');
    h.click(doc, 's5BonusLink');
    ok(h.visible(doc, 's5BonusBox'));
    ok(doc.getElementById('s5BonusLink').disabled, 'الرابط بقي يدعو إلى فعل استُهلك');
  });

  it('التحدّي يمنح نقاط BONUS، ومخرج نجاته نصفها', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.choose(doc, 's5predict', 'b');
    keyOn(doc.getElementById('tornBicepsGrip'), 'Enter');
    keyOn(doc.getElementById('tornTricepsGrip'), 'Enter');
    await h.tick(w, 1100);
    h.choose(doc, 'u2l4-tear-symptom', 'correct');
    h.type(doc, 's5ExplainInput', 'تسحب في اتجاه واحد فقط');
    h.click(doc, 's5ExplainBtn');
    h.click(doc, 's5BonusLink');
    const before = w.XP.total();
    h.choose(doc, 'u2l4-model-critique-bonus', 'correct');
    eq(w.XP.total() - before, w.XP.POINTS.BONUS);
  });

  it('التحدّي ينقد النموذج ولا يقيس معلومة جديدة خارج النطاق', async function(){
    const { doc } = await page();
    const t = doc.getElementById('s5BonusBox').textContent || '';
    has(t, 'الاختلاف');
    ['ليف', 'بروتين', 'أكتين', 'ميوسين'].forEach(function(wd){
      eq(t.indexOf(wd), -1, 'لفظ خارج النطاق في التحدّي: ' + wd);
    });
  });
});

/* ---------------------------------------------------------
   7) التقييم والشهادة
   --------------------------------------------------------- */
describe('المحطة 6 — التقييم', function(){

  it('عشرة أسئلة: ثمانية اختيار واثنان نصّيان', async function(){
    const { doc } = await page();
    eq(doc.querySelectorAll('#evalQuestions .eval-q').length, 10);
    eq(doc.querySelectorAll('#evalQuestions .quiz-options[data-q]').length, 8);
    ok(doc.getElementById('e9Input') && doc.getElementById('e10Input'));
  });

  it('بوابة الاسم تسبق الأسئلة، والاسم الفارغ لا يبدأ التقييم', async function(){
    const s = scenario(); const { doc } = await s.boot();
    no(h.visible(doc, 'evalQuestions'));
    h.type(doc, 'evalName', '   ');
    h.click(doc, 'evalStart');
    no(h.visible(doc, 'evalQuestions'), 'بدأ التقييم باسم فارغ');
    h.type(doc, 'evalName', 'فؤاد');
    h.click(doc, 'evalStart');
    ok(h.visible(doc, 'evalQuestions'));
  });

  it('محاولة واحدة: الإقفال فور أول اختيار ولو كان خاطئًا', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.choose(doc, 'u2l4-e1', 'w1');
    const second = h.choose(doc, 'u2l4-e1', 'correct');
    ok(second.blocked, 'أُتيحت محاولة ثانية في التقييم');
  });

  it('الخطأ يُضيء الصحيح معه ويشرح لماذا', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.choose(doc, 'u2l4-e6', 'w1');
    const g = h.groupByName(doc, 'u2l4-e6');
    ok(g.querySelector('.quiz-option.incorrect'), 'لم يُوسَم اختيار الطالب');
    ok(g.querySelector('.quiz-option.correct'), 'لم يُضَأ الخيار الصحيح');
    has(h.text(doc, 'fb-u2l4-e6'), 'الانبساط');
  });

  it('التقييم لا يمنح XP إطلاقًا — مكافأته الشارة والشهادة', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    const before = w.XP.total();
    ['u2l4-e1','u2l4-e2','u2l4-e3','u2l4-e4'].forEach(n => h.choose(doc, n, 'correct'));
    eq(w.XP.total(), before);
  });

  it('السؤال 9 يقبل «تنقبض» و«انقباض» و«منقبضة»', async function(){
    for(const answer of ['تنقبض', 'انقباض', 'منقبضة', 'الانقباض']){
      const s = scenario(); const { doc } = await s.boot();
      h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
      h.type(doc, 'e9Input', answer); h.click(doc, 'e9Btn');
      ok(doc.getElementById('fb-e9').classList.contains('is-correct'),
         'رُفضت صيغة صحيحة: ' + answer);
    }
  });

  it('السؤال 10 يقبل الصياغات المكافئة ويرفض الفارغ', async function(){
    const good = ['لأن العضلة تسحب ولا تدفع', 'العضلة تشد في اتجاه واحد فقط'];
    for(const answer of good){
      const s = scenario(); const { doc } = await s.boot();
      h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
      h.type(doc, 'e10Input', answer); h.click(doc, 'e10Btn');
      ok(doc.getElementById('fb-e10').classList.contains('is-correct'),
         'رُفضت إجابة صحيحة: ' + answer);
    }
    const s = scenario(); const { doc } = await s.boot();
    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    h.type(doc, 'e10Input', 'لا اعرف'); h.click(doc, 'e10Btn');
    no(doc.getElementById('fb-e10').classList.contains('is-correct'));
  });

  it('النتيجة والشهادة تظهران بعد آخر سؤال', async function(){
    const s = scenario(); const { doc, w } = await s.boot();
    h.type(doc, 'evalName', 'فؤاد حوراني'); h.click(doc, 'evalStart');
    EVAL_Q.forEach(n => h.choose(doc, n, 'correct'));
    h.type(doc, 'e9Input', 'تنقبض'); h.click(doc, 'e9Btn');
    h.type(doc, 'e10Input', 'لأن العضلة تسحب ولا تدفع'); h.click(doc, 'e10Btn');
    await h.tick(w, 60);
    ok(h.visible(doc, 'evalSummary'), 'لم تظهر بطاقة النتيجة');
    has(h.text(doc, 'evalSummary'), '100');
  });
});

/* ---------------------------------------------------------
   8) حرّاس الجودة — تُفحص بالكود لا بالعين
   --------------------------------------------------------- */
describe('حرّاس جودة الأسئلة', function(){

  it('تنويع موضع الإجابة الصحيحة في أسئلة التقييم الثمانية', async function(){
    const { doc } = await page();
    const at = [0,0,0,0];
    EVAL_Q.forEach(n => { at[correctIndex(doc, n)]++; });
    eq(at.filter(x => x > 0).length, 4, 'مواضع الإجابة: ' + at.join('/'));
    ok(Math.max.apply(null, at) <= 4, 'موضع متكرّر أكثر من اللازم: ' + at.join('/'));
  });

  it('تنويع موضع الإجابة الصحيحة في أسئلة الدرس كلّه لا التقييم وحده', async function(){
    const { doc } = await page();
    const at = [0,0,0,0];
    PRACTICE_Q.concat(EVAL_Q).forEach(n => { at[correctIndex(doc, n)]++; });
    eq(at.filter(x => x > 0).length, 4, 'مواضع الإجابة: ' + at.join('/'));
    ok(Math.max.apply(null, at) <= Math.ceil((PRACTICE_Q.length + EVAL_Q.length) / 2),
       'موضع مهيمن: ' + at.join('/'));
  });

  it('الخيار الصحيح لا يتجاوز أطول مشتّت بأكثر من 12 حرفًا — في الدرس كلّه', async function(){
    const { doc } = await page();
    PRACTICE_Q.concat(EVAL_Q).forEach(function(n){
      const opts = optionTexts(doc, n);
      const idx = correctIndex(doc, n);
      const correct = opts[idx].length;
      const longestWrong = Math.max.apply(null, opts.filter((_, i) => i !== idx).map(t => t.length));
      ok(correct - longestWrong <= 12,
         n + ': الصحيح ' + correct + ' وأطول مشتّت ' + longestWrong);
    });
  });

  it('لكل مشتّت تلميح يخاطب الخطأ نفسه لا السؤال', async function(){
    const { raw } = await page();
    ['w1:', 'w2:', 'w3:'].forEach(function(k){
      ok(raw.split(k).length - 1 >= 8, 'تلميحات المشتّتات ناقصة عند ' + k);
    });
  });

  it('كل إجابة قصيرة تملك مخرج نجاة معلنًا في الوسم', async function(){
    const { doc } = await page();
    [['s2OneModelBtn','s2OneModel'], ['s5ExplainModelBtn','s5ExplainModel']].forEach(function(p){
      ok(doc.getElementById(p[0]), 'زرّ النموذج مفقود: ' + p[0]);
      ok(doc.getElementById(p[1]), 'صندوق النموذج مفقود: ' + p[1]);
    });
  });

  it('أرقام غربية في واجهة الطالب كلّها', async function(){
    const { doc } = await page();
    const t = visibleText(doc.body);
    eq(/[٠-٩]/.test(t), false, 'أرقام عربية-هندية في الواجهة');
  });

  it('لا ترقيم أشكال الكتاب في واجهة الطالب', async function(){
    const { doc } = await page();
    const t = visibleText(doc.body);
    eq(/الشكل\s*\d+-\d+/.test(t), false, 'ترقيم شكل من الكتاب ظاهر للطالب');
  });
});

/* ---------------------------------------------------------
   9) الرصيد ومعرّفات XP
   --------------------------------------------------------- */
describe('الرصيد ومعرّفات XP', function(){

  it('كل معرّفات النقاط ببادئة u2l4- ولا تصادم مع درس آخر', async function(){
    const { raw } = await page();
    const ids = new Set();
    const re = /xpId:\s*'([^']+)'|data-xp-id="([^"]+)"|claim\('([^']+)'/g;
    let m;
    while((m = re.exec(raw))) ids.add(m[1] || m[2] || m[3]);
    ok(ids.size >= 18, 'عدد المعرّفات: ' + ids.size);
    ids.forEach(function(id){
      ok(/^u2l4-/.test(id), 'معرّف بلا بادئة الدرس: ' + id);
    });
  });

  it('التمرير وحده لا يمنح نقطة واحدة', async function(){
    const s = scenario(); const { w } = await s.boot();
    eq(w.XP.total(), 0);
  });

  it('الرصيد الكامل للدرس 135 أساسي و143 مع التحدّي الاختياري', async function(){
    const s = scenario(); const { doc, w } = await s.boot();

    h.choose(doc, 's1where', 'a');
    h.choose(doc, 's1count', 'b');

    h.choose(doc, 's2predict', 'b');
    const cord = doc.getElementById('cordStage');
    keyOn(cord, 'ArrowRight'); keyOn(cord, 'ArrowLeft');
    h.choose(doc, 'u2l4-push-result', 'correct');
    h.type(doc, 's2OneInput', 'يذهب في اتجاه واحد فقط');
    h.click(doc, 's2OneBtn');

    keyOn(doc.getElementById('bicepsGrip'), 'Enter');
    await h.tick(w, 1400);
    h.choose(doc, 'u2l4-bring-down', 'correct');
    keyOn(doc.getElementById('tricepsGrip'), 'Enter');
    h.choose(doc, 'u2l4-contract-means', 'correct');
    chipInto(doc, w, 'منقبضة', 's3-slot-biceps');
    chipInto(doc, w, 'منبسطة', 's3-slot-triceps');
    h.choose(doc, 'u2l4-extend-pattern', 'correct');
    h.choose(doc, 'u2l4-close-count', 'correct');

    h.choose(doc, 's4predict', 'c');
    Array.from(doc.querySelectorAll('#s4StageBox .zone')).forEach(z => h.clickNode(z));
    await h.tick(w, 1400);
    chipInto(doc, w, 'ذات الرأسين وثلاثية الرؤوس', 's4-slot-arm');
    chipInto(doc, w, 'المأبضية ورباعية الرؤوس', 's4-slot-thigh');
    chipInto(doc, w, 'الصدرية الكبرى وشبه المنحرفة', 's4-slot-chest');
    chipInto(doc, w, 'الدالية والظهرية العريضة', 's4-slot-back');
    chipInto(doc, w, 'الألوية الكبرى والمثنية للورك', 's4-slot-hip');
    h.choose(doc, 'u2l4-two-way-pattern', 'correct');

    h.choose(doc, 's5predict', 'b');
    keyOn(doc.getElementById('tornBicepsGrip'), 'Enter');
    keyOn(doc.getElementById('tornTricepsGrip'), 'Enter');
    await h.tick(w, 1100);
    h.choose(doc, 'u2l4-tear-symptom', 'correct');
    h.type(doc, 's5ExplainInput', 'لأنها تسحب في اتجاه واحد فقط ولا تدفع');
    h.click(doc, 's5ExplainBtn');

    eq(w.XP.total(), 135, 'الرصيد الأساسي');

    h.click(doc, 's5BonusLink');
    h.choose(doc, 'u2l4-model-critique-bonus', 'correct');
    eq(w.XP.total(), 143, 'الرصيد مع التحدّي');

    h.type(doc, 'evalName', 'فؤاد'); h.click(doc, 'evalStart');
    EVAL_Q.forEach(n => h.choose(doc, n, 'correct'));
    eq(w.XP.total(), 143, 'التقييم منح نقاطًا');
  });

  it('لا كسب مزدوج بعد إعادة تحميل الصفحة', async function(){
    const store = {};
    const a = await h.loadLesson(FILE, { storage: store });
    h.choose(a.doc, 's1where', 'a');
    const first = a.w.XP.total();
    eq(first, a.w.XP.POINTS.PREDICT);

    const b = await h.loadLesson(FILE, { storage: store });
    eq(b.w.XP.total(), first, 'التخزين لم يُستعد');
    h.choose(b.doc, 's1where', 'b');
    eq(b.w.XP.total(), first, 'كُسبت النقطة مرّتين');
  });
});

/* ---------------------------------------------------------
   10) التنقّل والدخول بالمرساة
   --------------------------------------------------------- */
describe('التنقّل بين المحطات', function(){

  it('زرّ الانتقال يفتح المحطة ويضيء نقطتها', async function(){
    const s = scenario(); const { doc } = await s.boot();
    h.choose(doc, 's1where', 'a');
    h.choose(doc, 's1count', 'b');
    const link = doc.querySelector('#s1done a.station-next');
    h.clickNode(link);
    const sec = doc.getElementById('station-2');
    ok(sec.classList.contains('in-view'));
    ok(doc.querySelector('.progress-dot[data-target="station-2"]').classList.contains('active'));
  });

  it('الدخول بمرساة يفتح المحطة المقصودة وما قبلها', async function(){
    const { doc } = await h.loadLesson(FILE, { hash: '#station-4' });
    ok(doc.getElementById('station-4').classList.contains('in-view'));
    ok(doc.getElementById('station-1').classList.contains('in-view'));
  });

  it('زرّ ممتلئ واحد في كل تسليم بين المحطات', async function(){
    const { doc } = await page();
    doc.querySelectorAll('.station-handoff').forEach(function(box){
      const filled = box.querySelectorAll('.station-next:not(.demoted)');
      ok(filled.length <= 1, 'أكثر من زرّ ممتلئ في: ' + box.id);
    });
  });
});

run();
