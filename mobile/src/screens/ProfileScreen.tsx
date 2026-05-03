import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useClerk, useUser } from '@clerk/expo'

export default function ProfileScreen() {
  const { signOut } = useClerk()
  const { user } = useUser()

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName
            ? `${user.firstName} ${user.lastName ?? ''}`
            : user?.emailAddresses?.[0]?.emailAddress ?? 'User'}
        </Text>
        <Text style={styles.email}>
          {user?.emailAddresses?.[0]?.emailAddress ?? ''}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
              : '—'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Ornalens v1.0.0</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },

  avatarWrap: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4AF3722',
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#D4AF37', fontSize: 32, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { color: '#666', fontSize: 13 },

  section: {
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0,
    borderBottomColor: '#1f1f1f',
  },
  infoLabel: { color: '#888', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '600' },

  signOutBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF444444',
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },

  version: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 24 },
})
