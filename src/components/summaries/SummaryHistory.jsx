// src/components/summaries/SummaryHistory.jsx
import SummaryCard from './SummaryCard'

export default function SummaryHistory({ summaries, onDelete, onView, loading = false }) {
  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement de l'historique…</div>
  }
  if (summaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Aucun résumé pour le moment</p>
          <p className="text-sm mt-1">Résumez un article ou un PDF ci-dessus</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          📚 Historique des résumés
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {summaries.length} résumé(s)
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {summaries.map((item) => (
          <SummaryCard
            key={item.id}
            summary={item}
            onDelete={() => onDelete(item.id)}
            onView={() => onView(item)}
          />
        ))}
      </div>
    </div>
  )
}
