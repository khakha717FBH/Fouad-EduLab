'use strict';
/* ==========================================================
   مولّد اللقطات البصرية لمسارح الدرس 05
   ----------------------------------------------------------
   الاختبار المنطقي يسأل «هل العنصر موجود؟» ولا يسأل «هل هو
   مفهوم؟». هذا الملف يُخرج كل مسرح في حالاته على صورة، فيُفحَص
   بالعين — وهو الفحص الذي لا بديل عنه (درسٌ مستفاد من الدرس 04).

   التشغيل:  node tests/snapshot-l5.js [مجلد الخرج]
   يُنتج ملفات SVG مستقلّة بألوان مثبَّتة (لا متغيّرات CSS) فتصلح
   لأي راسم خارجي، وصفحةَ فهرس تجمعها.

   ملاحظة: هذا الملف أداة فحص لا اختبار — لا يدخل في tests/all.js.
   ========================================================== */

const fs = require('fs');
const path = require('path');
const h = require('./harness');

const OUT = process.argv[2] || path.join(__dirname, '..', '..', 'snapshots-l5');
const LESSON = 'semester-1/unit-01/lesson-05.html';

// ألوان الهوية مثبَّتة: الراسم الخارجي لا يقرأ متغيّرات CSS
const VARS = {
  '--navy-dark': '#1B2640',
  '--navy-darker': '#131c30',
  '--navy-deepest': '#0b1120',
  '--turquoise': '#14C8A8',
  '--turquoise-soft': 'rgba(20,200,168,.35)',
  '--turquoise-faint': 'rgba(20,200,168,.08)',
  '--coral': '#ff6b4a',
  '--coral-soft': 'rgba(255,107,74,.35)',
  '--ink': '#eef2f7',
  '--ink-dim': '#9fb0c9'
};

function resolveVars(css) {
  let out = css, guard = 0;
  while (/var\(--[a-z-]+\)/.test(out) && guard++ < 6) {
    out = out.replace(/var\((--[a-z-]+)\)/g, (m, name) => VARS[name] || m);
  }
  return out;
}

// أنماط المسرح تُستخرج من كتلة <style> في الدرس نفسه، فاللقطة تعكس
// الملف الحيّ لا نسخة منه
function stageCss(raw) {
  const m = /<style>([\s\S]*?)<\/style>/.exec(raw);
  const css = m ? m[1] : '';
  return resolveVars(
    css.split('\n')
       .filter(l => !/^\s*(html|body|\.wrap|\.crumb)\b/.test(l))
       .filter(l => !/::?-webkit-|::?-moz-|:focus-visible|details-marker/.test(l))
       .join('\n')
  );
}

function wrap(svgMarkup, css, vb) {
  const [, , w, hgt] = vb.split(/\s+/).map(Number);
  const bg = `<rect x="0" y="0" width="${w}" height="${hgt}" fill="${VARS['--navy-darker']}"/>`;
  return svgMarkup.replace(/^<svg([^>]*)>/, (m, attrs) =>
    `<svg${/xmlns=/.test(attrs) ? attrs : attrs + ' xmlns="http://www.w3.org/2000/svg"'}>` +
    `<style type="text/css"><![CDATA[\n${css}\n]]></style>${bg}`);
}

async function snap(name, fn) {
  const s = await h.loadLesson(LESSON, { reduceMotion: true });
  const svg = await fn(s);
  if (!svg) { console.log('… تُخطّيت: ' + name); return null; }
  const css = stageCss(s.raw);
  const vb = svg.getAttribute('viewBox');
  const file = path.join(OUT, name + '.svg');
  fs.writeFileSync(file, wrap(svg.outerHTML, css, vb), 'utf8');
  console.log('✓ ' + name);
  return name;
}

function node(doc, sel) { return doc.querySelector(sel); }
function all(doc, sel) { return Array.from(doc.querySelectorAll(sel)); }

