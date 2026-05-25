// 内置 API 配置（自用，Key 直接写前端）
const API_KEY = 'sk-618cfaffa9df40e48553aa6f31ca7c89'
const API_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const MODEL = 'qwen3.7-max'

// 谁是卧底 AI 选词 - 一次生成10组
export async function generateWords(): Promise<{
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

  const resp = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!resp.ok) throw new Error('AI调用失败')
  const data = await resp.json()
  const text = data.choices?.[0]?.message?.content?.trim() || ''

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(text)
  } catch {
    throw new Error('AI返回格式错误: ' + text)
  }
}
