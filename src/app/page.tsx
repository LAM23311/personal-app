'use client'

export default function Home() {
  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-2" style={{ color: '#4A4035' }}>个人工具箱</h1>

      <div className="grid grid-cols-2 gap-4">
        <a href="/expense" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>💰</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>记账</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>随手记一笔</span>
        </a>

        <a href="/journal" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>📝</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>日志</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>记录生活</span>
        </a>

        <a href="/undercover" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <span className="text-3xl mb-2.5" style={{ filter: 'saturate(0.8)' }}>🕵️</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>谁是卧底</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>AI选词</span>
        </a>

        <div className="card flex flex-col items-center py-7 opacity-40">
          <span className="text-3xl mb-2.5">🚧</span>
          <span className="font-semibold text-[15px]" style={{ color: '#4A4035' }}>更多</span>
          <span className="text-xs mt-1" style={{ color: '#8A7F73' }}>待开发</span>
        </div>
      </div>
    </div>
  )
}
