/* =========================================================
   مختبر فؤاد التعليمي — محرّك نقاط الخبرة الموحّد
   shared/xp-system/xp.js

   وحدة مكتفية ذاتيًا: تحقن نمطها بنفسها، وتتبنّى عدّاد XP
   الموجود بالدرس إن وُجد، أو تبني عدّادها الخاص إن غاب.

   التفعيل بسطر واحد، قبل </body> وقبل سكربتات الدرس التي
   ستستدعي XP:

     <script src="[مسار نسبي]/shared/xp-system/xp.js"></script>

   أمثلة المسار النسبي حسب عمق الملف:
     من semester-1/unit-01/lesson-XX.html  → ../../shared/xp-system/xp.js
     من semester-1/index.html               → ../shared/xp-system/xp.js

   ---------------------------------------------------------
   المبدأ الحاكم (قرار يوليو 2026)
   ---------------------------------------------------------
   النقاط تُطلَب صراحةً من كود الدرس عند حدث تربوي مُعرَّف،
   ولا تُلتقط تلقائيًا من أصناف CSS. السبب: الرصد التلقائي
   لصنف .correct كان يمنح النقاط على الحدث البصري لا الحدث
   التربوي — فأي درس يُبرز الإجابة الصحيحة كتغذية راجعة كان
   سيكافئ الطالب لأنه أخطأ.

   لا نقاط على التمرير بين المحطات إطلاقًا. لا خصم أبدًا.
   لا تراجع أبدًا.

   ---------------------------------------------------------
   الواجهة العامة
   ---------------------------------------------------------
     XP.claim(id, points, reason)
        يمنح النقاط مرّة واحدة فقط لهذا المُعرّف — إلى الأبد.
        المُعرّف محفوظ بذاكرة المتصفح، لا الرقم وحده، لذا
        إعادة تحميل الصفحة لا تسمح بتكرار الكسب.
        مثال:  XP.claim('l1-ion-3', XP.POINTS.PRODUCE, 'حدّدتَ جسيمات الأيون');

     XP.repeat(id, base, reason)
        لنشاط يُقصد تكراره: أول مرّة كاملة، ثم ×1/(n+1)
        بحدّ أدنى 20% من الأساس.

     XP.attempt(exerciseId)
        سجّل محاولة على تمرين (يُستدعى قبل التحقّق من الإجابة).

     XP.hint(exerciseId)
        مكافأة طلب التلميح — تُمنح فقط إن طُلب قبل أي محاولة.

     XP.total()   الرصيد الحالي
     XP.has(id)   هل سبق كسب هذا المُعرّف؟
     XP.reset()   تصفير الدرس الحالي (لإعادة بدء نظيفة)

   ---------------------------------------------------------
   جدول النقاط — مبني على العبء المعرفي لا على نوع الأداة
   ---------------------------------------------------------
     PREDICT  3   تنبؤ قبل الاستكشاف (على المشاركة لا الصواب)
     MCQ      5   اختيار من متعدد صحيح
     MATCH    5   مطابقة سحب وإفلات صحيحة
     BONUS    8   تحدٍّ إثرائي اختياري
     PRODUCE  8   إنتاج غير مُعان (كتابة صيغة، بناء ذرّة)
     TASK    10   إتمام نشاط مركّب متعدد الخطوات
     PATTERN 12   استنتاج نمط أو تفسير "لماذا"
     HINT     2   تلميح مطلوب قبل المحاولة الأولى

   استخدم الأسماء لا الأرقام: XP.POINTS.PRODUCE
   ========================================================= */
