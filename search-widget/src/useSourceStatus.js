import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

const indexId = import.meta.env.VITE_ADVISING_INDEX_ID

export function useSourceStatus() {
  const [sources, setSources] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadSources() {
      if (!indexId) {
        return
      }

      const { data, error: rpcError } = await supabase.rpc(
        'get_advising_source_status',
        { p_index_id: indexId }
      )

      if (!active) {
        return
      }

      if (rpcError) {
        setError(rpcError.message)
        return
      }

      setSources(data ?? [])
    }

    loadSources()

    return () => {
      active = false
    }
  }, [])

  return { sources, error }
}
