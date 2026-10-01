import { supabase } from './supabaseClient'

export async function generateSummary(body) {
  const { data, error } = await supabase.functions.invoke('summarize-article', { body })

  if (error) throw new Error(error.message)
  if (!data?.summary) throw new Error('No summary was returned')

  return data
}
