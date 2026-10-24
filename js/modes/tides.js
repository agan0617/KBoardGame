/* 運轉潮汐（Tides of Time）：三輪計分表。兩個人每輪填分數，自動加總、標出領先與贏家。
   數字存在 localStorage，App 被關掉或重新整理也還在。畫面沿用波多黎各算分的樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).tides = (() => {
  const T = {
    zh: { a: '玩家 A', b: '玩家 B', r: '第 {0} 輪', total: '總分', win: '{0} 贏！', tie: '平手', lead: '領先', clear: '清空分數', clearSure: '確定清空？再按一次', tip: '每輪結束照每張牌的計分目標算好，填進來' },
    en: { a: 'Player A', b: 'Player B', r: 'Round {0}', total: 'Total', win: '{0} wins!', tie: 'Tie', lead: 'Leading', clear: 'Clear scores', clearSure: 'Clear? Tap again', tip: 'At the end of each round score every card\'s objective and enter the total' },
    ja: { a: 'プレイヤー A', b: 'プレイヤー B', r: '第 {0} ラウンド', total: '合計', win: '{0} の勝ち！', tie: '引き分け', lead: 'リード', clear: '得点を消す', clearSure: '消す？もう一度タップ', tip: '各ラウンドの終わりに全カードの得点目標を数えて入力' },
  };
  let el, ctx, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const data = () => ctx.store.get('tides.scores', { a: ['', '', ''], b: ['', '', ''] });
  const sum = arr => arr.reduce((x, v) => x + (+v || 0), 0);

  function status() {
    const d = data(), A = sum(d.a), B = sum(d.b), done = [0, 1, 2].every(i => d.a[i] !== '' && d.b[i] !== '');
    if (done) return A === B ? t('tie') : t('win', t(A > B ? 'a' : 'b'));
    if (A === B) return '';
    return `${t(A > B ? 'a' : 'b')} ${t('lead')}`;
  }
  function render() {
    const e = ctx.esc, d = data();
    el.innerHTML = `<div class="uc-card"><p class="uc-tip">${e(t('tip'))}</p>
      <div class="pr-grid td-grid"><span></span><small>${e(t('a'))}</small><small>${e(t('b'))}</small>
      ${[0, 1, 2].map(i => `<span>${e(t('r', i + 1))}</span>${['a', 'b'].map(p => `<input type="number" inputmode="numeric" data-p="${p}" data-i="${i}" value="${e(String(d[p][i]))}">`).join('')}`).join('')}
      <span>${e(t('total'))}</span><b data-tot="a">${sum(d.a)}</b><b data-tot="b">${sum(d.b)}</b></div>
      <p class="uc-big td-status">${e(status())}</p></div>
      <p class="uc-foot"><button class="link" data-act="clear">${e(t(armed === 'clear' ? 'clearSure' : 'clear'))}</button></p>`;
  }
  function onClick(ev) {
    if (el.dataset.mode !== 'tides') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b) return;
    if (armed !== 'clear') armed = 'clear'; else { armed = ''; ctx.store.set('tides.scores', { a: ['', '', ''], b: ['', '', ''] }); }
    render();
  }
  function onInput(ev) {
    if (el.dataset.mode !== 'tides') return;
    const x = ev.target; if (!x.dataset || !x.dataset.p) return;
    const d = data(); d[x.dataset.p][+x.dataset.i] = x.value === '' ? '' : +x.value; ctx.store.set('tides.scores', d);
    // 只更新總分與狀態，不整頁重畫，輸入框才不會跳掉
    el.querySelector('[data-tot="a"]').textContent = sum(d.a); el.querySelector('[data-tot="b"]').textContent = sum(d.b);
    el.querySelector('.td-status').textContent = status();
  }
  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); el.addEventListener('input', onInput); }
      el.dataset.mode = 'tides';
      render();
    },
  };
})();
