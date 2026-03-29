import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import {
  Wallet2, CheckCircle2, Circle, StickyNote,
  ArrowUpRight, ArrowDownLeft, ChevronRight,
  BarChart3, TrendingUp, TrendingDown, CalendarDays,
  ClipboardList, Target, CreditCard,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/libs/supabase/client';
import {
  getWallets, getTransactions, getSavingGoals, getBudgets, getDebts,
  computeSummary,
  type Wallet, type Transaction, type SavingGoal, type Budget, type Debt,
} from '@/libs/supabase/finance';
import { getNotes, type Note } from '@/libs/supabase/notes';
import { getTasks, type Task } from '@/libs/supabase/tasks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID').replace(/,/g, '.');
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 🌅';
  if (h < 17) return 'Good afternoon ☀️';
  return 'Good evening 🌙';
}

function priorityColor(p: string) {
  const low = p?.toLowerCase();
  if (low === 'high') return '#f97316';
  if (low === 'low') return '#10b981';
  return '#f59e0b';
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, route, count,
}: {
  icon: React.ReactNode;
  title: string;
  route: string;
  count?: number;
}) {
  const router = useRouter();
  return (
    <HStack className="justify-between items-center mb-3">
      <HStack className="items-center gap-2">
        {icon}
        <Text className="font-bold text-foreground text-sm">{title}</Text>
        {count !== undefined && count > 0 && (
          <View className="bg-primary/10 rounded-full px-2 py-0.5">
            <Text className="text-primary text-[10px] font-bold">{count}</Text>
          </View>
        )}
      </HStack>
      <Pressable onPress={() => router.push(route as any)} className="flex-row items-center gap-0.5 active:opacity-60">
        <Text className="text-xs text-muted-foreground">See all</Text>
        <ChevronRight size={12} color="#94a3b8" />
      </Pressable>
    </HStack>
  );
}

// ─── Finance Summary Hero ─────────────────────────────────────────────────────

function FinanceHero({
  wallets, transactions, loading,
}: {
  wallets: Wallet[];
  transactions: Transaction[];
  loading: boolean;
}) {
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const summary = computeSummary(wallets, transactions);
  const router = useRouter();

  if (loading) {
    return (
      <Card className="rounded-[28px] bg-[#1e1b4b] border-0 p-5 shadow-none">
        <VStack className="gap-4">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-8 w-40 rounded-full" />
          <HStack className="gap-4">
            <Skeleton className="flex-1 h-14 rounded-2xl" />
            <Skeleton className="flex-1 h-14 rounded-2xl" />
          </HStack>
        </VStack>
      </Card>
    );
  }

  return (
    <Pressable onPress={() => router.push('/(app)/finance' as any)} className="active:opacity-90">
      <Card className="rounded-[28px] border-0 shadow-none overflow-hidden" style={{ backgroundColor: '#1e1b4b' }}>
        <VStack className="p-5 gap-4">
          {/* Balance */}
          <VStack className="gap-1">
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
              TOTAL BALANCE
            </Text>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
              {fmt(totalBalance)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
            </Text>
          </VStack>

          {/* Income / Expense */}
          <HStack className="gap-3">
            <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <HStack className="items-center gap-2 mb-1">
                <View className="h-6 w-6 rounded-full items-center justify-center" style={{ backgroundColor: '#10b981' + '30' }}>
                  <TrendingUp size={12} color="#10b981" />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>INCOME</Text>
              </HStack>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '800' }}>{fmt(summary.monthIncome)}</Text>
            </View>
            <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <HStack className="items-center gap-2 mb-1">
                <View className="h-6 w-6 rounded-full items-center justify-center" style={{ backgroundColor: '#f43f5e' + '30' }}>
                  <TrendingDown size={12} color="#f43f5e" />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>EXPENSE</Text>
              </HStack>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '800' }}>{fmt(summary.monthExpense)}</Text>
            </View>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );
}

