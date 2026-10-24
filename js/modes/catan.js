/* 卡坦島：擲骰＋勝利分數板。手機擲兩顆骰子，擲到 7 提醒強盜與棄牌，記錄每個點數出現幾次；
   每人記村莊、城市、分數卡，最長道路與最大騎士各只有一個人拿，自動算勝利分數，到 10 分提醒。
   進行中的局存在 localStorage，App 被關掉或重新整理也接得回來。畫面沿用誰是臥底與卡卡頌的樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).catan = (() => {
  const COLORS = [{ id: 'red', hex: '#d9534f' }, { id: 'blue', hex: '#3f7fd0' }, { id: 'white', hex: '#eeeeee' }, { id: 'orange', hex: '#e8892b' }];
  const T = {
    zh: {
      players: '人數', start: '開始遊戲', red: '紅', blue: '藍', white: '白', orange: '橘',
      roll: '擲骰', seven: '強盜！手牌超過 7 張的人棄一半（無條件捨去），擲骰的人移動強盜並搶一張牌',
      stats: '點數紀錄（共 {0} 次）', set: '村莊', city: '城市', vp: '分數卡', road: '最長道路', army: '最大騎士',
      cityTip: '城市是村莊升級的：城市 +1 會自動村莊 −1', win: '{0} 到 10 分了！要在自己的回合才算贏',
      undo: '復原上一步', quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次', points: '{0} 分',
    },
    en: {
      players: 'Players', start: 'Start game', red: 'Red', blue: 'Blue', white: 'White', orange: 'Orange',
      roll: 'Roll dice', seven: 'Robber! Anyone with more than 7 cards discards half (rounded down); the roller moves the robber and steals a card',
      stats: 'Roll history ({0} rolls)', set: 'Settlement', city: 'City', vp: 'VP card', road: 'Longest road', army: 'Largest army',
      cityTip: 'Cities upgrade settlements: City +1 also takes a settlement away', win: '{0} has 10 points! It only counts on their own turn',
      undo: 'Undo', quit: 'Start over (change players)', quitSure: 'Start over? Tap again', points: '{0} VP',
    },
    ja: {
      players: '人数', start: 'ゲーム開始', red: '赤', blue: '青', white: '白', orange: 'オレンジ',
      roll: 'サイコロを振る', seven: '盗賊！手札が 8 枚以上の人は半分を捨てる（切り捨て）。振った人が盗賊を動かし 1 枚奪う',
      stats: '出目の記録（{0} 回）', set: '開拓地', city: '都市', vp: '得点カード', road: '最長交易路', army: '最大騎士力',
      cityTip: '都市は開拓地を格上げする：都市 +1 で開拓地 −1', win: '{0} が 10 点！自分の手番でないと勝ちにならない',
      undo: '1 つ戻す', quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ', points: '{0} 点',
    },
  };
  const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  let el, ctx, S, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('catan.state', S);
  const cfg = () => Object.assign({ n: 4 }, ctx.store.get('catan.cfg', {}));
  const vpOf = (p, i) => p.set + 2 * p.city + p.vp + (S.road === i ? 2 : 0) + (S.army === i ? 2 : 0);
  const snap = () => JSON.stringify({ players: S.players, road: S.road, army: S.army, rolls: S.rolls, last: S.last });

  function start() {
    // 開局每人放 2 個村莊
    S = { players: COLORS.slice(0, cfg().n).map(c => ({ color: c.id, set: 2, city: 0, vp: 0 })), road: -1, army: -1, rolls: Array(13).fill(0), last: null, hist: [] };
    save(); render();
  }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const dot = id => `<i class="cc-dot" style="background:${COLORS.find(c => c.id === id).hex}"></i>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;

  function render() {
    const e = ctx.esc;
    let h = '';
    if (!S) {
      const c = cfg();
      h = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 3, 4)}</div>
        <p class="uc-big">${COLORS.slice(0, c.n).map(x => dot(x.id) + e(t(x.id))).join('　')}</p>
        ${btn('start', t('start'), 'big')}
      </div>`;
    } else {
      const total = S.rolls.reduce((a, b) => a + b, 0), max = Math.max(1, ...S.rolls);
      const winner = S.players.findIndex((p, i) => vpOf(p, i) >= 10);
      h = `<div class="uc-card ct-dice">
          ${S.last ? `<p class="ct-faces">${FACES[S.last[0] - 1]}${FACES[S.last[1] - 1]}<b>${S.last[0] + S.last[1]}</b></p>` : ''}
          ${S.last && S.last[0] + S.last[1] === 7 ? `<p class="uc-last">${e(t('seven'))}</p>` : ''}
          ${btn('roll', t('roll'), 'big')}
        </div>
        ${winner >= 0 ? `<p class="uc-last">${e(t('win', t(S.players[winner].color)))}</p>` : ''}
        <div class="ct-players">${S.players.map((p, i) => `<div class="uc-card ct-p">
          <p class="ct-head">${dot(p.color)}<span>${e(t(p.color))}</span><b>${e(t('points', vpOf(p, i)))}</b></p>
          ${['set', 'city', 'vp'].map(k => `<div class="uc-row"><span>${e(t(k))}</span><div class="uc-step"><button data-act="dec" data-i="${i}" data-k="${k}"${p[k] <= 0 ? ' disabled' : ''}>−</button><b>${p[k]}</b><button data-act="inc" data-i="${i}" data-k="${k}">＋</button></div></div>`).join('')}
          <div class="seg">${btn('road', t('road'), S.road === i ? 'on' : '', ` data-i="${i}"`)}${btn('army', t('army'), S.army === i ? 'on' : '', ` data-i="${i}"`)}</div>
        </div>`).join('')}</div>
        <p class="uc-tip">${e(t('cityTip'))}</p>
        <div class="uc-card"><p class="uc-tip">${e(t('stats', total))}</p>
          <div class="ct-bars">${S.rolls.slice(2).map((n, k) => `<div><i style="height:${Math.round(n / max * 60)}px"${k + 2 === 7 ? ' class="seven"' : ''}></i><small>${n}</small><b>${k + 2}</b></div>`).join('')}</div>
        </div>
        <div class="uc-confirm">${btn('undo', t('undo'), '', S.hist.length ? '' : ' disabled')}</div>
        <p class="uc-foot">${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'catan') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    const wasArmed = armed;
    armed = '';
    if (!S) {
      if (act === 'inc' || act === 'dec') { const c = cfg(); c.n = Math.min(4, Math.max(3, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('catan.cfg', c); }
      if (act === 'start') return start();
      return render();
    }
    if (['roll', 'inc', 'dec', 'road', 'army'].includes(act)) { S.hist.push(snap()); if (S.hist.length > 50) S.hist.shift(); }
    const i = +b.dataset.i, k = b.dataset.k;
    switch (act) {
      case 'roll': { const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; S.last = d; S.rolls[d[0] + d[1]]++; break; }
      case 'inc': S.players[i][k]++; if (k === 'city' && S.players[i].set > 0) S.players[i].set--; break;
      case 'dec': S.players[i][k] = Math.max(0, S.players[i][k] - 1); break;
      case 'road': S.road = S.road === i ? -1 : i; break;
      case 'army': S.army = S.army === i ? -1 : i; break;
      case 'undo': { const x = S.hist.pop(); if (x) Object.assign(S, JSON.parse(x)); break; }
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; return render(); } S = null; break;
    }
    save(); render();
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'catan';
      S = ctx.store.get('catan.state', null);
      render();
    },
  };
})();
