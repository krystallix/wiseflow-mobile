import React from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { type SavingGoal, deleteSavingGoal } from '@/libs/supabase/finance';
import { Plus, Trash } from 'lucide-react-native';

function fmt(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

export default function GoalsTab({
  goals,
  onRefresh,
  onAddGoal,
  onAddFund,
}: {
  goals: SavingGoal[],
  onRefresh: () => Promise<void>,
  onAddGoal?: () => void,
  onAddFund?: (g: SavingGoal) => void,
}) {
  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete', `Delete goal "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSavingGoal(id);
          await onRefresh();
        }
      }
    ]);
  };

  return (
    <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <HStack className="justify-between items-center px-2 mb-6 mt-2">
        <Text className="text-xl font-extrabold text-foreground">Saving Goals</Text>
        <Button className="rounded-full bg-[#312e81] h-10 px-4" onPress={onAddGoal}>
          <ButtonIcon as={Plus} color="white" size="sm" />
          <ButtonText className="text-white font-medium ml-1">New Goal</ButtonText>
        </Button>
      </HStack>

      <View className="px-1">
        <Card className="rounded-[32px] p-5 bg-card border border-border/40 shadow-sm relative overflow-hidden">
          <VStack className="gap-5">
            {goals.map(g => {
              const percent = Math.min((g.current_amount / g.target_amount) * 100, 100);

              return (
                <VStack key={g.id} className="gap-3 pb-4 border-b border-border/20 last:border-0 last:pb-0">
                  <HStack className="justify-between items-center">
                    <HStack className="items-center gap-3 flex-1">
                      <View className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                        <DynamicIcon name={g.icon || 'Target'} size={14} color={g.color || '#334155'} />
                      </View>
                      <VStack className="flex-1">
                        <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{g.name}</Text>
                        <Text className="text-muted-foreground text-[10px]">Due {g.deadline || 'No date'}</Text>
                      </VStack>
                    </HStack>
                    <HStack className="items-center gap-3">
                      <Text className="text-muted-foreground text-[10px] font-bold">{Math.round(percent)}%</Text>
                      <Pressable onPress={() => handleDelete(g.id, g.name)} className="p-1.5 -mr-1 rounded-full active:bg-destructive/10">
                        <Trash size={14} color="#ef4444" />
                      </Pressable>
                    </HStack>
                  </HStack>

                  <Progress value={percent} className="bg-muted h-1.5 rounded-full">
                    <ProgressFilledTrack className="bg-[#93c5fd] rounded-full" />
                  </Progress>

                  <HStack className="justify-between items-center">
                    <Text className="text-muted-foreground text-[10px] font-medium">{fmt(g.current_amount)} / {fmt(g.target_amount)}</Text>
                    <Button variant="link" size="sm" className="h-6 px-0 shrink-0" onPress={() => onAddFund?.(g)}>
                      <ButtonIcon as={Plus} className="text-primary" size="sm" />
                      <ButtonText className="text-primary text-[10px] font-bold ml-1">Add Funds</ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              );
            })}
            {goals.length === 0 && (
              <Text className="text-center text-muted-foreground mt-4">No saving goals added.</Text>
            )}
          </VStack>
        </Card>
      </View>
    </ScrollView>
  );
}
