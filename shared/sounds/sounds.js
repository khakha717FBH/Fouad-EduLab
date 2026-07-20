/* =========================================================
   مختبر فؤاد التعليمي — مكتبة الأصوات
   shared/sounds/sounds.js

   وحدة مكتفية ذاتيًا: نظام صوتي خفيف عبر Web Audio API،
   بلا أي ملفات صوتية خارجية. تُفعّل بسطر واحد قبل </body>:

     <script src="[مسار نسبي]/shared/sounds/sounds.js"></script>

   أمثلة المسار النسبي حسب عمق الملف:
     من semester-1/unit-01/lesson-XX.html  → ../../shared/sounds/sounds.js
     من semester-1/index.html               → ../shared/sounds/sounds.js
     من index.html (الجذر)                  → shared/sounds/sounds.js

   بعد التحميل، تصير الدوال متاحة عالميًا عبر window.Sounds:

     Sounds.playTick()   — نقرة خفيفة (تحويم/تفاعل عام)
     Sounds.playSnap()   — إجابة صحيحة / إفلات ناجح
     Sounds.playWrong()  — إجابة خاطئة
     Sounds.playChime()  — إنجاز محطة / إتمام

   نادِ playSnap/playWrong/playChime يدويًا بكود الدرس باللحظة
   المناسبة، مثال:
     if(correct){ Sounds.playSnap(); } else { Sounds.playWrong(); }

   ميزة إضافية بلا أي إعداد: نقرة تحويم تلقائية على كل عنصر
   موجود بالصفحة وقت تحميل هذا السكربت يحمل أحد الأصناف:
   .btn .quiz-option .chip — نفس السلوك الأصلي بالدرس الأول.
   ========================================================= */
(function(){
  if(window.Sounds) return; // منع التهيئة المزدوجة لو تكرر السكربت

  var audioCtx = null;
  function ensureAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioCtx.state === 'suspended') audioCtx.resume();
  }
  // المتصفحات تمنع تشغيل الصوت قبل أول تفاعل من المستخدم —
  // نجهّز الـAudioContext عند أول لمسة/نقرة بالصفحة
  document.addEventListener('pointerdown', ensureAudio, {once:true});

  function tone(freq, duration, type, vol, delay){
    if(!audioCtx) return;
    var t0 = audioCtx.currentTime + (delay || 0);
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol || 0.05, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playTick(){ tone(880, 0.045, 'sine', 0.025); }
  function playSnap(){ tone(520, 0.05, 'triangle', 0.06); tone(1040, 0.08, 'triangle', 0.05, 0.05); }
  function playWrong(){ tone(180, 0.15, 'sawtooth', 0.035); }
  function playChime(){ [660,880,1100].forEach(function(f,i){ tone(f, 0.25, 'sine', 0.035, i*0.08); }); }

  window.Sounds = {
    playTick: playTick,
    playSnap: playSnap,
    playWrong: playWrong,
    playChime: playChime
  };

  // نقرة خفيفة تلقائية عند التحويم على العناصر التفاعلية الشائعة —
  // تعمل بلا أي كود إضافي بالدرس. لازم هذا السكربت يُحمَّل بعد
  // ظهور هذه العناصر بالصفحة (أي قبل </body> مباشرة، مثل باقي
  // وحدات shared)
  document.querySelectorAll('.btn, .quiz-option, .chip').forEach(function(el){
    el.addEventListener('pointerenter', function(){ playTick(); });
  });
})();
