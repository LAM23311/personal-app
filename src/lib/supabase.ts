// API 地址 — 部署云函数后替换为你的 API Gateway 地址
const API_BASE = ''

// ===== 本地存储 =====
const LOCAL_KEY = 'personal_app_data'

function getLocalData() {
  if (typeof window === 'undefined') return { projects: [], journals: [] }
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')
    return { projects: raw.projects || [], journals: raw.journals || [] }
  } catch {
    return { projects: [], journals: [] }
  }
}

function saveLocalData(data: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

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

// ===== 项目 CRUD =====
export async function getProjects(): Promise<Project[]> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/projects`)
      if (res.ok) return await res.json()
    } catch {}
  }
  return getLocalData().projects
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = new Date().toISOString()
  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      return
    } catch {}
  }
  const data = getLocalData()
  const idx = data.projects.findIndex((p: Project) => p.id === project.id)
  if (idx >= 0) data.projects[idx] = project
  else data.projects.unshift(project)
  saveLocalData(data)
}

export async function deleteProject(id: string): Promise<void> {
  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' })
      return
    } catch {}
  }
  const data = getLocalData()
  data.projects = data.projects.filter((p: Project) => p.id !== id)
  saveLocalData(data)
}

// ===== 日志 CRUD =====
export type Journal = {
  id: string
  title: string
  content: string
  tags: string[]
  date: string
  created_at: string
}

export async function getJournals(): Promise<Journal[]> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/journals`)
      if (res.ok) return await res.json()
    } catch {}
  }
  return getLocalData().journals
}

export async function addJournal(journal: Omit<Journal, 'id' | 'created_at'>): Promise<Journal> {
  const newJournal = {
    ...journal,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/journals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJournal),
      })
      return newJournal
    } catch {}
  }
  const data = getLocalData()
  data.journals.unshift(newJournal)
  saveLocalData(data)
  return newJournal
}

export async function deleteJournal(id: string) {
  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/journals/${id}`, { method: 'DELETE' })
      return
    } catch {}
  }
  const data = getLocalData()
  data.journals = data.journals.filter((j: Journal) => j.id !== id)
  saveLocalData(data)
}
