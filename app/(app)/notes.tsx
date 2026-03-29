import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetBackdrop,
  type BottomSheetRef,
} from '@/components/ui/bottomsheet';
import { Plus, Search, Trash2, RotateCcw, FileText, Clock, X } from 'lucide-react-native';
import {
  getNotes,
  getDeletedNotes,
  createNote,
  updateNote,
  softDeleteNote,
  restoreNote,
  permanentlyDeleteNote,
  type Note,
} from '@/libs/supabase/notes';
import { supabase } from '@/libs/supabase/client';
import BlockEditor from '@/components/notes/block-editor';
import { blockNoteExcerpt } from '@/libs/blocknote-utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Note Editor Sheet ─────────────────────────────────────────────────────────

function NoteEditorSheet({
  sheetRef,
  note,
  onSave,
  onClose,
}: {
  sheetRef: React.RefObject<BottomSheetRef | null>;
  note: Note | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Use a ref instead of state so handleDone always reads the LATEST
  // content synchronously, even if onContentChange fired asynchronously.
  const latestJsonRef = useRef<string>('');
  // Track note id to detect sheet was opened for a different note
  const noteIdRef = useRef<string | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? '');
    latestJsonRef.current = note?.content ?? '';
    noteIdRef.current = note?.id ?? null;
  }, [note?.id]);  // re-init only when a different note is loaded

  const save = useCallback(async (t: string, json: string) => {
    if (!t.trim()) return;
    setSaving(true);
    try {
      if (note) {
        await updateNote(note.id, { title: t, content: json });
      } else {
        await createNote(t, json);
      }
      onSave();
    } catch (err) {
      console.error('[NoteEditor] Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [note, onSave]);

  const handleDone = async () => {
    // latestJsonRef.current is always the most up-to-date content
    await save(title, latestJsonRef.current);
    sheetRef.current?.close();
  };

  return (
    <BottomSheet ref={sheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['97%']} backdropComponent={BottomSheetBackdrop}>
        <View style={{ flex: 1 }}>
          {/* Top bar */}
          <HStack className="items-center justify-between px-5 pt-3 pb-3 border-b border-border/30">
            <Pressable onPress={() => sheetRef.current?.close()} className="p-1 -ml-1">
              <X size={20} color="#94a3b8" />
            </Pressable>
            <Text className="font-bold text-base text-foreground">
              {note ? 'Edit note' : 'New note'}
            </Text>
            <Pressable
              onPress={handleDone}
              className="px-3 py-1.5 rounded-full bg-primary/10 active:bg-primary/20"
            >
              {saving
                ? <ActivityIndicator size="small" color="#6366f1" />
                : <Text className="text-primary font-bold text-sm">Done</Text>}
            </Pressable>
          </HStack>

          {/* Block Editor — always pass initial content as prop;
              onContentChange updates our ref (not state) for zero-delay reads */}
          <BlockEditor
            title={title}
            onTitleChange={setTitle}
            content={note?.content ?? ''}
            onContentChange={(json) => {
              // Update ref synchronously — always current when Done is pressed
              latestJsonRef.current = json;
            }}
            // Autosave for existing notes only (debounced inside BlockEditor)
            onSave={note ? (t, json) => save(t, json) : undefined}
          />
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}


// ─── Note Card ─────────────────────────────────────────────────────────────────

const cardColors = [
  { bg: '#fefce8', border: '#fef08a' },   // yellow
  { bg: '#eef2ff', border: '#c7d2fe' },   // indigo
  { bg: '#f0fdf4', border: '#bbf7d0' },   // green
  { bg: '#fff1f2', border: '#fecdd3' },   // rose
  { bg: '#f5f3ff', border: '#ddd6fe' },   // violet
  { bg: '#f0f9ff', border: '#bae6fd' },   // sky
];

function NoteCard({
  note,
  index,
  inTrash,
  onPress,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  note: Note;
  index: number;
  inTrash: boolean;
  onPress: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  const color = cardColors[index % cardColors.length];
  const excerptText = blockNoteExcerpt(note.content, 100);

  return (
    <Pressable
      onPress={inTrash ? undefined : onPress}
      style={{
        width: '47.5%',
        backgroundColor: color.bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: color.border,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <VStack className="gap-1.5">
        <Text className="font-extrabold text-foreground text-sm leading-snug" numberOfLines={2}>
          {note.title}
        </Text>
        {excerptText ? (
          <Text className="text-muted-foreground text-[11px] leading-relaxed" numberOfLines={4}>
            {excerptText}
          </Text>
        ) : null}
        <HStack className="items-center gap-1 mt-1">
          <Clock size={10} color="#94a3b8" />
          <Text className="text-muted-foreground text-[10px]">{timeAgo(note.updated_at)}</Text>
        </HStack>

        {inTrash ? (
          <HStack className="gap-2 mt-2">
            <Pressable
              onPress={onRestore}
              style={{ flex: 1, height: 32, borderRadius: 12, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}
            >
              <RotateCcw size={14} color="#10b981" />
            </Pressable>
            <Pressable
              onPress={onPermanentDelete}
              style={{ flex: 1, height: 32, borderRadius: 12, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={14} color="#f43f5e" />
            </Pressable>
          </HStack>
        ) : (
          <Pressable
            onPress={onDelete}
            style={{ position: 'absolute', top: 6, right: 6, padding: 4, borderRadius: 8 }}
          >
            <Trash2 size={13} color="#cbd5e1" />
          </Pressable>
        )}
      </VStack>
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const editorRef = useRef<BottomSheetRef>(null);

  const fetchNotes = useCallback(async () => {
    try {
      await supabase.auth.getSession();
      const [active, deleted] = await Promise.all([getNotes(), getDeletedNotes()]);
      setNotes(active);
      setDeletedNotes(deleted);
    } catch (err) {
      console.error('[Notes] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const openNew = () => {
    setActiveNote(null);
    setTimeout(() => editorRef.current?.open(), 50);
  };

  const openEdit = (note: Note) => {
    setActiveNote(note);
    setTimeout(() => editorRef.current?.open(), 50);
  };

  const handleDelete = (note: Note) => {
    Alert.alert('Move to Trash', `"${note.title}" will be moved to trash.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Trash', style: 'destructive', onPress: async () => { await softDeleteNote(note.id); fetchNotes(); } },
    ]);
  };

  const handleRestore = async (note: Note) => { await restoreNote(note.id); fetchNotes(); };

  const handlePermanentDelete = (note: Note) => {
    Alert.alert('Delete Forever', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await permanentlyDeleteNote(note.id); fetchNotes(); } },
    ]);
  };

  const pool = showTrash ? deletedNotes : notes;
  const displayed = query
    ? pool.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || blockNoteExcerpt(n.content, 500).toLowerCase().includes(query.toLowerCase()))
    : pool;

  return (
    <View style={{ flex: 1 }} className="bg-background px-5 pt-4">
      {/* Search + actions */}
      <HStack className="items-center gap-3 mb-5">
        <HStack className="flex-1 items-center bg-card border border-border/40 rounded-2xl px-4 h-11 gap-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={{ flex: 1, fontSize: 14 }}
            placeholder="Search notes…"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={14} color="#94a3b8" />
            </Pressable>
          )}
        </HStack>

        <Pressable
          onPress={() => setShowTrash(v => !v)}
          style={{
            height: 44, width: 44, borderRadius: 16,
            backgroundColor: showTrash ? '#fff1f2' : 'white',
            borderWidth: 1, borderColor: showTrash ? '#fecdd3' : '#e2e8f0',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Trash2 size={18} color={showTrash ? '#f43f5e' : '#64748b'} />
        </Pressable>

        <Pressable
          onPress={openNew}
          style={{ height: 44, width: 44, borderRadius: 16, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} color="white" />
        </Pressable>
      </HStack>

      {/* Section label */}
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
        {showTrash ? `Trash (${deletedNotes.length})` : `Notes (${notes.length})`}
      </Text>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : displayed.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <FileText size={40} color="#94a3b8" />
          <Text className="text-muted-foreground font-medium text-sm text-center">
            {showTrash ? 'Trash is empty' : 'No notes yet.\nTap + to create one.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* 2-column grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {displayed.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                index={i}
                inTrash={showTrash}
                onPress={() => openEdit(note)}
                onDelete={() => handleDelete(note)}
                onRestore={() => handleRestore(note)}
                onPermanentDelete={() => handlePermanentDelete(note)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <NoteEditorSheet
        sheetRef={editorRef}
        note={activeNote}
        onSave={fetchNotes}
        onClose={() => { fetchNotes(); setActiveNote(null); }}
      />
    </View>
  );
}
