import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native'
import { useSignIn, useSignUp } from '@clerk/expo'

export default function SignInScreen() {
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!signInLoaded || !signIn) return
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await signIn.reload()
      }
    } catch (err: unknown) {
      Alert.alert('Sign In Failed', (err as Error).message ?? 'Please check your credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!signUpLoaded || !signUp) return
    setLoading(true)
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification()
      Alert.alert('Check your email', 'We sent a verification code to ' + email)
    } catch (err: unknown) {
      Alert.alert('Sign Up Failed', (err as Error).message ?? 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoGem}>◆</Text>
          <Text style={styles.logoText}>OrnalLens</Text>
          <Text style={styles.tagline}>AI Jewellery Photography Studio</Text>
        </View>

        {/* Form */}
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
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading || !email || !password}
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
                ? "New to OrnalLens? Create account"
                : "Already have an account? Sign in"}
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
