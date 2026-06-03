// 服务器 API
const API = '/api'

// ===== 类型定义 =====
export type Member = {
  id: string
  name: string
  notes: string
}

export type Expense = {
  id: string
  name: string
  amount: number
  payerId: string
  splitMemberIds: string[]
  date: string
  category: string
  notes: string
  perPersonAmount: number
}

export type Project = {
  id: string
  name: string
  members: Member[]
  expenses: Expense[]
  createdAt: string
  updatedAt: string
}

export type Journal = {
  id: string
  title: string
  content: string
  tags: string[]
  date: string
  created_at: string
}

// ===== 项目 CRUD =====
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API}/projects`)
    if (res.ok) return await res.json()
  } catch {}
  return []
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = new Date().toISOString()
  await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`${API}/projects/${id}`, { method: 'DELETE' })
}

// ===== 日志 CRUD =====
export async function getJournals(): Promise<Journal[]> {
  try {
    const res = await fetch(`${API}/personal-journals`)
    if (res.ok) return await res.json()
  } catch {}
  return []
}

export async function addJournal(journal: Omit<Journal, 'id' | 'created_at'>): Promise<Journal> {
  const res = await fetch(`${API}/personal-journals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(journal),
  })
  return await res.json()
}

export async function deleteJournal(id: string) {
  await fetch(`${API}/personal-journals/${id}`, { method: 'DELETE' })
}
