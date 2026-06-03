'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-2" style={{ color: '#4A4035' }}>百宝箱</h1>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/expense" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>💰</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>记账</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>随手记一笔</span>
        </Link>

        <Link href="/journal" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>📝</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>日志</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>记录生活</span>
        </Link>

        <Link href="/undercover" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>🕵️</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>谁是卧底</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>AI选词</span>
        </Link>

        <Link href="/cheese" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: "saturate(0.8)" }}>🐹</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>偷奶酪</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>音频播放</span>
        </Link>

        <a href="http://47.97.86.63:3456" target="_blank" rel="noopener noreferrer" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>🎨</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>你画我猜</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>在线多人</span>
        </a>

        <Link href="/bangbang" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>🎯</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>邦邦英语</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>每日打卡</span>
        </Link>

        <Link href="/pipi" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>🏃‍♀️</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>皮皮减肥</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>每日打卡</span>
        </Link>
      </div>
    </div>
  )
}
