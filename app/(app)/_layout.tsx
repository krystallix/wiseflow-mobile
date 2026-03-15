import { Tabs } from 'expo-router';
import { Home, Calendar, Notebook, Wallet2, CircleCheck } from 'lucide-react-native';
import { useColorScheme, View, Pressable, Keyboard, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import Animated, { FadeInRight, LinearTransition } from 'react-native-reanimated';
import AppHeader from '../../components/app-header';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    if (isKeyboardVisible) return null;

    return (
        <View
            className="absolute bottom-6 left-6 right-6 rounded-full flex-row items-center justify-between px-2 py-2 overflow-hidden"
            style={{
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 0.1,
                borderWidth: 1,
                borderColor: isDark ? '#27272a' : '#f4f4f5'
            }}
        >
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                const renderIcon = (color: string) => {
                    if (options.tabBarIcon) {
                        return options.tabBarIcon({ focused: isFocused, color, size: 22 });
                    }
                    return null;
                };

                return (
                    <AnimatedPressable
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={(options as any).tabBarAccessibilityLabel}
                        testID={(options as any).tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        layout={LinearTransition.springify().damping(20).stiffness(120)}
                        className={`flex-row items-center justify-center rounded-full py-2.5 px-3 ${isFocused ? (isDark ? 'bg-[#a855f7]/20' : 'bg-[#f3e8ff]') : ''}`}
                    >
                        <Animated.View layout={LinearTransition.springify().damping(20).stiffness(120)}>
                            {renderIcon(isFocused ? (isDark ? '#d8b4fe' : '#9333ea') : (isDark ? '#a1a1aa' : '#71717a'))}
                        </Animated.View>
                        {isFocused && (
                            <Animated.View exiting={undefined} entering={FadeInRight.delay(50).duration(200)}>
                                <Text className={`ml-2 mr-1 text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                    {label as string}
                                </Text>
                            </Animated.View>
                        )}
                    </AnimatedPressable>
                );
            })}
        </View>
    );
}

export default function AppLayout() {
    return (
        <View className='flex-1'>
            <AppHeader />
            <Tabs
                tabBar={(props) => <CustomTabBar {...props} />}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarHideOnKeyboard: true,
                    sceneStyle: { backgroundColor: 'transparent' },
                    animation: 'fade',
                })}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => (
                            <Home color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="notes"
                    options={{
                        title: 'Notes',
                        tabBarIcon: ({ color, size }) => (
                            <Notebook color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="finance"
                    options={{
                        title: 'Finance',
                        tabBarIcon: ({ color, size }) => (
                            <Wallet2 color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="task"
                    options={{
                        title: 'Task',
                        tabBarIcon: ({ color, size }) => (
                            <CircleCheck color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="calendar"
                    options={{
                        title: 'Calendar',
                        tabBarIcon: ({ color, size }) => (
                            <Calendar color={color} size={size} />
                        ),
                    }}
                />
            </Tabs>
        </View>

    );
}
