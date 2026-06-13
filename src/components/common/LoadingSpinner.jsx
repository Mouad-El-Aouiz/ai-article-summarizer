export default function LoadingSpinner({ text = 'Chargement...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return <div className="py-8">{content}</div>
}