import type cloudbase from '@cloudbase/js-sdk'

let _db: ReturnType<ReturnType<typeof cloudbase.init>['database']> | null = null

function getDb() {
  if (_db) return _db
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require('@cloudbase/js-sdk')
  const app = sdk.default.init({ env: 'long-d0g1dx0nl38c1394f' })
  _db = app.database()
  return _db
}

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
  try {
    const database = getDb()
    if (!database) throw new Error('no db')
    const res = await database.collection('projects').orderBy('updatedAt', 'desc').get()
    if (res.data) return res.data
  } catch {}
  return getLocalData().projects
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = new Date().toISOString()
  try {
    const database = getDb()
    if (!database) throw new Error('no db')
    const doc = database.collection('projects').doc(project.id)
    const exist = await doc.get()
    if (exist.data && exist.data.length > 0) {
      await doc.set(project)
    } else {
      await database.collection('projects').add(project)
    }
  } catch {
    const data = getLocalData()
    const idx = data.projects.findIndex((p: Project) => p.id === project.id)
    if (idx >= 0) data.projects[idx] = project
    else data.projects.unshift(project)
    saveLocalData(data)
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const database = getDb()
    if (!database) throw new Error('no db')
    await database.collection('projects').doc(id).remove()
  } catch {
    const data = getLocalData()
    data.projects = data.projects.filter((p: Project) => p.id !== id)
    saveLocalData(data)
  }
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
    const database = getDb()
    if (!database) throw new Error('no db')
    const res = await database.collection('journals').orderBy('date', 'desc').get()
    if (res.data) return res.data
  } catch {}
  return getLocalData().journals
}

export async function addJournal(journal: Omit<Journal, 'id' | 'created_at'>): Promise<Journal> {
  const newJournal = {
    ...journal,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  try {
    const database = getDb()
    if (!database) throw new Error('no db')
    await database.collection('journals').add(newJournal)
  } catch {
    const data = getLocalData()
    data.journals.unshift(newJournal)
    saveLocalData(data)
  }
  return newJournal
}

export async function deleteJournal(id: string) {
  try {
    const database = getDb()
    if (!database) throw new Error('no db')
    await database.collection('journals').doc(id).remove()
  } catch {
    const data = getLocalData()
    data.journals = data.journals.filter((j: Journal) => j.id !== id)
    saveLocalData(data)
  }
}
