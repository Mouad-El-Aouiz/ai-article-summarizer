// src/components/summaries/SummaryResult.jsx
import { useState } from 'react'
import Button from '../ui/Button'

export default function SummaryResult({ summary, url, onRegenerate, isRegenerating = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!summary) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-xl p-5 animate-fadeIn">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
            <span className="text-lg">✨</span>
          </div>
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Résumé intelligent
          </h3>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="secondary" size="small">
            {copied ? '✓ Copié !' : '📋 Copier'}
          </Button>
          {onRegenerate && (
            <Button onClick={onRegenerate} variant="secondary" size="small" disabled={isRegenerating}>
              {isRegenerating ? '🔄 Régénération...' : '🔄 Régénérer'}
            </Button>
          )}
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
    </div>
  )
}