'use client'

export default function Home() {
  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-2">个人工具箱</h1>

      <div className="grid grid-cols-2 gap-3">
        <a href="/expense" className="card flex flex-col items-center py-6 active:scale-95 transition-transform">
          <span className="text-3xl mb-2">💰</span>
          <span className="font-semibold">记账</span>
          <span className="text-xs text-gray-400 mt-1">随手记一笔</span>
        </a>

        <a href="/journal" className="card flex flex-col items-center py-6 active:scale-95 transition-transform">
          <span className="text-3xl mb-2">📝</span>
          <span className="font-semibold">日志</span>
          <span className="text-xs text-gray-400 mt-1">记录生活</span>
        </a>

        <a href="/undercover" className="card flex flex-col items-center py-6 active:scale-95 transition-transform">
          <span className="text-3xl mb-2">🕵️</span>
          <span className="font-semibold">谁是卧底</span>
          <span className="text-xs text-gray-400 mt-1">AI选词</span>
        </a>

        <div className="card flex flex-col items-center py-6 opacity-40">
          <span className="text-3xl mb-2">🚧</span>
          <span className="font-semibold">更多</span>
          <span className="text-xs text-gray-400 mt-1">待开发</span>
        </div>
      </div>
    </div>
  )
}
