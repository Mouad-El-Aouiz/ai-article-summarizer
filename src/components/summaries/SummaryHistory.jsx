import { useState } from 'react'
import { Search, Library, X } from 'lucide-react'
import SummaryCard from './SummaryCard'
import LoadingSpinner from '../common/LoadingSpinner'
export default function SummaryHistory({ summaries, onDelete, onView, loading = false, busy = false }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const matches = summaries.filter(item => (filter === 'all' || (filter === 'pdf' ? item.url?.startsWith('PDF:') : !item.url?.startsWith('PDF:'))) && [item.title, item.summary, item.url].some(value => value?.toLowerCase().includes(query.toLowerCase())))
  return (
    <section className="history-section" aria-labelledby="history-heading">
      <div className="history-heading"><div><span className="step-label">YOUR COLLECTION</span><h2 id="history-heading">Saved summaries <span className="count">{summaries.length}</span></h2></div><div className="search-field"><Search size={16} /><input aria-label="Search summaries" placeholder="Search your collection..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" aria-label="Clear search" title="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</div></div>
      <div className="history-tabs" role="group" aria-label="Filter summaries">{[['all', 'All sources'], ['url', 'Articles'], ['pdf', 'PDFs']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {loading ? <LoadingSpinner text="Loading your collection..." /> : matches.length ? <div className="history-list">{matches.map(item => <SummaryCard key={item.id} summary={item} onDelete={() => onDelete(item.id)} onView={() => onView(item)} busy={busy} />)}</div> : <div className="history-empty"><Library size={24} strokeWidth={1.5} /><strong>{summaries.length ? 'No matching summaries' : 'Your collection is empty'}</strong><span>{summaries.length ? 'Try another search or source filter.' : 'Your saved summaries will appear here.'}</span></div>}
    </section>
  )
}
