import React, { useState, useEffect } from 'react';
import { View, Keyboard, Platform } from 'react-native';
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
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  Plus
} from 'lucide-react-native';
import {
  type Wallet,
  type Category,
  type TransactionType,
  type Transaction,
} from '@/libs/supabase/finance';

const today = () => new Date().toISOString().split('T')[0];

function formatNumber(val: string): string {
  if (!val) return '';
  const num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

type AddTransactionSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  wallets: Wallet[];
  categories: Category[];
  editingTx?: Transaction | null;
  onSave: (payload: any) => Promise<void>;
  onClose: () => void;
};

export default function AddTransactionSheet({
  bottomSheetRef,
  wallets,
  categories,
  editingTx,
  onSave,
  onClose,
}: AddTransactionSheetProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [walletId, setWalletId] = useState(() => {
    const def = wallets.find(w => w.is_default) || wallets[0];
    return def?.id || '';
  });
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());
  const [transferTo, setTransferTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setWalletId(editingTx.wallet_id);
      setCategoryId(editingTx.category_id || '');
      setAmount(String(editingTx.amount));
      setNote(editingTx.note || '');
      setDate(editingTx.date || today());
      setTransferTo(editingTx.transfer_to_wallet_id || '');
    } else {
      setType('expense');
      setAmount('');
      setNote('');
      setDate(today());
      setCategoryId('');
      setTransferTo('');
      
      if (wallets.length > 0) {
        const def = wallets.find(w => w.is_default) || wallets[0];
        setWalletId(def.id);
      }
    }
  }, [editingTx, wallets]);

  const filteredCats = categories.filter(c => c.type === type || type === 'transfer');

  const handleSave = async () => {
    const n = parseFloat(amount.replace(/\D/g, ''));
    if (!walletId) return;
    if (isNaN(n) || n <= 0) return;
    if (type === 'transfer' && !transferTo) return;

    setLoading(true);
    try {
      await onSave({
        wallet_id: walletId,
        category_id: categoryId || null,
        type,
        amount: n,
        note: note || null,
        date,
        transfer_to_wallet_id: type === 'transfer' ? transferTo : null,
        debt_id: null,
      });
      // Reset
      setAmount('');
      setNote('');
      setCategoryId('');
      setTransferTo('');
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error('[AddTransaction] Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet ref={bottomSheetRef} onClose={onClose}>
      <BottomSheetPortal
        snapPoints={['90%', '95%']}
        backdropComponent={BottomSheetBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <View className="flex-1">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-4 gap-6">
              <VStack className="gap-1">
                <Heading size="md">{editingTx ? 'Edit Transaction' : 'New Transaction'}</Heading>
                <Text size="xs" className="text-muted-foreground">
                  {editingTx ? 'Update your financial record.' : 'Record an income, expense, or transfer.'}
                </Text>
              </VStack>

              {/* Type Switcher */}
              <HStack className="bg-muted p-1 rounded-2xl gap-1">
                {(['income', 'expense', 'transfer'] as const).map((t) => (
                  <Button
                    key={t}
                    variant="link"
                    className={`flex-1 h-10 rounded-xl ${type === t ? 'bg-card shadow-sm' : ''}`}
                    onPress={() => setType(t)}
                  >
                    <HStack className="items-center gap-2">
                      {t === 'income' && <ArrowDownLeft size={16} color={type === t ? '#10b981' : '#64748b'} />}
                      {t === 'expense' && <ArrowUpRight size={16} color={type === t ? '#f43f5e' : '#64748b'} />}
                      {t === 'transfer' && <ArrowLeftRight size={16} color={type === t ? '#6366f1' : '#64748b'} />}
                      <ButtonText
                        className={`text-xs font-bold capitalize ${type === t ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {t}
                      </ButtonText>
                    </HStack>
                  </Button>
                ))}
              </HStack>

              {/* Amount Input */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Amount</Text>
                <Input className="h-16 rounded-2xl border-border/40 px-4 bg-card">
                  <HStack className="items-center gap-2">
                    <Text className="text-xl font-bold text-muted-foreground">Rp</Text>
                    <InputField
                      placeholder="0"
                      value={formatNumber(amount)}
                      onChangeText={(val) => setAmount(val.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      className="text-2xl font-bold flex-1"
                    />
                  </HStack>
                </Input>
              </VStack>

              {/* Note Input */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Note</Text>
                <Input className="rounded-2xl border-border/40 px-4 h-12 bg-card">
                  <InputField
                    placeholder="e.g. Lunch at warung"
                    value={note}
                    onChangeText={setNote}
                    className="text-sm"
                  />
                </Input>
              </VStack>

              {/* Wallet Select */}
              <HStack className="gap-4">
                <VStack className="flex-1 gap-2">
                  <Text size="xs" className="font-bold ml-1">{type === 'transfer' ? 'From' : 'Wallet'}</Text>
                  <Select selectedValue={walletId} onValueChange={setWalletId}>
                    <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">
                      <SelectInput
                        placeholder="Select wallet"
                        className="text-sm flex-1"
                        value={wallets.find(w => w.id === walletId)?.name}
                      />
                      <SelectIcon as={ChevronDown} className="mr-3" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {wallets.map(w => (
                          <SelectItem key={w.id} label={w.name} value={w.id} />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>

                {type === 'transfer' && (
                  <VStack className="flex-1 gap-2">
                    <Text size="xs" className="font-bold ml-1">To</Text>
                    <Select selectedValue={transferTo} onValueChange={setTransferTo}>
                      <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">
                        <SelectInput
                          placeholder="Select wallet"
                          className="text-sm flex-1"
                          value={wallets.find(w => w.id === transferTo)?.name}
                        />
                        <SelectIcon as={ChevronDown} className="mr-3" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          {wallets.filter(w => w.id !== walletId).map(w => (
                            <SelectItem key={w.id} label={w.name} value={w.id} />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  </VStack>
                )}
              </HStack>

              {/* Category Select */}
              {type !== 'transfer' && (
                <VStack className="gap-2">
                  <Text size="xs" className="font-bold ml-1">Category</Text>
                  <Select selectedValue={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">

                      <SelectInput
                        placeholder="Select category"
                        className="text-sm flex-1"
                        value={categories.find(c => c.id === categoryId)?.name}
                      />
                      <SelectIcon as={ChevronDown} className="mr-3" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {filteredCats.map(c => (
                          <View key={c.id} className="relative justify-center w-full">
                            <SelectItem
                              label={c.name}
                              value={c.id}
                              className={c.icon ? "pl-11" : ""}
                            />
                            {c.icon && (
                              <View className="absolute left-3 z-10" pointerEvents="none">
                                <DynamicIcon
                                  name={c.icon as any}
                                  size={18}
                                  color={c.color || '#64748b'}
                                />
                              </View>
                            )}
                          </View>
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>
              )}

              {/* Date Input */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Date</Text>
                <Input className="rounded-2xl border-border/40 px-4 h-12 bg-card">
                  <InputField
                    placeholder="YYYY-MM-DD"
                    value={date}
                    onChangeText={setDate}
                    className="text-sm"
                  />
                </Input>
              </VStack>

              <Button
                size="lg"
                className="rounded-2xl h-14 mt-4"
                onPress={handleSave}
                disabled={loading || !amount}
              >
                {loading ? (
                  <ButtonSpinner className="text-primary-foreground" />
                ) : (
                  <ButtonIcon as={Plus} className="text-primary-foreground" />
                )}
                <ButtonText className="font-bold ml-2">{editingTx ? 'Update Transaction' : 'Save Transaction'}</ButtonText>
              </Button>

              <View style={{ height: 100 }} />
            </VStack>
          </BottomSheetScrollView>
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