// ─── Recent Transactions ──────────────────────────────────────────────────────

function RecentTransactions({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
  const recent = transactions.slice(0, 4);
  if (loading) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-4">
      <VStack className="gap-3">
        {[1, 2, 3].map(i => <SkeletonText key={i} _lines={1} className="h-8 rounded-xl" />)}
      </VStack>
    </Card>
  );
  if (recent.length === 0) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-5">
      <Text className="text-sm text-muted-foreground text-center">No transactions yet.</Text>
    </Card>
  );
  return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none overflow-hidden">
      <VStack className="gap-0">
        {recent.map((tx, idx) => {
          const isIncome = tx.type === 'income';
          const catName = (tx as any).category?.name ?? 'Uncategorized';
          const catColor = (tx as any).category?.color ?? '#6366f1';
          const catIcon = (tx as any).category?.icon ?? 'Receipt';
          return (
            <VStack key={tx.id}>
              <HStack className="items-center gap-3 px-4 py-3">
                <View className="h-8 w-8 rounded-full items-center justify-center" style={{ backgroundColor: catColor + '20' }}>
                  <DynamicIcon name={catIcon} size={14} color={catColor} />
                </View>
                <VStack className="flex-1 gap-0">
                  <Text className="font-semibold text-foreground text-sm" numberOfLines={1}>{catName}</Text>
                  <Text className="text-muted-foreground text-[10px]">{relativeTime(tx.created_at)}</Text>
                </VStack>
                <HStack className="items-center gap-1">
                  {isIncome
                    ? <ArrowUpRight size={12} color="#10b981" />
                    : <ArrowDownLeft size={12} color="#f43f5e" />}
                  <Text className="font-bold text-sm" style={{ color: isIncome ? '#10b981' : '#f43f5e' }}>
                    {fmt(tx.amount)}
                  </Text>
                </HStack>
              </HStack>
              {idx < recent.length - 1 && <View className="h-px bg-border/20 mx-4" />}
            </VStack>
          );
        })}
      </VStack>
    </Card>
  );
}

// ─── Saving Goals ─────────────────────────────────────────────────────────────

function GoalsPreview({ goals, loading }: { goals: SavingGoal[]; loading: boolean }) {
  const top = goals.slice(0, 3);
  if (loading) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-4">
      <SkeletonText _lines={2} className="h-6 rounded-xl" />
    </Card>
  );
  if (top.length === 0) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-5">
      <Text className="text-sm text-muted-foreground text-center">No saving goals yet.</Text>
    </Card>
  );
  return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none overflow-hidden">
      <VStack className="gap-0">
        {top.map((g, idx) => {
          const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
          return (
            <VStack key={g.id}>
              <VStack className="gap-2 px-4 py-3">
                <HStack className="items-center gap-3">
                  <View className="h-8 w-8 rounded-full items-center justify-center" style={{ backgroundColor: (g.color ?? '#6366f1') + '20' }}>
                    <DynamicIcon name={g.icon ?? 'Target'} size={14} color={g.color ?? '#6366f1'} />
                  </View>
                  <VStack className="flex-1">
                    <Text className="font-semibold text-foreground text-sm" numberOfLines={1}>{g.name}</Text>
                    <Text className="text-muted-foreground text-[10px]">{fmt(g.current_amount)} / {fmt(g.target_amount)}</Text>
                  </VStack>
                  <Text className="text-[10px] font-bold text-muted-foreground">{Math.round(pct)}%</Text>
                </HStack>
                <Progress value={pct} className="h-1.5 rounded-full bg-muted">
                  <ProgressFilledTrack className="rounded-full" style={{ backgroundColor: g.color ?? '#6366f1' }} />
                </Progress>
              </VStack>
              {idx < top.length - 1 && <View className="h-px bg-border/20 mx-4" />}
            </VStack>
          );
        })}
      </VStack>
    </Card>
  );
}