(function(){

  // منع الحقن المزدوج لو انضاف السكربت بالغلط أكثر من مرة
  if(window.XP && window.XP.__fouad) return;

  var POINTS = {
    PREDICT: 3,
    MCQ:     5,
    MATCH:   5,
    BONUS:   8,
    PRODUCE: 8,
    TASK:   10,
    PATTERN:12,
    HINT:    2
  };

  var STORE_KEY = 'fouadXP:v2:' + location.pathname;

  /* حالة محفوظة: نخزّن خريطة المُعرّفات المكسوبة لا الرقم النهائي.
     الرصيد يُعاد حسابه دائمًا كمجموع لها — هذا يمنع الانحراف،
     ويجعل منع التكرار عند إعادة التحميل مضمونًا بنيويًا. */
  var store = { claims:{}, repeats:{}, attempts:{}, hints:{} };

  try{
    var raw = localStorage.getItem(STORE_KEY);
    if(raw){
      var parsed = JSON.parse(raw);
      if(parsed && typeof parsed === 'object'){
        store.claims   = parsed.claims   || {};
        store.repeats  = parsed.repeats  || {};
        store.attempts = parsed.attempts || {};
        store.hints    = parsed.hints    || {};
      }
    }
  }catch(e){ /* قد يُحجب localStorage (تصفّح خاص) — نكمل بالذاكرة فقط */ }

  function persist(){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }catch(e){ /* تجاهل */ }
  }

  function computeTotal(){
    var sum = 0, k;
    for(k in store.claims){ sum += store.claims[k]; }
    for(k in store.repeats){ sum += store.repeats[k].earned; }
    for(k in store.hints){ sum += store.hints[k]; }
    return sum;
  }

  var currentTotal = computeTotal();

  /* ---------------- حقن النمط ----------------
     أسماء الأصناف هنا مخصوصة بهذه الوحدة (xp-hud / xp-gain) كي لا
     تصطدم بقواعد .xp-counter الموجودة في template.css — الوحدة
     تتبنّى العدّاد القائم كما هو إن وُجد، ولا تعيد تنسيقه. */
  var style = document.createElement('style');
  style.textContent = [
    /* عدّاد احتياطي: يُبنى فقط لو لم يجد الدرس عدّادًا جاهزًا */
    '.xp-hud{',
    '  position:fixed;',
    '  top:12px;',
    '  inset-inline-end:14px;',
    '  z-index:55;',
    '  display:inline-flex;',
    '  align-items:center;',
    '  gap:6px;',
    '  background:rgba(19,28,48,.92);',
    '  border:1px solid #14C8A8;',
    '  border-radius:999px;',
    '  padding:6px 14px;',
    '  font-family:"Tajawal",sans-serif;',
    '  font-weight:800;',
    '  font-size:13px;',
    '  color:#14C8A8;',
    '  white-space:nowrap;',
    '  transition:transform .3s ease, box-shadow .3s ease;',
    '}',
    '.xp-hud svg{width:15px;height:15px;flex-shrink:0;}',
    '.xp-hud .xp-hud-label{color:#9fb0c9;font-weight:600;font-size:11px;}',
    '.xp-hud.xp-hud-bump{transform:scale(1.12);box-shadow:0 0 14px rgba(20,200,168,.35);}',

    /* رقاقات "لماذا كسبتَ هذه النقاط" — تنبثق أسفل الشريط العلوي.
       هذه هي مصدر المعنى الوحيد للرقم بعد قرار إلغاء المقام
       والتراكم: الطالب يعرف فورًا سبب كل مكسب. */
    '.xp-gain-stack{',
    '  position:fixed;',
    '  left:50%;',
    '  transform:translateX(-50%);',
    '  z-index:520;',
    '  display:flex;',
    '  flex-direction:column;',
    '  align-items:center;',
    '  gap:6px;',
    '  pointer-events:none;',
    '  width:max-content;',
    '  max-width:min(92vw,420px);',
    '}',
    '.xp-gain{',
    '  display:flex;',
    '  align-items:center;',
    '  gap:9px;',
    '  background:rgba(19,28,48,.96);',
    '  border:1px solid #14C8A8;',
    '  border-radius:999px;',
    '  padding:7px 16px;',
    '  font-family:"Tajawal",sans-serif;',
    '  font-size:13px;',
    '  color:#eef2f7;',
    '  box-shadow:0 0 18px rgba(20,200,168,.35);',
    '  animation:xpGainIn .35s ease both;',
    '}',
    '.xp-gain.xp-gain-out{animation:xpGainOut .4s ease forwards;}',
    '.xp-gain .xp-gain-num{',
    '  color:#14C8A8;',
    '  font-weight:800;',
    '  font-size:14px;',
    '  flex-shrink:0;',
    '  direction:ltr;',
    '  unicode-bidi:isolate;',
    '}',
    '.xp-gain .xp-gain-why{color:#9fb0c9;font-weight:600;}',
    '@keyframes xpGainIn{',
    '  0%{opacity:0;transform:translateY(-10px) scale(.9);}',
    '  100%{opacity:1;transform:translateY(0) scale(1);}',
    '}',
    '@keyframes xpGainOut{',
    '  0%{opacity:1;transform:translateY(0);}',
    '  100%{opacity:0;transform:translateY(-14px);}',
    '}',
    '@media (prefers-reduced-motion:reduce){',
    '  .xp-gain,.xp-gain.xp-gain-out{animation:none;}',
    '  .xp-hud.xp-hud-bump{transform:none;}',
    '}',
    '@media (max-width:380px){',
    '  .xp-hud{padding:5px 10px;font-size:12px;}',
    '  .xp-hud .xp-hud-label{display:none;}',
    '  .xp-gain{font-size:12px;padding:6px 13px;}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var BOLT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
             ' stroke-linecap="round" stroke-linejoin="round">' +
             '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';

  var valueEl = null;   // العنصر الذي يعرض الرقم
  var counterEl = null; // الحاوية (للنبضة)
  var stackEl = null;   // حاوية رقاقات السبب

  function buildUI(){
    // 1) تبنَّ العدّاد الموجود بالدرس إن وُجد (lesson-01 / lesson-03
    //    فيهما <div class="xp-counter" id="xpCounter"> منسّق بـtemplate.css،
    //    و lesson-02 فيه <span class="xp-pill"><span id="xpValue">)
    valueEl = document.getElementById('xpValue');
    if(valueEl){
      counterEl = document.getElementById('xpCounter') ||
                  valueEl.closest('.xp-counter, .xp-pill') ||
                  valueEl.parentNode;
    } else {
      // 2) لا عدّاد بالدرس — ابنِ عدّادًا عائمًا احتياطيًا
      counterEl = document.createElement('div');
      counterEl.className = 'xp-hud';
      counterEl.innerHTML = BOLT + '<span id="xpValue">0</span>' +
                            '<span class="xp-hud-label">XP</span>';
      document.body.appendChild(counterEl);
      valueEl = counterEl.querySelector('#xpValue');
    }

    counterEl.setAttribute('aria-live', 'polite');
    counterEl.setAttribute('aria-label', 'نقاط الخبرة');

    stackEl = document.createElement('div');
    stackEl.className = 'xp-gain-stack';
    document.body.appendChild(stackEl);

    uiReady = true;
    renderTotal(currentTotal, false);

    if(pendingGains.length){
      var queued = pendingGains.slice();
      pendingGains.length = 0;
      queued.forEach(function(g, i){
        setTimeout(function(){ showGain(g.amount, g.reason); }, i * 220);
      });
      bump();
    }
  }

  /* موضع رقاقات السبب: أسفل أي شريط لاصق بأعلى الصفحة مهما كان
     ارتفاعه (‎.progress-track في القالب المشترك، ‎.top-bar في
     lesson-02)، بدل رقم ثابت قد يتداخل معه. */
  function positionStack(){
    if(!stackEl) return;
    var bar = document.querySelector('.progress-track, .top-bar');
    var top = 14;
    if(bar){
      var r = bar.getBoundingClientRect();
      if(r.bottom > 0 && r.bottom < window.innerHeight * 0.5) top = r.bottom + 10;
    }
    stackEl.style.top = top + 'px';
  }

  var animFrame = null;
  function renderTotal(target, animate){
    if(!valueEl) return;
    if(!animate){ valueEl.textContent = target; return; }
    if(animFrame) cancelAnimationFrame(animFrame);
    var from = parseInt(valueEl.textContent, 10) || 0;
    var start = null, duration = 400;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      valueEl.textContent = Math.round(from + (target - from) * p);
      if(p < 1){ animFrame = requestAnimationFrame(step); } else { animFrame = null; }
    }
    animFrame = requestAnimationFrame(step);
  }

  function showGain(amount, reason){
    if(!stackEl) return;
    positionStack();
    var chip = document.createElement('div');
    chip.className = 'xp-gain';
    var why = reason ? '<span class="xp-gain-why">' + escapeHTML(reason) + '</span>' : '';
    chip.innerHTML = '<span class="xp-gain-num">+' + amount + '</span>' + why;
    stackEl.appendChild(chip);
    setTimeout(function(){ chip.classList.add('xp-gain-out'); }, 2200);
    setTimeout(function(){ if(chip.parentNode) chip.remove(); }, 2650);
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function bump(){
    if(!counterEl) return;
    // ندعم صنف template.css الأصلي (.xp-bump) وصنف العدّاد الاحتياطي معًا
    var cls = counterEl.classList.contains('xp-hud') ? 'xp-hud-bump' : 'xp-bump';
    counterEl.classList.remove(cls);
    void counterEl.offsetWidth; // إعادة تشغيل الحركة عند تكرارها بسرعة
    counterEl.classList.add(cls);
    setTimeout(function(){ counterEl.classList.remove(cls); }, 500);
  }

  /* لو نُودي على XP قبل جهوزية الواجهة (سكربت درس يعمل أثناء تحليل
     الصفحة)، نحتفظ بالمكاسب في طابور ونعرضها فور بناء العدّاد —
     كي لا يضيع سبب المكسب، وهو مصدر معنى الرقم الوحيد هنا. */
  var uiReady = false;
  var pendingGains = [];

  function grant(amount, reason){
    currentTotal += amount;
    persist();
    if(!uiReady){ pendingGains.push({ amount:amount, reason:reason }); return; }
    renderTotal(currentTotal, true);
    showGain(amount, reason);
    bump();
  }

  /* ---------------- الواجهة العامة ---------------- */

  function claim(id, points, reason){
    if(!id){ console.warn('[XP] claim يتطلّب مُعرّفًا فريدًا'); return 0; }
    if(Object.prototype.hasOwnProperty.call(store.claims, id)) return 0; // كُسب سابقًا
    var amount = Math.max(1, Math.round(points || 0));
    store.claims[id] = amount;
    grant(amount, reason);
    return amount;
  }

  function repeat(id, base, reason){
    if(!id){ console.warn('[XP] repeat يتطلّب مُعرّفًا فريدًا'); return 0; }
    var rec = store.repeats[id] || { count:0, earned:0 };
    var mult = rec.count === 0 ? 1 : Math.max(0.2, 1 / (rec.count + 1));
    var amount = Math.max(1, Math.round((base || 0) * mult));
    rec.count++;
    rec.earned += amount;
    store.repeats[id] = rec;
    grant(amount, reason);
    return amount;
  }

  function attempt(exerciseId){
    if(!exerciseId) return;
    store.attempts[exerciseId] = (store.attempts[exerciseId] || 0) + 1;
    persist();
  }

  function hint(exerciseId, reason){
    if(!exerciseId) return 0;
    // تُمنح فقط إن طُلب التلميح قبل أي محاولة — ومرّة واحدة
    if(store.attempts[exerciseId]) return 0;
    if(Object.prototype.hasOwnProperty.call(store.hints, exerciseId)) return 0;
    store.hints[exerciseId] = POINTS.HINT;
    grant(POINTS.HINT, reason || 'طلبتَ التلميح قبل المحاولة — بداية ذكية');
    return POINTS.HINT;
  }

  function reset(){
    store = { claims:{}, repeats:{}, attempts:{}, hints:{} };
    currentTotal = 0;
    try{ localStorage.removeItem(STORE_KEY); }catch(e){ /* تجاهل */ }
    renderTotal(0, true);
  }

  window.XP = {
    __fouad: true,
    POINTS: POINTS,
    claim: claim,
    repeat: repeat,
    attempt: attempt,
    hint: hint,
    has: function(id){ return Object.prototype.hasOwnProperty.call(store.claims, id); },
    attempts: function(id){ return store.attempts[id] || 0; },
    total: function(){ return currentTotal; },
    reset: reset,

    /* جسر مؤقّت: الدروس القديمة تنادي XP.award(10) بلا مُعرّف.
       يُحذف بعد تحديث lesson-03 (الخطوة 3). المُعرّف هنا مبني على
       ترتيب الاستدعاء داخل الصفحة، فهو آمن ما دامت الاستدعاءات
       بترتيب ثابت — ولهذا هو مؤقّت لا دائم. */
    award: function(points, reason){
      window.XP.__legacySeq = (window.XP.__legacySeq || 0) + 1;
      console.warn('[XP] XP.award مهجورة — استخدم XP.claim(id, points, reason)');
      return claim('legacy-' + window.XP.__legacySeq, points, reason);
    }
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
  window.addEventListener('resize', positionStack);

})();
