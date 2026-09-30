// src/components/summaries/SummaryCard.jsx
export default function SummaryCard({ summary, onDelete, onView }) {
  const isPdf = summary.url?.startsWith('PDF:')

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
      <div className="flex justify-between items-start gap-2">
        <button type="button" className="flex-1 min-w-0 cursor-pointer text-left" onClick={onView}>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1 flex-wrap">
            <span>{isPdf ? '📄' : '🔗'}</span>
            <span className="truncate">
              {summary.url.length > 50 ? summary.url.substring(0, 50) + '...' : summary.url}
            </span>
            <span>•</span>
            <span>{new Date(summary.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
            {summary.summary.length > 200 ? summary.summary.substring(0, 200) + '…' : summary.summary}
          </p>
        </button>
        <button
          onClick={() => {
            if (window.confirm('Supprimer définitivement ce résumé ?')) onDelete()
          }}
          className="text-red-400 hover:text-red-600 transition px-2"
          title="Supprimer"
          aria-label="Supprimer ce résumé"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
