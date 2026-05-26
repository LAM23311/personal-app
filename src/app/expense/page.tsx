'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getProjects, saveProject, deleteProject,
  type Project, type Member, type Expense,
} from '@/lib/supabase'

// ===== 常量 =====
const CATEGORIES = ['餐饮', '交通', '住宿', '门票', '购物', '娱乐', '其他']
const CAT_ICONS: Record<string, string> = { 餐饮: '🍜', 交通: '🚗', 住宿: '🏠', 门票: '🎫', 购物: '🛒', 娱乐: '🎮', 其他: '📦' }

// ===== 工具函数 =====
function uid() { return crypto.randomUUID() }
function fmt(n: number) { return Math.round(n * 100) / 100 }

// ===== 最优结算方案 =====
function calcSettlement(project: Project) {
  const { members, expenses } = project
  // 每人的应承担费用 & 实际垫付
  const map: Record<string, { shouldPay: number; paid: number }> = {}
  members.forEach(m => { map[m.id] = { shouldPay: 0, paid: 0 } })

  expenses.forEach(e => {
    // 付款人垫付
    if (map[e.payerId]) map[e.payerId].paid += e.amount
    // 分摊人承担
    e.splitMemberIds.forEach(id => {
      if (map[id]) map[id].shouldPay += e.perPersonAmount
    })
  })

  // 结算金额 = 垫付 - 应付
  const balances = members.map(m => ({
    member: m,
    balance: fmt((map[m.id]?.paid || 0) - (map[m.id]?.shouldPay || 0)),
    shouldPay: fmt(map[m.id]?.shouldPay || 0),
    paid: fmt(map[m.id]?.paid || 0),
  }))

  // 最优转账路径（贪心匹配）
  const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b, remain: Math.abs(b.balance) }))
  const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b, remain: b.balance }))
  debtors.sort((a, b) => b.remain - a.remain)
  creditors.sort((a, b) => b.remain - a.remain)

  const transfers: { from: string; to: string; amount: number }[] = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j]
    const amt = fmt(Math.min(d.remain, c.remain))
    if (amt > 0) {
      transfers.push({ from: d.member.name, to: c.member.name, amount: amt })
    }
    d.remain = fmt(d.remain - amt)
    c.remain = fmt(c.remain - amt)
    if (d.remain < 0.01) i++
    if (c.remain < 0.01) j++
  }

  return { balances, transfers }
}

