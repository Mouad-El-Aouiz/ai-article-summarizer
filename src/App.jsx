// src/App.jsx
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSummaries } from './hooks/useSummaries'
import Header from './components/common/Header'
import Login from './components/auth/Login'
import SummaryForm from './components/summaries/SummaryForm'
import SummaryResult from './components/summaries/SummaryResult'
import SummaryHistory from './components/summaries/SummaryHistory'
import ErrorMessage from './components/common/ErrorMessage'
import LoadingSpinner from './components/common/LoadingSpinner'
import { generateSummary } from './services/summaryService'

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const {
    summaries,
    loading: historyLoading,
    error: historyError,
    clearError: clearHistoryError,
    loadSummaries,
    addSummary,
    deleteSummary,
  } = useSummaries(user?.id)
  
  const [currentSummary, setCurrentSummary] = useState(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentType, setCurrentType] = useState('url')
  const [currentPdfBase64, setCurrentPdfBase64] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (user) {
      loadSummaries()
    }
  }, [user, loadSummaries])

  const handleSummaryGenerated = async ({ summary, title, url, type, pdfBase64 = null }) => {
    setCurrentSummary(summary)
    setCurrentUrl(url)
    setCurrentTitle(title || (type === 'url' ? 'Summarized article' : 'Summarized PDF'))
    setCurrentType(type)
    setCurrentPdfBase64(pdfBase64)
    setError(null)
    
    // Save the result only when it was generated from a new submission.
    if (!isRegenerating) {
      try {
        await addSummary(url, summary, title)
      } catch {
        setError('The summary was generated but could not be added to your history.')
      }
    }
  }

  const handleRegenerate = async () => {
    if (loading) return
    if (!currentUrl && !currentPdfBase64) return
    
    setIsRegenerating(true)
    setLoading(true)
    setError(null)
    
    try {
      let body = {}
      
      if (currentType === 'url') {
        body = { url: currentUrl, type: 'url' }
      } else if (currentType === 'pdf' && currentPdfBase64) {
        body = { pdfBase64: currentPdfBase64, type: 'pdf' }
      } else {
        throw new Error('Unable to regenerate: source data is missing')
      }
      
      const data = await generateSummary(body)
      
      setCurrentSummary(data.summary)
      
      await addSummary(currentUrl, data.summary, currentTitle)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRegenerating(false)
    }
  }

  const handleViewSummary = (summary) => {
    setCurrentSummary(summary.summary)
    setCurrentUrl(summary.url)
    setCurrentTitle(summary.title)
    setCurrentType(summary.url?.startsWith('PDF:') ? 'pdf' : 'url')
    setCurrentPdfBase64(null) // PDF contents are not stored in the history.
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (authLoading) {
    return <LoadingSpinner text="Loading..." fullScreen />
  }

  if (!user) {
    return <Login onSignIn={signIn} onSignUp={signUp} />
  }

  return (
    <div className="app-shell">
      <Header user={user} signingOut={signingOut || loading} onSignOut={async () => {
        setSigningOut(true)
        try {
          await signOut()
          setCurrentSummary(null)
          setCurrentPdfBase64(null)
          setCurrentUrl('')
          setCurrentType('url')
          setError(null)
        } catch { setError('Unable to sign out. Please try again.') }
        finally { setSigningOut(false) }
      }} />
      
      <main id="main" className="workspace">
        <div className="workspace-heading"><div><span className="step-label">READ LESS. KNOW MORE.</span><h1>Your workspace</h1></div><span className="workspace-status"><span className="status-dot" />Ready to read</span></div>
        {(error || historyError) && <ErrorMessage message={error || historyError} onDismiss={() => { setError(null); clearHistoryError() }} />}
        <div className="editor-layout">
        <SummaryForm
          onSummaryGenerated={handleSummaryGenerated}
          onLoading={setLoading}
          onError={setError}
          initialType={currentType}
          isRegenerating={isRegenerating}
          busy={loading || signingOut}
        />
            <SummaryResult
              summary={currentSummary}
              title={currentTitle}
              loading={loading}
              canRegenerate={currentType === 'url' || Boolean(currentPdfBase64)}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />
        </div>
        
        <SummaryHistory
          summaries={summaries}
          loading={historyLoading}
          onDelete={deleteSummary}
          onView={handleViewSummary}
          busy={loading || signingOut}
        />
        <footer className="workspace-footer"><span>Article / Summarizer</span><span>A little less reading. A little more clarity.</span></footer>
      </main>
      
    </div>
  )
}

export default App
