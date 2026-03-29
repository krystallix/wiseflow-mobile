import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContentWrapper,
  TabsTriggerText,
  TabsIndicator,
} from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown, ArrowUp, Plus, Tag, Wallet, TrendingUp, TrendingDown, ChartLine, Receipt, PiggyBank, CreditCard, Target } from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import OverviewTab from '@/components/finance/overview-tab';
import TransactionsTab from '@/components/finance/transactions-tab';
import BudgetsTab from '@/components/finance/budgets-tab';
import GoalsTab from '@/components/finance/goals-tab';
import DebtsTab from '@/components/finance/debts-tab';
import AddTransactionSheet from '@/components/finance/add-transaction-sheet';
import AddCategorySheet from '@/components/finance/add-category-sheet';
import AddWalletSheet from '@/components/finance/add-wallet-sheet';
import AddBudgetSheet from '@/components/finance/add-budget-sheet';
import AddGoalSheet from '@/components/finance/add-goal-sheet';
import AddDebtSheet from '@/components/finance/add-debt-sheet';
import AddFundSheet from '@/components/finance/add-fund-sheet';
import { type BottomSheetRef } from '@/components/ui/bottomsheet';
import {
  getTransactions,
  getWallets,
  getBudgets,
  getSavingGoals,
  getDebts,
  getCategories,
  createTransaction,
  updateTransaction,
  computeSummary,
  type Transaction,
  type Wallet as WalletType,
  type Budget,
  type SavingGoal,
  type Debt,
  type Category,
  type FinanceSummary,
} from '@/libs/supabase/finance';
import { supabase } from '@/libs/supabase/client';

