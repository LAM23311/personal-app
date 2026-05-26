'use client'

import { useState, useEffect } from 'react'
import { getJournals, addJournal, deleteJournal, type Journal } from '@/lib/supabase'

const S = {
  primary: '#4A4035',
  secondary: '#8A7F73',
  muted: '#B0A899',
  accent: '#8FBF8F',
  accentBg: 'rgba(143,191,143,0.1)',
  tagBg: '#EDE7DB',
  blue: '#7BA7C9',
  blueBg: 'rgba(123,167,201,0.1)',
}

export default function JournalPage() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [deleteJournalId, setDeleteJournalId] = useState<string | null>(null)
  const [deleteJournalInput, setDeleteJournalInput] = useState('')

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
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5 mt-2">
        <h1 className="text-2xl font-bold" style={{ color: S.primary }}>日志</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary w-10 h-10 rounded-full p-0 text-xl leading-none"
        >
          {showForm ? '✕' : '+'}
        </button>
      </div>

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

          <button onClick={handleAdd} className="btn btn-primary w-full">保存</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8" style={{ color: S.muted }}>加载中...</div>
      ) : journals.length === 0 ? (
        <div className="text-center py-8" style={{ color: S.muted }}>暂无日志，点击 + 写一篇</div>
      ) : (
        journals.map(j => {
          const isLong = j.content.length > 150
          const isExpanded = expanded[j.id]
          return (
            <div key={j.id} className="card mb-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base" style={{ color: S.primary }}>{j.title}</h3>
                  <span className="text-xs" style={{ color: S.muted }}>{j.date}</span>
                </div>
                <button
                  onClick={() => { setDeleteJournalId(j.id); setDeleteJournalInput('') }}
                  className="text-lg px-1 -mr-1 transition-colors"
                  style={{ color: S.muted }}
                >
                  ×
                </button>
              </div>

              <p
                className={`text-sm whitespace-pre-wrap leading-relaxed ${
                  isLong && !isExpanded ? 'line-clamp-4' : ''
                }`}
                style={{ color: '#5C5348' }}
              >
                {j.content}
              </p>

              {isLong && (
                <button
                  onClick={() => toggleExpand(j.id)}
                  className="text-xs mt-1 font-medium"
                  style={{ color: S.accent }}
                >
                  {isExpanded ? '收起' : '展开全文'}
                </button>
              )}

              {j.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {j.tags.map(tag => (
                    <span key={tag} className="text-xs rounded-full px-2.5 py-0.5 font-medium" style={{ background: S.blueBg, color: S.blue }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* 删除日志确认 */}
      {deleteJournalId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(74,64,53,0.4)' }} onClick={() => setDeleteJournalId(null)}>
          <div className="card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-2" style={{ color: S.primary }}>删除日志</h3>
            <p className="text-sm mb-3" style={{ color: '#D4766A' }}>此操作不可恢复！</p>
            <p className="text-xs mb-3" style={{ color: S.secondary }}>输入以下文字确认删除：</p>
            <p className="text-xs mb-3 font-bold select-all" style={{ color: S.primary, background: '#F5F0E6', padding: '8px 10px', borderRadius: 8 }}>
              对不起，我是笨蛋，我申请删除日志
            </p>
            <input
              className="form-input mb-3"
              placeholder="输入上面的文字"
              value={deleteJournalInput}
              onChange={e => setDeleteJournalInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setDeleteJournalId(null)} className="btn btn-ghost flex-1">取消</button>
              <button
                onClick={() => { if (deleteJournalInput === '对不起，我是笨蛋，我申请删除日志') { handleDelete(deleteJournalId); setDeleteJournalId(null) } }}
                className="btn btn-danger flex-1"
                style={{ opacity: deleteJournalInput === '对不起，我是笨蛋，我申请删除日志' ? 1 : 0.4 }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
