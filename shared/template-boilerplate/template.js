/* =========================================================
   مختبر فؤاد التعليمي — محرّك الهيكل العام (السلوك)
   shared/template-boilerplate/template.js

   يفعّل تلقائيًا عند تحميله، شرط اتّباع الدرس لهذه الاصطلاحات
   بالـHTML (لا حاجة لأي إعداد إضافي غير هذا):

     • كل محطة:      <section class="station" id="station-N">
     • شريط التقدّم:  <div class="progress-dot" data-target="station-N">
     • عدّاد XP:      <div class="xp-counter" id="xpCounter"> (اختياري،
                      يُوضع كأول عنصر داخل .progress-track — راجع مثال
                      كامل بتعليق CSS المقابل في template.css)
     • مجموعة سؤال:  <div class="quiz-options"><label class="quiz-option">...
     • شرائح السحب:  <div class="chip" data-value="...">  داخل .chips-pool
     • خانات الإفلات: <div class="slot" data-answer="...">

   يوفّر أربع آليات عامة:

     1) نظام نقاط الخبرة (XP): عدّاد ظاهر بالترويسة يتصاعد تلقائيًا
        عند أي تفاعل ناجح عام — وصول محطة جديدة، مطابقة سحب صحيحة،
        أو اختيار صحيح بسؤال متعدد الخيارات (صنف .correct) — مع تأثير
        "‎+رقم‎" منبثق ونبضة خفيفة على العدّاد. يُخزَّن بذاكرة الجلسة
        (sessionStorage) لكل درس على حدة: يبقى محفوظًا عند إعادة تحميل
        نفس الصفحة، ويبدأ من صفر تلقائيًا عند الانتقال لدرس جديد.
        لا خصم أبدًا، ولا علاقة له بعلامة الشهادة أو الشارات — تحفيز
        بصري بحت. متاح أيضًا كـ API عام لأي منطق تصحيح خاص بمحتوى
        الدرس (مثال: سؤال إجابة مكتوبة يُحكَّم يدويًا بكود الدرس) عبر:

          window.XP.award(المقدار)   // مثال: window.XP.award(5)

     2) ظهور تدريجي لكل محطة عند وصولها بالتمرير + تفعيل نقطة
        التقدّم المقابلة + نغمة إنجاز مرة واحدة لكل محطة + نقاط خبرة

     3) تظليل الخيار المُختار داخل كل مجموعة أسئلة (مستقل بين
        المجموعات لو الدرس فيه أكثر من سؤال)، مع رصد تلقائي لأي
        خيار يُصنَّف .correct بكود الدرس لمكافأة نقاط خبرة دون أي
        كود إضافي مطلوب بالدرس نفسه

     4) محرّك سحب وإفلات عام (Pointer Events) لأي .chip داخل
        أي .chips-pool، يُطابق ضد أي .slot بنفس data-answer، مع
        نقاط خبرة عند كل مطابقة صحيحة

   منطق التحقق من صحة الإجابة (أي سؤال هو الصحيح) يبقى دائمًا
   بكود الدرس نفسه — هذا الملف لا يعرف شيئًا عن محتوى المادة.
   نظام XP يراقب فقط اصطلاحات أصناف CSS عامة (.correct) سبق
   تعريفها بـtemplate.css، لا محتوى مادة فعلي.

   يُحمَّل بعد shared/sounds/sounds.js (لتفعيل الصوت، اختياري)
   وقبل </body> مباشرة:

     <script src="[مسار نسبي]/shared/sounds/sounds.js"></script>
     <script src="[مسار نسبي]/shared/faheem-widget/faheem.js"></script>
     <script src="[مسار نسبي]/shared/template-boilerplate/template.js"></script>
   ========================================================= */
