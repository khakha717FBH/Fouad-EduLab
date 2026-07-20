/* =========================================================
   مختبر فؤاد التعليمي — زر فهيم العائم
   shared/faheem-widget/faheem.js

   وحدة مكتفية ذاتيًا بالكامل: تحقن نمطها (CSS) وزرها (HTML)
   بنفسها عند تحميلها. لا حاجة لأي HTML أو CSS إضافي بالدرس.

   التفعيل بسطر واحد فقط، قبل </body> مباشرة:

     <script src="[مسار نسبي]/shared/faheem-widget/faheem.js"></script>

   أمثلة المسار النسبي حسب عمق الملف:
     من semester-1/unit-01/lesson-XX.html  → ../../shared/faheem-widget/faheem.js
     من semester-1/index.html               → ../shared/faheem-widget/faheem.js
     من index.html (الجذر)                  → shared/faheem-widget/faheem.js
   ========================================================= */
(function(){
  // منع الحقن المزدوج لو انضاف السكربت بالغلط أكثر من مرة
  if(document.querySelector('.faheem-fab')) return;

  var FAHEEM_URL = 'https://gemini.google.com/gem/52a8cb37e0eb?usp=sharing';

  var style = document.createElement('style');
  style.textContent = [
    '.faheem-fab{',
    '  position:fixed;',
    '  bottom:max(18px, calc(env(safe-area-inset-bottom) + 12px));',
    '  left:16px;',
    '  z-index:60;',
    '  display:flex;',
    '  align-items:center;',
    '  gap:8px;',
    '  background:#131c30;',
    '  border:1px solid #14C8A8;',
    '  border-radius:999px;',
    '  padding:12px;',
    '  text-decoration:none;',
    '  color:#14C8A8;',
    '  box-shadow:0 0 14px rgba(20,200,168,.35);',
    '  transition:.25s;',
    '  font-family:"Tajawal",sans-serif;',
    '  animation:faheemPulse 3s ease-in-out infinite;',
    '}',
    '.faheem-fab:hover, .faheem-fab:focus{',
    '  background:#14C8A8;',
    '  color:#131c30;',
    '  box-shadow:0 0 22px rgba(20,200,168,.35);',
    '  animation:none;',
    '}',
    '.faheem-fab .fab-icon{',
    '  width:24px;height:24px;',
    '  display:flex;align-items:center;justify-content:center;',
    '  font-size:16px;',
    '  flex:0 0 auto;',
    '}',
    '.faheem-fab .fab-label{',
    '  font-weight:700;',
    '  font-size:13px;',
    '  max-width:0;',
    '  overflow:hidden;',
    '  white-space:nowrap;',
    '  transition:max-width .3s ease, padding .3s ease;',
    '}',
    '.faheem-fab:hover .fab-label, .faheem-fab:focus .fab-label{',
    '  max-width:140px;',
    '  padding-left:2px;',
    '}',
    '@keyframes faheemPulse{',
    '  0%,100%{box-shadow:0 0 14px rgba(20,200,168,.35);}',
    '  50%{box-shadow:0 0 24px rgba(20,200,168,.35);}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var link = document.createElement('a');
  link.className = 'faheem-fab';
  link.href = FAHEEM_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', 'تحدث مع فهيم');
  link.innerHTML = '<span class="fab-icon">🤖</span><span class="fab-label">تحدث مع فهيم</span>';

  document.body.appendChild(link);
})();