// ─── Tasks Preview ────────────────────────────────────────────────────────────

function TasksPreview({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  const pending = tasks.filter(t => t.status?.toLowerCase() !== 'done' && t.status?.toLowerCase() !== 'cancelled').slice(0, 4);
  if (loading) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-4">
      <SkeletonText _lines={2} className="h-6 rounded-xl" />
    </Card>
  );
  if (pending.length === 0) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-5">
      <Text className="text-sm text-muted-foreground text-center">All tasks completed! 🎉</Text>
    </Card>
  );
  return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none overflow-hidden">
      <VStack className="gap-0">
        {pending.map((task, idx) => {
          const isDone = task.status?.toLowerCase() === 'done';
          const pColor = priorityColor(task.priority);
          const subtasks = task.subtasks ?? [];
          const doneCount = subtasks.filter(s => s.is_done).length;
          return (
            <VStack key={task.id}>
              <HStack className="items-center gap-3 px-4 py-3">
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pColor, flexShrink: 0, marginTop: 2 }} />
                <VStack className="flex-1 gap-0.5">
                  <Text
                    className="font-semibold text-sm"
                    style={{ color: isDone ? '#94a3b8' : undefined, textDecorationLine: isDone ? 'line-through' : 'none' }}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <HStack className="items-center gap-2">
                    {task.due_date && (
                      <Text className="text-muted-foreground text-[10px]">
                        {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                    {subtasks.length > 0 && (
                      <Text className="text-muted-foreground text-[10px]">{doneCount}/{subtasks.length} sub</Text>
                    )}
                  </HStack>
                </VStack>
                <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: pColor + '18' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: pColor }}>{task.priority}</Text>
                </View>
              </HStack>
              {idx < pending.length - 1 && <View className="h-px bg-border/20 mx-4" />}
            </VStack>
          );
        })}
      </VStack>
    </Card>
  );
}

// ─── Notes Preview ────────────────────────────────────────────────────────────

function NotesPreview({ notes, loading }: { notes: Note[]; loading: boolean }) {
  const recent = notes.slice(0, 3);
  if (loading) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-4">
      <SkeletonText _lines={2} className="h-6 rounded-xl" />
    </Card>
  );
  if (recent.length === 0) return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-5">
      <Text className="text-sm text-muted-foreground text-center">No notes yet.</Text>
    </Card>
  );
  return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none overflow-hidden">
      <VStack className="gap-0">
        {recent.map((note, idx) => (
          <VStack key={note.id}>
            <HStack className="items-center gap-3 px-4 py-3">
              <View className="h-8 w-8 rounded-xl items-center justify-center bg-violet-100 dark:bg-violet-900/30">
                <StickyNote size={14} color="#7c3aed" />
              </View>
              <VStack className="flex-1 gap-0.5">
                <Text className="font-semibold text-foreground text-sm" numberOfLines={1}>
                  {note.title || 'Untitled'}
                </Text>
                <Text className="text-muted-foreground text-[10px]">{relativeTime(note.updated_at)}</Text>
              </VStack>
            </HStack>
            {idx < recent.length - 1 && <View className="h-px bg-border/20 mx-4" />}
          </VStack>
        ))}
      </VStack>
    </Card>
  );
}

// ─── Today's Calendar Strip ───────────────────────────────────────────────────

function TodayStrip() {
  const router = useRouter();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });
  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Pressable onPress={() => router.push('/(app)/calendar' as any)} className="active:opacity-80">
      <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-4">
        <HStack className="justify-between items-center">
          {days.map((d, idx) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <VStack key={idx} className="items-center gap-1.5">
                <Text className="text-[10px] font-semibold text-muted-foreground">{DAY_SHORT[d.getDay()]}</Text>
                <View
                  className="h-9 w-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: isToday ? '#312e81' : 'transparent' }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: isToday ? 'white' : d.getDay() === 0 ? '#f43f5e' : undefined }}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </VStack>
            );
          })}
        </HStack>
      </Card>
    </Pressable>
  );
}

