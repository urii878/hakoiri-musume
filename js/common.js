(() => {
  const cfg = window.GAME_CONFIG;

  const $ = (id) => document.getElementById(id);

  function applyConfig() {
    const title = cfg.seoTitle || cfg.title;
    const description = cfg.description || "";
    const canonicalUrl = cfg.canonicalUrl || location.href;
    const ogImage = cfg.ogImage || "";

    // ================================
    // 基本SEO
    // ================================

    document.title = title;

    if ($("page-title")) {
      $("page-title").textContent = title;
    }

    if ($("meta-description")) {
      $("meta-description").setAttribute(
        "content",
        description
      );
    }

    if ($("meta-keywords")) {
      $("meta-keywords").setAttribute(
        "content",
        (cfg.keywords || []).join(",")
      );
    }

    if ($("canonical-link")) {
      $("canonical-link").setAttribute(
        "href",
        canonicalUrl
      );
    }

    // ================================
    // OGP
    // ================================

    if ($("og-title")) {
      $("og-title").setAttribute(
        "content",
        title
      );
    }

    if ($("og-description")) {
      $("og-description").setAttribute(
        "content",
        description
      );
    }

    if ($("og-image")) {
      $("og-image").setAttribute(
        "content",
        ogImage
      );
    }

    if ($("og-url")) {
      $("og-url").setAttribute(
        "content",
        canonicalUrl
      );
    }

    // ================================
    // Twitter / X
    // ================================

    if ($("twitter-title")) {
      $("twitter-title").setAttribute(
        "content",
        title
      );
    }

    if ($("twitter-description")) {
      $("twitter-description").setAttribute(
        "content",
        description
      );
    }

    if ($("twitter-image")) {
      $("twitter-image").setAttribute(
        "content",
        ogImage
      );
    }

    // ================================
    // 構造化データ
    // ================================

    if ($("game-structured-data")) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",

        name: cfg.title,
        description,
        url: canonicalUrl,

        applicationCategory:
          "GameApplication",

        operatingSystem:
          "Any",

        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "JPY"
        }
      };

      $("game-structured-data").textContent =
        JSON.stringify(
          structuredData,
          null,
          2
        );
    }

    // ================================
    // ページ本文
    // ================================

    if ($("game-title")) {
      $("game-title").textContent =
        cfg.title;
    }

    if ($("game-lead")) {
      $("game-lead").textContent =
        cfg.shortDescription ||
        description;
    }

    if ($("eyebrow")) {
      $("eyebrow").textContent =
        cfg.eyebrow ||
        "無料・インストール不要";
    }

    if ($("footer-game-name")) {
      $("footer-game-name").textContent =
        cfg.title;
    }

    // ================================
    // アタマアソビリンク
    // ================================

    [
      "portal-link-top",
      "portal-link-bottom",
      "portal-link-footer"
    ].forEach((id) => {
      const link = $(id);

      if (link) {
        link.href =
          cfg.portalUrl || "#";
      }
    });

    // ================================
    // 遊び方
    // ================================

    if ($("howto-content")) {
      $("howto-content").innerHTML =
        cfg.howToHtml || "";
    }

    if ($("howto-dialog-content")) {
      $("howto-dialog-content").innerHTML =
        cfg.howToHtml || "";
    }

    // ================================
    // ゲーム説明
    // ================================

    if ($("about-title")) {
      $("about-title").textContent =
        `${cfg.title}について`;
    }

    if ($("about-content")) {
      $("about-content").innerHTML =
        cfg.aboutHtml || "";
    }

    // ================================
    // FAQ
    // ================================

    const faqList =
      $("faq-list");

    if (faqList) {
      faqList.innerHTML = "";

      (cfg.faq || []).forEach(
        ({ q, a }) => {
          const details =
            document.createElement(
              "details"
            );

          details.className =
            "faq-item";

          details.innerHTML = `
            <summary>
              ${escapeHtml(q)}
            </summary>

            <p>
              ${escapeHtml(a)}
            </p>
          `;

          faqList.appendChild(
            details
          );
        }
      );
    }

    // ================================
    // 広告・ランキング
    // ================================

    if ($("ad-section")) {
      $("ad-section").hidden =
        !cfg.ads?.enabled;
    }

    if ($("ranking-section")) {
      $("ranking-section").hidden =
        !cfg.ranking?.enabled;
    }
  }

  function escapeHtml(
    value = ""
  ) {
    return String(value).replace(
      /[&<>"']/g,
      (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
    );
  }

  // ================================
  // 遊び方モーダル
  // ================================

  function openHowTo() {
    $("howto-dialog")?.showModal();
  }

  function closeHowTo() {
    $("howto-dialog")?.close();
  }

  // ================================
  // リザルト
  // ================================

  function renderResultStats(
    stats = []
  ) {
    const root =
      $("result-stats");

    if (!root) return;

    root.innerHTML = "";

    stats.forEach(
      ({ label, value }) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "result-stat";

        item.innerHTML = `
          <span
            class="result-stat-label"
          >
            ${escapeHtml(label)}
          </span>

          <span
            class="result-stat-value"
          >
            ${escapeHtml(value)}
          </span>
        `;

        root.appendChild(item);
      }
    );
  }

  async function showResult(
    result
  ) {
    if ($("result-title")) {
      $("result-title").textContent =
        result.title ||
        "ゲーム終了";
    }

    renderResultStats(
      result.stats || []
    );

    window.__LAST_RESULT__ =
      result;

    const form =
      $("ranking-form");

    if (form) {
      form.hidden =
        !cfg.ranking?.enabled ||
        result.rankingScore == null;
    }

    if ($("ranking-form-message")) {
      $("ranking-form-message")
        .textContent = "";
    }

    $("result-dialog")?.showModal();

    if (
      cfg.ranking?.enabled
    ) {
      await window
        .AtamaRanking
        ?.load?.();
    }
  }

  function closeResult() {
    $("result-dialog")?.close();
  }

  // ================================
  // 共通表示
  // ================================

  function setScore(value) {
    if ($("score-display")) {
      $("score-display")
        .textContent =
        String(value);
    }
  }

  function setTime(value) {
    if ($("time-display")) {
      $("time-display")
        .textContent =
        String(value);
    }
  }

  // ================================
  // イベント
  // ================================

  function bindCommonEvents() {
    $("howto-open")
      ?.addEventListener(
        "click",
        openHowTo
      );

    $("howto-close")
      ?.addEventListener(
        "click",
        closeHowTo
      );

    $("result-close")
      ?.addEventListener(
        "click",
        closeResult
      );

    $("result-retry")
      ?.addEventListener(
        "click",
        () => {
          closeResult();

          window
            .AtamaGame
            ?.restart?.();
        }
      );

    $("game-reset")
      ?.addEventListener(
        "click",
        () => {
          window
            .AtamaGame
            ?.restart?.();
        }
      );

    $("ranking-refresh")
      ?.addEventListener(
        "click",
        () => {
          window
            .AtamaRanking
            ?.load?.();
        }
      );

    $("ranking-form")
      ?.addEventListener(
        "submit",
        async (e) => {
          e.preventDefault();

          const result =
            window.__LAST_RESULT__;

          if (
            !result ||
            result.rankingScore ==
              null
          ) {
            return;
          }

          const input =
            $("player-name");

          const name =
            input?.value.trim() ||
            "No Name";

          const message =
            $("ranking-form-message");

          if (message) {
            message.textContent =
              "登録中...";
          }

          try {
            await window
              .AtamaRanking
              .submit({
                name,

                score:
                  result.rankingScore,

                secondaryValue:
                  result.secondaryValue ??
                  null
              });

            if (message) {
              message.textContent =
                "登録しました。";
            }

            await window
              .AtamaRanking
              .load();

          } catch (err) {
            console.error(err);

            if (message) {
              message.textContent =
                "登録に失敗しました。設定を確認してください。";
            }
          }
        }
      );
  }

  // ================================
  // 外部API
  // ================================

  window.AtamaUI = {
    showResult,
    setScore,
    setTime,
    escapeHtml
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      applyConfig();
      bindCommonEvents();

      if (
        cfg.ranking?.enabled
      ) {
        window
          .AtamaRanking
          ?.load?.();
      }
    }
  );
})();
