(() => {
  const cfg = window.GAME_CONFIG;

  function rankingConfig() {
    return cfg.ranking || {};
  }

  function ensureConfigured() {
    const r = rankingConfig();
    if (!r.enabled) return false;
    if (!r.supabaseUrl || r.supabaseUrl.includes("YOUR_PROJECT")) {
      throw new Error("Supabase URL が未設定です。");
    }
    if (!r.supabaseAnonKey || r.supabaseAnonKey.includes("YOUR_")) {
      throw new Error("Supabase key が未設定です。");
    }
    return true;
  }

  async function supabaseFetch(path, options = {}) {
    ensureConfigured();
    const r = rankingConfig();

    const res = await fetch(`${r.supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: r.supabaseAnonKey,
        Authorization: `Bearer ${r.supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }

  function orderQuery() {
    const r = rankingConfig();
    const parts = [`score.${r.sortDirection || "desc"}`];

    if (r.secondaryColumn) {
      parts.push(`${r.secondaryColumn}.${r.secondaryDirection || "asc"}`);
    }

    return parts.join(",");
  }

  async function load() {
    const r = rankingConfig();
    if (!r.enabled) return;

    const root = document.getElementById("ranking-list");
    const note = document.getElementById("ranking-note");
    root.innerHTML = "";
    note.textContent = "読み込み中...";

    try {
      ensureConfigured();

      const rows = await supabaseFetch(
        `${encodeURIComponent(r.table)}?select=*&order=${encodeURIComponent(orderQuery())}&limit=${r.limit || 10}`
      );

      note.textContent = rows.length ? "" : "まだ記録がありません。";

      rows.forEach((row, index) => {
        const el = document.createElement("div");
        el.className = "ranking-row";
        el.innerHTML = `
          <span class="ranking-rank">${index + 1}</span>
          <span>${window.AtamaUI?.escapeHtml?.(row.name || "No Name") ?? "No Name"}</span>
          <span class="ranking-score">${window.AtamaUI?.escapeHtml?.(row.score)}</span>
        `;
        root.appendChild(el);
      });
    } catch (err) {
      console.error(err);
      note.textContent = "ランキング設定が未完了です。";
    }
  }

  async function submit({ name, score, secondaryValue = null }) {
    const r = rankingConfig();
    if (!r.enabled) return;

    const payload = {
      name,
      score
    };

    if (r.secondaryColumn && secondaryValue != null) {
      payload[r.secondaryColumn] = secondaryValue;
    }

    await supabaseFetch(r.table, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  window.AtamaRanking = { load, submit };
})();
