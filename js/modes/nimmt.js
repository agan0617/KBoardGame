/* 誰是牛頭王（6 nimmt!）：算牛頭。每局每個人輸入吃到的牌號（空白分隔），自動換成牛頭數；
   累積到有人 66 頭（或自訂）就結束，牛頭最少的人贏。每一局記下來、可以復原。進行中的局存在 localStorage。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).nimmt = (() => {
  const T = {
    zh: {
      players: '人數', limit: '結束門檻', start: '開始', round: '第 {0} 局', p: '{0} 號',
      inputTip: '輸入這局吃到的牌號，用空白隔開（例如 55 22 10）；也可以直接打「頭 7」表示 7 頭', heads: '{0} 頭',
      settle: '這局結算', total: '總牛頭', end: '{0} 號到 {1} 頭，遊戲結束！牛頭最少的人贏', place: '第 {0} 名',
      undo: '復原上一局', quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次', table: '牛頭對照：55 → 7、11 的倍數 → 5、10 的倍數 → 3、5 的倍數 → 2、其他 → 1',
    },
    en: {
      players: 'Players', limit: 'End at', start: 'Start', round: 'Round {0}', p: 'P{0}',
      inputTip: 'Enter the card numbers taken this round, separated by spaces (e.g. 55 22 10); or type "h7" for 7 heads directly', heads: '{0} heads',
      settle: 'Score round', total: 'Total heads', end: 'P{0} reached {1} — game over! Fewest heads wins', place: '#{0}',
      undo: 'Undo last round', quit: 'Start over (change players)', quitSure: 'Start over? Tap again', table: 'Heads: 55 → 7, multiples of 11 → 5, of 10 → 3, of 5 → 2, others → 1',
    },
    ja: {
      players: '人数', limit: '終了点', start: '開始', round: '第 {0} ラウンド', p: '{0} 番',
      inputTip: 'このラウンドで取ったカードの番号を空白区切りで入力（例 55 22 10）。「頭 7」で 7 頭を直接入力も可', heads: '{0} 頭',
      settle: 'ラウンド集計', total: '合計', end: '{0} 番が {1} 頭に、ゲーム終了！一番少ない人の勝ち', place: '{0} 位',
      undo: '1 ラウンド戻す', quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ', table: '牛の頭：55 → 7、11 の倍数 → 5、10 の倍数 → 3、5 の倍数 → 2、その他 → 1',
    },
  };

  let el, ctx, S, armed = '', inputs = {};
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('nimmt.state', S);
  const cfg = () => Object.assign({ n: 5, limit: 66 }, ctx.store.get('nimmt.cfg', {}));
  const headOf = c => c === 55 ? 7 : c % 11 === 0 ? 5 : c % 10 === 0 ? 3 : c % 5 === 0 ? 2 : 1;
  // 「55 22 10」→ 7+5+3；「頭 7」「h7」→ 7（直接輸入牛頭數）
  function parse(s) {
    s = String(s || '').trim();
    const direct = s.match(/^(?:頭|h)\s*(\d+)$/i);
    if (direct) return +direct[1];
    return (s.match(/\d+/g) || []).map(Number).filter(c => c >= 1 && c <= 104).reduce((a, c) => a + headOf(c), 0);
  }

  function start() { const c = cfg(); S = { limit: c.limit, total: Array(c.n).fill(0), rounds: [] }; inputs = {}; save(); render(); }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;

  function render() {
    const e = ctx.esc;
    if (!S) {
      const c = cfg();
      el.innerHTML = `<div class="uc-card uc-setup"><div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 2, 10)}</div>
        <div class="uc-row"><span>${e(t('limit'))}</span><input class="mg-in" type="number" inputmode="numeric" data-cfg="limit" value="${c.limit}"></div>
        ${btn('start', t('start'), 'big')}</div><p class="uc-tip">${e(t('table'))}</p>`;
      return;
    }
    const n = S.total.length, over = S.total.some(v => v >= S.limit);
    const rank = v => S.total.filter(x => x < v).length + 1;
    el.innerHTML = `${over ? `<div class="uc-card uc-end"><p class="uc-big">${e(t('end', S.total.indexOf(Math.max(...S.total)) + 1, Math.max(...S.total)))}</p></div>` : `<div class="uc-card">
        <p class="uc-round">${e(t('round', S.rounds.length + 1))}</p><p class="uc-tip">${e(t('inputTip'))}</p>
        ${S.total.map((_, i) => `<div class="nm-row"><span>${e(t('p', i + 1))}</span><input class="nm-in" data-i="${i}" inputmode="text" value="${e(inputs[i] || '')}"><b data-h="${i}">${e(t('heads', parse(inputs[i])))}</b></div>`).join('')}
        ${btn('settle', t('settle'), 'big')}</div>`}
      <div class="uc-card"><p class="uc-tip">${e(t('total'))}</p><div class="dx-total">${S.total.map((v, i) => {
        const last = S.rounds[S.rounds.length - 1];
        return `<div class="${v >= S.limit ? 'nm-over' : ''}"><small>${e(t('p', i + 1))}</small><b>${v}</b>${last && last[i] ? `<em>+${last[i]}</em>` : ''}${over ? `<em>${e(t('place', rank(v)))}</em>` : ''}</div>`;
      }).join('')}</div></div>
      <p class="uc-tip">${e(t('table'))}</p>
      <div class="uc-confirm">${btn('undo', t('undo'), '', S.rounds.length ? '' : ' disabled')}</div>
      <p class="uc-foot">${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'nimmt') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed;
    armed = '';
    if (!S) {
      if (act === 'inc' || act === 'dec') { const c = cfg(); c.n = Math.min(10, Math.max(2, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('nimmt.cfg', c); }
      if (act === 'start') return start();
      return render();
    }
    switch (act) {
      case 'settle': { const add = S.total.map((_, i) => parse(inputs[i])); add.forEach((a, i) => S.total[i] += a); S.rounds.push(add); inputs = {}; break; }
      case 'undo': { const r = S.rounds.pop(); if (r) r.forEach((a, i) => S.total[i] -= a); break; }
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; return render(); } S = null; inputs = {}; break;
    }
    save(); render();
  }
  function onInput(ev) {
    if (el.dataset.mode !== 'nimmt') return;
    const x = ev.target;
    if (x.classList.contains('nm-in')) {
      inputs[x.dataset.i] = x.value;
      const h = el.querySelector(`[data-h="${x.dataset.i}"]`); if (h) h.textContent = t('heads', parse(x.value));
    } else if (!S && x.dataset.cfg) { const c = cfg(); c.limit = Math.max(1, Math.round(+x.value || 66)); ctx.store.set('nimmt.cfg', c); }
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); el.addEventListener('input', onInput); }
      el.dataset.mode = 'nimmt';
      S = ctx.store.get('nimmt.state', null);
      render();
    },
  };
})();
