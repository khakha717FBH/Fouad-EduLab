/* ============================================================================
   Fouad EduLab — نظام الشهادة المشتركة (shared/certificate-system/certificate.js)
   ============================================================================
   طريقة الاستخدام في أي ملف تقييم/درس:

   1) أضف سطرًا واحدًا قبل إغلاق </body> (المسار نسبي حسب عمق الدرس):
        <script src="../../../shared/certificate-system/certificate.js"></script>

   2) (اختياري) ضع عنصرًا فارغًا في المكان اللي تبي يظهر فيه زر
      "عرض الشهادة" — عادة مباشرة بعد آخر سؤال بالتقييم:
        <div id="certTriggerSlot"></div>
      إذا ما وضعته، يظهر الزر تلقائيًا كزر عائم ثابت أسفل يمين الشاشة.

   3) عند انتهاء تصحيح الاختبار، نادِ فقط:
        Certificate.finish(اسم_الطالب, عنوان_الدرس, العلامة_المئوية);

   كل شيء آخر (الأنماط، بنية الشهادة، النافذة، الصوت، الطباعة،
   تحميل PDF) يُبنى ويُحقن تلقائيًا — لا حاجة لنسخ أي HTML أو CSS يدويًا.
   ============================================================================ */
(function () {
  'use strict';

  if (window.Certificate) return; // منع الحقن المزدوج لو تم تضمين الملف مرتين

  /* ---------------------------------------------------------------------
     الأنماط الكاملة — معزولة ومكتفية ذاتيًا (تحتوي متغيرات :root الخاصة
     بها) كي تعمل بشكل صحيح حتى داخل نافذة الطباعة المستقلة المعزولة
     تمامًا عن صفحة الدرس الأصلية
     --------------------------------------------------------------------- */
  var CERT_CSS = [
    ':root{',
    '  --navy-dark:#1B2640;',
    '  --navy-darker:#131c30;',
    '  --navy-deepest:#0b1120;',
    '  --turquoise:#14C8A8;',
    '  --turquoise-soft:rgba(20,200,168,.35);',
    '  --turquoise-faint:rgba(20,200,168,.08);',
    '  --coral:#ff6b4a;',
    '  --ink:#eef2f7;',
    '  --ink-dim:#9fb0c9;',
    '}',
    '*{box-sizing:border-box;}',

    /* زر "حبة الدواء" — مضمّن هنا كي تبقى وحدة الشهادة مستقلة بذاتها
       ولا تعتمد على ملف هوية بصرية منفصل لم يُبنَ بعد */
    '.pill-btn{display:inline-flex;align-items:center;gap:8px;background:var(--navy-darker);border:1.5px solid var(--turquoise);color:var(--turquoise);font-family:"Tajawal",sans-serif;font-weight:700;font-size:.88rem;padding:11px 22px;border-radius:999px;cursor:pointer;transition:background .25s ease,color .25s ease,box-shadow .25s ease;}',
    '.pill-btn:hover:not(:disabled){background:var(--turquoise);color:var(--navy-darker);box-shadow:0 0 16px rgba(20,200,168,.45);}',
    '.pill-btn:active{transform:scale(.97);}',
    '.pill-btn:focus-visible{outline:2px solid var(--coral);outline-offset:3px;}',

    /* زر تحفيز الشهادة — يظهر تلقائيًا داخل certTriggerSlot إن وُجد،
       وإلا كزر عائم ثابت */
    '#certIconBtn{display:none;}',
    '#certIconBtn.show{display:inline-flex;}',
    '#certIconBtn.cert-floating--fixed{position:fixed;inset-inline-end:20px;bottom:20px;z-index:500;box-shadow:0 4px 18px rgba(0,0,0,.35);animation:certPulse 2.4s ease-in-out infinite;}',
    '@keyframes certPulse{0%,100%{box-shadow:0 0 0 0 rgba(20,200,168,.35),0 4px 18px rgba(0,0,0,.35);}50%{box-shadow:0 0 0 10px rgba(20,200,168,0),0 4px 18px rgba(0,0,0,.35);}}',

    /* نافذة المعاينة (Modal) */
    '.modal-overlay{position:fixed;inset:0;background:rgba(8,12,22,.85);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:999;padding:20px;}',
    '.modal-overlay.open{display:flex;}',
    '.modal-box{background:var(--navy-dark);border:1px solid rgba(20,200,168,.3);border-radius:20px;padding:22px;max-width:960px;width:100%;max-height:92vh;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:18px;opacity:0;transform:scale(.97);transition:opacity .28s ease,transform .28s ease;}',
    '.modal-overlay.open .modal-box{opacity:1;transform:scale(1);}',
    '@media (prefers-reduced-motion:reduce){.modal-box{transition:none;}}',
    '.modal-actions{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}',

    /* الشهادة نفسها — نسبة A4 أفقي دقيقة (297:210) */
    '#certificateWrapper{width:100%;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;justify-content:center;}',
    '#certificate{position:relative;width:100%;min-width:820px;max-width:1000px;aspect-ratio:297/210;background:linear-gradient(155deg,var(--navy-dark) 0%,var(--navy-darker) 62%,var(--navy-deepest) 100%);font-family:"Cairo",sans-serif;direction:rtl;overflow:hidden;flex-shrink:0;}',
    '.cert-glow{position:absolute;inset:0;width:100%;height:100%;background:radial-gradient(ellipse at top left, rgba(20,200,168,.18), transparent 60%);pointer-events:none;}',
    '.cert-frame{position:absolute;inset:2.6%;border:1px solid var(--turquoise-soft);border-radius:6px;box-shadow:0 0 0 7px var(--turquoise-faint);pointer-events:none;}',
    '.cert-corner{position:absolute;width:3.2%;aspect-ratio:1;border:2px solid var(--turquoise);pointer-events:none;}',
    '.cert-corner.corner-tr{top:2.1%;right:2.1%;border-left:none;border-bottom:none;}',
    '.cert-corner.corner-tl{top:2.1%;left:2.1%;border-right:none;border-bottom:none;}',
    '.cert-corner.corner-br{bottom:2.1%;right:2.1%;border-left:none;border-top:none;}',
    '.cert-corner.corner-bl{bottom:2.1%;left:2.1%;border-right:none;border-top:none;}',
    '.cert-watermark{position:absolute;left:-6%;bottom:-10%;width:46%;aspect-ratio:1;opacity:.10;pointer-events:none;}',
    '.cert-safezone{position:relative;z-index:1;height:100%;width:100%;padding:5.6% 5%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;}',
    '.cert-eyebrow{display:flex;align-items:center;gap:.5em;color:var(--turquoise);font-weight:700;white-space:nowrap;}',
    '.cert-eyebrow svg{flex-shrink:0;width:1.15em;height:1.15em;}',
    '.cert-title{font-weight:800;color:var(--ink);}',
    '.cert-body{display:flex;flex-direction:column;align-items:center;gap:.55em;width:100%;}',
    '.cert-intro{color:var(--ink-dim);font-weight:600;}',
    '#outName{font-weight:800;color:#ffffff;line-height:1.22;max-width:82%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word;}',
    '.cert-name-rule{width:min(46%,340px);height:2px;background:linear-gradient(90deg,transparent,var(--turquoise),transparent);border-radius:2px;}',
    '.cert-lesson-label{color:var(--ink-dim);font-weight:600;}',
    '#outLesson{font-weight:700;color:var(--ink);line-height:1.25;max-width:78%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word;}',
    '.cert-stats-row{display:flex;gap:4%;justify-content:center;align-items:stretch;width:100%;}',
    '.cert-pill{display:flex;flex-direction:column;align-items:center;gap:.3em;background:rgba(255,255,255,.03);border:1px solid var(--turquoise-soft);border-radius:999px;padding:.55em 1.4em;min-width:26%;}',
    '.cert-pill-label{color:var(--ink-dim);font-weight:600;white-space:nowrap;}',
    '.cert-pill-value{color:var(--ink);font-weight:800;white-space:nowrap;overflow:hidden;max-width:100%;}',
    '.cert-footer-row{display:flex;align-items:center;justify-content:space-between;width:100%;}',
    '.cert-footer-date{display:flex;flex-direction:column;align-items:flex-start;gap:.15em;max-width:46%;overflow:hidden;}',
    '.cert-footer-date-label{color:var(--ink-dim);font-weight:600;white-space:nowrap;}',
    '#outDate{font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;}',
    '.cert-seal{display:flex;align-items:center;gap:.6em;max-width:46%;overflow:hidden;}',
    '.cert-seal-word{display:flex;flex-direction:column;align-items:flex-end;line-height:1.2;}',
    '.cert-seal-word b{color:var(--turquoise);font-weight:800;font-size:1.15em;white-space:nowrap;}',
    '.cert-seal-word span{color:var(--ink-dim);font-weight:600;font-size:.85em;white-space:nowrap;}',
    '#certSealSvg{width:2.1em;height:2.1em;flex-shrink:0;}',
    '.badge-مشارك{color:#9aa7bb;}',
    '.badge-متمكن{color:#2fd6b8;}',
    '.badge-متميز{color:var(--coral);}'
  ].join('\n');

  /* ---------------------------------------------------------------------
     بنية الشهادة (HTML) — تُحقن مرة واحدة في نهاية <body>
     --------------------------------------------------------------------- */
  var TRIGGER_BTN_HTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<circle cx="12" cy="8" r="6"></circle><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"></path></svg> عرض الشهادة';

  var CERT_MODAL_HTML =
    '<div class="modal-overlay" id="certModal">' +
    '  <div class="modal-box">' +
    '    <div id="certificateWrapper">' +
    '      <div id="certificate">' +
    '        <div class="cert-glow"></div>' +
    '        <div class="cert-frame"></div>' +
    '        <span class="cert-corner corner-tr"></span>' +
    '        <span class="cert-corner corner-tl"></span>' +
    '        <span class="cert-corner corner-br"></span>' +
    '        <span class="cert-corner corner-bl"></span>' +
    '        <svg class="cert-watermark" viewBox="0 0 200 200" fill="none" stroke="#14C8A8">' +
    '          <circle cx="100" cy="100" r="70" stroke-width="1.5"/>' +
    '          <ellipse cx="100" cy="100" rx="90" ry="34" stroke-width="1.5" transform="rotate(20 100 100)"/>' +
    '          <ellipse cx="100" cy="100" rx="90" ry="34" stroke-width="1.5" transform="rotate(-20 100 100)"/>' +
    '          <ellipse cx="100" cy="100" rx="90" ry="34" stroke-width="1.5" transform="rotate(90 100 100)"/>' +
    '          <circle cx="100" cy="100" r="6" fill="#14C8A8" stroke="none"/>' +
    '        </svg>' +
    '        <div class="cert-safezone">' +
    '          <div class="cert-eyebrow" id="certEyebrow">' +
    '            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/></svg>' +
    '            <span>مختبر فؤاد التعليمي</span>' +
    '          </div>' +
    '          <div class="cert-title" id="certTitle">شهادة إنجاز</div>' +
    '          <div class="cert-body">' +
    '            <div class="cert-intro" id="certIntro">تُمنح هذه الشهادة إلى</div>' +
    '            <div id="outName">—</div>' +
    '            <div class="cert-name-rule"></div>' +
    '            <div class="cert-lesson-label" id="certLessonLabel">عن إنجاز درس</div>' +
    '            <div id="outLesson">—</div>' +
    '          </div>' +
    '          <div class="cert-stats-row">' +
    '            <div class="cert-pill"><span class="cert-pill-label">المستوى</span><span class="cert-pill-value" id="outBadge">—</span></div>' +
    '            <div class="cert-pill"><span class="cert-pill-label">العلامة</span><span class="cert-pill-value" id="outScore">—</span></div>' +
    '          </div>' +
    '          <div class="cert-footer-row">' +
    '            <div class="cert-footer-date"><span class="cert-footer-date-label">تاريخ الإصدار</span><span id="outDate">—</span></div>' +
    '            <div class="cert-seal" id="certSeal">' +
    '              <div class="cert-seal-word"><b>مختبر فؤاد</b><span>التعليمي</span></div>' +
    '              <svg id="certSealSvg" viewBox="0 0 52 52" fill="none">' +
    '                <circle cx="26" cy="26" r="23" stroke="#14C8A8" stroke-width="1.6"/>' +
    '                <circle cx="26" cy="26" r="17" stroke="#14C8A8" stroke-width="1" stroke-dasharray="2 3"/>' +
    '                <path d="M17 27.5 L23 33 L35 19" stroke="#14C8A8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '              </svg>' +
    '            </div>' +
    '          </div>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '    <div class="modal-actions">' +
    '      <button class="pill-btn" id="certPrintBtn">🖨️ طباعة</button>' +
    '      <button class="pill-btn" id="certPdfBtn">⬇️ تحميل PDF</button>' +
    '      <button class="pill-btn" id="certCloseBtn">إغلاق</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  /* ---------------------------------------------------------------------
     الحالة والثوابت
     --------------------------------------------------------------------- */
  var CERT_RATIO = 297 / 210;
  var FIELD_FONT_RATIOS = {
    certEyebrow: 0.0155, certTitle: 0.048, certIntro: 0.0165,
    outName: 0.050, certLessonLabel: 0.0155, outLesson: 0.030,
    outBadge: 0.026, outScore: 0.026, outDate: 0.0165, certSeal: 0.016
  };
  var WRAP_MAX_LINES = { outName: 2, outLesson: 2 };

  var quizResult = null;
  var injected = false;

  /* ---------------------------------------------------------------------
     الحقن التلقائي (مرة واحدة فقط)
     --------------------------------------------------------------------- */
  function injectOnce() {
    if (injected) return;
    injected = true;

    var styleEl = document.createElement('style');
    styleEl.id = 'certStylesBlock';
    styleEl.textContent = CERT_CSS;
    document.head.appendChild(styleEl);

    var holder = document.createElement('div');
    holder.innerHTML = CERT_MODAL_HTML;
    document.body.appendChild(holder.firstElementChild);

    document.getElementById('certPrintBtn').addEventListener('click', printCertificate);
    document.getElementById('certPdfBtn').addEventListener('click', downloadCertificatePDF);
    document.getElementById('certCloseBtn').addEventListener('click', closeCertModal);

    window.addEventListener('resize', applyCertSize);
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () { applyCertSize(); });
      var wrapper = document.getElementById('certificateWrapper');
      if (wrapper) ro.observe(wrapper);
    }
  }

  function ensureTriggerButton() {
    var btn = document.getElementById('certIconBtn');
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = 'certIconBtn';
    btn.className = 'pill-btn';
    btn.innerHTML = TRIGGER_BTN_HTML;
    btn.addEventListener('click', openCertModal);

    var slot = document.getElementById('certTriggerSlot');
    if (slot) {
      slot.appendChild(btn);
    } else {
      btn.classList.add('cert-floating--fixed');
      document.body.appendChild(btn);
    }
    return btn;
  }

  /* ---------------------------------------------------------------------
     منطق القياس والتحجيم
     --------------------------------------------------------------------- */
  function applyFieldFonts(width) {
    Object.keys(FIELD_FONT_RATIOS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var size = width * FIELD_FONT_RATIOS[id];
      el.style.fontSize = size + 'px';
      el.dataset.baseFontSize = size;
    });
  }

  function applyCertSize() {
    var certEl = document.getElementById('certificate');
    if (!certEl) return;
    var width = certEl.getBoundingClientRect().width;
    if (!width) return;
    certEl.style.height = (width / CERT_RATIO) + 'px';
    applyFieldFonts(width);
  }

  function fitFieldText(el) {
    if (!el) return;
    var base = parseFloat(el.dataset.baseFontSize || getComputedStyle(el).fontSize);
    var maxLines = WRAP_MAX_LINES[el.id] || 1;
    var minSize = Math.max(base * 0.45, 10);
    var size = base;
    el.style.fontSize = size + 'px';
    if (maxLines > 1) {
      el.style.maxHeight = (base * 1.24 * maxLines + 2) + 'px';
    }
    var guard = 0;
    while (size > minSize && guard < 80) {
      var overW = el.scrollWidth > el.clientWidth + 1;
      var overH = maxLines > 1 && el.scrollHeight > el.clientHeight + 1;
      if (!overW && !overH) break;
      size -= Math.max(0.5, size * 0.025);
      el.style.fontSize = size + 'px';
      guard++;
    }
  }

  /* ---------------------------------------------------------------------
     صوت تثبيت خفيف (بلا ملفات خارجية)
     --------------------------------------------------------------------- */
  function playChime() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(520, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch (e) { /* المتصفح قد لا يدعم الصوت التلقائي قبل تفاعل المستخدم */ }
  }

  function getBadge(score) {
    if (score >= 80) return 'متميز';
    if (score >= 65) return 'متمكن';
    return 'مشارك';
  }

  function formatDateArabic() {
    var d = new Date();
    var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------------------------------------------------------------------
     تعبئة وفتح/إغلاق النافذة
     --------------------------------------------------------------------- */
  function fillCertificate() {
    var name = quizResult.name, lessonTitle = quizResult.lessonTitle, score = quizResult.score;
    var badge = getBadge(score);

    document.getElementById('outName').textContent = name;
    document.getElementById('outLesson').textContent = lessonTitle;
    document.getElementById('outScore').textContent = score + '%';
    document.getElementById('outDate').textContent = formatDateArabic();

    var badgeEl = document.getElementById('outBadge');
    badgeEl.textContent = badge;
    badgeEl.className = 'cert-pill-value badge-' + badge;

    applyCertSize();
    requestAnimationFrame(function () {
      ['outName', 'outLesson', 'outScore', 'outBadge', 'outDate'].forEach(function (id) {
        fitFieldText(document.getElementById(id));
      });
    });
  }

  function openCertModal() {
    if (!quizResult) return;
    document.getElementById('certModal').classList.add('open');
    applyCertSize();
    fillCertificate();
    playChime();
  }

  function closeCertModal() {
    var modal = document.getElementById('certModal');
    if (modal) modal.classList.remove('open');
  }

  /* ---------------------------------------------------------------------
     الطباعة (نافذة مستقلة بأبعاد A4 أفقي دقيقة)
     --------------------------------------------------------------------- */
  function buildStandaloneCertHTML() {
    var certEl = document.getElementById('certificate');
    var clone = certEl.cloneNode(true);
    clone.removeAttribute('style');
    clone.setAttribute('id', 'certificate');

    return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>' +
      '@page{size:A4 landscape;margin:0;} *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      'html,body{width:100%;height:100%;background:#131c30;} body{display:flex;align-items:center;justify-content:center;}' +
      CERT_CSS +
      'html,body{overflow:auto;} #certificate{width:297mm;min-width:0;max-width:none;margin:0 auto;}' +
      '</style></head><body>' + clone.outerHTML +
      '<script>' +
      'var CERT_RATIO=' + CERT_RATIO + ';' +
      'var FIELD_FONT_RATIOS=' + JSON.stringify(FIELD_FONT_RATIOS) + ';' +
      'var WRAP_MAX_LINES=' + JSON.stringify(WRAP_MAX_LINES) + ';' +
      'function applyFieldFonts(w){Object.keys(FIELD_FONT_RATIOS).forEach(function(id){var el=document.getElementById(id);if(!el)return;var s=w*FIELD_FONT_RATIOS[id];el.style.fontSize=s+"px";el.dataset.baseFontSize=s;});}' +
      'function fitFieldText(el){if(!el)return;var base=parseFloat(el.dataset.baseFontSize||getComputedStyle(el).fontSize);var maxLines=WRAP_MAX_LINES[el.id]||1;var minSize=Math.max(base*0.45,10);var size=base;el.style.fontSize=size+"px";if(maxLines>1){el.style.maxHeight=(base*1.24*maxLines+2)+"px";}var guard=0;while(size>minSize&&guard<80){var overW=el.scrollWidth>el.clientWidth+1;var overH=maxLines>1&&el.scrollHeight>el.clientHeight+1;if(!overW&&!overH)break;size-=Math.max(0.5,size*0.025);el.style.fontSize=size+"px";guard++;}}' +
      'function layout(){var el=document.getElementById("certificate");var w=el.getBoundingClientRect().width;el.style.height=(w/CERT_RATIO)+"px";applyFieldFonts(w);requestAnimationFrame(function(){Object.keys(FIELD_FONT_RATIOS).forEach(function(id){fitFieldText(document.getElementById(id));});setTimeout(function(){window.print();},150);});}' +
      'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(layout).catch(layout);}else{layout();}' +
      'window.onafterprint=function(){window.close();};' +
      '<\/script></body></html>';
  }

  function printCertificate() {
    if (!quizResult) return;
    var printWin = window.open('', '_blank', 'width=1180,height=860');
    if (!printWin) {
      alert('تعذّر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
      return;
    }
    printWin.document.write(buildStandaloneCertHTML());
    printWin.document.close();
  }

  /* ---------------------------------------------------------------------
     تحميل PDF (html2canvas + jsPDF) — تُحمَّل المكتبتان تلقائيًا عند
     الحاجة فقط، فلا داعي لإضافتهما يدويًا في كل ملف درس
     --------------------------------------------------------------------- */
  var LIB_URLS = {
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  };

  function loadScriptOnce(url) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-cert-lib="' + url + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = url;
      s.dataset.certLib = url;
      s.onload = function () { s.dataset.loaded = 'true'; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensurePdfLibs() {
    var need = [];
    if (typeof window.html2canvas === 'undefined') need.push(loadScriptOnce(LIB_URLS.html2canvas));
    if (typeof window.jspdf === 'undefined') need.push(loadScriptOnce(LIB_URLS.jspdf));
    return Promise.all(need);
  }

  async function downloadCertificatePDF() {
    try {
      await ensurePdfLibs();
    } catch (e) {
      alert('تعذّر تحميل مكتبات إنشاء PDF. تحقق من الاتصال بالإنترنت وحاول مجددًا.');
      return;
    }

    var el = document.getElementById('certificate');

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) { /* تجاهل إن تعذّر */ }
    }

    applyCertSize();
    ['outName', 'outLesson', 'outBadge', 'outScore', 'outDate'].forEach(function (id) {
      fitFieldText(document.getElementById(id));
    });

    var renderedWidth = el.getBoundingClientRect().width;
    var renderedHeight = el.getBoundingClientRect().height;

    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    var maxDim = isMobile ? 2200 : 3508;
    var scale = maxDim / renderedWidth;
    scale = Math.min(scale, isMobile ? 2.6 : 4);
    scale = Math.max(scale, 1.5);

    var canvas = await window.html2canvas(el, {
      scale: scale,
      backgroundColor: '#131c30',
      useCORS: true,
      imageTimeout: 15000,
      width: renderedWidth,
      height: renderedHeight
    });
    var imgData = canvas.toDataURL('image/png');

    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    var pageW = pdf.internal.pageSize.getWidth();
    var pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
    pdf.save('شهادة_' + quizResult.name + '.pdf');
  }

  /* ---------------------------------------------------------------------
     الواجهة العامة
     --------------------------------------------------------------------- */
  function finish(studentName, lessonTitle, scorePercent) {
    injectOnce();
    quizResult = { name: studentName, lessonTitle: lessonTitle, score: Math.round(scorePercent) };
    var btn = ensureTriggerButton();
    btn.classList.add('show');
    return btn;
  }

  window.Certificate = {
    finish: finish,
    open: function () { openCertModal(); },
    close: function () { closeCertModal(); }
  };
})();
