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

  // Wire Clerk's getToken into the API module so every authenticated
  // fetch call gets a valid JWT without touching SecureStore directly.
  useEffect(() => {
    if (isSignedIn) {
      // Wrap to ensure we always call with no args and get a plain string token
      setClerkTokenGetter(async () => {
        try {
          const token = await getToken()
          console.log('[Auth] Token obtained:', token ? `${token.slice(0, 20)}...` : 'null')
          return token
        } catch (e) {
          console.error('[Auth] getToken failed:', e)
          return null
        }
      })
    }
  }, [isSignedIn, getToken])

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
