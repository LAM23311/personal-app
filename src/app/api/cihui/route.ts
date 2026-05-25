import { NextResponse } from 'next/server'
import CIHUI from '@/lib/cihui-data'

export const runtime = 'edge'

export async function GET() {
  const count = 2
  const shuffled = [...CIHUI].sort(() => Math.random() - 0.5)
  const pairs = shuffled.slice(0, count).map(([wordA, wordB]) => ({
    wordA, wordB, category: '本地词库',
  }))
  return NextResponse.json({ pairs })
}
