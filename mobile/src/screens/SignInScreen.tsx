import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native'
// Use the legacy hooks — @clerk/expo v3 default exports use a new Signal-based
// API that doesn't expose isLoaded / setActive. Legacy path has the stable API.
import { useSignIn, useSignUp } from '@clerk/expo/legacy'

export default function SignInScreen() {
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!signInLoaded) return
    setLoading(true)
    try {
      const result = await signIn!.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setSignInActive!({ session: result.createdSessionId })
        // AppNavigator switches to Home automatically once isSignedIn flips
      } else {
        Alert.alert('Extra step required', `Status: ${result.status}`)
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? 'Check your credentials'
      Alert.alert('Sign In Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!signUpLoaded) return
    setLoading(true)
    try {
      await signUp!.create({ emailAddress: email, password })
      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' })
      setMode('verify')
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? 'Please try again'
      Alert.alert('Sign Up Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Verify email code ─────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!signUpLoaded) return
    setLoading(true)
    try {
      let result = await signUp!.attemptEmailAddressVerification({ code })

      // If Clerk requires extra fields, auto-fill them and finalize
      if (result.status === 'missing_requirements') {
        const missing: string[] = (result as any).missingFields ?? []
        const unverified: string[] = (result as any).unverifiedFields ?? []
        console.log('[Clerk] missing_requirements — missingFields:', missing, 'unverifiedFields:', unverified)

        const updates: Record<string, unknown> = {}
        if (missing.includes('username')) {
          const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
          updates.username = `${prefix}${Math.random().toString(36).slice(2, 6)}`
        }
        if (missing.includes('first_name')) updates.firstName = email.split('@')[0]
        if (missing.includes('last_name')) updates.lastName = 'User'
        if (missing.includes('phone_number')) updates.phoneNumber = '+12125550123'

        if (Object.keys(updates).length > 0) {
          result = await signUp!.update(updates as any)
        } else if (missing.length === 0 && unverified.length === 0) {
          // Clerk sometimes returns missing_requirements right before completing — try finalize
          result = await signUp!.update({} as any)
        }

        if (result.status !== 'complete') {
          const label = missing.length > 0
            ? `Required fields: ${missing.join(', ')}`
            : `Unverified: ${unverified.join(', ') || result.status}`
          Alert.alert('Almost there!', `${label}\n\nPlease go to dashboard.clerk.com → Configure → User & Authentication → User model and check which fields are required, then turn them off.`)
          return
        }
      }

      if (result.status === 'complete') {
        await setSignUpActive!({ session: result.createdSessionId })
      } else {
        Alert.alert('Sign Up Incomplete', `Status: ${result.status}`)
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? 'Invalid code'
      Alert.alert('Verification Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Verify screen ─────────────────────────────────────────────────────────
  if (mode === 'verify') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inner}>
          <View style={styles.logoArea}>
            <Text style={styles.logoGem}>◆</Text>
            <Text style={styles.logoText}>OrnalLens</Text>
            <Text style={styles.tagline}>Check your email for a 6-digit code</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor="#444"
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, (loading || !code) && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={loading || !code}
            >
              {loading
                ? <ActivityIndicator color="#0a0a0a" />
                : <Text style={styles.primaryBtnText}>Verify Email</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('signup')}>
              <Text style={styles.switchText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── Sign In / Sign Up ─────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoArea}>
          <Text style={styles.logoGem}>◆</Text>
          <Text style={styles.logoText}>OrnalLens</Text>
          <Text style={styles.tagline}>AI Jewellery Photography Studio</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#444"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#444"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || !signInLoaded || !email || !password) && styles.btnDisabled]}
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading || !signInLoaded || !email || !password}
          >
            {loading
              ? <ActivityIndicator color="#0a0a0a" />
              : <Text style={styles.primaryBtnText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}>
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? 'New to OrnalLens? Create account'
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoGem: { fontSize: 48, color: '#D4AF37', marginBottom: 8 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  tagline: { fontSize: 13, color: '#666', marginTop: 6, letterSpacing: 1 },
  form: { gap: 10 },
  label: { color: '#999', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 16 },
  switchText: { color: '#D4AF37', textAlign: 'center', marginTop: 16, fontSize: 13 },
})
