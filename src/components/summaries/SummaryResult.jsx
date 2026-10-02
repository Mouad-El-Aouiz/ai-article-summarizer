import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileText, RotateCcw, LoaderCircle } from 'lucide-react'

export default function SummaryResult({ summary, title, onRegenerate, isRegenerating = false, loading = false, canRegenerate = true }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setCopyError('')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch { setCopyError('Unable to copy. Please select the text and copy it manually.') }
  }
  return (
    <section className="result-section" aria-labelledby="result-heading" aria-busy={loading}>
      <div className="section-heading"><span className="step-label">02 / SUMMARY</span><div className="result-tools">
        <button type="button" className="icon-button" disabled={!summary || loading} title={copied ? 'Copied' : 'Copy summary'} aria-label={copied ? 'Copied' : 'Copy summary'} onClick={handleCopy}>{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        <button type="button" className="icon-button" disabled={!summary || loading || !canRegenerate} title={canRegenerate ? 'Regenerate summary' : 'Select the PDF again to regenerate'} aria-label="Regenerate summary" onClick={onRegenerate}><RotateCcw size={18} className={isRegenerating ? 'spin' : ''} /></button>
      </div></div>
      <h2 id="result-heading">{summary ? 'The essential read.' : 'Your summary'}</h2>
      {loading ? <div className="result-loading" role="status"><LoaderCircle className="spin" size={25} /><span>{isRegenerating ? 'Refreshing your summary...' : 'Reading your source...'}</span><div className="skeleton-lines"><i /><i /><i /><i /></div></div> : summary ? <div className="summary-content"><span className="result-tag"><Check size={13} />Ready</span><h3>{title || 'Untitled summary'}</h3><p>{summary}</p><div className="summary-foot"><FileText size={14} />{summary.trim().split(/\s+/).length} words<span>English</span></div></div> :
        <div className="result-empty"><div className="document-motif" aria-hidden="true"><FileText size={44} strokeWidth={1} /><span /><span /><span /></div><p>No summary yet</p><span className="muted">Ready when you are.</span></div>}
      <span className="sr-only" role="status">{copied ? 'Summary copied' : ''}</span>
      {copyError && <p role="alert" className="inline-error">{copyError}</p>}
    </section>
  )
}
