// ============================================================================
// 1Ummah Mobile — Root Navigator
// Top-level navigator that switches between Auth and Main based on
// authentication state, and hosts modal-style screens like PostDetail and
// Profile that sit above the tab navigator.
// ============================================================================

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Theme } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import PostDetailScreen from '../screens/PostDetailScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';

// ---------------------------------------------------------------------------
// Custom dark theme that matches the 1Ummah design system
// ---------------------------------------------------------------------------

const AppTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#1DA1F2',
    background: '#0a0a0f',
    card: '#0a0a0f',
    text: '#e7e9ea',
    border: '#1e1e2a',
    notification: '#1DA1F2',
  },
};

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

const Stack = createNativeStackNavigator<RootStackParamList>();

// ---------------------------------------------------------------------------
// RootNavigator
// ---------------------------------------------------------------------------

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show a loading spinner while the auth state is being hydrated from
  // secure storage on app launch.
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileViewScreen} />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationTypeForReplace: 'pop' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
