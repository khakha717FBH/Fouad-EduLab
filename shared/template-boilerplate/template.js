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
        أي .chips-pool، يُطابق ضد أي .slot بنفس data-answer —
        ومعه طريق ثانٍ مكافئ: نقر الرقاقة ثم نقر الخانة (يعمل
        باللمس وبالفأرة وبلوحة المفاتيح). لا يحتاج الدرس أي إعداد
        إضافي: الطريقان يعملان على نفس الوسوم أعلاه.

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

  // ---------- 3) محرّك السحب والإفلات + النقر للاختيار ----------
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

  var chipEls = document.querySelectorAll('.chips-pool .chip');
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
    slot.textContent = chip.dataset.value;
    slot.classList.add('correct');
    slot.classList.remove('dragover');
    slot.removeAttribute('tabindex');
    if(ghostEl && ghostEl.parentNode) ghostEl.parentNode.insertBefore(chip, ghostEl);
    clearChipStyles(chip);
    chip.classList.add('placed');
    chip.setAttribute('aria-hidden', 'true');
    chip.removeAttribute('tabindex');
    collapseGhost();
    if(window.Sounds) window.Sounds.playSnap();
    // سبب المكسب قابل للتخصيص بالدرس عبر data-xp-reason على الخانة
    claimXP(slot.dataset.xpId, pts('MATCH', 5),
            slot.dataset.xpReason || 'مطابقة صحيحة');
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
    if(slot.dataset.answer === chip.dataset.value) placeChip(chip, slot);
    else shakeChip(chip);
  }

  // ----- إنهاء السحب: مسار واحد لكل النهايات -----
  function endDrag(chip, slot){
    dragEl = null;
    clearDragover();
    if(slot && slot.dataset.answer === chip.dataset.value){
      placeChip(chip, slot);
      return;
    }
    returnChipToPool(chip);
    if(slot) shakeChip(chip);
  }

  // إلغاء: تُرجع كل شيء كما كان دون حكم على صواب أو خطأ
  function cancelDrag(){
    if(!dragEl) return;
    var chip = dragEl;
    dragEl = null;
    clearDragover();
    returnChipToPool(chip);
  }

  chipEls.forEach(function(chip){
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-pressed', 'false');

    chip.addEventListener('pointerdown', function(e){
      if(dragEl) return;                 // إصبع ثانٍ أثناء سحب جارٍ
      if(e.isPrimary === false) return;
      if(chip.classList.contains('placed')) return;
      var rect = chip.getBoundingClientRect();
      dragEl = chip;
      didMove = false;
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      makeGhost(chip);
      chip.classList.add('dragging');
      chip.style.left = rect.left + 'px';
      chip.style.top = rect.top + 'px';
      chip.style.width = rect.width + 'px';
      document.body.appendChild(chip);
      try{ chip.setPointerCapture(e.pointerId); }catch(err){ /* غير مدعوم — السحب يعمل بدونه */ }
    });

    chip.addEventListener('pointermove', function(e){
      if(dragEl !== chip) return;
      didMove = true;
      chip.style.left = (e.clientX - startX) + 'px';
      chip.style.top = (e.clientY - startY) + 'px';
      clearDragover();
      var slot = slotFromPoint(e.clientX, e.clientY);
      if(slot) slot.classList.add('dragover');
    });

    chip.addEventListener('pointerup', function(e){
      if(dragEl !== chip) return;
      var slot = slotFromPoint(e.clientX, e.clientY);
      // نقرة ثابتة بلا حركة وبلا خانة تحتها = نيّة اختيار لا سحب
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
