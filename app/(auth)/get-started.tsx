import { useCallback, useRef, useState } from "react";
import { Animated, Image, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
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

const CAROUSEL_DATA = [
    {
        id: "1",
        title: "Welcome to Wiseflow",
        description: "Organize your life with tasks, notes and also finance management.",
        image: require("../../assets/images/splash1.png")
    },
    {
        id: "2",
        title: "Track Your Progress",
        description: "Stay on top of your daily routines and personal goals.",
        image: require("../../assets/images/splash2.png")
    },
    {
        id: "3",
        title: "Achieve More",
        description: "Boost your productivity and simplify your daily tasks.",
        image: require("../../assets/images/splash3.png")
    }
];

export default function GetStartedScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const bottomSheetRef = useRef<BottomSheetRef>(null);

    const scrollX = useRef(new Animated.Value(0)).current;

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const openSheet = useCallback(() => {
        bottomSheetRef.current?.open();
    }, []);

    const handleLogin = () => {
        router.replace("/(app)");
    };

    return (
        <View className="flex-1 bg-background">
            {/* Content / Carousel */}
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
                        <View style={{ width }} className="flex-1 justify-start items-center pt-24 px-6">
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
                                backgroundColor: '#6366f1',
                                marginHorizontal: 2,
                            }}
                        />
                    );
                })}
            </View>

            {/* Buttons */}
            <View className="pb-12 gap-3 px-6">
                <Button
                    className="py-4 rounded-xl items-center"
                    size="lg"
                    onPress={() => { }}
                >
                    <ButtonText className="font-semibold text-base">
                        Create Account
                    </ButtonText>
                </Button>

                <Button
                    variant="outline"
                    className="py-4 rounded-xl items-center border-border"
                    size="lg"
                    onPress={openSheet}
                >
                    <ButtonText className="font-semibold text-base text-foreground">
                        I already have an account
                    </ButtonText>
                </Button>
            </View>

            {/* Bottom Sheet Login */}
            <BottomSheet
                ref={bottomSheetRef}
            >
                <BottomSheetPortal
                    snapPoints={["55%"]}
                    backdropComponent={BottomSheetBackdrop}
                    handleComponent={BottomSheetDragIndicator}
                    index={-1}
                >
                    <BottomSheetContent>
                        <Box className="px-4 pb-8">
                            <View className="flex justify-center items-center mb-6 gap-1 mt-6">
                                <Text className="text-2xl font-bold">Login to your account</Text>
                                <Text className="text-muted-foreground text-xs text-balance text-center">
                                    Enter your email below to login to your account
                                </Text>
                            </View>

                            {/* Email */}
                            <Text className="text-foreground ps-2 mb-2">Email</Text>
                            <BottomSheetTextInput
                                className="rounded-full px-5 py-3 mb-4 bg-secondary border-transparent text-foreground h-12"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="user@wiseflow.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#9ca3af"
                            />

                            {/* Password Input */}
                            <Text className="text-foreground ps-2 mb-2">Password</Text>
                            <BottomSheetTextInput
                                className="rounded-full px-5 py-3 mb-6 bg-secondary border-transparent text-foreground h-12"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholder="********"
                                autoCapitalize="none"
                                placeholderTextColor="#9ca3af"
                            />

                            {/* Login Button */}
                            <Button
                                className="py-4 rounded-full items-center mt-2 h-12"
                                size="lg"
                                onPress={handleLogin}
                            >
                                <ButtonText className="font-semibold text-base">
                                    Login
                                </ButtonText>
                            </Button>

                            <Text className="text-center text-xs text-muted-foreground/60 mt-10 px-6">
                                By continuing, I agree to Wiseflow's terms, privacy policy, and cookie policy.
                            </Text>
                        </Box>
                    </BottomSheetContent>
                </BottomSheetPortal>
            </BottomSheet>
        </View>
    );
}
