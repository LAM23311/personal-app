'use client'

import { useState, useEffect } from 'react'
import { needToken, setToken, skipToken, clearCache } from '@/lib/supabase'

export default function TokenPrompt() {
  const [show, setShow] = useState(false)
  const [token, setTokenValue] = useState('')

  useEffect(() => {
    setShow(needToken())
  }, [])

  function handleSave() {
    const t = token.trim()
    if (!t) return
    setToken(t)
    setShow(false)
    window.location.reload()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4" style={{ background: 'rgba(74,64,53,0.5)' }}>
      <div className="card w-full max-w-sm">
        <h3 className="font-semibold mb-2" style={{ color: '#4A4035' }}>同步数据</h3>
        <p className="text-xs mb-3" style={{ color: '#8A7F73' }}>
          输入 GitHub Token 开启多设备数据同步。没有 Token 也能用，数据只保存在本机。
        </p>
        <input
          className="form-input mb-3"
          type="password"
          placeholder="ghp_xxxxxxxxxxxx"
          value={token}
          onChange={e => setTokenValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <button onClick={handleSave} className="btn btn-primary w-full mb-2">开启同步</button>
        <button onClick={() => { skipToken(); setShow(false) }} className="btn btn-ghost w-full text-xs">跳过，仅本地使用</button>
        <button
          onClick={() => {
            if (confirm('清空本地数据？此操作不可恢复。')) {
              localStorage.clear()
              clearCache()
              window.location.reload()
            }
          }}
          className="text-xs mt-2 w-full text-center"
          style={{ color: '#B0A899' }}
        >
          清空本地数据
        </button>
      </div>
    </div>
  )
}
