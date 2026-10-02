import { FileText, Link2, Trash2, ArrowUpRight } from 'lucide-react'
export default function SummaryCard({ summary, onDelete, onView, busy = false }) {
  const isPdf = summary.url?.startsWith('PDF:')
  return (
    <div className="history-row">
      <span className={`history-type ${isPdf ? 'history-type--pdf' : ''}`}>{isPdf ? <FileText size={18} /> : <Link2 size={18} />}</span>
      <button className="history-open" type="button" onClick={onView} disabled={busy}>
        <strong>{summary.title || (isPdf ? summary.url.slice(5) : summary.url)}</strong>
        <span>{summary.summary}</span>
      </button>
      <span className="history-date">{new Date(summary.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      <button className="icon-button history-view" type="button" title="Open summary" aria-label="Open summary" onClick={onView} disabled={busy}><ArrowUpRight size={18} /></button>
      <button className="icon-button delete-button" type="button" title="Delete summary" aria-label="Delete summary" disabled={busy} onClick={() => { if (window.confirm('Permanently delete this summary?')) onDelete() }}><Trash2 size={16} /></button>
    </div>
  )
}
