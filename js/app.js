/* K桌遊：遊戲清單、玩法教學、主持旁白。
   每款遊戲是 games/<id>/game.json（格式見 README），旁白語音是 games/<id>/audio/<句子 id>.mp3，
   由 tools/make_audio.py 預先產生。 */
'use strict';

const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('kbg.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kbg.' + k, JSON.stringify(v)); } catch { } },
};

const games = {};          // id → game.json
let gameIds = [];
let cur = null;            // 目前的遊戲

// ---------- 載入 ----------

async function loadJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.json();
}

async function loadGames() {
  gameIds = (await loadJson('games/index.json')).games;
  await Promise.all(gameIds.map(async id => { games[id] = await loadJson(`games/${id}/game.json`); }));
}

// ---------- 路由：#/ 首頁、#/<遊戲>/rules、#/<遊戲>/host ----------

function route() {
  stop();
  const [, id, tab] = location.hash.split('/');
  const g = games[id];
  $('#home').classList.toggle('hidden', !!g);
  $('#game').classList.toggle('hidden', !g);
  $('#back').classList.toggle('hidden', !g);
  if (!g) { cur = null; $('#title').textContent = 'K桌遊'; document.title = 'K桌遊'; return; }
  if (cur !== g) { cur = g; renderRules(g); renderHost(g); }
  $('#title').textContent = g.name;
  document.title = g.name + '｜K桌遊';
  const t = tab === 'host' || tab === 'rules' ? tab : store.get(id + '.tab', 'rules');
  store.set(id + '.tab', t);
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === t);
  $('#rules').classList.toggle('hidden', t !== 'rules');
  $('#host').classList.toggle('hidden', t !== 'host');
  if (t === 'host') preloadAudio(g);
  window.scrollTo(0, 0);
}

function renderHome() {
  $('#game-list').innerHTML = gameIds.map(id => {
    const g = games[id];
    return `<li><a href="#/${id}"><h2>${esc(g.name)}</h2><div class="meta">${esc(g.players)}・${esc(g.time)}</div><p>${esc(g.summary)}</p></a></li>`;
  }).join('');
}

// ---------- 玩法：極簡 markdown（標題、條列、表格、粗體） ----------

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }

function md(lines) {
  let out = '', i = 0;
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('### ')) { out += `<h3>${inline(l.slice(4))}</h3>`; i++; continue; }
    if (l.startsWith('- ')) {
      out += '<ul>';
      while (i < lines.length && lines[i].startsWith('- ')) out += `<li>${inline(lines[i++].slice(2))}</li>`;
      out += '</ul>'; continue;
    }
    if (l.startsWith('|')) {
      const head = cells(l); i += 2;  // 跳過 |---| 那行
      out += '<div class="table-wrap"><table><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr>';
      while (i < lines.length && lines[i].startsWith('|')) out += '<tr>' + cells(lines[i++]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
      out += '</table></div>'; continue;
    }
    out += `<p>${inline(l)}</p>`; i++;
  }
  return out;
}

function renderRules(g) {
  $('#toc').innerHTML = g.rules.map((s, i) => `<a href="#" data-sec="${i}">${esc(s.title)}</a>`).join('');
  $('#rules-body').innerHTML = g.rules.map((s, i) => `<h2 id="sec-${i}">${esc(s.title)}</h2>${md(s.md)}`).join('');
}

$('#toc').addEventListener('click', e => {
  const a = e.target.closest('a'); if (!a) return;
  e.preventDefault();
  document.getElementById('sec-' + a.dataset.sec).scrollIntoView({ behavior: 'smooth' });
});

// ---------- 主持：旁白 ----------

let opts = {};             // 這局勾了哪些角色
let script = null;         // 目前的旁白組
let lines = [];            // 依勾選篩過的句子
let idx = -1;              // 目前念到第幾句
let playing = false;       // 連續播放中
let waitTimer = 0;
const audio = new Audio();
const blobs = {};          // 句子 id → 預載好的音檔網址（離線、連播都不用再等網路）

// when：選項 id 用 && 串起來，前面加 ! 表示「沒有這個角色」
function match(when) {
  if (!when) return true;
  return when.split('&&').every(t => {
    t = t.trim();
    return t.startsWith('!') ? !opts[t.slice(1)] : !!opts[t];
  });
}

function renderHost(g) {
  const saved = store.get(g.id + '.opts', {});
  opts = {};
  for (const o of g.host.options) opts[o.id] = o.id in saved ? saved[o.id] : !!o.default;
  $('#options').innerHTML = g.host.options.map(o =>
    `<button class="chip${opts[o.id] ? ' on' : ''}" data-opt="${o.id}">${esc(o.label)}</button>`).join('');
  $('#options').classList.toggle('hidden', !g.host.options.length);
  $('#scripts').innerHTML = g.host.scripts.map(s => `<button data-script="${s.id}">${esc(s.title)}</button>`).join('');
  $('#scripts').classList.toggle('hidden', g.host.scripts.length < 2);
  selectScript(g.host.scripts[0].id);
}

