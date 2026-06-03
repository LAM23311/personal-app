'use client'

import { useRef, useState, useEffect } from 'react'

export default function CheesePage() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => setPlaying(false)
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [])

  function play() {
    audioRef.current?.play()
    setPlaying(true)
  }

  function pause() {
    audioRef.current?.pause()
    setPlaying(false)
  }

  function replay() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPlaying(true)
  }

  function changeSpeed(s: number) {
    const v = Math.round(s * 10) / 10
    setSpeed(v)
    if (audioRef.current) audioRef.current.playbackRate = v
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-2" style={{ color: '#4A4035' }}>偷奶酪</h1>

      <div className="flex flex-col items-center gap-3">
        <button onClick={play} className="card w-48 py-3 text-base font-medium text-center active:scale-95 transition-transform" style={{ color: playing ? '#5A9A5A' : '#4A4035', border: `1px solid ${playing ? 'rgba(143,191,143,0.4)' : '#EDE7DB'}`, background: playing ? 'rgba(143,191,143,0.12)' : undefined }}>
          {playing ? '播放中' : '开始'}
        </button>
        <button onClick={pause} className="card w-48 py-3 text-base font-medium text-center active:scale-95 transition-transform" style={{ color: '#4A4035', border: '1px solid #EDE7DB' }}>暂停</button>
        <button onClick={replay} className="card w-48 py-3 text-base font-medium text-center active:scale-95 transition-transform" style={{ color: '#4A4035', border: '1px solid #EDE7DB' }}>重播</button>

        <div className="w-64 mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: '#8A7F73' }}>倍速</span>
            <span className="text-sm font-semibold" style={{ color: '#5A9A5A' }}>{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={speed}
            onChange={e => changeSpeed(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: '#8FBF8F' }}
          />
          <div className="flex justify-between text-[10px] mt-0.5" style={{ color: '#B0A899' }}>
            <span>0.5x</span>
            <span>1.5x</span>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src="/personal-app/cheese.mp3" preload="auto" />
    </div>
  )
}
