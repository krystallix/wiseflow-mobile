import { supabase } from './client'

const SCHEMA = 'risenwise'

function getClient() {
  if (!supabase) throw new Error('Supabase client not available')
  return supabase
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export type SubtaskDraft = {
  id: string
  title: string
  is_done: boolean
}

export type Subtask = SubtaskDraft & {
  task_id: string
  sort_order?: number
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  category: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
  cover_url?: string
  comments_count?: number
  attachments_count?: number
  subtasks?: Subtask[]
}

export type CreateTaskPayload = {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  category: string | null
  due_date: string | null
  subtasks: SubtaskDraft[]
  project_id: string | null
}

export type TaskOrderUpdate = {
  id: string
  status: TaskStatus
  position: number
}

// ─── Subtasks ─────────────────────────────────────────────────────────────────

export async function createSubtasks(
  taskId: string,
  subtasks: SubtaskDraft[]
): Promise<Subtask[]> {
  if (subtasks.length === 0) return []
  const sb = getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rows = subtasks.map((s, index) => ({
    id: s.id,
    task_id: taskId,
    user_id: user.id,
    title: s.title,
    is_done: s.is_done,
    sort_order: index,
  }))

  const { data, error } = await sb
    .schema(SCHEMA)
    .from('task_subtasks')
    .insert(rows)
    .select()
  if (error) throw error
  return data ?? []
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────

export async function createTask(
  payload: CreateTaskPayload
): Promise<Task & { subtasks: Subtask[] }> {
  const sb = getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { subtasks, ...taskData } = payload

  const { data: task, error: taskError } = await sb
    .schema(SCHEMA)
    .from('tasks')
    .insert({ ...taskData, user_id: user.id })
    .select()
    .single()
  if (taskError) throw taskError

  const createdSubtasks = await createSubtasks(task.id, subtasks)
  return { ...task, subtasks: createdSubtasks }
}

export async function getTasks(projectId?: string): Promise<Task[]> {
  const sb = getClient()
  let query = sb
    .schema(SCHEMA)
    .from('tasks')
    .select('*, subtasks:task_subtasks(*)')
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<CreateTaskPayload, 'subtasks'>>
): Promise<Task> {
  const sb = getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await sb
    .schema(SCHEMA)
    .from('tasks')
    .update({ ...updates, user_id: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function editTaskDetailed(
  taskId: string,
  taskData: CreateTaskPayload
): Promise<Task> {
  const sb = getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Update task row
  const { error: taskError } = await sb
    .schema(SCHEMA)
    .from('tasks')
    .update({
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      category: taskData.category,
      due_date: taskData.due_date,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
  if (taskError) throw taskError

  // 2. Sync subtasks — fetch existing, upsert/delete
  const { data: existingSubtasks } = await sb
    .schema(SCHEMA)
    .from('task_subtasks')
    .select('id')
    .eq('task_id', taskId)

  const incomingIds = taskData.subtasks.map(s => s.id)

  // Delete removed subtasks
  if (existingSubtasks && existingSubtasks.length > 0) {
    const toDelete = existingSubtasks
      .filter(e => !incomingIds.includes(e.id))
      .map(e => e.id)
    if (toDelete.length > 0) {
      const { error } = await sb
        .schema(SCHEMA)
        .from('task_subtasks')
        .delete()
        .in('id', toDelete)
      if (error) throw error
    }
  }

  // Upsert each subtask
  for (let i = 0; i < taskData.subtasks.length; i++) {
    const st = taskData.subtasks[i]
    const isExisting = existingSubtasks?.some(e => e.id === st.id)
    if (isExisting) {
      const { error } = await sb
        .schema(SCHEMA)
        .from('task_subtasks')
        .update({ title: st.title, is_done: st.is_done, sort_order: i })
        .eq('id', st.id)
      if (error) throw error
    } else {
      const { error } = await sb
        .schema(SCHEMA)
        .from('task_subtasks')
        .insert({ task_id: taskId, user_id: user.id, title: st.title, is_done: st.is_done, sort_order: i })
      if (error) throw error
    }
  }

  // 3. Refetch
  const { data, error } = await sb
    .schema(SCHEMA)
    .from('tasks')
    .select('*, subtasks:task_subtasks(*)')
    .eq('id', taskId)
    .order('sort_order', { referencedTable: 'task_subtasks', ascending: true })
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTasksOrder(updates: TaskOrderUpdate[]): Promise<void> {
  if (updates.length === 0) return
  const sb = getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const results = await Promise.all(
    updates.map(({ id, status, position }) =>
      sb.schema(SCHEMA)
        .from('tasks')
        .update({ status, position, user_id: user.id })
        .eq('id', id)
    )
  )
  const failed = results.find(r => r.error)
  if (failed?.error) throw failed.error
}

export async function toggleSubtask(subtaskId: string, isDone: boolean): Promise<void> {
  const sb = getClient()
  const { error } = await sb
    .schema(SCHEMA)
    .from('task_subtasks')
    .update({ is_done: isDone })
    .eq('id', subtaskId)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const sb = getClient()
  const { error } = await sb
    .schema(SCHEMA)
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
