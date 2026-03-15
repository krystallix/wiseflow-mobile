import { useSegments } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Bell } from 'lucide-react-native';

function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Good Morning 👋, ';
    if (hour >= 12 && hour < 15) return 'Good Afternoon 👋, ';
    if (hour >= 15 && hour < 18) return 'Good Evening 👋, ';
    return 'Good Night 👋, ';
}


export default function AppHeader() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const segments = useSegments();


    const currentTab = segments[segments.length - 1] as string;
    const isHome = currentTab === '(app)' || !currentTab;

    const titleMap: Record<string, string> = {
        notes: 'Notes',
        finance: 'Finance',
        task: 'Tasks',
        calendar: 'Calendar',
    };

    return (
        <View
            className="flex-row items-center justify-between px-6 pb-4 bg-background"
            style={{ paddingTop: insets.top + 16 }}
        >
            {isHome ? (
                <View className="flex-row items-center gap-3">
                    <View>
                        <Text className="text-lg font-bold text-foreground leading-tight">{getGreeting()}</Text>
                        <Text className="text-sm text-muted-foreground">nursafiki</Text>
                    </View>
                </View>
            ) : (
                <View className="justify-center h-12">
                    <Text className="text-2xl font-bold text-foreground">
                        {titleMap[currentTab] ?? 'Wiseflow'}
                    </Text>
                </View>
            )}

            <View className="flex-row items-center gap-3">
                <View className={`h-11 w-11 rounded-full items-center justify-center border border-border ${isDark ? 'bg-[#18181b]' : 'bg-gray-50'}`}>
                    <View className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-red-500 z-10 border border-background" />
                    <Bell size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                </View>
                <Avatar className="h-12 w-12">
                    <AvatarFallbackText>User</AvatarFallbackText>
                    <AvatarImage
                        source={{
                            uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=880&q=80",
                        }}
                    />
                </Avatar>
            </View>
        </View>
    );
}
