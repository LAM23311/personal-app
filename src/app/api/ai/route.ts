import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, apiBase, model, magicWord } = await req.json()

    let finalKey = apiKey
    let finalBase = apiBase
    let finalModel = model

    // 咒语模式：输入 5566 使用内置 API
    if (magicWord === '5566') {
      finalKey = process.env.BUILTIN_AI_KEY
      finalBase = process.env.BUILTIN_AI_BASE
      finalModel = process.env.BUILTIN_AI_MODEL
    }

    if (!finalKey || !finalBase || !finalModel) {
      return NextResponse.json({ error: '缺少API配置' }, { status: 400 })
    }

    const resp = await fetch(`${finalBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalKey}`,
      },
      body: JSON.stringify({
        model: finalModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
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
