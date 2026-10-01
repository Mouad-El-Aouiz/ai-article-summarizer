// src/components/summaries/SummaryForm.jsx
import { useState, useRef } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { generateSummary } from '../../services/summaryService'

export default function SummaryForm({ 
  onSummaryGenerated, 
  onLoading, 
  onError,
  initialType = 'url',
  isRegenerating = false
}) {
  const [localInputType, setLocalInputType] = useState(initialType)
  const [url, setUrl] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const fileInputRef = useRef(null)

  const pdfToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    onLoading(true)
    onError(null)

    try {
      let body = {}
      let pdfData = null
      
      if (localInputType === 'url') {
        if (!url.trim()) throw new Error('Enter an article URL')
        body = { url: url.trim(), type: 'url' }
      } else {
        if (!pdfFile) throw new Error('Select a PDF file')
        if (pdfFile.size > 10 * 1024 * 1024) throw new Error('The PDF must not exceed 10 MB')
        
        const base64 = await pdfToBase64(pdfFile)
        pdfData = base64
        body = { pdfBase64: base64, type: 'pdf' }
      }

      const data = await generateSummary(body)

      await onSummaryGenerated({
        summary: data.summary,
        title: data.title,
        url: localInputType === 'url' ? url : `PDF: ${pdfFile.name}`,
        type: localInputType,
        pdfBase64: pdfData
      })

      // Keep the current PDF available while regenerating it.
      if (localInputType === 'pdf' && !isRegenerating) {
        setPdfFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (err) {
      onError(err.message)
    } finally {
      onLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        {isRegenerating ? '🔄 Regenerate summary' : '✨ New summary'}
      </h2>

      {/* Toggle */}
      <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => { setLocalInputType('url'); setPdfFile(null); setUrl('') }}
          className={`px-4 py-2 rounded-md transition ${localInputType === 'url' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'} ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRegenerating}
        >
          🔗 Article (URL)
        </button>
        <button
          type="button"
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
            placeholder="Paste an article URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isRegenerating}
            aria-label="URL of the article to summarize"
          />
          <Button type="submit" disabled={isRegenerating || !url.trim()}>
            {isRegenerating ? 'Regenerating...' : '✨ Summarize'}
          </Button>
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
                {pdfFile ? pdfFile.name : 'Click or drop a PDF here'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">10 MB maximum</p>
            </label>
          </div>
          {pdfFile && (
            <div className="mt-4 flex gap-3">
              <Button type="submit" disabled={isRegenerating} className="flex-1">
                📄 Summarize PDF
              </Button>
              <Button onClick={() => { setPdfFile(null); if(fileInputRef.current) fileInputRef.current.value = '' }} variant="secondary">
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
