import React, { useState } from 'react';
import { View, Pressable, Keyboard } from 'react-native';
import {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetRef,
} from '@/components/ui/bottomsheet';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
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
import { X, ChevronDown, Wallet as WalletIcon } from 'lucide-react-native';
import { createWallet } from '@/libs/supabase/finance';

const COLORS = [
  '#6366f1', // Indigo
  '#e879f9', // Fuchsia
  '#7dd3fc', // Light Blue
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f87171', // Red
  '#3b82f6', // Blue
  '#a78bfa'  // Purple
];

const WALLET_TYPES = ['cash', 'bank', 'e-wallet', 'investment', 'credit-card', 'other'];

function formatNumber(val: string): string {
  if (!val) return '';
  const num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

export type AddWalletSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export default function AddWalletSheet({
  bottomSheetRef,
  onSave,
  onClose,
}: AddWalletSheetProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setType('cash');
    setBalance('');
    setSelectedColor(COLORS[0]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const parsedBalance = parseInt(balance.replace(/\D/g, ''), 10);

      await createWallet({
        name: name.trim(),
        type,
        balance: isNaN(parsedBalance) ? 0 : parsedBalance,
        currency: 'IDR',
        color: selectedColor,
        icon: 'wallet', // Default icon for wallets
        is_default: false, // Make user set default later or default to false
        note: null,
      });

      resetForm();
      bottomSheetRef.current?.close();
      await onSave();
    } catch (err) {
      console.error('[AddWallet] Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet ref={bottomSheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['75%']} backdropComponent={BottomSheetBackdrop}>
        <View className="flex-1 pb-safe">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-5 gap-6">

              {/* Header */}
              <View className="relative">
                <VStack className="gap-1 mt-2">
                  <Heading size="xl" className="text-foreground">Add Wallet</Heading>
                  <Text size="sm" className="text-muted-foreground">
                    Add a new wallet to track your money.
                  </Text>
                </VStack>
                <Pressable
                  className="absolute right-0 top-0 p-2 border border-transparent"
                  onPress={handleClose}
                >
                  <X size={24} className="text-muted-foreground" />
                </Pressable>
              </View>

              {/* Name Input */}
              <VStack className="gap-2">
                <Text size="sm" className="font-bold ml-1 text-foreground">Wallet name</Text>
                <Input
                  className={`h-12 border-border/40 px-4 bg-muted/20 ${name ? 'border-indigo-500 rounded-2xl border-2' : 'rounded-2xl'}`}
                >
                  <InputField
                    placeholder="e.g. BCA Savings"
                    value={name}
                    onChangeText={setName}
                    className="text-base text-foreground"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </Input>
              </VStack>

              {/* Type Select */}
              <VStack className="gap-2 z-10">
                <Text size="sm" className="font-bold ml-1 text-foreground">Type</Text>
                <Select selectedValue={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-[24px] border border-border/30 h-10 bg-muted/10 px-4 w-[140px]">
                    <SelectInput className="text-sm flex-1 text-foreground capitalize" value={type} />
                    <SelectIcon as={ChevronDown} className="mr-0 text-muted-foreground" size="sm" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {WALLET_TYPES.map(t => (
                        <SelectItem key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} value={t} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </VStack>

              {/* Initial Balance Input */}
              <VStack className="gap-2">
                <Text size="sm" className="font-bold ml-1 text-foreground">Initial Balance</Text>
                <Input className="h-14 rounded-3xl border border-border/30 px-4 bg-muted/10">
                  <HStack className="items-center gap-4 flex-1">
                    <Text className="text-lg font-bold text-muted-foreground/60 border-r border-border/40 pr-3">Rp</Text>
                    <InputField
                      placeholder="0"
                      value={formatNumber(balance)}
                      onChangeText={(val) => setBalance(val.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      className="text-xl font-bold flex-1 text-foreground"
                    />
                  </HStack>
                </Input>
              </VStack>

              {/* Colors */}
              <VStack className="gap-2 mt-2">
                <Text size="sm" className="font-bold ml-1 text-foreground">Color</Text>
                <HStack className="gap-3 px-1 flex-wrap">
                  {COLORS.map((hex) => (
                    <Pressable
                      key={hex}
                      onPress={() => setSelectedColor(hex)}
                      className={`h-12 w-12 rounded-full items-center justify-center ${selectedColor === hex ? 'border-2 border-slate-900 dark:border-slate-100' : ''
                        }`}
                    >
                      <View className="h-10 w-10 rounded-full" style={{ backgroundColor: hex }} />
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              {/* Action Buttons */}
              <HStack className="gap-4 justify-end mt-4 items-center">
                <Button
                  className="rounded-2xl px-5 h-12 bg-[#8b6bba] disabled:opacity-50"
                  onPress={handleCreate}
                  disabled={loading || !name.trim()}
                >
                  {loading ? (
                    <ButtonSpinner color="white" />
                  ) : (
                    <>
                      <ButtonIcon as={WalletIcon} color="white" size="sm" />
                      <ButtonText className="font-bold text-white ml-2">Create Wallet</ButtonText>
                    </>
                  )}
                </Button>
              </HStack>

              <View style={{ height: 40 }} />
            </VStack>
          </BottomSheetScrollView>
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
