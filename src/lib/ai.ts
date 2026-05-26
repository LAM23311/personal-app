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
  const prompt = `请为"谁是卧底"游戏生成10组高质量词语对。严格按以下要求：

核心规则：
- 两个词属于同一类别，有大量共同特征，但有一个关键区别
- 描述时很难说清区别，容易暴露身份
- 不能太简单（如苹果vs梨子），也不能太离谱

好词对的例子（参考风格，不要重复）：
- 包子vs馒头（都是面食，都有馅？不一定）
- 火锅vs麻辣烫（都是煮着吃）
- 地铁vs轻轨（都在城市里跑）
- 摩托车vs电动车（都两轮代步）
- 眉毛vs睫毛（都在眼睛附近）
- 加多宝vs王老吉（都是凉茶）
- 甄嬛传vs延禧攻略（都是清宫剧）
- 公交vs校车（都是大巴）
- 直播vs录像（都在屏幕上放）
- 洗发水vs沐浴露（都是洗澡用）

坏例子（太简单没意思）：苹果vs梨子、医生vs护士、太阳vs月亮

输出格式（只输出JSON数组，不要其他内容）：
[{"wordA":"平民词","wordB":"卧底词","category":"类别"},...]

要求覆盖不同类别：食物、影视、日用品、动物、职业、出行、网络、运动等，每组换一个类别`

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
