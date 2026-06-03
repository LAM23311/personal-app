'use client'

import { useState, useEffect, useRef } from 'react'

const API = '/api/bangbang'
const MILESTONES = [10, 20, 50, 100]
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const S = {
  primary: '#4A4035',
  secondary: '#8A7F73',
  muted: '#B0A899',
  accent: '#8FBF8F',
  accentBg: 'rgba(143,191,143,0.12)',
  danger: '#D4766A',
  blue: '#7BA7C9',
  gold: '#D4A76A',
}

export default function BangbangPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [checkins, setCheckins] = useState<Record<string, { hasPhoto: boolean; time: string }>>({})
  const [totalDays, setTotalDays] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [code, setCode] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [celebration, setCelebration] = useState<number | null>(null)
  const [showPhoto, setShowPhoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const todayChecked = !!checkins[today]

  useEffect(() => { fetchCheckins() }, [currentMonth])

  async function fetchCheckins() {
    try {
      const res = await fetch(`${API}/checkins?month=${currentMonth}`)
      if (res.ok) {
        const data = await res.json()
        setCheckins(data.checkins || {})
        setTotalDays(data.totalDays || 0)
      }
    } catch {}
  }

  function getDaysInMonth(yearMonth: string) {
    const [y, m] = yearMonth.split('-').map(Number)
    return new Date(y, m, 0).getDate()
  }

  function getFirstDayOfMonth(yearMonth: string) {
    const [y, m] = yearMonth.split('-').map(Number)
    const day = new Date(y, m - 1, 1).getDay()
    return day === 0 ? 6 : day - 1 // Monday=0
  }

  function prevMonth() {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function nextMonth() {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCheckin() {
    if (!code) { setError('请输入验证码'); return }
    if (!photo) { setError('请选择照片'); return }
    setError('')
    setUploading(true)
    try {
      const res = await fetch(`${API}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, code, photo }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '打卡失败'); return }
      if (data.milestone) setCelebration(data.milestone)
      setShowUpload(false)
      setCode('')
      setPhoto(null)
      fetchCheckins()
    } catch { setError('网络错误') }
    finally { setUploading(false) }
  }

  function prevMonthLabel() {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    return `${d.getMonth() + 1}月`
  }

  function nextMonthLabel() {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    return `${d.getMonth() + 1}月`
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const nextMilestone = MILESTONES.find(m => m > totalDays) || MILESTONES[MILESTONES.length - 1]
  const progress = Math.min(totalDays / nextMilestone, 1)

  return (
    <div className="p-5 max-w-lg mx-auto pb-8">
      {/* Celebration overlay */}
      {celebration && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setCelebration(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center celebration-container">
            <div className="fireworks" />
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <div className="text-3xl font-bold mb-2" style={{ color: S.gold }}>
              {celebration} 天！
            </div>
            <div className="text-lg" style={{ color: '#fff' }}>
              {celebration === 10 && '坚持10天，初见成效！'}
              {celebration === 20 && '20天打卡达人！继续加油！'}
              {celebration === 50 && '50天！半百里程碑！太厉害了！'}
              {celebration === 100 && '100天！百日奇迹！你是冠军！🏆'}
            </div>
            <div className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.7)' }}>点击任意处关闭</div>
          </div>
          <style jsx>{`
            .fireworks { position: absolute; inset: 0; pointer-events: none; }
            .fireworks::before, .fireworks::after {
              content: '🎆🎇✨🎊🎆🎇✨🎊';
              position: absolute;
              font-size: 40px;
              animation: firework-rise 2s ease-out infinite;
            }
            .fireworks::before { left: 20%; top: 80%; animation-delay: 0s; }
            .fireworks::after { right: 20%; top: 80%; animation-delay: 0.5s; }
            @keyframes firework-rise {
              0% { transform: translateY(0) scale(0.5); opacity: 1; }
              100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
            }
            .celebration-container { animation: pop-in 0.3s ease-out; }
            @keyframes pop-in {
              0% { transform: scale(0.5); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Photo viewer */}
      {showPhoto && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80" onClick={() => setShowPhoto(null)}>
          <img src={`${API}/photos/${showPhoto}`} alt={showPhoto} className="max-w-[90vw] max-h-[80vh] rounded-xl" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: S.primary }}>邦邦英语 🎯</h1>
        <div className="text-sm px-3 py-1 rounded-full" style={{ background: S.accentBg, color: S.accent }}>
          {totalDays} 天
        </div>
      </div>

      {/* Calendar */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="btn btn-ghost text-sm px-2">◀ {prevMonthLabel()}</button>
          <span className="font-bold text-lg" style={{ color: S.primary }}>
            {currentMonth.split('-')[0]}年{parseInt(currentMonth.split('-')[1])}月
          </span>
          <button onClick={nextMonth} className="btn btn-ghost text-sm px-2">{nextMonthLabel()} ▶</button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: S.muted }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`
            const checked = !!checkins[dateStr]
            const isToday = dateStr === today
            const isFuture = dateStr > today
            const hasPhoto = checkins[dateStr]?.hasPhoto

            return (
              <div
                key={dateStr}
                className="relative flex flex-col items-center justify-center py-2 rounded-lg text-sm transition-all"
                style={{
                  background: isToday ? S.accentBg : 'transparent',
                  border: isToday ? `2px solid ${S.accent}` : '2px solid transparent',
                  opacity: isFuture ? 0.3 : 1,
                  cursor: hasPhoto ? 'pointer' : 'default',
                }}
                onClick={() => hasPhoto && setShowPhoto(dateStr)}
              >
                <span className="font-medium" style={{ color: isToday ? S.accent : S.primary }}>{day}</span>
                {!isFuture && (
                  <span className="text-base mt-0.5">
                    {checked ? (
                      <span style={{ color: S.accent }}>✓</span>
                    ) : (
                      <span style={{ color: S.danger }}>✗</span>
                    )}
                  </span>
                )}
                {hasPhoto && (
                  <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full" style={{ background: S.accent }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Check-in button / status */}
      {todayChecked ? (
        <div className="card text-center py-4 mb-4">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-sm font-medium" style={{ color: S.accent }}>今日已打卡</div>
        </div>
      ) : (
        <button
          className="btn btn-primary w-full mb-4 py-3 text-base"
          onClick={() => setShowUpload(true)}
        >
          📷 今日打卡
        </button>
      )}

      {/* Milestone progress */}
      <div className="card">
        <div className="text-sm font-semibold mb-2" style={{ color: S.primary }}>🎉 打卡里程碑</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#EDE7DB' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${S.accent}, ${S.gold})` }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: S.secondary }}>{totalDays}/{nextMilestone}</span>
        </div>
        <div className="flex justify-between mt-2">
          {MILESTONES.map(m => (
            <div key={m} className="text-center">
              <div className="text-lg">{totalDays >= m ? '🏆' : '🔒'}</div>
              <div className="text-[10px]" style={{ color: totalDays >= m ? S.gold : S.muted }}>{m}天</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowUpload(false); setPhoto(null); setCode(''); setError('') }} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#DDD' }} />
            <h2 className="text-lg font-bold mb-4" style={{ color: S.primary }}>今日打卡</h2>

            {error && (
              <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: 'rgba(212,118,106,0.1)', color: S.danger }}>
                {error}
              </div>
            )}

            {/* Photo preview */}
            {photo ? (
              <div className="relative mb-3">
                <img src={photo} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >×</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 mb-3"
                style={{ borderColor: S.muted, color: S.muted }}
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm">点击选择照片</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

            {/* Verification code */}
            <div className="form-group mb-3">
              <label className="form-label">验证码</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="请输入验证码"
                className="form-input"
                maxLength={4}
              />
            </div>

            <button
              onClick={handleCheckin}
              disabled={uploading}
              className="btn btn-primary w-full py-3"
            >
              {uploading ? '上传中...' : '确认打卡'}
            </button>
          </div>
          <style jsx>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
