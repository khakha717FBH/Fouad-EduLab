/* =========================================================
   مختبر فؤاد التعليمي — تذييل الموقع المشترك
   shared/identity/footer.js

   الاستخدام: وسم <script> عادي قبل </body> مباشرة في أي صفحة
   (درس، صفحة محور، الصفحة الرئيسية):

     <script src="[مسار نسبي حسب عمق الملف]/shared/identity/footer.js"></script>

   أمثلة المسار النسبي:
     من semester-1/unit-01/lesson-XX.html  → ../../shared/identity/footer.js
     من semester-1/index.html               → ../shared/identity/footer.js
     من index.html (الجذر)                  → shared/identity/footer.js

   لا يحتاج أي استدعاء API — يعمل تلقائيًا فور تحميل السكربت.
   يبحث عن عنصر بمعرّف siteFooterSlot ليضع التذييل بداخله؛
   إن لم يجده، يُلحقه تلقائيًا في نهاية <body> كخيار احتياطي.

   تعديل نص التذييل مستقبلًا (مثلًا تغيير سنة الحقوق) يتم هنا
   فقط، وينعكس تلقائيًا على كل صفحة تستدعي هذا الملف — لا حاجة
   لتعديل أي ملف درس يدويًا.
   ========================================================= */
(function(){
  var FOOTER_TEXT = 'مختبر فؤاد التعليمي © Fouad EduLab 2026 · منصة تعليم العلوم – دولة قطر';

  function injectStyles(){
    if(document.getElementById('siteFooterStyles')) return;
    var style = document.createElement('style');
    style.id = 'siteFooterStyles';
    style.textContent =
      '.site-footer-credit{' +
        'text-align:center;' +
        'margin-top:16px;' +
        'padding:0 16px 20px;' +
        'color:var(--ink-dim,#9fb0c9);' +
        'font-size:.75rem;' +
        'font-family:"Tajawal",sans-serif;' +
      '}';
    document.head.appendChild(style);
  }

  function renderFooter(){
    injectStyles();

    var p = document.createElement('p');
    p.className = 'site-footer-credit';
    p.textContent = FOOTER_TEXT;

    var slot = document.getElementById('siteFooterSlot');
    if(slot){
      slot.appendChild(p);
    } else {
      document.body.appendChild(p);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', renderFooter);
  } else {
    renderFooter();
  }
})();
