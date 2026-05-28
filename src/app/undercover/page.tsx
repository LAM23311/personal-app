'use client'

import { useState, useRef, useCallback } from 'react'
import { generateWords } from '@/lib/ai'
import CIHUI from '@/lib/cihui-data'

type Phase = 'setup' | 'reveal' | 'playing' | 'result'
type WordPair = { wordA: string; wordB: string; category: string }
type Player = { id: number; word: string; isUndercover: boolean; eliminated: boolean }

const POOL_MAX = 10
const POOL_LOW = 5
const USED_KEY = 'undercover_used_local'

const S = {
  primary: '#4A4035',
  secondary: '#8A7F73',
  muted: '#B0A899',
  accent: '#8FBF8F',
  accentBg: 'rgba(143,191,143,0.12)',
  danger: '#D4766A',
  dangerBg: 'rgba(212,118,106,0.1)',
  dangerBorder: 'rgba(212,118,106,0.3)',
  blue: '#7BA7C9',
  blueBg: 'rgba(123,167,201,0.1)',
}

function getUsedIndices(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(USED_KEY) || '[]')) } catch { return new Set() }
}
function saveUsedIndices(s: Set<number>) { localStorage.setItem(USED_KEY, JSON.stringify([...s])) }

// 标记本地词对为已使用，全部用完则自动重置
function markUsed(pair: WordPair) {
  if (pair.category !== '本地词库') return
  const idx = CIHUI.findIndex(([a, b]) => a === pair.wordA && b === pair.wordB)
  if (idx < 0) return
  const used = getUsedIndices()
  used.add(idx)
  if (used.size >= CIHUI.length) used.clear()
  saveUsedIndices(used)
}

function getLocalStats() { return { used: getUsedIndices().size, total: CIHUI.length } }

// 从内置词库随机取 count 组（排除已使用）
function pickLocal(count: number): WordPair[] {
  const used = getUsedIndices()
  const available = CIHUI.filter((_, i) => !used.has(i))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(([wordA, wordB]) => ({ wordA, wordB, category: '本地词库' }))
}

export default function UndercoverPage() {
  const [aiLoading, setAiLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('setup')
  const [localStats, setLocalStats] = useState(getLocalStats)
  const [playerCount, setPlayerCount] = useState(4)
  const [undercoverCount, setUndercoverCount] = useState(1)
  const [poolSize, setPoolSize] = useState(0)
  const [currentPair, setCurrentPair] = useState<WordPair | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentReveal, setCurrentReveal] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')

  const poolRef = useRef<WordPair[]>([])
  const aiRef = useRef(false)

  const syncPool = () => setPoolSize(poolRef.current.length)
  const syncLocalStats = () => setLocalStats(getLocalStats())

  // AI 补充词池
  const checkAndRefill = useCallback(() => {
    if (aiRef.current) return
    const need = POOL_MAX - poolRef.current.length
    if (need <= 0) return
    aiRef.current = true
    setAiLoading(true)
    generateWords()
      .then(pairs => {
        if (pairs && pairs.length > 0) {
          poolRef.current.push(...pairs.slice(0, need))
          syncPool()
        }
      })
      .catch(() => {})
      .finally(() => { aiRef.current = false; setAiLoading(false) })
  }, [])

  // 从池中取词，池空从本地取
  function popPair(): WordPair | null {
    if (poolRef.current.length > 0) {
      const pair = poolRef.current.shift()!
      syncPool()
      markUsed(pair); syncLocalStats()
      return pair
    }
    const local = pickLocal(2)
    if (local.length === 0) return null
    poolRef.current.push(...local)
    const pair = poolRef.current.shift()!
    syncPool()
    markUsed(pair); syncLocalStats()
    return pair
  }

  function handleStart() {
    setError('')
    const pair = popPair()
    if (!pair) { setError('词汇库为空'); return }
    setCurrentPair(pair)
    assignWords(pair)
    if (poolRef.current.length < POOL_LOW) checkAndRefill()
  }

  function nextPair() {
    if (poolRef.current.length === 0 && !aiLoading) {
      // 池空了先从本地补几组
      poolRef.current.push(...pickLocal(2))
      syncPool()
      checkAndRefill()
    }
    const pair = poolRef.current.shift()
    if (!pair) return
    syncPool()
    markUsed(pair); syncLocalStats()
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

  function resetUsedLocal() {
    saveUsedIndices(new Set())
    syncLocalStats()
  }

  function reset() {
    setPhase('setup')
    setPlayers([])
    setCurrentReveal(0)
    setRevealed(false)
    setError('')
    syncLocalStats()
  }

  const alivePlayers = players.filter(p => !p.eliminated)
  const winner = phase === 'result'
    ? (players.filter(p => p.isUndercover).every(p => p.eliminated) ? 'civilians' : 'undercover')
    : null

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-5 mt-2" style={{ color: S.primary }}>谁是卧底</h1>

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
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
            <span className="text-xs" style={{ color: S.muted }}>词池 {poolSize}/{POOL_MAX}</span>
            <span className="text-xs" style={{ color: S.muted }}>本地剩余 {localStats.total - localStats.used}/{localStats.total}</span>
            {aiLoading && <span className="text-xs" style={{ color: S.accent }}>AI补充中...</span>}
            {localStats.used > 0 && (
              <button onClick={resetUsedLocal} className="text-xs underline" style={{ color: S.secondary }}>重置词库</button>
            )}
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
          {poolSize === 0 && (
            <button onClick={nextPair} className="text-xs mb-3 font-medium" style={{ color: S.accent }}>
              换一组词
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