// ===== 导出功能 =====
function exportCSV(project: Project) {
  const { balances, transfers } = calcSettlement(project)
  let csv = '﻿消费名称,金额,付款人,分摊人,日期,分类,人均\n'
  project.expenses.forEach(e => {
    const payer = project.members.find(m => m.id === e.payerId)?.name || '?'
    const splits = e.splitMemberIds.map(id => project.members.find(m => m.id === id)?.name || '?').join(' ')
    csv += `"${e.name}",${e.amount},"${payer}","${splits}","${e.date}","${e.category}",${e.perPersonAmount}\n`
  })
  csv += '\n姓名,应承担,实际垫付,结算金额\n'
  balances.forEach(b => {
    csv += `"${b.member.name}",${b.shouldPay},${b.paid},${b.balance}\n`
  })
  csv += '\n转账方案\n'
  transfers.forEach(t => { csv += `"${t.from}" → "${t.to}": ${t.amount}元\n` })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${project.name}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function exportTXT(project: Project) {
  const { balances, transfers } = calcSettlement(project)
  let txt = `=== ${project.name} ===\n\n--- 消费明细 ---\n`
  project.expenses.forEach((e, i) => {
    const payer = project.members.find(m => m.id === e.payerId)?.name || '?'
    txt += `${i + 1}. ${e.name}  ¥${e.amount}  付款:${payer}  人均:${e.perPersonAmount}  ${e.date}  ${e.category}\n`
  })
  txt += '\n--- 分账结果 ---\n'
  balances.forEach(b => {
    const tag = b.balance > 0 ? '应收' : b.balance < 0 ? '应付' : '持平'
    txt += `${b.member.name}: 应承担¥${b.shouldPay} 垫付¥${b.paid} → ${tag}¥${Math.abs(b.balance)}\n`
  })
  txt += '\n--- 结算方案 ---\n'
  if (transfers.length === 0) txt += '无需转账\n'
  else transfers.forEach(t => { txt += `${t.from} → ${t.to}: ¥${t.amount}\n` })

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${project.name}.txt`; a.click()
  URL.revokeObjectURL(url)
}

// ===== 主组件 =====
export default function ExpensePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 弹窗状态
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [editProjectName, setEditProjectName] = useState('')
  const [showRenameProject, setShowRenameProject] = useState(false)

  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [memberName, setMemberName] = useState('')
  const [memberNotes, setMemberNotes] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [expName, setExpName] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expPayer, setExpPayer] = useState('')
  const [expSplits, setExpSplits] = useState<string[]>([])
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [expCategory, setExpCategory] = useState('餐饮')
  const [expNotes, setExpNotes] = useState('')
  const [deleteExpConfirm, setDeleteExpConfirm] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState('全部')

  const [tab, setTab] = useState<'expenses' | 'settlement'>('expenses')

  // 加载数据
  useEffect(() => { loadProjects() }, [])
  async function loadProjects() {
    setLoading(true)
    const data = await getProjects()
    setProjects(data)
    if (!activeId && data.length > 0) setActiveId(data[0].id)
    setLoading(false)
  }

  const activeProject = projects.find(p => p.id === activeId) || null

  async function persist(project: Project) {
    await saveProject(project)
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === project.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = project; return next }
      return [project, ...prev]
    })
  }

  // ===== 项目操作 =====
  function createProject() {
    if (!newProjectName.trim()) return
    const p: Project = {
      id: uid(), name: newProjectName.trim(),
      members: [], expenses: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    persist(p)
    setActiveId(p.id)
    setNewProjectName('')
    setShowNewProject(false)
  }

  function renameProject() {
    if (!activeProject || !editProjectName.trim()) return
    persist({ ...activeProject, name: editProjectName.trim() })
    setShowRenameProject(false)
  }

  async function removeProject(id: string) {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeId === id) setActiveId(projects.length > 1 ? projects.find(p => p.id !== id)?.id || null : null)
  }

  // ===== 人员操作 =====
  function openAddMember() {
    setEditMember(null); setMemberName(''); setMemberNotes(''); setShowMemberForm(true)
  }
  function openEditMember(m: Member) {
    setEditMember(m); setMemberName(m.name); setMemberNotes(m.notes); setShowMemberForm(true)
  }

  function saveMember() {
    if (!activeProject || !memberName.trim()) return
    let members: Member[]
    if (editMember) {
      members = activeProject.members.map(m => m.id === editMember.id ? { ...m, name: memberName.trim(), notes: memberNotes.trim() } : m)
    } else {
      members = [...activeProject.members, { id: uid(), name: memberName.trim(), notes: memberNotes.trim() }]
    }
    persist({ ...activeProject, members })
    setShowMemberForm(false)
  }

  function confirmDeleteMember(id: string) {
    // 检查是否有消费关联
    const used = activeProject?.expenses.some(e => e.payerId === id || e.splitMemberIds.includes(id))
    if (used) { setDeleteConfirm(id) }
    else doDeleteMember(id)
  }

  function doDeleteMember(id: string) {
    if (!activeProject) return
    const members = activeProject.members.filter(m => m.id !== id)
    // 从所有消费中移除该人员并重算
    const expenses = activeProject.expenses
      .map(e => {
        const split = e.splitMemberIds.filter(sid => sid !== id)
        return { ...e, splitMemberIds: split, perPersonAmount: split.length > 0 ? fmt(e.amount / split.length) : 0 }
      })
      .filter(e => e.payerId !== id && e.splitMemberIds.length > 0)
    persist({ ...activeProject, members, expenses })
    setDeleteConfirm(null)
  }

  // ===== 消费操作 =====
  function openAddExpense() {
    if (!activeProject || activeProject.members.length < 2) return
    setEditExpense(null); setExpName(''); setExpAmount('')
    setExpPayer(activeProject.members[0].id)
    setExpSplits(activeProject.members.map(m => m.id))
    setExpDate(new Date().toISOString().slice(0, 10))
    setExpCategory('餐饮'); setExpNotes('')
    setShowExpenseForm(true)
  }

  function openEditExpense(e: Expense) {
    setEditExpense(e); setExpName(e.name); setExpAmount(String(e.amount))
    setExpPayer(e.payerId); setExpSplits([...e.splitMemberIds])
    setExpDate(e.date); setExpCategory(e.category); setExpNotes(e.notes)
    setShowExpenseForm(true)
  }

  function toggleSplit(id: string) {
    setExpSplits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function saveExpense() {
    if (!activeProject || !expName.trim() || !expAmount || expSplits.length === 0) return
    const amount = parseFloat(expAmount)
    if (isNaN(amount) || amount <= 0) return
    const expense: Expense = {
      id: editExpense?.id || uid(),
      name: expName.trim(), amount: fmt(amount),
      payerId: expPayer, splitMemberIds: expSplits,
      date: expDate, category: expCategory, notes: expNotes.trim(),
      perPersonAmount: fmt(amount / expSplits.length),
    }
    let expenses: Expense[]
    if (editExpense) expenses = activeProject.expenses.map(e => e.id === expense.id ? expense : e)
    else expenses = [...activeProject.expenses, expense]
    persist({ ...activeProject, expenses })
    setShowExpenseForm(false)
  }

  function doDeleteExpense(id: string) {
    if (!activeProject) return
    persist({ ...activeProject, expenses: activeProject.expenses.filter(e => e.id !== id) })
    setDeleteExpConfirm(null)
  }

  // ===== 分账计算 =====
  const settlement = useMemo(() => activeProject ? calcSettlement(activeProject) : null, [activeProject])

  // 筛选后的消费
  const filteredExpenses = useMemo(() => {
    if (!activeProject) return []
    if (filterCat === '全部') return activeProject.expenses
    return activeProject.expenses.filter(e => e.category === filterCat)
  }, [activeProject, filterCat])

  // ===== 渲染 =====
  if (loading) return <div className="p-5 text-center" style={{ color: '#B0A899' }}>加载中...</div>

  if (!activeProject) return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold mr-auto" style={{ color: '#4A4035' }}>记账</h1>
        <button onClick={() => setShowNewProject(true)} className="btn btn-primary text-sm px-3 py-1.5">+ 新建</button>
      </div>
      <div className="card text-center py-12">
        <p style={{ color: '#8A7F73' }}>还没有项目，点击「新建」创建一个分账项目</p>
      </div>
      {showNewProject && (
        <Modal onClose={() => setShowNewProject(false)}>
          <h3 className="font-semibold mb-3" style={{ color: '#4A4035' }}>新建项目</h3>
          <input className="form-input mb-3" placeholder="项目名称，如珠海之旅" value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createProject()} autoFocus />
          <button onClick={createProject} className="btn btn-primary w-full">创建</button>
        </Modal>
      )}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* ===== 顶部：项目切换栏 ===== */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h1 className="text-xl font-bold mr-auto" style={{ color: '#4A4035' }}>记账</h1>
        {projects.map(p => (
          <button key={p.id} onClick={() => setActiveId(p.id)}
            className="text-sm px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: p.id === activeId ? 'rgba(143,191,143,0.15)' : '#EDE7DB',
              color: p.id === activeId ? '#5A9A5A' : '#8A7F73',
              border: `1px solid ${p.id === activeId ? 'rgba(143,191,143,0.4)' : 'transparent'}`,
            }}>
            {p.name}
          </button>
        ))}
        <button onClick={() => setShowNewProject(true)} className="btn btn-primary text-sm px-3 py-1.5">+ 新建</button>
      </div>

      {/* ===== 项目操作按钮 ===== */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-bold text-lg" style={{ color: '#4A4035' }}>{activeProject!.name}</span>
        <button onClick={() => { setEditProjectName(activeProject!.name); setShowRenameProject(true) }}
          className="text-xs px-2 py-0.5 rounded" style={{ background: '#EDE7DB', color: '#8A7F73' }}>重命名</button>
        <button onClick={() => { if (confirm('确定删除此项目？')) removeProject(activeProject!.id) }}
          className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(212,118,106,0.1)', color: '#D4766A' }}>删除</button>
        <div className="ml-auto flex gap-1">
          <button onClick={() => exportTXT(activeProject!)} className="text-xs px-2 py-1 rounded" style={{ background: '#EDE7DB', color: '#8A7F73' }}>导出TXT</button>
          <button onClick={() => exportCSV(activeProject!)} className="text-xs px-2 py-1 rounded" style={{ background: '#EDE7DB', color: '#8A7F73' }}>导出CSV</button>
        </div>
      </div>

      {/* ===== 主体两栏布局 ===== */}
      <div className="flex gap-4 flex-col md:flex-row">

        {/* 左侧：人员管理 */}
        <div className="md:w-48 shrink-0">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: '#4A4035' }}>人员</span>
              <button onClick={openAddMember} className="btn btn-ghost text-xs px-2 py-0.5">+ 添加</button>
            </div>
            {activeProject!.members.length === 0 ? (
              <p className="text-xs" style={{ color: '#B0A899' }}>添加参与人员</p>
            ) : (
              <div className="space-y-1">
                {activeProject!.members.map(m => (
                  <div key={m.id} className="flex items-center gap-1 group">
                    <span className="text-sm font-medium flex-1" style={{ color: '#4A4035' }}>{m.name}</span>
                    {m.notes && <span className="text-xs" style={{ color: '#B0A899' }}>{m.notes}</span>}
                    <button onClick={() => openEditMember(m)} className="text-xs opacity-0 group-hover:opacity-100" style={{ color: '#8A7F73' }}>改</button>
                    <button onClick={() => confirmDeleteMember(m.id)} className="text-xs opacity-0 group-hover:opacity-100" style={{ color: '#D4766A' }}>删</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：消费 + 分账 */}
        <div className="flex-1 min-w-0">
          {/* Tab 切换 */}
          <div className="flex gap-1 mb-3">
            <button onClick={() => setTab('expenses')}
              className="text-sm px-3 py-1.5 rounded-full font-medium"
              style={{ background: tab === 'expenses' ? 'rgba(143,191,143,0.15)' : '#EDE7DB', color: tab === 'expenses' ? '#5A9A5A' : '#8A7F73' }}>
              消费明细
            </button>
            <button onClick={() => setTab('settlement')}
              className="text-sm px-3 py-1.5 rounded-full font-medium"
              style={{ background: tab === 'settlement' ? 'rgba(143,191,143,0.15)' : '#EDE7DB', color: tab === 'settlement' ? '#5A9A5A' : '#8A7F73' }}>
              分账结果
            </button>
          </div>

          {/* ===== 消费明细 Tab ===== */}
          {tab === 'expenses' && (
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={openAddExpense} className="btn btn-primary text-sm px-3 py-1.5">+ 记一笔</button>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                  className="form-input text-sm py-1 px-2" style={{ width: 'auto' }}>
                  <option value="全部">全部分类</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-sm" style={{ color: '#B0A899' }}>暂无消费记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.sort((a, b) => b.date.localeCompare(a.date)).map(e => {
                    const payer = activeProject!.members.find(m => m.id === e.payerId)
                    const splitNames = e.splitMemberIds.map(id => activeProject!.members.find(m => m.id === id)?.name || '?').join('、')
                    return (
                      <div key={e.id} className="card group">
                        <div className="flex items-start gap-2">
                          <span className="text-lg mt-0.5">{CAT_ICONS[e.category] || '📦'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-sm" style={{ color: '#4A4035' }}>{e.name}</span>
                              <span className="text-xs" style={{ color: '#B0A899' }}>{e.date}</span>
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: '#8A7F73' }}>
                              {payer?.name}付 ¥{e.amount} · {e.splitMemberIds.length}人均摊 ¥{e.perPersonAmount}
                            </div>
                            <div className="text-xs" style={{ color: '#B0A899' }}>分摊: {splitNames}</div>
                          </div>
                          <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditExpense(e)} className="p-1.5 rounded-md transition-colors active:scale-90" style={{ color: '#8A7F73' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setDeleteExpConfirm(e.id)} className="p-1.5 rounded-md transition-colors active:scale-90" style={{ color: '#D4766A' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== 分账结果 Tab ===== */}
          {tab === 'settlement' && settlement && (
            <div>
              {/* 明细表 */}
              <div className="card mb-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE7DB' }}>
                      <th className="text-left py-2 px-2 font-semibold" style={{ color: '#4A4035' }}>姓名</th>
                      <th className="text-right py-2 px-2 font-semibold" style={{ color: '#4A4035' }}>应承担</th>
                      <th className="text-right py-2 px-2 font-semibold" style={{ color: '#4A4035' }}>实际垫付</th>
                      <th className="text-right py-2 px-2 font-semibold" style={{ color: '#4A4035' }}>结算</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlement.balances.map(b => (
                      <tr key={b.member.id} style={{ borderBottom: '1px solid #F5F0E6' }}>
                        <td className="py-2 px-2 font-medium" style={{ color: '#4A4035' }}>{b.member.name}</td>
                        <td className="py-2 px-2 text-right" style={{ color: '#8A7F73' }}>¥{b.shouldPay}</td>
                        <td className="py-2 px-2 text-right" style={{ color: '#8A7F73' }}>¥{b.paid}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{
                          color: b.balance > 0 ? '#5A9A5A' : b.balance < 0 ? '#D4766A' : '#B0A899',
                        }}>
                          {b.balance > 0 ? '+' : ''}{b.balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 结算方案 */}
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: '#4A4035' }}>结算方案</span>
                  {settlement.transfers.length > 0 && (
                    <button onClick={() => {
                      const text = settlement.transfers.map(t => `${t.from} → ${t.to}: ¥${t.amount}`).join('\n')
                      navigator.clipboard.writeText(text)
                    }} className="text-xs px-2 py-0.5 rounded" style={{ background: '#EDE7DB', color: '#8A7F73' }}>复制</button>
                  )}
                </div>
                {settlement.transfers.length === 0 ? (
                  <p className="text-sm" style={{ color: '#B0A899' }}>无需转账，已经结清</p>
                ) : (
                  <div className="space-y-1.5">
                    {settlement.transfers.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-medium" style={{ color: '#4A4035' }}>{t.from}</span>
                        <span style={{ color: '#B0A899' }}>→</span>
                        <span className="font-medium" style={{ color: '#4A4035' }}>{t.to}</span>
                        <span className="ml-auto font-bold" style={{ color: '#5A9A5A' }}>¥{t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 弹窗们 ===== */}

      {/* 新建项目 */}
      {showNewProject && (
        <Modal onClose={() => setShowNewProject(false)}>
          <h3 className="font-semibold mb-3" style={{ color: '#4A4035' }}>新建项目</h3>
          <input className="form-input mb-3" placeholder="项目名称，如珠海之旅" value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createProject()} autoFocus />
          <button onClick={createProject} className="btn btn-primary w-full">创建</button>
        </Modal>
      )}

      {/* 重命名项目 */}
      {showRenameProject && (
        <Modal onClose={() => setShowRenameProject(false)}>
          <h3 className="font-semibold mb-3" style={{ color: '#4A4035' }}>重命名</h3>
          <input className="form-input mb-3" value={editProjectName}
            onChange={e => setEditProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameProject()} autoFocus />
          <button onClick={renameProject} className="btn btn-primary w-full">保存</button>
        </Modal>
      )}

      {/* 添加/编辑人员 */}
      {showMemberForm && (
        <Modal onClose={() => setShowMemberForm(false)}>
          <h3 className="font-semibold mb-3" style={{ color: '#4A4035' }}>{editMember ? '编辑人员' : '添加人员'}</h3>
          <div className="form-group">
            <label className="form-label">姓名</label>
            <input className="form-input" placeholder="姓名" value={memberName}
              onChange={e => setMemberName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">备注（可选）</label>
            <input className="form-input" placeholder="如：队长、司机" value={memberNotes}
              onChange={e => setMemberNotes(e.target.value)} />
          </div>
          <button onClick={saveMember} className="btn btn-primary w-full">{editMember ? '保存' : '添加'}</button>
        </Modal>
      )}

      {/* 删除人员确认 */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <h3 className="font-semibold mb-2" style={{ color: '#4A4035' }}>确认删除</h3>
          <p className="text-sm mb-4" style={{ color: '#8A7F73' }}>
            该人员已参与消费记录，删除后将从所有分摊中移除并重算金额。
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost flex-1">取消</button>
            <button onClick={() => doDeleteMember(deleteConfirm)} className="btn btn-danger flex-1">确认删除</button>
          </div>
        </Modal>
      )}

      {/* 添加/编辑消费 */}
      {showExpenseForm && activeProject && (
        <Modal onClose={() => setShowExpenseForm(false)} wide>
          <h3 className="font-semibold mb-3" style={{ color: '#4A4035' }}>{editExpense ? '编辑消费' : '记一笔'}</h3>
          <div className="form-group">
            <label className="form-label">消费名称</label>
            <input className="form-input" placeholder="如：4.30中午奶茶" value={expName}
              onChange={e => setExpName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">金额</label>
            <input className="form-input" type="number" inputMode="decimal" placeholder="0.00" value={expAmount}
              onChange={e => setExpAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">付款人</label>
            <select className="form-input" value={expPayer} onChange={e => setExpPayer(e.target.value)}>
              {activeProject.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">参与分摊（{expSplits.length}/{activeProject.members.length}）</label>
            <div className="flex flex-wrap gap-1.5">
              {activeProject.members.map(m => (
                <button key={m.id} onClick={() => toggleSplit(m.id)}
                  className="text-sm px-3 py-1 rounded-full font-medium transition-all"
                  style={{
                    background: expSplits.includes(m.id) ? 'rgba(143,191,143,0.15)' : '#EDE7DB',
                    color: expSplits.includes(m.id) ? '#5A9A5A' : '#B0A899',
                    border: `1px solid ${expSplits.includes(m.id) ? 'rgba(143,191,143,0.4)' : 'transparent'}`,
                  }}>
                  {m.name}
                </button>
              ))}
            </div>
            {expAmount && expSplits.length > 0 && (
              <p className="text-xs mt-1" style={{ color: '#8A7F73' }}>
                人均: ¥{fmt(parseFloat(expAmount) / expSplits.length).toFixed(2)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">分类</label>
              <select className="form-input" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">备注（可选）</label>
            <input className="form-input" placeholder="补充说明" value={expNotes} onChange={e => setExpNotes(e.target.value)} />
          </div>
          <button onClick={saveExpense} className="btn btn-primary w-full">{editExpense ? '保存' : '添加'}</button>
        </Modal>
      )}

      {/* 删除消费确认 */}
      {deleteExpConfirm && (
        <Modal onClose={() => setDeleteExpConfirm(null)}>
          <h3 className="font-semibold mb-2" style={{ color: '#4A4035' }}>确认删除</h3>
          <p className="text-sm mb-4" style={{ color: '#8A7F73' }}>删除后将重新计算分账结果。</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteExpConfirm(null)} className="btn btn-ghost flex-1">取消</button>
            <button onClick={() => doDeleteExpense(deleteExpConfirm)} className="btn btn-danger flex-1">确认删除</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ===== 弹窗组件 =====
function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(74,64,53,0.4)' }} onClick={onClose}>
      <div className={`card w-full ${wide ? 'max-w-md' : 'max-w-xs'}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
