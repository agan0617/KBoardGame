/* 只言片語（Dixit）：算分板。每回合點每個人投給誰的牌（說書人自動輪替），按「算分」照規則加分；
   每一回合記下來、可以復原，總分到 30 提醒。進行中的局存在 localStorage。畫面沿用誰是臥底與卡卡頌的樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).dixit = (() => {
  const T = {
    zh: {
      players: '人數', start: '開始', big: '7 人以上請照說明書的多人規則出牌；算分照下面的基本規則',
      round: '第 {0} 回合', teller: '說書人：{0} 號', voteOf: '{0} 號投給', tellerMark: '說', score: '算分',
      need: '每個人都點完才能算分', all: '全部猜中，說書人 0 分，其他人各 2 分', none: '沒人猜中，說書人 0 分，其他人各 2 分',
      some: '有人猜中：說書人和猜中的人各 3 分；牌被投的人每票 1 分', p: '{0} 號', total: '總分',
      win: '{0} 號到 30 分了！', undo: '復原上一回合', quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次', last: '上一回合：',
    },
    en: {
      players: 'Players', start: 'Start', big: 'With 7+ players use the rulebook\'s large-group card play; scoring follows the basic rules below',
      round: 'Round {0}', teller: 'Storyteller: player {0}', voteOf: 'Player {0} voted for', tellerMark: 'S', score: 'Score',
      need: 'Set everyone\'s vote to score', all: 'Everyone found it: storyteller 0, everyone else 2', none: 'Nobody found it: storyteller 0, everyone else 2',
      some: 'Some found it: storyteller and finders 3 each; +1 per vote your card received', p: 'P{0}', total: 'Total',
      win: 'Player {0} reached 30!', undo: 'Undo last round', quit: 'Start over (change players)', quitSure: 'Start over? Tap again', last: 'Last round: ',
    },
    ja: {
      players: '人数', start: '開始', big: '7 人以上は説明書の多人数ルールでカードを出す。得点は下の基本ルール',
      round: '第 {0} ラウンド', teller: '語り部：{0} 番', voteOf: '{0} 番の投票先', tellerMark: '語', score: '得点計算',
      need: '全員の投票を入れると計算できる', all: '全員正解：語り部 0 点、他の全員 2 点', none: '誰も正解なし：語り部 0 点、他の全員 2 点',
      some: '一部正解：語り部と正解者 3 点、自分のカードへの投票 1 票 1 点', p: '{0} 番', total: '合計',
      win: '{0} 番が 30 点に！', undo: '1 ラウンド戻す', quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ', last: '前のラウンド：',
    },
  };

  let el, ctx, S, armed = '';
  const t = (k, ...a) => String((T[ctx.lang] || T.zh)[k]).replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('dixit.state', S);
  const cfg = () => Object.assign({ n: 5 }, ctx.store.get('dixit.cfg', {}));

  function start() { S = { n: cfg().n, score: Array(cfg().n).fill(0), teller: 0, votes: {}, rounds: [] }; save(); render(); }

  // 照基本規則算這一回合每個人得幾分
  function scoreRound(n, teller, votes) {
    const add = Array(n).fill(0), voters = [...Array(n).keys()].filter(i => i !== teller);
    const right = voters.filter(i => votes[i] === teller).length;
    let kind;
    if (right === 0 || right === voters.length) { kind = right ? 'all' : 'none'; voters.forEach(i => add[i] += 2); }
    else { kind = 'some'; add[teller] += 3; voters.forEach(i => { if (votes[i] === teller) add[i] += 3; }); }
    voters.forEach(i => { if (votes[i] !== teller) add[votes[i]] += 1; });   // 被投的牌每票 1 分（說書人的票不算這個）
    return { add, kind };
  }

  const btn = (act, label, cls = '', extra = '') => `<button class="${cls}" data-act="${act}"${extra}>${ctx.esc(label)}</button>`;
  const stepper = (v, lo, hi) => `<div class="uc-step"><button data-act="dec"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc"${v >= hi ? ' disabled' : ''}>＋</button></div>`;

  function render() {
    const e = ctx.esc;
    if (!S) {
      const c = cfg();
      el.innerHTML = `<div class="uc-card uc-setup"><div class="uc-row"><span>${e(t('players'))}</span>${stepper(c.n, 3, 12)}</div>
        ${c.n >= 7 ? `<p class="uc-tip">${e(t('big'))}</p>` : ''}${btn('start', t('start'), 'big')}</div>`;
      return;
    }
    const n = S.n, voters = [...Array(n).keys()].filter(i => i !== S.teller), ready = voters.every(i => S.votes[i] != null);
    const lead = Math.max(...S.score), winner = lead >= 30 ? S.score.indexOf(lead) : -1;
    const last = S.rounds[S.rounds.length - 1];
    el.innerHTML = `<div class="uc-card"><p class="uc-round">${e(t('round', S.rounds.length + 1))}</p><p class="uc-big">${e(t('teller', S.teller + 1))}</p>
        ${voters.map(v => `<div class="dx-vote"><span>${e(t('voteOf', v + 1))}</span><div>${[...Array(n).keys()].filter(j => j !== v).map(j => `<button data-act="vote" data-v="${v}" data-j="${j}" class="${S.votes[v] === j ? 'on' : ''}${j === S.teller ? ' teller' : ''}">${j + 1}${j === S.teller ? `<small>${e(t('tellerMark'))}</small>` : ''}</button>`).join('')}</div></div>`).join('')}
        ${btn('score', t(ready ? 'score' : 'need'), 'big', ready ? '' : ' disabled')}
      </div>
      ${winner >= 0 ? `<p class="uc-last">${e(t('win', winner + 1))}</p>` : ''}
      ${last ? `<p class="uc-tip">${e(t('last'))}${e(t(last.kind))}</p>` : ''}
      <div class="uc-card"><p class="uc-tip">${e(t('total'))}</p><div class="dx-total">${S.score.map((s, i) => `<div class="${i === S.teller ? 'teller' : ''}"><small>${e(t('p', i + 1))}</small><b>${s}</b>${last && last.add[i] ? `<em>+${last.add[i]}</em>` : ''}</div>`).join('')}</div></div>
      <div class="uc-confirm">${btn('undo', t('undo'), '', S.rounds.length ? '' : ' disabled')}</div>
      <p class="uc-foot">${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'dixit') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, wasArmed = armed;
    armed = '';
    if (!S) {
      if (act === 'inc' || act === 'dec') { const c = cfg(); c.n = Math.min(12, Math.max(3, c.n + (act === 'inc' ? 1 : -1))); ctx.store.set('dixit.cfg', c); }
      if (act === 'start') return start();
      return render();
    }
    switch (act) {
      case 'vote': S.votes[+b.dataset.v] = +b.dataset.j; break;
      case 'score': {
        const r = scoreRound(S.n, S.teller, S.votes);
        r.add.forEach((a, i) => S.score[i] += a);
        S.rounds.push({ teller: S.teller, votes: S.votes, add: r.add, kind: r.kind });
        S.teller = (S.teller + 1) % S.n; S.votes = {};
        break;
      }
      case 'undo': { const r = S.rounds.pop(); if (r) { r.add.forEach((a, i) => S.score[i] -= a); S.teller = r.teller; S.votes = r.votes; } break; }
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; return render(); } S = null; break;
    }
    save(); render();
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'dixit';
      S = ctx.store.get('dixit.state', null);
      render();
    },
  };
})();
