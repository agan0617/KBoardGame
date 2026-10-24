/* MOGUL 房產大亨：備用銀行。刷卡機沒電或想看紀錄時用：每人一個帳戶，起始金額、過起點的錢可以自己設；
   收錢、付錢、玩家互轉都記一筆、可以復原，餘額變負數標出來。進行中的局存在 localStorage。畫面沿用卡卡頌的樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).mogul = (() => {
  const COLORS = ['#d9534f', '#3f7fd0', '#4caf50', '#e8c13a', '#8e5ccf', '#e8892b'];
  const T = {
    zh: {
      players: '人數', startMoney: '起始金額', goMoney: '過起點拿', start: '開始', p: '{0} 號',
      pick: '先點一個人，選要做什麼，輸入金額', amount: '金額', go: '過起點', recv: '從銀行收', pay: '付給銀行', to: '付給 {0} 號',
      undo: '復原上一筆', log: '紀錄', none: '還沒有交易', broke: '負債！',
      quit: '重新開始（改設定）', quitSure: '確定重新開始？再按一次', needAmt: '先輸入金額',
    },
    en: {
      players: 'Players', startMoney: 'Starting money', goMoney: 'Pass GO', start: 'Start', p: 'P{0}',
      pick: 'Tap a player, choose an action, enter the amount', amount: 'Amount', go: 'Pass GO', recv: 'Receive from bank', pay: 'Pay bank', to: 'Pay P{0}',
      undo: 'Undo last', log: 'Log', none: 'No transactions yet', broke: 'In debt!',
      quit: 'Start over (change settings)', quitSure: 'Start over? Tap again', needAmt: 'Enter an amount first',
    },
    ja: {
      players: '人数', startMoney: '初期資金', goMoney: 'スタート通過', start: '開始', p: '{0} 番',
      pick: '人をタップ、操作を選んで金額を入力', amount: '金額', go: 'スタート通過', recv: '銀行から受け取る', pay: '銀行に払う', to: '{0} 番に払う',
      undo: '1 つ戻す', log: '記録', none: 'まだ取引なし', broke: '借金！',
      quit: '最初からやり直す（設定を変える）', quitSure: 'やり直す？もう一度タップ', needAmt: '先に金額を入力',
    },
  };

  let el, ctx, S, armed = '', sel = -1, amtVal = '';   // amtVal：輸入框的金額，重畫時保留（先打金額再點人也可以）
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('mogul.state', S);
  const cfg = () => Object.assign({ n: 4, start: 15000, go: 2000 }, ctx.store.get('mogul.cfg', {}));
  const fmt = v => v.toLocaleString('en-US');
  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const dot = i => `<i class="cc-dot" style="background:${COLORS[i]}"></i>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;

  function start() { const c = cfg(); S = { go: c.go, bal: Array(c.n).fill(c.start), log: [] }; sel = -1; save(); render(); }

  function render() {
    const e = ctx.esc;
    if (!S) {
      const c = cfg();
      el.innerHTML = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 2, 6)}</div>
        <div class="uc-row"><span>${e(t('startMoney'))}</span><input class="mg-in" type="number" inputmode="numeric" data-cfg="start" value="${c.start}"></div>
        <div class="uc-row"><span>${e(t('goMoney'))}</span><input class="mg-in" type="number" inputmode="numeric" data-cfg="go" value="${c.go}"></div>
        ${btn('start', t('start'), 'big')}</div>`;
      return;
    }
    const n = S.bal.length, dis = sel < 0 ? ' disabled' : '';
    el.innerHTML = `<div class="uc-card cc-board">${S.bal.map((b, i) => `<button class="cc-row${sel === i ? ' on' : ''}" data-act="sel" data-i="${i}">${dot(i)}<span>${e(t('p', i + 1))}${b < 0 ? ` <small class="mg-broke">${e(t('broke'))}</small>` : ''}</span><b>${fmt(b)}</b></button>`).join('')}</div>
      <p class="uc-tip">${e(t('pick'))}</p>
      <div class="uc-row"><span>${e(t('amount'))}</span><input class="mg-in" id="mg-amt" type="number" inputmode="numeric" min="0" value="${e(String(amtVal))}"></div>
      <div class="mg-acts">${btn('go', `${t('go')} +${fmt(S.go)}`, '', dis)}${btn('recv', t('recv'), '', dis)}${btn('pay', t('pay'), '', dis)}
        ${[...Array(n).keys()].filter(j => j !== sel).map(j => btn('to', t('to', j + 1), '', `${dis} data-j="${j}"`)).join('')}</div>
      <div class="uc-confirm">${btn('undo', t('undo'), '', S.log.length ? '' : ' disabled')}</div>
      <div class="uc-card cc-log"><p class="uc-tip">${e(t('log'))}</p>${S.log.length ? S.log.slice(-10).reverse().map(x => `<p>${x.from >= 0 ? dot(x.from) + e(t('p', x.from + 1)) : '🏦'} → ${x.to >= 0 ? dot(x.to) + e(t('p', x.to + 1)) : '🏦'}　${fmt(x.v)}</p>`).join('') : `<p class="uc-tip">${e(t('none'))}</p>`}</div>
      <p class="uc-foot">${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
  }

  // from／to 是 -1 代表銀行
  function move(from, to, v) {
    if (from >= 0) S.bal[from] -= v;
    if (to >= 0) S.bal[to] += v;
    S.log.push({ from, to, v });
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'mogul') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed;
    armed = '';
    if (!S) {
      if (act === 'inc' || act === 'dec') { const c = cfg(); c.n = Math.min(6, Math.max(2, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('mogul.cfg', c); }
      if (act === 'start') return start();
      return render();
    }
    const amt = Math.round(+(el.querySelector('#mg-amt')?.value || 0));
    switch (act) {
      case 'sel': sel = sel === +b.dataset.i ? -1 : +b.dataset.i; break;
      case 'go': move(-1, sel, S.go); break;
      case 'recv': case 'pay': case 'to':
        if (!(amt > 0)) { el.querySelector('#mg-amt').placeholder = t('needAmt'); el.querySelector('#mg-amt').focus(); return; }
        if (act === 'recv') move(-1, sel, amt); else if (act === 'pay') move(sel, -1, amt); else move(sel, +b.dataset.j, amt);
        amtVal = '';
        break;
      case 'undo': { const x = S.log.pop(); if (x) { if (x.from >= 0) S.bal[x.from] += x.v; if (x.to >= 0) S.bal[x.to] -= x.v; } break; }
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; return render(); } S = null; sel = -1; break;
    }
    save(); render();
  }
  function onInput(ev) {
    if (el.dataset.mode !== 'mogul') return;
    const x = ev.target;
    if (x.id === 'mg-amt') { amtVal = x.value; return; }
    if (S || !x.dataset || !x.dataset.cfg) return;
    const c = cfg(); c[x.dataset.cfg] = Math.max(0, Math.round(+x.value || 0)); ctx.store.set('mogul.cfg', c);
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); el.addEventListener('input', onInput); }
      el.dataset.mode = 'mogul';
      S = ctx.store.get('mogul.state', null);
      render();
    },
  };
})();
