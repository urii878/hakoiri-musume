// ========================================================
// 新作ごとに主に書き換えるファイル
// ========================================================
//
// 共通UIから使えるもの:
//   AtamaUI.setScore(value)
//   AtamaUI.setTime(value)
//   AtamaUI.showResult({
//      title: "クリア！",
//      stats: [{ label: "スコア", value: 1000 }],
//      rankingScore: 1000,      // ranking.enabled=false なら不要
//      secondaryValue: 35       // 同点判定用。不要なら省略
//   })
//
// 共通UIが呼ぶもの:
//   AtamaGame.restart()
//
// 以下はテンプレート動作確認用のミニゲーム。
// 「ボタンを10回押す」だけなので、新作では中身を削除して実装してください。

(() => {
  const root = document.getElementById("game-root");

  let count = 0;
  const goal = 10;
  let startedAt = 0;

  function render() {
    root.innerHTML = `
      <div class="placeholder-game">
        <p>テンプレート確認用：ボタンを10回押してください。</p>
        <div class="big-number" id="tap-count">${count}</div>
        <button class="primary-btn" id="tap-button" type="button">タップ</button>
      </div>
    `;

    document.getElementById("tap-button").addEventListener("click", onTap);
  }

  function onTap() {
    if (count === 0) startedAt = performance.now();

    count += 1;
    AtamaUI.setScore(count);
    document.getElementById("tap-count").textContent = count;

    if (count >= goal) {
      const seconds = ((performance.now() - startedAt) / 1000).toFixed(2);
      AtamaUI.setTime(`${seconds}s`);

      AtamaUI.showResult({
        title: "クリア！",
        stats: [
          { label: "タップ数", value: count },
          { label: "タイム", value: `${seconds}s` }
        ],

        // 例: タイムランキングなら「小さいほど良い」にして
        // rankingScore に Number(seconds) を渡します。
        rankingScore: Number(seconds)
      });
    }
  }

  function restart() {
    count = 0;
    startedAt = 0;
    AtamaUI.setScore(0);
    AtamaUI.setTime("--");
    render();
  }

  window.AtamaGame = {
    restart
  };

  document.addEventListener("DOMContentLoaded", restart);
})();