(function(){

  // ---------- 0) نظام نقاط الخبرة (XP) ----------
  var XP_STATION = 10;       // أول وصول لكل محطة
  var XP_QUIZ_CORRECT = 5;   // كل خيار اختيار من متعدد يُصنَّف .correct
  var XP_SLOT_CORRECT = 5;   // كل مطابقة سحب/إفلات صحيحة

  var XP_KEY = 'fouadEduLabXP:' + location.pathname;
  var xpValueEl = document.getElementById('xpValue');
  var xpCounterEl = document.getElementById('xpCounter');
  var xpAnimFrame = null;
  var currentXP = 0;

  try{
    currentXP = parseInt(sessionStorage.getItem(XP_KEY) || '0', 10) || 0;
  }catch(e){ /* قد يُحجب sessionStorage ببعض السياقات — نكمل بالذاكرة فقط */ }

  if(xpValueEl) xpValueEl.textContent = currentXP;

  function persistXP(){
    try{ sessionStorage.setItem(XP_KEY, currentXP); }catch(e){ /* تجاهل */ }
  }

  function animateXPTo(target){
    if(!xpValueEl) return;
    if(xpAnimFrame) cancelAnimationFrame(xpAnimFrame);
    var from = parseInt(xpValueEl.textContent, 10) || 0;
    var start = null;
    var duration = 400;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      xpValueEl.textContent = Math.round(from + (target - from) * progress);
      if(progress < 1){
        xpAnimFrame = requestAnimationFrame(step);
      } else {
        xpAnimFrame = null;
      }
    }
    xpAnimFrame = requestAnimationFrame(step);
  }

  function showXPPopup(amount){
    if(!xpCounterEl) return;
    var pop = document.createElement('span');
    pop.className = 'xp-popup';
    pop.textContent = '+' + amount;
    xpCounterEl.appendChild(pop);
    setTimeout(function(){ pop.remove(); }, 900);
  }

  function awardXP(amount){
    amount = Math.round(amount);
    if(!amount || amount <= 0) return;
    currentXP += amount;
    persistXP();
    animateXPTo(currentXP);
    showXPPopup(amount);
    if(xpCounterEl){
      xpCounterEl.classList.remove('xp-bump');
      void xpCounterEl.offsetWidth; // إعادة تشغيل الحركة عند تكرارها بسرعة
      xpCounterEl.classList.add('xp-bump');
    }
  }

  // API عام لأي كود درس يحتاج مكافأة XP لمنطق تصحيح خاص به
  // (مثال: سؤال إجابة مكتوبة يُطابَق يدويًا بكود الدرس)
  window.XP = { award: awardXP };

  // ---------- 1) شريط التقدّم + الظهور التدريجي عند التمرير ----------
  var seenStations = new Set();
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      var dot = document.querySelector('.progress-dot[data-target="'+entry.target.id+'"]');
      if(dot && !dot.classList.contains('active')){
        dot.classList.add('active');
        if(!seenStations.has(entry.target.id)){
          seenStations.add(entry.target.id);
          if(window.Sounds) window.Sounds.playChime();
          awardXP(XP_STATION);
        }
      }
    });
  }, {threshold:0, rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.station[id^="station-"]').forEach(function(s){ io.observe(s); });

  // ---------- 2) تظليل الخيار المختار داخل كل مجموعة أسئلة ----------
  document.querySelectorAll('.quiz-options').forEach(function(group){
    group.querySelectorAll('.quiz-option').forEach(function(opt){
      opt.addEventListener('click', function(){
        group.querySelectorAll('.quiz-option').forEach(function(o){ o.classList.remove('selected'); });
        opt.classList.add('selected');
      });
    });
  });

  // رصد تلقائي لأي خيار يُصنَّف .correct (بكود الدرس) لمكافأة XP —
  // لا يعرف هذا الملف شيئًا عن سبب الصحة، فقط يراقب اصطلاح CSS عام
  // سبق تعريفه بـtemplate.css (.quiz-option.correct)
  var awardedOptions = new WeakSet();
  var quizXPObserver = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      var el = m.target;
      if(el.nodeType === 1 && el.classList && el.classList.contains('quiz-option') &&
         el.classList.contains('correct') && !awardedOptions.has(el)){
        awardedOptions.add(el);
        awardXP(XP_QUIZ_CORRECT);
      }
    });
  });
  quizXPObserver.observe(document.body, {attributes:true, attributeFilter:['class'], subtree:true});

  // ---------- 3) محرّك السحب والإفلات العام ----------
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
        awardXP(XP_SLOT_CORRECT);
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