function clickAll(nodes) { nodes.forEach(n => h.clickNode(n)); }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const made = [];

  // ---- المحطة 1: أربع حالات ----
  made.push(await snap('s1-a-فارغ', ({ doc }) => node(doc, '#stage1')));

  made.push(await snap('s1-b-ثلاث-نقاط', ({ doc }) => {
    const hit = node(doc, '#stage1 .atom-hit');
    for (let i = 0; i < 3; i++) h.clickNode(hit);
    return node(doc, '#stage1');
  }));

  made.push(await snap('s1-c-جرّب-النقل', ({ doc }) => {
    const hit = node(doc, '#stage1 .atom-hit');
    for (let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try1');
    return node(doc, '#stage1');
  }));

  made.push(await snap('s1-d-جرّب-المشاركة', ({ doc }) => {
    const hit = node(doc, '#stage1 .atom-hit');
    for (let i = 0; i < 3; i++) h.clickNode(hit);
    h.click(doc, 's1try2');
    return node(doc, '#stage1');
  }));

  // ---- المحطة 2: ثلاث حالات ----
  made.push(await snap('s2-a-ست-ذرّات', ({ doc }) => node(doc, '#stage2')));

  made.push(await snap('s2-b-ذرّتان-محرَّرتان', ({ doc }) => {
    clickAll(all(doc, '#stage2 .epos.clickable').slice(0, 2));
    return node(doc, '#stage2');
  }));

  made.push(await snap('s2-c-البحر-كاملًا', ({ doc }) => {
    clickAll(all(doc, '#stage2 .epos.clickable'));
    return node(doc, '#stage2');
  }));

  // ---- المحطات 3–6 ----
  async function reach(s, upto){
    const { doc } = s;
    const chip = v => doc.querySelector('.chip[data-value="' + v + '"]');
    const put  = (v, sl) => { h.selectChip(chip(v)); h.clickNode(doc.getElementById(sl)); };
    if (upto >= 3) h.choose(doc, 'greySpheres', 'correct');
    if (upto >= 4) {
      put('أيونات فلزّية موجبة الشحنة', 'lim-31');
      put('إلكترونات حرّة الحركة', 'lim-31');
      put('شبكة بلّورية فلزّية ثلاثية الأبعاد', 'lim-30');
      put('التجاذب بين أيونات الفلزّ والإلكترونات الحرّة', 'lim-none');
    }
    if (upto >= 5) {
      for (let i = 0; i < 8; i++) h.click(doc, 's4aAdd');
      h.click(doc, 's4aCheck');
      h.type(doc, 'cu100Input', '200'); h.click(doc, 'cu100Btn');
      for (let i = 0; i < 9; i++) h.click(doc, 's4cAdd');
      h.click(doc, 's4cCheck');
      h.type(doc, 'al100Input', '300'); h.click(doc, 'al100Btn');
      h.choose(doc, 'ratioPattern', 'correct');
    }
    if (upto >= 6) {
      h.click(doc, 's5connect'); h.choose(doc, 'whatMoves', 'correct');
      h.click(doc, 's5warm'); h.choose(doc, 'heat', 'correct');
      h.type(doc, 'cookInput', 'الالكترونات الحره تنقل الحراره بسرعه وبدونها تنتقل ببطء اطول');
      h.click(doc, 'cookBtn');
      put('قاع القِدر على النار', 'use-heat'); put('صينية الفرن المعدنية', 'use-heat');
      put('أسلاك التمديدات في المنزل', 'use-elec'); put('الأجزاء المعدنية داخل المقبس', 'use-elec');
      h.choose(doc, 'sulfur', 'correct');
      h.choose(doc, 'naVsMg', 'correct');
    }
  }

  made.push(await snap('s3-a-الشكل-1-30', ({ doc }) => node(doc, '#fig30')));
  made.push(await snap('s3-b-الشكل-1-31', ({ doc }) => node(doc, '#fig31')));
  made.push(await snap('s3-c-التسميات', async (s) => { await reach(s, 3); return node(s.doc, '#fig31'); }));

  made.push(await snap('s4-a-نحاس-فارغ', async (s) => node(s.doc, '#stage4a')));
  made.push(await snap('s4-b-نحاس-ممتلئ', async (s) => {
    for (let i = 0; i < 8; i++) h.click(s.doc, 's4aAdd');
    h.click(s.doc, 's4aCheck');
    return node(s.doc, '#stage4a');
  }));
  made.push(await snap('s4-c-ألومنيوم', async (s) => { await reach(s, 5); return node(s.doc, '#stage4b'); }));

  made.push(await snap('s5-a-السلك', async (s) => { await reach(s, 5); return node(s.doc, '#stage5a'); }));
  made.push(await snap('s5-b-لوحا-الحرارة', async (s) => {
    await reach(s, 5);
    h.click(s.doc, 's5connect'); h.choose(s.doc, 'whatMoves', 'correct');
    return node(s.doc, '#stage5b');
  }));

  made.push(await snap('s6-a-الشبكة', async (s) => { await reach(s, 6); return node(s.doc, '#stage6'); }));
  made.push(await snap('s6-b-بعد-الانزلاق', async (s) => {
    await reach(s, 6);
    h.click(s.doc, 's6keyboard');
    return node(s.doc, '#stage6');
  }));

  const list = made.filter(Boolean);
  const index = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>لقطات مسارح الدرس 05</title>
<style>body{background:#0b1120;color:#eef2f7;font-family:sans-serif;padding:20px;}
h2{color:#14C8A8;font-size:15px;margin:26px 0 8px;}
img{width:100%;max-width:900px;display:block;border:1px solid rgba(20,200,168,.2);border-radius:14px;}</style>
</head><body><h1>لقطات مسارح الدرس 05</h1>
${list.map(n => `<h2>${n}</h2><img src="${n}.svg" alt="${n}">`).join('\n')}
</body></html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), index, 'utf8');
  console.log('\nالخرج في: ' + OUT + '  (' + list.length + ' لقطة)');
})();
