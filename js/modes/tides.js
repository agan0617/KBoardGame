/* 運轉潮汐（Turn the Tide）：救生圈與潮位記錄＋計分。每輪開始填每人的救生圈數；每一手把拿到潮位卡的人改成新潮位，
   按「這手結算」由潮位最高的人（同分都算）丟一個救生圈，救生圈用完又輸就淘汰；一輪結束自動算分
   （剩幾個救生圈幾分、淘汰 −1、潮位最低 +1），輪數＝人數，最後排名。進行中的局存在 localStorage。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).tides = (() => {
  const T = {
    zh: {
      players: '人數', start: '開始', round: '第 {0} 輪（共 {1} 輪）', hand: '第 {0} 手', p: '{0} 號',
      lifeTip: '先填每個人這輪的救生圈數（手牌上的救生圈加總，半個無條件捨去）', lives: '救生圈', tide: '潮位',
      tideTip: '這手拿到潮位卡的兩個人，把潮位改成新拿到的那張；其他人不用動', settle: '這手結算', lost: '{0} 潮位最高，丟一個救生圈',
      out: '淘汰', endRound: '這輪結束，算分', endSure: '確定結束這輪？再按一次', got: '這輪得分', total: '總分',
      next: '下一輪（手牌和救生圈傳給左邊）', final: '最後名次', place: '第 {0} 名', again: '再來一場',
      undo: '復原上一手', quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次', two: '只剩兩個人，這輪直接結束',
    },
    en: {
      players: 'Players', start: 'Start', round: 'Round {0} of {1}', hand: 'Hand {0}', p: 'P{0}',
      lifeTip: 'First set each player\'s life preservers for this round (from their hand, halves rounded down)', lives: 'Lives', tide: 'Tide',
      tideTip: 'The two players who took tide cards this hand: set their tide to the new card. Leave the others', settle: 'Resolve hand', lost: '{0} has the highest tide and loses a life preserver',
      out: 'Out', endRound: 'End round and score', endSure: 'End this round? Tap again', got: 'This round', total: 'Total',
      next: 'Next round (pass hands and preservers left)', final: 'Final ranking', place: '#{0}', again: 'Play again',
      undo: 'Undo last hand', quit: 'Start over (change players)', quitSure: 'Start over? Tap again', two: 'Only two players left — the round ends now',
    },
    ja: {
      players: '人数', start: '開始', round: '第 {0} ラウンド（全 {1} ラウンド）', hand: '第 {0} 手', p: '{0} 番',
      lifeTip: 'まずこのラウンドの各自の浮き輪の数を入れる（手札の浮き輪の合計、半分は切り捨て）', lives: '浮き輪', tide: '潮位',
      tideTip: 'この手で潮位カードを取った 2 人だけ、新しいカードの数字に変える', settle: 'この手を精算', lost: '{0} の潮位が一番高い、浮き輪を 1 つ失う',
      out: '脱落', endRound: 'ラウンド終了、得点計算', endSure: '終了する？もう一度タップ', got: 'このラウンド', total: '合計',
      next: '次のラウンド（手札と浮き輪を左へ）', final: '最終順位', place: '{0} 位', again: 'もう一回',
      undo: '1 手戻す', quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ', two: '残り 2 人なのでラウンド終了',
    },
  };

  let el, ctx, S, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('ttt.state', S);
  const cfg = () => Object.assign({ n: 4 }, ctx.store.get('ttt.cfg', {}));
  const snap = () => JSON.stringify({ lives: S.lives, tide: S.tide, out: S.out, handNo: S.handNo, msg: S.msg });

  function newRound(round) {
    const n = S ? S.total.length : cfg().n;
    S = { total: S ? S.total : Array(n).fill(0), round, lives: Array(n).fill(4), tide: Array(n).fill(0), out: Array(n).fill(false), handNo: 1, hist: [], phase: 'play', msg: '', got: null };
    save(); render();
  }

  // 這手結算：場上潮位最高的人（同分都算）丟一個救生圈；已經 0 個又要丟就淘汰
  function settle() {
    S.hist.push(snap());
    const live = S.tide.map((v, i) => S.out[i] ? -1 : v), top = Math.max(...live), losers = [];
    if (top > 0) live.forEach((v, i) => { if (v === top) { losers.push(i); if (S.lives[i] > 0) S.lives[i]--; else S.out[i] = true; } });
    S.msg = losers.length ? t('lost', losers.map(i => t('p', i + 1)).join('、')) : '';
    S.handNo++;
    if (S.out.filter(x => !x).length <= 2 || S.handNo > 12) endRound(S.out.filter(x => !x).length <= 2);
  }
  function endRound(two) {
    const live = S.tide.map((v, i) => S.out[i] ? Infinity : v), low = Math.min(...live);
    S.got = S.lives.map((l, i) => (S.out[i] ? -1 : l) + (!S.out[i] && S.tide[i] === low ? 1 : 0));
    S.got.forEach((g, i) => S.total[i] += g);
    S.phase = 'scored'; S.msg = two ? t('two') : '';
  }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const step = (act, i, v, lo, dis) => `<div class="uc-step"><button data-act="${act}" data-d="-1" data-i="${i}"${v <= lo || dis ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="${act}" data-d="1" data-i="${i}"${dis ? ' disabled' : ''}>＋</button></div>`;

  function render() {
    const e = ctx.esc;
    if (!S) {
      const c = cfg();
      el.innerHTML = `<div class="uc-card uc-setup"><div class="uc-row"><span>${e(t('players'))}</span><div class="uc-step"><button data-act="n" data-d="-1"${c.n <= 3 ? ' disabled' : ''}>−</button><b>${c.n}</b><button data-act="n" data-d="1"${c.n >= 5 ? ' disabled' : ''}>＋</button></div></div>${btn('start', t('start'), 'big')}</div>`;
      return;
    }
    const n = S.total.length;
    if (S.phase === 'end') {
      const order = S.total.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      el.innerHTML = `<div class="uc-card uc-end"><p class="uc-huge">${e(t('final'))}</p></div>
        <ul class="uc-list cc-rank">${order.map(x => `<li><b>${S.total.filter(v => v > x.v).length + 1}</b><span>${e(t('p', x.i + 1))}</span><span>${x.v}</span><small></small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('again', t('again'), 'big')}</div>`;
      return;
    }
    const scored = S.phase === 'scored';
    el.innerHTML = `<div class="uc-card"><p class="uc-round">${e(t('round', S.round, n))}${scored ? '' : '・' + e(t('hand', S.handNo))}</p>
        <p class="uc-tip">${e(t(S.handNo === 1 && !scored ? 'lifeTip' : 'tideTip'))}</p>
        <div class="tt-grid"><span></span><small>${e(t('lives'))}</small><small>${e(t('tide'))}</small>
        ${S.lives.map((l, i) => `<span>${e(t('p', i + 1))}${S.out[i] ? ` <small class="mg-broke">${e(t('out'))}</small>` : ''}</span>${step('life', i, l, 0, scored || S.out[i])}${step('tide', i, S.tide[i], 0, scored || S.out[i])}`).join('')}</div>
        ${S.msg ? `<p class="uc-last">${e(S.msg)}</p>` : ''}
        ${scored ? `<p class="uc-tip">${e(t('got'))}：${S.got.map((g, i) => `${e(t('p', i + 1))} ${g > 0 ? '+' : ''}${g}`).join('、')}</p>${btn(S.round < n ? 'next' : 'final', t(S.round < n ? 'next' : 'final'), 'big')}`
          : `${btn('settle', t('settle'), 'big')}<div class="uc-confirm">${btn('undo', t('undo'), '', S.hist.length ? '' : ' disabled')}${btn('endRound', t(armed === 'endRound' ? 'endSure' : 'endRound'))}</div>`}
      </div>
      <div class="uc-card"><p class="uc-tip">${e(t('total'))}</p><div class="dx-total">${S.total.map((v, i) => `<div><small>${e(t('p', i + 1))}</small><b>${v}</b></div>`).join('')}</div></div>
      <p class="uc-foot">${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'tides') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed, d = +b.dataset.d, i = +b.dataset.i;
    armed = '';
    const arm = k => { if (wasArmed !== k) { armed = k; render(); return true; } return false; };
    switch (act) {
      case 'n': { const c = cfg(); c.n = Math.min(5, Math.max(3, c.n + d)); ctx.store.set('ttt.cfg', c); return render(); }
      case 'start': case 'again': S = null; return newRound(1);
      case 'life': S.lives[i] = Math.max(0, S.lives[i] + d); break;
      case 'tide': S.tide[i] = Math.min(12, Math.max(0, S.tide[i] + d)); break;
      case 'settle': settle(); break;
      case 'undo': { const x = S.hist.pop(); if (x) Object.assign(S, JSON.parse(x)); break; }
      case 'endRound': if (arm('endRound')) return; endRound(false); break;
      case 'next': return newRound(S.round + 1);
      case 'final': S.phase = 'end'; break;
      case 'quit': if (arm('quit')) return; S = null; break;
    }
    save(); render();
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'tides';
      S = ctx.store.get('ttt.state', null);
      render();
    },
  };
})();
