/* K桌遊：遊戲清單、玩法教學、主持旁白（中英日三語）。
   每款遊戲是 games/<id>/game.json（格式見 README），旁白語音是 games/<id>/audio/<語言>/<句子 id>.mp3，
   由 tools/make_audio.py 預先產生。念的那句同時顯示成字幕。 */
'use strict';

const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('kbg.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kbg.' + k, JSON.stringify(v)); } catch { } },
};

// ---------- 語言 ----------

const LANGS = [{ key: 'zh', label: '中' }, { key: 'en', label: 'EN' }, { key: 'ja', label: '日' }];
const SPEECH_LANG = { zh: 'zh-TW', en: 'en-GB', ja: 'ja-JP' };
const UI = {
  zh: { app: 'K桌遊', rules: '玩法', host: '主持', playTab: '開局', back: '返回', prev: '上一句', next: '下一句',
    play: '▶ 連續播放', resume: '▶ 繼續播放', pause: '⏸ 暫停', pace: '停頓', short: '短', mid: '中', long: '長',
    idleAuto: '按「連續播放」從第一句開始念，或點下面任一句單獨念', idleTap: '點下面任一句就念那一句', fail: '載入失敗：',
    sortBy: '排序', sDefault: '預設', sName: '名稱', sPlayers: '人數', sTime: '時間', sRecent: '最近玩', count: '共 {0} 款' },
  en: { app: 'K Board Games', rules: 'Rules', host: 'Host', playTab: 'Play', back: 'Back', prev: 'Previous line', next: 'Next line',
    play: '▶ Play all', resume: '▶ Resume', pause: '⏸ Pause', pace: 'Pauses', short: 'Short', mid: 'Mid', long: 'Long',
    idleAuto: 'Press “Play all” to start from the first line, or tap any line below to hear just that one', idleTap: 'Tap a line below to hear it', fail: 'Failed to load: ',
    sortBy: 'Sort', sDefault: 'Default', sName: 'Name', sPlayers: 'Players', sTime: 'Time', sRecent: 'Recent', count: '{0} games' },
  ja: { app: 'Kボードゲーム', rules: 'ルール', host: '進行', playTab: 'プレイ', back: '戻る', prev: '前の台詞', next: '次の台詞',
    play: '▶ 連続再生', resume: '▶ 続きを再生', pause: '⏸ 一時停止', pace: '間', short: '短', mid: '中', long: '長',
    idleAuto: '「連続再生」で最初から読み上げます。下の台詞をタップすると、その一文だけ読みます', idleTap: '下の台詞をタップすると読み上げます', fail: '読み込みに失敗：',
    sortBy: '並び順', sDefault: '標準', sName: '名前', sPlayers: '人数', sTime: '時間', sRecent: '最近', count: '全 {0} 作' },
};

function defaultLang() {
  const n = (navigator.language || '').toLowerCase();
  return n.startsWith('ja') ? 'ja' : n.startsWith('zh') ? 'zh' : 'en';
}
let lang = store.get('lang', null) || defaultLang();
const ui = k => UI[lang][k];
// game.json 裡要翻譯的欄位寫成 { zh, en, ja }；缺哪一語就退回中文
const tr = v => v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.zh) : v;

function renderChrome() {
  document.documentElement.lang = { zh: 'zh-Hant', en: 'en', ja: 'ja' }[lang];
  $('#ver').textContent = 'v' + APP_VERSION;
  $('#langs').innerHTML = LANGS.map(x => `<button data-lang="${x.key}" class="${x.key === lang ? 'on' : ''}">${x.label}</button>`).join('');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = ui(el.dataset.i18n);
  $('#back').setAttribute('aria-label', ui('back'));
  $('#prev').setAttribute('aria-label', ui('prev'));
  $('#next').setAttribute('aria-label', ui('next'));
}

$('#langs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.dataset.lang === lang) return;
  lang = b.dataset.lang;
  store.set('lang', lang);
  stop();
  renderChrome(); renderHome();
  const sid = cur && script ? script.id : null;
  cur = null;   // 讓 route() 用新語言重畫玩法與旁白
  route();
  if (sid && cur) selectScript(sid);   // 停在原本那組旁白
});

$('#sort').addEventListener('click', e => {
  const b = e.target.closest('button[data-sort]'); if (!b) return;
  store.set('sort', b.dataset.sort);
  renderHome();
});

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

