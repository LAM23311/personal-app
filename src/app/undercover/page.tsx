'use client'

import { useState, useEffect, useCallback } from 'react'
import { generateWords } from '@/lib/ai'

type Phase = 'setup' | 'words' | 'reveal' | 'playing' | 'result'

type Player = {
  id: number
  word: string
  isUndercover: boolean
  eliminated: boolean
}

export default function UndercoverPage() {
  // API 设置
  const [apiKey, setApiKey] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [model, setModel] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // 游戏状态
  const [phase, setPhase] = useState<Phase>('setup')
  const [playerCount, setPlayerCount] = useState(4)
  const [undercoverCount, setUndercoverCount] = useState(1)
  const [wordA, setWordA] = useState('')
  const [wordB, setWordB] = useState('')
  const [category, setCategory] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [currentReveal, setCurrentReveal] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 加载设置
  useEffect(() => {
    const saved = localStorage.getItem('uc_settings')
    if (saved) {
      try {
        const s = JSON.parse(saved)
        setApiKey(s.apiKey || '')
        setApiBase(s.apiBase || '')
        setModel(s.model || '')
      } catch {}
    }
  }, [])

  function saveSettings() {
    localStorage.setItem('uc_settings', JSON.stringify({ apiKey, apiBase, model }))
    setShowSettings(false)
  }

  // 生成词语
  async function handleGenerate() {
    if (!apiKey || !apiBase || !model) {
      setShowSettings(true)
      setError('请先配置API设置')
      return
    }
    setLoading(true)
    setError('')
    try {
      const words = await generateWords(apiKey, apiBase, model)
      setWordA(words.wordA)
      setWordB(words.wordB)
      setCategory(words.category)
      setPhase('words')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  // 分配词语给玩家
  function assignWords() {
    const newPlayers: Player[] = []
    // 创建角色分配：先放卧底再放平民
    const roles: boolean[] = []
    for (let i = 0; i < undercoverCount; i++) roles.push(true)
    while (roles.length < playerCount) roles.push(false)
    // 随机打乱
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]]
    }
    for (let i = 0; i < playerCount; i++) {
      newPlayers.push({
        id: i + 1,
        word: roles[i] ? wordB : wordA,
        isUndercover: roles[i],
        eliminated: false,
      })
    }
    setPlayers(newPlayers)
    setCurrentReveal(0)
    setRevealed(false)
    setPhase('reveal')
  }

  // 查看词语
  function handleReveal() {
    setRevealed(true)
  }

  function nextReveal() {
    if (currentReveal < players.length - 1) {
      setCurrentReveal(currentReveal + 1)
      setRevealed(false)
    } else {
      setPhase('playing')
    }
  }

  // 淘汰玩家
  function eliminate(id: number) {
    const updated = players.map(p => p.id === id ? { ...p, eliminated: true } : p)
    setPlayers(updated)

    const alive = updated.filter(p => !p.eliminated)
    const undercoverAlive = alive.filter(p => p.isUndercover)

    if (undercoverAlive.length === 0) {
      setPhase('result')
    } else if (alive.length <= 2) {
      setPhase('result')
    }
  }

  // 重新开始
  function reset() {
    setPhase('setup')
    setWordA('')
    setWordB('')
    setCategory('')
    setPlayers([])
    setCurrentReveal(0)
    setRevealed(false)
    setError('')
  }

  const alivePlayers = players.filter(p => !p.eliminated)
  const winner = phase === 'result'
    ? (players.filter(p => p.isUndercover).every(p => p.eliminated) ? 'civilians' : 'undercover')
    : null

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h1 className="text-2xl font-bold">谁是卧底</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          ⚙️
        </button>
      </div>

      {/* API 设置 */}
      {showSettings && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">API 设置</h3>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input className="form-input" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          </div>
          <div className="form-group">
            <label className="form-label">API Base</label>
            <input className="form-input" value={apiBase} onChange={e => setApiBase(e.target.value)} placeholder="https://api.openai.com/v1" />
          </div>
          <div className="form-group">
            <label className="form-label">模型</label>
            <input className="form-input" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4o-mini" />
          </div>
          <button onClick={saveSettings} className="btn btn-primary w-full">保存设置</button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {/* ===== 设置阶段 ===== */}
      {phase === 'setup' && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">玩家人数</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPlayerCount(Math.max(3, playerCount - 1))} className="btn btn-ghost text-xl px-3">-</button>
              <span className="text-2xl font-bold w-12 text-center">{playerCount}</span>
              <button onClick={() => setPlayerCount(Math.min(12, playerCount + 1))} className="btn btn-ghost text-xl px-3">+</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">卧底人数</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setUndercoverCount(Math.max(1, undercoverCount - 1))} className="btn btn-ghost text-xl px-3">-</button>
              <span className="text-2xl font-bold w-12 text-center">{undercoverCount}</span>
              <button onClick={() => setUndercoverCount(Math.min(playerCount - 2, undercoverCount + 1))} className="btn btn-ghost text-xl px-3">+</button>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? '生成中...' : '生成词语'}
          </button>
        </div>
      )}

      {/* ===== 词语确认 ===== */}
      {phase === 'words' && (
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-4">类别：{category}</div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs text-blue-500 mb-1">平民词</div>
              <div className="text-2xl font-bold">{wordA}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-xs text-red-500 mb-1">卧底词</div>
              <div className="text-2xl font-bold">{wordB}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-4">
            {playerCount}人游戏 · {undercoverCount}个卧底 · {playerCount - undercoverCount}个平民
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={loading} className="btn btn-ghost flex-1">
              换一组
            </button>
            <button onClick={assignWords} className="btn btn-primary flex-1">
              开始分配
            </button>
          </div>
        </div>
      )}

      {/* ===== 逐个看词 ===== */}
      {phase === 'reveal' && (
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-4">
            请把手机递给 玩家 {players[currentReveal]?.id}
          </div>

          {!revealed ? (
            <button
              onClick={handleReveal}
              className="card w-full py-12 active:scale-95 transition-transform"
            >
              <div className="text-4xl mb-3">👆</div>
              <div className="text-lg font-semibold">点击查看你的词语</div>
              <div className="text-xs text-gray-400 mt-1">只有自己能看到</div>
            </button>
          ) : (
            <div className="card py-12">
              <div className="text-sm text-gray-500 mb-2">你的词语是</div>
              <div className="text-4xl font-bold mb-4">{players[currentReveal]?.word}</div>
              <div className="text-xs text-gray-400 mb-6">记住后交给下一个人</div>
              <button onClick={nextReveal} className="btn btn-primary">
                {currentReveal < players.length - 1
                  ? `交给玩家 ${players[currentReveal + 1]?.id}`
                  : '全部就位，开始游戏'}
              </button>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-4">
            {currentReveal + 1} / {players.length}
          </div>
        </div>
      )}

      {/* ===== 游戏进行中 ===== */}
      {phase === 'playing' && (
        <div>
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">存活玩家</span>
              <span className="text-sm font-bold">{alivePlayers.length}人</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {players.map(p => (
                <div
                  key={p.id}
                  className={`text-center py-2 rounded-lg text-sm font-medium transition-all ${
                    p.eliminated
                      ? 'bg-gray-100 text-gray-300 line-through'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {p.id}号
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-2 text-center">
            描述完毕后，点击淘汰投票出局的玩家
          </div>

          <div className="grid grid-cols-3 gap-2">
            {alivePlayers.map(p => (
              <button
                key={p.id}
                onClick={() => eliminate(p.id)}
                className="card py-4 active:scale-95 transition-transform hover:border-red-300 hover:border"
              >
                <div className="text-lg font-bold">{p.id}号</div>
                <div className="text-xs text-red-400 mt-1">淘汰</div>
              </button>
            ))}
          </div>

          <button onClick={() => setPhase('result')} className="btn btn-ghost w-full mt-4 text-gray-400">
            提前结束查看结果
          </button>
        </div>
      )}

      {/* ===== 游戏结果 ===== */}
      {phase === 'result' && (
        <div className="text-center">
          <div className="card mb-4">
            <div className="text-6xl mb-3">
              {winner === 'civilians' ? '🎉' : '🕵️'}
            </div>
            <div className="text-2xl font-bold mb-2">
              {winner === 'civilians' ? '平民胜利！' : '卧底胜利！'}
            </div>
            <div className="text-sm text-gray-500">
              平民词：<span className="font-semibold text-blue-600">{wordA}</span>
              {' · '}
              卧底词：<span className="font-semibold text-red-500">{wordB}</span>
            </div>
          </div>

          <div className="card mb-4">
            <div className="text-sm font-semibold mb-3 text-left">玩家身份</div>
            <div className="grid grid-cols-4 gap-2">
              {players.map(p => (
                <div
                  key={p.id}
                  className={`text-center py-2 rounded-lg text-sm ${
                    p.isUndercover
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-blue-50 text-blue-600'
                  } ${p.eliminated ? 'opacity-50' : ''}`}
                >
                  <div className="font-bold">{p.id}号</div>
                  <div className="text-xs">{p.isUndercover ? '卧底' : '平民'}</div>
                  {p.eliminated && <div className="text-xs text-gray-400">已出局</div>}
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset} className="btn btn-primary w-full">再来一局</button>
        </div>
      )}
    </div>
  )
}
