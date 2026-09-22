(() => {
  const root = document.getElementById("game-root");
  const shell = document.querySelector(".game-shell");
  const toolbar = document.querySelector(".game-toolbar");
  const hero = document.querySelector(".hero");
  const resetButton = document.getElementById("game-reset");

  const COLS = 4;
  const ROWS = 5;
  const GOAL_ID = "goal";
  const STORAGE_PREFIX = "hakoiri-musume";
  const MIN_SOLUTION_MOVES = 30;
  const PLAYER_NAME_KEY = `${STORAGE_PREFIX}:player-name`;
  let generating = false;
  let playerName = "";

  /*
    クリア状態。
    ランダム問題・今日の問題は、この状態から合法手だけで
    シャッフルするため必ず解ける。
  */
  const SOLVED_BLOCKS = [
    {
      id: "v1",
      x: 0,
      y: 0,
      w: 1,
      h: 2,
      type: "vertical"
    },
    {
      id: "h1",
      x: 1,
      y: 0,
      w: 2,
      h: 1,
      type: "horizontal"
    },
    {
      id: "v2",
      x: 3,
      y: 0,
      w: 1,
      h: 2,
      type: "vertical"
    },
    {
      id: "s1",
      x: 1,
      y: 1,
      w: 1,
      h: 1,
      type: "small"
    },
    {
      id: "s2",
      x: 2,
      y: 1,
      w: 1,
      h: 1,
      type: "small"
    },
    {
      id: "v3",
      x: 0,
      y: 2,
      w: 1,
      h: 2,
      type: "vertical"
    },
    {
      id: "s3",
      x: 1,
      y: 2,
      w: 1,
      h: 1,
      type: "small"
    },
    {
      id: "s4",
      x: 2,
      y: 2,
      w: 1,
      h: 1,
      type: "small"
    },
    {
      id: "v4",
      x: 3,
      y: 2,
      w: 1,
      h: 2,
      type: "vertical"
    },
    {
      id: GOAL_ID,
      x: 1,
      y: 3,
      w: 2,
      h: 2,
      type: "goal",
      label: "娘"
    }
  ];

  const DIRS = {
    up: {
      dx: 0,
      dy: -1,
      opposite: "down"
    },

    down: {
      dx: 0,
      dy: 1,
      opposite: "up"
    },

    left: {
      dx: -1,
      dy: 0,
      opposite: "right"
    },

    right: {
      dx: 1,
      dy: 0,
      opposite: "left"
    }
  };

  let screen = "home";

  let mode = null;

  let blocks = [];

  let initialBlocks = [];

  let problemId = "";

  let dailyKey = "";

  let moves = 0;

  let startedAt = 0;

  let elapsedMs = 0;

  let timerId = null;

  let finished = false;

  let drag = null;

  let giveUpButton = null;


  /*
  ========================================
  共通
  ========================================
  */

  function cloneBlocks(source) {
    return source.map(
      (block) => ({
        ...block
      })
    );
  }


  /*
  ========================================
  デザイン
  ========================================
  */

  function injectStyles() {
    if (
      document.getElementById(
        "hakoiri-ui-style"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "hakoiri-ui-style";

    style.textContent = `
      :root{
        --bg:#f7f4ec;
        --panel:#fffefd;
        --text:#252523;
        --muted:#77736c;
        --line:#ddd6ca;
        --accent:#2d2f2b;
        --radius:24px;
        --shadow:0 14px 34px rgba(49,45,38,.08);
      }

      body{
        background:#f7f4ec;
      }

      .site-header{
        background:rgba(247,244,236,.92);
        border-bottom-color:rgba(221,214,202,.8);
      }

      .game-shell.hm-home-state,
      .game-shell.hm-result-state{
        background:transparent;
        border:0;
        box-shadow:none;
        overflow:visible;
      }

      .game-root{
        min-height:0;
        padding:22px;
      }


      .game-toolbar[hidden] { display:none !important; }
      .game-toolbar.hm-home-toolbar { display:block; }
      .game-toolbar.hm-home-toolbar > :not(.hm-player-toolbar) { display:none; }
      .hm-player-toolbar { display:none; }
      .hm-home-toolbar .hm-player-toolbar {
        display:grid; gap:8px; width:min(100%,520px);
      }
      .hm-player-toolbar label { font-weight:800; }
      .hm-player-toolbar input {
        width:100%; box-sizing:border-box; border:1px solid var(--line);
        border-radius:14px; padding:11px 12px; background:white; color:var(--text);
      }
      .hm-player-toolbar p { margin:0; color:var(--muted); font-size:.85rem; }

      /* HOME */

      .hm-home{
        width:min(100%,720px);

        margin:0 auto;

        display:grid;

        gap:18px;
      }

      .hm-home-intro{
        text-align:center;

        color:var(--muted);

        margin:0 0 2px;
      }

      .hm-mode-grid{
        display:grid;

        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );

        gap:16px;
      }

      .hm-mode-card{
        appearance:none;

        border:
          1px solid var(--line);

        background:
          var(--panel);

        border-radius:24px;

        padding:28px 24px;

        text-align:left;

        cursor:pointer;

        color:var(--text);

        box-shadow:
          var(--shadow);

        transition:
          transform .15s ease,
          box-shadow .15s ease,
          border-color .15s ease;
      }

      .hm-mode-card:hover{
        transform:
          translateY(-2px);

        box-shadow:
          0 18px 40px
          rgba(49,45,38,.11);

        border-color:
          #cfc6b7;
      }

      .hm-mode-kicker{
        display:block;

        color:var(--muted);

        font-size:.75rem;

        font-weight:800;

        letter-spacing:.12em;

        margin-bottom:8px;
      }

      .hm-mode-title{
        display:block;

        font-size:1.42rem;

        font-weight:900;

        margin-bottom:8px;
      }

      .hm-mode-copy{
        display:block;

        color:var(--muted);

        line-height:1.65;

        font-size:.94rem;
      }

      .hm-mode-badge{
        display:inline-flex;

        margin-top:16px;

        border:
          1px solid var(--line);

        border-radius:999px;

        padding:6px 10px;

        color:#2f6655;

        font-size:.78rem;

        font-weight:800;

        background:#f7fbf8;
      }


      /* PLAY */

      .hm-play{
        width:min(100%,560px);

        margin:0 auto;

        display:grid;

        gap:14px;
      }

      .hm-play-head{
        display:flex;

        align-items:center;

        justify-content:
          space-between;

        gap:12px;
      }

      .hm-mode-label{
        color:var(--muted);

        font-size:.82rem;

        font-weight:800;

        letter-spacing:.08em;
      }

      .hm-home-link{
        border:0;

        background:
          transparent;

        color:var(--muted);

        text-decoration:
          underline;

        cursor:pointer;

        padding:6px 0;
      }

      .hm-board-wrap{
        width:
          min(88vw,420px);

        margin:0 auto;

        padding:
          10px 10px 32px;

        position:relative;
      }

      .hm-board{
        position:relative;

        width:100%;

        aspect-ratio:4/5;

        border:
          2px solid #cfc6b7;

        border-radius:
          18px 18px 8px 8px;

        background:
          linear-gradient(
            to right,
            rgba(92,82,67,.07)
            1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(92,82,67,.07)
            1px,
            transparent 1px
          ),
          #eee7da;

        background-size:
          25% 20%;

        box-shadow:
          inset 0 0 0 5px
          rgba(255,255,255,.24);

        touch-action:none;

        user-select:none;

        overflow:hidden;
      }

      .hm-exit{
        position:absolute;

        left:25%;

        bottom:0;

        width:50%;

        height:34px;

        display:grid;

        place-items:center;

        color:var(--muted);

        font-size:.75rem;

        font-weight:800;

        letter-spacing:.14em;

        border-left:
          2px solid #cfc6b7;

        border-right:
          2px solid #cfc6b7;
      }

      .hm-piece{
        position:absolute;

        padding:5px;

        touch-action:none;

        cursor:grab;

        transition:
          left .14s ease,
          top .14s ease;

        will-change:
          transform;
      }

      .hm-piece.dragging{
        cursor:grabbing;

        z-index:20;

        transition:none;
      }

      .hm-piece-inner{
        width:100%;

        height:100%;

        display:grid;

        place-items:center;

        border:
          1px solid #cfc6b7;

        border-radius:13px;

        background:#fffdf8;

        box-shadow:
          0 4px 10px
          rgba(61,52,42,.10),
          inset 0 1px 0
          rgba(255,255,255,.7);

        font-weight:900;

        font-size:
          clamp(
            1rem,
            4.8vw,
            1.45rem
          );

        color:#3b3832;
      }

      .hm-piece.horizontal
      .hm-piece-inner{
        background:#faf7f0;
      }

      .hm-piece.vertical
      .hm-piece-inner{
        background:#fdfaf4;
      }

      .hm-piece.small
      .hm-piece-inner{
        background:#fffefa;
      }

      .hm-piece.goal
      .hm-piece-inner{
        background:#2f5f50;

        color:white;

        border-color:#285346;

        box-shadow:
          0 5px 14px
          rgba(47,95,80,.18);
      }

      .hm-tip{
        margin:0;

        text-align:center;

        color:var(--muted);

        font-size:.9rem;
      }


      /* RESULT */

      .hm-result{
        width:min(100%,620px);

        margin:0 auto;

        background:var(--panel);

        border:
          1px solid var(--line);

        border-radius:26px;

        padding:30px;

        box-shadow:
          var(--shadow);

        text-align:center;
      }

      .hm-result-kicker{
        margin:0 0 8px;

        color:var(--muted);

        font-size:.76rem;

        font-weight:900;

        letter-spacing:.14em;
      }

      .hm-result h2{
        margin:0;

        font-size:
          clamp(
            1.8rem,
            6vw,
            2.6rem
          );
      }

      .hm-result-stats{
        display:grid;

        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          );

        gap:10px;

        margin:22px 0;
      }

      .hm-stat{
        border:
          1px solid var(--line);

        border-radius:16px;

        padding:14px 10px;

        background:#fbf9f4;
      }

      .hm-stat-label{
        display:block;

        color:var(--muted);

        font-size:.74rem;

        font-weight:800;

        margin-bottom:3px;
      }

      .hm-stat-value{
        display:block;

        font-weight:900;

        font-size:1.3rem;

        font-variant-numeric:
          tabular-nums;
      }

      .hm-new-best{
        color:#2f6655;

        font-weight:900;

        margin:-8px 0 16px;
      }

      .hm-result-actions{
        display:flex;

        flex-wrap:wrap;

        justify-content:center;

        gap:10px;
      }

      .hm-action-primary,
      .hm-action-secondary{
        border-radius:999px;

        padding:11px 18px;

        font-weight:900;

        cursor:pointer;
      }

      .hm-action-primary{
        border:
          1px solid #2d2f2b;

        background:#2d2f2b;

        color:white;
      }

      .hm-action-secondary{
        border:
          1px solid var(--line);

        background:white;

        color:var(--text);
      }


      /* RANKING */

      .hm-ranking{
        margin-top:26px;

        padding-top:22px;

        border-top:
          1px solid var(--line);

        text-align:left;
      }

      .hm-ranking h3{
        margin:0 0 8px;
      }

      .hm-ranking-note{
        margin:0 0 12px;

        color:var(--muted);

        font-size:.88rem;
      }

      .hm-rank-form{
        display:flex;

        gap:8px;

        margin:12px 0 16px;
      }

      .hm-rank-form input{
        flex:1;

        min-width:0;

        border:
          1px solid var(--line);

        border-radius:14px;

        padding:11px 12px;

        background:white;
      }

      .hm-rank-list{
        display:grid;

        gap:7px;
      }

      .hm-rank-row{
        display:grid;

        grid-template-columns:
          38px 1fr auto;

        gap:10px;

        align-items:center;

        padding:9px 10px;

        border-radius:12px;

        background:#f8f5ee;
      }

      .hm-rank-time{
        font-weight:900;

        font-variant-numeric:
          tabular-nums;
      }

      .hm-toolbar-danger{
        border:
          1px solid #d4c6bb !important;

        color:#7b4b3e !important;

        background:
          #fffaf7 !important;
      }


      @media(max-width:640px){

        .hm-mode-grid{
          grid-template-columns:1fr;
        }

        .hm-result-stats{
          grid-template-columns:1fr;
        }

        .hm-result{
          padding:22px 16px;
        }

        .hm-board-wrap{
          width:min(94vw,390px);
        }

        .game-toolbar{
          gap:12px;

          padding:11px 12px;
        }

        .toolbar-actions{
          gap:6px;

          flex-wrap:wrap;
        }

      }
    `;

    document.head.appendChild(
      style
    );
  }


  /*
  ========================================
  ツールバー
  ========================================
  */

  function ensureGiveUpButton() {
    if (giveUpButton) {
      return;
    }

    const actions =
      document.querySelector(
        ".toolbar-actions"
      );

    if (!actions) {
      return;
    }

    giveUpButton =
      document.createElement(
        "button"
      );

    giveUpButton.type =
      "button";

    giveUpButton.id =
      "game-give-up";

    giveUpButton.className =
      "small-btn hm-toolbar-danger";

    giveUpButton.textContent =
      "あきらめる";

    giveUpButton.addEventListener(
      "click",
      giveUp
    );

    actions.appendChild(
      giveUpButton
    );
  }


  /*
  ========================================
  画面切り替え
  ========================================
  */


  function ensurePlayerToolbar() {
    if (!toolbar || document.getElementById("hm-player-toolbar")) return;
    try {
      playerName = (localStorage.getItem(PLAYER_NAME_KEY) || "").slice(0, 12);
    } catch (error) {
      playerName = "";
    }
    const panel = document.createElement("div");
    panel.id = "hm-player-toolbar";
    panel.className = "hm-player-toolbar";
    panel.innerHTML = `
      <label for="hm-player-name">ランキング登録名</label>
      <input id="hm-player-name" type="text" maxlength="12"
        autocomplete="nickname" placeholder="No Name"
        aria-describedby="hm-player-note" />
      <p id="hm-player-note">未入力の場合は No Name で登録されます。</p>
    `;
    toolbar.appendChild(panel);
    const input = panel.querySelector("input");
    input.value = playerName;
    input.addEventListener("input", () => {
      playerName = input.value.slice(0, 12);
      try {
        localStorage.setItem(PLAYER_NAME_KEY, playerName);
      } catch (error) {
        // 保存できない環境でも、このページ内では入力名を利用する。
      }
    });
  }

  function setLayout(nextScreen) {
    screen = nextScreen;
    shell?.classList.remove("hm-home-state", "hm-play-state", "hm-result-state");
    shell?.classList.add(`hm-${nextScreen}-state`);
    if (hero) hero.style.display = nextScreen === "home" ? "" : "none";
    if (toolbar) {
      toolbar.hidden = nextScreen === "result";
      toolbar.classList.toggle("hm-home-toolbar", nextScreen === "home");
    }
  }

  /*
  ========================================
  HOME
  ========================================
  */

  function renderHome() {
    stopTimer();

    finished = false;

    drag = null;

    setLayout("home");

    const today =
      getJstDateKey();

    const todayBest =
      loadBest(
        `daily-${today}`
      );

    root.innerHTML = `
      <div class="hm-home">

        <p class="hm-home-intro">
          遊びたいモードを選んでください。
        </p>

        <div class="hm-mode-grid">

          <button
            class="hm-mode-card"
            id="hm-random-start"
            type="button"
          >

            <span class="hm-mode-kicker">
              RANDOM
            </span>

            <span class="hm-mode-title">
              ランダム問題
            </span>

            <span class="hm-mode-copy">
              毎回ちがう、必ず解ける盤面に挑戦します。
            </span>

            <span class="hm-mode-badge">
              何度でもプレイ
            </span>

          </button>


          <button
            class="hm-mode-card"
            id="hm-daily-start"
            type="button"
          >

            <span class="hm-mode-kicker">
              TODAY'S PUZZLE
            </span>

            <span class="hm-mode-title">
              今日の問題
            </span>

            <span class="hm-mode-copy">
              ${formatDateJa(today)}の共通問題。
              全員同じ盤面でタイムを競います。
            </span>

            <span class="hm-mode-badge">

              オンラインランキング

              ${
                todayBest
                  ? `・端末ベスト ${formatSeconds(todayBest)}`
                  : ""
              }

            </span>

          </button>

        </div>

      </div>
    `;

    document
      .getElementById(
        "hm-random-start"
      )
      ?.addEventListener(
        "click",
        () => {
          startPuzzle(
            "random"
          );
        }
      );

    document
      .getElementById(
        "hm-daily-start"
      )
      ?.addEventListener(
        "click",
        () => {
          startPuzzle(
            "daily"
          );
        }
      );
  }


  /*
  ========================================
  ゲーム開始
  ========================================
  */

  async function startPuzzle(nextMode) {
    if (generating) return;
    generating = true;
    stopTimer();
    finished = false;
    drag = null;
    mode = nextMode;
    dailyKey = getJstDateKey();
    const seed = mode === "daily"
      ? hashString(`daily-${dailyKey}`)
      : randomSeed();
    const buttons = [...root.querySelectorAll("button")];
    buttons.forEach((button) => { button.disabled = true; });
    const status = document.createElement("p");
    status.className = "hm-tip";
    status.setAttribute("role", "status");
    status.textContent = "問題を準備しています…";
    root.appendChild(status);
    try {
      const generated = await generatePuzzle(seed);
      initialBlocks = cloneBlocks(generated);
      blocks = cloneBlocks(generated);
      problemId = boardId(generated);
      moves = 0;
      elapsedMs = 0;
      startedAt = performance.now();
      setLayout("play");
      updateToolbar();
      renderPlay();
      startTimer();
    } catch (error) {
      console.error(error);
      renderHome();
      const message = document.createElement("p");
      message.className = "hm-tip";
      message.textContent = "問題を生成できませんでした。もう一度お試しください。";
      root.appendChild(message);
    } finally {
      generating = false;
      buttons.forEach((button) => { button.disabled = false; });
      status.remove();
    }
  }

  /*
  ========================================
  PLAY
  ========================================
  */

  function renderPlay() {
    const modeTitle =
      mode === "daily"
        ? `今日の問題・${formatDateJa(dailyKey)}`
        : "ランダム問題";

    root.innerHTML = `
      <div class="hm-play">

        <div class="hm-play-head">

          <span class="hm-mode-label">
            ${modeTitle}
          </span>

          <button
            id="hm-home-button"
            class="hm-home-link"
            type="button"
          >
            ホームへ
          </button>

        </div>


        <p class="hm-tip">
          駒をマウスまたは指でつかみ、
          空いている方向へスライドしてください。
        </p>


        <div class="hm-board-wrap">

          <div
            id="hm-board"
            class="hm-board"
            aria-label="箱入り娘の盤面"
          ></div>

          <div class="hm-exit">
            出口
          </div>

        </div>

      </div>
    `;

    document
      .getElementById(
        "hm-home-button"
      )
      ?.addEventListener(
        "click",
        () => {

          if (
            moves === 0 ||
            confirm(
              "プレイを終了してホームに戻りますか？"
            )
          ) {
            renderHome();
          }

        }
      );

    renderBoard();
  }


  /*
  ========================================
  盤面
  ========================================
  */

  function renderBoard() {
    const board =
      document.getElementById(
        "hm-board"
      );

    if (!board) {
      return;
    }

    board.innerHTML = "";

    blocks.forEach(
      (block) => {

        const el =
          document.createElement(
            "div"
          );

        el.className =
          `hm-piece ${block.type}`;

        el.dataset.id =
          block.id;

        el.style.left =
          `${block.x * 25}%`;

        el.style.top =
          `${block.y * 20}%`;

        el.style.width =
          `${block.w * 25}%`;

        el.style.height =
          `${block.h * 20}%`;

        el.setAttribute(
          "aria-label",

          block.id === GOAL_ID
            ? "娘の駒"
            : "駒"
        );

        el.innerHTML = `
          <div class="hm-piece-inner">
            ${block.label || ""}
          </div>
        `;

        el.addEventListener(
          "pointerdown",
          onPointerDown
        );

        el.addEventListener(
          "pointermove",
          onPointerMove
        );

        el.addEventListener(
          "pointerup",
          onPointerUp
        );

        el.addEventListener(
          "pointercancel",
          onPointerCancel
        );

        board.appendChild(
          el
        );
      }
    );
  }


  /*
  ========================================
  スライド操作
  ========================================
  */

  function onPointerDown(e) {
    if (
      finished ||
      screen !== "play"
    ) {
      return;
    }

    e.preventDefault();

    const el =
      e.currentTarget;

    const id =
      el.dataset.id;

    const board =
      document.getElementById(
        "hm-board"
      );

    const rect =
      board.getBoundingClientRect();

    el.setPointerCapture?.(
      e.pointerId
    );

    el.classList.add(
      "dragging"
    );

    drag = {
      id,
      el,

      pointerId:
        e.pointerId,

      startX:
        e.clientX,

      startY:
        e.clientY,

      axis: null,

      direction: null,

      delta: 0,

      maxSteps: 0,

      cellW:
        rect.width / COLS,

      cellH:
        rect.height / ROWS
    };
  }


  function onPointerMove(e) {
    if (
      !drag ||
      drag.pointerId !==
        e.pointerId ||
      finished
    ) {
      return;
    }

    e.preventDefault();

    const dx =
      e.clientX -
      drag.startX;

    const dy =
      e.clientY -
      drag.startY;

    if (
      !drag.axis &&
      Math.max(
        Math.abs(dx),
        Math.abs(dy)
      ) > 6
    ) {

      drag.axis =
        Math.abs(dx) >=
        Math.abs(dy)
          ? "x"
          : "y";
    }

    if (!drag.axis) {
      return;
    }

    const raw =
      drag.axis === "x"
        ? dx
        : dy;

    const direction =
      drag.axis === "x"
        ? (
            raw >= 0
              ? "right"
              : "left"
          )
        : (
            raw >= 0
              ? "down"
              : "up"
          );

    const block =
      getBlock(
        drag.id
      );

    const max =
      maxSteps(
        block,
        direction
      );

    const cell =
      drag.axis === "x"
        ? drag.cellW
        : drag.cellH;

    const limited =
      Math.sign(raw) *
      Math.min(
        Math.abs(raw),
        max * cell
      );

    drag.direction =
      direction;

    drag.maxSteps =
      max;

    drag.delta =
      max > 0
        ? limited
        : 0;

    drag.el.style.transform =
      drag.axis === "x"
        ? `translate3d(${drag.delta}px,0,0)`
        : `translate3d(0,${drag.delta}px,0)`;
  }


  function onPointerUp(e) {
    if (
      !drag ||
      drag.pointerId !==
        e.pointerId
    ) {
      return;
    }

    e.preventDefault();

    const current =
      drag;

    cleanupDragVisual(
      current
    );

    drag = null;

    if (
      !current.axis ||
      !current.direction ||
      current.maxSteps < 1
    ) {
      return;
    }

    const cell =
      current.axis === "x"
        ? current.cellW
        : current.cellH;

    const ratio =
      Math.abs(
        current.delta
      ) / cell;

    if (ratio < 0.28) {
      return;
    }

    const steps =
      Math.min(
        current.maxSteps,

        Math.max(
          1,
          Math.round(ratio)
        )
      );

    applyMove(
      current.id,
      current.direction,
      steps
    );
  }


  function onPointerCancel(e) {
    if (
      !drag ||
      drag.pointerId !==
        e.pointerId
    ) {
      return;
    }

    cleanupDragVisual(
      drag
    );

    drag = null;
  }


  function cleanupDragVisual(
    current
  ) {
    current.el.classList.remove(
      "dragging"
    );

    current.el.style.transform =
      "";
  }


  /*
  ========================================
  駒移動
  ========================================
  */

  function applyMove(
    id,
    direction,
    steps
  ) {
    const block =
      getBlock(id);

    const dir =
      DIRS[direction];

    if (
      !block ||
      !dir
    ) {
      return;
    }

    let moved = 0;

    while (
      moved < steps &&
      canMove(
        block,
        direction
      )
    ) {

      block.x +=
        dir.dx;

      block.y +=
        dir.dy;

      moved += 1;
    }

    if (!moved) {
      return;
    }

    /*
      1回のドラッグを1手として扱う
    */
    moves += 1;

    updateToolbar();

    renderBoard();

    if (
      isSolved(
        blocks
      )
    ) {
      finishPuzzle();
    }
  }


  function getBlock(id) {
    return blocks.find(
      (block) =>
        block.id === id
    );
  }


  function rectsOverlap(
    a,
    b
  ) {
    return !(
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y
    );
  }


  function canMove(
    block,
    direction,
    source = blocks
  ) {
    const dir =
      DIRS[direction];

    if (
      !block ||
      !dir
    ) {
      return false;
    }

    const next = {
      ...block,

      x:
        block.x +
        dir.dx,

      y:
        block.y +
        dir.dy
    };

    if (
      next.x < 0 ||
      next.y < 0 ||
      next.x + next.w > COLS ||
      next.y + next.h > ROWS
    ) {
      return false;
    }

    return !source.some(
      (other) =>
        other.id !==
          block.id &&
        rectsOverlap(
          next,
          other
        )
    );
  }


  function maxSteps(
    block,
    direction
  ) {
    if (!block) {
      return 0;
    }

    const temp = {
      ...block
    };

    let count = 0;

    while (
      canMove(
        temp,
        direction,
        blocks
      )
    ) {

      const dir =
        DIRS[direction];

      temp.x += dir.dx;

      temp.y += dir.dy;

      count += 1;
    }

    return count;
  }


  function isSolved(source) {
    const goal =
      source.find(
        (block) =>
          block.id ===
          GOAL_ID
      );

    return Boolean(
      goal &&
      goal.x === 1 &&
      goal.y === 3
    );
  }


  /*
  ========================================
  TIMER
  ========================================
  */

  function updateToolbar() {
    window
      .AtamaUI
      ?.setScore?.(
        moves
      );

    window
      .AtamaUI
      ?.setTime?.(
        formatClock(
          currentElapsed()
        )
      );

    if (resetButton) {
      resetButton.textContent =
        "リセット";
    }
  }


  function startTimer() {
    stopTimer();

    timerId =
      window.setInterval(
        () => {

          window
            .AtamaUI
            ?.setTime?.(
              formatClock(
                currentElapsed()
              )
            );

        },
        100
      );
  }


  function stopTimer() {
    if (timerId) {
      window.clearInterval(
        timerId
      );
    }

    timerId = null;
  }


  function currentElapsed() {
    if (!startedAt) {
      return elapsedMs;
    }

    return finished
      ? elapsedMs
      : performance.now() -
          startedAt;
  }


  /*
  ========================================
  CLEAR
  ========================================
  */

  function finishPuzzle() {
    if (finished) {
      return;
    }

    finished = true;

    elapsedMs =
      performance.now() -
      startedAt;

    stopTimer();

    const seconds =
      roundSeconds(
        elapsedMs
      );

    const bestKey =
      bestStorageKey();

    const oldBest =
      loadBest(
        bestKey
      );

    const isNewBest =
      oldBest == null ||
      seconds < oldBest;

    const best =
      isNewBest
        ? seconds
        : oldBest;

    if (isNewBest) {
      saveBest(
        bestKey,
        seconds
      );
    }

    renderResult({
      cleared: true,
      seconds,
      best,
      isNewBest
    });
  }


  /*
  ========================================
  GIVE UP
  ========================================
  */

  function giveUp() {
    if (
      screen !== "play" ||
      finished
    ) {
      return;
    }

    if (
      !confirm(
        "この問題をあきらめますか？"
      )
    ) {
      return;
    }

    finished = true;

    elapsedMs =
      performance.now() -
      startedAt;

    stopTimer();

    renderResult({
      cleared: false,

      seconds:
        roundSeconds(
          elapsedMs
        ),

      best:
        loadBest(
          bestStorageKey()
        ),

      isNewBest:
        false
    });
  }


  /*
  ========================================
  RESULT
  ========================================
  */

  function renderResult({
    cleared,
    seconds,
    best,
    isNewBest
  }) {
    setLayout("result");

    const bestText =
      best == null
        ? "--"
        : formatSeconds(
            best
          );

    root.innerHTML = `
      <div class="hm-result">

        <p class="hm-result-kicker">
          RESULT
        </p>

        <h2>
          ${
            cleared
              ? "クリア！"
              : "あきらめました"
          }
        </h2>


        <div class="hm-result-stats">

          <div class="hm-stat">

            <span class="hm-stat-label">
              TIME
            </span>

            <span class="hm-stat-value">
              ${formatSeconds(seconds)}
            </span>

          </div>


          <div class="hm-stat">

            <span class="hm-stat-label">
              MOVES
            </span>

            <span class="hm-stat-value">
              ${moves}
            </span>

          </div>


          <div class="hm-stat">

            <span class="hm-stat-label">
              端末ベスト
            </span>

            <span class="hm-stat-value">
              ${bestText}
            </span>

          </div>

        </div>


        ${
          isNewBest
            ? `
              <p class="hm-new-best">
                NEW BEST!
              </p>
            `
            : ""
        }


        <div class="hm-result-actions">

          <button
            class="hm-action-primary"
            id="hm-retry"
            type="button"
          >
            同じ問題をもう一度
          </button>


          ${
            mode === "random"
              ? `
                <button
                  class="hm-action-secondary"
                  id="hm-next-random"
                  type="button"
                >
                  次のランダム問題
                </button>
              `
              : ""
          }


          <button
            class="hm-action-secondary"
            id="hm-result-home"
            type="button"
          >
            ホームへ
          </button>

        </div>


        ${
          mode === "daily" &&
          cleared
            ? renderDailyRankingShell()
            : ""
        }

      </div>
    `;


    document
      .getElementById(
        "hm-retry"
      )
      ?.addEventListener(
        "click",
        restartCurrent
      );


    document
      .getElementById(
        "hm-next-random"
      )
      ?.addEventListener(
        "click",
        () => {
          startPuzzle(
            "random"
          );
        }
      );


    document
      .getElementById(
        "hm-result-home"
      )
      ?.addEventListener(
        "click",
        renderHome
      );


    if (
      mode === "daily" &&
      cleared
    ) {
      setupDailyRanking(
        seconds
      );
    }
  }


  /*
  ========================================
  DAILY RANKING
  ========================================
  */

  function renderDailyRankingShell() {
    return `
      <section class="hm-ranking">
        <h3>今日のオンラインランキング</h3>
        <p class="hm-ranking-note" id="hm-rank-note">記録を登録しています…</p>
        <div class="hm-rank-list" id="hm-rank-list"></div>
      </section>
    `;
  }

  async function setupDailyRanking(seconds) {
    const note = document.getElementById("hm-rank-note");
    const list = document.getElementById("hm-rank-list");
    const dateKey = dailyKey;
    const moveCount = moves;
    const name = playerName.trim().slice(0, 12) || "No Name";
    if (!dailyRankingReady()) {
      if (note) note.textContent = "オンラインランキングは設定後に利用できます。";
      return;
    }
    let registered = false;
    try {
      await submitDailyRanking(name, seconds, moveCount, dateKey);
      registered = true;
    } catch (error) {
      console.error(error);
    }
    // 別のプレイに移った場合も、完了した記録の登録先・表示先を混同しない。
    if (!list?.isConnected) return;
    await loadDailyRanking(dateKey, list, note);
    if (note?.isConnected) {
      note.textContent = registered
        ? `登録しました。${note.textContent}`
        : `ランキング登録に失敗しました。${note.textContent}`;
    }
  }

  function dailyRankingConfig() {
    return (
      window
        .GAME_CONFIG
        ?.dailyRanking ||
      {}
    );
  }


  function dailyRankingReady() {
    const cfg =
      dailyRankingConfig();

    return Boolean(
      cfg.enabled &&
      cfg.supabaseUrl &&
      !cfg.supabaseUrl.includes(
        "YOUR_PROJECT"
      ) &&
      cfg.supabaseAnonKey &&
      !cfg.supabaseAnonKey.includes(
        "YOUR_"
      ) &&
      cfg.table
    );
  }


  async function rankingFetch(
    path,
    options = {}
  ) {
    const cfg =
      dailyRankingConfig();

    const response =
      await fetch(
        `${cfg.supabaseUrl}/rest/v1/${path}`,
        {
          ...options,

          headers: {
            apikey:
              cfg.supabaseAnonKey,

            Authorization:
              `Bearer ${cfg.supabaseAnonKey}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=representation",

            ...(
              options.headers ||
              {}
            )
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        await response.text()
      );
    }

    const text =
      await response.text();

    return text
      ? JSON.parse(text)
      : [];
  }


  async function submitDailyRanking(name, seconds, moveCount, dateKey) {
    const cfg = dailyRankingConfig();
    return rankingFetch(cfg.table, {
      method: "POST",
      body: JSON.stringify({
        name,
        score: seconds,
        moves: moveCount,
        date_key: dateKey
      })
    });
  }

  async function loadDailyRanking(dateKey, list, note) {
    const cfg = dailyRankingConfig();
    if (!list?.isConnected) return;

    try {

      const rows =
        await rankingFetch(
          `${encodeURIComponent(cfg.table)}?select=name,score,moves&date_key=eq.${encodeURIComponent(dateKey)}&order=score.asc,moves.asc&limit=${cfg.limit || 10}`
        );


      list.innerHTML =
        rows
          .map(
            (
              row,
              index
            ) => `
              <div class="hm-rank-row">

                <span>
                  ${index + 1}
                </span>

                <span>
                  ${escapeHtml(
                    row.name ||
                    "No Name"
                  )}
                </span>

                <span class="hm-rank-time">
                  ${formatSeconds(
                    Number(
                      row.score
                    )
                  )}
                </span>

              </div>
            `
          )
          .join("");


      if (note) {

        note.textContent =
          rows.length
            ? `${formatDateJa(dateKey)}の上位${rows.length}件`
            : "まだ記録がありません。";
      }

    } catch (error) {

      console.error(
        error
      );

      if (note) {
        note.textContent =
          "ランキングを取得できませんでした。";
      }
    }
  }


  /*
  ========================================
  RESET
  ========================================
  */

  function restartCurrent() {
    if (!mode || !initialBlocks.length) {
      renderHome();
      return;
    }

    // プレイ中のリセットでは開始時刻を維持して計測を続ける。
    // リザルトからの再挑戦は新しいプレイとして計測し直す。
    const keepTime = screen === "play" && !finished;

    stopTimer();

    blocks = cloneBlocks(initialBlocks);
    moves = 0;

    if (!keepTime) {
      elapsedMs = 0;
      startedAt = performance.now();
    }

    finished = false;
    drag = null;

    setLayout("play");
    updateToolbar();
    renderPlay();
    startTimer();
  }

  function restart() {
    if (
      screen === "play"
    ) {
      restartCurrent();
    } else {
      renderHome();
    }
  }


  /*
  ========================================
  問題生成
  ========================================
  */

  async function generatePuzzle(seed) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    // クリア配置からの合法手シャッフルを維持する。判定未済の代替盤面は出さない。
    for (let attempt = 0; ; attempt += 1) {
      const rng = mulberry32((seed + Math.imul(attempt, 0x9e3779b9)) >>> 0);
      const state = cloneBlocks(SOLVED_BLOCKS);
      let last = null;
      const targetSteps = 2000 + Math.floor(rng() * 2000);
      for (let i = 0; i < targetSteps; i += 1) {
        let options = listLegalMoves(state);
        if (last && options.length > 1) {
          const filtered = options.filter((move) =>
            !(move.id === last.id && move.dir === DIRS[last.dir].opposite)
          );
          if (filtered.length) options = filtered;
        }
        if (!options.length) break;
        const choice = options[Math.floor(rng() * options.length)];
        const block = state.find((item) => item.id === choice.id);
        const dir = DIRS[choice.dir];
        block.x += dir.dx;
        block.y += dir.dy;
        last = choice;
      }
      const shortest = await minimumSolutionMoves(state);
      if (Number.isFinite(shortest) && shortest > MIN_SOLUTION_MOVES) return state;
      // 待機時間はseedや採用判定に影響しない。
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  function solverStateKey(positions) {
    // [娘, 横長, 縦長4個, 小駒4個]。同形駒のIDを探索状態に含めない。
    return String.fromCharCode(
      positions[0] + 65, positions[1] + 65,
      ...positions.slice(2, 6).sort((a, b) => a - b).map((p) => p + 65),
      ...positions.slice(6).sort((a, b) => a - b).map((p) => p + 65)
    );
  }

  async function minimumSolutionMoves(source) {
    const ordered = [
      ...source.filter((block) => block.id === GOAL_ID),
      ...source.filter((block) => block.type === "horizontal"),
      ...source.filter((block) => block.type === "vertical"),
      ...source.filter((block) => block.type === "small")
    ];
    const shapes = ordered.map(({ w, h }) => ({ w, h }));
    const masks = shapes.map(({ w, h }) =>
      Array.from({ length: COLS * ROWS }, (_, position) => {
        const x = position % COLS;
        const y = Math.floor(position / COLS);
        if (x + w > COLS || y + h > ROWS) return 0;
        let mask = 0;
        for (let dy = 0; dy < h; dy += 1) {
          for (let dx = 0; dx < w; dx += 1) {
            mask |= 1 << (position + dy * COLS + dx);
          }
        }
        return mask;
      })
    );
    const start = solverStateKey(ordered.map(({ x, y }) => y * COLS + x));
    const queue = [start];
    const visited = new Set(queue);
    let head = 0;
    let depth = 0;
    while (head < queue.length) {
      const levelEnd = queue.length;
      while (head < levelEnd) {
        const key = queue[head++];
        const positions = Array.from(key, (char) => char.charCodeAt(0) - 65);
        if (positions[0] === 3 * COLS + 1) return depth;
        let occupied = 0;
        positions.forEach((position, i) => { occupied |= masks[i][position]; });
        for (let i = 0; i < positions.length; i += 1) {
          const position = positions[i];
          const others = occupied ^ masks[i][position];
          for (const { dx, dy } of Object.values(DIRS)) {
            let x = position % COLS;
            let y = Math.floor(position / COLS);
            // 一方向へ連続して動ける全距離を、それぞれ1手の辺として追加する。
            while (true) {
              x += dx;
              y += dy;
              if (x < 0 || y < 0 || x + shapes[i].w > COLS || y + shapes[i].h > ROWS) break;
              const nextPosition = y * COLS + x;
              if (masks[i][nextPosition] & others) break;
              const next = positions.slice();
              next[i] = nextPosition;
              const nextKey = solverStateKey(next);
              if (!visited.has(nextKey)) {
                visited.add(nextKey);
                queue.push(nextKey);
              }
            }
          }
        }
        if (head % 2048 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      depth += 1;
    }
    return Infinity;
  }

  function listLegalMoves(
    state
  ) {
    const result = [];

    state.forEach(
      (block) => {

        Object
          .keys(DIRS)
          .forEach(
            (direction) => {

              if (
                canMoveInState(
                  block,
                  direction,
                  state
                )
              ) {

                result.push({
                  id:
                    block.id,

                  dir:
                    direction
                });
              }
            }
          );
      }
    );

    return result;
  }


  function canMoveInState(
    block,
    direction,
    state
  ) {
    const dir =
      DIRS[direction];

    const next = {
      ...block,

      x:
        block.x +
        dir.dx,

      y:
        block.y +
        dir.dy
    };


    if (
      next.x < 0 ||
      next.y < 0 ||
      next.x + next.w > COLS ||
      next.y + next.h > ROWS
    ) {
      return false;
    }


    return !state.some(
      (other) =>
        other.id !==
          block.id &&
        rectsOverlap(
          next,
          other
        )
    );
  }


  /*
  ========================================
  保存
  ========================================
  */

  function boardId(state) {
    const serial =
      [...state]
        .sort(
          (a, b) =>
            a.id.localeCompare(
              b.id
            )
        )
        .map(
          (block) =>
            `${block.id}:${block.x},${block.y}`
        )
        .join("|");

    return hashString(
      serial
    ).toString(36);
  }


  function bestStorageKey() {
    if (
      mode === "daily"
    ) {
      return `daily-${dailyKey}`;
    }

    return `random-${problemId}`;
  }


  function loadBest(key) {
    const value =
      localStorage.getItem(
        `${STORAGE_PREFIX}:best:${key}`
      );

    if (
      value == null
    ) {
      return null;
    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : null;
  }


  function saveBest(
    key,
    seconds
  ) {
    localStorage.setItem(
      `${STORAGE_PREFIX}:best:${key}`,
      String(seconds)
    );
  }


  /*
  ========================================
  日付
  ========================================
  */

  function getJstDateKey() {
    return new Intl
      .DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Tokyo",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit"
        }
      )
      .format(
        new Date()
      );
  }


  function formatDateJa(
    dateKey
  ) {
    const [
      year,
      month,
      day
    ] =
      dateKey
        .split("-")
        .map(Number);

    return `${year}/${month}/${day}`;
  }


  /*
  ========================================
  表示
  ========================================
  */

  function roundSeconds(ms) {
    return (
      Math.round(
        ms / 10
      ) / 100
    );
  }


  function formatSeconds(
    seconds
  ) {
    if (
      seconds == null ||
      !Number.isFinite(
        Number(seconds)
      )
    ) {
      return "--";
    }

    return (
      `${Number(seconds).toFixed(2)}秒`
    );
  }


  function formatClock(ms) {
    return (
      `${(ms / 1000).toFixed(1)}s`
    );
  }


  /*
  ========================================
  RANDOM
  ========================================
  */

  function randomSeed() {
    if (
      window.crypto
        ?.getRandomValues
    ) {

      const values =
        new Uint32Array(1);

      window.crypto
        .getRandomValues(
          values
        );

      return values[0];
    }

    return (
      Math.floor(
        Math.random() *
        0xffffffff
      ) >>> 0
    );
  }


  function hashString(
    value
  ) {
    let hash =
      2166136261;

    for (
      let i = 0;
      i < value.length;
      i += 1
    ) {

      hash ^=
        value.charCodeAt(
          i
        );

      hash =
        Math.imul(
          hash,
          16777619
        );
    }

    return hash >>> 0;
  }


  function mulberry32(seed) {
    return function random() {
      let t =
        seed +=
          0x6D2B79F5;

      t =
        Math.imul(
          t ^
          (t >>> 15),
          t | 1
        );

      t ^=
        t +
        Math.imul(
          t ^
          (t >>> 7),
          t | 61
        );

      return (
        (
          t ^
          (t >>> 14)
        ) >>> 0
      ) /
      4294967296;
    };
  }


  function escapeHtml(
    value = ""
  ) {
    return String(value)
      .replace(
        /[&<>"']/g,

        (char) => ({
          "&":
            "&amp;",

          "<":
            "&lt;",

          ">":
            "&gt;",

          '"':
            "&quot;",

          "'":
            "&#39;"
        }[char])
      );
  }


  /*
  ========================================
  INIT
  ========================================
  */

  function init() {
    injectStyles();
    ensureGiveUpButton();
    ensurePlayerToolbar();
    renderHome();
  }

  window.AtamaGame = {
    restart
  };


  document.addEventListener(
    "DOMContentLoaded",
    init
  );
})();

