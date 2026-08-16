/* =========================================================
   مختبر فؤاد التعليمي — محرّك الهيكل العام (السلوك)
   shared/template-boilerplate/template.js

   يفعّل تلقائيًا عند تحميله، شرط اتّباع الدرس لهذه الاصطلاحات
   بالـHTML (لا حاجة لأي إعداد إضافي غير هذا):

     • كل محطة:      <section class="station" id="station-N">
     • شريط التقدّم:  <div class="progress-dot" data-target="station-N">
     • مجموعة سؤال:  <div class="quiz-options"><label class="quiz-option">...
     • شرائح السحب:  <div class="chip" data-value="...">  داخل .chips-pool
     • خانات الإفلات: <div class="slot" data-answer="...">

   يوفّر أربع آليات عامة:

     1) ظهور تدريجي لكل محطة عند وصولها بالتمرير + تفعيل نقطة
        التقدّم المقابلة + نغمة انتقال مرة واحدة لكل محطة، ومعها
        عدّاد «المحطة X من N» يُحقن تلقائيًا في شريط التقدّم —
        مقامه مشتقّ من عدد النقاط، فلا يُكتب رقم في أي درس

     2) تظليل الخيار المُختار داخل كل مجموعة أسئلة (مستقل بين
        المجموعات لو الدرس فيه أكثر من سؤال). منطق التحقّق من
        صحة الإجابة يبقى دائمًا بكود الدرس نفسه.

     3) محرّك سحب وإفلات عام (Pointer Events) لأي .chip داخل
        أي .chips-pool، يُطابق ضد أي .slot بنفس data-answer —
        ومعه طريق ثانٍ مكافئ: نقر الرقاقة ثم نقر الخانة (يعمل
        باللمس وبالفأرة وبلوحة المفاتيح). لا يحتاج الدرس أي إعداد
        إضافي: الطريقان يعملان على نفس الوسوم أعلاه.

     4) محرّكات الأسئلة المشتركة window.Quiz — أسئلة الاختيار في
        محطات التدريب (Quiz.practice)، والإجابة القصيرة بمخرج
        نجاتها (Quiz.short)، ومحطة التقييم كاملةً حتى نداء
        Certificate.finish (Quiz.evaluate). تفصيلها في قسمها.

   ---------------------------------------------------------
   تغيير جوهري (يوليو 2026) — نقاط الخبرة خرجت من هذا الملف
   ---------------------------------------------------------
   كان هذا الملف يحتوي محرّك XP كاملًا، وكان يمنح النقاط بطريقتين
   أُلغيتا بالكامل:

     • 10 نقاط لكل محطة بمجرّد التمرير فوقها. عمليًا كان 91% من
       نقاط lesson-01 و75% من نقاط lesson-03 تُكتسب بالتمرير دون
       قراءة حرف — أي أن المؤشّر كان يعكس التمرير لا التعلّم.

     • رصد تلقائي لأي عنصر يأخذ صنف .correct. هذا يمنح النقاط على
       الحدث البصري لا الحدث التربوي: أي درس يُبرز الإجابة الصحيحة
       كتغذية راجعة كان سيكافئ الطالب لأنه أخطأ.

   النقاط الآن تُطلَب صراحةً من كود الدرس عبر الوحدة المشتركة
   shared/xp-system/xp.js، بمُعرّف فريد محفوظ يمنع التكرار حتى
   بعد إعادة تحميل الصفحة.

   ---------------------------------------------------------
   ترتيب التحميل — قبل </body> مباشرة
   ---------------------------------------------------------
     <script src="[مسار نسبي]/shared/sounds/sounds.js"></script>
     <script src="[مسار نسبي]/shared/xp-system/xp.js"></script>
     <script src="[مسار نسبي]/shared/faheem-widget/faheem.js"></script>
     <script src="[مسار نسبي]/shared/template-boilerplate/template.js"></script>

   يعمل هذا الملف حتى لو غاب xp.js (السحب والإفلات يشتغل بلا
   نقاط) — لا يتوقّف ولا يرمي خطأ.
   ========================================================= */