// ---------- 路由：#/ 首頁、#/<遊戲>/rules、#/<遊戲>/host、#/<遊戲>/play ----------
// 玩法頁每款都有；主持頁看 game.json 有沒有 host；開局頁看有沒有 play（type 對到 js/modes/ 底下註冊的模組）

const MODES = window.KBG_MODES || {};
const tabsOf = g => ['rules', g.host && 'host', g.play && MODES[g.play.type] && 'play'].filter(Boolean);
const tabLabel = (g, t) => t === 'play' ? tr(g.play.title) || ui('playTab') : ui(t);

function route() {
  stop();
  const [, id, tab] = location.hash.split('/');
  const g = games[id];
  $('#home').classList.toggle('hidden', !!g);
  $('#game').classList.toggle('hidden', !g);
  $('#back').classList.toggle('hidden', !g);
  $('#ver').classList.toggle('hidden', !!g);   // 版號只在主畫面顯示
  if (!g) { cur = null; $('#title').textContent = ui('app'); document.title = ui('app'); return; }
  const tabs = tabsOf(g);
  if (cur !== g) store.set('recent', Object.assign(store.get('recent', {}), { [id]: Date.now() }));   // 首頁「最近玩」排序用
  if (cur !== g) {
    cur = g; script = null;
    $('#tabs').innerHTML = tabs.map(t => `<button data-tab="${t}">${esc(tabLabel(g, t))}</button>`).join('');
    $('#tabs').classList.toggle('hidden', tabs.length < 2);
    renderRules(g);
    if (g.host) renderHost(g);
    if (g.play) MODES[g.play.type].mount($('#mode'), { game: g, lang, tr, esc, store });
  }
  $('#title').textContent = tr(g.name);
  document.title = tr(g.name) + '｜' + ui('app');
  const want = tab || store.get(id + '.tab', 'rules');
  const t = tabs.includes(want) ? want : 'rules';
  store.set(id + '.tab', t);
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === t);
  // 開局頁的區塊叫 #mode（#play 是主持頁的播放鈕）
  for (const [p, sel] of [['rules', '#rules'], ['host', '#host'], ['play', '#mode']]) $(sel).classList.toggle('hidden', t !== p);
  if (t === 'host') preloadAudio(g);
}

// 首頁排序（Ken 2026-10-24 要求）：預設＝games/index.json 的順序；人數照最少人數、時間照最短時間（都取文字裡第一個數字），
// 一樣的照預設順序；最近玩＝最後打開那款的時間，沒打開過的排後面。選的排序記在 localStorage
const SORTS = ['default', 'name', 'players', 'time', 'recent'];
const firstNum = s => +((String(tr(s)).match(/\d+/) || [999])[0]);
function sortedIds() {
  const by = store.get('sort', 'default'), recent = store.get('recent', {}), idx = id => gameIds.indexOf(id);
  const key = {
    name: (a, b) => tr(games[a].name).localeCompare(tr(games[b].name), { zh: 'zh-Hant-TW', en: 'en', ja: 'ja' }[lang]),
    players: (a, b) => firstNum(games[a].players) - firstNum(games[b].players),
    time: (a, b) => firstNum(games[a].time) - firstNum(games[b].time),
    recent: (a, b) => (recent[b] || 0) - (recent[a] || 0),
  }[by];
  return [...gameIds].sort((a, b) => (key ? key(a, b) : 0) || idx(a) - idx(b));
}

function renderHome() {
  const by = store.get('sort', 'default');
  $('#sort').innerHTML = `<span>${esc(ui('sortBy'))}</span>` + SORTS.map(s => `<button data-sort="${s}" class="${s === by ? 'on' : ''}">${esc(ui('s' + s[0].toUpperCase() + s.slice(1)))}</button>`).join('')
    + `<em class="count">${esc(ui('count').replace('{0}', gameIds.length))}</em>`;   // 遊戲總數（Ken 2026-10-24 要求）
  $('#game-list').innerHTML = sortedIds().map(id => {
    const g = games[id];
    return `<li><a href="#/${id}"><h2>${g.icon ? `<span class="gicon">${esc(g.icon)}</span>` : ''}${esc(tr(g.name))}</h2><div class="meta">${esc(tr(g.players))}・${esc(tr(g.time))}</div><p>${esc(tr(g.summary))}</p></a></li>`;
  }).join('');
}

