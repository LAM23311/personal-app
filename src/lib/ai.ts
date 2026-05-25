// 谁是卧底 AI 选词 - 一次生成10组
export async function generateWords(apiKey: string, apiBase: string, model: string, magicWord?: string): Promise<{
  wordA: string
  wordB: string
  category: string
}[]> {
  const prompt = `请为"谁是卧底"游戏生成10组词语。要求：
1. 每组两个词语非常相似，容易混淆，但有明显区别
2. 一个是平民词，一个是卧底词
3. 输出JSON数组格式：[{"wordA":"平民词","wordB":"卧底词","category":"类别"},...]
4. 词语必须是中文常见词，不能太生僻
5. 只输出JSON数组，不要其他内容

示例：
[{"wordA":"苹果","wordB":"梨子","category":"水果"},{"wordA":"医生","wordB":"护士","category":"职业"}]`

  const body: any = { prompt, apiKey, apiBase, model }
  if (magicWord) body.magicWord = magicWord

  const resp = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!resp.ok) throw new Error('AI调用失败')
  const data = await resp.json()
  const text = data.result.trim()

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(text)
  } catch {
    throw new Error('AI返回格式错误: ' + text)
  }
}
