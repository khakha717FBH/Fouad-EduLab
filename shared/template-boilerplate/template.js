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
        التقدّم المقابلة + نغمة إنجاز مرة واحدة لكل محطة
     2) تظليل الخيار المُختار داخل كل مجموعة أسئلة (مستقل بين
        المجموعات لو الدرس فيه أكثر من سؤال)
     3) محرّك سحب وإفلات عام (Pointer Events) لأي .chip داخل
        أي .chips-pool، يُطابق ضد أي .slot بنفس data-answer

   منطق التحقق من صحة الإجابة (أي سؤال هو الصحيح) يبقى دائمًا
   بكود الدرس نفسه — هذا الملف لا يعرف شيئًا عن محتوى المادة.

   يُحمَّل بعد shared/sounds/sounds.js (لتفعيل الصوت، اختياري)
   وقبل </body> مباشرة:

     <script src="[مسار نسبي]/shared/sounds/sounds.js"></script>
     <script src="[مسار نسبي]/shared/faheem-widget/faheem.js"></script>
     <script src="[مسار نسبي]/shared/template-boilerplate/template.js"></script>
   ========================================================= */
(function(){

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
        }
      }
    });
  }, {threshold:.32});
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
