'use client'

import { useState, useEffect } from 'react'
import { getJournals, addJournal, deleteJournal, type Journal } from '@/lib/supabase'

export default function JournalPage() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadJournals()
  }, [])

  async function loadJournals() {
    setLoading(true)
    const data = await getJournals()
    setJournals(data)
    setLoading(false)
  }

  async function handleAdd() {
    if (!title.trim() || !content.trim()) return
    const tagList = tags.split(/[,，\s]+/).filter(t => t.trim())
    await addJournal({ title: title.trim(), content: content.trim(), tags: tagList, date })
    setTitle('')
    setContent('')
    setTags('')
    setDate(new Date().toISOString().slice(0, 10))
    setShowForm(false)
    await loadJournals()
  }

  async function handleDelete(id: string) {
    await deleteJournal(id)
    await loadJournals()
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h1 className="text-2xl font-bold">日志</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary text-lg w-10 h-10 rounded-full p-0"
        >
          {showForm ? '✕' : '+'}
        </button>
      </div>

      {/* 添加表单 */}
      {showForm && (
        <div className="card mb-4">
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              className="form-input"
              placeholder="今天的标题"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">内容</label>
            <textarea
              className="form-input"
              rows={5}
              placeholder="记录点什么..."
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ resize: 'vertical', minHeight: 120 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">标签（用逗号分隔）</label>
            <input
              className="form-input"
              placeholder="生活, 工作, 随想"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">日期</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <button onClick={handleAdd} className="btn btn-primary w-full">
            保存
          </button>
        </div>
      )}

      {/* 日志列表 */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">加载中...</div>
      ) : journals.length === 0 ? (
        <div className="text-center text-gray-400 py-8">暂无日志，点击 + 写一篇</div>
      ) : (
        journals.map(j => {
          const isLong = j.content.length > 150
          const isExpanded = expanded[j.id]
          return (
            <div key={j.id} className="card mb-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base">{j.title}</h3>
                  <span className="text-xs text-gray-400">{j.date}</span>
                </div>
                <button
                  onClick={() => handleDelete(j.id)}
                  className="text-gray-300 hover:text-red-400 active:text-red-500 text-lg px-1 -mr-1"
                >
                  ×
                </button>
              </div>

              <p
                className={`text-sm text-gray-700 whitespace-pre-wrap leading-relaxed ${
                  isLong && !isExpanded ? 'line-clamp-4' : ''
                }`}
              >
                {j.content}
              </p>

              {isLong && (
                <button
                  onClick={() => toggleExpand(j.id)}
                  className="text-blue-500 text-xs mt-1"
                >
                  {isExpanded ? '收起' : '展开全文'}
                </button>
              )}

              {j.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {j.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
