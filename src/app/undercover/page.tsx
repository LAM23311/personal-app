'use client'

import { useState, useEffect } from 'react'
import { generateWords } from '@/lib/ai'

type Phase = 'setup' | 'reveal' | 'playing' | 'result'

type WordPair = { wordA: string; wordB: string; category: string }

type Player = {
  id: number
  word: string
  isUndercover: boolean
  eliminated: boolean
}

export default function UndercoverPage() {
  // 咒语激活
  const [apiReady, setApiReady] = useState(false)
  const [showSpell, setShowSpell] = useState(false)
  const [spellInput, setSpellInput] = useState('')

  // 游戏状态
  const [phase, setPhase] = useState<Phase>('setup')
  const [playerCount, setPlayerCount] = useState(4)
  const [undercoverCount, setUndercoverCount] = useState(1)
  const [wordPool, setWordPool] = useState<WordPair[]>([])
  const [poolIndex, setPoolIndex] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentReveal, setCurrentReveal] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 当前使用的词对
  const currentPair = wordPool[poolIndex] || null

  useEffect(() => {
    if (localStorage.getItem('uc_spell') === '5566') {
      setApiReady(true)
    }
  }, [])

  function activateSpell() {
    if (spellInput === '5566') {
      localStorage.setItem('uc_spell', '5566')
      setApiReady(true)
      setShowSpell(false)
      setSpellInput('')
    }
  }

  // 生成10组词语
  async function fetchWordPool() {
    setLoading(true)
    setError('')
    try {
      const pairs = await generateWords('', '', '', '5566')
      setWordPool(pairs)
      setPoolIndex(0)
      return pairs
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 点击开始：生成词池并直接分配
  async function handleStart() {
    if (!apiReady) {
      setShowSpell(true)
      return
    }
    const pairs = await fetchWordPool()
    if (pairs && pairs.length > 0) {
      assignWords(pairs[0])
    }
  }

  // 换一组：用下一组词，直接重新分配
  function nextPair() {
    const nextIdx = poolIndex + 1
    if (nextIdx < wordPool.length) {
      setPoolIndex(nextIdx)
      assignWords(wordPool[nextIdx])
    }
  }

  // 分配词语给玩家
  function assignWords(pair: WordPair) {
    const newPlayers: Player[] = []
    const roles: boolean[] = []
    for (let i = 0; i < undercoverCount; i++) roles.push(true)
    while (roles.length < playerCount) roles.push(false)
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]]
    }
    for (let i = 0; i < playerCount; i++) {
      newPlayers.push({
        id: i + 1,
        word: roles[i] ? pair.wordB : pair.wordA,
        isUndercover: roles[i],
        eliminated: false,
      })
    }
    setPlayers(newPlayers)
    setCurrentReveal(0)
    setRevealed(false)
    setPhase('reveal')
  }

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

  function eliminate(id: number) {
    const updated = players.map(p => p.id === id ? { ...p, eliminated: true } : p)
    setPlayers(updated)
    const alive = updated.filter(p => !p.eliminated)
    const undercoverAlive = alive.filter(p => p.isUndercover)
    if (undercoverAlive.length === 0 || alive.length <= 2) {
      setPhase('result')
    }
  }

  function reset() {
    setPhase('setup')
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
          onClick={() => setShowSpell(true)}
          className={`text-sm px-2 py-1 rounded-full ${apiReady ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}
        >
          {apiReady ? 'AI ✓' : 'AI ✗'}
        </button>
      </div>

      {/* 咒语弹窗 */}
      {showSpell && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6" onClick={() => setShowSpell(false)}>
          <div className="card w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3 text-center">输入咒语</h3>
            <input
              className="form-input text-center text-lg mb-3"
              type="password"
              placeholder="····"
              value={spellInput}
              onChange={e => setSpellInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && activateSpell()}
              autoFocus
            />
            <button onClick={activateSpell} className="btn btn-primary w-full">激活</button>
          </div>
        </div>
      )}

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

          <button onClick={handleStart} disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? '生成中...' : !apiReady ? '点击激活AI' : '开始游戏'}
          </button>
        </div>
      )}

      {/* ===== 逐个看词 ===== */}
      {phase === 'reveal' && (
        <div className="text-center">
          {/* 换一组按钮 */}
          {poolIndex < wordPool.length - 1 && (
            <button
              onClick={nextPair}
              className="text-xs text-blue-400 mb-3 underline"
            >
              换一组词（剩余 {wordPool.length - poolIndex - 1} 组）
            </button>
          )}

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
            {currentPair && (
              <div className="text-sm text-gray-500">
                平民词：<span className="font-semibold text-blue-600">{currentPair.wordA}</span>
                {' · '}
                卧底词：<span className="font-semibold text-red-500">{currentPair.wordB}</span>
              </div>
            )}
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
