import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Box } from '@/components/ui/box';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  CreditCard,
  Target,
  Receipt,
  TrendingDown,
  BarChart3,
} from 'lucide-react-native';
import type {
  Transaction,
  Budget,
  SavingGoal,
  Debt,
  Category,
} from '@/libs/supabase/finance';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type OverviewTabProps = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingGoal[];
  debts: Debt[];
  categories: Category[];
  isLoading: boolean;
  onAddTx?: () => void;
  onAddGoal?: () => void;
  onEditTx?: (tx: Transaction) => void;
};

// ─── Sub Components ───────────────────────────────────────────────────────────

function TransactionRow({ tx, onPress }: { tx: Transaction; onPress?: () => void }) {
  const isExpense = tx.type === 'expense';
  const catName = tx.category?.name ?? 'Uncategorized';
  const catColor = tx.category?.color;
  const catIcon = tx.category?.icon;

  return (
    <HStack className="items-center justify-between py-1">
      <HStack className="items-center gap-3 flex-1">
        <View
          className={`h-10 w-10 rounded-full items-center justify-center ${isExpense ? 'bg-rose-50' : 'bg-emerald-50'}`}
        >
          {catIcon ? (
            <DynamicIcon name={catIcon} size={18} color={isExpense ? '#f43f5e' : '#10b981'} />
          ) : isExpense ? (
            <ArrowUpRight size={18} color="#f43f5e" />
          ) : (
            <ArrowDownLeft size={18} color="#10b981" />
          )}
        </View>
        <VStack className="flex-1">
          <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{tx.note || catName}</Text>
          <HStack className="items-center mt-0.5 flex-wrap gap-1">
            <View className={`px-2 py-0.5 rounded-md bg-orange-100`}>
              <Text className={`text-[10px] font-medium text-orange-500`}>
                {catName}
              </Text>
            </View>
            <Text className="text-muted-foreground text-[10px]">
              {tx.wallet?.name ?? ''} · {tx.date}
            </Text>
          </HStack>
        </VStack>
      </HStack>
      <Text className={`font-bold text-sm ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
        {isExpense ? '-' : '+'}{fmt(tx.amount)}
      </Text>
    </HStack>
  );
}

function BudgetProgressRow({ budget, transactions }: { budget: Budget; transactions: Transaction[] }) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const spent = transactions
    .filter(t => t.type === 'expense' && t.category_id === budget.category_id && t.date >= monthStart)
    .reduce((s, t) => s + t.amount, 0);
  const percent = Math.min((spent / budget.amount) * 100, 100);

  return (
    <VStack className="gap-2">
      <HStack className="items-center gap-3">
        <View className="h-8 w-8 rounded-full bg-primary/10 items-center justify-center">
          <DynamicIcon
            name={budget.category?.icon || 'Target'}
            size={14}
            className="text-primary"
            color="#0ea5e9"
            fallback="Target"
          />
        </View>
        <VStack className="flex-1">
          <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
            {budget.category?.name ?? 'Budget'}
          </Text>
          <Text className="text-muted-foreground text-[10px]">{budget.period}</Text>
        </VStack>
        <Text className="text-muted-foreground text-[10px] font-bold">{Math.round(percent)}%</Text>
      </HStack>
      <Progress value={percent} className="bg-muted h-1">
        <ProgressFilledTrack className={percent > 80 ? 'bg-rose-500' : 'bg-emerald-500'} />
      </Progress>
      <HStack className="justify-between">
        <Text className="text-muted-foreground text-[10px] font-medium">{fmt(spent)}</Text>
        <Text className="text-muted-foreground text-[10px] font-medium">{fmt(budget.amount)}</Text>
      </HStack>
    </VStack>
  );
}

function GoalMiniCard({ goal }: { goal: SavingGoal }) {
  const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

  return (
    <VStack className="gap-2">
      <HStack className="justify-between items-center">
        <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{goal.name}</Text>
        <Text className="text-muted-foreground text-[10px] font-bold">{Math.round(percent)}%</Text>
      </HStack>
      <Progress value={percent} className="bg-muted h-1">
        <ProgressFilledTrack className="bg-blue-400" />
      </Progress>
      <Text className="text-muted-foreground text-[10px] font-medium">
        {fmt(goal.current_amount)} / {fmt(goal.target_amount)}
      </Text>
    </VStack>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <VStack className="items-center justify-center py-6 gap-2">
      <View className="text-muted-foreground">{icon}</View>
      <Text className="text-muted-foreground text-xs">{label}</Text>
    </VStack>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OverviewTab({
  transactions = [],
  budgets = [],
  goals = [],
  debts = [],
  categories = [],
  isLoading = true,
  onAddTx,
  onAddGoal,
  onEditTx,
}: OverviewTabProps) {

  // ── Month navigation (same as web) ────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeBarId, setActiveBarId] = useState<string | null>(null);

  const availableMonths = useMemo(
    () => Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort(),
    [transactions]
  );
  const monthIndex = availableMonths.indexOf(selectedMonth);

  const handlePrev = () => { if (monthIndex > 0) setSelectedMonth(availableMonths[monthIndex - 1]); };
  const handleNext = () => { if (monthIndex < availableMonths.length - 1) setSelectedMonth(availableMonths[monthIndex + 1]); };

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return 'No Data';
    const [y, m] = selectedMonth.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const recent = transactions.slice(0, 5);

  // Active debts
  const activeDebts = debts.filter(d => d.status === 'active');
  const payable = activeDebts
    .filter(d => d.direction === 'payable')
    .reduce((s, d) => s + d.principal - d.paid_amount, 0);
  const receivable = activeDebts
    .filter(d => d.direction === 'receivable')
    .reduce((s, d) => s + d.principal - d.paid_amount, 0);

  // Expenses by category chart data (filtered by selectedMonth)
  const chartData = useMemo(() => {
    const filtered = transactions.filter(t => t.date.startsWith(selectedMonth));
    const expenseByCategory = filtered
      .filter(t => t.type === 'expense' && t.category_id)
      .reduce((acc, t) => {
        acc[t.category_id!] = (acc[t.category_id!] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(expenseByCategory)
      .map(([categoryId, amount]) => {
        const cat = categories.find(c => c.id === categoryId);
        return {
          id: categoryId,
          name: cat?.name || 'Unknown',
          amount,
          color: cat?.color || null,
          icon: cat?.icon || 'Tag',
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [transactions, categories, selectedMonth]);

  const maxChartAmount = chartData.length > 0 ? chartData[0].amount : 1;

  // Bar colors cycling
  const BAR_COLORS = ['bg-emerald-500', 'bg-orange-500', 'bg-purple-400', 'bg-rose-400', 'bg-blue-500', 'bg-indigo-400'];

  // ── Skeleton Helpers ──────────────────────────────────────────────────────

  const TxSkeleton = () => (
    <VStack className="gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <HStack key={`skel-tx-${i}`} className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" isLoaded={false} />
            <VStack className="gap-1 flex-1">
              <SkeletonText _lines={1} isLoaded={false} className="h-4 w-3/4 rounded" />
              <SkeletonText _lines={1} isLoaded={false} className="h-3 w-1/2 rounded mt-1" />
            </VStack>
          </HStack>
          <SkeletonText _lines={1} isLoaded={false} className="h-4 w-20 rounded" />
        </HStack>
      ))}
    </VStack>
  );

  const ChartSkeleton = () => (
    <VStack className="gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <HStack key={`skel-ch-${i}`} className="items-center gap-3">
          <Skeleton className="h-5 w-10 rounded" isLoaded={false} />
          <Skeleton className="h-4 rounded flex-1" style={{ width: `${100 - i * 15}%` }} isLoaded={false} />
        </HStack>
      ))}
    </VStack>
  );

  const BudgetSkeleton = () => (
    <VStack className="gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <VStack key={`skel-b-${i}`} className="gap-2">
          <HStack className="items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" isLoaded={false} />
            <VStack className="gap-1 flex-1">
              <SkeletonText _lines={1} isLoaded={false} className="h-4 w-24 rounded" />
              <SkeletonText _lines={1} isLoaded={false} className="h-3 w-16 rounded" />
            </VStack>
          </HStack>
          <Skeleton className="h-2 w-full rounded-full" isLoaded={false} />
        </VStack>
      ))}
    </VStack>
  );

  const DebtSkeleton = () => (
    <VStack className="gap-4 py-2">
      <HStack className="justify-between items-center">
        <SkeletonText _lines={1} isLoaded={false} className="h-4 w-24 rounded" />
        <SkeletonText _lines={1} isLoaded={false} className="h-4 w-20 rounded" />
      </HStack>
      <HStack className="justify-between items-center">
        <SkeletonText _lines={1} isLoaded={false} className="h-4 w-24 rounded" />
        <SkeletonText _lines={1} isLoaded={false} className="h-4 w-24 rounded" />
      </HStack>
    </VStack>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <VStack className="gap-4">

        {/* ─── Recent Transactions ──────────────────────────────────────── */}
        <Card className="rounded-3xl p-4 bg-card border-border/40">
          <HStack className="justify-between items-center">
            <VStack>
              <Text className="font-bold text-foreground text-base">Recent Transactions</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">{transactions.length} total</Text>
            </VStack>
            <Button size="sm" variant="outline" className="h-8 rounded-full border-border/40 px-3 bg-secondary/20" onPress={onAddTx}>
              <ButtonIcon as={Plus} size="sm" className="text-foreground" />
              <ButtonText className="text-foreground text-xs ml-1">Add</ButtonText>
            </Button>
          </HStack>

          {isLoading ? (
            <TxSkeleton />
          ) : recent.length === 0 ? (
            <EmptyState icon={<Receipt size={28} className="text-muted-foreground" />} label="No transactions yet" />
          ) : (
            <VStack className="gap-2">
              {recent.map(tx => (
                <TransactionRow key={tx.id} tx={tx} onPress={onEditTx ? () => onEditTx(tx) : undefined} />
              ))}
            </VStack>
          )}
        </Card>

        {/* ─── Expenses by Category ─────────────────────────────────────── */}
        <Card className="rounded-3xl p-4 bg-card border-border/40">
          <HStack className="justify-between items-center">
            <Text className="font-bold text-foreground text-base">Expenses by Category</Text>
            <HStack className="items-center">
              <Button variant="link" size="sm" className="p-1" onPress={handlePrev} disabled={monthIndex <= 0}>
                <ChevronLeft size={16} className="text-muted-foreground" />
              </Button>
              <Text className="text-[10px] font-bold text-foreground mx-1 min-w-[80px] text-center">{monthLabel}</Text>
              <Button variant="link" size="sm" className="p-1" onPress={handleNext} disabled={monthIndex === -1 || monthIndex >= availableMonths.length - 1}>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Button>
            </HStack>
          </HStack>

          {isLoading ? (
            <ChartSkeleton />
          ) : chartData.length === 0 ? (
            <EmptyState icon={<BarChart3 size={28} className="text-muted-foreground" />} label="No expenses for this month" />
          ) : (
            <VStack className="gap-3">
              {chartData.map((cat, idx) => {
                const barPercent = (cat.amount / maxChartAmount) * 100;
                const barColor = BAR_COLORS[idx % BAR_COLORS.length];
                const isActive = activeBarId === cat.id;

                return (
                  <View key={cat.id} className="gap-1">
                    <Pressable
                      onPress={() => setActiveBarId(isActive ? null : cat.id)}
                      className="flex-row items-center gap-3"
                    >
                      <View className="w-10 items-center justify-center">
                        <DynamicIcon
                          name={cat.icon}
                          size={18}
                          className="text-muted-foreground"
                          color={cat.color || "#64748b"}
                        />
                      </View>
                      <View className="flex-1">
                        <View
                          className={`h-5 rounded-r-md ${barColor} ${isActive ? 'opacity-80' : 'opacity-100'}`}
                          style={{ width: `${barPercent}%` }}
                        />
                      </View>
                    </Pressable>

                    {isActive && (
                      <View className="bg-card border border-border/40 p-2 rounded-xl self-start ml-12 shadow-sm">
                        <Text className="text-[10px] font-bold text-foreground">
                          {cat.name} : <Text className="text-primary">{fmt(cat.amount)}</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </VStack>
          )}
        </Card>

        {/* ─── Budget Overview ──────────────────────────────────────────── */}
        <Card className="rounded-3xl p-4 bg-card border-border/40">
          <Text className="font-bold text-foreground text-base">Budget Overview</Text>
          {isLoading ? (
            <BudgetSkeleton />
          ) : budgets.length === 0 ? (
            <EmptyState icon={<Target size={28} className="text-muted-foreground" />} label="No budgets set" />
          ) : (
            <VStack className="gap-5">
              {budgets.slice(0, 4).map(b => (
                <BudgetProgressRow key={b.id} budget={b} transactions={transactions} />
              ))}
            </VStack>
          )}
        </Card>

        {/* ─── Saving Goals ────────────────────────────────────────────── */}
        <Card className="rounded-3xl p-4 bg-card border-border/40">
          <HStack className="justify-between items-center">
            <HStack className="items-center gap-2">
              <View className="h-7 w-7 rounded-lg bg-primary/10 items-center justify-center">
                <PiggyBank size={14} className="text-primary" />
              </View>
              <Text className="font-bold text-foreground text-base">Saving Goals</Text>
            </HStack>
            <Button size="sm" variant="link" className="p-0" onPress={onAddGoal}>
              <Plus size={16} className="text-foreground" />
            </Button>
          </HStack>

          {isLoading ? (
            <VStack className="gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <VStack key={`skel-g-${i}`} className="gap-2">
                  <SkeletonText _lines={1} isLoaded={false} className="h-4 w-28 rounded" />
                  <Skeleton className="h-2 w-full rounded-full" isLoaded={false} />
                  <SkeletonText _lines={1} isLoaded={false} className="h-3 w-32 rounded" />
                </VStack>
              ))}
            </VStack>
          ) : goals.length === 0 ? (
            <EmptyState icon={<PiggyBank size={28} className="text-muted-foreground" />} label="No goals yet" />
          ) : (
            <VStack className="gap-4">
              {goals.slice(0, 3).map(g => (
                <GoalMiniCard key={g.id} goal={g} />
              ))}
            </VStack>
          )}
        </Card>

        {/* ─── Debt Summary ────────────────────────────────────────────── */}
        <Card className="rounded-3xl p-4 bg-card border-border/40">
          <HStack className="items-center gap-2">
            <View className="h-7 w-7 rounded-lg bg-primary/10 items-center justify-center">
              <CreditCard size={14} className="text-primary" />
            </View>
            <Text className="font-bold text-foreground text-base">Debt Summary</Text>
          </HStack>

          {isLoading ? (
            <DebtSkeleton />
          ) : (
            <VStack className="gap-3">
              <HStack className="justify-between items-center">
                <HStack className="items-center gap-2">
                  <ArrowUpRight size={14} color="#f43f5e" />
                  <Text className="text-xs font-medium text-muted-foreground">You owe</Text>
                </HStack>
                <Text className="text-sm font-bold text-rose-500">{fmt(payable)}</Text>
              </HStack>
              <HStack className="justify-between items-center">
                <HStack className="items-center gap-2">
                  <ArrowDownLeft size={14} color="#10b981" />
                  <Text className="text-xs font-medium text-muted-foreground">Owed to you</Text>
                </HStack>
                <Text className="text-sm font-bold text-emerald-500">{fmt(receivable)}</Text>
              </HStack>
            </VStack>
          )}
        </Card>

      </VStack>
    </ScrollView>
  );
}
