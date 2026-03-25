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
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown, ArrowUp, Plus, Tag, Wallet, TrendingUp, TrendingDown, ChartLine, Receipt, PiggyBank, CreditCard, Target } from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import OverviewTab from '@/components/finance/overview-tab';
import AddTransactionSheet from '@/components/finance/add-transaction-sheet';
import { type BottomSheetRef } from '@/components/ui/bottomsheet';
import {
  getTransactions,
  getWallets,
  getBudgets,
  getSavingGoals,
  getDebts,
  getCategories,
  createTransaction,
  computeSummary,
  type Transaction,
  type Wallet as WalletType,
  type Budget,
  type SavingGoal,
  type Debt,
  type Category,
  type FinanceSummary,
} from '@/libs/supabase/finance';

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

  const txSheetRef = useRef<BottomSheetRef>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Finance] Starting fetch...');

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

  const handleCreateTx = async (payload: any) => {
    try {
      await createTransaction(payload);
      await fetchAll();
    } catch (err) {
      console.error('[Finance] Create TX error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <View className='bg-background flex-1 px-6 gap-4'>
      <View className="flex-row items-center gap-2">
        <Button variant='outline' className="rounded-full bg-card border-border/40 h-10 px-4">
          <ButtonIcon as={Wallet} className="text-primary" />
          <ButtonText className="text-primary font-medium ml-1">Add Wallet</ButtonText>
        </Button>
        <Button variant='outline' className="rounded-full bg-card border-border/40 h-10 px-4">
          <ButtonIcon as={Tag} className="text-primary" />
          <ButtonText className="text-primary font-medium ml-1">Category</ButtonText>
        </Button>
        <Button
          className="rounded-full h-10 px-4"
          onPress={() => txSheetRef.current?.open()}
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

      <Tabs defaultValue="Overview" variant="underlined" style={{ flex: 1, marginTop: 8 }}>
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

        <TabsContentWrapper style={{ flex: 1 }}>
          <TabsContent value="Overview" style={{ flex: 1 }}>
            <OverviewTab
              transactions={transactions}
              budgets={budgets}
              goals={goals}
              debts={debts}
              categories={categories}
              isLoading={isLoading}
              onAddTx={() => txSheetRef.current?.open()}
              onAddGoal={() => {/* TODO */ }}
            />
          </TabsContent>
          <TabsContent value="Transactions">
            <Box>
              <Text className="text-foreground">Welcome to the Home tab!</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Budgets">
            <Box>
              <Text className="text-foreground">Your profile information</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Goals">
            <Box>
              <Text className="text-foreground">Welcome to the Home tab!</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Savings">
            <Box>
              <Text className="text-foreground">Settings and preferences</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Debts">
            <Box>
              <Text className="text-foreground">Welcome to the Home tab!</Text>
            </Box>
          </TabsContent>
        </TabsContentWrapper>
      </Tabs>

      <AddTransactionSheet
        bottomSheetRef={txSheetRef}
        wallets={wallets}
        categories={categories}
        onSave={handleCreateTx}
        onClose={() => { }}
      />
    </View>
  );
}
