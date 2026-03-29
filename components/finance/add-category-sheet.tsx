import React, { useState } from 'react';
import { View, Pressable, Keyboard, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
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
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { X, TrendingDown, TrendingUp, Pencil, Trash } from 'lucide-react-native';
import { type Category, createCategory, updateCategory, deleteCategory, type TransactionType } from '@/libs/supabase/finance';

const ICONS = [
  'ShoppingCart', 'Utensils', 'Car', 'Home', 'Zap',
  'Wifi', 'Heart', 'GraduationCap', 'Plane', 'Gift',
  'Coffee', 'Music', 'Dumbbell', 'AlarmClock', 'Briefcase',
  'TrendingUp', 'DollarSign', 'Shirt', 'Baby', 'Monitor'
];

const COLORS = [
  '#6366f1', // Indigo
  '#d8b4fe', // Light Purple
  '#93c5fd', // Light Blue
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f87171', // Red
  '#60a5fa', // Blue
  '#fb923c'  // Orange
];

export type AddCategorySheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  categories: Category[];
  onSave: () => Promise<void>;
  onClose: () => void;
};

export default function AddCategorySheet({
  bottomSheetRef,
  categories,
  onSave,
  onClose,
}: AddCategorySheetProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const customCategories = categories.filter((c) => c.owner === 'user');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('expense');
    setSelectedIcon(ICONS[0]);
    setSelectedColor(COLORS[0]);
  };

  const handleEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setType(c.type);
    setSelectedIcon(c.icon || ICONS[0]);
    setSelectedColor(c.color || COLORS[0]);
  };

  const confirmDelete = (c: Category) => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${c.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(c.id) }
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      if (editingId === id) resetForm();
      await onSave();
    } catch (err) {
      console.error('[AddCategory] Delete error:', err);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!name.trim() || !selectedIcon || !selectedColor) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        await createCategory({
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
        });
      }
      resetForm();
      await onSave();
    } catch (err) {
      console.error('[AddCategory] Save error:', err);
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
      <BottomSheetPortal snapPoints={['90%']} backdropComponent={BottomSheetBackdrop}>
        <View className="flex-1 pb-safe">
          <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="p-5 gap-6">
              
              {/* Header */}
              <View className="relative">
                <VStack className="gap-1 mt-2">
                  <Heading size="xl" className="text-foreground">
                    {editingId ? 'Edit Category' : 'Manage Categories'}
                  </Heading>
                  <Text size="sm" className="text-muted-foreground">
                    {editingId ? 'Modify your selected transaction category.' : 'Create or modify your custom transaction categories.'}
                  </Text>
                </VStack>
                <Pressable
                  className="absolute right-0 top-0 p-2"
                  onPress={handleClose}
                >
                  <X size={24} className="text-muted-foreground" />
                </Pressable>
              </View>

              {/* Type Switcher */}
              <HStack className="bg-muted p-1 rounded-full gap-1">
                <Button
                  variant="link"
                  className={`flex-1 h-12 rounded-full ${type === 'expense' ? 'bg-card shadow-sm' : ''}`}
                  onPress={() => setType('expense')}
                >
                  <HStack className="items-center justify-center gap-2">
                    <TrendingDown size={18} color={type === 'expense' ? '#334155' : '#64748b'} />
                    <ButtonText className={`text-sm font-bold capitalize ${type === 'expense' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Expense
                    </ButtonText>
                  </HStack>
                </Button>
                <Button
                  variant="link"
                  className={`flex-1 h-12 rounded-full ${type === 'income' ? 'bg-card shadow-sm' : ''}`}
                  onPress={() => setType('income')}
                >
                  <HStack className="items-center justify-center gap-2">
                    <TrendingUp size={18} color={type === 'income' ? '#334155' : '#64748b'} />
                    <ButtonText className={`text-sm font-bold capitalize ${type === 'income' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Income
                    </ButtonText>
                  </HStack>
                </Button>
              </HStack>

              {/* Name Input */}
              <VStack className="gap-2">
                <Text size="sm" className="font-bold ml-1 text-foreground">Category name</Text>
                <Input className="h-12 rounded-2xl border-border/40 px-4 bg-muted/30">
                  <InputField
                    placeholder="e.g. Groceries"
                    value={name}
                    onChangeText={setName}
                    className="text-base text-foreground"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </Input>
              </VStack>

              {/* Icons */}
              <VStack className="gap-2">
                <Text size="sm" className="font-bold ml-1 text-foreground">Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2" keyboardShouldPersistTaps="handled">
                  <HStack className="gap-3 px-1">
                    {ICONS.map((iconStr) => (
                      <Pressable
                        key={iconStr}
                        onPress={() => setSelectedIcon(iconStr)}
                        className={`h-12 w-12 items-center justify-center rounded-full ${
                          selectedIcon === iconStr 
                            ? 'border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <DynamicIcon 
                          name={iconStr} 
                          size={22} 
                          color={selectedIcon === iconStr ? '#4f46e5' : '#64748b'} 
                        />
                      </Pressable>
                    ))}
                  </HStack>
                </ScrollView>
              </VStack>

              {/* Colors */}
              <VStack className="gap-2">
                <Text size="sm" className="font-bold ml-1 text-foreground">Color</Text>
                <HStack className="gap-3 px-2 flex-wrap">
                  {COLORS.map((hex) => (
                    <Pressable
                      key={hex}
                      onPress={() => setSelectedColor(hex)}
                      className={`h-10 w-10 rounded-full items-center justify-center ${
                        selectedColor === hex ? 'border-2 border-slate-900 dark:border-slate-100' : ''
                      }`}
                    >
                      <View className="h-8 w-8 rounded-full" style={{ backgroundColor: hex }} />
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              <HStack className="gap-2">
                {editingId && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-12 mt-2 flex-1 border-border/40"
                    onPress={resetForm}
                    disabled={loading}
                  >
                    <ButtonText className="font-bold text-muted-foreground">Cancel</ButtonText>
                  </Button>
                )}
                
                {/* Save Button */}
                <Button
                  size="lg"
                  className="rounded-full h-12 mt-2 flex-2"
                  onPress={handleCreateOrUpdate}
                  disabled={loading || !name.trim()}
                >
                  {loading ? (
                    <ButtonSpinner className="text-primary-foreground" />
                  ) : (
                    <ButtonText className="font-bold">
                      {editingId ? 'Update Category' : 'Save Category'}
                    </ButtonText>
                  )}
                </Button>
              </HStack>

              <View className="h-px bg-border my-2" />

              {/* Custom Categories List */}
              <VStack className="gap-3">
                <Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase ml-1">
                  Custom Categories
                </Text>
                <VStack className="gap-3">
                  {customCategories.length === 0 ? (
                    <Text className="text-sm text-muted-foreground ml-1">No custom categories yet.</Text>
                  ) : (
                    customCategories.map((c) => (
                      <HStack key={c.id} className="items-center justify-between rounded-full border border-border/40 py-1.5 pl-2 pr-3 bg-muted/10">
                        <HStack className="items-center gap-3 flex-1">
                          <View 
                            className="h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${c.color || '#64748b'}33` }} 
                          >
                            <DynamicIcon name={c.icon as any} size={18} color={c.color || '#64748b'} />
                          </View>
                          <VStack className="justify-center">
                            <Text className="font-bold text-base text-foreground">{c.name}</Text>
                            <Text className="text-xs leading-none text-muted-foreground capitalize mt-0.5">{c.type}</Text>
                          </VStack>
                        </HStack>
                        
                        <HStack className="gap-2 items-center">
                          <Pressable onPress={() => handleEdit(c)} className="p-1.5 active:bg-accent/50 rounded-full">
                            <Pencil size={16} className="text-slate-600 dark:text-slate-400" />
                          </Pressable>
                          <Pressable onPress={() => confirmDelete(c)} className="p-1.5 active:bg-destructive/20 rounded-full">
                            <Trash size={16} color="#ef4444" />
                          </Pressable>
                        </HStack>
                      </HStack>
                    ))
                  )}
                </VStack>
              </VStack>

              <View style={{ height: 60 }} />
            </VStack>
          </BottomSheetScrollView>
        </View>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
