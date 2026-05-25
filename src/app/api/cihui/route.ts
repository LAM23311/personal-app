import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'cihui.txt')
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    const pairs: { wordA: string; wordB: string; category: string }[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const parts = trimmed.split('|')
      if (parts.length === 2) {
        pairs.push({ wordA: parts[0].trim(), wordB: parts[1].trim(), category: '本地词库' })
      }
    }

    // 随机取 count 组
    const count = 2
    const shuffled = pairs.sort(() => Math.random() - 0.5)
    return NextResponse.json({ pairs: shuffled.slice(0, count) })
  } catch {
    return NextResponse.json({ pairs: [] })
  }
}
