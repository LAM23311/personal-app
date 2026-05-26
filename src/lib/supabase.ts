// GitHub 仓库存储
// Token 从 localStorage 读取，首次使用弹窗输入
const GH_OWNER = 'LAM23311'
const GH_REPO = 'personal-app'
const GH_BRANCH = 'master'
const GH_FILE = 'data.json'

function getGhToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('gh_token') || ''
}

// ===== 本地存储降级 =====
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

// ===== GitHub API =====
let fileSha: string | null = null

async function ghFetch(path: string, options: RequestInit = {}) {
  const token = getGhToken()
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return res
}

async function loadData(): Promise<any> {
  try {
    const token = getGhToken()
    if (!token) throw new Error('no token')
    const res = await ghFetch(`/contents/${GH_FILE}`)
    if (res.ok) {
      const file = await res.json()
      fileSha = file.sha
      const content = atob(file.content.replace(/\n/g, ''))
      return JSON.parse(content)
    }
  } catch {}
  return getLocalData()
}

async function saveData(data: any): Promise<boolean> {
  try {
    const body: any = {
      message: 'update data',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
      branch: GH_BRANCH,
    }
    if (fileSha) body.sha = fileSha
    const res = await ghFetch(`/contents/${GH_FILE}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const result = await res.json()
      fileSha = result.content.sha
      return true
    }
  } catch {}
  return false
}

// 提示输入 token
export function needToken(): boolean {
  if (typeof window === 'undefined') return false
  return !getGhToken() && !localStorage.getItem('gh_token_skipped')
}

export function skipToken() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gh_token_skipped', '1')
  }
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gh_token', token)
  }
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
  try {
    const data = await loadData()
    return data.projects || []
  } catch {
    return getLocalData().projects
  }
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = new Date().toISOString()
  let data: any
  try {
    data = await loadData()
  } catch {
    data = getLocalData()
  }
  const idx = data.projects.findIndex((p: Project) => p.id === project.id)
  if (idx >= 0) data.projects[idx] = project
  else data.projects.unshift(project)
  const ok = await saveData(data)
  if (!ok) saveLocalData(data)
}

export async function deleteProject(id: string): Promise<void> {
  let data: any
  try {
    data = await loadData()
  } catch {
    data = getLocalData()
  }
  data.projects = data.projects.filter((p: Project) => p.id !== id)
  const ok = await saveData(data)
  if (!ok) saveLocalData(data)
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
  try {
    const data = await loadData()
    return data.journals || []
  } catch {
    return getLocalData().journals
  }
}

export async function addJournal(journal: Omit<Journal, 'id' | 'created_at'>): Promise<Journal> {
  const newJournal = {
    ...journal,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  let data: any
  try {
    data = await loadData()
  } catch {
    data = getLocalData()
  }
  data.journals.unshift(newJournal)
  const ok = await saveData(data)
  if (!ok) saveLocalData(data)
  return newJournal
}

export async function deleteJournal(id: string) {
  let data: any
  try {
    data = await loadData()
  } catch {
    data = getLocalData()
  }
  data.journals = data.journals.filter((j: Journal) => j.id !== id)
  const ok = await saveData(data)
  if (!ok) saveLocalData(data)
}