// ---------- 玩法：極簡 markdown（標題、條列、表格、粗體） ----------

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }

// base：遊戲資料夾（games/<id>/），示意圖「![說明](img/x.svg)」的路徑相對於它
function md(lines, base = '') {
  let out = '', i = 0;
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const img = l.match(/^!\[(.*)\]\((.+)\)$/);
    if (img) { out += `<figure class="fig"><img src="${esc(base + img[2])}" alt="${esc(img[1])}" loading="lazy"><figcaption>${inline(img[1])}</figcaption></figure>`; i++; continue; }
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
  $('#toc').innerHTML = g.rules.map((s, i) => `<a href="#" data-sec="${i}">${esc(tr(s.title))}</a>`).join('');
  $('#rules-body').innerHTML = g.rules.map((s, i) => `<h2 id="sec-${i}">${esc(tr(s.title))}</h2>${md(tr(s.md), `games/${g.id}/`)}`).join('');
}

$('#toc').addEventListener('click', e => {
  const a = e.target.closest('a'); if (!a) return;
  e.preventDefault();
  document.getElementById('sec-' + a.dataset.sec).scrollIntoView({ behavior: 'smooth' });
});

// ---------- 主持：旁白＋字幕 ----------

let opts = {};             // 這局勾了哪些角色
let script = null;         // 目前的旁白組
let lines = [];            // 依勾選篩過的句子
let idx = -1;              // 目前念到第幾句
let playing = false;       // 連續播放中
let waitTimer = 0;
const audio = new Audio();
const blobs = {};          // 語言/句子 id → 預載好的音檔網址（離線、連播都不用再等網路）

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
    `<button class="chip${opts[o.id] ? ' on' : ''}" data-opt="${o.id}">${esc(tr(o.label))}</button>`).join('');
  $('#options').classList.toggle('hidden', !g.host.options.length);
  $('#scripts').innerHTML = g.host.scripts.map(s => `<button data-script="${s.id}">${esc(tr(s.title))}</button>`).join('');
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
  $('#lines').innerHTML = lines.map((l, i) => `<li data-i="${i}">${esc(tr(l.text))}</li>`).join('');
  showNow();
}

function showNow() {
  const t = $('#now-text');
  if (idx < 0) {
    t.textContent = ui(script.autoplay === false ? 'idleTap' : 'idleAuto');
    t.className = 'idle';
  } else { t.textContent = tr(lines[idx].text); t.className = ''; }
  document.querySelectorAll('#lines li').forEach((li, i) => {
    li.classList.toggle('on', i === idx);
    li.classList.toggle('done', i < idx);
  });
  const on = document.querySelector('#lines li.on');
  if (on) on.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  $('#play').textContent = ui(playing ? 'pause' : (idx >= 0 && idx < lines.length - 1 ? 'resume' : 'play'));
}

const audioPath = (g, l, lg) => `games/${g.id}/audio/${lg}/${l.id}.mp3`;
function audioUrl(l) { return blobs[lang + '/' + l.id] || audioPath(cur, l, lang); }

async function preloadAudio(g) {
  const lg = lang;
  for (const s of g.host.scripts) for (const l of s.lines) {
    const k = lg + '/' + l.id;
    if (blobs[k]) continue;
    try {
      const r = await fetch(audioPath(g, l, lg));
      if (r.ok) blobs[k] = URL.createObjectURL(await r.blob());
    } catch { /* 沒網路：播放時再試 */ }
  }
}

// 念一句（字幕同步顯示）；念完後若在連續播放，停頓 pause 秒接下一句
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
  audio.onerror = () => speakFallback(tr(l.text), done);
  audio.src = audioUrl(l);
  audio.play().catch(() => speakFallback(tr(l.text), done));
}

// 沒有音檔時（還沒產生、或離線沒快取到）：用瀏覽器內建語音，再不行就只顯示字幕
function speakFallback(text, done) {
  if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[lang];
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
  if (script && cur) showNow();
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
  const b = e.target.closest('button[data-pace]'); if (!b) return;
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
  window.scrollTo(0, 0);
});

renderChrome();
loadGames().then(() => { renderHome(); markPace(); route(); }).catch(e => {
  $('#home').classList.remove('hidden');
  $('#game-list').innerHTML = `<li><p>${esc(ui('fail') + e.message)}</p></li>`;
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
