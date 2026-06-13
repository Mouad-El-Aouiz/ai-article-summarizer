// src/components/common/Header.jsx
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import Button from '../ui/Button'

export default function Header() {
  const { user, signOut } = useAuth()
  const { darkMode, setDarkMode } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Assistant de Résumé IA
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
            {user?.email}
          </span>
          
          <Button
            onClick={() => setDarkMode(!darkMode)}
            variant="secondary"
            size="small"
            aria-label="Dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </Button>
          
          <Button onClick={signOut} variant="danger" size="small">
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  )
}