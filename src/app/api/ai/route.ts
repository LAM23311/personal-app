import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, apiBase, model } = await req.json()

    if (!apiKey || !apiBase || !model) {
      return NextResponse.json({ error: '缺少API配置' }, { status: 400 })
    }

    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return NextResponse.json({ error: `API错误: ${err}` }, { status: 500 })
    }

    const data = await resp.json()
    const result = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
