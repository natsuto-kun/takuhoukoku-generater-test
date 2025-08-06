// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // CSS フレームワーク
  css: ['~/assets/css/main.css'],

  // TypeScript設定
  typescript: {
    strict: true,
    typeCheck: true
  },

  // ランタイム設定
  runtimeConfig: {
    // サーバーサイドでのみ利用可能
    scrapeTimeout: 10000,
    maxHeadings: 20,
    maxLinks: 50,
    maxImages: 20,

    // パブリック（クライアントサイドでも利用可能）
    public: {
      appName: 'Web Scraper',
      version: '1.0.0'
    }
  },

  // サーバー設定
  nitro: {
    // CORS設定（必要に応じて）
    experimental: {
      wasm: true
    }
  },

  // アプリ設定
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Web Scraper - Nuxt3',
      meta: [
        { name: 'description', content: 'Nuxt3で作成したWebスクレイピングツール' }
      ]
    }
  }
})
