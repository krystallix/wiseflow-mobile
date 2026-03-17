import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Pressable,
    useWindowDimensions,
    View,
    Keyboard,
} from "react-native";
import { BorderlessButton } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import {
    BottomSheet,
    BottomSheetPortal,
    BottomSheetBackdrop,
    BottomSheetContent,
    BottomSheetDragIndicator,
    BottomSheetTextInput,
} from "@/components/ui/bottomsheet";
import type { BottomSheetRef } from "@/components/ui/bottomsheet";
import { supabase } from "@/libs/supabase";

const CAROUSEL_DATA = [
    {
        id: "1",
        title: "Welcome to Wiseflow",
        description: "Organize your life with tasks, notes and also finance management.",
        image: require("../../assets/images/splash1.png"),
    },
    {
        id: "2",
        title: "Track Your Progress",
        description: "Stay on top of your daily routines and personal goals.",
        image: require("../../assets/images/splash2.png"),
    },
    {
        id: "3",
        title: "Achieve More",
        description: "Boost your productivity and simplify your daily tasks.",
        image: require("../../assets/images/splash3.png"),
    },
];

/** Shake a ref horizontally — call shake() on error */
function useShake() {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();
    };

    return { shakeAnim, shake };
}

/** Animated press-scale for any pressable element */
function AnimatedPressable({
    onPress,
    disabled,
    children,
    className,
    style,
}: {
    onPress?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    style?: object;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled}
            className={className}
            style={style}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

export default function GetStartedScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isError, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Error animation
    const errorOpacity = useRef(new Animated.Value(0)).current;
    const errorTranslateY = useRef(new Animated.Value(-6)).current;

    // Shake for form
    const { shakeAnim, shake } = useShake();

    // Check session early to avoid flickers
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.replace('/(app)');
            }
        });
    }, []);

    // Setup keyboard listener for Android reset
    useEffect(() => {
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                // Ensure sheet snaps back to its initial 55% size
                bottomSheetRef.current?.snapToIndex(0);
            }
        );
        return () => {
            keyboardDidHideListener.remove();
        };
    }, []);

    const showError = (msg: string) => {
        setError(msg);
        errorOpacity.setValue(0);
        errorTranslateY.setValue(-6);
        Animated.parallel([
            Animated.timing(errorOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(errorTranslateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();
        shake();
    };

    const clearError = () => {
        if (!isError) return;
        Animated.timing(errorOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setError(""));
    };

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const openSheet = useCallback(() => {
        bottomSheetRef.current?.open();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            showError("Email dan password harus diisi");
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });
        setLoading(false);

        if (error) {
            showError(error.message);
            return;
        }

        if (data.user) {
            router.replace("/(app)");
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Carousel */}
            <View className="flex-1">
                <Animated.FlatList
                    data={CAROUSEL_DATA}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(item) => item.id}
                    className="flex-1"
                    renderItem={({ item }) => (
                        <View
                            style={{ width }}
                            className="flex-1 justify-start items-center pt-24 px-6"
                        >
                            <Image
                                source={item.image}
                                style={{ width: width - 48, height: 280 }}
                                className="mb-8"
                                resizeMode="contain"
                            />
                            <Text className="text-3xl font-bold text-foreground text-center mb-3">
                                {item.title}
                            </Text>
                            <Text className="text-base text-muted-foreground text-center leading-6 px-4">
                                {item.description}
                            </Text>
                        </View>
                    )}
                />
            </View>

            {/* Pagination Dots */}
            <View className="flex-row justify-center items-center gap-2 mb-8 mt-4 px-6">
                {CAROUSEL_DATA.map((_, index) => {
                    const dotWidth = scrollX.interpolate({
                        inputRange: [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ],
                        outputRange: [8, 32, 8],
                        extrapolate: "clamp",
                    });
                    const opacity = scrollX.interpolate({
                        inputRange: [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: "clamp",
                    });
                    return (
                        <Animated.View
                            key={index}
                            style={{
                                width: dotWidth,
                                opacity,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#6366f1",
                                marginHorizontal: 2,
                            }}
                        />
                    );
                })}
            </View>

            {/* CTA Buttons */}
            <View className="pb-12 gap-3 px-6">
                <AnimatedPressable
                    onPress={() => { }}
                    className="bg-primary rounded-xl items-center justify-center"
                    style={{ height: 56 }}
                >
                    <Text className="text-primary-foreground font-semibold text-base">
                        Create Account
                    </Text>
                </AnimatedPressable>

                <AnimatedPressable
                    onPress={openSheet}
                    className="rounded-xl items-center justify-center border border-border"
                    style={{ height: 56 }}
                >
                    <Text className="text-foreground font-semibold text-base">
                        I already have an account
                    </Text>
                </AnimatedPressable>
            </View>

            <BottomSheet ref={bottomSheetRef}>
                <BottomSheetPortal
                    snapPoints={["55%", "85%"]}
                    backdropComponent={BottomSheetBackdrop}
                    handleComponent={BottomSheetDragIndicator}
                    index={-1}
                    keyboardBehavior="extend"
                    keyboardBlurBehavior="restore"
                    android_keyboardInputMode="adjustResize"
                >
                    <BottomSheetContent>
                        <Box className="px-4 pb-8">
                            <View className="flex justify-center items-center mb-6 gap-1 mt-6">
                                <Text className="text-2xl font-bold">
                                    Login to your account
                                </Text>
                                <Text className="text-muted-foreground text-xs text-balance text-center">
                                    Enter your email below to login to your account
                                </Text>
                            </View>

                            {/* Shakes on error */}
                            <Animated.View
                                style={{ transform: [{ translateX: shakeAnim }] }}
                            >
                                {/* Email */}
                                <Text className="text-foreground ps-2 mb-2">Email</Text>
                                <BottomSheetTextInput
                                    className="rounded-full px-6 py-3 mb-4 bg-secondary text-foreground h-12"
                                    style={{
                                        borderWidth: 1.5,
                                        paddingStart: 10,
                                        borderColor: emailFocused ? "#6366f1" : "transparent",
                                    }}
                                    value={email}
                                    onChangeText={(v) => { setEmail(v); clearError(); }}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    placeholder="user@wiseflow.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#9ca3af"
                                />

                                {/* Password */}
                                <Text className="text-foreground ps-2 mb-2">Password</Text>
                                <View className="relative">
                                    <BottomSheetTextInput
                                        className="rounded-full px-5 py-3 bg-secondary text-foreground h-12"
                                        style={{
                                            borderWidth: 1.5,
                                            paddingStart: 10,
                                            borderColor: passwordFocused ? "#6366f1" : "transparent",
                                            paddingRight: 50,
                                        }}
                                        value={password}
                                        onChangeText={(v) => { setPassword(v); clearError(); }}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        secureTextEntry={!showPassword}
                                        placeholder="********"
                                        autoCapitalize="none"
                                        placeholderTextColor="#9ca3af"
                                    />
                                    <View
                                        className="absolute right-0 top-0 bottom-0 justify-center items-center"
                                        style={{ zIndex: 99, width: 50 }}
                                    >
                                        <BorderlessButton
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={{ padding: 10 }}
                                            activeOpacity={0.7}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={20} color="#9ca3af" />
                                            ) : (
                                                <Eye size={20} color="#9ca3af" />
                                            )}
                                        </BorderlessButton>
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Error Message — animated fade + slide down */}
                            <View className="min-h-[28px] mt-2 mb-2 justify-center">
                                {isError ? (
                                    <Animated.View
                                        style={{
                                            opacity: errorOpacity,
                                            transform: [{ translateY: errorTranslateY }],
                                        }}
                                    >
                                        <Text className="text-destructive text-xs text-center px-2">
                                            {isError}
                                        </Text>
                                    </Animated.View>
                                ) : null}
                            </View>

                            {/* Login Button */}
                            <AnimatedPressable
                                onPress={handleLogin}
                                disabled={loading}
                                className="bg-primary rounded-full items-center justify-center"
                                style={{ height: 48, opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text className="text-primary-foreground font-semibold text-base">
                                        Login
                                    </Text>
                                )}
                            </AnimatedPressable>

                            <Text className="text-center text-xs text-muted-foreground/60 mt-10 px-6">
                                By continuing, I agree to Wiseflow's terms, privacy policy, and
                                cookie policy.
                            </Text>
                        </Box>
                    </BottomSheetContent>
                </BottomSheetPortal>
            </BottomSheet>
        </View>
    );
}