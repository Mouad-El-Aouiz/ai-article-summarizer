import { FileText, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Header({ user, onSignOut, signingOut = false }) {
  const { darkMode, setDarkMode } = useTheme()
  return (
    <header className="site-header">
      <a className="brand" href="#main"><span className="brand-mark"><FileText size={21} /></span><span>Article<span className="brand-light"> / Summarizer</span></span></a>
      <div className="header-actions">
        <span className="header-caption">Your reading workspace</span>
        <button className="icon-button" type="button" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light theme' : 'Dark theme'} aria-label={darkMode ? 'Light theme' : 'Dark theme'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user && <><span className="user-info"><span className="user-avatar" title={user.email}>{user.email?.slice(0, 1).toUpperCase() || 'U'}</span><span className="user-email">{user.email}</span></span><button className="icon-button" type="button" onClick={onSignOut} disabled={signingOut} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button></>}
      </div>
    </header>
  )
}
