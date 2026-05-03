import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Linking,
} from 'react-native'
import { listJobs, getTokenBalance } from '../lib/api'
import type { Job } from './types'

const PACKAGES = [
  { name: 'Starter', price: 0,     tokens: 2000,  duration: '1 Month'  },
  { name: 'Basic',   price: 10000, tokens: 10000, duration: '6 Months' },
  { name: 'Standard', price: 50000, tokens: 60000, duration: '1 Year'  },
]

type TokenInfo = { plan: string; tokens_granted: number; tokens_used: number; tokens_balance: number }

export default function TokensScreen() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'packages' | 'history'>('packages')

  const loadData = useCallback(async () => {
    try {
      const [jobsResult, tokResult] = await Promise.allSettled([listJobs(), getTokenBalance()])
      if (jobsResult.status === 'fulfilled') setJobs(jobsResult.value ?? [])
      if (tokResult.status  === 'fulfilled') setTokenInfo(tokResult.value)
      const err = jobsResult.status === 'rejected' ? jobsResult.reason : tokResult.status === 'rejected' ? tokResult.reason : null
      if (err) {
        const msg = err instanceof Error ? err.message : ''
        if (!msg.includes('Clerk not ready') && !msg.includes('Not authenticated')) {
          console.error('Tokens load error:', err)
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const balance      = tokenInfo?.tokens_balance  ?? 0
  const tokensUsed   = tokenInfo?.tokens_used      ?? 0
  const granted      = tokenInfo?.tokens_granted   ?? 2000
  const currentPlan  = tokenInfo?.plan             ?? 'Starter'
  const completedJobs = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs])

  const handleRequest = (pkg: typeof PACKAGES[number]) => {
    if (pkg.name === currentPlan) return
    const msg = encodeURIComponent(
      `Hi, I'd like to request the ${pkg.name} plan (₹${pkg.price.toLocaleString('en-IN')}, ${pkg.tokens.toLocaleString()} tokens, ${pkg.duration}) for Ornalens.`
    )
    Linking.openURL(`https://wa.me/919901542387?text=${msg}`)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#D4AF37" size="large" /></View>
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor="#D4AF37" />}
    >
      {/* Stats */}
      <StatRow icon="◈" label="Tokens Balance"          value={balance.toLocaleString()}  color="#D4AF37" />
      <StatRow icon="⬇" label="Total Tokens Requested"  value={granted.toLocaleString()}  color="#3B82F6" />
      <StatRow icon="📊" label="Total Tokens Used"       value={tokensUsed.toLocaleString()} color="#22C55E" />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'packages' && styles.tabActive]}
          onPress={() => setTab('packages')}
        >
          <Text style={[styles.tabText, tab === 'packages' && styles.tabTextActive]}>Request Tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Transaction History</Text>
        </TouchableOpacity>
      </View>

      {tab === 'packages' ? (
        <>
          <Text style={styles.sectionTitle}>Tokens Packages</Text>
          {PACKAGES.map(pkg => (
            <View key={pkg.name} style={[styles.pkgCard, pkg.name === currentPlan && styles.pkgCardActive]}>
              {pkg.name === currentPlan && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>✓ CURRENT PLAN</Text>
                </View>
              )}
              <Text style={styles.pkgName}>{pkg.name}</Text>
              <Text style={styles.pkgPrice}>
                {pkg.price === 0 ? '₹0' : `₹${pkg.price.toLocaleString('en-IN')}`}
              </Text>
              <Text style={styles.pkgTokens}>{pkg.tokens.toLocaleString()} Tokens</Text>
              <Text style={styles.pkgDuration}>{pkg.duration}</Text>
              <TouchableOpacity
                style={[styles.pkgBtn, pkg.name === currentPlan && styles.pkgBtnDisabled]}
                onPress={() => handleRequest(pkg)}
                disabled={pkg.name === currentPlan}
              >
                <Text style={[styles.pkgBtnText, pkg.name === currentPlan && { color: '#D4AF3766' }]}>
                  {pkg.name === currentPlan ? 'Current Plan' : 'Request Now'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {/* Grant entry */}
          <TxRow label={`${currentPlan} Plan — Token Grant`} sub="Free allocation" amount={`+${granted.toLocaleString()}`} positive />
          {/* Usage entries */}
          {completedJobs.map(job => (
            <TxRow
              key={job.id}
              label={job.jewellery_description ?? 'Image Generation'}
              sub={new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              amount="-450"
              positive={false}
            />
          ))}
          {completedJobs.length === 0 && (
            <Text style={{ color: '#A8957E', textAlign: 'center', marginTop: 24, fontSize: 13 }}>No transactions yet</Text>
          )}
        </>
      )}
    </ScrollView>
  )
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

function TxRow({ label, sub, amount, positive }: { label: string; sub: string; amount: string; positive: boolean }) {
  return (
    <View style={styles.txRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.txLabel}>{label}</Text>
        <Text style={styles.txSub}>{sub}</Text>
      </View>
      <Text style={[styles.txAmount, { color: positive ? '#22C55E' : '#EF4444' }]}>{amount}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  content:   { padding: 16, paddingBottom: 48 },
  center:    { flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', alignItems: 'center' },

  statRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DDD0',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  statIcon:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  statLabel: { flex: 1, color: '#1C1209', fontWeight: '600', fontSize: 13 },
  statValue: { fontWeight: '900', fontSize: 20 },

  tabs: { flexDirection: 'row', marginVertical: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E8DDD0',
    backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  tabActive:     { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  tabText:       { color: '#A8957E', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#1C1209' },

  sectionTitle: { color: '#1C1209', fontWeight: '700', fontSize: 15, marginBottom: 14 },

  pkgCard: {
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E8DDD0',
    borderRadius: 18, padding: 20, marginBottom: 14, alignItems: 'center',
  },
  pkgCardActive: { borderColor: '#D4AF37' },
  currentBadge: { backgroundColor: '#D4AF37', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 12 },
  currentBadgeText: { color: '#1C1209', fontWeight: '800', fontSize: 11 },
  pkgName:     { color: '#1C1209', fontWeight: '800', fontSize: 18, marginBottom: 6 },
  pkgPrice:    { color: '#9A6F0A', fontWeight: '900', fontSize: 36, marginBottom: 4 },
  pkgTokens:   { color: '#9A6F0A', fontWeight: '600', fontSize: 14, marginBottom: 2 },
  pkgDuration: { color: '#7A6550', fontSize: 13, marginBottom: 16 },
  pkgBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#D4AF37', alignItems: 'center',
  },
  pkgBtnDisabled: { backgroundColor: '#D4AF3730' },
  pkgBtnText:     { color: '#1C1209', fontWeight: '800', fontSize: 14 },

  txRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DDD0',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8,
  },
  txLabel:  { color: '#1C1209', fontWeight: '600', fontSize: 13 },
  txSub:    { color: '#A8957E', fontSize: 11, marginTop: 2 },
  txAmount: { fontWeight: '800', fontSize: 14 },
})
