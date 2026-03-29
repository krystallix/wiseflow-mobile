import React, { useState } from 'react';
import { View, Pressable, useColorScheme, Platform, TextInput } from 'react-native';
import { Modal, ModalBackdrop, ModalContent, ModalBody } from '@/components/ui/modal';
import { Search, Home, FileText, CheckSquare, DollarSign, Calendar as CalendarIcon, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';

const NAV_ITEMS = [
    { name: 'Overview', path: '/', icon: Home },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'Tasks', path: '/task', icon: CheckSquare },
    { name: 'Finance', path: '/finance', icon: DollarSign },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
];

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [search, setSearch] = useState('');
    const router = useRouter();

    const filtered = NAV_ITEMS.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const handleNavigate = (path: string) => {
        onClose();
        // Give modal time to close smoothly before navigating
        setTimeout(() => {
            router.navigate(path as any);
            setSearch('');
        }, Platform.OS === 'ios' ? 100 : 0);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalBackdrop />
            <ModalContent className="mx-4 p-0 bg-background rounded-2xl overflow-hidden border border-border shadow-hard-2">
                <View className="flex-row items-center border-b border-border/50 px-3">
                    <Search size={20} color={isDark ? '#e4e4e7' : '#71717a'} />
                    <TextInput 
                        autoFocus 
                        placeholder="Type a command or search..." 
                        placeholderTextColor={isDark ? '#a1a1aa' : '#71717a'}
                        value={search} 
                        onChangeText={setSearch} 
                        onSubmitEditing={() => filtered.length > 0 && handleNavigate(filtered[0].path)}
                        className="flex-1 h-12 ml-2 text-foreground"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch('')} className="p-2 hit-slop-10">
                            <X size={16} color={isDark ? '#a1a1aa' : '#52525b'} />
                        </Pressable>
                    )}
                </View>

                {filtered.length === 0 && (
                    <View className="py-8 items-center justify-center">
                        <Text className="text-muted-foreground text-sm">No results found.</Text>
                    </View>
                )}

                {filtered.length > 0 && (
                    <ModalBody className="max-h-80 p-0 m-0">
                        <View className="p-2">
                            <Text className="text-[11px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-wider">
                                Suggestions
                            </Text>
                            {filtered.map(item => {
                                const Icon = item.icon;
                                return (
                                    <Pressable 
                                        key={item.path} 
                                        onPress={() => handleNavigate(item.path)}
                                        className={`flex-row items-center gap-3 px-3 py-3 rounded-xl mb-1 ${isDark ? 'active:bg-zinc-800' : 'active:bg-zinc-100'}`}
                                    >
                                        <Icon size={18} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                                        <Text className="text-foreground font-medium">{item.name}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ModalBody>
                )}
            </ModalContent>
        </Modal>
    );
}
