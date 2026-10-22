/* 三國殺（身份局）：單機傳遞發身分，做法同砰！（bang.js）。一支手機輪流傳，每人點開看自己的身分再蓋起來（代替身分牌）；
   主公發完自動公開。遊戲中點死掉的人，公布身分、提醒獎懲、自動判勝負。武將牌和遊戲牌用實體的。
   進行中的局存在 localStorage，App 被關掉或重新整理也接得回來。畫面沿用誰是臥底的 uc-* 樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).sgs = (() => {
  const T = {
    zh: {
      players: '人數', start: '開始發身分',
      hint: '大家圍成一圈，順時針從 1 號開始編號，手機從 1 號開始傳。武將牌和遊戲牌照實體的發。',
      handTo: '請把手機交給 {0} 號', peek: '我是 {0} 號，看我的身分', yourRole: '{0} 號，你的身分是',
      gotIt: '記住了，蓋起來', allSeen: '所有人都看過了', toPlay: '開始遊戲',
      monarchIs: '主公是 {0} 號：請亮出身分牌，先挑武將，由主公先開始。', monarchHp: '5 人以上，主公體力上限 +1。',
      M: '主公', L: '忠臣', R: '反賊', T: '內奸',
      goalM: '消滅所有反賊和內奸。你的身分是公開的。', goalL: '保護主公，幫他消滅反賊和內奸。不要讓別人知道你是誰。',
      goalR: '殺死主公。反賊之間互相不知道彼此。', goalT: '成為最後一個活著的人：先幫主公清掉其他人，最後再單挑主公。',
      playTip: '有人陣亡就在下面點他，公布身分。', alive: '還在場：{0} 人', died: '{0} 號陣亡，身分是：{1}',
      rewardR: '殺死他的人摸 3 張牌（反賊陣亡，誰殺的都算）。', rewardL: '如果是主公殺的，主公要棄掉所有手牌和裝備區的牌。',
      dead: '陣亡', kill: '{0} 號陣亡', cancel: '取消',
      winM: '主公和忠臣獲勝！', winR: '反賊獲勝！', winT: '內奸獲勝！',
      winMTip: '反賊和內奸全部陣亡。', winRTip: '主公陣亡了。', winTTip: '內奸單獨活到最後，親手解決了主公。',
      again: '再來一局', settings: '改設定', redeal: '重新發身分', redealSure: '確定重發？再按一次',
      quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次',
    },
    en: {
      players: 'Players', start: 'Deal roles',
      hint: 'Sit in a circle and number yourselves clockwise from 1. Pass the phone starting with player 1. Deal the hero cards and playing cards as usual.',
      handTo: 'Hand the phone to player {0}', peek: "I'm player {0}, show my role", yourRole: 'Player {0}, your role is',
      gotIt: 'Got it, hide it', allSeen: 'Everyone has seen their role', toPlay: 'Start game',
      monarchIs: 'Player {0} is the Monarch: reveal the role card, pick a hero first, and take the first turn.', monarchHp: 'With 5 or more players, the Monarch gets +1 maximum health.',
      M: 'Monarch', L: 'Loyalist', R: 'Rebel', T: 'Traitor',
      goalM: 'Eliminate all Rebels and Traitors. Your role is public.', goalL: 'Protect the Monarch and help eliminate the Rebels and Traitors. Keep your role secret.',
      goalR: 'Kill the Monarch. Rebels do not know each other.', goalT: 'Be the last one standing: help clear out everyone else, then face the Monarch alone at the end.',
      playTip: 'When someone dies, tap them below to reveal their role.', alive: 'Still alive: {0}', died: 'Player {0} is dead. Role: {1}',
      rewardR: 'Whoever killed them draws 3 cards (anyone who kills a Rebel).', rewardL: 'If the Monarch killed them, the Monarch discards all cards in hand and in the equipment area.',
      dead: 'Dead', kill: 'Player {0} died', cancel: 'Cancel',
      winM: 'The Monarch and Loyalists win!', winR: 'The Rebels win!', winT: 'The Traitor wins!',
      winMTip: 'All Rebels and Traitors are dead.', winRTip: 'The Monarch is dead.', winTTip: 'The Traitor was the last one left and took down the Monarch.',
      again: 'Play again', settings: 'Change settings', redeal: 'Deal roles again', redealSure: 'Deal again? Tap again',
      quit: 'Start over (change players)', quitSure: 'Start over? Tap again',
    },
    ja: {
      players: '人数', start: '身分を配る',
      hint: '輪になって座り、時計回りに 1 番から番号を振ります。スマホは 1 番から回してください。武将カードとゲームカードは実物を配ります。',
      handTo: 'スマホを {0} 番に渡してください', peek: '{0} 番です、身分を見る', yourRole: '{0} 番、あなたの身分は',
      gotIt: '覚えた、隠す', allSeen: '全員見終わりました', toPlay: 'ゲーム開始',
      monarchIs: '主公は {0} 番です。身分カードを公開し、最初に武将を選んで、最初の手番です。', monarchHp: '5 人以上なら主公の体力上限 +1。',
      M: '主公', L: '忠臣', R: '反賊', T: '内奸',
      goalM: '反賊と内奸を全員倒す。あなたの身分は公開です。', goalL: '主公を守り、反賊と内奸を倒す手伝いをする。正体は隠しておく。',
      goalR: '主公を倒す。反賊同士もお互いを知りません。', goalT: '最後の一人になる。先に他の全員を片付け、最後に主公と一騎打ち。',
      playTip: '誰かが倒れたら下でその人をタップして、身分を公開します。', alive: '生存：{0} 人', died: '{0} 番が倒れました。身分：{1}',
      rewardR: '倒した人はカードを 3 枚引く（反賊を倒したら誰でも）。', rewardL: '主公が倒した場合、主公は手札と装備エリアのカードをすべて捨てる。',
      dead: '脱落', kill: '{0} 番が倒れた', cancel: 'キャンセル',
      winM: '主公と忠臣の勝ち！', winR: '反賊の勝ち！', winT: '内奸の勝ち！',
      winMTip: '反賊と内奸が全員倒れました。', winRTip: '主公が倒れました。', winTTip: '内奸が最後の一人として主公を倒しました。',
      again: 'もう一回', settings: '設定を変える', redeal: '身分を配り直す', redealSure: '配り直す？もう一度タップ',
      quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ',
    },
  };

  let el, ctx, S, armed = '';   // 要按兩次才生效的按鈕（quit／redeal），第一次按下時記在這裡
  const t = (k, ...a) => (T[ctx.lang] || T.zh)[k].replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('sgs.state', S);
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // 身分配置：M 主公、L 忠臣、R 反賊、T 內奸（10 人兩個內奸）
  const SETUP = { 4: 'MLRT', 5: 'MLRRT', 6: 'MLRRRT', 7: 'MLLRRRT', 8: 'MLLRRRRT', 9: 'MLLLRRRRT', 10: 'MLLLRRRRTT' };
  const MIN = 4, MAX = 10;
  const cfg = () => Object.assign({ n: 5 }, ctx.store.get('sgs.cfg', {}));

  function deal() {
    const roles = shuffle([...SETUP[cfg().n]]);
    S = { phase: 'deal', cur: 0, shown: false, pick: -1, last: null, players: roles.map(r => ({ role: r, out: false })) };
    save(); render();
  }

  const monarch = () => S.players.findIndex(p => p.role === 'M');
  const alive = () => S.players.filter(p => !p.out);

  // 主公陣亡：只剩一個內奸活著是內奸贏，否則反賊贏；反賊和內奸都死光是主公方贏
  function kill(i) {
    S.players[i].out = true;
    S.last = i; S.pick = -1;
    const a = alive();
    if (S.players[monarch()].out) S.phase = 'end', S.winner = a.length === 1 && a[0].role === 'T' ? 'T' : 'R';
    else if (!a.some(p => p.role === 'R' || p.role === 'T')) S.phase = 'end', S.winner = 'M';
    save(); render();
  }

  // ---------- 畫面 ----------

  const btn = (act, label, cls = '') => `<button class="${cls}" data-act="${act}">${ctx.esc(label)}</button>`;
  const stepper = (k, v, lo, hi) => `<div class="uc-step"><button data-act="dec" data-k="${k}"${v <= lo ? ' disabled' : ''}>−</button><b>${v}</b><button data-act="inc" data-k="${k}"${v >= hi ? ' disabled' : ''}>＋</button></div>`;
  const foot = () => `<p class="uc-foot">${btn('redeal', t(armed === 'redeal' ? 'redealSure' : 'redeal'), 'link')}${btn('quit', t(armed === 'quit' ? 'quitSure' : 'quit'), 'link')}</p>`;
  const roleLine = n => [...SETUP[n]].map(r => t(r)).join('・');

  function render() {
    const e = ctx.esc;
    let h = '';
    if (!S || S.phase === 'setup') {
      const c = cfg();
      h = `<div class="uc-card uc-setup">
        <div class="uc-row"><span>${e(t('players'))}</span>${stepper('n', c.n, MIN, MAX)}</div>
        <p class="uc-big">${e(roleLine(c.n))}</p>
        ${c.n >= 5 ? `<p class="uc-tip">${e(t('monarchHp'))}</p>` : ''}
        <p class="uc-tip">${e(t('hint'))}</p>
        ${btn('deal', t('start'), 'big')}
      </div>`;
    } else if (S.phase === 'deal') {
      const n = S.cur + 1, p = S.players[S.cur];
      if (!S.shown) h = `<div class="uc-card uc-pass"><p class="uc-big">${e(t('handTo', n))}</p>${btn('peek', t('peek', n), 'big')}</div>`;
      else h = `<div class="uc-card uc-word">
          <p class="uc-tip">${e(t('yourRole', n))}</p>
          <p class="uc-huge">${e(t(p.role))}</p>
          <p class="uc-tip">${e(t('goal' + p.role))}</p>
          ${btn('hide', t('gotIt'), 'big')}
        </div>`;
      h += `<p class="uc-progress">${S.players.map((_, i) => `<i class="${i < S.cur ? 'done' : i === S.cur ? 'on' : ''}"></i>`).join('')}</p>` + foot();
    } else if (S.phase === 'ready') {
      h = `<div class="uc-card uc-pass"><p class="uc-big">${e(t('allSeen'))}</p><p class="uc-big">${e(t('monarchIs', monarch() + 1))}</p>
          ${S.players.length >= 5 ? `<p class="uc-tip">${e(t('monarchHp'))}</p>` : ''}${btn('play', t('toPlay'), 'big')}</div>` + foot();
    } else if (S.phase === 'play') {
      const lp = S.last != null ? S.players[S.last] : null;
      h = `<div class="uc-card">
          ${lp ? `<p class="uc-last">${e(t('died', S.last + 1, t(lp.role)))}${lp.role === 'R' ? '<br>' + e(t('rewardR')) : lp.role === 'L' ? '<br>' + e(t('rewardL')) : ''}</p>` : ''}
          <p class="uc-tip">${e(t('playTip'))}</p>
          <p class="uc-tip">${e(t('alive', alive().length))}</p>
        </div>
        <div class="uc-grid">${S.players.map((p, i) => `<button data-act="pick" data-i="${i}" class="${p.out ? 'out' : ''}${S.pick === i ? ' on' : ''}${p.role === 'M' ? ' first' : ''}"${p.out ? ' disabled' : ''}>
          <b>${i + 1}</b>${p.out || p.role === 'M' ? `<small>${e(t(p.role))}</small>` : ''}</button>`).join('')}</div>
        ${S.pick >= 0 ? `<div class="uc-confirm">${btn('cancel', t('cancel'))}${btn('kill', t('kill', S.pick + 1), 'big')}</div>` : ''}
        ${foot()}`;
    } else if (S.phase === 'end') {
      const lp = S.players[S.last];
      h = `<div class="uc-card uc-end ${S.winner === 'M' ? '' : 'uc'}">
          <p class="uc-last">${e(t('died', S.last + 1, t(lp.role)))}</p>
          <p class="uc-huge">${e(t('win' + S.winner))}</p>
          <p class="uc-tip">${e(t('win' + S.winner + 'Tip'))}</p>
        </div>
        <ul class="uc-list">${S.players.map((p, i) => `<li class="${p.role === 'R' || p.role === 'T' ? 'uc' : ''}"><b>${i + 1}</b><span>${e(t(p.role))}</span><span></span><small>${p.out ? e(t('dead')) : ''}</small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('settings', t('settings'))}${btn('deal', t('again'), 'big')}</div>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'sgs') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    const wasArmed = armed;
    armed = '';
    switch (act) {
      case 'inc': case 'dec': {
        const c = cfg();
        c.n = Math.min(MAX, Math.max(MIN, c.n + (act === 'inc' ? 1 : -1)));
        ctx.store.set('sgs.cfg', c); render(); return;
      }
      case 'deal': deal(); return;
      case 'peek': S.shown = true; break;
      case 'hide':
        S.shown = false;
        if (S.cur < S.players.length - 1) S.cur++; else S.phase = 'ready';
        break;
      case 'play': S.phase = 'play'; break;
      case 'pick': S.pick = S.pick === +b.dataset.i ? -1 : +b.dataset.i; break;
      case 'cancel': S.pick = -1; break;
      case 'kill': kill(S.pick); return;
      case 'quit': if (wasArmed !== 'quit') { armed = 'quit'; render(); return; } S = null; break;
      case 'redeal': if (wasArmed !== 'redeal') { armed = 'redeal'; render(); return; } deal(); return;
      case 'settings': S = null; break;
    }
    save(); render();
    if (act === 'pick' && S && S.pick >= 0) el.querySelector('.uc-confirm')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return {
    mount(node, c) {
      ctx = c;
      if (el !== node) { el = node; el.addEventListener('click', onClick); }
      el.dataset.mode = 'sgs';
      S = ctx.store.get('sgs.state', null);
      // 重開 App 或換語言時先蓋回去，不讓下一個人看到前一個人的身分
      if (S && S.shown) { S.shown = false; save(); }
      render();
    },
  };
})();
