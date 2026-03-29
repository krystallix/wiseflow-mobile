import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { type Budget, type Transaction } from '@/libs/supabase/finance';
import { Plus } from 'lucide-react-native';

function fmt(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

export default function BudgetsTab({ 
  budgets, 
  transactions,
  onAddBudget,
}: { 
  budgets: Budget[], 
  transactions: Transaction[],
  onAddBudget?: () => void,
}) {
  return (
    <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <HStack className="justify-between items-center px-2 mb-6 mt-2">
        <Text className="text-xl font-extrabold text-foreground">Budgets</Text>
        <Button className="rounded-full bg-[#312e81] h-10 px-4" onPress={onAddBudget}>
          <ButtonIcon as={Plus} color="white" size="sm" />
          <ButtonText className="text-white font-medium ml-1">New Budget</ButtonText>
        </Button>
      </HStack>

      <View className="px-1">
        <Card className="rounded-[32px] p-5 bg-card border border-border/40 shadow-sm relative overflow-hidden">
          <VStack className="gap-5">
            {budgets.map(b => {
              let spent = 0;
              if (b.period === 'lifetime') {
                spent = transactions.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((sum, t) => sum + t.amount, 0);
              } else {
                const now = new Date();
                const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                spent = transactions.filter(t => t.type === 'expense' && t.category_id === b.category_id && t.date >= monthStart).reduce((sum, t) => sum + t.amount, 0);
              }
              const percent = Math.min((spent / b.amount) * 100, 100);

              return (
                <VStack key={b.id} className="gap-2">
                  <HStack className="items-center gap-3">
                    <View className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/30 items-center justify-center">
                      <DynamicIcon name={b.category?.icon || 'Target'} size={14} color={b.category?.color || '#f43f5e'} />
                    </View>
                    <VStack className="flex-1">
                      <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{b.category?.name}</Text>
                      <Text className="text-muted-foreground text-[10px] capitalize">{b.period}</Text>
                    </VStack>
                    <Text className="text-muted-foreground text-[10px] font-bold">{Math.round(percent)}%</Text>
                  </HStack>
                  
                  <Progress value={percent} className="bg-muted h-1.5 rounded-full">
                    <ProgressFilledTrack className="bg-[#10b981] rounded-full" />
                  </Progress>
                  
                  <HStack className="justify-between">
                    <Text className="text-muted-foreground text-[10px] font-medium">{fmt(spent)}</Text>
                    <Text className="text-muted-foreground text-[10px] font-medium">{fmt(b.amount)}</Text>
                  </HStack>
                </VStack>
              );
            })}
            {budgets.length === 0 && (
              <Text className="text-center text-muted-foreground mt-4">No budgets added.</Text>
            )}
          </VStack>
        </Card>
      </View>
    </ScrollView>
  );
}
