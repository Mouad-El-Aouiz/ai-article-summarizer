import pdfParse from 'pdf-parse'

const MAX_ARTICLE_BYTES = 2 * 1024 * 1024
const MAX_PDF_BASE64_LENGTH = 14 * 1024 * 1024
const MAX_CONTENT_LENGTH = 12_000
const REQUEST_TIMEOUT_MS = 12_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true

  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false

  const [a, b] = parts
  return a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
}

function validatePublicUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 2_048) throw new HttpError(400, 'Invalid URL')

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new HttpError(400, 'Invalid URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || isPrivateHostname(parsed.hostname)) {
    throw new HttpError(400, 'Only public web URLs are accepted')
  }
  return parsed
}

async function fetchWithSafeRedirects(initialUrl: URL) {
  let currentUrl = initialUrl

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'User-Agent': 'ArticleSummarizer/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new HttpError(422, 'Invalid article redirect')
      currentUrl = validatePublicUrl(new URL(location, currentUrl).toString())
      continue
    }
    return response
  }

  throw new HttpError(422, 'Too many redirects')
}

async function readLimitedText(response: Response) {
  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > MAX_ARTICLE_BYTES) throw new HttpError(413, 'Article is too large')
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > MAX_ARTICLE_BYTES) {
      await reader.cancel()
      throw new HttpError(413, 'Article is too large')
    }
    result += decoder.decode(value, { stream: true })
  }
  return result + decoder.decode()
}

async function extractArticleContent(rawUrl: unknown) {
  const response = await fetchWithSafeRedirects(validatePublicUrl(rawUrl))
  if (!response.ok) throw new HttpError(422, `The remote website returned status ${response.status}`)

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new HttpError(415, 'The URL does not point to an HTML page')
  }

  const html = await readLimitedText(response)
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'Web article'
  const content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)

  if (content.length < 100) throw new HttpError(422, 'The article does not contain enough readable content')
  return { title, content }
}

async function extractPdfContent(pdfBase64: unknown) {
  if (typeof pdfBase64 !== 'string' || pdfBase64.length === 0) throw new HttpError(400, 'A PDF file is required')
  if (pdfBase64.length > MAX_PDF_BASE64_LENGTH) throw new HttpError(413, 'The PDF exceeds 10 MB')

  try {
    const binary = atob(pdfBase64)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') {
      throw new HttpError(415, 'The provided file is not a valid PDF')
    }

    const data = await pdfParse(bytes)
    const text = data.text?.replace(/\s+/g, ' ').trim() || ''
    if (text.length < 50) throw new HttpError(422, 'The PDF does not contain enough extractable text')
    return text.slice(0, MAX_CONTENT_LENGTH)
  } catch (error) {
    if (error instanceof HttpError) throw error
    console.error('PDF extraction failed:', error)
    throw new HttpError(422, 'Unable to extract text from this PDF')
  }
}

async function generateSummary(content: string, type: 'url' | 'pdf') {
  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) throw new HttpError(500, 'The summarization service is not configured')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'Summarize the source faithfully in English. Write 3 to 5 clear sentences and do not invent facts.',
        },
        {
          role: 'user',
          content: `Summarize this ${type === 'pdf' ? 'PDF document' : 'article content'}:\n\n${content}`,
        },
      ],
      max_tokens: 450,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    console.error('Groq request failed:', response.status, await response.text())
    throw new HttpError(502, 'The summarization service is temporarily unavailable')
  }

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content?.trim()
  if (!summary) throw new HttpError(502, 'No summary was returned by the AI service')
  return summary
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_PDF_BASE64_LENGTH + 1_024) throw new HttpError(413, 'Request is too large')

    const body = await request.json()
    if (body?.type !== 'url' && body?.type !== 'pdf') throw new HttpError(400, 'Invalid content type')

    const article = body.type === 'url'
      ? await extractArticleContent(body.url)
      : { title: 'Document PDF', content: await extractPdfContent(body.pdfBase64) }

    return jsonResponse({ summary: await generateSummary(article.content, body.type), title: article.title })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof HttpError ? error.message : 'An unexpected error occurred'
    console.error('Summarization failed:', error)
    return jsonResponse({ error: message }, status)
  }
})
