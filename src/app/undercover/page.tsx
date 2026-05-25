'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { generateWords } from '@/lib/ai'

type Phase = 'setup' | 'reveal' | 'playing' | 'result'
type WordPair = { wordA: string; wordB: string; category: string }
type Player = { id: number; word: string; isUndercover: boolean; eliminated: boolean }

const POOL_MAX = 10
const POOL_LOW = 5 // 低于此值触发补充

const S = {
  primary: '#4A4035',
  secondary: '#8A7F73',
  muted: '#B0A899',
  accent: '#8FBF8F',
  accentBg: 'rgba(143,191,143,0.12)',
  accentBorder: 'rgba(143,191,143,0.4)',
  danger: '#D4766A',
  dangerBg: 'rgba(212,118,106,0.1)',
  dangerBorder: 'rgba(212,118,106,0.3)',
  blue: '#7BA7C9',
  blueBg: 'rgba(123,167,201,0.1)',
  tagBg: '#EDE7DB',
}

export default function UndercoverPage() {
  const [apiReady, setApiReady] = useState(false)
  const [showSpell, setShowSpell] = useState(false)
  const [spellInput, setSpellInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const [phase, setPhase] = useState<Phase>('setup')
  const [playerCount, setPlayerCount] = useState(4)
  const [undercoverCount, setUndercoverCount] = useState(1)
  const [poolSize, setPoolSize] = useState(0)
  const [currentPair, setCurrentPair] = useState<WordPair | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentReveal, setCurrentReveal] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')

  // 用 ref 做词池队列，跨渲染保持
  const poolRef = useRef<WordPair[]>([])
  const aiRef = useRef(false) // 防止重复触发 AI

  useEffect(() => {
    if (localStorage.getItem('uc_spell') === '5566') setApiReady(true)
  }, [])

  const syncPool = () => setPoolSize(poolRef.current.length)

  function activateSpell() {
    if (spellInput === '5566') {
      localStorage.setItem('uc_spell', '5566')
      setApiReady(true)
      setShowSpell(false)
      setSpellInput('')
    }
  }

  // 从本地词汇库取词
  async function fetchLocalPairs(): Promise<WordPair[]> {
    try {
      const resp = await fetch('/api/cihui')
      const data = await resp.json()
      return data.pairs || []
    } catch { return [] }
  }

  // 检查池子是否需要 AI 补充
  const checkAndRefill = useCallback(() => {
    if (!apiReady || aiRef.current) return
    const need = POOL_MAX - poolRef.current.length
    if (need <= 0) return
    aiRef.current = true
    setAiLoading(true)
    generateWords('', '', '', '5566')
      .then(pairs => {
        if (pairs && pairs.length > 0) {
          poolRef.current.push(...pairs.slice(0, need))
          syncPool()
        }
      })
      .catch(() => {})
      .finally(() => { aiRef.current = false; setAiLoading(false) })
  }, [apiReady])

  // 从池中取一组词，不够就补本地
  async function popPair(): Promise<WordPair | null> {
    if (poolRef.current.length > 0) {
      const pair = poolRef.current.shift()!
      syncPool()
      return pair
    }
    // 池空了，紧急从本地取
    const local = await fetchLocalPairs()
    if (local.length === 0) return null
    poolRef.current.push(...local)
    const pair = poolRef.current.shift()!
    syncPool()
    return pair
  }

  // 开始游戏
  async function handleStart() {
    setError('')
    const pair = await popPair()
    if (!pair) { setError('词汇库为空'); return }
    setCurrentPair(pair)
    assignWords(pair)
    // 池子不够就补
    if (poolRef.current.length < POOL_LOW) checkAndRefill()
  }

  // 换一组
  function nextPair() {
    if (poolRef.current.length === 0 && !aiLoading) {
      checkAndRefill()
      return
    }
    const pair = poolRef.current.shift()
    if (!pair) return
    syncPool()
    setCurrentPair(pair)
    assignWords(pair)
    if (poolRef.current.length < POOL_LOW) checkAndRefill()
  }

  function assignWords(pair: WordPair) {
    const roles: boolean[] = []
    for (let i = 0; i < undercoverCount; i++) roles.push(true)
    while (roles.length < playerCount) roles.push(false)
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]]
    }
    setPlayers(Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1, word: roles[i] ? pair.wordB : pair.wordA, isUndercover: roles[i], eliminated: false,
    })))
    setCurrentReveal(0)
    setRevealed(false)
    setPhase('reveal')
  }

  function eliminate(id: number) {
    const updated = players.map(p => p.id === id ? { ...p, eliminated: true } : p)
    setPlayers(updated)
    const alive = updated.filter(p => !p.eliminated)
    if (alive.filter(p => p.isUndercover).length === 0 || alive.length <= 2) setPhase('result')
  }

  function reset() {
    setPhase('setup')
    setPlayers([])
    setCurrentReveal(0)
    setRevealed(false)
    setError('')
    // 池子不清空，跨局复用
  }

  const alivePlayers = players.filter(p => !p.eliminated)
  const winner = phase === 'result'
    ? (players.filter(p => p.isUndercover).every(p => p.eliminated) ? 'civilians' : 'undercover')
    : null

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5 mt-2">
        <h1 className="text-2xl font-bold" style={{ color: S.primary }}>谁是卧底</h1>
        <button
          onClick={() => setShowSpell(true)}
          className="text-sm px-2.5 py-1 rounded-full font-medium"
          style={{
            background: apiReady ? S.accentBg : S.tagBg,
            color: apiReady ? '#5A9A5A' : S.muted,
            border: `1px solid ${apiReady ? S.accentBorder : 'transparent'}`,
          }}
        >
          {apiReady ? 'AI ✓' : 'AI ✗'}
        </button>
      </div>

      {/* 咒语弹窗 */}
      {showSpell && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-6" style={{ background: 'rgba(74,64,53,0.4)' }} onClick={() => setShowSpell(false)}>
          <div className="card w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3 text-center" style={{ color: S.primary }}>输入咒语</h3>
            <input className="form-input text-center text-lg mb-3" type="password" placeholder="····"
              value={spellInput} onChange={e => setSpellInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && activateSpell()} autoFocus />
            <button onClick={activateSpell} className="btn btn-primary w-full">激活</button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: S.dangerBg, color: S.danger, border: `1px solid ${S.dangerBorder}` }}>{error}</div>
      )}

      {/* ===== 设置阶段 ===== */}
      {phase === 'setup' && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">玩家人数</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setPlayerCount(Math.max(3, playerCount - 1))} className="btn btn-ghost text-xl px-3">-</button>
              <span className="text-2xl font-bold w-12 text-center" style={{ color: S.primary }}>{playerCount}</span>
              <button onClick={() => setPlayerCount(Math.min(12, playerCount + 1))} className="btn btn-ghost text-xl px-3">+</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">卧底人数</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setUndercoverCount(Math.max(1, undercoverCount - 1))} className="btn btn-ghost text-xl px-3">-</button>
              <span className="text-2xl font-bold w-12 text-center" style={{ color: S.primary }}>{undercoverCount}</span>
              <button onClick={() => setUndercoverCount(Math.min(playerCount - 2, undercoverCount + 1))} className="btn btn-ghost text-xl px-3">+</button>
            </div>
          </div>
          <button onClick={handleStart} className="btn btn-primary w-full mt-2">开始游戏</button>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs" style={{ color: S.muted }}>词池 {poolSize}/{POOL_MAX}</span>
            {aiLoading && <span className="text-xs" style={{ color: S.accent }}>AI补充中...</span>}
          </div>
        </div>
      )}

      {/* ===== 逐个看词 ===== */}
      {phase === 'reveal' && (
        <div className="text-center">
          {poolSize > 0 && (
            <button onClick={nextPair} className="text-xs mb-3 font-medium" style={{ color: S.accent }}>
              换一组词（池中剩余 {poolSize} 组{aiLoading ? '，AI补充中...' : ''}）
            </button>
          )}
          {poolSize === 0 && !aiLoading && (
            <button onClick={() => { checkAndRefill(); setTimeout(nextPair, 500) }} className="text-xs mb-3 font-medium" style={{ color: S.muted }}>
              换一组词（正在补充...）
            </button>
          )}
          <div className="text-sm mb-4" style={{ color: S.secondary }}>
            请把手机递给 玩家 {players[currentReveal]?.id}
          </div>
          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="card w-full py-14 active:scale-95 transition-transform">
              <div className="text-4xl mb-3">👆</div>
              <div className="text-lg font-semibold" style={{ color: S.primary }}>点击查看你的词语</div>
              <div className="text-xs mt-1" style={{ color: S.muted }}>只有自己能看到</div>
            </button>
          ) : (
            <div className="card py-14">
              <div className="text-sm mb-2" style={{ color: S.secondary }}>你的词语是</div>
              <div className="text-4xl font-bold mb-4" style={{ color: S.primary }}>{players[currentReveal]?.word}</div>
              <div className="text-xs mb-6" style={{ color: S.muted }}>记住后交给下一个人</div>
              <button onClick={() => { if (currentReveal < players.length - 1) { setCurrentReveal(currentReveal + 1); setRevealed(false) } else setPhase('playing') }} className="btn btn-primary">
                {currentReveal < players.length - 1 ? `交给玩家 ${players[currentReveal + 1]?.id}` : '全部就位，开始游戏'}
              </button>
            </div>
          )}
          <div className="text-xs mt-4" style={{ color: S.muted }}>{currentReveal + 1} / {players.length}</div>
        </div>
      )}

      {/* ===== 游戏进行中 ===== */}
      {phase === 'playing' && (
        <div>
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: S.secondary }}>存活玩家</span>
              <span className="text-sm font-bold" style={{ color: S.primary }}>{alivePlayers.length}人</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {players.map(p => (
                <div key={p.id} className="text-center py-2 rounded-xl text-sm font-medium" style={{
                  background: p.eliminated ? '#EDE7DB' : S.blueBg,
                  color: p.eliminated ? S.muted : S.blue,
                  textDecoration: p.eliminated ? 'line-through' : 'none',
                  border: p.eliminated ? 'none' : `1px solid rgba(123,167,201,0.2)`,
                }}>
                  {p.id}号
                </div>
              ))}
            </div>
          </div>
          <div className="text-sm mb-2 text-center" style={{ color: S.secondary }}>描述完毕后，点击淘汰投票出局的玩家</div>
          <div className="grid grid-cols-3 gap-2">
            {alivePlayers.map(p => (
              <button key={p.id} onClick={() => eliminate(p.id)} className="card py-4 active:scale-95 transition-transform" style={{ borderColor: 'transparent' }}>
                <div className="text-lg font-bold" style={{ color: S.primary }}>{p.id}号</div>
                <div className="text-xs mt-1" style={{ color: S.danger }}>淘汰</div>
              </button>
            ))}
          </div>
          <button onClick={() => setPhase('result')} className="btn btn-ghost w-full mt-4" style={{ color: S.muted }}>提前结束查看结果</button>
        </div>
      )}

      {/* ===== 游戏结果 ===== */}
      {phase === 'result' && (
        <div className="text-center">
          <div className="card mb-4">
            <div className="text-6xl mb-3">{winner === 'civilians' ? '🎉' : '🕵️'}</div>
            <div className="text-2xl font-bold mb-2" style={{ color: S.primary }}>
              {winner === 'civilians' ? '平民胜利！' : '卧底胜利！'}
            </div>
            {currentPair && (
              <div className="text-sm" style={{ color: S.secondary }}>
                平民词：<span className="font-semibold" style={{ color: S.blue }}>{currentPair.wordA}</span>
                {' · '}
                卧底词：<span className="font-semibold" style={{ color: S.danger }}>{currentPair.wordB}</span>
              </div>
            )}
          </div>
          <div className="card mb-4">
            <div className="text-sm font-semibold mb-3 text-left" style={{ color: S.primary }}>玩家身份</div>
            <div className="grid grid-cols-4 gap-2">
              {players.map(p => (
                <div key={p.id} className="text-center py-2 rounded-xl text-sm" style={{
                  background: p.isUndercover ? S.dangerBg : S.blueBg,
                  color: p.isUndercover ? S.danger : S.blue,
                  border: `1px solid ${p.isUndercover ? S.dangerBorder : 'rgba(123,167,201,0.2)'}`,
                  opacity: p.eliminated ? 0.5 : 1,
                }}>
                  <div className="font-bold">{p.id}号</div>
                  <div className="text-xs">{p.isUndercover ? '卧底' : '平民'}</div>
                  {p.eliminated && <div className="text-xs" style={{ color: S.muted }}>已出局</div>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={reset} className="btn btn-primary w-full">再来一局</button>
          <div className="text-xs text-center mt-2" style={{ color: S.muted }}>词池剩余 {poolSize} 组</div>
        </div>
      )}
    </div>
  )
}
