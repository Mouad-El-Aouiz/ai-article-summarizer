import { useState, useRef } from 'react'
import { ArrowUpRight, FileText, Link2, LoaderCircle, Upload, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { generateSummary } from '../../services/summaryService'

export default function SummaryForm({ onSummaryGenerated, onLoading, onError, initialType = 'url', isRegenerating = false, busy = false }) {
  const [inputType, setInputType] = useState(initialType)
  const [url, setUrl] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const disabled = busy || submitting || isRegenerating

  const selectFile = (file) => {
    if (!file || disabled) return
    if (!file.name.toLowerCase().endsWith('.pdf')) { onError('Select a PDF file.'); return }
    if (file.size > 10 * 1024 * 1024) { onError('The PDF must not exceed 10 MB.'); return }
    setPdfFile(file)
    onError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (disabled) return
    setSubmitting(true)
    onLoading(true)
    onError(null)
    try {
      let pdfData = null
      if (inputType === 'url' && !url.trim()) throw new Error('Enter an article URL')
      if (inputType === 'pdf') {
        if (!pdfFile) throw new Error('Select a PDF file')
        pdfData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = () => reject(new Error('Unable to read this PDF'))
          reader.readAsDataURL(pdfFile)
        })
      }
      const body = inputType === 'url' ? { type: 'url', url: url.trim() } : { type: 'pdf', pdfBase64: pdfData }
      const data = await generateSummary(body)
      await onSummaryGenerated({ ...data, url: inputType === 'url' ? url.trim() : `PDF: ${pdfFile.name}`, type: inputType, pdfBase64: pdfData })
    } catch (error) {
      onError(error.message)
    } finally {
      setSubmitting(false)
      onLoading(false)
    }
  }

  return (
    <section className="source-section" aria-labelledby="source-heading">
      <div className="section-heading"><span className="step-label">01 / SOURCE</span><span className="muted text-xs">Article or document</span></div>
      <h2 id="source-heading">Start with a source.</h2>
      <form onSubmit={handleSubmit}>
        <div className="segmented" role="group" aria-label="Source type">
          <button type="button" aria-pressed={inputType === 'url'} className={inputType === 'url' ? 'selected' : ''} disabled={disabled} onClick={() => setInputType('url')}><Link2 size={16} />Article URL</button>
          <button type="button" aria-pressed={inputType === 'pdf'} className={inputType === 'pdf' ? 'selected' : ''} disabled={disabled} onClick={() => setInputType('pdf')}><FileText size={16} />PDF document</button>
        </div>
        {inputType === 'url' ? <div className="source-fields"><label htmlFor="article-url">Article URL</label><Input id="article-url" type="url" placeholder="https://example.com/article" value={url} onChange={e => setUrl(e.target.value)} disabled={disabled} required /><span className="field-hint">Public web article</span></div> :
          <div className="source-fields">
            <label htmlFor="pdf-upload">PDF document</label>
            <div className={`upload-zone ${dragging ? 'is-dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]) }}>
              <input ref={fileInputRef} id="pdf-upload" type="file" accept=".pdf,application/pdf" className="sr-only" disabled={disabled} onChange={e => selectFile(e.target.files[0])} />
              <label htmlFor="pdf-upload" className={disabled ? 'upload-label is-disabled' : 'upload-label'}><span className="upload-icon">{pdfFile ? <FileText size={26} /> : <Upload size={26} />}</span><strong>{pdfFile ? pdfFile.name : 'Choose a PDF'}</strong><span>{pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'or drop it here'}</span></label>
              {pdfFile && <button type="button" className="icon-button upload-remove" aria-label="Remove PDF" title="Remove PDF" disabled={disabled} onClick={() => { setPdfFile(null); fileInputRef.current.value = '' }}><X size={16} /></button>}
            </div>
            <span className="field-hint">Text-based PDF · Up to 10 MB</span>
          </div>}
        <Button type="submit" disabled={disabled || (inputType === 'url' ? !url.trim() : !pdfFile)} className="source-submit">{submitting ? <><LoaderCircle size={17} className="spin" />Generating...</> : <>Generate summary<ArrowUpRight size={18} /></>}</Button>
        <div className="source-meta"><span><span className="status-dot" />English output</span><span>3–5 sentences</span></div>
      </form>
    </section>
  )
}
