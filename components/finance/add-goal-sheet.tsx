import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetRef,
} from '@/components/ui/bottomsheet';
import { Button, ButtonText, ButtonIcon, ButtonSpinner } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { PiggyBank } from 'lucide-react-native';
import { createSavingGoal } from '@/libs/supabase/finance';

const COLORS = ['#6366f1', '#d946ef', '#93c5fd', '#10b981', '#f59e0b', '#f43f5e', '#60a5fa', '#a78bfa'];

function formatNumber(val: string): string {
  if (!val) return '';
  const num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export default function AddGoalSheet({ bottomSheetRef, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const n = parseFloat(targetAmount.replace(/\D/g, ''));
    if (!name.trim() || isNaN(n) || n <= 0) return;
    setLoading(true);
    try {
      await createSavingGoal({
        name: name.trim(),
        target_amount: n,
        current_amount: 0,
        deadline: deadline || null,
        color,
        icon: 'PiggyBank',
        note: null,
        wallet_id: null,
        is_achieved: false,
      });
      setName('');
      setTargetAmount('');
      setDeadline('');
      setColor(COLORS[0]);
      await onSave();
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error('[AddGoal] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet ref={bottomSheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['75%']} backdropComponent={BottomSheetBackdrop}>
        <View className="flex-1">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-4 gap-6">
              <VStack className="gap-1">
                <Heading size="md">New Saving Goal</Heading>
                <Text size="xs" className="text-muted-foreground">Set a savings target and track your progress.</Text>
              </VStack>

              {/* Goal name */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Goal name</Text>
                <Input className="rounded-2xl border-border/40 h-12 bg-card">
                  <InputField placeholder="e.g. Vacation Fund" value={name} onChangeText={setName} className="text-sm" />
                </Input>
              </VStack>

              {/* Target amount */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Target amount</Text>
                <Input className="h-14 rounded-2xl border-border/40 px-4 bg-card">
                  <HStack className="items-center gap-2">
                    <Text className="text-lg font-bold text-muted-foreground">Rp</Text>
                    <InputField
                      placeholder="0"
                      value={formatNumber(targetAmount)}
                      onChangeText={(v) => setTargetAmount(v.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      className="text-xl font-bold flex-1"
                    />
                  </HStack>
                </Input>
              </VStack>

              {/* Deadline */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Deadline (optional)</Text>
                <Input className="rounded-2xl border-border/40 h-12 bg-card">
                  <InputField placeholder="YYYY-MM-DD" value={deadline} onChangeText={setDeadline} className="text-sm" />
                </Input>
              </VStack>

              {/* Color Picker */}
              <VStack className="gap-3">
                <Text size="xs" className="font-bold ml-1">Color</Text>
                <HStack className="flex-wrap gap-3">
                  {COLORS.map(c => (
                    <Pressable key={c} onPress={() => setColor(c)}>
                      <View
                        className="h-10 w-10 rounded-full"
                        style={{
                          backgroundColor: c,
                          borderWidth: color === c ? 3 : 0,
                          borderColor: '#1e1b4b',
                          opacity: color === c ? 1 : 0.85,
                        }}
                      />
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              <HStack className="justify-end gap-3 mt-4">
                <Button className="flex-1 rounded-2xl h-12" onPress={handleSave} disabled={loading || !name || !targetAmount}>
                  {loading ? <ButtonSpinner className="text-primary-foreground" /> : <ButtonIcon as={PiggyBank} className="text-primary-foreground" />}
                  <ButtonText className="font-bold ml-2">Create Goal</ButtonText>
                </Button>
              </HStack>
              <View style={{ height: 60 }} />
            </VStack>
          </BottomSheetScrollView>
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
