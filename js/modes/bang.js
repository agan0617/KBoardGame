/* 砰！：單機傳遞發身分。一支手機輪流傳，每人點開看自己的身分再蓋起來（代替身分牌）；警長發完自動公開。
   遊戲中點死掉的人，公布身分、提醒獎懲、自動判勝負。牌和人物用實體的。
   進行中的局存在 localStorage，App 被關掉或重新整理也接得回來。畫面沿用誰是臥底的 uc-* 樣式。 */
'use strict';
(window.KBG_MODES = window.KBG_MODES || {}).bang = (() => {
  const T = {
    zh: {
      players: '人數', p8: '8 人用擴充的配置（2 個叛徒）', start: '開始發身分',
      hint: '大家圍成一圈，順時針從 1 號開始編號，手機從 1 號開始傳。人物牌和遊戲牌照實體的發。',
      handTo: '請把手機交給 {0} 號', peek: '我是 {0} 號，看我的身分', yourRole: '{0} 號，你的身分是',
      gotIt: '記住了，蓋起來', allSeen: '所有人都看過了', sheriffIs: '警長是 {0} 號，請亮出警長徽章，體力多 1、由他先開始。', toPlay: '開始遊戲',
      S: '警長', D: '副警長', O: '罪犯', R: '叛徒',
      goalS: '殺光所有罪犯和叛徒。你的身分是公開的。', goalD: '保護警長，幫他殺光罪犯和叛徒。不要讓別人知道你是誰。',
      goalO: '殺死警長。罪犯之間互相不知道彼此。', goalR: '成為最後一個活著的人：先幫警長清掉其他人，最後再單挑警長。',
      playTip: '有人死了就在下面點他，公布身分。', alive: '還在場：{0} 人', died: '{0} 號死了，身分是：{1}',
      rewardO: '殺死他的人摸 3 張牌（罪犯死了，誰殺的都算）。', rewardD: '如果是警長殺的，警長要棄掉所有手牌和面前的裝備。',
      dead: '陣亡', kill: '{0} 號死了', cancel: '取消',
      winS: '警長陣營獲勝！', winO: '罪犯獲勝！', winR: '叛徒獲勝！',
      winSTip: '罪犯和叛徒全部倒下了。', winOTip: '警長倒下了。', winRTip: '叛徒單獨活到最後，親手解決了警長。',
      again: '再來一局', settings: '改設定', redeal: '重新發身分', redealSure: '確定重發？再按一次',
      quit: '重新開始（改人數）', quitSure: '確定重新開始？再按一次',
    },
    en: {
      players: 'Players', p8: '8 players uses the expansion setup (2 Renegades)', start: 'Deal roles',
      hint: 'Sit in a circle and number yourselves clockwise from 1. Pass the phone starting with player 1. Deal the character and playing cards as usual.',
      handTo: 'Hand the phone to player {0}', peek: "I'm player {0}, show my role", yourRole: 'Player {0}, your role is',
      gotIt: 'Got it, hide it', allSeen: 'Everyone has seen their role', sheriffIs: 'Player {0} is the Sheriff: show the star, take 1 extra life, and start first.', toPlay: 'Start game',
      S: 'Sheriff', D: 'Deputy', O: 'Outlaw', R: 'Renegade',
      goalS: 'Eliminate all Outlaws and the Renegade. Your role is public.', goalD: 'Protect the Sheriff and help him eliminate the Outlaws and the Renegade. Keep your role secret.',
      goalO: 'Kill the Sheriff. Outlaws do not know each other.', goalR: 'Be the last one standing: help clear out everyone else, then face the Sheriff alone at the end.',
      playTip: 'When someone dies, tap them below to reveal their role.', alive: 'Still alive: {0}', died: 'Player {0} is dead. Role: {1}',
      rewardO: 'Whoever killed them draws 3 cards (anyone who kills an Outlaw).', rewardD: 'If the Sheriff killed them, the Sheriff discards all cards in hand and in play.',
      dead: 'Dead', kill: 'Player {0} died', cancel: 'Cancel',
      winS: 'The Sheriff wins!', winO: 'The Outlaws win!', winR: 'The Renegade wins!',
      winSTip: 'All Outlaws and Renegades are dead.', winOTip: 'The Sheriff is dead.', winRTip: 'The Renegade was the last one left and took down the Sheriff.',
      again: 'Play again', settings: 'Change settings', redeal: 'Deal roles again', redealSure: 'Deal again? Tap again',
      quit: 'Start over (change players)', quitSure: 'Start over? Tap again',
    },
    ja: {
      players: '人数', p8: '8 人は拡張の配役（裏切り者 2 人）', start: '役職を配る',
      hint: '輪になって座り、時計回りに 1 番から番号を振ります。スマホは 1 番から回してください。キャラクターカードとゲームカードは実物を配ります。',
      handTo: 'スマホを {0} 番に渡してください', peek: '{0} 番です、役職を見る', yourRole: '{0} 番、あなたの役職は',
      gotIt: '覚えた、隠す', allSeen: '全員見終わりました', sheriffIs: '保安官は {0} 番です。バッジを公開し、体力 +1、最初の手番です。', toPlay: 'ゲーム開始',
      S: '保安官', D: '副保安官', O: '無法者', R: '裏切り者',
      goalS: '無法者と裏切り者を全員倒す。あなたの役職は公開です。', goalD: '保安官を守り、無法者と裏切り者を倒す手伝いをする。正体は隠しておく。',
      goalO: '保安官を倒す。無法者同士もお互いを知りません。', goalR: '最後の一人になる。先に他の全員を片付け、最後に保安官と一騎打ち。',
      playTip: '誰かが倒れたら下でその人をタップして、役職を公開します。', alive: '生存：{0} 人', died: '{0} 番が倒れました。役職：{1}',
      rewardO: '倒した人はカードを 3 枚引く（無法者を倒したら誰でも）。', rewardD: '保安官が倒した場合、保安官は手札と場のカードをすべて捨てる。',
      dead: '脱落', kill: '{0} 番が倒れた', cancel: 'キャンセル',
      winS: '保安官チームの勝ち！', winO: '無法者の勝ち！', winR: '裏切り者の勝ち！',
      winSTip: '無法者と裏切り者が全員倒れました。', winOTip: '保安官が倒れました。', winRTip: '裏切り者が最後の一人として保安官を倒しました。',
      again: 'もう一回', settings: '設定を変える', redeal: '役職を配り直す', redealSure: '配り直す？もう一度タップ',
      quit: '最初からやり直す（人数を変える）', quitSure: 'やり直す？もう一度タップ',
    },
  };

  let el, ctx, S, armed = '';   // 要按兩次才生效的按鈕（quit／redeal），第一次按下時記在這裡
  const t = (k, ...a) => (T[ctx.lang] || T.zh)[k].replace(/\{(\d)\}/g, (_, i) => a[i]);
  const save = () => ctx.store.set('bang.state', S);
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // 身分配置：S 警長、D 副警長、O 罪犯、R 叛徒（8 人是擴充配置）
  const SETUP = { 4: 'SROO', 5: 'SRDOO', 6: 'SRDOOO', 7: 'SRDDOOO', 8: 'SRRDDOOO' };
  const MIN = 4, MAX = 8;
  const cfg = () => Object.assign({ n: 5 }, ctx.store.get('bang.cfg', {}));

  function deal() {
    const roles = shuffle([...SETUP[cfg().n]]);
    S = { phase: 'deal', cur: 0, shown: false, pick: -1, last: null, players: roles.map(r => ({ role: r, out: false })) };
    save(); render();
  }

  const sheriff = () => S.players.findIndex(p => p.role === 'S');
  const alive = () => S.players.filter(p => !p.out);

  function kill(i) {
    S.players[i].out = true;
    S.last = i; S.pick = -1;
    const a = alive();
    if (S.players[sheriff()].out) S.phase = 'end', S.winner = a.length === 1 && a[0].role === 'R' ? 'R' : 'O';
    else if (!a.some(p => p.role === 'O' || p.role === 'R')) S.phase = 'end', S.winner = 'S';
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
        ${c.n === 8 ? `<p class="uc-tip">${e(t('p8'))}</p>` : ''}
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
      h = `<div class="uc-card uc-pass"><p class="uc-big">${e(t('allSeen'))}</p><p class="uc-big">${e(t('sheriffIs', sheriff() + 1))}</p>${btn('play', t('toPlay'), 'big')}</div>` + foot();
    } else if (S.phase === 'play') {
      const lp = S.last != null ? S.players[S.last] : null;
      h = `<div class="uc-card">
          ${lp ? `<p class="uc-last">${e(t('died', S.last + 1, t(lp.role)))}${lp.role === 'O' ? '<br>' + e(t('rewardO')) : lp.role === 'D' ? '<br>' + e(t('rewardD')) : ''}</p>` : ''}
          <p class="uc-tip">${e(t('playTip'))}</p>
          <p class="uc-tip">${e(t('alive', alive().length))}</p>
        </div>
        <div class="uc-grid">${S.players.map((p, i) => `<button data-act="pick" data-i="${i}" class="${p.out ? 'out' : ''}${S.pick === i ? ' on' : ''}${p.role === 'S' ? ' first' : ''}"${p.out ? ' disabled' : ''}>
          <b>${i + 1}</b>${p.out || p.role === 'S' ? `<small>${e(t(p.role))}</small>` : ''}</button>`).join('')}</div>
        ${S.pick >= 0 ? `<div class="uc-confirm">${btn('cancel', t('cancel'))}${btn('kill', t('kill', S.pick + 1), 'big')}</div>` : ''}
        ${foot()}`;
    } else if (S.phase === 'end') {
      const lp = S.players[S.last];
      h = `<div class="uc-card uc-end ${S.winner === 'S' ? '' : 'uc'}">
          <p class="uc-last">${e(t('died', S.last + 1, t(lp.role)))}</p>
          <p class="uc-huge">${e(t('win' + S.winner))}</p>
          <p class="uc-tip">${e(t('win' + S.winner + 'Tip'))}</p>
        </div>
        <ul class="uc-list">${S.players.map((p, i) => `<li class="${p.role === 'O' || p.role === 'R' ? 'uc' : ''}"><b>${i + 1}</b><span>${e(t(p.role))}</span><span></span><small>${p.out ? e(t('dead')) : ''}</small></li>`).join('')}</ul>
        <div class="uc-confirm">${btn('settings', t('settings'))}${btn('deal', t('again'), 'big')}</div>`;
    }
    el.innerHTML = h;
  }

  function onClick(ev) {
    if (el.dataset.mode !== 'bang') return;   // 開局頁是各模式共用的容器，別的遊戲在用時不處理
    const b = ev.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    const wasArmed = armed;
    armed = '';
    switch (act) {
      case 'inc': case 'dec': {
        const c = cfg();
        c.n = Math.min(MAX, Math.max(MIN, c.n + (act === 'inc' ? 1 : -1)));
        ctx.store.set('bang.cfg', c); render(); return;
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
      el.dataset.mode = 'bang';
      S = ctx.store.get('bang.state', null);
      // 重開 App 或換語言時先蓋回去，不讓下一個人看到前一個人的身分
      if (S && S.shown) { S.shown = false; save(); }
      render();
    },
  };
})();
