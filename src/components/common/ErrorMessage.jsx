export default function ErrorMessage({ message, onDismiss }) {
  return (
    <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4 flex justify-between items-center">
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-500 hover:text-red-700" aria-label="Dismiss error message">✕</button>
      )}
    </div>
  )
}
