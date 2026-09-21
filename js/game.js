(() => {
  const root = document.getElementById("game-root");

  const COLS = 4;
  const ROWS = 5;
  const GOAL_ID = "goal";

  // 4×5の定番型。下中央2マスが出口。
  const INITIAL_BLOCKS = [
    { id: "v1", x: 0, y: 0, w: 1, h: 2, type: "vertical", label: "" },
    { id: GOAL_ID, x: 1, y: 0, w: 2, h: 2, type: "goal", label: "娘" },
    { id: "v2", x: 3, y: 0, w: 1, h: 2, type: "vertical", label: "" },
    { id: "v3", x: 0, y: 2, w: 1, h: 2, type: "vertical", label: "" },
    { id: "h1", x: 1, y: 2, w: 2, h: 1, type: "horizontal", label: "" },
    { id: "v4", x: 3, y: 2, w: 1, h: 2, type: "vertical", label: "" },
    { id: "s1", x: 1, y: 3, w: 1, h: 1, type: "small", label: "" },
    { id: "s2", x: 2, y: 3, w: 1, h: 1, type: "small", label: "" },
    { id: "s3", x: 0, y: 4, w: 1, h: 1, type: "small", label: "" },
    { id: "s4", x: 3, y: 4, w: 1, h: 1, type: "small", label: "" }
  ];

  let blocks = [];
  let selectedId = null;
  let history = [];
  let moveCount = 0;
  let startedAt = 0;
  let elapsedMs = 0;
  let timerId = null;
  let cleared = false;
  let pointerStart = null;

  const DIRS = {
    up: { dx: 0, dy: -1, icon: "↑" },
    left: { dx: -1, dy: 0, icon: "←" },
    right: { dx: 1, dy: 0, icon: "→" },
    down: { dx: 0, dy: 1, icon: "↓" }
  };

  function cloneBlocks(source = blocks) {
    return source.map((b) => ({ ...b }));
  }

  function injectStyles() {
    if (document.getElementById("hakoiri-musume-style")) return;

    const style = document.createElement("style");
    style.id = "hakoiri-musume-style";

    style.textContent = `
      .hm-wrap{
        width:min(100%,430px);
        display:grid;
        gap:14px;
        justify-items:center
      }

      .hm-help{
        margin:0;
        color:var(--muted);
        font-size:.92rem;
        text-align:center
      }

      .hm-board-wrap{
        width:min(88vw,360px);
        padding:10px 10px 28px;
        position:relative
      }

      .hm-board{
        width:100%;
        aspect-ratio:4/5;
        position:relative;
        overflow:hidden;

        border:4px solid #302a24;
        border-radius:14px 14px 6px 6px;

        background:
          linear-gradient(
            to right,
            rgba(255,255,255,.22) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(255,255,255,.22) 1px,
            transparent 1px
          ),
          #b88a58;

        background-size:25% 20%;

        box-shadow:
          inset 0 0 0 3px rgba(255,255,255,.12),
          0 12px 28px rgba(34,24,16,.14);

        touch-action:none;
        user-select:none;
      }

      .hm-board::after{
        content:"出口";

        position:absolute;
        left:25%;
        bottom:-27px;

        width:50%;
        height:28px;

        display:grid;
        place-items:center;

        background:var(--panel);
        color:var(--muted);

        border-left:4px solid #302a24;
        border-right:4px solid #302a24;

        font-size:.75rem;
        font-weight:800;
        letter-spacing:.12em;
      }

      .hm-piece{
        position:absolute;
        padding:4px;

        transition:
          left .14s ease,
          top .14s ease;

        cursor:grab;
        touch-action:none;
      }

      .hm-piece:active{
        cursor:grabbing
      }

      .hm-piece-inner{
        width:100%;
        height:100%;

        display:grid;
        place-items:center;

        border-radius:9px;

        border:2px solid rgba(48,42,36,.65);

        box-shadow:
          inset 0 2px 0 rgba(255,255,255,.32),
          0 3px 7px rgba(44,31,20,.18);

        font-weight:900;
        font-size:clamp(1rem,5vw,1.55rem);
      }

      .hm-piece.vertical .hm-piece-inner{
        background:#d6b07a
      }

      .hm-piece.horizontal .hm-piece-inner{
        background:#c99d68
      }

      .hm-piece.small .hm-piece-inner{
        background:#e4c596
      }

      .hm-piece.goal .hm-piece-inner{
        background:#f0b9aa;
        border-color:#77483e;
        color:#4f2922
      }

      .hm-piece.selected .hm-piece-inner{
        outline:4px solid rgba(40,85,170,.25);
        outline-offset:-4px
      }

      .hm-controls{
        display:grid;
        grid-template-columns:1fr auto;
        gap:12px;

        width:min(100%,360px);

        align-items:center;
      }

      .hm-status{
        font-size:.88rem;
        color:var(--muted);
        min-height:1.5em;
      }

      .hm-actions{
        display:flex;
        gap:8px;
        align-items:center;
      }

      .hm-dpad{
        display:grid;
        grid-template-columns:repeat(3,42px);
        grid-template-rows:repeat(2,38px);

        gap:5px;
        justify-content:center;
      }

      .hm-dir,
      .hm-undo{
        border:1px solid var(--line);

        background:var(--panel);
        color:var(--text);

        font-weight:900;

        border-radius:12px;
        cursor:pointer;
      }

      .hm-dir:disabled,
      .hm-undo:disabled{
        opacity:.28;
        cursor:default;
      }

      .hm-dir[data-dir="up"]{
        grid-column:2;
        grid-row:1;
      }

      .hm-dir[data-dir="left"]{
        grid-column:1;
        grid-row:2;
      }

      .hm-dir[data-dir="down"]{
        grid-column:2;
        grid-row:2;
      }

      .hm-dir[data-dir="right"]{
        grid-column:3;
        grid-row:2;
      }

      .hm-undo{
        padding:10px 12px;
        white-space:nowrap;
      }

      @media(max-width:430px){
        .hm-board-wrap{
          width:min(92vw,350px)
        }

        .hm-controls{
          grid-template-columns:1fr;
          justify-items:center;
        }

        .hm-status{
          text-align:center;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function render() {
    root.innerHTML = `
      <div class="hm-wrap">

        <p class="hm-help">
          駒をドラッグするか、駒をタップして矢印で動かします。
        </p>

        <div class="hm-board-wrap">
          <div
            id="hm-board"
            class="hm-board"
            aria-label="箱入り娘の盤面"
          ></div>
        </div>

        <div class="hm-controls">

          <div
            id="hm-status"
            class="hm-status"
          >
            「娘」を下中央の出口まで運んでください。
          </div>

          <div class="hm-actions">

            <button
              id="hm-undo"
              class="hm-undo"
              type="button"
            >
              1手戻す
            </button>

            <div
              class="hm-dpad"
              aria-label="選択中の駒を動かす"
            >

              ${Object.entries(DIRS)
                .map(
                  ([name, d]) => `
                    <button
                      class="hm-dir"
                      type="button"
                      data-dir="${name}"
                    >
                      ${d.icon}
                    </button>
                  `
                )
                .join("")}

            </div>

          </div>
        </div>
      </div>
    `;

    renderBoard();
    bindControls();
    updateControls();
  }

  function renderBoard() {
    const board =
      document.getElementById("hm-board");

    if (!board) return;

    board.innerHTML = "";

    blocks.forEach((block) => {
      const el =
        document.createElement("div");

      el.className =
        `hm-piece ${block.type}` +
        `${block.id === selectedId ? " selected" : ""}`;

      el.dataset.id = block.id;

      el.setAttribute(
        "aria-label",
        block.id === GOAL_ID
          ? "娘の駒"
          : "木の駒"
      );

      el.style.left =
        `${block.x * 25}%`;

      el.style.top =
        `${block.y * 20}%`;

      el.style.width =
        `${block.w * 25}%`;

      el.style.height =
        `${block.h * 20}%`;

      el.innerHTML = `
        <div class="hm-piece-inner">
          ${block.label}
        </div>
      `;

      el.addEventListener(
        "pointerdown",
        (e) => {

          if (cleared) return;

          el.setPointerCapture?.(
            e.pointerId
          );

          pointerStart = {
            id: block.id,
            x: e.clientX,
            y: e.clientY
          };

          selectedId = block.id;

          renderBoard();
          updateControls();
        }
      );

      el.addEventListener(
        "pointerup",
        (e) => {

          if (
            !pointerStart ||
            pointerStart.id !== block.id ||
            cleared
          ) {
            return;
          }

          const dx =
            e.clientX -
            pointerStart.x;

          const dy =
            e.clientY -
            pointerStart.y;

          pointerStart = null;

          if (
            Math.max(
              Math.abs(dx),
              Math.abs(dy)
            ) < 22
          ) {
            selectedId = block.id;

            renderBoard();
            updateControls();

            return;
          }

          let dir;

          if (
            Math.abs(dx) >
            Math.abs(dy)
          ) {
            dir =
              dx > 0
                ? "right"
                : "left";
          } else {
            dir =
              dy > 0
                ? "down"
                : "up";
          }

          moveSelected(dir);
        }
      );

      board.appendChild(el);
    });
  }

  function bindControls() {
    document
      .querySelectorAll(".hm-dir")
      .forEach((btn) => {

        btn.addEventListener(
          "click",
          () => {
            moveSelected(
              btn.dataset.dir
            );
          }
        );
      });

    document
      .getElementById("hm-undo")
      .addEventListener(
        "click",
        undo
      );
  }

  function getBlock(id) {
    return blocks.find(
      (b) => b.id === id
    );
  }

  function rectsOverlap(a, b) {
    return !(
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y
    );
  }

  function canMove(
    block,
    dirName
  ) {
    const dir =
      DIRS[dirName];

    if (
      !block ||
      !dir ||
      cleared
    ) {
      return false;
    }

    const next = {
      ...block,
      x: block.x + dir.dx,
      y: block.y + dir.dy
    };

    if (
      next.x < 0 ||
      next.y < 0 ||
      next.x + next.w > COLS ||
      next.y + next.h > ROWS
    ) {
      return false;
    }

    return !blocks.some(
      (other) =>
        other.id !== block.id &&
        rectsOverlap(
          next,
          other
        )
    );
  }

  function availableDirections(
    block
  ) {
    return Object
      .keys(DIRS)
      .filter(
        (name) =>
          canMove(
            block,
            name
          )
      );
  }

  function saveHistory() {
    history.push({
      blocks: cloneBlocks(),
      selectedId,
      moveCount,
      elapsedMs:
        currentElapsed()
    });
  }

  function moveSelected(
    dirName
  ) {
    if (
      !selectedId ||
      cleared
    ) {
      return;
    }

    const block =
      getBlock(selectedId);

    if (
      !canMove(
        block,
        dirName
      )
    ) {
      updateControls(
        "その方向には動かせません。"
      );
      return;
    }

    saveHistory();

    startTimerIfNeeded();

    const dir =
      DIRS[dirName];

    block.x += dir.dx;
    block.y += dir.dy;

    moveCount += 1;

    AtamaUI.setScore(
      moveCount
    );

    renderBoard();
    updateControls();

    if (isCleared()) {
      finishGame();
    }
  }

  function undo() {
    if (
      !history.length ||
      cleared
    ) {
      return;
    }

    const prev =
      history.pop();

    blocks =
      cloneBlocks(
        prev.blocks
      );

    selectedId =
      prev.selectedId;

    moveCount =
      prev.moveCount;

    elapsedMs =
      prev.elapsedMs;

    if (
      moveCount === 0
    ) {
      stopTimer();

      startedAt = 0;
      elapsedMs = 0;
    } else {
      startedAt =
        performance.now() -
        elapsedMs;

      startTimerLoop();
    }

    AtamaUI.setScore(
      moveCount
    );

    updateTimeDisplay();

    renderBoard();

    updateControls(
      "1手戻しました。"
    );
  }

  function isCleared() {
    const goal =
      getBlock(GOAL_ID);

    return (
      goal.x === 1 &&
      goal.y === 3
    );
  }

  function finishGame() {
    cleared = true;

    elapsedMs =
      currentElapsed();

    stopTimer();

    updateTimeDisplay();

    updateControls(
      "クリア！"
    );

    window.setTimeout(
      () => {

        AtamaUI.showResult({
          title: "クリア！",

          stats: [
            {
              label: "手数",
              value: moveCount
            },
            {
              label: "タイム",
              value:
                formatTime(
                  elapsedMs
                )
            }
          ]
        });

      },
      300
    );
  }

  function currentElapsed() {
    if (!startedAt) {
      return elapsedMs;
    }

    return (
      performance.now() -
      startedAt
    );
  }

  function startTimerIfNeeded() {
    if (!startedAt) {
      startedAt =
        performance.now() -
        elapsedMs;
    }

    startTimerLoop();
  }

  function startTimerLoop() {
    if (timerId) return;

    timerId =
      window.setInterval(
        updateTimeDisplay,
        100
      );
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function formatTime(ms) {
    const totalTenths =
      Math.floor(ms / 100);

    const minutes =
      Math.floor(
        totalTenths / 600
      );

    const seconds =
      Math.floor(
        (totalTenths % 600) /
        10
      );

    const tenths =
      totalTenths % 10;

    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}.` +
      `${tenths}`
    );
  }

  function updateTimeDisplay() {
    AtamaUI.setTime(
      formatTime(
        currentElapsed()
      )
    );
  }

  function updateControls(
    message = ""
  ) {
    const status =
      document.getElementById(
        "hm-status"
      );

    const selected =
      getBlock(
        selectedId
      );

    const valid =
      selected
        ? availableDirections(
            selected
          )
        : [];

    document
      .querySelectorAll(".hm-dir")
      .forEach((btn) => {

        btn.disabled =
          !selected ||
          !valid.includes(
            btn.dataset.dir
          ) ||
          cleared;
      });

    const undoBtn =
      document.getElementById(
        "hm-undo"
      );

    if (undoBtn) {
      undoBtn.disabled =
        history.length === 0 ||
        cleared;
    }

    if (!status) return;

    if (message) {
      status.textContent =
        message;
    } else if (!selected) {
      status.textContent =
        "動かしたい駒を選んでください。";
    } else {
      status.textContent =
        selected.id === GOAL_ID
          ? "「娘」を選択中。空いている方向へ動かせます。"
          : "駒を選択中。空いている方向へ動かせます。";
    }
  }

  function restart() {
    stopTimer();

    blocks =
      cloneBlocks(
        INITIAL_BLOCKS
      );

    selectedId = null;
    history = [];
    moveCount = 0;

    startedAt = 0;
    elapsedMs = 0;

    cleared = false;
    pointerStart = null;

    const labels =
      document.querySelectorAll(
        ".toolbar-label"
      );

    if (labels[0]) {
      labels[0].textContent =
        "MOVES";
    }

    if (labels[1]) {
      labels[1].textContent =
        "TIME";
    }

    AtamaUI.setScore(0);
    AtamaUI.setTime(
      "00:00.0"
    );

    injectStyles();
    render();
  }

  window.AtamaGame = {
    restart
  };

  document.addEventListener(
    "DOMContentLoaded",
    restart
  );
})();
