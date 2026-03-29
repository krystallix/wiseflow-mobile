import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { type Debt, deleteDebt } from '@/libs/supabase/finance';
import { Plus, Trash, Filter, LayoutGrid, List, Clock, BadgeDollarSign } from 'lucide-react-native';

function fmt(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

export default function DebtsTab({ 
  debts, 
  onRefresh,
  onAddDebt,
}: { 
  debts: Debt[], 
  onRefresh: () => Promise<void>,
  onAddDebt?: () => void,
}) {
  const [filter, setFilter] = useState<'All' | 'I Owe' | 'They Owe Me'>('All');

  const filteredDebts = debts.filter(d => {
    if (filter === 'I Owe') return d.direction === 'payable';
    if (filter === 'They Owe Me') return d.direction === 'receivable';
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete', `Delete record for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDebt(id);
          await onRefresh();
      }}
    ]);
  };

  return (
    <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <HStack className="justify-between items-center px-2 mb-4 mt-2">
        <Text className="text-xl font-extrabold text-foreground">Debts & Loans</Text>
      </HStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-1 mb-6" contentContainerStyle={{ paddingRight: 20 }}>
        <HStack className="gap-3 items-center">
          <View className="flex-row bg-card border border-border/40 rounded-full overflow-hidden h-10 w-[84px] items-center">
            <Pressable className="flex-1 items-center justify-center h-full bg-card border-r border-border/40">
              <LayoutGrid size={18} className="text-foreground" />
            </Pressable>
            <Pressable className="flex-1 items-center justify-center h-full bg-muted/20">
              <List size={18} className="text-muted-foreground" />
            </Pressable>
          </View>
          
          <Button variant="outline" className="rounded-full bg-card border-border/40 h-10 px-4" onPress={onAddDebt}>
            <ButtonIcon as={Plus} className="text-foreground" size="sm" />
            <ButtonText className="text-foreground font-semibold ml-1">Add</ButtonText>
          </Button>

          {['All', 'I Owe', 'They Owe Me'].map(f => (
            <Button 
              key={f}
              variant={filter === f ? 'default' : 'outline'} 
              className={`rounded-full h-10 px-4 ${filter === f ? 'border-primary' : 'bg-card border-border/40'}`}
              onPress={() => setFilter(f as any)}
            >
              {f === 'All' && filter !== 'All' && <ButtonIcon as={Filter} className="text-foreground mr-1.5" size="sm" />}
              <ButtonText className={filter === f ? 'text-primary-foreground font-semibold' : 'text-foreground font-semibold'}>{f}</ButtonText>
            </Button>
          ))}
        </HStack>
      </ScrollView>

      <View className="px-1">
        <Card className="rounded-[32px] p-5 bg-card border border-border/40 shadow-sm relative overflow-hidden">
          <VStack className="gap-5">
            {filteredDebts.map(d => {
              const percent = Math.min((d.paid_amount / d.principal) * 100, 100);
              const isReceivable = d.direction === 'receivable';
              const name = d.contact?.name || 'Unknown';
              const initial = name.charAt(0).toUpperCase();
              const colorClass = isReceivable ? 'text-[#10b981]' : 'text-[#f43f5e]';
              const trackColor = isReceivable ? 'bg-[#10b981]' : 'bg-[#f43f5e]';

              return (
                <VStack key={d.id} className="gap-2.5 pb-4 border-b border-border/20 last:border-0 last:pb-0">
                  <HStack className="justify-between items-center">
                    <HStack className="items-center gap-3">
                      <View className="h-8 w-8 rounded-full bg-[#e2e8f0] dark:bg-slate-800 items-center justify-center">
                        <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{initial}</Text>
                      </View>
                      <VStack>
                        <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{name}</Text>
                        <Text className="text-muted-foreground text-[10px]">{d.description || d.status}</Text>
                      </VStack>
                    </HStack>
                    <HStack className="items-center gap-2">
                      <HStack className="items-center gap-1">
                        <Clock size={12} color="#f59e0b" />
                        {d.due_date && <Text className="text-[10px] font-semibold text-slate-500">{d.due_date}</Text>}
                      </HStack>
                      <Pressable onPress={() => handleDelete(d.id, name)} className="p-1.5 -mr-1 rounded-full active:bg-destructive/10">
                        <Trash size={14} color="#ef4444" />
                      </Pressable>
                    </HStack>
                  </HStack>
                  
                  <Progress value={percent} className="bg-muted h-1.5 rounded-full">
                    <ProgressFilledTrack className={`${trackColor} rounded-full`} />
                  </Progress>
                  
                  <HStack className="justify-between items-center">
                    <HStack className="items-baseline gap-1">
                      <Text className={`font-bold text-[11px] ${colorClass}`}>{fmt(d.paid_amount)}</Text>
                      <Text className="text-muted-foreground text-[10px]">of {fmt(d.principal)}</Text>
                    </HStack>
                    <BadgeDollarSign size={14} color="#6366f1" />
                  </HStack>
                </VStack>
              );
            })}
            {filteredDebts.length === 0 && (
              <Text className="text-center text-muted-foreground mt-4">No records found.</Text>
            )}
          </VStack>
        </Card>
      </View>
    </ScrollView>
  );
}
