/* 魔城馬車（Kutschfahrt zur Teufelsburg）：單機傳遞發結社卡。人數一半（無條件進位）的騎士團、兄弟會洗勻每人一張（奇數時多一張不用）；
   職業、道具、角色卡用實體的。遊戲結束按「公布結社」列出每個人屬於哪一邊。進行中的局存在 localStorage。畫面沿用誰是臥底的 uc-* 樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).coachride = (() => {
  const T = {
    zh: {
      players: '人數', start: '開始發結社卡', info: '騎士團、兄弟會各 {0} 張洗勻，每人一張{1}', odd: '（多一張不用；人數是奇數，每人另拿一張力量藥水）',
      handTo: '請把手機交給 {0} 號', peek: '我是 {0} 號，看我的結社', yours: '{0} 號，你屬於', gotIt: '記住了，蓋起來',
      O: '公開秘密騎士團', Bh: '真實謊言兄弟會', goalO: '騎士團要湊齊 3 把鑰匙。', goalBh: '兄弟會要湊齊 3 個聖杯。',
      allSeen: '所有人都看過了，馬車出發！', play: '用實體的職業、道具和角色卡玩。有人宣告勝利、說出所有同伴後，按下面公布結社對答案',
      reveal: '公布結社', revealSure: '確定公布？再按一次', result: '每個人的結社', again: '再來一局', settings: '改設定',
      redeal: '重新發結社卡', redealSure: '確定重發？再按一次', quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次',
    },
    en: {
      players: 'Players', start: 'Deal society cards', info: '{0} Order and {0} Brotherhood cards shuffled, one each{1}', odd: ' (one left over; with an odd count everyone also gets a Drink of Power)',
      handTo: 'Hand the phone to player {0}', peek: "I'm player {0}, show my society", yours: 'Player {0}, you belong to', gotIt: 'Got it, hide it',
      O: 'Order of Open Secrets', Bh: 'Brotherhood of True Lies', goalO: 'The Order needs all 3 keys.', goalBh: 'The Brotherhood needs all 3 goblets.',
      allSeen: 'Everyone has seen their society — the coach departs!', play: 'Play with the real occupation, object and character cards. When someone proclaims victory and names their allies, reveal below to check',
      reveal: 'Reveal societies', revealSure: 'Reveal? Tap again', result: 'Everyone\'s society', again: 'Play again', settings: 'Change settings',
      redeal: 'Deal again', redealSure: 'Deal again? Tap again', quit: 'Start over (change players)', quitSure: 'Start over? Tap again',
    },
    ja: {
      players: '人数', start: '結社カードを配る', info: '騎士団・兄弟団 各 {0} 枚を混ぜて 1 枚ずつ{1}', odd: '（1 枚余る。人数が奇数なので全員に力の薬も 1 枚）',
      handTo: 'スマホを {0} 番に渡してください', peek: '{0} 番です、結社を見る', yours: '{0} 番、あなたの結社は', gotIt: '覚えた、隠す',
      O: '公然の秘密騎士団', Bh: '真実の嘘兄弟団', goalO: '騎士団は鍵を 3 つそろえる。', goalBh: '兄弟団は杯を 3 つそろえる。',
      allSeen: '全員見終わりました。馬車出発！', play: '職業・道具・キャラクターは実物のカードで遊ぶ。誰かが勝利を宣言して仲間を全員言ったら、下で結社を公開して答え合わせ',
      reveal: '結社を公開', revealSure: '公開する？もう一度タップ', result: '全員の結社', again: 'もう一回', settings: '設定を変える',
      redeal: '配り直す', redealSure: '配り直す？もう一度タップ', quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ',
    },
  };

  let el, ctx, S, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('cr.state', S);
  const cfg = () => Object.assign({ n: 6 }, ctx.store.get('cr.cfg', {}));
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const half = n => Math.ceil(n / 2);
  const dealRoles = n => shuffle([...Array(half(n)).fill('O'), ...Array(half(n)).fill('Bh')]).slice(0, n);
  function deal() { const n = cfg().n; S = { phase: 'deal', cur: 0, shown: false, roles: dealRoles(n) }; save(); render(); }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;
  const foot = () => `<p class="uc-foot">${btn('redeal', t(armed === 'redeal' ? 'redealSure' : 'redeal'), 'link')}${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;

  function render() {
    const e = ctx.esc;
    let h = '';
    if (!S) {
      const c = cfg();
      h = `<div class="uc-card uc-setup"><div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 3, 10)}</div>
        <p class="uc-tip">${e(t('info', half(c.n), c.n % 2 ? t('odd') : ''))}</p>${btn('start', t('start'), 'big')}</div>`;
    } else if (S.phase === 'deal') {
      const n = S.cur + 1, r = S.roles[S.cur];
      if (!S.shown) h = `<div class="uc-card uc-pass"><p class="uc-big">${e(t('handTo', n))}</p>${btn('peek', t('peek', n), 'big')}</div>`;
      else h = `<div class="uc-card uc-word"><p class="uc-tip">${e(t('yours', n))}</p><p class="uc-huge">${e(t(r))}</p><p class="uc-tip">${e(t('goal' + r))}</p>${btn('hide', t('gotIt'), 'big')}</div>`;
      h += `<p class="uc-progress">${S.roles.map((_, i) => `<i class="${i < S.cur ? 'done' : i === S.cur ? 'on' : ''}"></i>`).join('')}</p>` + foot();
    } else if (S.phase === 'play') {
      h = `<div class="uc-card"><p class="uc-big">${e(t('allSeen'))}</p><p class="uc-tip">${e(t('play'))}</p>${btn('reveal', t(armed === 'reveal' ? 'revealSure' : 'reveal'), 'big')}</div>` + foot();
    } else {
      h = `<div class="uc-card"><p class="uc-round">${e(t('result'))}</p></div>
        <ul class="uc-list">${S.roles.map((r, i) => `<li class="${r === 'Bh' ? 'uc' : ''}"><b>${i + 1}</b><span>${e(t(r))}</span><span></span><small></small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('settings', t('settings'))}${btn('again', t('again'), 'big')}</div>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'coachride') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed;
    armed = '';
    const arm = k => { if (wasArmed !== k) { armed = k; render(); return true; } return false; };
    switch (act) {
      case 'inc': case 'dec': { const c = cfg(); c.n = Math.min(10, Math.max(3, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('cr.cfg', c); return render(); }
      case 'start': case 'again': return deal();
      case 'peek': S.shown = true; break;
      case 'hide': S.shown = false; if (S.cur < S.roles.length - 1) S.cur++; else S.phase = 'play'; break;
      case 'reveal': if (arm('reveal')) return; S.phase = 'reveal'; break;
      case 'redeal': if (arm('redeal')) return; return deal();
      case 'quit': if (arm('quit')) return; S = null; break;
      case 'settings': S = null; break;
    }
    save(); render();
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'coachride';
      S = ctx.store.get('cr.state', null);
      if (S && S.shown) { S.shown = false; save(); }   // 重開時先蓋回去
      render();
    },
  };
})();
