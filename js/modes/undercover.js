/* 誰是臥底：單機傳遞模式。一支手機輪流傳，每人點開看自己的詞再蓋起來；描述、投票在桌上進行，
   出局的人在這裡點掉，自動公布身分、判勝負。詞庫在 game.json 的 play.words（每一語各自一份，不是互相翻譯）；
   大詞庫放在 play.wordsFile 指的獨立檔（例 words.zh.json），打開開局頁才載入，載入前先用 play.words。
   進行中的局存在 localStorage，App 被關掉或重新整理也接得回來。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).undercover = (() => {
  const T = {
    zh: {
      players: '人數', undercover: '臥底', blank: '白板', none: '不加', add: '加 1 個',
      start: '開始發詞', hint: '大家圍成一圈，順時針從 1 號開始編號，手機從 1 號開始傳。',
      handTo: '請把手機交給 {0} 號', peek: '我是 {0} 號，看我的詞', yourWord: '{0} 號，你的詞是',
      youBlank: '你是白板', blankTip: '你沒有詞。聽大家描述，猜猜他們在說什麼，假裝你也有。',
      gotIt: '記住了，蓋起來', allSeen: '所有人都看過了', toPlay: '開始遊戲',
      round: '第 {0} 輪', speakFrom: '從 {0} 號開始，順時針每人用一句話描述自己的詞', voteTip: '描述完一起投票，得票最多的人出局，在下面點他。平手的人再各描述一句、重新投票。',
      out: '淘汰 {0} 號', cancel: '取消', wasRole: '{0} 號出局，身分是：{1}',
      civ: '平民', uc: '臥底', bl: '白板', alive: '還在場：平民 {0}・臥底方 {1}',
      civWin: '平民獲勝！', ucWin: '臥底獲勝！', civWinTip: '臥底和白板全部被找出來了。', ucWinTip: '平民人數不比臥底方多，臥底藏到了最後。',
      words: '平民的詞：{0}　臥底的詞：{1}', again: '再來一局', settings: '改設定',
      quit: '放棄這局', quitSure: '確定放棄？再按一次', redeal: '換一組詞，重新發', redealSure: '確定換詞？再按一次', outTag: '出局', noWords: '這個語言還沒有詞庫',
    },
    en: {
      players: 'Players', undercover: 'Undercover', blank: 'Blank', none: 'None', add: 'Add 1',
      start: 'Deal words', hint: 'Sit in a circle and number yourselves clockwise from 1. Pass the phone starting with player 1.',
      handTo: 'Hand the phone to player {0}', peek: 'I am player {0}, show my word', yourWord: 'Player {0}, your word is',
      youBlank: 'You are the Blank', blankTip: 'You have no word. Listen to the others, guess what they are describing, and pretend you know it too.',
      gotIt: 'Got it, hide it', allSeen: 'Everyone has seen their word', toPlay: 'Start the game',
      round: 'Round {0}', speakFrom: 'Start with player {0} and go clockwise: each player describes their word in one sentence', voteTip: 'Then everyone votes and the player with the most votes is out. Tap them below. On a tie, the tied players each give one more clue and you vote again.',
      out: 'Eliminate player {0}', cancel: 'Cancel', wasRole: 'Player {0} is out. They were: {1}',
      civ: 'Civilian', uc: 'Undercover', bl: 'Blank', alive: 'Still in: {0} civilians · {1} on the undercover side',
      civWin: 'Civilians win!', ucWin: 'Undercover wins!', civWinTip: 'Every undercover and blank player was found.', ucWinTip: 'Civilians no longer outnumber the undercover side.',
      words: 'Civilian word: {0}   Undercover word: {1}', again: 'Play again', settings: 'Change settings',
      quit: 'Abandon game', quitSure: 'Sure? Tap again', redeal: 'New words, deal again', redealSure: 'New words? Tap again', outTag: 'Out', noWords: 'No word list for this language yet',
    },
    ja: {
      players: '人数', undercover: '潜入者', blank: '白紙', none: 'なし', add: '1人入れる',
      start: 'お題を配る', hint: '輪になって座り、時計回りに 1 番から番号をつけます。スマホは 1 番から回します。',
      handTo: '{0} 番の人にスマホを渡してください', peek: '{0} 番です、お題を見る', yourWord: '{0} 番さんのお題は',
      youBlank: 'あなたは白紙です', blankTip: 'お題はありません。みんなの説明を聞いて何の話か推理し、知っているふりをしましょう。',
      gotIt: '覚えた、隠す', allSeen: '全員がお題を確認しました', toPlay: 'ゲーム開始',
      round: '第 {0} ラウンド', speakFrom: '{0} 番から時計回りに、一人ひとことずつ自分のお題を説明します', voteTip: '説明が終わったら全員で投票し、いちばん票を集めた人が脱落。下でその人をタップします。同票なら、その人たちがもうひとことずつ説明して投票し直します。',
      out: '{0} 番を脱落させる', cancel: 'キャンセル', wasRole: '{0} 番が脱落。正体は：{1}',
      civ: '市民', uc: '潜入者', bl: '白紙', alive: '残り：市民 {0}・潜入者側 {1}',
      civWin: '市民の勝ち！', ucWin: '潜入者の勝ち！', civWinTip: '潜入者と白紙を全員見つけました。', ucWinTip: '市民の人数が潜入者側を上回らなくなりました。',
      words: '市民のお題：{0}　潜入者のお題：{1}', again: 'もう一回', settings: '設定を変える',
      quit: 'このゲームをやめる', quitSure: '本当に？もう一度タップ', redeal: 'お題を変えて配り直す', redealSure: 'お題を変える？もう一度タップ', outTag: '脱落', noWords: 'この言語のお題はまだありません',
    },
  };

  let el, ctx, S, armed = '';   // 要按兩次才生效的按鈕（quit／redeal），第一次按下時記在這裡
  const extra = {};   // 語言 → 從 wordsFile 載入的詞庫
  const wordList = () => extra[ctx.lang] || ctx.game.play.words[ctx.lang] || ctx.game.play.words.zh;
  function loadExtra() {
    const lang = ctx.lang, file = (ctx.game.play.wordsFile || {})[lang];
    if (!file || extra[lang]) return;
    fetch(`games/${ctx.game.id}/${file}`).then(r => r.ok ? r.json() : null).then(a => { if (Array.isArray(a) && a.length) extra[lang] = a; }).catch(() => { });
  }
  const t = (k, ...a) => (T[ctx.lang] || T.zh)[k].replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('undercover.state', S);
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // 人數範圍與預設臥底數（4–7 人 1 個、8–10 人 2 個、11 人以上 3 個）。
  // 平民至少要比臥底方（臥底＋白板）多 2 人，不然第一次投錯就直接輸：臥底＋白板 ≤ (人數−2)/2
  const MIN = 4, MAX = 12;
  const defaultUc = n => n <= 7 ? 1 : n <= 10 ? 2 : 3;
  const badMax = n => Math.floor((n - 2) / 2);
  const maxUc = c => Math.max(1, badMax(c.n) - c.blank);
  const blankOk = n => badMax(n) >= 2;
  function cfg() { return Object.assign({ n: 6, uc: 1, blank: 0 }, ctx.store.get('undercover.cfg', {})); }
  function setCfg(c) {
    if (!blankOk(c.n)) c.blank = 0;
    c.uc = Math.min(Math.max(1, c.uc), maxUc(c));
    ctx.store.set('undercover.cfg', c);
  }

  function deal() {
    const c = cfg();
    const list = wordList();
    // 避開最近用過的詞組（最多記 500 組，詞庫大時不必全記）
    const recent = ctx.store.get('undercover.recent', []);
    let pool = list.map((_, i) => i).filter(i => !recent.includes(ctx.lang + i));
    if (!pool.length) pool = list.map((_, i) => i);
    const pi = pool[rnd(pool.length)];
    ctx.store.set('undercover.recent', [ctx.lang + pi, ...recent].slice(0, Math.min(500, Math.floor(list.length * 0.7))));
    const pair = rnd(2) ? list[pi] : [list[pi][1], list[pi][0]];
    const roles = shuffle([...Array(c.uc).fill('uc'), ...Array(c.blank).fill('bl'), ...Array(c.n - c.uc - c.blank).fill('civ')]);
    S = { phase: 'deal', civWord: pair[0], ucWord: pair[1], cur: 0, shown: false, round: 1, pick: -1, last: null,
      players: roles.map(r => ({ role: r, out: false })) };
    S.starter = pickStarter();
    save(); render();
  }

  // 白板不當第一個描述的人（他還沒聽過任何人說）
  function pickStarter() {
    const ok = S.players.map((p, i) => i).filter(i => !S.players[i].out && S.players[i].role !== 'bl');
    const any = S.players.map((p, i) => i).filter(i => !S.players[i].out);
    const a = ok.length ? ok : any;
    return a[rnd(a.length)];
  }

  const word = p => p.role === 'civ' ? S.civWord : p.role === 'uc' ? S.ucWord : '';
  const roleName = r => t(r);
  function counts() {
    const al = S.players.filter(p => !p.out);
    return { civ: al.filter(p => p.role === 'civ').length, bad: al.filter(p => p.role !== 'civ').length };
  }

  function eliminate(i) {
    S.players[i].out = true;
    S.last = i; S.pick = -1;
    const c = counts();
    if (c.bad === 0) S.phase = 'end', S.winner = 'civ';
    else if (c.civ <= c.bad) S.phase = 'end', S.winner = 'uc';
    else { S.round++; S.starter = pickStarter(); }
    save(); render();
  }

  // ---------- 畫面 ----------

  const btn = (act, label, cls = '') => `<button class="${cls}" data-act="${act}">${ctx.esc(label)}</button>`;
  // 發詞到遊戲中都能換詞重發（同樣設定、換一組詞，從 1 號重新傳）；遊戲中才有放棄這局
  const foot = () => `<p class="uc-foot">${btn('redeal', t(armed === 'redeal' ? 'redealSure' : 'redeal'), 'link')}${S.phase === 'play' ? btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link') : ''}</p>`;
  const stepper = (k, v, lo, hi) => `<div class="uc-step"><button data-act="dec" data-k="${k}"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc" data-k="${k}"${v >= hi ? ' disabled' : ''}>＋</button></div>`;

  function render() {
    const e = ctx.esc;
    let h = '';
    if (!S || S.phase === 'setup') {
      const c = cfg();
      const hasWords = ctx.game.play.words[ctx.lang] || extra[ctx.lang];
      h = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper('n', c.n, MIN, MAX)}</div>
        <div class="uc-row"><span>${e(t('undercover'))}</span>${stepper('uc', c.uc, 1, maxUc(c))}</div>
        <div class="uc-row"><span>${e(t('blank'))}</span><div class="seg">${btn('blank0', t('none'), c.blank ? '' : 'on')}${btn('blank1', t('add'), c.blank ? 'on' : '').replace('<button', blankOk(c.n) ? '<button' : '<button disabled')}</div></div>
        <p class="uc-tip">${e(t('hint'))}</p>
        ${hasWords ? '' : `<p class="uc-tip">${e(t('noWords'))}</p>`}
        ${btn('deal', t('start'), 'big')}
      </div>`;
    } else if (S.phase === 'deal') {
      const n = S.cur + 1, p = S.players[S.cur];
      if (!S.shown) h = `<div class="uc-card uc-pass"><p class="uc-big">${e(t('handTo', n))}</p>${btn('peek', t('peek', n), 'big')}</div>`;
      else h = `<div class="uc-card uc-word">
          <p class="uc-tip">${e(p.role === 'bl' ? '' : t('yourWord', n))}</p>
          <p class="uc-huge">${e(p.role === 'bl' ? t('youBlank') : word(p))}</p>
          ${p.role === 'bl' ? `<p class="uc-tip">${e(t('blankTip'))}</p>` : ''}
          ${btn('hide', t('gotIt'), 'big')}
        </div>`;
      h += `<p class="uc-progress">${S.players.map((_, i) => `<i class="${i < S.cur ? 'done' : i === S.cur ? 'on' : ''}"></i>`).join('')}</p>` + foot();
    } else if (S.phase === 'ready') {
      h = `<div class="uc-card uc-pass"><p class="uc-big">${e(t('allSeen'))}</p>${btn('play', t('toPlay'), 'big')}</div>` + foot();
    } else if (S.phase === 'play') {
      const c = counts();
      h = `<div class="uc-card">
          <p class="uc-round">${e(t('round', S.round))}</p>
          ${S.last != null ? `<p class="uc-last">${e(t('wasRole', S.last + 1, roleName(S.players[S.last].role)))}</p>` : ''}
          <p class="uc-big">${e(t('speakFrom', S.starter + 1))}</p>
          <p class="uc-tip">${e(t('voteTip'))}</p>
          <p class="uc-tip">${e(t('alive', c.civ, c.bad))}</p>
        </div>
        <div class="uc-grid">${S.players.map((p, i) => `<button data-act="pick" data-i="${i}" class="${p.out ? 'out' : ''}${S.pick === i ? ' on' : ''}${S.starter === i ? ' first' : ''}"${p.out ? ' disabled' : ''}>
          <b>${i + 1}</b>${p.out ? `<small>${e(roleName(p.role))}</small>` : ''}</button>`).join('')}</div>
        ${S.pick >= 0 ? `<div class="uc-confirm">${btn('cancel', t('cancel'))}${btn('out', t('out', S.pick + 1), 'big')}</div>` : ''}
        ${foot()}`;
    } else if (S.phase === 'end') {
      h = `<div class="uc-card uc-end ${S.winner}">
          ${S.last != null ? `<p class="uc-last">${e(t('wasRole', S.last + 1, roleName(S.players[S.last].role)))}</p>` : ''}
          <p class="uc-huge">${e(t(S.winner === 'civ' ? 'civWin' : 'ucWin'))}</p>
          <p class="uc-tip">${e(t(S.winner === 'civ' ? 'civWinTip' : 'ucWinTip'))}</p>
          <p class="uc-big">${e(t('words', S.civWord, S.ucWord))}</p>
        </div>
        <ul class="uc-list">${S.players.map((p, i) => `<li class="${p.role}"><b>${i + 1}</b><span>${e(roleName(p.role))}</span><span>${e(word(p) || '—')}</span><small>${p.out ? e(t('outTag')) : ''}</small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('settings', t('settings'))}${btn('deal', t('again'), 'big')}</div>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    const wasArmed = armed;
    armed = '';
    const c = cfg();
    switch (act) {
      case 'inc': case 'dec': {
        const d = act === 'inc' ? 1 : -1;
        if (b.dataset.k === 'n') { c.n = Math.min(MAX, Math.max(MIN, c.n + d)); c.uc = defaultUc(c.n); }
        else c.uc += d;
        setCfg(c); render(); return;
      }
      case 'blank0': case 'blank1': c.blank = act === 'blank1' ? 1 : 0; c.uc = Math.min(c.uc, maxUc(c)); setCfg(c); render(); return;
      case 'deal': deal(); return;
      case 'peek': S.shown = true; break;
      case 'hide':
        S.shown = false;
        if (S.cur < S.players.length - 1) S.cur++; else S.phase = 'ready';
        break;
      case 'play': S.phase = 'play'; break;
      case 'pick': S.pick = S.pick === +b.dataset.i ? -1 : +b.dataset.i; break;
      case 'cancel': S.pick = -1; break;
      case 'out': eliminate(S.pick); return;
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; render(); return; } S = null; break;
      case 'redeal': if (wasArmed !== 'redeal') { armed = 'redeal'; render(); return; } deal(); return;
      case 'settings': S = null; break;
    }
    save(); render();
    if (act === 'pick' && S && S.pick >= 0) el.querySelector('.uc-confirm')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return {
    mount(node, c) {
      ctx = c;
      loadExtra();
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      S = ctx.store.get('undercover.state', null);
      // 重開 App 或換語言時先蓋回去，不讓手上拿著手機的下一個人看到前一個人的詞
      if (S && S.shown) { S.shown = false; save(); }
      render();
    },
  };
})();
