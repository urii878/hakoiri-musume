(() => {
  const cfg = window.GAME_CONFIG;

  const $ = (id) => document.getElementById(id);

  function applyConfig() {
    document.title = cfg.seoTitle || cfg.title;

    $("page-title").textContent = cfg.seoTitle || cfg.title;
    $("meta-description").setAttribute("content", cfg.description || "");
    $("meta-keywords").setAttribute("content", (cfg.keywords || []).join(","));

    $("og-title").setAttribute("content", cfg.seoTitle || cfg.title);
    $("og-description").setAttribute("content", cfg.description || "");
    $("og-image").setAttribute("content", cfg.ogImage || "");
    $("og-url").setAttribute("content", cfg.canonicalUrl || location.href);

    $("game-title").textContent = cfg.title;
    $("game-lead").textContent = cfg.shortDescription || cfg.description || "";
    $("eyebrow").textContent = cfg.eyebrow || "無料・インストール不要";
    $("footer-game-name").textContent = cfg.title;

    ["portal-link-top", "portal-link-bottom", "portal-link-footer"].forEach((id) => {
      const a = $(id);
      a.href = cfg.portalUrl || "#";
    });

    $("howto-content").innerHTML = cfg.howToHtml || "";
    $("howto-dialog-content").innerHTML = cfg.howToHtml || "";
    $("about-title").textContent = `${cfg.title}について`;
    $("about-content").innerHTML = cfg.aboutHtml || "";

    const faqList = $("faq-list");
    faqList.innerHTML = "";
    (cfg.faq || []).forEach(({ q, a }) => {
      const details = document.createElement("details");
      details.className = "faq-item";
      details.innerHTML = `<summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p>`;
      faqList.appendChild(details);
    });

    $("ad-section").hidden = !cfg.ads?.enabled;
    $("ranking-section").hidden = !cfg.ranking?.enabled;
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function openHowTo() {
    $("howto-dialog").showModal();
  }

  function closeHowTo() {
    $("howto-dialog").close();
  }

  function renderResultStats(stats = []) {
    const root = $("result-stats");
    root.innerHTML = "";
    stats.forEach(({ label, value }) => {
      const item = document.createElement("div");
      item.className = "result-stat";
      item.innerHTML = `
        <span class="result-stat-label">${escapeHtml(label)}</span>
        <span class="result-stat-value">${escapeHtml(value)}</span>
      `;
      root.appendChild(item);
    });
  }

  async function showResult(result) {
    $("result-title").textContent = result.title || "ゲーム終了";
    renderResultStats(result.stats || []);

    window.__LAST_RESULT__ = result;

    const form = $("ranking-form");
    form.hidden = !cfg.ranking?.enabled || result.rankingScore == null;
    $("ranking-form-message").textContent = "";

    $("result-dialog").showModal();

    if (cfg.ranking?.enabled) {
      await window.AtamaRanking?.load?.();
    }
  }

  function closeResult() {
    $("result-dialog").close();
  }

  function setScore(value) {
    $("score-display").textContent = String(value);
  }

  function setTime(value) {
    $("time-display").textContent = String(value);
  }

  function bindCommonEvents() {
    $("howto-open").addEventListener("click", openHowTo);
    $("howto-close").addEventListener("click", closeHowTo);
    $("result-close").addEventListener("click", closeResult);

    $("result-retry").addEventListener("click", () => {
      closeResult();
      window.AtamaGame?.restart?.();
    });

    $("game-reset").addEventListener("click", () => {
      window.AtamaGame?.restart?.();
    });

    $("ranking-refresh").addEventListener("click", () => {
      window.AtamaRanking?.load?.();
    });

    $("ranking-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const result = window.__LAST_RESULT__;
      if (!result || result.rankingScore == null) return;

      const input = $("player-name");
      const name = input.value.trim() || "No Name";
      const message = $("ranking-form-message");
      message.textContent = "登録中...";

      try {
        await window.AtamaRanking.submit({
          name,
          score: result.rankingScore,
          secondaryValue: result.secondaryValue ?? null
        });
        message.textContent = "登録しました。";
        await window.AtamaRanking.load();
      } catch (err) {
        console.error(err);
        message.textContent = "登録に失敗しました。設定を確認してください。";
      }
    });
  }

  window.AtamaUI = {
    showResult,
    setScore,
    setTime,
    escapeHtml
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyConfig();
    bindCommonEvents();

    if (cfg.ranking?.enabled) {
      window.AtamaRanking?.load?.();
    }
  });
})();
