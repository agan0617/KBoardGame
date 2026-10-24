/* 波多黎各：開局準備表＋最後算分。選人數就列出這個人數的準備；遊戲結束時每人輸入分數籌碼、建築分、大建築加分，算總分排名。
   輸入的數字存在 localStorage，App 被關掉或重新整理也還在。畫面沿用誰是臥底與卡卡頌的樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).puertorico = (() => {
  // 依人數的準備（基本版規則）
  const SETUP = {
    3: { vp: 75, col: 55, ship: 3, money: 2, ships: '4・5・6', roles: 6, pro: 0, farm: ['indigo', 'indigo', 'corn'] },
    4: { vp: 100, col: 75, ship: 4, money: 3, ships: '5・6・7', roles: 7, pro: 1, farm: ['indigo', 'indigo', 'corn', 'corn'] },
    5: { vp: 122, col: 95, ship: 5, money: 4, ships: '6・7・8', roles: 8, pro: 2, farm: ['indigo', 'indigo', 'indigo', 'corn', 'corn'] },
  };
  const T = {
    zh: {
      players: '人數', setup: '{0} 人的準備', vp: '分數籌碼', col: '殖民者（供應區）', ship: '殖民船上', money: '每人起始金幣',
      ships: '貨船容量', roles: '角色', rolesN: '{0} 張（淘金者 {1} 張）', farm: '起始農場（照座位，總督先）', farmTip: '總督（起始玩家）拿第一個，順時針往下',
      indigo: '藍染', corn: '玉米', plantTiles: '翻開的農場板', plantN: '人數 + 1 塊',
      score: '最後算分', chips: '分數籌碼', bld: '建築分', big: '大建築加分', total: '總分', p: '玩家 {0}',
      tie: '同分比金幣＋貨物總數，多的人贏', clear: '清空分數', clearSure: '確定清空？再按一次', place: '第 {0} 名',
    },
    en: {
      players: 'Players', setup: 'Setup for {0} players', vp: 'VP chips', col: 'Colonists (supply)', ship: 'On the colonist ship', money: 'Starting doubloons each',
      ships: 'Cargo ships', roles: 'Roles', rolesN: '{0} cards ({1} Prospector)', farm: 'Starting plantations (by seat, governor first)', farmTip: 'The governor (start player) takes the first one, then clockwise',
      indigo: 'Indigo', corn: 'Corn', plantTiles: 'Face-up plantation tiles', plantN: 'players + 1',
      score: 'Final scoring', chips: 'VP chips', bld: 'Building VP', big: 'Large building bonus', total: 'Total', p: 'Player {0}',
      tie: 'Ties: most doubloons plus goods wins', clear: 'Clear scores', clearSure: 'Clear? Tap again', place: '#{0}',
    },
    ja: {
      players: '人数', setup: '{0} 人の準備', vp: '勝利点チップ', col: '入植者（ストック）', ship: '入植船の上', money: '各自の初期ドゥブロン',
      ships: '貨物船の容量', roles: '役割', rolesN: '{0} 枚（金鉱掘り {1} 枚）', farm: '初期農園（席順、総督から）', farmTip: '総督（スタートプレイヤー）から時計回りに 1 つずつ',
      indigo: '藍', corn: 'トウモロコシ', plantTiles: '表向きの農園タイル', plantN: '人数 + 1 枚',
      score: '最終得点', chips: '勝利点チップ', bld: '建物の点', big: '大建物のボーナス', total: '合計', p: 'プレイヤー {0}',
      tie: '同点ならドゥブロンと商品の合計が多い人の勝ち', clear: '得点を消す', clearSure: '消す？もう一度タップ', place: '{0} 位',
    },
  };

  let el, ctx, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const cfg = () => Object.assign({ n: 4 }, ctx.store.get('pr.cfg', {}));
  const scores = () => ctx.store.get('pr.scores', {});
  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;
  const KEYS = ['chips', 'bld', 'big'];
  const totalOf = s => KEYS.reduce((a, k) => a + (+s?.[k] || 0), 0);

  function render() {
    const e = ctx.esc, c = cfg(), s = SETUP[c.n], sc = scores();
    const row = (k, v) => `<div class="uc-row"><span>${e(t(k))}</span><b>${e(String(v))}</b></div>`;
    const totals = Array.from({ length: c.n }, (_, i) => totalOf(sc[i]));
    const rankOf = v => totals.filter(x => x > v).length + 1;
    el.innerHTML = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 3, 5)}</div>
        <p class="uc-round">${e(t('setup', c.n))}</p>
        ${row('vp', s.vp)}${row('col', s.col)}${row('ship', s.ship)}${row('money', s.money)}${row('ships', s.ships)}
        ${row('roles', t('rolesN', s.roles, s.pro))}${row('plantTiles', t('plantN'))}
        <p class="uc-tip">${e(t('farm'))}</p>
        <p class="uc-big">${s.farm.map((f, i) => `${i + 1}. ${e(t(f))}`).join('　')}</p>
        <p class="uc-tip">${e(t('farmTip'))}</p>
      </div>
      <div class="uc-card"><p class="uc-round">${e(t('score'))}</p>
        <div class="pr-grid"><span></span>${KEYS.map(k => `<small>${e(t(k))}</small>`).join('')}<small>${e(t('total'))}</small>
        ${Array.from({ length: c.n }, (_, i) => `<span>${e(t('p', i + 1))}</span>${KEYS.map(k => `<input type="number" inputmode="numeric" min="0" data-i="${i}" data-k="${k}" value="${e(String(sc[i]?.[k] ?? ''))}">`).join('')}<b>${totals[i]}${totals.some(x => x) ? `<small>${e(t('place', rankOf(totals[i])))}</small>` : ''}</b>`).join('')}
        </div>
        <p class="uc-tip">${e(t('tie'))}</p>
      </div>
      <p class="uc-foot">${btn('clear', t(armed === 'clear' ? 'clearSure' : 'clear'), 'link')}</p>`;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'puertorico') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed;
    armed = '';
    if (act === 'inc' || act === 'dec') { const c = cfg(); c.n = Math.min(5, Math.max(3, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('pr.cfg', c); }
    if (act === 'clear') { if (wasArmed !== 'clear') armed = 'clear'; else ctx.store.set('pr.scores', {}); }
    render();
  }
  function onInput(ev) {
    if (el.dataset.mode !== 'puertorico') return;
    const x = ev.target; if (!x.dataset || x.dataset.k == null) return;
    const sc = scores(), i = x.dataset.i;
    sc[i] = Object.assign({}, sc[i], { [x.dataset.k]: x.value === '' ? '' : Math.max(0, +x.value || 0) });
    ctx.store.set('pr.scores', sc);
    // 只更新總分那一格，不整頁重畫，輸入框才不會跳掉
    const c = cfg(), totals = Array.from({ length: c.n }, (_, j) => totalOf(sc[j]));
    el.querySelectorAll('.pr-grid > b').forEach((b, j) => {
      const rank = totals.filter(v => v > totals[j]).length + 1;
      b.innerHTML = `${totals[j]}${totals.some(v => v) ? `<small>${ctx.esc(t('place', rank))}</small>` : ''}`;
    });
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); el.addEventListener('input', onInput); }
      el.dataset.mode = 'puertorico';
      render();
    },
  };
})();
