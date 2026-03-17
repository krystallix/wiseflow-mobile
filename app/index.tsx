import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabase';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setSessionChecked(true);
    });
  }, []);

  if (!sessionChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return hasSession ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/get-started" />;
}