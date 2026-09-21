// ================================
// 新作ごとに基本的にここを編集
// ================================
window.GAME_CONFIG = {
  id: "sample-game",
  title: "サンプルゲーム",
  shortDescription: "テンプレート動作確認用のサンプルゲームです。",
  seoTitle: "サンプルゲーム｜無料で遊べるブラウザゲーム",
  description: "サンプルゲームを無料で遊べます。スマホ・PC対応、インストール不要です。",
  keywords: [
    "無料ゲーム",
    "ブラウザゲーム",
    "パズル"
  ],

  canonicalUrl: "https://example.com/",
  ogImage: "./assets/og-image.svg",

  portalName: "アタマアソビ",
  portalUrl: "https://example.com/",

  eyebrow: "無料・インストール不要",

  // ページ下部の説明。HTML可。
  howToHtml: `
    <ol>
      <li>ゲームを開始します。</li>
      <li>画面の指示に従って操作します。</li>
      <li>終了すると結果画面が表示されます。</li>
    </ol>
  `,
  aboutHtml: `
    <p>
      ここにゲームの由来・ルール・特徴・検索ユーザーが知りたい情報を記載します。
      単なるSEO文章ではなく、初めて遊ぶ人にも役立つ内容にしてください。
    </p>
  `,

  faq: [
    {
      q: "無料で遊べますか？",
      a: "はい。ブラウザ上で無料で遊べます。"
    },
    {
      q: "スマホでも遊べますか？",
      a: "はい。スマホ・タブレット・PCに対応しています。"
    },
    {
      q: "インストールは必要ですか？",
      a: "必要ありません。ブラウザからそのまま遊べます。"
    }
  ],

  // 広告
  ads: {
    enabled: false
  },

  // ランキング
  ranking: {
    enabled: false,

    // trueにした場合は下記を自分のSupabaseに置き換える。
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY",
    table: "sample_scores",

    // "desc" = 高得点順 / "asc" = タイムなど小さいほど良い
    sortDirection: "desc",

    // 同点時の追加ソート。不要なら null
    secondaryColumn: null,
    secondaryDirection: "asc",

    limit: 10
  }
};
