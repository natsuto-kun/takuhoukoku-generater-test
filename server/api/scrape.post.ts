// server/api/scrape.post.ts
import axios from 'axios'
import * as cheerio from 'cheerio'

interface ScrapeResult {
  title: string
  description: string
  headings: string[]
  links: Array<{ text: string; href: string }>
  images: Array<{ src: string; alt: string }>
  error?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url } = body

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL is required'
      })
    }

    // URLの形式をチェック
    let targetUrl: string
    try {
      targetUrl = new URL(url).toString()
    } catch {
      // プロトコルが省略されている場合はhttpsを追加
      targetUrl = new URL(`https://${url}`).toString()
    }

    // Webページを取得
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    // CheerioでHTMLを解析
    const $ = cheerio.load(response.data)

    // 基本情報を抽出
    const result: ScrapeResult = {
      title: $('title').text().trim() || 'タイトルなし',
      description: $('meta[name="description"]').attr('content') ||
                   $('meta[property="og:description"]').attr('content') ||
                   '説明なし',
      headings: [],
      links: [],
      images: []
    }

    // 見出しを取得（h1-h6）
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const text = $(element).text().trim()
      if (text) {
        result.headings.push(text)
      }
    })

    // リンクを取得
    $('a[href]').each((_, element) => {
      const text = $(element).text().trim()
      const href = $(element).attr('href')
      if (text && href) {
        // 相対URLを絶対URLに変換
        try {
          const absoluteUrl = new URL(href, targetUrl).toString()
          result.links.push({ text, href: absoluteUrl })
        } catch {
          result.links.push({ text, href })
        }
      }
    })

    // 画像を取得
    $('img[src]').each((_, element) => {
      const src = $(element).attr('src')
      const alt = $(element).attr('alt') || ''
      if (src) {
        // 相対URLを絶対URLに変換
        try {
          const absoluteUrl = new URL(src, targetUrl).toString()
          result.images.push({ src: absoluteUrl, alt })
        } catch {
          result.images.push({ src, alt })
        }
      }
    })

    // 結果を制限（大量のデータを避けるため）
    result.headings = result.headings.slice(0, 20)
    result.links = result.links.slice(0, 50)
    result.images = result.images.slice(0, 20)

    return result

  } catch (error: any) {
    console.error('Scraping error:', error)

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Website not found or unreachable'
      })
    }

    if (error.code === 'ETIMEDOUT') {
      throw createError({
        statusCode: 408,
        statusMessage: 'Request timeout'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Scraping failed'
    })
  }
})