function formatRupiah(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

export default function Finance() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalBalance: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthNet: 0,
  });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const txSheetRef = useRef<BottomSheetRef>(null);
  const catSheetRef = useRef<BottomSheetRef>(null);
  const walletSheetRef = useRef<BottomSheetRef>(null);
  const budgetSheetRef = useRef<BottomSheetRef>(null);
  const goalSheetRef = useRef<BottomSheetRef>(null);
  const debtSheetRef = useRef<BottomSheetRef>(null);
  const fundSheetRef = useRef<BottomSheetRef>(null);
  const [fundGoal, setFundGoal] = useState<SavingGoal | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [layoutWidth, setLayoutWidth] = useState(Dimensions.get('window').width - 48);
  const tabKeys = ['Overview', 'Transactions', 'Budgets', 'Goals', 'Debts'];

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const index = tabKeys.indexOf(val);
    if (index !== -1 && layoutWidth > 0) {
      scrollViewRef.current?.scrollTo({ x: index * layoutWidth, animated: true });
    }
  };

  const handleScroll = (e: any) => {
    const width = e.nativeEvent.layoutMeasurement.width;
    if (width === 0) return;
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / width);
    if (tabKeys[index] && tabKeys[index] !== activeTab) {
      setActiveTab(tabKeys[index]);
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Finance] Starting fetch...');

      // Fix for "PGRST303 JWT issued at future" and 'lock:sb-supabase-auth-token' timeout.
      // Ensuring session is loaded/refreshed prevents race conditions during concurrent queries.
      await supabase.auth.getSession();

      const results = await Promise.allSettled([
        getTransactions(),
        getWallets(),
        getBudgets(),
        getSavingGoals(),
        getDebts(),
        getCategories(),
      ]);

      const labels = ['transactions', 'wallets', 'budgets', 'goals', 'debts', 'categories'];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          console.log(`[Finance] ✅ ${labels[i]}: ${r.value?.length ?? 0} items`);
        } else {
          console.error(`[Finance] ❌ ${labels[i]} failed:`, r.reason);
        }
      });

      const txRes = results[0].status === 'fulfilled' ? results[0].value : [];
      const walletRes = results[1].status === 'fulfilled' ? results[1].value : [];
      const budgetRes = results[2].status === 'fulfilled' ? results[2].value : [];
      const goalRes = results[3].status === 'fulfilled' ? results[3].value : [];
      const debtRes = results[4].status === 'fulfilled' ? results[4].value : [];
      const catRes = results[5].status === 'fulfilled' ? results[5].value : [];

      setTransactions(txRes as Transaction[]);
      setWallets(walletRes as WalletType[]);
      setBudgets(budgetRes as Budget[]);
      setGoals(goalRes as SavingGoal[]);
      setDebts(debtRes as Debt[]);
      setCategories(catRes as Category[]);
      setSummary(computeSummary(walletRes as WalletType[], txRes as Transaction[]));
      console.log('[Finance] All done!');
    } catch (err) {
      console.error('[Finance] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveTx = async (payload: any) => {
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, payload);
        setEditingTx(null);
      } else {
        await createTransaction(payload);
      }
      await fetchAll();
    } catch (err) {
      console.error('[Finance] Save TX error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <View className='bg-background flex-1 px-6 gap-4'>
      <View className="flex-row items-center gap-2">
        <Button variant='outline' className="rounded-full bg-card border-border/40 h-10 px-4" onPress={() => walletSheetRef.current?.open()}>
          <ButtonIcon as={Wallet} className="text-primary" />
          <ButtonText className="text-primary font-medium ml-1">Add Wallet</ButtonText>
        </Button>
        <Button variant='outline' className="rounded-full bg-card border-border/40 h-10 px-4" onPress={() => catSheetRef.current?.open()}>
          <ButtonIcon as={Tag} className="text-primary" />
          <ButtonText className="text-primary font-medium ml-1">Category</ButtonText>
        </Button>
        <Button
          className="rounded-full h-10 px-4"
          onPress={() => { setEditingTx(null); txSheetRef.current?.open(); }}
        >
          <ButtonIcon as={Plus} className="text-primary-foreground" />
          <ButtonText className="text-primary-foreground font-medium ml-1">Transaction</ButtonText>
        </Button>
      </View>

      {/* Summary Cards */}
      <View className="flex-row gap-4">
        <Card className="flex-1 rounded-3xl p-4 bg-card border-border/40" size="sm">
          <View className="flex-row justify-between items-start">
            <Text className="text-muted-foreground text-sm font-medium">Month Income</Text>
            <View className="h-8 w-8 rounded-full bg-emerald-100 items-center justify-center">
              <TrendingUp size={16} color="#10b981" />
            </View>
          </View>
          {isLoading ? (
            <VStack className="gap-1 mt-2">
              <Skeleton className="h-6 w-28 rounded" isLoaded={false} />
              <Skeleton className="h-3 w-20 rounded mt-1" isLoaded={false} />
            </VStack>
          ) : (
            <VStack className="gap-1 mt-2">
              <Text className="text-xl font-bold text-foreground">{formatRupiah(summary.monthIncome)}</Text>
              <View className="flex-row items-center gap-1">
                <ArrowUp size={12} color="#10b981" />
                <Text className="text-emerald-500 text-xs font-medium">This month</Text>
              </View>
            </VStack>
          )}
        </Card>

        <Card className="flex-1 rounded-3xl p-4 bg-card border-border/40" size="sm">
          <View className="flex-row justify-between items-start">
            <Text className="text-muted-foreground text-sm font-medium">Month Expense</Text>
            <View className="h-8 w-8 rounded-full bg-rose-100 items-center justify-center">
              <TrendingDown size={16} color="#f43f5e" />
            </View>
          </View>
          {isLoading ? (
            <VStack className="gap-1 mt-2">
              <Skeleton className="h-6 w-28 rounded" isLoaded={false} />
              <Skeleton className="h-3 w-20 rounded mt-1" isLoaded={false} />
            </VStack>
          ) : (
            <VStack className="gap-1 mt-2">
              <Text className="text-xl font-bold text-foreground">{formatRupiah(summary.monthExpense)}</Text>
              <View className="flex-row items-center gap-1">
                <ArrowDown size={12} color="#f43f5e" />
                <Text className="text-rose-500 text-xs font-medium">This month</Text>
              </View>
            </VStack>
          )}
        </Card>
      </View>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        variant="underlined"
        style={{ flex: 1, marginTop: 8 }}
      >
        <TabsList>
          <TabsTrigger value="Overview">
            <ChartLine size={16} />
            <TabsTriggerText>Overview</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Transactions">
            <Receipt size={16} />
            <TabsTriggerText>Transaction</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Budgets">
            <Target size={16} />
            <TabsTriggerText>Budgets</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Goals">
            <PiggyBank size={16} />
            <TabsTriggerText>Goals</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Debts">
            <CreditCard size={16} />
            <TabsTriggerText>Debts</TabsTriggerText>
          </TabsTrigger>
          <TabsIndicator />
        </TabsList>

        <View style={{ flex: 1 }} onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            style={{ flex: 1 }}
          >
            <View style={{ width: layoutWidth > 0 ? layoutWidth : '100%', flex: 1 }}>
              <OverviewTab
                transactions={transactions}
                budgets={budgets}
                goals={goals}
                debts={debts}
                categories={categories}
                isLoading={isLoading}
                onAddTx={() => { setEditingTx(null); txSheetRef.current?.open(); }}
                onEditTx={(tx) => { setEditingTx(tx); txSheetRef.current?.open(); }}
                onAddGoal={() => {/* TODO */ }}
              />
            </View>
            <View style={{ width: layoutWidth > 0 ? layoutWidth : '100%', flex: 1 }}>
              <TransactionsTab
                transactions={transactions}
                onRefresh={fetchAll}
                onEditTx={(tx) => { setEditingTx(tx); txSheetRef.current?.open(); }}
              />
            </View>
            <View style={{ width: layoutWidth > 0 ? layoutWidth : '100%', flex: 1 }}>
              <BudgetsTab
                budgets={budgets}
                transactions={transactions}
                onAddBudget={() => budgetSheetRef.current?.open()}
              />
            </View>
            <View style={{ width: layoutWidth > 0 ? layoutWidth : '100%', flex: 1 }}>
              <GoalsTab
                goals={goals}
                onRefresh={fetchAll}
                onAddGoal={() => goalSheetRef.current?.open()}
                onAddFund={(g) => { setFundGoal(g); fundSheetRef.current?.open(); }}
              />
            </View>
            <View style={{ width: layoutWidth > 0 ? layoutWidth : '100%', flex: 1 }}>
              <DebtsTab
                debts={debts}
                onRefresh={fetchAll}
                onAddDebt={() => debtSheetRef.current?.open()}
              />
            </View>
          </ScrollView>
        </View>
      </Tabs>

      <AddTransactionSheet
        bottomSheetRef={txSheetRef}
        wallets={wallets}
        categories={categories}
        editingTx={editingTx}
        onSave={handleSaveTx}
        onClose={() => setEditingTx(null)}
      />
      <AddCategorySheet
        bottomSheetRef={catSheetRef}
        categories={categories}
        onSave={async () => { await fetchAll(); }}
        onClose={() => { }}
      />
      <AddWalletSheet
        bottomSheetRef={walletSheetRef}
        onSave={async () => { await fetchAll(); }}
        onClose={() => { }}
      />
      <AddBudgetSheet
        bottomSheetRef={budgetSheetRef}
        categories={categories}
        onSave={fetchAll}
        onClose={() => {}}
      />
      <AddGoalSheet
        bottomSheetRef={goalSheetRef}
        onSave={fetchAll}
        onClose={() => {}}
      />
      <AddDebtSheet
        bottomSheetRef={debtSheetRef}
        wallets={wallets}
        onSave={fetchAll}
        onClose={() => {}}
      />
      <AddFundSheet
        bottomSheetRef={fundSheetRef}
        goal={fundGoal}
        onSave={fetchAll}
        onClose={() => setFundGoal(null)}
      />
    </View>
  );
}
