'use client'

import { useState, useEffect } from 'react'
import { checkRemoteUpdate, clearCache, getProjects, getJournals } from '@/lib/supabase'

export default function DataSync() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    // 每 30 秒检查一次
    const id = setInterval(async () => {
      const changed = await checkRemoteUpdate()
      if (changed) setHasUpdate(true)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  async function handleReload() {
    clearCache()
    // 预加载一次触发刷新
    await getProjects()
    await getJournals()
    setHasUpdate(false)
    window.location.reload()
  }

  if (!hasUpdate) return null

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg cursor-pointer active:scale-95 transition-transform"
      style={{
        background: 'linear-gradient(135deg, #5A9A5A, #4A8A4A)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 600,
      }}
      onClick={handleReload}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      有新数据，点击更新
      <button
        onClick={e => { e.stopPropagation(); setHasUpdate(false) }}
        className="ml-1 text-white/70 hover:text-white"
      >
        ×
      </button>
    </div>
  )
}