// ─── Stat Chips ───────────────────────────────────────────────────────────────

function StatChips({ tasks, notes, goals, debts }: { tasks: Task[]; notes: Note[]; goals: SavingGoal[]; debts: Debt[] }) {
  const pendingTasks = tasks.filter(t => !['done', 'cancelled'].includes(t.status?.toLowerCase())).length;
  const activeDebts = debts.filter(d => d.status === 'active').length;

  const chips = [
    { label: 'Tasks', value: pendingTasks, icon: <ClipboardList size={13} color="#6366f1" />, color: '#6366f1' },
    { label: 'Notes', value: notes.length, icon: <StickyNote size={13} color="#7c3aed" />, color: '#7c3aed' },
    { label: 'Goals', value: goals.length, icon: <Target size={13} color="#10b981" />, color: '#10b981' },
    { label: 'Debts', value: activeDebts, icon: <CreditCard size={13} color="#f43f5e" />, color: '#f43f5e' },
  ];

  return (
    <HStack className="gap-3">
      {chips.map(c => (
        <Card key={c.label} className="flex-1 rounded-[20px] bg-card border border-border/40 shadow-none p-3 items-center gap-1">
          <View className="h-8 w-8 rounded-full items-center justify-center" style={{ backgroundColor: c.color + '15' }}>
            {c.icon}
          </View>
          <Text className="text-lg font-extrabold text-foreground">{c.value}</Text>
          <Text className="text-[10px] text-muted-foreground font-medium">{c.label}</Text>
        </Card>
      ))}
    </HStack>
  );
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userName, setUserName] = useState('');

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there');

      const [txs, ws, gs, bs, ds, tks, ns] = await Promise.all([
        getTransactions(),
        getWallets(),
        getSavingGoals(),
        getBudgets(),
        getDebts(),
        getTasks(),
        getNotes(),
      ]);
      setTransactions(txs);
      setWallets(ws);
      setGoals(gs);
      setBudgets(bs);
      setDebts(ds);
      setTasks(tks);
      setNotes(ns);
    } catch (err) {
      console.error('[Home] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const router = useRouter();
  const pendingTasks = tasks.filter(t => !['done', 'cancelled'].includes(t.status?.toLowerCase())).length;

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} />}
    >
      {/* Today strip */}
      <TodayStrip />

      {/* Finance hero */}
      <FinanceHero wallets={wallets} transactions={transactions} loading={loading} />

      {/* Stats row */}
      {!loading && <StatChips tasks={tasks} notes={notes} goals={goals} debts={debts} />}

      {/* Recent Transactions */}
      <VStack>
        <SectionHeader
          icon={<BarChart3 size={14} color="#6366f1" />}
          title="Recent Transactions"
          route="/(app)/finance"
          count={transactions.length}
        />
        <RecentTransactions transactions={transactions} loading={loading} />
      </VStack>

      {/* Saving Goals */}
      <VStack>
        <SectionHeader
          icon={<Target size={14} color="#10b981" />}
          title="Saving Goals"
          route="/(app)/finance"
          count={goals.length}
        />
        <GoalsPreview goals={goals} loading={loading} />
      </VStack>

      {/* Tasks */}
      <VStack>
        <SectionHeader
          icon={<ClipboardList size={14} color="#6366f1" />}
          title="Pending Tasks"
          route="/(app)/task"
          count={pendingTasks}
        />
        <TasksPreview tasks={tasks} loading={loading} />
      </VStack>

      {/* Notes */}
      <VStack>
        <SectionHeader
          icon={<StickyNote size={14} color="#7c3aed" />}
          title="Recent Notes"
          route="/(app)/notes"
          count={notes.length}
        />
        <NotesPreview notes={notes} loading={loading} />
      </VStack>

    </ScrollView>
  );
}
