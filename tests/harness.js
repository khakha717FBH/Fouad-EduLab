'use strict';
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

// جذر المستودع: الاختبارات تعيش في tests/ بجواره
const ROOT = process.env.EDULAB_ROOT || path.resolve(__dirname, '..');
const BASE = 'http://edulab.local/';

/* الملفات المشتركة تُدمج في مكان وسومها نفسه، فيبقى ترتيب التنفيذ
   مطابقًا لترتيبه في المتصفّح تمامًا. و«</script» داخل السلاسل
   النصّية يُهرَّب كي لا يُنهي الوسم أثناء التحليل. */
function inlineShared(html, relPath) {
  const dir = path.dirname(path.join(ROOT, relPath));
  return html
    .replace(/<script\s+src="([^"]+)"\s*><\/script>/g, function (m, src) {
      if (/^https?:/.test(src)) return '';
      const code = fs.readFileSync(path.resolve(dir, src), 'utf8');
      return '<script data-shared="' + src + '">\n' +
             code.replace(/<\/script/gi, '<\\/script') + '\n</script>';
    })
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '');
}

// jsdom لا يوفّر matchMedia ولا Web Audio ولا IntersectionObserver.
// تُركَّب قبل تحليل الصفحة لأن سكربتات الدرس تستدعيها فور التحميل.
function installShims(w, reduceMotion) {
  w.matchMedia = function (q) {
    return {
      matches: reduceMotion !== false && /prefers-reduced-motion/.test(q),
      media: q, onchange: null,
      addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {}, dispatchEvent() { return false; }
    };
  };
  /* `connect` يُرجع العقدة الهدف في مواصفة Web Audio — وهو ما يتيح
     التسلسل `osc.connect(gain).connect(ctx.destination)` المستعمل في
     `sounds.js`. وبديلٌ يُرجع undefined كان يرمي عند ثاني نداء.
     ولم ينكشف طويلًا لأن `sounds.js` لا ينشئ AudioContext إلا عند أول
     `pointerdown` بالصفحة، واختباراتنا كانت تمشي على مسار لوحة المفاتيح
     وحده — فتخرج دالة النغمة مبكّرة (`if(!audioCtx) return`) ولا تلمس
     البديل أصلًا. أول اختبار يمرّ بمسار المؤشّر فتح القفل فظهر النقص. */
  const audioNode = () => ({
    connect(dest) { return dest; }, disconnect() {}, start() {}, stop() {},
    frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    type: ''
  });
  w.AudioContext = w.webkitAudioContext = function () {
    return {
      currentTime: 0, destination: {}, state: 'running', resume() { return Promise.resolve(); },
      createOscillator: audioNode, createGain: audioNode, createBuffer: audioNode,
      createBufferSource: audioNode, createBiquadFilter: audioNode
    };
  };
  w.IntersectionObserver = function () {
    this.observe = function () {};
    this.unobserve = function () {};
    this.disconnect = function () {};
    this.takeRecords = function () { return []; };
  };
  if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function () {};
  if (!w.Element.prototype.scrollIntoView) w.Element.prototype.scrollIntoView = function () {};
  w.scrollTo = function () {};
}

/* تخزين قابل للنقل بين نسختَي jsdom.
   كل نسخة jsdom لها localStorage مستقلّ، فمحاكاة «إعادة تحميل
   الصفحة» تحتاج نقل التخزين يدويًا — وإلا ظهر فشلٌ وهمي في اختبار
   «لا كسب مزدوج». والحقن يقع في beforeParse لا بعده، لأن xp.js
   يقرأ التخزين لحظة تحميله أثناء التحليل. */
function installStorage(w, store) {
  Object.defineProperty(w, 'localStorage', {
    configurable: true,
    value: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      key: i => Object.keys(store)[i] || null,
      get length() { return Object.keys(store).length; }
    }
  });
}

async function loadLesson(relPath, opts) {
  opts = opts || {};
  const vc = new VirtualConsole();
  const logs = [];
  vc.on('jsdomError', e => logs.push('jsdomError: ' + e.message));
  ['error', 'warn'].forEach(k => vc.on(k, (...a) => logs.push(k + ': ' + a.join(' '))));

  const raw = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const dom = new JSDOM(inlineShared(raw, relPath), {
    url: BASE + relPath + (opts.hash || ''),   // hash: محاكاة الدخول من الخارج بمرساة
    contentType: 'text/html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse: function (w) {
      installShims(w, opts.reduceMotion);
      if (opts.storage) installStorage(w, opts.storage);
    }
  });
  const w = dom.window;

  await new Promise(res => {
    if (w.document.readyState === 'complete') return res();
    w.addEventListener('load', res);
  });
  await tick(w, 30);
  return { dom, w, doc: w.document, logs, raw };
}

function tick(w, ms) {
  return new Promise(res => setTimeout(res, ms || 0));
}

/* المجموعة تُلتقط عبر اسم حقل الراديو (name) لا عبر سمة النطاق:
   الاسم جزء من دلالة النموذج ولا يتغيّر بترقية المحرّكات، فتبقى
   الاختبارات صالحة قبل الترقية وبعدها. */
function groupByName(doc, radioName) {
  const radio = doc.querySelector('input[name="' + radioName + '"]');
  const group = radio && radio.closest('.quiz-options');
  if (!group) throw new Error('مجموعة غير موجودة لحقل: ' + radioName);
  return group;
}

// نقر حقيقي على خيار داخل مجموعة: يضبط checked ثم يطلق change كما يفعل المتصفّح
function choose(doc, groupSel, value) {
  const group = groupSel.charAt(0) === '#' || groupSel.charAt(0) === '.'
    ? doc.querySelector(groupSel)
    : groupByName(doc, groupSel);
  if (!group) throw new Error('مجموعة غير موجودة: ' + groupSel);
  const radio = group.querySelector('input[value="' + value + '"]');
  if (!radio) throw new Error('خيار غير موجود: ' + groupSel + ' / ' + value);
  if (radio.disabled) return { radio, blocked: true };
  radio.checked = true;
  radio.dispatchEvent(new radio.ownerDocument.defaultView.Event('change', { bubbles: true }));
  return { radio, blocked: false };
}

function type(doc, id, text) {
  const el = doc.getElementById(id);
  if (!el) throw new Error('حقل غير موجود: ' + id);
  el.value = text;
  return el;
}

function click(doc, id) {
  const el = doc.getElementById(id);
  if (!el) throw new Error('زر غير موجود: ' + id);
  el.dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true }));
  return el;
}

function text(doc, id) {
  const el = doc.getElementById(id);
  return el ? (el.textContent || '').trim() : null;
}

function visible(doc, id) {
  const el = doc.getElementById(id);
  return !!el && !el.hidden;
}

/* اختيار رقاقة بمسار لوحة المفاتيح: محرّك الرقاقات يربط الاختيار
   بـpointerup لا بـclick، ومسار لوحة المفاتيح هو نفسه «انقر لتختار»
   الكوني المتاح لكل طالب — فاختباره يختبر طريقًا حقيقيًا. */
function selectChip(chip) {
  const W = chip.ownerDocument.defaultView;
  chip.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

// نقر على عنصر (لا على مُعرّف) — يلزم لعناصر SVG بلا id
function clickNode(node) {
  const W = node.ownerDocument.defaultView;
  node.dispatchEvent(new W.MouseEvent('click', { bubbles: true }));
  return node;
}

module.exports = { loadLesson, tick, choose, type, click, clickNode, text, visible, groupByName, selectChip };
