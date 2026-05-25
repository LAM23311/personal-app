'use client'

import { useState, useEffect } from 'react'
import { getExpenses, addExpense, deleteExpense, type Expense } from '@/lib/supabase'

const CATEGORIES = [
  { icon: '🍜', label: '餐饮' },
  { icon: '🚗', label: '交通' },
  { icon: '🛒', label: '购物' },
  { icon: '🏠', label: '住房' },
  { icon: '🎮', label: '娱乐' },
  { icon: '💊', label: '医疗' },
  { icon: '📚', label: '学习' },
  { icon: '📦', label: '其他' },
]

const S = {
  primary: '#4A4035',
  secondary: '#8A7F73',
  muted: '#B0A899',
  accent: '#8FBF8F',
  accentBg: 'rgba(143,191,143,0.1)',
  accentBorder: 'rgba(143,191,143,0.4)',
  danger: '#D4766A',
  tagBg: '#EDE7DB',
}

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('餐饮')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    setLoading(true)
    const data = await getExpenses()
    setExpenses(data)
    setLoading(false)
  }

  async function handleAdd() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return
    await addExpense({ amount: Number(amount), category, note, date })
    setAmount('')
    setNote('')
    setCategory('餐饮')
    setDate(new Date().toISOString().slice(0, 10))
    setShowForm(false)
    await loadExpenses()
  }

  async function handleDelete(id: string) {
    await deleteExpense(id)
    await loadExpenses()
  }

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const month = e.date.slice(0, 7)
    if (!acc[month]) acc[month] = []
    acc[month].push(e)
    return acc
  }, {})

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amount, 0)

  const categoryTotals = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5 mt-2">
        <h1 className="text-2xl font-bold" style={{ color: S.primary }}>记账</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary w-10 h-10 rounded-full p-0 text-xl leading-none"
        >
          {showForm ? '✕' : '+'}
        </button>
      </div>

      {/* 本月概览 */}
      <div className="card mb-4">
        <div className="text-sm mb-1" style={{ color: S.secondary }}>本月支出</div>
        <div className="text-3xl font-bold" style={{ color: S.danger }}>¥{monthTotal.toFixed(2)}</div>
        {Object.keys(categoryTotals).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, total]) => {
                const catInfo = CATEGORIES.find(c => c.label === cat)
                return (
                  <span key={cat} className="text-xs rounded-full px-2.5 py-1" style={{ background: S.tagBg, color: S.secondary }}>
                    {catInfo?.icon} {cat} ¥{total.toFixed(0)}
                  </span>
                )
              })}
          </div>
        )}
      </div>

      {/* 添加表单 */}
      {showForm && (
        <div className="card mb-4">
          <div className="form-group">
            <label className="form-label">金额</label>
            <input
              type="number"
              inputMode="decimal"
              className="form-input text-xl font-bold"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">分类</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.label}
                  onClick={() => setCategory(c.label)}
                  className="flex flex-col items-center py-2.5 rounded-xl text-xs transition-all"
                  style={{
                    background: category === c.label ? S.accentBg : 'rgba(0,0,0,0.02)',
                    border: `2px solid ${category === c.label ? S.accentBorder : 'transparent'}`,
                    color: category === c.label ? '#5A9A5A' : S.secondary,
                  }}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="mt-1 font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <input
              className="form-input"
              placeholder="选填"
              value={note}
              onChange={e => setNote(e.target.value)}
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

      {/* 账单列表 */}
      {loading ? (
        <div className="text-center py-8" style={{ color: S.muted }}>加载中...</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-8" style={{ color: S.muted }}>暂无记录，点击 + 添加</div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="mb-4">
            <div className="text-sm font-semibold mb-2 px-1" style={{ color: S.secondary }}>
              {month} · 合计 ¥{items.reduce((s, e) => s + e.amount, 0).toFixed(2)}
            </div>
            <div className="card p-0" style={{ overflow: 'hidden' }}>
              {items.map((e, i) => {
                const catInfo = CATEGORIES.find(c => c.label === e.category)
                return (
                  <div
                    key={e.id}
                    className="flex items-center px-4 py-3"
                    style={{ borderBottom: i < items.length - 1 ? '1px solid #EDE7DB' : 'none' }}
                  >
                    <span className="text-2xl mr-3">{catInfo?.icon || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm" style={{ color: S.primary }}>{e.category}</div>
                      {e.note && <div className="text-xs truncate" style={{ color: S.muted }}>{e.note}</div>}
                    </div>
                    <div className="text-right mr-2">
                      <div className="font-bold" style={{ color: S.danger }}>-¥{e.amount.toFixed(2)}</div>
                      <div className="text-xs" style={{ color: S.muted }}>{e.date.slice(5)}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-lg px-1 transition-colors"
                      style={{ color: S.muted }}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
