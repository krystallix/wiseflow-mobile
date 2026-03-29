import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonIcon, ButtonSpinner } from '@/components/ui/button';
import {
  BottomSheet, BottomSheetPortal, BottomSheetBackdrop,
  BottomSheetScrollView, type BottomSheetRef,
} from '@/components/ui/bottomsheet';
import {
  Plus, Trash2, CheckCircle2, Circle, ChevronRight,
  ArrowUp, ArrowDown, ArrowRight, Calendar, Tag, X,
  Clock, XCircle, ListChecks, ClipboardList, Save,
} from 'lucide-react-native';
import { supabase } from '@/libs/supabase/client';
import {
  getTasks, createTask, editTaskDetailed, deleteTask, toggleSubtask,
  type Task, type TaskStatus, type TaskPriority,
  type SubtaskDraft, type CreateTaskPayload,
} from '@/libs/supabase/tasks';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: { key: TaskStatus; label: string; color: string; accent: string }[] = [
  { key: 'todo',        label: 'To Do',       color: '#64748b', accent: '#f1f5f9' },
  { key: 'in_progress', label: 'In Progress', color: '#6366f1', accent: '#eef2ff' },
  { key: 'done',        label: 'Done',        color: '#10b981', accent: '#ecfdf5' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#f43f5e', accent: '#fff1f2' },
];

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'Low',    label: 'Low',    color: '#10b981' },
  { key: 'Medium', label: 'Medium', color: '#f59e0b' },
  { key: 'High',   label: 'High',   color: '#f97316' },
];

const STATUS_ICONS: Record<string, (color: string) => React.ReactNode> = {
  todo:        c => <Circle size={12}       color={c} />,
  in_progress: c => <Clock size={12}        color={c} />,
  done:        c => <CheckCircle2 size={12} color={c} />,
  cancelled:   c => <XCircle size={12}      color={c} />,
};

const PRIORITY_ICONS: Record<string, (active: boolean, color: string) => React.ReactNode> = {
  Low:    (a, c) => <ArrowDown  size={12} color={a ? 'white' : c} />,
  Medium: (a, c) => <ArrowRight size={12} color={a ? 'white' : c} />,
  High:   (a, c) => <ArrowUp    size={12} color={a ? 'white' : c} />,
};

function statusInfo(s: string) {
  const low = (s ?? '').toLowerCase();
  return STATUSES.find(x => x.key.toLowerCase() === low) ?? STATUSES[0];
}
function priorityInfo(p: string) {
  const low = (p ?? '').toLowerCase();
  return PRIORITIES.find(x => x.key.toLowerCase() === low) ?? PRIORITIES[1];
}
function genLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ─── Compact Task Row ─────────────────────────────────────────────────────────

function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  const p = priorityInfo(task.priority);
  const s = statusInfo(task.status);
  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter(st => st.is_done).length;
  const iconFn = STATUS_ICONS[task.status?.toLowerCase()] ?? STATUS_ICONS['todo'];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3 px-4 active:opacity-70"
    >
      {/* Status dot */}
      <View
        className="h-7 w-7 rounded-full items-center justify-center"
        style={{ backgroundColor: s.accent }}
      >
        {iconFn(s.color)}
      </View>

      {/* Content */}
      <VStack className="flex-1 gap-0.5">
        <Text className="font-semibold text-foreground text-sm" numberOfLines={1}>
          {task.title}
        </Text>
        <HStack className="items-center gap-3">
          {task.due_date && (
            <HStack className="items-center gap-1">
              <Calendar size={10} color="#94a3b8" />
              <Text className="text-muted-foreground text-[10px]">{formatDate(task.due_date)}</Text>
            </HStack>
          )}
          {subtasks.length > 0 && (
            <Text className="text-muted-foreground text-[10px]">{doneCount}/{subtasks.length} sub</Text>
          )}
          {task.category && (
            <Text className="text-muted-foreground text-[10px]">{task.category}</Text>
          )}
        </HStack>
      </VStack>

      {/* Priority badge */}
      <View
        className="rounded-md px-2 py-0.5"
        style={{ backgroundColor: p.color + '18' }}
      >
        <Text style={{ fontSize: 10, fontWeight: '700', color: p.color }}>{p.label}</Text>
      </View>

      <ChevronRight size={13} color="#94a3b8" />
    </Pressable>
  );
}

// ─── Task Sheet ───────────────────────────────────────────────────────────────

