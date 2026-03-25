import { supabase } from './client'

const SCHEMA = 'risenwise'

// ─── Types ──────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer'
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly' | 'lifetime'
export type DebtDirection = 'payable' | 'receivable'
export type DebtStatus = 'active' | 'settled' | 'cancelled'

export type Wallet = {
    id: string
    user_id: string
    name: string
    type: string
    balance: number
    currency: string
    color: string | null
    icon: string | null
    is_default: boolean
    note: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export type Category = {
    id: string
    user_id: string | null
    owner: 'system' | 'user'
    name: string
    type: TransactionType
    color: string | null
    icon: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export type Contact = {
    id: string
    user_id: string
    name: string
    phone: string | null
    email: string | null
    note: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export type Transaction = {
    id: string
    user_id: string
    wallet_id: string
    category_id: string | null
    type: TransactionType
    amount: number
    note: string | null
    date: string
    transfer_to_wallet_id: string | null
    debt_id: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    // Joined
    wallet?: Pick<Wallet, 'id' | 'name' | 'icon' | 'color' | 'currency'>
    category?: Pick<Category, 'id' | 'name' | 'icon' | 'color' | 'type'>
    transfer_wallet?: Pick<Wallet, 'id' | 'name' | 'icon'>
}

export type Budget = {
    id: string
    user_id: string
    category_id: string
    period: BudgetPeriod
    amount: number
    period_start: string
    period_end: string
    created_at: string
    updated_at: string
    deleted_at: string | null
    category?: Pick<Category, 'id' | 'name' | 'icon' | 'color' | 'type'>
    spent?: number
}

export type SavingGoal = {
    id: string
    user_id: string
    wallet_id: string | null
    name: string
    target_amount: number
    current_amount: number
    deadline: string | null
    color: string | null
    icon: string | null
    note: string | null
    is_achieved: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export type Debt = {
    id: string
    user_id: string
    contact_id: string
    wallet_id: string | null
    direction: DebtDirection
    status: DebtStatus
    principal: number
    paid_amount: number
    due_date: string | null
    description: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    installment_months?: number | null
    checked_months?: number[] | null
    contact?: Pick<Contact, 'id' | 'name' | 'avatar_url'>
}

export type DebtPayment = {
    id: string
    user_id: string
    debt_id: string
    wallet_id: string | null
    amount: number
    paid_at: string
    note: string | null
    created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClient() {
    if (!supabase) throw new Error('Supabase client not available')
    return supabase
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export async function getWallets(): Promise<Wallet[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('wallets')
        .select('*')
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
}

export async function createWallet(payload: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Wallet> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('wallets')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateWallet(id: string, payload: Partial<Omit<Wallet, 'id' | 'user_id'>>): Promise<Wallet> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('wallets')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteWallet(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('wallets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(type?: TransactionType): Promise<Category[]> {
    const sb = getClient()
    let q = sb
        .schema(SCHEMA)
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('owner', { ascending: true })
        .order('name', { ascending: true })
    if (type) q = q.eq('type', type)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
}

export async function createCategory(payload: Omit<Category, 'id' | 'user_id' | 'owner' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Category> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('categories')
        .insert({ ...payload, user_id: user.id, owner: 'user' })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateCategory(id: string, payload: Partial<Omit<Category, 'id' | 'user_id' | 'owner'>>): Promise<Category> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('categories')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteCategory(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getTransactions(opts?: {
    limit?: number
    offset?: number
    wallet_id?: string
    type?: TransactionType
    from?: string
    to?: string
}): Promise<Transaction[]> {
    const sb = getClient()
    let q = sb
        .schema(SCHEMA)
        .from('transactions')
        .select(`*, wallet:wallet_id(id,name,icon,color,currency), category:category_id(id,name,icon,color,type), transfer_wallet:transfer_to_wallet_id(id,name,icon)`)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

    if (opts?.wallet_id) q = q.eq('wallet_id', opts.wallet_id)
    if (opts?.type) q = q.eq('type', opts.type)
    if (opts?.from) q = q.gte('date', opts.from)
    if (opts?.to) q = q.lte('date', opts.to)
    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset) q = q.range(opts.offset, (opts.offset + (opts?.limit ?? 20)) - 1)

    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Transaction[]
}

export async function createTransaction(
    payload: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'wallet' | 'category' | 'transfer_wallet'>
): Promise<Transaction> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('transactions')
        .insert({ ...payload, user_id: user.id })
        .select(`*, wallet:wallet_id(id,name,icon,color,currency), category:category_id(id,name,icon,color,type)`)
        .single()
    if (error) throw error
    return data as Transaction
}

export async function updateTransaction(
    id: string,
    payload: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'wallet' | 'category' | 'transfer_wallet'>>
): Promise<Transaction> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('transactions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`*, wallet:wallet_id(id,name,icon,color,currency), category:category_id(id,name,icon,color,type)`)
        .single()
    if (error) throw error
    return data as Transaction
}

export async function deleteTransaction(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export async function getBudgets(): Promise<Budget[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('budgets')
        .select('*, category:category_id(id,name,icon,color,type)')
        .is('deleted_at', null)
        .order('period_start', { ascending: false })
    if (error) throw error
    return (data ?? []) as Budget[]
}

export async function createBudget(
    payload: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'category' | 'spent'>
): Promise<Budget> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('budgets')
        .insert({ ...payload, user_id: user.id })
        .select('*, category:category_id(id,name,icon,color,type)')
        .single()
    if (error) throw error
    return data as Budget
}

export async function updateBudget(
    id: string,
    payload: Partial<Omit<Budget, 'id' | 'user_id' | 'category' | 'spent'>>
): Promise<Budget> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('budgets')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, category:category_id(id,name,icon,color,type)')
        .single()
    if (error) throw error
    return data as Budget
}

export async function deleteBudget(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('budgets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

// ─── Saving Goals ─────────────────────────────────────────────────────────────

export async function getSavingGoals(): Promise<SavingGoal[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('saving_goals')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
}

export async function createSavingGoal(
    payload: Omit<SavingGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<SavingGoal> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('saving_goals')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateSavingGoal(
    id: string,
    payload: Partial<Omit<SavingGoal, 'id' | 'user_id'>>
): Promise<SavingGoal> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('saving_goals')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteSavingGoal(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('saving_goals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
}

export async function createContact(
    payload: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Contact> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('contacts')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateContact(
    id: string,
    payload: Partial<Pick<Contact, 'name' | 'phone' | 'email' | 'note'>>
): Promise<Contact> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('contacts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export async function getDebts(): Promise<Debt[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('debts')
        .select('*, contact:contact_id(id,name,avatar_url)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Debt[]
}

export async function createDebt(
    payload: Omit<Debt, 'id' | 'user_id' | 'paid_amount' | 'status' | 'created_at' | 'updated_at' | 'deleted_at' | 'contact'>
): Promise<Debt> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('debts')
        .insert({ ...payload, user_id: user.id, paid_amount: 0, status: 'active' })
        .select('*, contact:contact_id(id,name,avatar_url)')
        .single()
    if (error) throw error
    return data as Debt
}

export async function updateDebt(
    id: string,
    payload: Partial<Pick<Debt, 'principal' | 'due_date' | 'description' | 'installment_months' | 'checked_months' | 'paid_amount' | 'status'>>
): Promise<Debt> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('debts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data as Debt
}

export async function addDebtPayment(
    payload: Omit<DebtPayment, 'id' | 'user_id' | 'created_at'>
): Promise<DebtPayment> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('debt_payments')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteDebt(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('debts')
        .delete()
        .eq('id', id)
    if (error) throw error
}

// ─── Summary aggregates (client-side) ────────────────────────────────────────

export type FinanceSummary = {
    totalBalance: number
    monthIncome: number
    monthExpense: number
    monthNet: number
}

export function computeSummary(wallets: Wallet[], transactions: Transaction[]): FinanceSummary {
    const totalBalance = wallets.reduce((s, w) => s + (w.balance ?? 0), 0)
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const monthTx = transactions.filter(t => t.date >= monthStart && !t.deleted_at)
    const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { totalBalance, monthIncome, monthExpense, monthNet: monthIncome - monthExpense }
}
