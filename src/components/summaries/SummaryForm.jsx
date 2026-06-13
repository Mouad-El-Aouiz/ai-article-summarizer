// src/components/summaries/SummaryForm.jsx
import { useState, useRef, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../services/supabaseClient'

export default function SummaryForm({ 
  onSummaryGenerated, 
  onLoading, 
  onError,
  initialUrl = '',
  initialType = 'url',
  isRegenerating = false
}) {
  const [localInputType, setLocalInputType] = useState(initialType)
  const [url, setUrl] = useState(initialUrl)
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfBase64, setPdfBase64] = useState(null)
  const fileInputRef = useRef(null)

  // Mettre à jour quand initialUrl ou initialType change
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl)
      setLocalInputType(initialType)
    }
  }, [initialUrl, initialType])

  const pdfToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        setPdfBase64(base64)
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  const handleSubmit = async () => {
    onLoading(true)
    onError(null)

    try {
      let body = {}
      let pdfData = null
      
      if (localInputType === 'url') {
        if (!url.trim()) throw new Error('Veuillez entrer une URL')
        body = { url: url.trim(), type: 'url' }
      } else {
        if (!pdfFile) throw new Error('Veuillez sélectionner un PDF')
        if (pdfFile.size > 10 * 1024 * 1024) throw new Error('Le PDF ne doit pas dépasser 10 Mo')
        
        const base64 = await pdfToBase64(pdfFile)
        pdfData = base64
        body = { pdfBase64: base64, type: 'pdf' }
      }

      const { data, error } = await supabase.functions.invoke('summarize-article', { body })
      
      if (error) throw new Error(error.message)
      if (!data?.summary) throw new Error('Pas de résumé reçu')

      onSummaryGenerated({
        summary: data.summary,
        title: data.title,
        url: localInputType === 'url' ? url : `PDF: ${pdfFile.name}`,
        type: localInputType,
        pdfBase64: pdfData  // ← Passer le base64 pour régénération
      })

      // Reset PDF state seulement si ce n'est pas une régénération
      if (localInputType === 'pdf' && !isRegenerating) {
        setPdfFile(null)
        setPdfBase64(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (err) {
      onError(err.message)
    } finally {
      onLoading(false)
    }
  }

  const handleReset = () => {
    setUrl('')
    setPdfFile(null)
    setPdfBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        {isRegenerating ? '🔄 Régénération du résumé' : '✨ Nouveau résumé'}
      </h2>

      {/* Toggle */}
      <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setLocalInputType('url'); setPdfFile(null); setPdfBase64(null); setUrl('') }}
          className={`px-4 py-2 rounded-md transition ${localInputType === 'url' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'} ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRegenerating}
        >
          🔗 Article (URL)
        </button>
        <button
          onClick={() => { setLocalInputType('pdf'); setUrl('') }}
          className={`px-4 py-2 rounded-md transition ${localInputType === 'pdf' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'} ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRegenerating}
        >
          📄 PDF
        </button>
      </div>

      {/* Input */}
      {localInputType === 'url' ? (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="url"
            placeholder="Collez l'URL d'un article ici..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={isRegenerating}
          />
          <Button onClick={handleSubmit} disabled={isRegenerating || !url.trim()}>
            {isRegenerating ? 'Régénération...' : '✨ Résumer'}
          </Button>
          {initialUrl && !isRegenerating && (
            <Button onClick={handleReset} variant="secondary">
              Nouveau résumé
            </Button>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition bg-white dark:bg-gray-800">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="hidden"
              id="pdf-upload"
              disabled={isRegenerating}
            />
            <label htmlFor="pdf-upload" className={`cursor-pointer block ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-600 dark:text-gray-400">
                {pdfFile ? pdfFile.name : 'Cliquez ou déposez un PDF ici'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 10 Mo</p>
            </label>
          </div>
          {pdfFile && (
            <div className="mt-4 flex gap-3">
              <Button onClick={handleSubmit} disabled={isRegenerating} className="flex-1">
                📄 Résumer le PDF
              </Button>
              <Button onClick={() => { setPdfFile(null); setPdfBase64(null); if(fileInputRef.current) fileInputRef.current.value = '' }} variant="secondary">
                Annuler
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}