(function(){

  /* شبكة أمان للبناء (يوليو 2026): كل نداء لـXP محميّ بفحص وجود المحرّك
     كي لا تنكسر الصفحة على الطالب لو تعذّر تحميل ملف واحد. لكن الحماية
     الصامتة تعني أن غياب xp.js يمرّ دون أي أثر: الدرس يعمل، والعدّاد
     يبقى صفرًا، ولا شيء يدلّ على السبب. حدث ذلك فعليًا أثناء البناء.
     لذا نطبع تحذيرًا واضحًا بشاشة المطوّر (F12) — لا يراه الطالب أبدًا،
     ولا يؤثر على الصفحة إطلاقًا. موضعه هنا لا في ملفات الدروس كي يرثه
     كل درس جديد تلقائيًا دون تذكّر إضافي.

     الشرط: نحذّر فقط إن كانت الصفحة درسًا فعلًا (فيها عدّاد XP أو محطات)،
     فلا تُزعج صفحات المحاور التي لا تحتاج نقاطًا أصلًا. */
  window.addEventListener('load', function(){
    if(window.XP && window.XP.claim) return;
    if(!document.querySelector('#xpValue, .station[id^="station-"]')) return;
    console.warn('%c[مختبر فؤاد] محرّك النقاط غير محمَّل — الدرس يعمل، لكن XP سيبقى صفرًا.',
      'background:#ff6b4a;color:#131c30;font-weight:bold;padding:3px 8px;border-radius:4px;');
    console.warn('تحقّق من وسم <script src="[مسار نسبي]/shared/xp-system/xp.js"> ' +
                 'ومن تبويب Network بحثًا عن خطأ 404 لهذا الملف.');
  });

  /* ---------------------------------------------------------
     حارس هرم الأزرار (يوليو 2026)
     ---------------------------------------------------------
     قاعدة الهرم: زر ممتلئ واحد لكل محطة، وهو زر الانتقال. لو ظهر
     اثنان انقلب الهرم ضوضاءً. المحدِّد في template.css يمنع وقوع
     الخطأ خارج .station-handoff؛ وهذا الحارس يعالج ما ندر داخلها:
     يُبقي الأول ويهبّط الباقي إلى الدرجة الثانية، ويطبع تفصيلًا
     بشاشة المطوّر (F12). الطالب لا يرى شيئًا، والصفحة لا تنكسر.

     تنبيه للمطوّر: الحارس يصلح الشكل، فقد يخفي الخطأ عنك إن لم
     تفتح الطرفية. لذا اختبار jsdom قبل التسليم يبقى ضروريًا —
     هو الوحيد الذي يخبرك أنت لا المتصفّح. */
  window.addEventListener('load', function(){
    document.querySelectorAll('.station').forEach(function(station){
      var primaries = station.querySelectorAll('.station-handoff .station-next:not(.demoted)');
      if(primaries.length < 2) return;
      var names = [];
      for(var i = 1; i < primaries.length; i++){
        primaries[i].classList.add('demoted');
        names.push('"' + (primaries[i].textContent || '').trim() + '"');
      }
      console.warn('%c[مختبر فؤاد] هرم الأزرار: ' + (station.id || 'محطة بلا معرّف') +
        ' فيها ' + primaries.length + ' أزرار ممتلئة. أُبقي الأول وهُبّط: ' + names.join(' و') + '.',
        'background:#ff6b4a;color:#131c30;font-weight:bold;padding:3px 8px;border-radius:4px;');
      console.warn('القاعدة: صنف station-next لزر الانتقال بين المحطات وحده. ' +
                   'أزرار الفعل داخل المهمة تأخذ btn أو pill-link.');
    });
  });

  // مساعد آمن: لا يفترض وجود xp.js
  function claimXP(id, points, reason){
    if(window.XP && window.XP.claim) window.XP.claim(id, points, reason);
  }
  function pts(name, fallback){
    return (window.XP && window.XP.POINTS && window.XP.POINTS[name]) || fallback;
  }

  /* تنظيف لمرّة واحدة: مفاتيح محرّك XP القديم بقيت في متصفّحات
     الطلاب بعد إلغائه. إزالتها تمنع خلط رصيد قديم مبني على التمرير
     برصيد جديد مبني على التفكير. */
  try{
    localStorage.removeItem('fouadEduLabXP:' + location.pathname);
    localStorage.removeItem('fouadEduLabXPStations:' + location.pathname);
  }catch(e){ /* قد يُحجب localStorage (تصفّح خاص) — تجاهل */ }

  // ---------- 1) شريط التقدّم + الظهور التدريجي عند التمرير ----------
  // لا نقاط هنا إطلاقًا — النقطة المضاءة والنغمة إشارة موضع فقط.
  var chimedStations = new Set();
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      var dot = document.querySelector('.progress-dot[data-target="'+entry.target.id+'"]');
      if(dot && !dot.classList.contains('active')){
        dot.classList.add('active');
        if(!chimedStations.has(entry.target.id)){
          chimedStations.add(entry.target.id);
          if(window.Sounds) window.Sounds.playChime();
        }
      }
    });
  }, {threshold:0, rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.station[id^="station-"]').forEach(function(s){ io.observe(s); });

  /* ---------- 1b) عدّاد المحطات «المحطة X من N» ----------

     يُحقن تلقائيًا داخل .progress-track — لا يحتاج الدرس أي وسم.

     لماذا المقام مشتقّ لا مكتوب؟ الرقم المكتوب يدويًا رقمٌ يُنسى
     تحديثه: لو نُسخ هيكل درس من سبع محطات إلى درس من ستّ، عرض
     «6 من 7» بلا خطأ ظاهر يفضحه. الاشتقاق يجعل هذا مستحيلًا.

     ولماذا من النقاط لا من .station؟ لأن النقاط هي العقد المعلن
     للطالب. المحطة المشطورة داخليًا (مثل station-2b في درس 03)
     عنصر station بلا نقطة عمدًا — فلا تُحسب محطةً ثامنة، ويبقى
     الطالب فيها قارئًا «المحطة 2».

     دلالة الرقم: أين أنت الآن (يتبع أعلى محطة مرئية، ويتراجع لو
     رجع الطالب للمراجعة).

     وهذا الرقم هو مؤشّر التقدّم الوحيد الذي يراه الطالب منذ
     31 يوليو 2026: النقاط أُخفيت بصريًا (انظر تعليق .progress-dot
     في template.css) لأن دلالتها «ما بلغتَه» كانت تناقض دلالته
     «أين أنت» على الشاشة نفسها. وهي باقية في الوسم لأن مقام هذا
     العدّاد مشتقّ من عددها، ولأن نغمة الوصول معلّقة بإضاءتها. */
  var track = document.querySelector('.progress-track');
  var dots  = track ? track.querySelectorAll('.progress-dot') : [];

  if(track && dots.length){
    var dotIndex = {};                 // station-id  ->  رقم المحطة (يبدأ من 1)
    Array.prototype.forEach.call(dots, function(d, i){
      if(d.dataset.target) dotIndex[d.dataset.target] = i + 1;
    });

    var counter = document.createElement('div');
    counter.className = 'station-counter';
    counter.id = 'stationCounter';
    counter.setAttribute('aria-live', 'polite');
    counter.innerHTML =
      '<span class="sc-word">المحطة</span>' +
      '<span class="sc-now">1</span>' +
      '<span class="sc-sep">من</span>' +
      '<span class="sc-total">' + dots.length + '</span>';
    track.appendChild(counter);

    var nowEl = counter.querySelector('.sc-now');
    var shown = 1;

    /* مجموعة المحطات المرئية حاليًا: الرقم المعروض هو أصغرها —
       أي أعلى محطة مرئية على الشاشة، لا آخر ما دخل نطاق الرصد.
       بدون ذلك يقفز الرقم للأمام بمجرّد أن تطلّ حافة المحطة
       التالية أسفل الشاشة والطالب ما زال يقرأ الحالية. */
    var visible = new Set();

    function render(){
      var min = 0;
      visible.forEach(function(id){
        var n = dotIndex[id];
        if(n && (!min || n < min)) min = n;
      });
      if(!min || min === shown) return;   // المحطة بلا نقطة (مرحلة داخلية) لا تغيّر الرقم
      shown = min;
      nowEl.textContent = min;
    }

    var counterIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      render();
    }, {threshold:0, rootMargin:'0px 0px -12% 0px'});

    document.querySelectorAll('.station[id^="station-"]').forEach(function(s){
      counterIO.observe(s);
    });
  }

  // ---------- 2) تظليل الخيار المختار داخل كل مجموعة أسئلة ----------
  // عرض فقط. لا يمنح نقاطًا ولا يحكم على الصواب — ذلك بكود الدرس،
  // الذي ينادي XP.claim بنفسه عند إجابة صحيحة.
  document.querySelectorAll('.quiz-options').forEach(function(group){
    group.querySelectorAll('.quiz-option').forEach(function(opt){
      opt.addEventListener('click', function(){
        group.querySelectorAll('.quiz-option').forEach(function(o){ o.classList.remove('selected'); });
        opt.classList.add('selected');
      });
    });
  });

  /* ==========================================================
     4) محرّكات الأسئلة المشتركة — window.Quiz  (ترقية أغسطس 2026)
     ----------------------------------------------------------
     رُقّيت من درس 03 بعد أن تكرّرت فيه أربع نسخ من محرّك واحد.
     ثلاثة محرّكات لا أكثر، والقاعدة الحاكمة: المحرّك آلة تفاعل لا
     محتوى مادة. كل ما يخصّ العلم — نصّ السؤال، المشتّت، التلميح،
     سبب النقاط — يبقى في الدرس. وكل ما يخصّ السلوك — الإقفال،
     التغذية، النقاط، مخرج النجاة — يعيش هنا.

     والمحرّك باب لا سور: أي درس يحتاج سلوكًا خاصًّا يكتبه بنفسه
     ولا يقاتل المشترك. ولذلك يستقبل كل محرّك دوالّ ربط (onSolved،
     onAllSolved) يضع فيها الدرس إيقاعه الخاص: الطيّ، كشف صندوق،
     تبديل وزن زرّ، فتح مرحلة.

     ---------- اصطلاح الوسم ----------
     مجموعة الخيارات:  <div class="quiz-options" data-q="اسم-فريد">
     التغذية الراجعة:  <p class="explore-feedback" id="fb-اسم-فريد" hidden>

     السمة data-q واحدة للمنصّة كلها، وقيمتها فريدة داخل الصفحة.
     ولذلك لا يمشّط المحرّك الصفحة بحثًا عن أسئلة: الدرس يسلّمه
     أسماء أسئلته. وهذا ما أنهى تصادم سمات النطاق الأربع في درس 03
     (data-step / data-lat / data-cao / data-ev).

     ---------- أين يعيش النصّ العربي ----------
     في كائن واحد أعلى سكربت الدرس، لا موزّعًا على سمات HTML.
     السبب: التلميحات خريطة ذات بعدين (سؤال × مشتّت) وجملها كاملة،
     فحشرها في سمات يُفقد الوسمَ قابلية القراءة ويُفقد المراجعةَ
     النصّية قبل الكود معناها — وهي قاعدة العمل الأولى.
     ========================================================== */

  /* ---------- تطبيع عربي متسامح ----------
     يحذف التشكيل والتطويل، ويوحّد الهمزات والألف المقصورة والتاء
     المربوطة، ويزيل الترقيم ويوحّد المسافات. الغرض واحد: ألّا
     تُرفض إجابة صحيحة علميًا لفرق إملائي لا يغيّر المعنى. */
  function normalizeAr(str){
    return String(str == null ? '' : str)
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\u0621-\u064A0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /* ---------- تطبيع صيغة كيميائية ----------
     يقبل K₂O و K2O و k 2 o. رفضُ فهمٍ صحيح لسبب كتابيّ ليس تقييمًا. */
  function normalizeFormula(str){
    return String(str == null ? '' : str)
      .replace(/[\u2080-\u2089]/g, function(c){
        return String.fromCharCode(c.charCodeAt(0) - 0x2080 + 48);
      })
      .replace(/[\s.,\-_]/g, '')
      .toLowerCase();
  }

  /* ---------- بناء مصحّح من وصف ----------
     spec.paths مسارات قبولٍ بديلة؛ يكفي تحقّق واحد منها.
     كل مسار: all — قوائم كلمات، يجب أن يتحقّق من كل قائمة عنصرٌ
     واحد على الأقل (أي: و بين القوائم، أو داخل القائمة).
     rejectTokens — كلمات نفي تُفحص ككلمات مستقلّة لا كأجزاء من
     كلمات: «غير» داخل «تغيّر» ليست نفيًا. وجود إحداها يُسقط المسار.

     مثال: قبول «نقص عدد الإلكترونات» و«البروتونات لم تتغيّر» معًا،
     ورفض «لم يتغيّر عدد الإلكترونات» لأنها عكس الصواب. */
  function buildMatcher(spec){
    if(typeof spec === 'function') return spec;
    var paths = (spec && spec.paths) || [];
    return function(normalized){
      if(!normalized || normalized.length < (spec.minLength || 3)) return false;
      var tokens = normalized.split(' ');
      for(var i = 0; i < paths.length; i++){
        var p = paths[i];
        var okPath = true;
        if(p.rejectTokens && p.rejectTokens.some(function(t){ return tokens.indexOf(t) !== -1; })){
          okPath = false;
        }
        if(okPath && p.all){
          for(var g = 0; g < p.all.length; g++){
            var group = p.all[g];
            var hit = group.some(function(word){
              /* فحص بالسلوك لا بالنوع: instanceof يفشل عبر النطاقات
                 (تعبير نمطي أُنشئ في نافذة أخرى ليس RegExp هنا). */
              if(word && typeof word.test === 'function') return word.test(normalized);
              return normalized.indexOf(word) !== -1;
            });
            if(!hit){ okPath = false; break; }
          }
        }
        if(okPath) return true;
      }
      return false;
    };
  }

  function el(id){ return id ? document.getElementById(id) : null; }
  function groupOf(name){ return document.querySelector('.quiz-options[data-q="' + name + '"]'); }
  function setFb(node, kind, txt){
    if(!node) return;
    node.hidden = false;
    node.textContent = txt;
    node.className = 'explore-feedback ' + (kind === 'correct' ? 'is-correct' : 'is-hint');
  }
  function sound(fn){ if(window.Sounds && window.Sounds[fn]) window.Sounds[fn](); }

  // أسماء الأسئلة المسجَّلة — لتشخيص سؤال في الوسم بلا إعداد
  var registered = {};

  /* ==========================================================
     Quiz.practice — أسئلة اختيار في محطات التدريب والاستكشاف
     ----------------------------------------------------------
     السلوك: محاولات غير محدودة، والخطأ تلميحٌ لا وسمٌ أحمر (طابع
     الاستكشاف منخفض التوتر). الإقفال يقع عند الإجابة الصحيحة لا
     قبلها، فلا تُبدَّل إجابة صحيحة بخاطئة عند المراجعة.

     questions: { اسم: { xpId, xp, points, reason, hints, fb, correctText } }
       xp      — اسم من سلّم XP: MCQ · MATCH · PATTERN · PREDICT · BONUS…
       points  — يتجاوز السلّم عند الحاجة (نادر؛ الأصل الالتزام بالسلّم)
       hints   — { قيمة_المشتّت: 'تلميح', any: 'تلميح احتياطي' }
       fb      — مُعرّف عنصر التغذية إن خالف اصطلاح fb-الاسم

     hooks: { onSolved(name), onAllSolved(), onWrong(name, value) }
     ========================================================== */
  function practice(questions, hooks){
    hooks = hooks || {};
    var names = Object.keys(questions || {});
    var solved = {};

    function allSolved(){
      return names.every(function(n){ return solved[n]; });
    }

    names.forEach(function(name){
      registered[name] = true;
      var q     = questions[name] || {};
      var group = groupOf(name);
      var fb    = el(q.fb || ('fb-' + name));
      if(!group){
        console.warn('[مختبر فؤاد] سؤال مسجَّل بلا وسم: data-q="' + name + '" غير موجود.');
        return;
      }

      var radios = group.querySelectorAll('input[type="radio"]');
      radios.forEach(function(radio){
        radio.addEventListener('change', function(){
          if(solved[name]) return;

          if(radio.value === 'correct'){
            solved[name] = true;
            var opt = radio.closest('.quiz-option');
            if(opt) opt.classList.add('correct');
            setFb(fb, 'correct', q.correctText || '✓ صحيح!');
            sound('playSnap');
            if(q.xpId) claimXP(q.xpId, q.points || pts(q.xp || 'MCQ', 5), q.reason || '');
            radios.forEach(function(r){ r.disabled = true; });
            if(hooks.onSolved) hooks.onSolved(name);
            if(allSolved() && hooks.onAllSolved) hooks.onAllSolved();
          }else{
            var hints = q.hints || {};
            setFb(fb, 'hint', '💡 ' + (hints[radio.value] || hints.any || ''));
            sound('playWrong');
            if(hooks.onWrong) hooks.onWrong(name, radio.value);
          }
        });
      });
    });

    return {
      isSolved: function(n){ return !!solved[n]; },
      allSolved: allSolved
    };
  }

  /* ==========================================================
     Quiz.short — إجابة قصيرة مكتوبة، ومعها مخرج النجاة
     ----------------------------------------------------------
     مخرج النجاة ليس خيارًا: بعد محاولتين يظهر زرّ الإجابة النموذجية
     ويمنح نصف النقاط. السبب قاعدة منصّية: مصحّح الكلمات المفتاحية
     مهما اتّسع يبقى قابلًا لأن تفوته صياغةٌ صحيحة، فلا يجوز أن
     يُحبَس طالب في حلقة تلميحات لا نهاية لها.

     cfg:
       input, button, feedback           — مُعرّفات العناصر (إلزامية)
       modelBtn, model                   — زرّ النموذج وصندوقه (إلزاميان)
       accept                            — دالّة(مطبَّع, خام) أو وصف paths
       normalize: 'ar' | 'formula' | دالّة
       hints                             — مصفوفة تُستهلك بالتدرّج، أو
                                           دالّة(مطبَّع, محاولة) ترجع نصًّا
       modelText                         — نصّ الإجابة النموذجية
       xpId, xp, reason, modelReason     — النقاط وأسبابها
       escapeAfter                       — افتراضيًا 2
       onDone(viaModel)                  — إيقاع الدرس بعد الإتمام
     ========================================================== */
  function short(cfg){
    cfg = cfg || {};
    var input    = el(cfg.input);
    var button   = el(cfg.button);
    var fb       = el(cfg.feedback);
    var modelBtn = el(cfg.modelBtn);
    var modelBox = el(cfg.model);
    if(!input || !button){
      console.warn('[مختبر فؤاد] إجابة قصيرة بلا حقل أو زرّ: ' + cfg.input);
      return;
    }
    if(!modelBtn || !modelBox){
      console.warn('%c[مختبر فؤاد] إجابة قصيرة بلا مخرج نجاة: ' + cfg.input +
        ' — القاعدة تقضي بزرّ إجابة نموذجية بعد محاولتين.',
        'background:#ff6b4a;color:#131c30;font-weight:bold;padding:3px 8px;border-radius:4px;');
    }

    var norm = cfg.normalize === 'formula' ? normalizeFormula
             : (typeof cfg.normalize === 'function' ? cfg.normalize : normalizeAr);
    var matches = buildMatcher(cfg.accept);
    var after = typeof cfg.escapeAfter === 'number' ? cfg.escapeAfter : 2;
    var tries = 0, done = false;

    function lock(){
      done = true;
      input.disabled = true;
      button.disabled = true;
      if(modelBtn) modelBtn.hidden = true;
    }

    function hintFor(value){
      if(typeof cfg.hints === 'function') return cfg.hints(value, tries);
      var list = cfg.hints || [];
      return list[Math.min(tries - 1, list.length - 1)] || '';
    }

    function check(){
      if(done) return;
      var raw = (input.value || '').trim();
      if(!raw){
        setFb(fb, 'hint', '💡 ' + (cfg.emptyText || 'اكتب إجابتك أولًا.'));
        input.focus();
        return;
      }
      if(window.XP && window.XP.attempt && cfg.xpId) window.XP.attempt(cfg.xpId);
      tries++;

      if(matches(norm(raw), raw)){
        setFb(fb, 'correct', cfg.correctText || '✓ صحيح!');
        lock();
        sound('playSnap');
        if(cfg.xpId) claimXP(cfg.xpId, cfg.points || pts(cfg.xp || 'PRODUCE', 8), cfg.reason || '');
        if(cfg.onDone) cfg.onDone(false);
        return;
      }

      setFb(fb, 'hint', '💡 ' + hintFor(norm(raw)));
      sound('playWrong');
      if(tries >= after && modelBtn) modelBtn.hidden = false;
    }

    button.addEventListener('click', check);
    input.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); check(); }
    });

    if(modelBtn && modelBox){
      modelBtn.addEventListener('click', function(){
        if(done) return;
        if(fb) fb.hidden = true;
        modelBox.hidden = false;
        modelBox.textContent = cfg.modelText || '';
        lock();
        var full = cfg.points || pts(cfg.xp || 'PRODUCE', 8);
        if(cfg.xpId) claimXP(cfg.xpId, Math.round(full / 2),
                             cfg.modelReason || 'راجعتَ الإجابة النموذجية وقارنتها بإجابتك');
        if(cfg.onDone) cfg.onDone(true);
      });
    }
  }

  /* ==========================================================
     Quiz.evaluate — محطة التقييم كاملةً حتى الشهادة
     ----------------------------------------------------------
     ما يميّزها عن محطات التدريب، وهو سبب فصلها محرّكًا مستقلًّا:

       • بوابة اسم قبل ظهور الأسئلة، والحقل يبقى قابلًا للتصحيح
         حتى التسليم (الاسم يُقرأ لحظة التسليم لا لحظة البدء).
       • محاولة واحدة: الإقفال فور أول اختيار أيًّا كان — هذا تقييم
         لا تدريب.
       • عند الخطأ يُوسَم اختيار الطالب ويُضاء الصحيح معه ومعهما
         سطر يشرح لماذا: آخر لحظة تعلّم، والطالب في بيته بلا معلّم.
       • بلا XP إطلاقًا: مكافأتها الشارة والشهادة.

     وربط الشهادة داخل المحرّك لا داخل الدرس: من يبني محطة تقييم
     على هذا المحرّك لا يستطيع بناءها بلا شهادة. القاعدة صارت
     بنيوية لا تذكُّرية.

     cfg:
       title      — عنوان الدرس كما يُطبع في الشهادة (بلا «الدرس رقم»)
       questions  — مصفوفة مرتّبة:
                    { name, why }                       اختيار من متعدد
                    { name, type:'text', input, button, feedback,
                      answer, normalize, why }          إجابة مكتوبة
       ids        — تجاوز الاصطلاح عند الحاجة
       badges     — سلّم الشارات (الافتراضي سلّم المنصّة)
     ========================================================== */
  var DEFAULT_BADGES = [
    { min: 80, label: 'متميز' },
    { min: 65, label: 'متمكن' },
    { min: 0,  label: 'مشارك' }
  ];

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function evaluate(cfg){
    cfg = cfg || {};
    var ids = cfg.ids || {};
    var nameInput = el(ids.name    || 'evalName');
    var startBtn  = el(ids.start   || 'evalStart');
    var nameFb    = el(ids.nameFb  || 'evalNameFb');
    var qWrap     = el(ids.wrap    || 'evalQuestions');
    var summary   = el(ids.summary || 'evalSummary');
    if(!nameInput || !startBtn || !qWrap || !summary){
      console.warn('[مختبر فؤاد] محطة تقييم ناقصة العناصر — لم تُفعَّل.');
      return;
    }

    var list   = cfg.questions || [];
    var TOTAL  = list.length;
    var badges = cfg.badges || DEFAULT_BADGES;
    var answered = 0, correctCount = 0, finished = false;

    function badgeOf(p){
      for(var i = 0; i < badges.length; i++){ if(p >= badges[i].min) return badges[i].label; }
      return badges[badges.length - 1].label;
    }

    function start(){
      var v = (nameInput.value || '').trim();
      if(!v){
        setFb(nameFb, 'hint', '💡 ' + (cfg.nameEmptyText || 'اكتب اسمك أولًا لتُطبع الشهادة باسمك.'));
        nameInput.focus();
        return;
      }
      if(nameFb) nameFb.hidden = true;
      qWrap.hidden = false;
      startBtn.disabled = true;
      startBtn.textContent = cfg.startedText || 'التقييم جارٍ';
      sound('playSnap');
    }
    startBtn.addEventListener('click', start);
    nameInput.addEventListener('keydown', function(e){
      if(e.key === 'Enter' && !startBtn.disabled) start();
    });

    function register(isCorrect){
      answered++;
      if(isCorrect) correctCount++;
      if(answered >= TOTAL) finish();
    }

    list.forEach(function(q){
      if(q.type === 'text'){
        var input  = el(q.input);
        var button = el(q.button);
        var fb     = el(q.feedback || ('fb-' + q.name));
        if(!input || !button) return;
        var norm = q.normalize === 'ar' ? normalizeAr
                 : (typeof q.normalize === 'function' ? q.normalize : normalizeFormula);
        var used = false;
        var check = function(){
          if(used || button.disabled) return;
          var v = (input.value || '').trim();
          if(!v){
            setFb(fb, 'hint', '💡 ' + (q.emptyText || 'اكتب إجابتك أولًا.'));
            return;
          }
          used = true;
          /* محاولة واحدة كبقية الأسئلة، ومخرج نجاته كشفُ الصواب فورًا:
             لا معنى لحلقة تلميحات في تقييم لا إعادة فيه. */
          var okAns = norm(v) === norm(q.answer);
          input.disabled = true;
          button.disabled = true;
          if(okAns){
            setFb(fb, 'correct', cfg.correctText || '✓ صحيح');
            sound('playSnap');
          }else{
            setFb(fb, 'hint', '✗ ' + (q.why || ''));
            sound('playWrong');
          }
          register(okAns);
        };
        button.addEventListener('click', check);
        input.addEventListener('keydown', function(e){
          if(e.key === 'Enter'){ e.preventDefault(); check(); }
        });
        return;
      }

      registered[q.name] = true;
      var group = groupOf(q.name);
      var fbEl  = el(q.feedback || ('fb-' + q.name));
      if(!group) return;
      var radios = group.querySelectorAll('input[type="radio"]');
      radios.forEach(function(radio){
        radio.addEventListener('change', function(){
          if(radio.disabled) return;
          radios.forEach(function(r){ r.disabled = true; });   // الإقفال فور أول اختيار

          var okAns = radio.value === 'correct';
          var opt = radio.closest('.quiz-option');
          if(okAns){
            if(opt) opt.classList.add('correct');
            setFb(fbEl, 'correct', cfg.correctText || '✓ صحيح');
            sound('playSnap');
          }else{
            if(opt) opt.classList.add('incorrect');
            var right = group.querySelector('input[value="correct"]');
            if(right && right.closest('.quiz-option')) right.closest('.quiz-option').classList.add('correct');
            setFb(fbEl, 'hint', '✗ ' + (q.why || ''));
            sound('playWrong');
          }
          register(okAns);
        });
      });
    });

    function finish(){
      if(finished) return;
      finished = true;

      var percent = Math.round(correctCount / TOTAL * 100);
      var badge   = badgeOf(percent);
      var student = (nameInput.value || '').trim() || 'الطالب';
      nameInput.disabled = true;

      summary.hidden = false;
      summary.innerHTML = cfg.summaryHtml
        ? cfg.summaryHtml(student, correctCount, TOTAL, percent, badge)
        : ('<div class="eval-score"><span dir="ltr">' + percent + '%</span></div>' +
           '<p class="eval-line">أنهيتَ الدرس يا <b>' + escapeHtml(student) + '</b> بـ ' +
             correctCount + ' من ' + TOTAL + ' — ومستواك <b>' + badge + '</b>.</p>' +
           '<p class="eval-line dim">شهادتك جاهزة أدناه: يمكنك عرضها وطباعتها أو تحميلها.</p>');

      sound('playChime');
      if(cfg.onFinish) cfg.onFinish(percent, correctCount, TOTAL, student);

      /* الشهادة إلزامية بكل تقييم. عنوان الدرس بلا بادئة «الدرس رقم». */
      if(window.Certificate && window.Certificate.finish){
        window.Certificate.finish(student, cfg.title, percent);
      }else{
        console.warn('[مختبر فؤاد] certificate.js لم يُحمّل: التقييم انتهى بلا شهادة.');
      }
    }
  }

  /* تشخيص للمطوّر لا يراه الطالب: سؤال في الوسم بلا تسجيل في الدرس
     يبقى صامتًا تمامًا — لا نقاط ولا تغذية — وهذا أسوأ من عطل ظاهر. */
  window.addEventListener('load', function(){
    var orphans = [];
    document.querySelectorAll('.quiz-options[data-q]').forEach(function(g){
      var n = g.getAttribute('data-q');
      if(!registered[n]) orphans.push(n);
    });
    if(orphans.length){
      console.warn('%c[مختبر فؤاد] أسئلة في الوسم بلا تسجيل: ' + orphans.join(' · ') +
        '. لن تعمل ولن تمنح نقاطًا.',
        'background:#ff6b4a;color:#131c30;font-weight:bold;padding:3px 8px;border-radius:4px;');
    }
  });

  window.Quiz = {
    practice: practice,
    short: short,
    evaluate: evaluate,
    normalizeAr: normalizeAr,
    normalizeFormula: normalizeFormula,
    matcher: buildMatcher
  };

  // ---------- 3) محرّك السحب والإفلات + النقر للاختيار ----------
  /* مُعرّف ثابت لكل خانة، تُبنى مرّة عند التحميل بترتيب ورودها في
     الصفحة. الدروس ملفات HTML ثابتة، فالترتيب لا يتغيّر، والمُعرّف
     يبقى صالحًا عبر إعادة التحميل — وهذا ما يمنع تكرار كسب النقاط.
     يمكن لأي درس تثبيت مُعرّفه بنفسه عبر data-xp-id على الخانة. */
  /* ---------- توسعة أغسطس 2026: التصنيف متعدّد إلى واحد ----------
     خانة واحدة تقبل أكثر من رقاقة، وتلميح نصّي عند الوضع الخاطئ بدل
     الاهتزاز وحده. الاثنتان إضافة خالصة لا إعادة كتابة: خانة بقيمة
     واحدة في data-answer وبلا .slot-items تسلك حرفيًّا كما كانت،
     ودرسا 03 و04 لا يتغيّر فيهما شيء.

     الوسم:
       <div class="slot cat-slot" id="s-x" data-answer="أ|ب">
         <span class="slot-label">عنوان الخانة</span>
         <span class="slot-items"></span>
       </div>
     السعة تُشتقّ من عدد القيم في data-answer، ويمكن تثبيتها بـdata-capacity.
     والخانة لا تُقفل بصنف correct إلا عند امتلائها.

     النقاط: المُعرّف من الرقاقة إن وُجد (data-xp-id) وإلا من الخانة.
     فالوحدة في التصنيف هي الرقاقة — فعل الطالب — لا الخانة.

     التلميحات تُسجَّل من الدرس، فالنصّ العربي يبقى في كائن واحد أعلى
     سكربت الدرس لا موزّعًا على سمات:
       Chips.hints({ 'قيمة الرقاقة|مُعرّف الخانة': 'نصّ', 'قيمة الرقاقة': 'احتياطي' });
     ويظهر النصّ في .chips-feedback داخل أقرب سلف يحمل [data-chips]. */
  var chipHints = {};
  var chipDone  = {};
  window.Chips = {
    hints: function(map){
      Object.keys(map || {}).forEach(function(k){ chipHints[k] = map[k]; });
    },
    /* نداء عند اكتمال كل خانات نشاط [data-chips="اسم"]. يحتاجه الدرس
       لكشف سطر الخلاصة، ولمنح نقاط نشاط يُسعَّر ككلّ لا برقاقاته
       (تحدٍّ اختياري مثلًا: رقاقاته data-xp-id="none" والنقاط هنا). */
    onDone: function(name, fn){ chipDone[name] = fn; }
  };

  function slotAnswers(slot){ return (slot.dataset.answer || '').split('|'); }
  function slotCapacity(slot){
    return parseInt(slot.dataset.capacity, 10) || slotAnswers(slot).length;
  }
  function slotFilled(slot){ return parseInt(slot.dataset.filled, 10) || 0; }
  function slotAccepts(slot, chip){
    return slotAnswers(slot).indexOf(chip.dataset.value) >= 0;
  }
  function chipsFbOf(slot){
    var wrap = slot && slot.closest ? slot.closest('[data-chips]') : null;
    return wrap ? wrap.querySelector('.chips-feedback') : null;
  }
  function showChipHint(chip, slot){
    var fb = chipsFbOf(slot);
    if(!fb) return;
    var txt = chipHints[chip.dataset.value + '|' + slot.id] ||
              chipHints[chip.dataset.value] ||
              slot.dataset.hint || '';
    if(!txt) return;
    fb.textContent = '💡 ' + txt;
    fb.classList.add('is-hint');
    fb.classList.remove('is-correct');
    fb.hidden = false;
  }
  function clearChipHint(slot){
    var fb = chipsFbOf(slot);
    if(fb) fb.hidden = true;
  }

  var slotEls = document.querySelectorAll('.slot');
  slotEls.forEach(function(slot, i){
    if(!slot.dataset.xpId){
      slot.dataset.xpId = slot.id ? ('slot-' + slot.id) : ('slot-' + (i + 1));
    }
  });

  var chipEls = document.querySelectorAll('.chips-pool .chip');
  /* تحذير لمن يضيف آلية جديدة لهذا الملف: هذا خروج مبكّر من الدالّة
     المغلّفة كلها، لا من محرّك السحب وحده. فأي كود يُكتب بعده لن يعمل
     في درس بلا شرائح سحب. ضَع أي إضافة جديدة قبل هذا السطر. */
  if(!chipEls.length) return;

  /* ---------------------------------------------------------
     إعادة بناء يوليو 2026 — لماذا؟
     ---------------------------------------------------------
     1) لا معالج لإلغاء المؤشّر: حين يلغي نظام الجوال المؤشّر (إيماءة
        نظام، إشعار وارد، لمسة ثانية، تبديل تطبيق) لا يُطلق pointerup
        إطلاقًا، فتبقى الرقاقة معلّقة position:fixed فوق الصفحة إلى
        الأبد ويبقى dragEl مشغولًا فيتعطّل كل سحب لاحق. الآن كل
        مسارات الإنهاء — الطبيعي والملغى — تمرّ بدالة تنظيف واحدة.

     2) نقل الرقاقة إلى body كان يترك فراغًا في المسبح فيعيد ترتيب
        باقي الرقاقات لحظة بدء السحب. الآن يحلّ محلّها "شبح" بنفس
        أبعادها فلا يتحرّك شيء، وعند النجاح ينكمش الشبح بانسياب.

     3) لا بديل للسحب. النقر للاختيار (رقاقة ← خانة) يفتح النشاط
        لمن يصعب عليه السحب الدقيق ولمستخدم لوحة المفاتيح — وهذا
        مبدأ UDL لا تحسينًا للجوال فقط.
     --------------------------------------------------------- */

  var dragEl = null;      // الرقاقة المسحوبة حاليًا (واحدة فقط)
  var ghostEl = null;     // العنصر الحاجز لمكانها في المسبح
  var startX = 0, startY = 0;
  var didMove = false;    // للتمييز بين سحب حقيقي ونقرة
  var selectedChip = null;
  // الرفع المؤجَّل: الرقاقة لا تُنتزع عند الضغط بل عند أول حركة تتجاوز
  // العتبة. lifted تعني «انتُزعت فعلًا»، وpressX/Y نقطة الضغط الأولى،
  // وpressRect صندوقها في المسبح قبل أن تغادره.
  var DRAG_THRESHOLD = 6; // بكسل — أوسع من 5 لأن الإصبع أقلّ ثباتًا من الفأرة
  var lifted = false;
  var pressX = 0, pressY = 0;
  var pressRect = null;

  function allSlots(){ return document.querySelectorAll('.slot'); }
  function clearDragover(){
    allSlots().forEach(function(s){ s.classList.remove('dragover'); });
  }

  // الخانة تحت نقطة معيّنة. لا حاجة لإخفاء الرقاقة قبل القياس لأن
  // .dragging تحمل أصلًا pointer-events:none — والإخفاء المؤقّت كان
  // يفرض إعادتَي تخطيط مع كل حركة إصبع.
  function slotFromPoint(x, y){
    var under = document.elementFromPoint(x, y);
    var slot = under && under.closest ? under.closest('.slot') : null;
    return (slot && !slot.classList.contains('correct')) ? slot : null;
  }

  function makeGhost(chip){
    if(ghostEl && ghostEl.parentNode) return ghostEl;
    var rect = chip.getBoundingClientRect();
    var g = document.createElement('span');
    g.className = 'chip-ghost';
    g.setAttribute('aria-hidden', 'true');
    g.style.width = (rect.width || chip.offsetWidth) + 'px';
    g.style.height = (rect.height || chip.offsetHeight) + 'px';
    if(chip.parentNode) chip.parentNode.insertBefore(g, chip);
    ghostEl = g;
    return g;
  }

  function clearChipStyles(chip){
    chip.classList.remove('dragging');
    chip.style.position = '';
    chip.style.left = '';
    chip.style.top = '';
    chip.style.width = '';
  }

  /* الانتزاع الفعلي: كان يقع في pointerdown، وصار يقع هنا عند أول حركة
     تتجاوز العتبة. الإحداثيات من pressRect — صندوق الرقاقة في المسبح
     لحظة الضغط — لا من قياس جديد، لأن الشبح لم يُدرَج بعد. */
  function liftChip(chip){
    var rect = pressRect || chip.getBoundingClientRect();
    makeGhost(chip);
    chip.classList.add('dragging');
    chip.style.left = rect.left + 'px';
    chip.style.top = rect.top + 'px';
    chip.style.width = rect.width + 'px';
    document.body.appendChild(chip);
    lifted = true;
  }

  // تُرجع الرقاقة إلى موضعها الأصلي بدقّة: مكان الشبح لا مرجع شقيق
  // قديم قد يكون تغيّر.
  function returnChipToPool(chip){
    if(ghostEl && ghostEl.parentNode){
      ghostEl.parentNode.insertBefore(chip, ghostEl);
      ghostEl.parentNode.removeChild(ghostEl);
    }
    ghostEl = null;
    clearChipStyles(chip);
  }

  // عند النجاح: الرقاقة تختفي والشبح ينكمش تدريجيًا بدل قفزة مفاجئة
  function collapseGhost(){
    var g = ghostEl;
    ghostEl = null;
    if(!g || !g.parentNode) return;
    void g.offsetWidth; // فرض حساب التخطيط قبل بدء الانتقال
    g.classList.add('collapsing');
    setTimeout(function(){
      if(g.parentNode) g.parentNode.removeChild(g);
    }, 280);
  }

  function shakeChip(chip){
    chip.classList.add('shake');
    if(window.Sounds) window.Sounds.playWrong();
    setTimeout(function(){ chip.classList.remove('shake'); }, 400);
  }

  function placeChip(chip, slot){
    makeGhost(chip); // مسار النقر لا يمرّ بالسحب، فقد لا يوجد شبح بعد
    // خانة تصنيف: تُراكم الرقاقات داخل .slot-items ويبقى عنوانها ظاهرًا.
    // خانة عادية: النصّ يحلّ محلّ المحتوى كما كان دائمًا.
    var bucket = slot.querySelector ? slot.querySelector('.slot-items') : null;
    if(bucket){
      var item = document.createElement('span');
      item.className = 'slot-item';
      item.textContent = chip.dataset.value;
      bucket.appendChild(item);
    }else{
      slot.textContent = chip.dataset.value;
    }
    var filled = slotFilled(slot) + 1;
    slot.dataset.filled = filled;
    slot.classList.remove('dragover');
    if(filled >= slotCapacity(slot)){
      slot.classList.remove('partial');
      slot.classList.add('correct');
      slot.removeAttribute('tabindex');
    }else{
      slot.classList.add('partial');
    }
    if(ghostEl && ghostEl.parentNode) ghostEl.parentNode.insertBefore(chip, ghostEl);
    clearChipStyles(chip);
    chip.classList.add('placed');
    chip.setAttribute('aria-hidden', 'true');
    chip.removeAttribute('tabindex');
    collapseGhost();
    clearChipHint(slot);
    if(window.Sounds) window.Sounds.playSnap();
    // سبب المكسب قابل للتخصيص بالدرس عبر data-xp-reason، والمُعرّف من
    // الرقاقة إن وُجد — فخانة تسع رقاقتين تطلب ضعف العمل.
    var xpId = chip.dataset.xpId || slot.dataset.xpId;
    if(xpId !== 'none'){
      claimXP(xpId, pts('MATCH', 5),
              chip.dataset.xpReason || slot.dataset.xpReason || 'مطابقة صحيحة');
    }
    var wrap = slot.closest ? slot.closest('[data-chips]') : null;
    if(wrap){
      var pending = wrap.querySelectorAll('.slot:not(.correct)');
      if(!pending.length && chipDone[wrap.dataset.chips]){
        var fn = chipDone[wrap.dataset.chips];
        chipDone[wrap.dataset.chips] = null;   // مرّة واحدة لا تتكرّر
        fn();
      }
    }
  }

  // ----- حالة الاختيار بالنقر -----
  function markTargets(){
    allSlots().forEach(function(s){
      if(selectedChip && !s.classList.contains('correct')) s.classList.add('targetable');
      else s.classList.remove('targetable');
    });
  }

  function clearSelection(){
    if(selectedChip){
      selectedChip.classList.remove('selected');
      selectedChip.setAttribute('aria-pressed', 'false');
    }
    selectedChip = null;
    markTargets();
  }

  function toggleSelect(chip){
    if(chip.classList.contains('placed')) return;
    if(selectedChip === chip){ clearSelection(); return; }
    clearSelection();
    selectedChip = chip;
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
    markTargets();
    if(window.Sounds) window.Sounds.playTick();
  }

  function tryPlaceSelected(slot){
    if(!selectedChip) return;
    if(slot.classList.contains('correct')) return;
    var chip = selectedChip;
    clearSelection();
    if(slotAccepts(slot, chip)) placeChip(chip, slot);
    else { shakeChip(chip); showChipHint(chip, slot); }
  }

  // ----- إنهاء السحب: مسار واحد لكل النهايات -----
  function endDrag(chip, slot){
    dragEl = null;
    lifted = false;
    clearDragover();
    if(slot && slotAccepts(slot, chip)){
      placeChip(chip, slot);
      return;
    }
    returnChipToPool(chip);
    if(slot){ shakeChip(chip); showChipHint(chip, slot); }
  }

  // إلغاء: تُرجع كل شيء كما كان دون حكم على صواب أو خطأ.
  // ومع الرفع المؤجَّل قد يقع الإلغاء والرقاقة لم تغادر المسبح بعد —
  // فلا يُعاد إدراجها ولا يُبحث عن شبح لا وجود له.
  function cancelDrag(){
    if(!dragEl) return;
    var chip = dragEl;
    var wasLifted = lifted;
    dragEl = null;
    lifted = false;
    clearDragover();
    if(wasLifted) returnChipToPool(chip);
  }

  chipEls.forEach(function(chip){
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-pressed', 'false');

    /* الرفع مؤجَّل إلى أول حركة تتجاوز العتبة، لا عند الضغط.
       العلّة التي يعالجها: كان `pointerdown` ينتزع الرقاقة من المسبح
       إلى <body> ويثبّتها بـposition:fixed ويضع شبحًا مكانها — ولو كانت
       نيّة الطالب نقرةً ثابتة. ثم يُلغى ذلك كلّه في `pointerup` وتُعاد
       الرقاقة. فالنقرة الواحدة كانت رحلة ذهاب وإياب مرئية للعين: الرقاقة
       تتجمّد في مكانها من الشاشة بينما يتحرّك ما حولها، فتبدو "نازلة"
       قبل أن تُضيء (رصدها فؤاد بالعين على الوحدة 02 · درس 02، وهي في
       المشترك فتصيب كل درس فيه رقاقات).
       والعتبة 6 بكسل لا 5: الطلاب على شاشات لمس، والإصبع أقلّ ثباتًا
       من الفأرة فيحوّل ارتجافُه النقرةَ سحبًا. */
    chip.addEventListener('pointerdown', function(e){
      if(dragEl) return;                 // إصبع ثانٍ أثناء سحب جارٍ
      if(e.isPrimary === false) return;
      if(chip.classList.contains('placed')) return;
      var rect = chip.getBoundingClientRect();
      dragEl = chip;
      didMove = false;
      lifted = false;
      pressX = e.clientX;
      pressY = e.clientY;
      pressRect = rect;
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      // الالتقاط وحده يقع الآن: يضمن وصول pointermove/pointerup حتى لو
      // خرج الإصبع عن الرقاقة. ولا شيء يُنتزع ولا يُرسم بعد.
      try{ chip.setPointerCapture(e.pointerId); }catch(err){ /* غير مدعوم — السحب يعمل بدونه */ }
    });

    chip.addEventListener('pointermove', function(e){
      if(dragEl !== chip) return;
      if(!lifted){
        var dx = e.clientX - pressX, dy = e.clientY - pressY;
        if((dx * dx + dy * dy) < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
        liftChip(chip);                  // أول حركة حقيقية: الآن يبدأ السحب
      }
      didMove = true;
      chip.style.left = (e.clientX - startX) + 'px';
      chip.style.top = (e.clientY - startY) + 'px';
      clearDragover();
      var slot = slotFromPoint(e.clientX, e.clientY);
      if(slot) slot.classList.add('dragover');
    });

    chip.addEventListener('pointerup', function(e){
      if(dragEl !== chip) return;
      // لم تتجاوز الحركة العتبة: نيّة اختيار لا سحب. والرقاقة لم تغادر
      // المسبح أصلًا، فلا شيء يُعاد.
      if(!lifted){
        dragEl = null;
        clearDragover();
        toggleSelect(chip);
        return;
      }
      var slot = slotFromPoint(e.clientX, e.clientY);
      // سحبٌ انتهى في الفراغ = نيّة اختيار كذلك
      if(!slot && !didMove){
        dragEl = null;
        clearDragover();
        returnChipToPool(chip);
        toggleSelect(chip);
        return;
      }
      endDrag(chip, slot);
    });

    // شبكتا الأمان: إلغاء صريح من النظام، أو فقدان الالتقاط لأي سبب.
    // lostpointercapture يُطلق أيضًا بعد pointerup الطبيعي، لذا الشرط
    // dragEl === chip يمنع أي تدخّل بعد إنهاء ناجح.
    chip.addEventListener('pointercancel', function(){
      if(dragEl === chip) cancelDrag();
    });
    chip.addEventListener('lostpointercapture', function(){
      if(dragEl === chip) cancelDrag();
    });

    chip.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
        e.preventDefault();
        toggleSelect(chip);
      } else if(e.key === 'Escape'){
        clearSelection();
      }
    });
  });

  allSlots().forEach(function(slot){
    if(!slot.classList.contains('correct')) slot.setAttribute('tabindex', '0');
    slot.addEventListener('click', function(){ tryPlaceSelected(slot); });
    slot.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
        e.preventDefault();
        tryPlaceSelected(slot);
      } else if(e.key === 'Escape'){
        clearSelection();
      }
    });
  });

  // نقرة في فراغ الصفحة تلغي الاختيار — مخرج واضح للطالب
  document.addEventListener('click', function(e){
    if(!selectedChip) return;
    var t = e.target;
    if(t.closest && (t.closest('.chip') || t.closest('.slot'))) return;
    clearSelection();
  });

  // تبديل التطبيق أو خروج التركيز أثناء سحب معلّق: أعِد الرقاقة
  window.addEventListener('blur', cancelDrag);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden) cancelDrag();
  });
  document.addEventListener('pointercancel', cancelDrag);



})();