function TaskSheet({
  sheetRef, task, initialStatus, onSave, onDelete, onClose,
}: {
  sheetRef: React.RefObject<BottomSheetRef | null>;
  task: Task | null;
  initialStatus: TaskStatus;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]           = useState<TaskStatus>('todo');
  const [priority, setPriority]       = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate]         = useState('');
  const [category, setCategory]       = useState('');
  const [subtasks, setSubtasks]       = useState<SubtaskDraft[]>([]);
  const [newSub, setNewSub]           = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date ?? '');
      setCategory(task.category ?? '');
      setSubtasks(task.subtasks?.map(s => ({ id: s.id, title: s.title, is_done: s.is_done })) ?? []);
    } else {
      setTitle(''); setDescription(''); setStatus(initialStatus);
      setPriority('Medium'); setDueDate(''); setCategory(''); setSubtasks([]);
    }
  }, [task?.id, initialStatus]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim() || null,
        status, priority,
        category: category.trim() || null,
        due_date: dueDate || null,
        subtasks, project_id: null,
      };
      if (task) { await editTaskDetailed(task.id, payload); }
      else       { await createTask(payload); }
      onSave();
      sheetRef.current?.close();
    } catch (err) {
      console.error('[TaskSheet]', err);
    } finally {
      setSaving(false);
    }
  };

  const addSub = () => {
    if (!newSub.trim()) return;
    setSubtasks(p => [...p, { id: genLocalId(), title: newSub.trim(), is_done: false }]);
    setNewSub('');
  };

  const doneCount = subtasks.filter(s => s.is_done).length;

  return (
    <BottomSheet ref={sheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['92%']} backdropComponent={BottomSheetBackdrop}>
        <View className="flex-1">

          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-4 gap-6">

              {/* Header */}
              <HStack className="justify-between items-start">
                <VStack className="gap-1 flex-1">
                  <Heading size="md">{task ? 'Edit Task' : 'New Task'}</Heading>
                  <Text size="xs" className="text-muted-foreground">
                    {task ? 'Update task details below.' : 'Fill in the details to create a new task.'}
                  </Text>
                </VStack>
                <HStack className="items-center gap-3">
                  {task && (
                    <Pressable onPress={onDelete} className="p-1.5 rounded-full active:bg-destructive/10">
                      <Trash2 size={16} color="#f43f5e" />
                    </Pressable>
                  )}
                  <Button
                    className="rounded-2xl bg-[#312e81] h-9 px-4"
                    onPress={handleSave}
                    disabled={saving || !title.trim()}
                  >
                    {saving
                      ? <ButtonSpinner className="text-primary-foreground" />
                      : <ButtonIcon as={Save} color="white" size="sm" />}
                    <ButtonText className="text-white font-bold ml-1.5 text-xs">Save</ButtonText>
                  </Button>
                </HStack>
              </HStack>

              {/* Title */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1 text-foreground">Task title *</Text>
                <Input className="rounded-2xl border-border/40 h-12 bg-card">
                  <InputField
                    placeholder="e.g. Build finance dashboard"
                    value={title}
                    onChangeText={setTitle}
                    className="text-sm"
                  />
                </Input>
              </VStack>

              {/* Description */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1 text-foreground">Description</Text>
                <Input className="rounded-2xl border-border/40 bg-card" style={{ minHeight: 72, alignItems: 'flex-start', paddingTop: 8 }}>
                  <InputField
                    placeholder="Add a short description (optional)..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    className="text-sm"
                    style={{ minHeight: 60 }}
                  />
                </Input>
              </VStack>

              {/* Status */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1 text-foreground">Status</Text>
                <Card className="rounded-[20px] p-3 bg-card border border-border/40 shadow-none">
                  <HStack className="flex-wrap gap-2">
                    {STATUSES.map(s => {
                      const active = status.toLowerCase() === s.key.toLowerCase();
                      const iconFn = STATUS_ICONS[s.key] ?? STATUS_ICONS['todo'];
                      return (
                        <Pressable
                          key={s.key}
                          onPress={() => setStatus(s.key)}
                          className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                          style={{
                            backgroundColor: active ? s.color : s.accent,
                            borderWidth: 1.5,
                            borderColor: active ? s.color : 'transparent',
                          }}
                        >
                          {iconFn(active ? 'white' : s.color)}
                          <Text
                            className="text-xs font-bold"
                            style={{ color: active ? 'white' : s.color }}
                          >
                            {s.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </Card>
              </VStack>

              {/* Priority */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1 text-foreground">Priority</Text>
                <HStack className="gap-2">
                  {PRIORITIES.map(p => {
                    const active = priority.toLowerCase() === p.key.toLowerCase();
                    const iconFn = PRIORITY_ICONS[p.key] ?? (() => null);
                    return (
                      <Pressable
                        key={p.key}
                        onPress={() => setPriority(p.key)}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-full"
                        style={{
                          backgroundColor: active ? p.color : p.color + '18',
                          borderWidth: 1.5,
                          borderColor: active ? p.color : 'transparent',
                        }}
                      >
                        {iconFn(active, p.color)}
                        <Text className="text-xs font-bold" style={{ color: active ? 'white' : p.color }}>
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </VStack>

              {/* Category + Due Date */}
              <HStack className="gap-3">
                <VStack className="flex-1 gap-2">
                  <Text size="xs" className="font-bold ml-1 text-foreground">Category</Text>
                  <Input className="rounded-2xl border-border/40 h-11 bg-card">
                    <InputField
                      placeholder="e.g. Work"
                      value={category}
                      onChangeText={setCategory}
                      className="text-sm"
                    />
                  </Input>
                </VStack>
                <VStack className="flex-1 gap-2">
                  <Text size="xs" className="font-bold ml-1 text-foreground">Due Date</Text>
                  <Input className="rounded-2xl border-border/40 h-11 bg-card">
                    <InputField
                      placeholder="YYYY-MM-DD"
                      value={dueDate}
                      onChangeText={setDueDate}
                      className="text-sm"
                    />
                  </Input>
                </VStack>
              </HStack>

              {/* Subtasks */}
              <VStack className="gap-3">
                <HStack className="justify-between items-center ml-1">
                  <Text size="xs" className="font-bold text-foreground">Sub Tasks</Text>
                  {subtasks.length > 0 && (
                    <View className="bg-primary/10 rounded-full px-2.5 py-0.5">
                      <Text className="text-primary text-[10px] font-bold">{doneCount}/{subtasks.length} done</Text>
                    </View>
                  )}
                </HStack>

                {subtasks.length > 0 && (
                  <Card className="rounded-[20px] bg-card border border-border/40 overflow-hidden shadow-none">
                    <VStack className="gap-0">
                      {subtasks.map((st, idx) => (
                        <VStack key={st.id}>
                          <HStack className="items-center gap-3 px-4 py-3">
                            <Pressable onPress={() => setSubtasks(p => p.map(s => s.id === st.id ? { ...s, is_done: !s.is_done } : s))}>
                              {st.is_done
                                ? <CheckCircle2 size={16} color="#10b981" />
                                : <Circle size={16} color="#94a3b8" />}
                            </Pressable>
                            <Text
                              className="flex-1 text-sm"
                              style={{
                                color: st.is_done ? '#94a3b8' : undefined,
                                textDecorationLine: st.is_done ? 'line-through' : 'none',
                              }}
                              numberOfLines={2}
                            >
                              {st.title}
                            </Text>
                            <Pressable
                              onPress={() => setSubtasks(p => p.filter(s => s.id !== st.id))}
                              className="p-1 -mr-1 rounded-full active:bg-destructive/10"
                            >
                              <X size={13} color="#cbd5e1" />
                            </Pressable>
                          </HStack>
                          {idx < subtasks.length - 1 && (
                            <View className="h-px bg-border/20 mx-4" />
                          )}
                        </VStack>
                      ))}
                    </VStack>
                  </Card>
                )}

                {/* Add subtask row */}
                <HStack className="items-center gap-2">
                  <Input className="flex-1 rounded-2xl border-border/40 h-11 bg-card">
                    <InputField
                      placeholder="Add a subtask..."
                      value={newSub}
                      onChangeText={setNewSub}
                      onSubmitEditing={addSub}
                      returnKeyType="done"
                      className="text-sm"
                    />
                  </Input>
                  <Button
                    className="rounded-2xl bg-primary/10 h-11 px-4"
                    onPress={addSub}
                    disabled={!newSub.trim()}
                  >
                    <ButtonIcon as={Plus} className="text-primary" size="sm" />
                    <ButtonText className="text-primary font-bold ml-1 text-xs">Add</ButtonText>
                  </Button>
                </HStack>
              </VStack>

              <View style={{ height: 20 }} />
            </VStack>
          </BottomSheetScrollView>
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}

// ─── Main Task Screen ─────────────────────────────────────────────────────────

const TAB_KEYS = STATUSES.map(s => s.key);

export default function TaskScreen() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<TaskStatus>('todo');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sheetRef                    = useRef<BottomSheetRef>(null);
  const scrollRef                   = useRef<ScrollView>(null);
  const [layoutWidth, setLayoutWidth] = useState(Dimensions.get('window').width - 48);

  const fetchTasks = useCallback(async () => {
    try {
      await supabase.auth.getSession();
      setTasks(await getTasks());
    } catch (err) {
      console.error('[Tasks]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openNew = () => {
    setActiveTask(null);
    setTimeout(() => sheetRef.current?.open(), 50);
  };

  const openEdit = (task: Task) => {
    setActiveTask(task);
    setTimeout(() => sheetRef.current?.open(), 50);
  };

  const handleDelete = () => {
    if (!activeTask) return;
    Alert.alert('Delete Task', `Delete "${activeTask.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteTask(activeTask.id);
        sheetRef.current?.close();
        fetchTasks();
      }},
    ]);
  };

  const switchTab = (key: TaskStatus) => {
    setActiveTab(key);
    const idx = TAB_KEYS.indexOf(key);
    scrollRef.current?.scrollTo({ x: idx * layoutWidth, animated: true });
  };

  const onScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / layoutWidth);
    setActiveTab(TAB_KEYS[idx] ?? 'todo');
  };

  const counts = Object.fromEntries(
    TAB_KEYS.map(k => [k, tasks.filter(t => t.status?.toLowerCase() === k).length])
  );

  return (
    <View className="flex-1 bg-background">

      {/* Header */}
      <HStack className="justify-between items-center px-5 pt-4 pb-2">
        <Text className="text-xl font-extrabold text-foreground">Tasks</Text>
        <Button className="rounded-full bg-[#312e81] h-9 px-4" onPress={openNew}>
          <ButtonIcon as={Plus} color="white" size="sm" />
          <ButtonText className="text-white font-medium ml-1 text-xs">New Task</ButtonText>
        </Button>
      </HStack>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 6 }}
        className="grow-0"
      >
        {STATUSES.map(s => {
          const active = activeTab === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => switchTab(s.key)}
              className="flex-row items-center gap-1.5 px-4 py-2 rounded-full mr-2"
              style={{ backgroundColor: active ? s.color : '#f8fafc' }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: active ? 'white' : '#64748b' }}
              >
                {s.label}
              </Text>
              {counts[s.key] > 0 && (
                <View
                  className="rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : s.color + '20' }}
                >
                  <Text
                    className="text-[10px] font-extrabold"
                    style={{ color: active ? 'white' : s.color }}
                  >
                    {counts[s.key]}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollEnd}
          onLayout={e => setLayoutWidth(e.nativeEvent.layout.width)}
          className="flex-1"
        >
          {STATUSES.map(s => {
            const tabTasks = tasks.filter(t => t.status?.toLowerCase() === s.key);
            return (
              <View key={s.key} style={{ width: layoutWidth }} className="px-4">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}>
                  {tabTasks.length === 0 ? (
                    <View className="items-center justify-center pt-16 gap-3">
                      <ClipboardList size={36} color="#e2e8f0" />
                      <Text className="text-sm text-muted-foreground text-center">
                        No {s.label.toLowerCase()} tasks.{'\n'}Tap New Task to add one.
                      </Text>
                    </View>
                  ) : (
                    <Card className="rounded-[32px] p-2 bg-card border border-border/40 overflow-hidden">
                      <VStack className="gap-0">
                        {tabTasks.map((task, idx) => (
                          <VStack key={task.id}>
                            <TaskRow task={task} onPress={() => openEdit(task)} />
                            {idx < tabTasks.length - 1 && (
                              <View className="h-px bg-border/20 mx-4" />
                            )}
                          </VStack>
                        ))}
                      </VStack>
                    </Card>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      <TaskSheet
        sheetRef={sheetRef}
        task={activeTask}
        initialStatus={activeTab}
        onSave={fetchTasks}
        onDelete={handleDelete}
        onClose={() => setActiveTask(null)}
      />
    </View>
  );
}
