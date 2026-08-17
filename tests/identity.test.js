'use strict';
/* ==========================================================
   حرّاس الهوية المشتركة — shared/identity/identity.css
   ----------------------------------------------------------
   هذه المجموعة تقرأ ملفّ الهوية نفسه لا صفحةَ درس، لأن أداة
   jsdom تُسقط وسوم <link rel="stylesheet"> عند التحميل: القواعد
   المشتركة لا تصل إلى أي اختبار درس، فما فيها من علل لا يراه
   حارس. وأوّل ما دخل هنا: ومضة بيضاء عند التمرير السريع، رصدها
   فؤاد بالعين بعد أن مرّت على عشرة دروس بلا اعتراض.
   ========================================================== */

const { describe, it, eq, ok, no, has, run } = require('./run');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.EDULAB_ROOT || path.resolve(__dirname, '..');
const IDENTITY = path.join(ROOT, 'shared', 'identity', 'identity.css');
const TEMPLATE = path.join(ROOT, 'shared', 'template-boilerplate', 'template.css');
const css = fs.readFileSync(IDENTITY, 'utf8');
const tpl = fs.readFileSync(TEMPLATE, 'utf8');

/* قراءة كتلة قاعدة بمحدِّدها المضبوط، بلا تعليقات */
function blockIn(source, selector){
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = new RegExp('(^|[};])\\s*' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = re.exec(clean);
  return m ? m[2] : null;
}
function block(selector){
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = new RegExp('(^|[};])\\s*' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = re.exec(clean);
  return m ? m[2] : null;
}

/* الصفحات التي لا تربط الهوية وتعرّف خلفيتها بنفسها: الإصلاح
   المشترك لا يبلغها، فتُفحص كلٌّ على حدة. */
const STANDALONE = [
  'index.html',
  'semester-1/index.html',
  'semester-1/unit-01/index.html',
  'semester-1/unit-02/index.html',
  'semester-1/unit-01/lesson-02.html'   // درس قديم لا يربط المشترك
];

describe('خلفية الصفحة — ومضة التمرير السريع', function(){

  it('html يحمل لون خلفية صلبًا لا يرثه من body', function(){
    const b = block('html');
    ok(b, 'لا قاعدة مستقلّة لـhtml في ملفّ الهوية');
    ok(/background-color\s*:/.test(b),
       'html بلا لون خلفية: خلفية body تنتشر إلى اللوحة متدرّجةً، ' +
       'فتومض المنطقة المكشوفة بالأبيض قبل أن يصلها الطلاء');
  });

  it('لون قاعدة html هو أحد طرفَي متدرّج body فلا يظهر خطّ بينهما', function(){
    const h = block('html') || '';
    const body = block('body') || '';
    const hVar = /background-color\s*:\s*var\(\s*(--[\w-]+)\s*\)/.exec(h);
    ok(hVar, 'لون html ليس رمزًا من رموز الهوية: ' + h.trim());
    /* لا يكفي [^)]* هنا: var(--x) داخل المتدرّج يحمل قوسًا مغلقًا
       فيقطع المطابقة عند أول رمز. الاستخراج يقع بموازنة الأقواس. */
    const at = body.indexOf('linear-gradient(');
    ok(at !== -1, 'خلفية body ليست متدرّجًا');
    let depth = 0, end = -1;
    for(let i = at + 'linear-gradient'.length; i < body.length; i++){
      if(body[i] === '(') depth++;
      else if(body[i] === ')'){ depth--; if(depth === 0){ end = i; break; } }
    }
    ok(end !== -1, 'متدرّج غير مغلق في خلفية body');
    const inner = body.slice(at + 'linear-gradient('.length, end);
    const stops = inner.split(/,(?![^(]*\))/).map(s => s.trim());
    const first = stops[1] || '', last = stops[stops.length - 1] || '';
    ok(first.indexOf(hVar[1]) !== -1 && last.indexOf(hVar[1]) !== -1,
       'طرفا المتدرّج ليسا بلون قاعدة html — يظهر خطّ فاصل: ' +
       first + ' … ' + last);
  });

  it('color-scheme معلن داكنًا فلا يومض شريط التمرير ولا حقول الإدخال', function(){
    const b = block('html') || '';
    ok(/color-scheme\s*:\s*dark/.test(b), 'color-scheme غير معلن على html');
  });

  it('كل صفحة لا تربط الهوية تعالج الومضة بنفسها', function(){
    const missing = [];
    STANDALONE.forEach(function(rel){
      const file = path.join(ROOT, rel);
      if(!fs.existsSync(file)) return;          // صفحة لم تُنشأ بعد
      const raw = fs.readFileSync(file, 'utf8');
      if(/identity\/identity\.css/.test(raw)) return;   // ترث الإصلاح المشترك
      const clean = raw.replace(/\/\*[\s\S]*?\*\//g, '');
      if(!/html\s*\{[^}]*background(-color)?\s*:/.test(clean)) missing.push(rel);
    });
    eq(missing.length, 0, 'صفحات بلا لون قاعدة على html: ' + missing.join(' · '));
  });
});

describe('حقول الأسئلة — لا تُترك لاجتهاد المتصفّح', function(){

  /* color-scheme:dark يجعل المتصفّح يشتقّ حدّ الدائرة الفارغة من
     accent-color بعد إعتامه، فيخرج التركوازي زيتونيًّا بنّيًّا. رصدها
     فؤاد بالعين بعد رفع علاج الومضة. والحارس يمنع عودة الاعتماد على
     رسم المتصفّح، لا يمنع اللون بعينه. */

  it('الراديو ومربّع الاختيار مرسومان يدويًّا لا بحقل المتصفّح الأصلي', function(){
    const clean = tpl.replace(/\/\*[\s\S]*?\*\//g, '');
    ['radio', 'checkbox'].forEach(function(kind){
      const re = new RegExp('\\.quiz-option input\\[type="' + kind + '"\\][^{]*\\{([^}]*)\\}');
      const m = re.exec(clean);
      ok(m, 'لا قاعدة مخصّصة لحقل ' + kind);
    });
    ok(/appearance\s*:\s*none/.test(clean),
       'الحقول متروكة لرسم المتصفّح — فيُعتم لونها في النمط الداكن');
  });

  it('اللون المختار هو التركوازي نفسه لا مشتقًّا منه', function(){
    const clean = tpl.replace(/\/\*[\s\S]*?\*\//g, '');
    const at = clean.indexOf('.quiz-option input[type="radio"]::before');
    ok(at !== -1, 'لا نقطة مرسومة داخل الدائرة');
    const body = clean.slice(at, clean.indexOf('}', at));
    ok(/background\s*:\s*var\(--turquoise\)/.test(body),
       'نقطة الاختيار ليست بالتركوازي الأساسي: ' + body.trim());
  });

  it('الحدّ رمادي قبل الاختيار وتركوازي بعده — لونٌ واحد لا يحمل معنيين', function(){
    const clean = tpl.replace(/\/\*[\s\S]*?\*\//g, '');
    const at = clean.indexOf('.quiz-option input[type="radio"],');
    const body = clean.slice(at, clean.indexOf('}', at));
    ok(/border\s*:\s*2px solid var\(--muted\)/.test(body),
       'الدائرة الفارغة ليست رمادية: ' + body.trim().slice(0, 120));
    ok(/:checked[^{]*\{[^}]*border-color\s*:\s*var\(--turquoise\)/.test(clean),
       'الدائرة المختارة ليست تركوازية');
  });

  it('الحركة تتوقّف عند تفضيل تقليل الحركة', function(){
    const reduced = tpl.split('prefers-reduced-motion').slice(1).join(' ');
    ok(/\.quiz-option input\[type="radio"\]/.test(reduced),
       'حقول الأسئلة بلا نظير عند تقليل الحركة');
  });
});

describe('رموز الهوية — ثبات نظام اللون', function(){

  it('الرموز الأساسية معرّفة ولم يُحذف منها شيء', function(){
    const root = block(':root') || '';
    ['--navy-dark', '--navy-darker', '--turquoise', '--coral', '--ink', '--ink-dim', '--border']
      .forEach(function(v){
        ok(root.indexOf(v + ':') !== -1, 'رمز مفقود من الهوية: ' + v);
      });
  });

  it('لونا الواجهة اثنان لا أكثر: تركوازي ومرجاني', function(){
    const root = block(':root') || '';
    eq(/--turquoise\s*:\s*#14C8A8/i.test(root), true, 'تبدّل التركوازي الأساسي');
    eq(/--coral\s*:\s*#ff6b4a/i.test(root), true, 'تبدّل المرجاني');
  });
});

/* ==========================================================
   قالب الدرس — shared/template-boilerplate/lesson-template.html
   ----------------------------------------------------------
   القالب ليس درسًا فلا يفحصه حارس درس، وليس ملفًّا مشتركًا
   يُحمَّل فلا يكشف عطبَه طالب. فالسبيل الوحيد إلى بلاه: أن
   يتغيّر عرفٌ منصّي في الدروس ويبقى القالب على القديم، فيرثه
   كل درس قادم. وهذه الحرّاس تقرأ القالب وتقابله بالعرف نفسه
   الذي تقيسه حرّاس الدروس.
   ========================================================== */
const LESSON_TPL = path.join(ROOT, 'shared', 'template-boilerplate', 'lesson-template.html');

describe('قالب الدرس — لا يبلى صامتًا', function(){

  const tplHtml = fs.existsSync(LESSON_TPL) ? fs.readFileSync(LESSON_TPL, 'utf8') : null;

  it('القالب موجود في موضعه', function(){
    ok(tplHtml, 'لا قالب في shared/template-boilerplate/lesson-template.html');
  });

  it('وسوم المشترك الستّة كاملة وبترتيبها الإلزامي', function(){
    const order = (tplHtml.match(/<script src="\.\.\/\.\.\/shared\/[^"]+"><\/script>/g) || [])
      .map(function(s){ return /shared\/([^/]+)\//.exec(s)[1]; });
    eq(order.join(' → '),
       'sounds → xp-system → faheem-widget → template-boilerplate → certificate-system → identity',
       'ترتيب وسوم المشترك في القالب خالف الترتيب الإلزامي');
  });

  it('وسوم المشترك تسبق سكربت الدرس', function(){
    const lastShared = tplHtml.lastIndexOf('<script src="../../shared/');
    const inline = tplHtml.indexOf('<script>\n/*');
    ok(lastShared !== -1 && inline !== -1, 'تعذّر تحديد موضع السكربتات في القالب');
    ok(lastShared < inline, 'سكربت الدرس في القالب يسبق وسوم المشترك');
  });

  it('ملفّا التصميم المشتركان مربوطان بمسار ../../shared/', function(){
    ok(/href="\.\.\/\.\.\/shared\/identity\/identity\.css"/.test(tplHtml), 'identity.css غير مربوط');
    ok(/href="\.\.\/\.\.\/shared\/template-boilerplate\/template\.css"/.test(tplHtml), 'template.css غير مربوط');
  });

  it('عدد نقاط التقدّم يساوي عدد المحطات', function(){
    const dots = (tplHtml.match(/class="progress-dot"/g) || []).length;
    const stations = (tplHtml.match(/<section class="station"/g) || []).length;
    eq(dots, stations, 'مقام عدّاد «المحطة X من N» مشتقّ من عدد النقاط، فاختلافه يكذب العدّاد');
  });

  it('لا محطة محجوبة بـhidden — الحجب داخل المحطة لا عليها', function(){
    const tags = tplHtml.match(/<section class="station"[^>]*>/g) || [];
    tags.forEach(function(t){
      no(/\bhidden\b/.test(t), 'محطة في القالب تحمل hidden: ' + t);
    });
  });

  it('محطة التقييم اسمها «التقييم الختامي» حصرًا', function(){
    ok(/<h2>التقييم الختامي<\/h2>/.test(tplHtml), 'اسم محطة التقييم في القالب خالف التسمية المعتمدة');
  });

  it('خانة زرّ الشهادة موجودة — بدونها يعوم الزرّ فيصطدم بزرّ فهيم', function(){
    ok(/id="certTriggerSlot"/.test(tplHtml), 'certTriggerSlot مفقود من القالب');
  });

  it('الشهادة تُنادى عبر Quiz.evaluate لا بنداء Certificate.finish صريح', function(){
    ok(/window\.Quiz\.evaluate\(/.test(tplHtml), 'القالب بلا نداء Quiz.evaluate');
    no(/Certificate\.finish\s*\(/.test(tplHtml), 'القالب يكتب Certificate.finish صراحةً — والوحدة تُنادى من داخل Quiz.evaluate');
  });

  it('حارس تقليل الحركة يحكم كلّ انتقال في القالب', function(){
    const scrolls = tplHtml.match(/scrollIntoView\(\{[^}]*\}\)/g) || [];
    ok(scrolls.length >= 2, 'كتلتا التنقّل غير مكتملتين في القالب');
    scrolls.forEach(function(s){
      ok(/G\.reduced\(\)/.test(s),
         'انتقال في القالب بلا حارس تقليل الحركة: ' + s);
    });
    ok(/prefers-reduced-motion/.test(tplHtml), 'القالب بلا قاعدة تقليل حركة في أنماطه');
  });

  /* يقارن الكود وحده: التعليقات تُنزع قبل المقابلة. فالقالب يشرح
     لقارئه ما لا يحتاج الدرس شرحه، واختلاف الشرح ليس اختلاف سلوك.
     (القاعدة: الحارس يقيس الصفة لا القيمة الحرفية.) */
  it('كتلتا التنقّل في القالب مطابقتان لأحدث درس مبنيّ', function(){
    const latest = fs.readFileSync(
      path.join(ROOT, 'semester-1', 'unit-02', 'lesson-04.html'), 'utf8');
    function navOf(src){
      const bare = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
      const i = bare.indexOf('a.station-next[href^="#station-"]');
      const j = bare.indexOf('})();', i);
      if(i === -1 || j === -1) return null;
      return bare.slice(i, j).replace(/\s+/g, ' ').trim();
    }
    const a = navOf(tplHtml), b = navOf(latest);
    ok(a && b, 'تعذّرت قراءة كتلة التنقّل من أحد الملفّين');
    eq(a, b, 'كتلة التنقّل في القالب فارقت نظيرتها في أحدث درس — إحداهما تغيّرت وحدها');
  });

  it('القالب هيكل بلا محتوى: لا مسرح SVG ولا نصّ درس', function(){
    no(/<svg[^>]*viewBox="0 0 (2|3)\d\d/.test(tplHtml), 'مسرح درس تسرّب إلى القالب');
    const evalQs = (tplHtml.match(/class="quiz-options" data-q=/g) || []).length;
    ok(evalQs <= 2, 'أسئلة درس تسرّبت إلى القالب: ' + evalQs);
  });

  it('القالب معلَّم بأنه ليس درسًا، ولا يُربط من أي صفحة', function(){
    ok(/ليس درسًا/.test(tplHtml), 'القالب بلا لافتة تميّزه عن الدروس');
    const pages = [
      'index.html', 'semester-1/index.html',
      'semester-1/unit-01/index.html', 'semester-1/unit-02/index.html'
    ];
    pages.forEach(function(p){
      const f = path.join(ROOT, p);
      if(!fs.existsSync(f)) return;
      no(/lesson-template\.html/.test(fs.readFileSync(f, 'utf8')),
         'صفحة تشير إلى القالب: ' + p);
    });
  });
});

run();
