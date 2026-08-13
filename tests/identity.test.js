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
const css = fs.readFileSync(IDENTITY, 'utf8');

/* قراءة كتلة قاعدة بمحدِّدها المضبوط، بلا تعليقات */
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
  'semester-1/unit-02/index.html'
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

run();