function selectScript(id) {
  stop();
  script = cur.host.scripts.find(s => s.id === id);
  for (const b of document.querySelectorAll('#scripts button')) b.classList.toggle('on', b.dataset.script === id);
  const auto = script.autoplay !== false;
  $('#play').classList.toggle('hidden', !auto);
  $('#pace').classList.toggle('hidden', !auto);
  $('#controls').classList.toggle('single', !auto);
  rebuildLines();
}

function rebuildLines() {
  lines = script.lines.filter(l => match(l.when));
  idx = -1;
  $('#lines').innerHTML = lines.map((l, i) => `<li data-i="${i}">${esc(l.text)}</li>`).join('');
  showNow();
}

function showNow() {
  const t = $('#now-text');
  if (idx < 0) {
    t.textContent = script.autoplay === false ? '點下面任一句就念那一句' : '按「連續播放」從第一句開始念，或點下面任一句單獨念';
    t.className = 'idle';
  } else { t.textContent = lines[idx].text; t.className = ''; }
  document.querySelectorAll('#lines li').forEach((li, i) => {
    li.classList.toggle('on', i === idx);
    li.classList.toggle('done', i < idx);
  });
  const on = document.querySelector('#lines li.on');
  if (on) on.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  $('#play').textContent = playing ? '⏸ 暫停' : (idx >= 0 && idx < lines.length - 1 ? '▶ 繼續播放' : '▶ 連續播放');
}

function audioUrl(l) { return blobs[l.id] || `games/${cur.id}/audio/${l.id}.mp3`; }

async function preloadAudio(g) {
  for (const s of g.host.scripts) for (const l of s.lines) {
    if (blobs[l.id]) continue;
    try {
      const r = await fetch(`games/${g.id}/audio/${l.id}.mp3`);
      if (r.ok) blobs[l.id] = URL.createObjectURL(await r.blob());
    } catch { /* 沒網路：播放時再試 */ }
  }
}

// 念一句；念完後若在連續播放，停頓 pause 秒接下一句
function say(i) {
  clearTimeout(waitTimer);
  waitBar(0);
  idx = i;
  showNow();
  const l = lines[i];
  const done = () => {
    if (!playing || idx !== i) return;
    if (i >= lines.length - 1) { playing = false; showNow(); return; }
    const sec = (l.pause || 0) * store.get('pace', 1);
    waitBar(sec);
    waitTimer = setTimeout(() => say(i + 1), sec * 1000);
  };
  audio.onended = done;
  audio.onerror = () => speakFallback(l.text, done);
  audio.src = audioUrl(l);
  audio.play().catch(() => speakFallback(l.text, done));
}

// 沒有音檔時（還沒產生、或離線沒快取到）：用瀏覽器內建語音，再不行就只顯示文字
function speakFallback(text, done) {
  if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    u.onend = done;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } else setTimeout(done, 400 + text.length * 250);
}

function waitBar(sec) {
  const w = $('#wait'), f = $('#wait-fill');
  f.style.transition = 'none'; f.style.width = '0';
  w.classList.toggle('on', sec > 0);
  if (sec > 0) { void f.offsetWidth; f.style.transition = `width ${sec}s linear`; f.style.width = '100%'; }
}

function stop() {
  playing = false;
  clearTimeout(waitTimer);
  audio.onended = audio.onerror = null;
  audio.pause();
  if (window.speechSynthesis) speechSynthesis.cancel();
  waitBar(0);
  if (script) showNow();
}

$('#play').addEventListener('click', () => {
  if (playing) { stop(); return; }
  playing = true;
  say(idx >= 0 && idx < lines.length - 1 ? idx + 1 : 0);
});
$('#next').addEventListener('click', () => { stop(); if (idx < lines.length - 1) say(idx + 1); });
$('#prev').addEventListener('click', () => { stop(); say(Math.max(0, idx - 1)); });
$('#lines').addEventListener('click', e => {
  const li = e.target.closest('li'); if (!li) return;
  stop(); say(+li.dataset.i);
});
$('#options').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  opts[b.dataset.opt] = !opts[b.dataset.opt];
  b.classList.toggle('on', opts[b.dataset.opt]);
  store.set(cur.id + '.opts', opts);
  stop(); rebuildLines();
});
$('#scripts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) selectScript(b.dataset.script); });
$('#pace').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  store.set('pace', +b.dataset.pace); markPace();
});
function markPace() {
  const p = store.get('pace', 1);
  for (const b of document.querySelectorAll('#pace button')) b.classList.toggle('on', +b.dataset.pace === p);
}

$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  location.replace(`#/${cur.id}/${b.dataset.tab}`);
});
// 從首頁點進來的就退回上一頁（App 的返回鍵也走瀏覽紀錄，兩邊才一致）；直接開遊戲網址的才換成首頁
let cameFromHome = false;
$('#back').addEventListener('click', () => {
  if (cameFromHome) history.back(); else location.replace('#/');
});

// ---------- 啟動 ----------

window.addEventListener('hashchange', e => {
  const was = new URL(e.oldURL).hash.split('/')[1];
  if (!was) cameFromHome = true; else if (!location.hash.split('/')[1]) cameFromHome = false;
  route();
});

loadGames().then(() => { renderHome(); markPace(); route(); }).catch(e => {
  $('#home').classList.remove('hidden');
  $('#game-list').innerHTML = `<li><p>載入失敗：${esc(e.message)}</p></li>`;
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
