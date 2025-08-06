<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">
        Webスクレイピングツール
      </h1>

      <!-- URL入力フォーム -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <form @submit.prevent="scrapeUrl" class="space-y-4">
          <div>
            <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
              スクレイピングするURL
            </label>
            <input
              v-model="inputUrl"
              type="text"
              id="url"
              placeholder="https://example.com または example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :disabled="loading"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="loading || !inputUrl.trim()"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'スクレイピング中...' : 'スクレイピング開始' }}
          </button>
        </form>
      </div>

      <!-- エラー表示 -->
      <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">エラーが発生しました</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- 結果表示 -->
      <div v-if="result && !loading" class="space-y-6">
        <!-- 基本情報 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">基本情報</h2>
          <div class="space-y-3">
            <div>
              <h3 class="text-sm font-medium text-gray-500">タイトル</h3>
              <p class="mt-1 text-gray-900">{{ result.title }}</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-500">説明</h3>
              <p class="mt-1 text-gray-900">{{ result.description }}</p>
            </div>
          </div>
        </div>

        <!-- 見出し -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            見出し ({{ result.headings.length }}件)
          </h2>
          <div v-if="result.headings.length > 0" class="space-y-2">
            <div
              v-for="(heading, index) in result.headings"
              :key="index"
              class="py-2 px-3 bg-gray-50 rounded border-l-4 border-blue-500"
            >
              {{ heading }}
            </div>
          </div>
          <p v-else class="text-gray-500">見出しが見つかりませんでした。</p>
        </div>

        <!-- リンク -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            リンク ({{ result.links.length }}件)
          </h2>
          <div v-if="result.links.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
            <div
              v-for="(link, index) in result.links"
              :key="index"
              class="flex items-start space-x-3 py-2 px-3 bg-gray-50 rounded"
            >
              <span class="flex-1 font-medium text-gray-900">{{ link.text }}</span>
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                開く
              </a>
            </div>
          </div>
          <p v-else class="text-gray-500">リンクが見つかりませんでした。</p>
        </div>

        <!-- 画像 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            画像 ({{ result.images.length }}件)
          </h2>
          <div v-if="result.images.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            <div
              v-for="(image, index) in result.images"
              :key="index"
              class="border rounded-lg p-3"
            >
              <img
                :src="image.src"
                :alt="image.alt"
                class="w-full h-32 object-cover rounded mb-2"
                @error="handleImageError"
                loading="lazy"
              />
              <p class="text-xs text-gray-600 truncate" :title="image.alt">
                {{ image.alt || '説明なし' }}
              </p>
            </div>
          </div>
          <p v-else class="text-gray-500">画像が見つかりませんでした。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// TypeScriptの型定義を削除
// interface ScrapeResult {
//   title: string
//   description: string
//   headings: string[]
//   links: Array<{ text: string; href: string }>
//   images: Array<{ src: string; alt: string }>
// }

// リアクティブデータ
const inputUrl = ref('')
const loading = ref(false)
const error = ref('')

// 型定義を追加
interface ScrapeResult {
  title: string
  description: string
  headings: string[]
  links: Array<{ text: string; href: string }>
  images: Array<{ src: string; alt: string }>
}
const result = ref<ScrapeResult | null>(null)

// メタ情報
useHead({
  title: 'Webスクレイピングツール',
  meta: [
    { name: 'description', content: 'URLを入力してWebページの情報をスクレイピングするツールです。' }
  ]
})

// スクレイピング実行
const scrapeUrl = async () => {
  if (!inputUrl.value.trim()) return

  loading.value = true
  error.value = ''
  result.value = null

  try {
    // 開発環境用の完全なURL指定
    const baseURL = process.client ? '' : 'http://localhost:3000'

    const data = await $fetch('/api/scrape', {
      method: 'POST',
      body: { url: inputUrl.value.trim() },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    result.value = data  // dataを直接代入
    console.log('Scraping successful:', data)
  } catch (err) {
    console.error('Scraping error:', err)

    // より詳細なエラーハンドリング
    const e = err as any
    if (e.status === 404) {
      error.value = 'APIエンドポイントが見つかりません。サーバーが正しく起動しているか確認してください。'
    } else if (e.status === 400) {
      error.value = e.statusMessage || 'リクエストが無効です。'
    } else if (e.status === 408) {
      error.value = 'リクエストがタイムアウトしました。'
    } else {
      error.value = e.data?.message || e.statusMessage || e.message || 'スクレイピングに失敗しました。'
    }
  } finally {
    loading.value = false
  }
}

// 画像読み込みエラーハンドリング
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>
