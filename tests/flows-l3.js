'use strict';
const h = require('./harness');

const LESSON = 'semester-1/unit-01/lesson-03.html';

async function load(opts) {
  return h.loadLesson(LESSON, opts || {});
}

// انتظار كشف عنصر بعد مهلة الطيّ (تقليل الحركة مفعّل: 400 + 0)
async function waitVisible(w, doc, id, ms) {
  const limit = ms || 1500;
  const step = 25;
  for (let t = 0; t < limit; t += step) {
    const el = doc.getElementById(id);
    if (el && !el.hidden) return true;
    await h.tick(w, step);
  }
  return false;
}

function fb(doc, id) { return h.text(doc, id) || ''; }

// ---------- محطة 1 ----------
function engagePredict(doc, value) {
  return h.choose(doc, '#engagePredictOptions', value || 'transfer');
}

// ---------- محطة 2: تسلسل الاستكشاف ----------
async function exploreText(w, doc, step, value) {
  h.type(doc, 'explore-input-' + step, value);
  const btns = doc.querySelectorAll('.explore-check');
  let target = null;
  btns.forEach(b => { if (b.getAttribute('data-step') === String(step)) target = b; });
  target.dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true }));
  await h.tick(w, 20);
  return target;
}

async function exploreChoice(w, doc, step, value) {
  const r = h.choose(doc, 'explore' + step, value);
  await h.tick(w, 20);
  return r;
}

// المرور الكامل بالأسئلة 1..6 ثم فتح المرحلة الثانية ونقل الإلكترون
async function runExplore(w, doc) {
  await exploreText(w, doc, 1, '1');
  await waitVisible(w, doc, 'explore-2');
  await exploreText(w, doc, 2, '1');
  await waitVisible(w, doc, 'explore-3');
  await exploreChoice(w, doc, 3, 'correct');
  await waitVisible(w, doc, 'explore-4');
  await exploreChoice(w, doc, 4, 'correct');
  await waitVisible(w, doc, 'explore-5');
  await exploreChoice(w, doc, 5, 'correct');
  await waitVisible(w, doc, 'explore-6');
  await exploreChoice(w, doc, 6, 'correct');
  await waitVisible(w, doc, 'phase1-bridge');
  h.click(doc, 'openPhase2');
  await h.tick(w, 30);
  // نقل الإلكترون بالنقر على إلكترون التكافؤ
  const e = doc.getElementById('p2na-e-2-0');
  e.dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true }));
  await waitVisible(w, doc, 'explore-8', 3000);
  await exploreChoice(w, doc, 8, 'correct');
  await waitVisible(w, doc, 'explore-9', 3000);
  await exploreChoice(w, doc, 9, 'correct');
  await waitVisible(w, doc, 'explore-10', 3000);
}

// ---------- محطة 3 ----------
async function solveChain(w, doc) {
  // سلسلة السحب: تُحلّ برمجيًا عبر النقر للاختيار (chip ثم slot)
  const slots = doc.querySelectorAll('.slot.chain-slot');
  for (let i = 0; i < slots.length; i++) {
    const want = slots[i].getAttribute('data-answer');
    let chip = null;
    doc.querySelectorAll('.chips-pool .chip').forEach(c => {
      if (c.getAttribute('data-value') === want) chip = c;
    });
    if (!chip) continue;
    chip.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await h.tick(w, 10);
    slots[i].dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true }));
    await h.tick(w, 20);
  }
}

async function station3ToPeer(w, doc) {
  await solveChain(w, doc);
  await waitVisible(w, doc, 'chainBridge', 2000);
  h.click(doc, 'openChainReveal');
  await h.tick(w, 60);
  h.choose(doc, '#octetOptions', 'correct');
  await h.tick(w, 60);
  await waitVisible(w, doc, 'peer-activity', 2000);
  h.choose(doc, '#peerDiagnose', 'correct');
  await h.tick(w, 60);
  await waitVisible(w, doc, 'peerCorrectStep', 2000);
}

async function peerAnswer(w, doc, text) {
  h.type(doc, 'peerCorrectInput', text);
  h.click(doc, 'peerCorrectCheck');
  await h.tick(w, 40);
}

// ---------- محطة 5 ----------
async function openLatticeQuestions(w, doc) {
  const esc = doc.getElementById('latticeEscape');
  if (esc) { esc.hidden = false; h.click(doc, 'latticeEscape'); }
  await h.tick(w, 40);
}

async function latAnswer(w, doc, name, value) {
  const r = h.choose(doc, name, value);
  await h.tick(w, 30);
  return r;
}

// ---------- محطة 6 ----------
async function caoAnswer(w, doc, key, value) {
  const r = h.choose(doc, key === 'cmp' ? 'caoCmp' : 'caoPat', value);
  await h.tick(w, 30);
  return r;
}

// ---------- محطة 7 ----------
async function evalStart(w, doc, name) {
  h.type(doc, 'evalName', name);
  h.click(doc, 'evalStart');
  await h.tick(w, 30);
}

async function evalAnswer(w, doc, name, value) {
  const r = h.choose(doc, name, value);
  await h.tick(w, 20);
  return r;
}

async function evalFormula(w, doc, value) {
  h.type(doc, 'ev4Input', value);
  h.click(doc, 'ev4Check');
  await h.tick(w, 20);
}

const EV_MCQ = ['ev1', 'ev2', 'ev3', 'ev5', 'ev6', 'ev7', 'ev8', 'ev9', 'ev10'];

// إنهاء التقييم بعدد محدّد من الإجابات الصحيحة
async function completeEval(w, doc, correctCount, studentName) {
  await evalStart(w, doc, studentName || 'سارة أحمد');
  let given = 0;
  // السؤال الرابع (الصيغة) أولًا كي يكون العدّ صريحًا
  const formulaCorrect = correctCount > 0;
  await evalFormula(w, doc, formulaCorrect ? 'K2O' : 'KO');
  if (formulaCorrect) given++;
  for (const nameQ of EV_MCQ) {
    const wantCorrect = given < correctCount;
    await evalAnswer(w, doc, nameQ, wantCorrect ? 'correct' : 'w1');
    if (wantCorrect) given++;
  }
  await h.tick(w, 60);
}

function spyCertificate(w) {
  const calls = [];
  const original = w.Certificate && w.Certificate.finish;
  if (w.Certificate) {
    w.Certificate.finish = function () {
      calls.push(Array.prototype.slice.call(arguments));
      // لا نستدعي الأصلية: تحميل html2canvas خارج الشبكة في بيئة الاختبار
    };
  }
  return { calls, restore() { if (w.Certificate && original) w.Certificate.finish = original; } };
}

module.exports = {
  LESSON, load, waitVisible, fb, engagePredict,
  exploreText, exploreChoice, runExplore,
  solveChain, station3ToPeer, peerAnswer,
  openLatticeQuestions, latAnswer, caoAnswer,
  evalStart, evalAnswer, evalFormula, completeEval, EV_MCQ, spyCertificate
};
