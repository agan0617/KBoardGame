/* 富饒之城（Citadels）：最後算分。每人填建築費用總和、勾五色齊全、先蓋完城市、蓋完城市，加特殊建築加分，算總分排名。
   數字存在 localStorage，App 被關掉或重新整理也還在。畫面沿用波多黎各算分的樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).citadels = (() => {
  const T = {
    zh: {
      players: '人數', p: '{0} 號', cost: '建築費用', five: '五色', first: '先完成', done: '完成', purple: '紫色加分', total: '總分',
      tip: '建築費用＝城裡每座建築的費用加總；五色齊全 +3；第一個蓋完城市 +4，其他也蓋完的 +2；紫色建築的額外分自己填',
      tie: '同分比最後一輪拿的角色號碼，大的贏', clear: '清空分數', clearSure: '確定清空？再按一次', place: '第 {0} 名',
    },
    en: {
      players: 'Players', p: 'P{0}', cost: 'Districts', five: '5 colors', first: 'First', done: 'Done', purple: 'Purple', total: 'Total',
      tip: 'Districts = sum of the costs of your districts; all five colors +3; first to complete the city +4, others who completed +2; enter purple bonuses yourself',
      tie: 'Ties: higher character number in the last round wins', clear: 'Clear scores', clearSure: 'Clear? Tap again', place: '#{0}',
    },
    ja: {
      players: '人数', p: '{0} 番', cost: '建物', five: '5 色', first: '最初', done: '完成', purple: '紫', total: '合計',
      tip: '建物＝自分の町の建物のコスト合計。5 色そろって +3、最初に町を完成 +4、他に完成した人 +2。紫の建物のボーナスは自分で入力',
      tie: '同点なら最後のラウンドのキャラクター番号が大きい方の勝ち', clear: '得点を消す', clearSure: '消す？もう一度タップ', place: '{0} 位',
    },
  };
  let el, ctx, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const cfg = () => Object.assign({ n: 5 }, ctx.store.get('cit.cfg', {}));
  const data = () => ctx.store.get('cit.scores', {});
  const totalOf = s => (+s?.cost || 0) + (s?.five ? 3 : 0) + (s?.first ? 4 : s?.done ? 2 : 0) + (+s?.purple || 0);
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;

  function totalsHtml(n, d) {
    const tot = Array.from({ length: n }, (_, i) => totalOf(d[i])), any = tot.some(v => v);
    return tot.map(v => `${v}${any ? `<small>${ctx.esc(t('place', tot.filter(x => x > v).length + 1))}</small>` : ''}`);
  }
  function render() {
    const e = ctx.esc, c = cfg(), d = data(), tots = totalsHtml(c.n, d);
    const num = (i, k) => `<input type="number" inputmode="numeric" min="0" data-i="${i}" data-k="${k}" value="${e(String(d[i]?.[k] ?? ''))}">`;
    const chk = (i, k) => `<label class="ci-chk"><input type="checkbox" data-i="${i}" data-k="${k}"${d[i]?.[k] ? ' checked' : ''}></label>`;
    el.innerHTML = `<div class="uc-card"><div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 2, 8)}</div>
      <p class="uc-tip">${e(t('tip'))}</p>
      <div class="pr-grid ci-grid"><span></span><small>${e(t('cost'))}</small><small>${e(t('five'))}</small><small>${e(t('first'))}</small><small>${e(t('done'))}</small><small>${e(t('purple'))}</small><small>${e(t('total'))}</small>
      ${Array.from({ length: c.n }, (_, i) => `<span>${e(t('p', i + 1))}</span>${num(i, 'cost')}${chk(i, 'five')}${chk(i, 'first')}${chk(i, 'done')}${num(i, 'purple')}<b>${tots[i]}</b>`).join('')}</div>
      <p class="uc-tip">${e(t('tie'))}</p></div>
      <p class="uc-foot"><button class="link" data-act="clear">${e(t(armed === 'clear' ? 'clearSure' : 'clear'))}</button></p>`;
  }
  function onClick(ev) {
    if (el.dataset.mode !== 'citadels') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === 'inc' || act === 'dec') { const c = cfg(); c.n = Math.min(8, Math.max(2, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('cit.cfg', c); armed = ''; }
    if (act === 'clear') { if (armed !== 'clear') armed = 'clear'; else { armed = ''; ctx.store.set('cit.scores', {}); } }
    render();
  }
  function onChange(ev) {
    if (el.dataset.mode !== 'citadels') return;
    const x = ev.target; if (!x.dataset || x.dataset.k == null) return;
    const d = data(), i = x.dataset.i, k = x.dataset.k;
    d[i] = Object.assign({}, d[i], { [k]: x.type === 'checkbox' ? x.checked : (x.value === '' ? '' : Math.max(0, +x.value || 0)) });
    if (x.type === 'checkbox' && x.checked && k === 'first') { for (const j in d) if (j !== i && d[j]) d[j].first = false; d[i].done = true; }   // 先完成只有一個人，而且一定也算完成
    ctx.store.set('cit.scores', d);
    if (x.type === 'checkbox') return render();
    const tots = totalsHtml(cfg().n, d);   // 數字輸入只更新總分，不整頁重畫，輸入框才不會跳掉
    el.querySelectorAll('.ci-grid > b').forEach((b, j) => b.innerHTML = tots[j]);
  }
  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); el.addEventListener('input', onChange); el.addEventListener('change', e => { if (e.target.type === 'checkbox') onChange(e); }); }
      el.dataset.mode = 'citadels';
      render();
    },
  };
})();
