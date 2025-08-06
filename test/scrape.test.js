// test/scrape.test.js
// このファイルをプロジェクトルートで実行してAPIをテストできます
// 実行方法: node test/scrape.test.js

const axios = require('axios')

// テスト用のURL一覧
const testUrls = [
  'https://example.com',
  'https://github.com',
  'https://qiita.com',
  'https://zenn.dev'
]

// APIエンドポイント（開発サーバーが起動している前提）
const API_BASE = 'http://localhost:3000'

async function testScraping() {
  console.log('🚀 スクレイピングAPIのテストを開始します...\n')

  for (const url of testUrls) {
    console.log(`📄 テスト対象: ${url}`)

    try {
      const startTime = Date.now()

      const response = await axios.post(`${API_BASE}/api/scrape`, {
        url: url
      }, {
        timeout: 15000
      })

      const endTime = Date.now()
      const data = response.data

      console.log(`✅ 成功 (${endTime - startTime}ms)`)
      console.log(`   タイトル: ${data.title}`)
      console.log(`   説明: ${data.description.substring(0, 100)}...`)
      console.log(`   見出し数: ${data.headings.length}`)
      console.log(`   リンク数: ${data.links.length}`)
      console.log(`   画像数: ${data.images.length}`)

      // 詳細結果の表示（最初の3件まで）
      if (data.headings.length > 0) {
        console.log('   見出し例:')
        data.headings.slice(0, 3).forEach((heading, i) => {
          console.log(`     ${i + 1}. ${heading}`)
        })
      }

    } catch (error) {
      console.log('❌ エラー:', error.response?.data?.message || error.message)
    }

    console.log('') // 空行
  }

  console.log('🏁 テスト完了')
}

// 無効なURLのテスト
async function testInvalidUrls() {
  console.log('🔍 無効なURLのテストを開始します...\n')

  const invalidUrls = [
    '', // 空文字
    'invalid-url', // 無効な形式
    'https://this-domain-does-not-exist-12345.com', // 存在しないドメイン
  ]

  for (const url of invalidUrls) {
    console.log(`📄 テスト対象: "${url}"`)

    try {
      await axios.post(`${API_BASE}/api/scrape`, {
        url: url
      }, {
        timeout: 10000
      })

      console.log('⚠️  エラーが期待されましたが成功しました')
    } catch (error) {
      console.log(`✅ 期待通りエラー: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
    }

    console.log('') // 空行
  }
}

// パフォーマンステスト
async function performanceTest() {
  console.log('⏱️  パフォーマンステストを開始します...\n')

  const testUrl = 'https://example.com'
  const numberOfRequests = 5
  const results = []

  for (let i = 0; i < numberOfRequests; i++) {
    console.log(`📊 リクエスト ${i + 1}/${numberOfRequests}`)

    try {
      const startTime = Date.now()

      await axios.post(`${API_BASE}/api/scrape`, {
        url: testUrl
      }, {
        timeout: 15000
      })

      const endTime = Date.now()
      const duration = endTime - startTime
      results.push(duration)

      console.log(`   完了: ${duration}ms`)

    } catch (error) {
      console.log(`   エラー: ${error.message}`)
    }
  }

  if (results.length > 0) {
    const average = results.reduce((a, b) => a + b, 0) / results.length
    const min = Math.min(...results)
    const max = Math.max(...results)

    console.log('\n📈 パフォーマンス結果:')
    console.log(`   平均: ${average.toFixed(2)}ms`)
    console.log(`   最短: ${min}ms`)
    console.log(`   最長: ${max}ms`)
  }
}

// メイン実行
async function main() {
  try {
    // 基本機能テスト
    await testScraping()

    // 1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 無効URLテスト
    await testInvalidUrls()

    // 1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000))

    // パフォーマンステスト
    await performanceTest()

  } catch (error) {
    console.error('テスト実行エラー:', error.message)
    console.log('\n💡 開発サーバーが起動していることを確認してください:')
    console.log('   npm run dev')
  }
}

// 実行
main()
