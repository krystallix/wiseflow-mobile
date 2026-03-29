import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { ChevronDown, CreditCard, Landmark, Handshake, UserPlus, Users } from 'lucide-react-native';
import {
  type Wallet,
  type Contact,
  type DebtDirection,
  createDebt,
  createContact,
  getContacts,
} from '@/libs/supabase/finance';

function formatNumber(val: string): string {
  if (!val) return '';
  const num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  wallets: Wallet[];
  onSave: () => Promise<void>;
  onClose: () => void;
};

export default function AddDebtSheet({ bottomSheetRef, wallets, onSave, onClose }: Props) {
  const [direction, setDirection] = useState<DebtDirection>('payable');
  const [note, setNote] = useState('');

  // Contact mode: 'new' = show name/phone inputs, 'existing' = show select
  const [contactMode, setContactMode] = useState<'new' | 'existing'>('new');
  const [contactId, setContactId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [installments, setInstallments] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getContacts().then(setContacts).catch(console.error);
    const def = wallets.find(w => w.is_default) || wallets[0];
    if (def) setWalletId(def.id);
  }, [wallets]);

  const isValid = () => {
    const n = parseFloat(amount.replace(/\D/g, ''));
    if (isNaN(n) || n <= 0) return false;
    if (contactMode === 'new') return newContactName.trim().length > 0;
    return !!contactId;
  };

  const handleSave = async () => {
    if (!isValid()) return;
    setLoading(true);
    try {
      let resolvedContactId = contactId;

      if (contactMode === 'new') {
        const created = await createContact({
          name: newContactName.trim(),
          phone: newContactPhone.trim() || null,
          email: null,
          note: null,
          avatar_url: null,
        });
        resolvedContactId = created.id;
      }

      const n = parseFloat(amount.replace(/\D/g, ''));
      await createDebt({
        contact_id: resolvedContactId,
        wallet_id: walletId || null,
        direction,
        principal: n,
        due_date: dueDate || null,
        description: note || null,
        installment_months: installments ? 12 : null,
        checked_months: null,
      });

      // Reset
      setNote('');
      setContactId('');
      setNewContactName('');
      setNewContactPhone('');
      setAmount('');
      setDueDate('');
      setInstallments(false);
      setContactMode('new');
      await onSave();
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error('[AddDebt] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setContactMode(prev => prev === 'new' ? 'existing' : 'new');
    setContactId('');
    setNewContactName('');
    setNewContactPhone('');
  };

  return (
    <BottomSheet ref={bottomSheetRef} onClose={onClose}>
      <BottomSheetPortal snapPoints={['90%']} backdropComponent={BottomSheetBackdrop}>
        <View className="flex-1">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-4 gap-6">
              <VStack className="gap-1">
                <Heading size="md">Add Debt / Loan</Heading>
                <Text size="xs" className="text-muted-foreground">Record money you owe or are owed by someone.</Text>
              </VStack>

              {/* Direction Toggle */}
              <HStack className="bg-muted p-1 rounded-2xl gap-1">
                {([['payable', 'I Owe', Landmark], ['receivable', 'They Owe Me', Handshake]] as const).map(([val, label, Icon]) => (
                  <Button
                    key={val}
                    variant="link"
                    className={`flex-1 h-11 rounded-xl ${direction === val ? 'bg-card shadow-sm' : ''}`}
                    onPress={() => setDirection(val)}
                  >
                    <HStack className="items-center gap-2">
                      <Icon size={16} color={direction === val ? '#6366f1' : '#64748b'} />
                      <ButtonText className={`text-xs font-bold ${direction === val ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </ButtonText>
                    </HStack>
                  </Button>
                ))}
              </HStack>

              {/* Note */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Note (optional)</Text>
                <Input className="rounded-2xl border-border/40 h-12 bg-card">
                  <InputField placeholder="e.g. Borrowed for rent" value={note} onChangeText={setNote} className="text-sm" />
                </Input>
              </VStack>

              {/* Contact Section with toggle */}
              <VStack className="gap-2">
                <HStack className="justify-between items-center">
                  <Text size="xs" className="font-bold ml-1">Contact</Text>
                  <Pressable onPress={toggleMode} className="flex-row items-center gap-1.5 py-1 px-2 rounded-xl active:bg-muted/50">
                    {contactMode === 'new' ? (
                      <>
                        <Users size={13} color="#6366f1" />
                        <Text className="text-xs font-semibold text-primary">Pick existing</Text>
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} color="#6366f1" />
                        <Text className="text-xs font-semibold text-primary">New contact</Text>
                      </>
                    )}
                  </Pressable>
                </HStack>

                {contactMode === 'new' ? (
                  /* New contact: name + phone inputs */
                  <VStack className="gap-2">
                    <Input className="rounded-2xl border-border/40 h-12 bg-card">
                      <InputField
                        placeholder="Contact name *"
                        value={newContactName}
                        onChangeText={setNewContactName}
                        className="text-sm"
                      />
                    </Input>
                    <Input className="rounded-2xl border-border/40 h-12 bg-card">
                      <InputField
                        placeholder="Phone (optional)"
                        value={newContactPhone}
                        onChangeText={setNewContactPhone}
                        keyboardType="phone-pad"
                        className="text-sm"
                      />
                    </Input>
                  </VStack>
                ) : (
                  /* Pick existing: select dropdown */
                  <Select selectedValue={contactId} onValueChange={setContactId}>
                    <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">
                      <SelectInput
                        placeholder="Select contact"
                        className="text-sm flex-1"
                        value={contacts.find(c => c.id === contactId)?.name}
                      />
                      <SelectIcon as={ChevronDown} className="mr-3" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                        {contacts.map(c => (
                          <SelectItem key={c.id} label={c.name} value={c.id} />
                        ))}
                        {contacts.length === 0 && (
                          <View className="py-4 px-6">
                            <Text className="text-muted-foreground text-sm">No contacts yet. Use "New contact" to add one.</Text>
                          </View>
                        )}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                )}
              </VStack>

              {/* Amount */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Amount</Text>
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

              {/* Installments */}
              <HStack className="items-center justify-between">
                <Text className="font-bold text-sm">Pay in Installments?</Text>
                <Switch value={installments} onValueChange={setInstallments} />
              </HStack>

              {/* Wallet */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Pay from wallet (optional)</Text>
                <Select selectedValue={walletId} onValueChange={setWalletId}>
                  <SelectTrigger className="rounded-2xl border-border/40 h-12 bg-card px-4">
                    <SelectInput placeholder="Select wallet" className="text-sm flex-1"
                      value={wallets.find(w => w.id === walletId)?.name} />
                    <SelectIcon as={ChevronDown} className="mr-3" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                      {wallets.map(w => (
                        <SelectItem key={w.id} label={w.name} value={w.id} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </VStack>

              {/* Due Date */}
              <VStack className="gap-2">
                <Text size="xs" className="font-bold ml-1">Due date (optional)</Text>
                <Input className="rounded-2xl border-border/40 h-12 bg-card">
                  <InputField placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} className="text-sm" />
                </Input>
              </VStack>

              <HStack className="justify-end gap-3 mt-4">
                <Button className="flex-1 rounded-2xl h-12" onPress={handleSave} disabled={loading || !isValid()}>
                  {loading ? <ButtonSpinner className="text-primary-foreground" /> : <ButtonIcon as={CreditCard} className="text-primary-foreground" />}
                  <ButtonText className="font-bold ml-2">Record Debt</ButtonText>
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
