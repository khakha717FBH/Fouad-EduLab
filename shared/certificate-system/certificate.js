/* ============================================================================
   Fouad EduLab — نظام الشهادة المشتركة (shared/certificate-system/certificate.js)
   ============================================================================
   طريقة الاستخدام في أي ملف تقييم/درس:

   1) أضف سطرًا واحدًا قبل إغلاق </body> (المسار نسبي حسب عمق الدرس):
     <script src="../../shared/certificate-system/certificate.js"></script>
     
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
    '.cert-glow{position:absolute;inset:0;width:100%;height:100%;background-image:url("data:image/png;base64,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/8re74Q1AAAAACf7ywgAAAAASBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAIAogRQAAAAAUQIpAAAAAKIEUgAAAABECaQAAAAAiBJIAQAAABAlkAIAAAAgSiAFAAAAQJRACgAAAICofwNTmh06oqnRgAAAAABJRU5ErkJggg==");background-size:100% 100%;background-repeat:no-repeat;pointer-events:none;}',
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
