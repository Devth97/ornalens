import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ClerkProvider, useAuth } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { setClerkTokenGetter } from './src/lib/api'

import SignInScreen from './src/screens/SignInScreen'
import HomeScreen from './src/screens/HomeScreen'
import NewJobScreen from './src/screens/NewJobScreen'
import JobStatusScreen from './src/screens/JobStatusScreen'

const Stack = createNativeStackNavigator()

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#D4AF37',
          headerTitleStyle: { fontWeight: '700', color: '#fff' },
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {!isSignedIn ? (
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: '✦ Ornalens' }} />
            <Stack.Screen name="NewJob" component={NewJobScreen} options={{ title: 'New Shoot' }} />
            <Stack.Screen name="JobStatus" component={JobStatusScreen} options={{ title: 'Processing' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StatusBar style="light" />
      <AppNavigator />
    </ClerkProvider>
  )
}
