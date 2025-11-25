import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { CherryBombOne_400Regular } from '@expo-google-fonts/cherry-bomb-one';

import AuthStack from '@/navigation/AuthStack';
import MainTabs from '@/navigation/MainTabs';
import Onboarding from '@/screens/Onboarding';
import AnalyticsScreen from '@/screens/Analytics';
import FunAIAssistant from '@/components/FunAIAssistant';
import { useAuthState } from '@/hooks/useAuthState';
import { colors } from '@/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    text: colors.text,
    card: colors.card,
    primary: colors.primary,
  },
};

type LoggedOutStackParamList = {
  Onboarding: undefined;
  AuthStack: undefined;
};

type LoggedInStackParamList = {
  MainTabs: undefined;
  Analytics: undefined;
  AITest: undefined;
};

const LoggedOutStack = createNativeStackNavigator<LoggedOutStackParamList>();
const LoggedInStack = createNativeStackNavigator<LoggedInStackParamList>();

function LoggedOutNavigator() {
  return (
    <LoggedOutStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Onboarding"
    >
      <LoggedOutStack.Screen name="Onboarding" component={Onboarding} />
      <LoggedOutStack.Screen name="AuthStack" component={AuthStack} />
    </LoggedOutStack.Navigator>
  );
}

function LoggedInNavigator() {
  return (
    <LoggedInStack.Navigator screenOptions={{ headerShown: false }}>
      <LoggedInStack.Screen name="MainTabs" component={MainTabs} />
      <LoggedInStack.Screen name="Analytics" component={AnalyticsScreen} />
      <LoggedInStack.Screen name="AITest" component={FunAIAssistant} />
    </LoggedInStack.Navigator>
  );
}

export default function App() {
  const { user, loading } = useAuthState();

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'CherryBomb-One': CherryBombOne_400Regular,
  });

  if (!fontsLoaded || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <LoggedInNavigator /> : <LoggedOutNavigator />}
    </NavigationContainer>
  );
}