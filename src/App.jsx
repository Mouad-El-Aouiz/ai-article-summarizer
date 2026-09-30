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
import { supabase } from './services/supabaseClient'

function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
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
  const [currentType, setCurrentType] = useState('url')  // ← NOUVEAU : stocker le type
  const [currentPdfBase64, setCurrentPdfBase64] = useState(null)  // ← NOUVEAU : stocker le PDF pour régénération
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    if (user) {
      loadSummaries()
    }
  }, [user, loadSummaries])

  const handleSummaryGenerated = async ({ summary, title, url, type, pdfBase64 = null }) => {
    setCurrentSummary(summary)
    setCurrentUrl(url)
    setCurrentTitle(title || (type === 'url' ? 'Article résumé' : 'PDF résumé'))
    setCurrentType(type)  // ← Sauvegarder le type
    if (pdfBase64) {
      setCurrentPdfBase64(pdfBase64)  // ← Sauvegarder le PDF pour régénération
    }
    setError(null)
    
    // Sauvegarder dans l'historique seulement si ce n'est pas une régénération
    if (!isRegenerating) {
      try {
        await addSummary(url, summary, title)
      } catch {
        setError("Le résumé a été généré, mais n'a pas pu être ajouté à l'historique.")
      }
    }
  }

  const handleRegenerate = async () => {
    if (!currentUrl && !currentPdfBase64) return
    
    setIsRegenerating(true)
    setLoading(true)
    setError(null)
    
    try {
      let body = {}
      
      // ← CRUCIAL : Utiliser le bon type
      if (currentType === 'url') {
        body = { url: currentUrl, type: 'url' }
      } else if (currentType === 'pdf' && currentPdfBase64) {
        body = { pdfBase64: currentPdfBase64, type: 'pdf' }
      } else {
        throw new Error('Impossible de régénérer : données manquantes')
      }
      
      const { data, error: invokeError } = await supabase.functions.invoke('summarize-article', { body })
      
      if (invokeError) throw new Error(invokeError.message)
      if (!data?.summary) throw new Error('Pas de résumé reçu')
      
      // Mettre à jour le résumé actuel
      setCurrentSummary(data.summary)
      
      // Sauvegarder le nouveau résumé dans l'historique
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
    setCurrentType(summary.url?.startsWith('PDF:') ? 'pdf' : 'url')  // ← Déduire le type
    setCurrentPdfBase64(null)  // On ne peut pas régénérer un PDF depuis l'historique (pas stocké)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (authLoading) {
    return <LoadingSpinner text="Chargement..." fullScreen />
  }

  if (!user) {
    return <Login onSignIn={signInWithGoogle} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Header user={user} onSignOut={signOut} />
      
      <main className="max-w-4xl mx-auto p-6">
        <SummaryForm
          onSummaryGenerated={handleSummaryGenerated}
          onLoading={setLoading}
          onError={setError}
          initialType={currentType}
          isRegenerating={isRegenerating}
        />
        
        {(error || historyError) && (
          <ErrorMessage
            message={error || historyError}
            onDismiss={() => {
              setError(null)
              clearHistoryError()
            }}
          />
        )}
        
        {loading && <LoadingSpinner text={isRegenerating ? "Régénération du résumé..." : "Génération du résumé en cours..."} />}
        
        {currentSummary && (
          <div className="mb-8">
            <SummaryResult
              summary={currentSummary}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />
          </div>
        )}
        
        <SummaryHistory
          summaries={summaries}
          loading={historyLoading}
          onDelete={deleteSummary}
          onView={handleViewSummary}
        />
      </main>
      
    </div>
  )
}

export default App
