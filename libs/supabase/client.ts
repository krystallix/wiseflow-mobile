import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

// Custom storage wrapper to prevent SSR issues on Web
const LargeSecureStore = {
    getItem: async (key: string) => {
        if (isWeb) {
            if (typeof window === 'undefined') return null
            return window.localStorage.getItem(key)
        }
        return AsyncStorage.getItem(key)
    },
    setItem: async (key: string, value: string) => {
        if (isWeb) {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value)
            }
        } else {
            await AsyncStorage.setItem(key, value)
        }
    },
    removeItem: async (key: string) => {
        if (isWeb) {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key)
            }
        } else {
            await AsyncStorage.removeItem(key)
        }
    },
}

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    {
        auth: {
            storage: LargeSecureStore as any,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
            lock: processLock,
        },
    })
