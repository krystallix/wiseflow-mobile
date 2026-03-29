import { supabase } from './client'

const SCHEMA = 'risenwise'

function getClient() {
    if (!supabase) throw new Error('Supabase client not available')
    return supabase
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Note = {
    id: string
    user_id: string
    title: string
    content: string | null
    deleted_at: string | null
    created_at: string
    updated_at: string
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get all active notes (deleted_at IS NULL) for the current user. */
export async function getNotes(): Promise<Note[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
}

/** Get all soft-deleted notes (deleted_at IS NOT NULL). */
export async function getDeletedNotes(): Promise<Note[]> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
    if (error) throw error
    return data ?? []
}

/** Get a single note by id. */
export async function getNoteById(id: string): Promise<Note | null> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()
    if (error) throw error
    return data
}

/** Create a new note. */
export async function createNote(title: string, content: string = ''): Promise<Note> {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .insert({ title, content, user_id: user.id })
        .select()
        .single()
    if (error) throw error
    return data
}

/** Update a note's title and/or content. */
export async function updateNote(
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content'>>
): Promise<Note> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

/** Soft-delete a note (set deleted_at to now). */
export async function softDeleteNote(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

/** Restore a soft-deleted note. */
export async function restoreNote(id: string): Promise<Note> {
    const sb = getClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .update({ deleted_at: null })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

/** Permanently delete a note. */
export async function permanentlyDeleteNote(id: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('notes')
        .delete()
        .eq('id', id)
    if (error) throw error
}
