import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ClerkProvider, useAuth } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, View, Text, Platform } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { setClerkTokenGetter } from './src/lib/api'

import SignInScreen from './src/screens/SignInScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import CreateHomeScreen from './src/screens/CreateHomeScreen'
import TemplatePhotoshootScreen from './src/screens/TemplatePhotoshootScreen'
import PhotoResultScreen from './src/screens/PhotoResultScreen'
import NewJobScreen from './src/screens/NewJobScreen'
import JobStatusScreen from './src/screens/JobStatusScreen'
import GalleryScreen from './src/screens/GalleryScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import TokensScreen from './src/screens/TokensScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const STACK_SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: '#FAF7F2', borderBottomWidth: 1, borderBottomColor: '#E8DDD0' },
  headerTintColor: '#9A6F0A',
  headerTitleStyle: { fontWeight: '700' as const, color: '#1C1209' },
  contentStyle: { backgroundColor: '#FAF7F2' },
}

// ── Create Tab Stack ─────────────────────────────────────────────────────────
function CreateStack() {
  return (
    <Stack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="CreateHome"        component={CreateHomeScreen}        options={{ title: '✦ Create' }} />
      <Stack.Screen name="TemplatePhotoshoot" component={TemplatePhotoshootScreen} options={{ title: 'Photoshoot Setup' }} />
      <Stack.Screen name="PhotoResult"        component={PhotoResultScreen}        options={{ title: 'Result' }} />
      <Stack.Screen name="NewJob"             component={NewJobScreen}             options={{ title: 'New Video Shoot' }} />
      <Stack.Screen name="JobStatus"          component={JobStatusScreen}          options={{ title: 'Processing' }} />
    </Stack.Navigator>
  )
}

// ── Tab Icon helper ──────────────────────────────────────────────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⊞',
    Create:    '✦',
    Gallery:   '🖼',
    History:   '🕐',
    Tokens:    '◈',
  }
  return (
    <View style={{ width: 44, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, color: focused ? '#9A6F0A' : '#A8957E' }}>
        {icons[label] ?? '◆'}
      </Text>
    </View>
  )
}

// ── Main Tab Navigator ───────────────────────────────────────────────────────
function MainTabs() {
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 10)

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#FAF7F2', borderBottomWidth: 1, borderBottomColor: '#E8DDD0' },
        headerTintColor: '#9A6F0A',
        headerTitleStyle: { fontWeight: '700' as const, color: '#1C1209' },
        tabBarStyle: {
          backgroundColor: '#FAF7F2',
          borderTopColor: '#E8DDD0',
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          ...Platform.select({
            android: { elevation: 4 },
            ios: {
              shadowColor: '#C8B49A',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            },
          }),
        },
        tabBarActiveTintColor: '#9A6F0A',
        tabBarInactiveTintColor: '#A8957E',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarItemStyle: { paddingVertical: 2, minHeight: 48 },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Create"    component={CreateStack}     options={{ headerShown: false, title: 'Create' }} />
      <Tab.Screen name="Gallery"   component={GalleryScreen}   options={{ title: 'Gallery' }} />
      <Tab.Screen name="History"   component={HistoryScreen}   options={{ title: 'History' }} />
      <Tab.Screen name="Tokens"    component={TokensScreen}    options={{ title: 'Tokens' }} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { isLoaded, isSignedIn, getToken } = useAuth()

  // Set token getter SYNCHRONOUSLY during render — not in useEffect.
  // useEffect fires after all child effects, so HomeScreen's loadJobs()
  // would always run before the token getter was set, causing "Clerk not ready".
  // Setting it here ensures it's available before any child effect fires.
  if (isSignedIn) {
    setClerkTokenGetter(async () => {
      try {
        const token = await getToken()
        return token
      } catch (e) {
        console.error('[Auth] getToken failed:', e)
        return null
      }
    })
  }

  // Clear token getter on sign-out
  useEffect(() => {
    if (!isSignedIn) setClerkTokenGetter(() => Promise.resolve(null))
  }, [isSignedIn])

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F2' }}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {!isSignedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </Stack.Navigator>
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  )
}

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <StatusBar style="dark" />
        <AppNavigator />
      </ClerkProvider>
    </SafeAreaProvider>
  )
}
