import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetRef,
} from '@/components/ui/bottomsheet';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { type SavingGoal, updateSavingGoal } from '@/libs/supabase/finance';

function fmt(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID').replace(/,/g, '.');
}

function formatNumber(val: string): string {
  if (!val) return '';
  const num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  goal: SavingGoal | null;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export default function AddFundSheet({ bottomSheetRef, goal, onSave, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset input whenever a different goal is selected
  useEffect(() => {
    setAmount('');
  }, [goal?.id]);

  const handleAdd = async () => {
    if (!goal) return;
    const n = parseFloat(amount.replace(/\D/g, ''));
    if (isNaN(n) || n <= 0) return;
    setLoading(true);
    try {
      const newAmount = goal.current_amount + n;
      await updateSavingGoal(goal.id, {
        current_amount: newAmount,
        is_achieved: newAmount >= goal.target_amount,
      });
      setAmount('');
      await onSave();
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error('[AddFund] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Always render the BottomSheet so the ref stays attached.
  // When goal is null, show a minimal placeholder inside.
  const percent = goal ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const needs = goal ? Math.max(goal.target_amount - goal.current_amount, 0) : 0;

  return (
    <BottomSheet ref={bottomSheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['65%', '85%']} backdropComponent={BottomSheetBackdrop} keyboardBehavior="interactive" keyboardBlurBehavior="restore">
        <View className="flex-1">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-4 gap-6">
              {!goal ? (
                <Text className="text-center text-muted-foreground mt-8">No goal selected.</Text>
              ) : (
                <>
                  {/* Goal header */}
                  <HStack className="items-center gap-4">
                    <View className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                      <DynamicIcon name={(goal.icon as any) || 'Target'} size={22} color={goal.color || '#6366f1'} />
                    </View>
                    <VStack>
                      <Heading size="md">{goal.name}</Heading>
                      <Text size="xs" className="text-muted-foreground">Due {goal.deadline || 'No date'}</Text>
                    </VStack>
                  </HStack>

                  {/* Progress */}
                  <VStack className="gap-2">
                    <HStack className="justify-between">
                      <Text className="text-sm font-bold text-muted-foreground">Progress</Text>
                      <Text className="text-sm font-extrabold text-foreground">{percent.toFixed(1)}%</Text>
                    </HStack>
                    <Progress value={percent} className="h-2.5 bg-muted rounded-full">
                      <ProgressFilledTrack className="bg-[#93c5fd] rounded-full" />
                    </Progress>
                    <HStack className="justify-between">
                      <Text className="text-xs text-muted-foreground">{fmt(goal.current_amount)}</Text>
                      <Text className="text-xs text-muted-foreground">{fmt(goal.target_amount)}</Text>
                    </HStack>
                  </VStack>

                  <Text className="text-sm text-muted-foreground">
                    Still needs <Text className="font-extrabold text-foreground">{fmt(needs)}</Text>
                  </Text>

                  {/* Amount input */}
                  <HStack className="items-center gap-3">
                    <Input className="flex-1 rounded-2xl border-border/40 h-13 px-4 bg-card">
                      <InputField
                        placeholder="Amount"
                        value={formatNumber(amount)}
                        onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
                        keyboardType="numeric"
                        className="text-sm"
                      />
                    </Input>
                    <Button className="rounded-full h-13 px-6" onPress={handleAdd} disabled={loading || !amount}>
                      {loading ? <ButtonSpinner className="text-primary-foreground" /> : <ButtonText className="font-bold">Add</ButtonText>}
                    </Button>
                  </HStack>
                </>
              )}
              <View style={{ height: 60 }} />
            </VStack>
          </BottomSheetScrollView>
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
