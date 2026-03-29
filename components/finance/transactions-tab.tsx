import React from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { deleteTransaction, type Transaction } from '@/libs/supabase/finance';
import { ArrowUpRight, ArrowDownLeft, Trash } from 'lucide-react-native';

function fmt(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

export default function TransactionsTab({
  transactions,
  onRefresh,
  onEditTx,
}: {
  transactions: Transaction[];
  onRefresh: () => Promise<void>;
  onEditTx?: (tx: Transaction) => void;
}) {
  const handleDelete = (tx: Transaction) => {
    Alert.alert('Delete', `Delete this transaction?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTransaction(tx.id);
          await onRefresh();
      }}
    ]);
  };

  return (
    <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {transactions.length === 0 ? (
        <Text className="text-center text-muted-foreground mt-10">No transactions</Text>
      ) : (
        <View className="px-1">
          <Card className="rounded-[32px] p-5 bg-card border border-border/40 shadow-sm relative overflow-hidden">
            <VStack className="gap-2.5">
              {transactions.map(tx => {
                const isExpense = tx.type === 'expense';
                const catName = tx.category?.name ?? 'Uncategorized';
                return (
                  <Pressable key={tx.id} onPress={() => onEditTx?.(tx)}>
                    <HStack className="items-center justify-between py-1">
                      <HStack className="items-center gap-3 flex-1">
                        <View className={`h-10 w-10 rounded-full items-center justify-center ${isExpense ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                          {tx.category?.icon ? (
                            <DynamicIcon name={tx.category.icon} size={18} color={isExpense ? '#f43f5e' : '#10b981'} />
                          ) : isExpense ? <ArrowUpRight size={18} color="#f43f5e" /> : <ArrowDownLeft size={18} color="#10b981" />}
                        </View>
                        <VStack className="flex-1">
                          <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{tx.note || catName}</Text>
                          <HStack className="items-center mt-0.5 flex-wrap gap-1">
                            <View className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30">
                              <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                {catName}
                              </Text>
                            </View>
                            <Text className="text-muted-foreground text-[10px] font-medium">
                              {tx.wallet?.name ?? ''} · {tx.date}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <HStack className="items-center gap-2 pl-2">
                        <Text className={`font-bold text-sm ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {isExpense ? '-' : '+'}{fmt(tx.amount)}
                        </Text>
                        <Pressable onPress={(e) => { e.stopPropagation(); handleDelete(tx); }} className="p-1 -mr-1 rounded-full active:bg-destructive/10">
                          <Trash size={14} color="#ef4444" />
                        </Pressable>
                      </HStack>
                    </HStack>
                  </Pressable>
                )
              })}
            </VStack>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
