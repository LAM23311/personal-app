import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 本地存储 fallback（无 Supabase 时使用）
const LOCAL_KEY = 'personal_app_data'

function getLocalData() {
  if (typeof window === 'undefined') return { expenses: [], journals: [] }
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"expenses":[],"journals":[]}')
  } catch {
    return { expenses: [], journals: [] }
  }
}

function saveLocalData(data: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

// 记账 CRUD
export type Expense = {
  id: string
  amount: number
  category: string
  note: string
  date: string
  created_at: string
}

export async function getExpenses(): Promise<Expense[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (!error && data) return data
  }
  return getLocalData().expenses
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const newExpense = {
    ...expense,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  if (supabase) {
    const { error } = await supabase.from('expenses').insert(newExpense)
    if (error) throw error
  } else {
    const data = getLocalData()
    data.expenses.unshift(newExpense)
    saveLocalData(data)
  }
  return newExpense
}

export async function deleteExpense(id: string) {
  if (supabase) {
    await supabase.from('expenses').delete().eq('id', id)
  } else {
    const data = getLocalData()
    data.expenses = data.expenses.filter((e: Expense) => e.id !== id)
    saveLocalData(data)
  }
}

// 日志 CRUD
export type Journal = {
  id: string
  title: string
  content: string
  tags: string[]
  date: string
  created_at: string
}

export async function getJournals(): Promise<Journal[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .order('date', { ascending: false })
    if (!error && data) return data
  }
  return getLocalData().journals
}

export async function addJournal(journal: Omit<Journal, 'id' | 'created_at'>): Promise<Journal> {
  const newJournal = {
    ...journal,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  if (supabase) {
    const { error } = await supabase.from('journals').insert(newJournal)
    if (error) throw error
  } else {
    const data = getLocalData()
    data.journals.unshift(newJournal)
    saveLocalData(data)
  }
  return newJournal
}

export async function deleteJournal(id: string) {
  if (supabase) {
    await supabase.from('journals').delete().eq('id', id)
  } else {
    const data = getLocalData()
    data.journals = data.journals.filter((j: Journal) => j.id !== id)
    saveLocalData(data)
  }
}
