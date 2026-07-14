import { useCallback, useState } from 'react'
import { supabase } from './lib/supabase'

const indexId = import.meta.env.VITE_ADVISING_INDEX_ID

export function useAdvisingSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (query, program = null) => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setResults([])
      setHasSearched(false)
      return
    }

    if (!indexId) {
      setError('Missing VITE_ADVISING_INDEX_ID in .env')
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    const { data, error: rpcError } = await supabase.rpc(
      'search_advising_sections',
      {
        p_index_id: indexId,
        p_query: trimmedQuery,
        p_limit: 8,
        p_program: program,
      }
    )

    if (rpcError) {
      setError(rpcError.message)
      setResults([])
    } else {
      setResults(data ?? [])
    }

    setLoading(false)
  }, [])

  return { results, loading, error, hasSearched, search }
}
