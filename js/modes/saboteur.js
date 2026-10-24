/* 矮人礦坑（Saboteur）：單機傳遞發身分＋三輪金塊記錄。可選基本版（照人數配礦工與破壞者）或擴展（15 張身分隨機發）。
   每輪發完身分照實體牌玩，結束時按「公布身分」，再替每個人加金塊；三輪後依金塊排名。
   進行中的局存在 localStorage。畫面沿用誰是臥底的 uc-* 樣式與卡卡頌的計分列。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).saboteur = (() => {
  // 基本版：人數 → [破壞者, 礦工]（洗勻後每人一張，多一張不用）
  const BASE = { 3: [1, 3], 4: [1, 4], 5: [2, 4], 6: [2, 5], 7: [3, 5], 8: [3, 6], 9: [3, 7], 10: [4, 7] };
  const HAND = n => n <= 5 ? 6 : n <= 7 ? 5 : 4;
  // 擴展：15 張身分全部洗勻，每人一張
  const EXP = [...Array(4).fill('G'), ...Array(4).fill('B'), 'K', 'P', 'E', 'E', 'S', 'S', 'S'];
  const T = {
    zh: {
      edition: '版本', base: '基本版', exp: '擴展', players: '人數', start: '開始發身分', round: '第 {0} 輪',
      baseInfo: '{0} 個破壞者、{1} 個礦工，洗勻每人一張（多一張不用）；手牌每人 {2} 張',
      expInfo: '15 張身分洗勻每人一張，其餘不用；手牌每人 6 張；每輪開始先蓋掉 10 張牌不用',
      handTo: '請把手機交給 {0} 號', peek: '我是 {0} 號，看我的身分', yourRole: '{0} 號，你的身分是', gotIt: '記住了，蓋起來',
      allSeen: '所有人都看過了，開始挖礦！', play: '照實體牌玩這一輪。結束時（挖到金塊，或大家都出不了牌）按下面公布身分',
      reveal: '這輪結束，公布身分', revealSure: '確定公布？再按一次', roles: '這輪的身分', gold: '金塊（三輪累計）',
      next: '下一輪', final: '最後名次', again: '再來一場', settings: '改設定',
      redeal: '重新發身分', redealSure: '確定重發？再按一次', quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次',
      D: '礦工', S: '破壞者', G: '綠隊礦工', B: '藍隊礦工', K: '老大', P: '投機者', E: '地質學家',
      goalD: '把通道從起點挖到藏金塊的終點卡。', goalS: '阻止礦工挖到金塊：讓牌出完時通道還沒接到金塊。',
      goalG: '綠隊的人把通道接到金塊，而且路上沒有藍色的門。', goalB: '藍隊的人把通道接到金塊，而且路上沒有綠色的門。',
      goalK: '綠隊或藍隊贏你都贏，但分金塊比別人少 1。', goalP: '礦工贏或破壞者贏你都贏，但分金塊比別人少 2。',
      goalE: '不靠挖到金塊：通道上看得到幾顆水晶就拿幾塊金塊（兩個地質學家平分，無條件捨去）。',
      payBase: '礦工贏：翻開跟人數一樣多的金塊卡，挖到的人先挑一張，再逆時針輪流給其他礦工挑。破壞者贏：1 個破壞者拿 4 塊，2～3 個各 3 塊，4 個各 2 塊。',
      payExp: '贏的人平分金塊，數量照盒內表格；老大少 1、投機者少 2；地質學家照水晶數；最後處理偷竊卡。被困住的人不算贏家。',
    },
    en: {
      edition: 'Edition', base: 'Base game', exp: 'Expansion', players: 'Players', start: 'Deal roles', round: 'Round {0}',
      baseInfo: '{0} Saboteurs and {1} Gold-Diggers, shuffled and one dealt to each (one left over); {2} cards per hand',
      expInfo: 'Shuffle the 15 roles and deal one each; the rest are unused. 6 cards per hand; set aside 10 cards each round',
      handTo: 'Hand the phone to player {0}', peek: "I'm player {0}, show my role", yourRole: 'Player {0}, your role is', gotIt: 'Got it, hide it',
      allSeen: 'Everyone has seen their role — start digging!', play: 'Play the round with the real cards. When it ends (gold reached, or nobody can play), reveal the roles below',
      reveal: 'Round over — reveal roles', revealSure: 'Reveal? Tap again', roles: 'Roles this round', gold: 'Gold (all three rounds)',
      next: 'Next round', final: 'Final ranking', again: 'Play again', settings: 'Change settings',
      redeal: 'Deal roles again', redealSure: 'Deal again? Tap again', quit: 'Start over (change players)', quitSure: 'Start over? Tap again',
      D: 'Gold-Digger', S: 'Saboteur', G: 'Green Gold-Digger', B: 'Blue Gold-Digger', K: 'Boss', P: 'Profiteer', E: 'Geologist',
      goalD: 'Dig a tunnel from the start to the goal card with the gold.', goalS: 'Stop the Gold-Diggers: the cards run out before the tunnel reaches the gold.',
      goalG: 'Green wins if a green player connects to the gold with no blue door on the way.', goalB: 'Blue wins if a blue player connects to the gold with no green door on the way.',
      goalK: 'You win whenever Green or Blue wins, but get 1 less gold.', goalP: 'You win whether the Gold-Diggers or the Saboteurs win, but get 2 less gold.',
      goalE: 'You don\'t need the gold: take 1 gold per visible crystal in the tunnels (two Geologists split it, rounded down).',
      payBase: 'Gold-Diggers win: reveal as many gold cards as players; the one who reached the gold picks first, then the others in turn counter-clockwise. Saboteurs win: 1 Saboteur gets 4, 2–3 get 3 each, 4 get 2 each.',
      payExp: 'Winners share the gold per the table in the box; Boss gets 1 less, Profiteer 2 less; Geologists by crystals; then Theft cards resolve. Trapped players don\'t count as winners.',
    },
    ja: {
      edition: '版', base: '基本', exp: '拡張', players: '人数', start: '役職を配る', round: '第 {0} ラウンド',
      baseInfo: 'お邪魔者 {0}、金鉱掘り {1}。混ぜて 1 枚ずつ（1 枚余る）。手札は各 {2} 枚',
      expInfo: '役職 15 枚を混ぜて 1 枚ずつ、残りは使わない。手札は各 6 枚。毎ラウンド最初に 10 枚を除けておく',
      handTo: 'スマホを {0} 番に渡してください', peek: '{0} 番です、役職を見る', yourRole: '{0} 番、あなたの役職は', gotIt: '覚えた、隠す',
      allSeen: '全員見終わりました。掘り始めよう！', play: 'このラウンドは実物のカードで遊ぶ。終わったら（金にたどり着くか、誰も出せない）下で役職を公開',
      reveal: 'ラウンド終了、役職を公開', revealSure: '公開する？もう一度タップ', roles: 'このラウンドの役職', gold: '金塊（3 ラウンド累計）',
      next: '次のラウンド', final: '最終順位', again: 'もう一回', settings: '設定を変える',
      redeal: '役職を配り直す', redealSure: '配り直す？もう一度タップ', quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ',
      D: '金鉱掘り', S: 'お邪魔者', G: '緑の金鉱掘り', B: '青の金鉱掘り', K: 'ボス', P: '強欲者', E: '地質学者',
      goalD: 'スタートから金のあるゴールまで道をつなぐ。', goalS: '金鉱掘りを邪魔する：カードが尽きるまで金に届かせない。',
      goalG: '緑の誰かが金につなぎ、途中に青い扉がなければ勝ち。', goalB: '青の誰かが金につなぎ、途中に緑の扉がなければ勝ち。',
      goalK: '緑か青が勝てば勝ち。ただし金は 1 少ない。', goalP: '金鉱掘りでもお邪魔者でも勝てば勝ち。ただし金は 2 少ない。',
      goalE: '金に届かなくてよい：見えている水晶 1 つにつき金 1（地質学者 2 人なら山分け、切り捨て）。',
      payBase: '金鉱掘りの勝ち：人数分の金カードを公開し、たどり着いた人から 1 枚ずつ反時計回りに金鉱掘りで選ぶ。お邪魔者の勝ち：1 人なら 4、2〜3 人なら各 3、4 人なら各 2。',
      payExp: '勝者は箱の表に従って金を分ける。ボスは 1 少なく、強欲者は 2 少ない。地質学者は水晶の数。最後に泥棒カード。閉じ込められた人は勝者にならない。',
    },
  };

  let el, ctx, S, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('sab.state', S);
  const cfg = () => Object.assign({ n: 5, ed: 'base' }, ctx.store.get('sab.cfg', {}));
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const minN = ed => ed === 'exp' ? 2 : 3, maxN = ed => ed === 'exp' ? 12 : 10;
  const bad = r => r === 'S';

  function dealRoles(n, ed) {
    const pool = ed === 'exp' ? shuffle([...EXP]) : shuffle([...Array(BASE[n][0]).fill('S'), ...Array(BASE[n][1]).fill('D')]);
    return pool.slice(0, n);
  }
  function deal(keepGold) {
    const c = cfg();
    const gold = keepGold && S ? S.gold : Array(c.n).fill(0);
    const round = keepGold && S ? S.round + 1 : 1;
    S = { phase: 'deal', ed: c.ed, round, cur: 0, shown: false, roles: dealRoles(c.n, c.ed), gold };
    save(); render();
  }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;
  const foot = () => `<p class="uc-foot">${btn('redeal', t(armed === 'redeal' ? 'redealSure' : 'redeal'), 'link')}${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
  const goldPanel = () => `<div class="uc-card"><p class="uc-tip">${ctx.esc(t('gold'))}</p>${S.gold.map((g, i) => `<div class="uc-row"><span>${i + 1}</span><div class="uc-step"><button data-act="gdec" data-i="${i}"${g <= 0 ? ' disabled' : ''}>−</button><b>${g}</b><button data-act="ginc" data-i="${i}">＋</button></div></div>`).join('')}</div>`;

  function render() {
    const e = ctx.esc;
    let h = '';
    if (!S) {
      const c = cfg();
      h = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('edition'))}</span><div class="seg">${btn('ed', t('base'), c.ed === 'base' ? 'on' : '', ' data-v="base"')}${btn('ed', t('exp'), c.ed === 'exp' ? 'on' : '', ' data-v="exp"')}</div></div>
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, minN(c.ed), maxN(c.ed))}</div>
        <p class="uc-tip">${e(c.ed === 'exp' ? t('expInfo') : t('baseInfo', BASE[c.n][0], BASE[c.n][1], HAND(c.n)))}</p>
        ${btn('start', t('start'), 'big')}</div>`;
    } else if (S.phase === 'deal') {
      const n = S.cur + 1, r = S.roles[S.cur];
      if (!S.shown) h = `<div class="uc-card uc-pass"><p class="uc-round">${e(t('round', S.round))}</p><p class="uc-big">${e(t('handTo', n))}</p>${btn('peek', t('peek', n), 'big')}</div>`;
      else h = `<div class="uc-card uc-word"><p class="uc-tip">${e(t('yourRole', n))}</p><p class="uc-huge">${e(t(r))}</p><p class="uc-tip">${e(t('goal' + r))}</p>${btn('hide', t('gotIt'), 'big')}</div>`;
      h += `<p class="uc-progress">${S.roles.map((_, i) => `<i class="${i < S.cur ? 'done' : i === S.cur ? 'on' : ''}"></i>`).join('')}</p>` + foot();
    } else if (S.phase === 'play') {
      h = `<div class="uc-card"><p class="uc-round">${e(t('round', S.round))}</p><p class="uc-big">${e(t('allSeen'))}</p><p class="uc-tip">${e(t('play'))}</p>
        ${btn('reveal', t(armed === 'reveal' ? 'revealSure' : 'reveal'), 'big')}</div>` + foot();
    } else if (S.phase === 'reveal') {
      h = `<div class="uc-card"><p class="uc-round">${e(t('round', S.round))}・${e(t('roles'))}</p></div>
        <ul class="uc-list">${S.roles.map((r, i) => `<li class="${bad(r) ? 'uc' : ''}"><b>${i + 1}</b><span>${e(t(r))}</span><span></span><small></small></li>`).join('')}</ul>
        <p class="uc-tip">${e(t(S.ed === 'exp' ? 'payExp' : 'payBase'))}</p>
        ${goldPanel()}
        <div class="uc-confirm">${S.round < 3 ? btn('next', t('next'), 'big') : btn('final', t('final'), 'big')}</div>`;
    } else if (S.phase === 'end') {
      const order = S.gold.map((g, i) => ({ g, i })).sort((a, b) => b.g - a.g);
      h = `<div class="uc-card uc-end"><p class="uc-huge">${e(t('final'))}</p></div>
        <ul class="uc-list cc-rank">${order.map(x => `<li><b>${S.gold.filter(v => v > x.g).length + 1}</b><span>${x.i + 1}</span><span>${x.g}</span><small></small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('settings', t('settings'))}${btn('again', t('again'), 'big')}</div>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'saboteur') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed;
    armed = '';
    const c = cfg(), arm = k => { if (wasArmed !== k) { armed = k; render(); return true; } return false; };
    switch (act) {
      case 'ed': c.ed = b.dataset.v; c.n = Math.min(maxN(c.ed), Math.max(minN(c.ed), c.n)); ctx.store.set('sab.cfg', c); return render();
      case 'inc': case 'dec': c.n = Math.min(maxN(c.ed), Math.max(minN(c.ed), c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('sab.cfg', c); return render();
      case 'start': case 'again': S = null; return deal(false);
      case 'peek': S.shown = true; break;
      case 'hide': S.shown = false; if (S.cur < S.roles.length - 1) S.cur++; else S.phase = 'play'; break;
      case 'reveal': if (arm('reveal')) return; S.phase = 'reveal'; break;
      case 'ginc': S.gold[+b.dataset.i]++; break;
      case 'gdec': S.gold[+b.dataset.i] = Math.max(0, S.gold[+b.dataset.i] - 1); break;
      case 'next': return deal(true);
      case 'final': S.phase = 'end'; break;
      case 'redeal': if (arm('redeal')) return; S.roles = dealRoles(S.roles.length, S.ed); S.cur = 0; S.shown = false; S.phase = 'deal'; break;
      case 'quit': if (arm('quit')) return; S = null; break;
      case 'settings': S = null; break;
    }
    save(); render();
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'saboteur';
      S = ctx.store.get('sab.state', null);
      if (S && S.shown) { S.shown = false; save(); }   // 重開時先蓋回去
      render();
    },
  };
})();
