/* 卡卡頌：計分板。選人數與顏色，遊戲中點一個人再點分數加上去，每一筆記在下面、可以復原；
   分數超過 50 標出計分軌繞了幾圈（實體計分軌只到 49）。底下有計分速查。
   進行中的局存在 localStorage，App 被關掉或重新整理也接得回來。畫面沿用誰是臥底的 uc-* 樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).carcassonne = (() => {
  const COLORS = [
    { id: 'yellow', hex: '#e8c13a' }, { id: 'red', hex: '#d9534f' }, { id: 'green', hex: '#4caf50' },
    { id: 'blue', hex: '#3f7fd0' }, { id: 'black', hex: '#3a3a3a' }, { id: 'gray', hex: '#9e9e9e' },
  ];
  const T = {
    zh: {
      players: '人數', p6: '6 人要用旅館與大教堂的第 6 色棋子', start: '開始計分', pick: '先點一個人，再點分數',
      yellow: '黃', red: '紅', green: '綠', blue: '藍', black: '黑', gray: '灰',
      lap: '繞 {0} 圈', minus: '−1', undo: '復原上一筆', end: '結束遊戲', endSure: '確定結束？再按一次',
      quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次', log: '紀錄', none: '還沒有分數',
      result: '最後名次', again: '再來一局', settings: '改設定', place: '第 {0} 名',
      cheat: '計分速查',
      cheatBody: [
        '完成時：道路每片 1 分；城堡每片 2 分＋盾徽各 2 分；修道院被 8 片圍滿 9 分',
        '遊戲結束時（沒完成的）：道路每片 1 分；城堡每片 1 分＋盾徽各 1 分；修道院 1 分＋周圍每片 1 分',
        '草地（遊戲結束才算）：草地碰到的每座「已完成」城堡 3 分',
        '同一個區塊比誰的棋子多，最多的人都拿全分；平手一起拿',
        '旅館：完成的道路每片 2 分，沒完成 0 分。大教堂：完成的城堡每片 3 分（盾徽也 3 分），沒完成 0 分',
        '貨物：遊戲結束時酒、麥、布各自最多的人 10 分（平手都拿）',
        '豬：同一塊草地有你的豬，每座城堡 4 分',
        '仙子：回合開始時仙子在你的棋子旁 +1；那個棋子所在的區塊計分時 +3',
      ],
    },
    en: {
      players: 'Players', p6: 'Six players need the 6th color from Inns & Cathedrals', start: 'Start scoring', pick: 'Tap a player, then tap points',
      yellow: 'Yellow', red: 'Red', green: 'Green', blue: 'Blue', black: 'Black', gray: 'Gray',
      lap: 'lap {0}', minus: '−1', undo: 'Undo last', end: 'End game', endSure: 'End game? Tap again',
      quit: 'Start over (change players)', quitSure: 'Start over? Tap again', log: 'Log', none: 'No points yet',
      result: 'Final ranking', again: 'Play again', settings: 'Change settings', place: '#{0}',
      cheat: 'Scoring cheat sheet',
      cheatBody: [
        'Completed: road 1 per tile; city 2 per tile + 2 per shield; cloister surrounded by 8 tiles 9',
        'Game end (incomplete): road 1 per tile; city 1 per tile + 1 per shield; cloister 1 + 1 per surrounding tile',
        'Fields (game end only): 3 for each completed city the field touches',
        'Whoever has the most meeples on a feature scores it in full; ties all score',
        'Inn: completed road 2 per tile, incomplete 0. Cathedral: completed city 3 per tile (and per shield), incomplete 0',
        'Goods: at game end, most wine, grain and cloth each scores 10 (ties all score)',
        'Pig: with your pig in a field, each city is worth 4',
        'Fairy: +1 at the start of your turn if next to your meeple; +3 when that meeple’s feature scores',
      ],
    },
    ja: {
      players: '人数', p6: '6 人は「宿屋と大聖堂」の 6 色目のコマを使う', start: '得点を記録', pick: '人をタップしてから点数をタップ',
      yellow: '黄', red: '赤', green: '緑', blue: '青', black: '黒', gray: '灰',
      lap: '{0} 周', minus: '−1', undo: '1 つ戻す', end: 'ゲーム終了', endSure: '終了する？もう一度タップ',
      quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ', log: '記録', none: 'まだ得点なし',
      result: '最終順位', again: 'もう一回', settings: '設定を変える', place: '{0} 位',
      cheat: '得点早見表',
      cheatBody: [
        '完成時：道は 1 枚 1 点、都市は 1 枚 2 点＋紋章 1 つ 2 点、修道院は周り 8 枚で 9 点',
        'ゲーム終了時（未完成）：道 1 枚 1 点、都市 1 枚 1 点＋紋章 1 点、修道院 1 点＋周りのタイル 1 枚 1 点',
        '草原（終了時のみ）：接している「完成した」都市 1 つにつき 3 点',
        '同じ場所はコマが多い人が満点。同数なら全員',
        '宿屋：完成した道は 1 枚 2 点、未完成は 0 点。大聖堂：完成した都市は 1 枚 3 点（紋章も 3 点）、未完成は 0 点',
        '交易品：終了時、ワイン・小麦・布それぞれ最多の人が 10 点（同数は全員）',
        '豚：自分の豚がいる草原は都市 1 つ 4 点',
        '妖精：手番の最初に自分のコマの隣なら +1、そのコマの場所が得点したら +3',
      ],
    },
  };

  let el, ctx, S, armed = '', sel = -1;
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('carc.state', S);
  const cfg = () => Object.assign({ n: 4 }, ctx.store.get('carc.cfg', {}));
  const POINTS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12];

  function start() {
    const n = cfg().n;
    S = { phase: 'play', players: COLORS.slice(0, n).map(c => ({ color: c.id, score: 0 })), log: [] };
    sel = -1; save(); render();
  }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const dot = id => `<i class="cc-dot" style="background:${COLORS.find(c => c.id === id).hex}"></i>`;
  const lapOf = s => s >= 50 ? ` <small>${ctx.esc(t('lap', Math.floor(s / 50)))}・${s % 50}</small>` : '';
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;
  const cheat = () => `<details class="uc-card cc-cheat"><summary>${ctx.esc(t('cheat'))}</summary><ul>${T[ctx.lang] ? T[ctx.lang].cheatBody.map(x => `<li>${ctx.esc(x)}</li>`).join('') : ''}</ul></details>`;

  function render() {
    const e = ctx.esc;
    let h = '';
    if (!S || S.phase === 'setup') {
      const c = cfg();
      h = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 2, 6)}</div>
        <p class="uc-big">${COLORS.slice(0, c.n).map(x => dot(x.id) + e(t(x.id))).join('　')}</p>
        ${c.n === 6 ? `<p class="uc-tip">${e(t('p6'))}</p>` : ''}
        ${btn('start', t('start'), 'big')}
      </div>` + cheat();
    } else if (S.phase === 'play') {
      h = `<div class="uc-card cc-board">${S.players.map((p, i) => `<button class="cc-row${sel === i ? ' on' : ''}" data-act="sel" data-i="${i}">${dot(p.color)}<span>${e(t(p.color))}</span><b>${p.score}${lapOf(p.score)}</b></button>`).join('')}</div>
        <p class="uc-tip">${e(t('pick'))}</p>
        <div class="cc-pad">${POINTS.map(v => btn('add', '+' + v, '', ` data-v="${v}"${sel < 0 ? ' disabled' : ''}`)).join('')}${btn('add', t('minus'), '', ` data-v="-1"${sel < 0 ? ' disabled' : ''}`)}</div>
        <div class="uc-confirm">${btn('undo', t('undo'), '', S.log.length ? '' : ' disabled')}${btn('end', t(armed === 'end' ? 'endSure' : 'end'), 'big')}</div>
        <div class="uc-card cc-log"><p class="uc-tip">${e(t('log'))}</p>${S.log.length ? `<p>${S.log.slice(-12).reverse().map(x => `<span class="cc-entry">${dot(S.players[x.i].color)}${x.v > 0 ? '+' : ''}${x.v}</span>`).join('　')}</p>` : `<p class="uc-tip">${e(t('none'))}</p>`}</div>
        ${cheat()}
        <p class="uc-foot">${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
    } else if (S.phase === 'end') {
      const rank = S.players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score);
      h = `<div class="uc-card uc-end"><p class="uc-huge">${e(t('result'))}</p></div>
        <ul class="uc-list cc-rank">${rank.map(p => `<li><b>${rank.findIndex(x => x.score === p.score) + 1}</b><span>${dot(p.color)}${e(t(p.color))}</span><span>${p.score}</span><small></small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('settings', t('settings'))}${btn('again', t('again'), 'big')}</div>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'carcassonne') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    const wasArmed = armed;
    armed = '';
    switch (act) {
      case 'inc': case 'dec': {
        const c = cfg();
        c.n = Math.min(6, Math.max(2, c.n + (act === 'inc' ? 1 : -1)));
        ctx.store.set('carc.cfg', c); render(); return;
      }
      case 'start': case 'again': start(); return;
      case 'sel': sel = sel === +b.dataset.i ? -1 : +b.dataset.i; break;
      case 'add': if (sel >= 0) {   // 記實際加減的分數（扣到 0 為止），復原才對得上
        const p = S.players[sel], d = Math.max(0, p.score + +b.dataset.v) - p.score;
        if (d) { p.score += d; S.log.push({ i: sel, v: d }); }
      } break;
      case 'undo': { const x = S.log.pop(); if (x) S.players[x.i].score = Math.max(0, S.players[x.i].score - x.v); break; }
      case 'end': if (wasArmed !== 'end') { armed = 'end'; render(); return; } S.phase = 'end'; sel = -1; break;
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; render(); return; } S = null; sel = -1; break;
      case 'settings': S = null; break;
    }
    save(); render();
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'carcassonne';
      S = ctx.store.get('carc.state', null);
      render();
    },
  };
})();
