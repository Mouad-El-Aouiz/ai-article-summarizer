// src/hooks/useSummaries.js
import { useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

export function useSummaries(userId) {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadSummaries = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setSummaries(data || [])
    }
    setLoading(false)
  }, [userId])

  const addSummary = async (url, summary, title) => {
    if (!userId) return null
    
    const { data, error: insertError } = await supabase
      .from('summaries')
      .insert({ user_id: userId, url, summary, title })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    setSummaries(prev => [data, ...prev])
    return data
  }

  const deleteSummary = async (id) => {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    setSummaries(prev => prev.filter(item => item.id !== id))
  }

  return { summaries, loading, error, loadSummaries, addSummary, deleteSummary }
}