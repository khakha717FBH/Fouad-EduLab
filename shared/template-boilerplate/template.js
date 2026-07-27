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

   يوفّر ثلاث آليات عامة:

     1) ظهور تدريجي لكل محطة عند وصولها بالتمرير + تفعيل نقطة
        التقدّم المقابلة + نغمة انتقال مرة واحدة لكل محطة

     2) تظليل الخيار المُختار داخل كل مجموعة أسئلة (مستقل بين
        المجموعات لو الدرس فيه أكثر من سؤال). منطق التحقّق من
        صحة الإجابة يبقى دائمًا بكود الدرس نفسه.

     3) محرّك سحب وإفلات عام (Pointer Events) لأي .chip داخل
        أي .chips-pool، يُطابق ضد أي .slot بنفس data-answer

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

  // ---------- 3) محرّك السحب والإفلات العام ----------
  /* مُعرّف ثابت لكل خانة، تُبنى مرّة عند التحميل بترتيب ورودها في
     الصفحة. الدروس ملفات HTML ثابتة، فالترتيب لا يتغيّر، والمُعرّف
     يبقى صالحًا عبر إعادة التحميل — وهذا ما يمنع تكرار كسب النقاط.
     يمكن لأي درس تثبيت مُعرّفه بنفسه عبر data-xp-id على الخانة. */
  var slotEls = document.querySelectorAll('.slot');
  slotEls.forEach(function(slot, i){
    if(!slot.dataset.xpId){
      slot.dataset.xpId = slot.id ? ('slot-' + slot.id) : ('slot-' + (i + 1));
    }
  });

  var dragEl = null, startX = 0, startY = 0, origParent = null, origNext = null;

  document.querySelectorAll('.chips-pool .chip').forEach(function(chip){
    chip.addEventListener('pointerdown', function(e){
      dragEl = chip;
      origParent = chip.parentNode;
      origNext = chip.nextSibling;
      var rect = chip.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      chip.classList.add('dragging');
      chip.style.left = rect.left + 'px';
      chip.style.top = rect.top + 'px';
      chip.style.width = rect.width + 'px';
      document.body.appendChild(chip);
      chip.setPointerCapture(e.pointerId);
    });

    chip.addEventListener('pointermove', function(e){
      if(dragEl !== chip) return;
      chip.style.left = (e.clientX - startX) + 'px';
      chip.style.top = (e.clientY - startY) + 'px';

      document.querySelectorAll('.slot').forEach(function(s){ s.classList.remove('dragover'); });
      var prevDisplay = chip.style.display;
      chip.style.display = 'none';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      chip.style.display = prevDisplay;
      var slot = under ? under.closest('.slot') : null;
      if(slot && !slot.classList.contains('correct')) slot.classList.add('dragover');
    });

    chip.addEventListener('pointerup', function(e){
      if(dragEl !== chip) return;
      document.querySelectorAll('.slot').forEach(function(s){ s.classList.remove('dragover'); });
      chip.classList.remove('dragging');

      var prevDisplay = chip.style.display;
      chip.style.display = 'none';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      chip.style.display = prevDisplay;
      var slot = under ? under.closest('.slot') : null;

      if(slot && !slot.classList.contains('correct') && slot.dataset.answer === chip.dataset.value){
        slot.textContent = chip.dataset.value;
        slot.classList.add('correct');
        chip.classList.add('placed');
        origParent.insertBefore(chip, origNext);
        if(window.Sounds) window.Sounds.playSnap();
        // سبب المكسب قابل للتخصيص بالدرس عبر data-xp-reason على الخانة
        claimXP(slot.dataset.xpId, pts('MATCH', 5),
                slot.dataset.xpReason || 'مطابقة صحيحة');
      } else {
        chip.style.position = '';
        chip.style.left = '';
        chip.style.top = '';
        chip.style.width = '';
        origParent.insertBefore(chip, origNext);
        if(slot){
          chip.classList.add('shake');
          if(window.Sounds) window.Sounds.playWrong();
          setTimeout(function(){ chip.classList.remove('shake'); }, 400);
        }
      }
      dragEl = null;
    });
  });

})();
