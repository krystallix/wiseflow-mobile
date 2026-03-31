import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
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
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from '@/components/ui/select';
import { Input, InputField } from '@/components/ui/input';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { ChevronDown, Target } from 'lucide-react-native';
import { type Category, type BudgetPeriod, createBudget } from '@/libs/supabase/finance';

const today = () => new Date().toISOString().split('T')[0];

function periodStart(period: BudgetPeriod): string {
  const now = new Date();
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }
  if (period === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  if (period === 'yearly') return `${now.getFullYear()}-01-01`;
  return '2000-01-01';
}

function periodEnd(period: BudgetPeriod): string {
  const now = new Date();
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() + (6 - d.getDay()));
    return d.toISOString().split('T')[0];
  }
  if (period === 'monthly') {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return last.toISOString().split('T')[0];
  }
  if (period === 'yearly') return `${now.getFullYear()}-12-31`;
  return '9999-12-31';
}

function formatNumber(val: string): string {
  if (!val) return '';
  const num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  categories: Category[];
  onSave: () => Promise<void>;
  onClose: () => void;
};

export default function AddBudgetSheet({ bottomSheetRef, categories, onSave, onClose }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleSave = async () => {
    const n = parseFloat(amount.replace(/\D/g, ''));
    if (!categoryId || isNaN(n) || n <= 0) return;
    setLoading(true);
    try {
      await createBudget({
        category_id: categoryId,
        period,
        amount: n,
        period_start: periodStart(period),
        period_end: periodEnd(period),
      });
      setAmount('');
      setCategoryId('');
      setPeriod('monthly');
      await onSave();
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error('[AddBudget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet ref={bottomSheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['75%', '90%']} backdropComponent={BottomSheetBackdrop} keyboardBehavior="interactive" keyboardBlurBehavior="restore">
        <View className="flex-1">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-4 gap-6">
              <VStack className="gap-1">
                <Heading size="md">New Budget</Heading>
                <Text size="xs" className="text-muted-foreground">Set a spending limit for a category and period.</Text>
              </VStack>

              {/* Category */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Category</Text>
                <Select selectedValue={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">
                    <SelectInput placeholder="Select expense category" className="text-sm flex-1"
                      value={expenseCategories.find(c => c.id === categoryId)?.name} />
                    <SelectIcon as={ChevronDown} className="mr-3" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                      {expenseCategories.map(c => (
                        <View key={c.id} className="relative justify-center w-full">
                          <SelectItem label={c.name} value={c.id} className={c.icon ? 'pl-11' : ''} />
                          {c.icon && (
                            <View className="absolute left-3 z-10" pointerEvents="none">
                              <DynamicIcon name={c.icon as any} size={18} color={c.color || '#64748b'} />
                            </View>
                          )}
                        </View>
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </VStack>

              {/* Period */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Period</Text>
                <Select selectedValue={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
                  <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">
                    <SelectInput placeholder="Period" className="text-sm flex-1 capitalize" value={period} />
                    <SelectIcon as={ChevronDown} className="mr-3" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                      {(['weekly', 'monthly', 'yearly', 'lifetime'] as BudgetPeriod[]).map(p => (
                        <SelectItem key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} value={p} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </VStack>

              {/* Amount */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Budget amount</Text>
                <Input className="h-14 rounded-2xl border-border/40 px-4 bg-card">
                  <HStack className="items-center gap-2">
                    <Text className="text-lg font-bold text-muted-foreground">Rp</Text>
                    <InputField
                      placeholder="0"
                      value={formatNumber(amount)}
                      onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      className="text-xl font-bold flex-1"
                    />
                  </HStack>
                </Input>
              </VStack>

              <HStack className="justify-end gap-3 mt-4">
                <Button className="flex-1 rounded-2xl h-12" onPress={handleSave} disabled={loading || !categoryId || !amount}>
                  {loading ? <ButtonSpinner className="text-primary-foreground" /> : <ButtonIcon as={Target} className="text-primary-foreground" />}
                  <ButtonText className="font-bold ml-2">Create Budget</ButtonText>
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
