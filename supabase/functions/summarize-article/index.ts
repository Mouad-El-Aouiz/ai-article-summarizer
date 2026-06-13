import pdfParse from 'pdf-parse';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

// Fonction OCR via Optiic (gratuit, 50 req/jour)
async function extractPdfViaOCR(pdfBase64: string): Promise<string> {
  const apiKey = Deno.env.get('OPTIIC_API_KEY')
  if (!apiKey) {
    throw new Error('Clé API Optiic non configurée pour OCR')
  }
  
  try {
    // Convertir base64 en buffer
    const binaryString = atob(pdfBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Créer un formulaire multipart
    const formData = new FormData()
    const blob = new Blob([bytes], { type: 'application/pdf' })
    formData.append('file', blob, 'document.pdf')
    formData.append('language', 'fra') // Français
    
    const response = await fetch('https://api.optiic.dev/ocr', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur Optiic:', errorText)
      throw new Error(`OCR échoué: ${response.status}`)
    }
    
    const data = await response.json()
    const text = data.text || ''
    
    if (!text || text.length < 20) {
      throw new Error('Aucun texte reconnu par OCR')
    }
    
    return text.substring(0, 8000)
    
  } catch (error) {
    console.error('Erreur OCR:', error.message)
    throw new Error('Impossible de lire le PDF (format non supporté ou image non lisible)')
  }
}

// Fallback : extraction basique pour PDF textuels
async function extractPdfTextBasic(pdfBase64: string): Promise<string> {
  try {
    const binaryString = atob(pdfBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    let text = ''
    let inTextObject = false
    let textBuffer = ''
    
    for (let i = 0; i < bytes.length; i++) {
      const char = String.fromCharCode(bytes[i])
      
      if (char === 'B' && bytes[i+1] === 84) {
        inTextObject = true
        textBuffer = ''
        i += 1
      } else if (char === 'E' && bytes[i+1] === 84 && inTextObject) {
        inTextObject = false
        if (textBuffer.trim()) {
          text += textBuffer + ' '
        }
        i += 1
      } else if (inTextObject && (char.match(/[a-zA-Z0-9.,!?;:()[\]{}'"\u00C0-\u00FF -]/) || char === ' ')) {
        textBuffer += char
      }
    }
    
    text = text.replace(/\s+/g, ' ').trim()
    return text.substring(0, 8000)
    
  } catch (error) {
    console.error('Erreur extraction basique:', error)
    return ''
  }
}

// Fonction principale d'extraction PDF (avec fallback)
async function extractPdfContent(pdfBase64: string): Promise<string> {
  console.log('📄 Extraction du texte du PDF avec pdf-parse...');

  try {
    // 1. Convertir le base64 en un format compréhensible par pdf-parse (Uint8Array)
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. La magie de pdf-parse : il extrait tout le texte du document
    const data = await pdfParse(bytes);
    
    // 3. Vérifier qu'on a bien du texte
    const extractedText = data.text;
    if (!extractedText || extractedText.trim().length < 50) {
      console.warn('⚠️ pdf-parse a trouvé très peu de texte. Le PDF est peut-être une image scannée.');
      throw new Error('Le PDF semble être une image scannée sans texte lisible.');
    }

    console.log(`✅ Extraction réussie ! ${extractedText.length} caractères extraits.`);
    // On limite la taille pour ne pas surcharger l'API Groq
    return extractedText.substring(0, 8000);

  } catch (error) {
    console.error('❌ Erreur avec pdf-parse:', error.message);
    // On relance l'erreur pour qu'elle soit capturée par le bloc "catch" principal de ta fonction
    throw new Error(`Impossible d'extraire le texte de ce PDF : ${error.message}`);
  }
}

// Extraction d'article web
async function extractArticleContent(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    
    const html = await response.text()
    
    let title = ''
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) title = titleMatch[1]
    
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    content = content.substring(0, 8000)
    
    if (content.length < 100) {
      throw new Error('Contenu insuffisant')
    }
    
    return { title, content }
  } catch (error) {
    console.error('Erreur extraction article:', error)
    throw new Error("Impossible d'extraire le contenu de l'article")
  }
}

// Génération du résumé avec Groq
async function generateSummary(content: string, type: string): Promise<string> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY')
  if (!groqApiKey) {
    throw new Error('Clé API Groq non configurée')
  }
  
  const prompt = type === 'pdf' 
    ? `Voici le contenu extrait d'un document PDF. Fais un résumé clair et concis en 3 à 5 phrases des points principaux :\n\n${content}`
    : `Résume cet article de façon claire et concise en 3 à 5 phrases :\n\n${content}`
  
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant qui résume des articles et documents PDF de façon claire et concise en 3 à 5 phrases, en français.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    })
  })
  
  if (!groqResponse.ok) {
    const errorText = await groqResponse.text()
    console.error('Erreur Groq:', errorText)
    throw new Error(`Erreur API Groq: ${groqResponse.status}`)
  }
  
  const aiData = await groqResponse.json()
  return aiData.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer un résumé."
}

// Handler principal
Deno.serve(async (req) => {
  console.log('📥 Requête reçue, méthode:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { url, pdfBase64, type = 'url' } = body
    
    console.log('Type:', type)
    
    let content = ''
    let title = ''
    
    if (type === 'url' && url) {
      console.log('📰 Extraction article:', url)
      const article = await extractArticleContent(url)
      content = article.content
      title = article.title
    } 
    else if (type === 'pdf' && pdfBase64) {
      console.log('📄 Extraction PDF...')
      content = await extractPdfContent(pdfBase64)
      title = 'Document PDF'
    }
    else {
      throw new Error('URL ou PDF requis')
    }
    
    console.log('📝 Contenu extrait, longueur:', content.length)
    
    const summary = await generateSummary(content, type)
    console.log('✅ Résumé généré')
    
    return new Response(
      JSON.stringify({ summary, title }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})