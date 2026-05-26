'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-2" style={{ color: '#4A4035' }}>腾哥和铁锤的百宝箱</h1>

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

        <div className="card flex flex-col items-center py-7 opacity-40">
          <span className="text-3xl mb-2.5">🚧</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>更多</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>待开发</span>
        </div>
      </div>

      {/* 相框 */}
      <div className="mt-6 mb-2">
        <div
          className="mx-auto"
          style={{
            padding: '10px',
            background: 'linear-gradient(165deg, #E8DFD0 0%, #D8CEBC 100%)',
            borderRadius: '16px',
            boxShadow: '0 3px 12px rgba(120,100,70,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <div
            style={{
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)',
              border: '3px solid #C8BDA8',
            }}
          >
            <Image
              src="/personal-app/tengge.png"
              alt="照片"
              width={600}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block', filter: 'saturate(0.85) brightness(1.02)' }}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
