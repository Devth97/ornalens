import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { listJobs, getTokenBalance } from '../lib/api'
import type { Job } from './types'

const STATUS_COLORS: Record<string, string> = {
  pending:    '#888',
  processing: '#3B82F6',
  completed:  '#22C55E',
  failed:     '#EF4444',
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>()
  const [jobs, setJobs] = useState<Job[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [jobsResult, tokResult] = await Promise.allSettled([listJobs(), getTokenBalance()])
      if (jobsResult.status === 'fulfilled') setJobs(jobsResult.value ?? [])
      if (tokResult.status  === 'fulfilled') {
        setBalance(tokResult.value.tokens_balance)
        setTokensUsed(tokResult.value.tokens_used)
      }
      const err = jobsResult.status === 'rejected' ? jobsResult.reason : tokResult.status === 'rejected' ? tokResult.reason : null
      if (err) {
        const msg = err instanceof Error ? err.message : ''
        if (!msg.includes('Clerk not ready') && !msg.includes('Not authenticated')) {
          console.error('Dashboard load error:', err)
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const completed  = jobs.filter(j => j.status === 'completed').length
  const processing = jobs.filter(j => j.status === 'processing' || j.status === 'pending').length
  const failed     = jobs.filter(j => j.status === 'failed').length
  const recent     = jobs.slice(0, 5)
  const now        = new Date()
  const thisMonth  = jobs.filter(j => {
    const d = new Date(j.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor="#D4AF37" />
      }
    >
      {/* Token banner */}
      <View style={styles.tokenBanner}>
        <Text style={styles.tokenLabel}>Available Tokens</Text>
        <Text style={styles.tokenValue}>{balance === null ? '—' : balance.toLocaleString()}</Text>
      </View>

      {/* Quick action cards */}
      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 8 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Create Visuals</Text>
            <Text style={styles.cardIcon}>✦</Text>
          </View>
          <Text style={styles.cardMeta}>• Select a template{'\n'}• Upload jewellery{'\n'}• Get AI results</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => navigation.navigate('Create')}>
            <Text style={styles.goldBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { flex: 1, marginLeft: 8 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.cardIcon}>🕐</Text>
          </View>
          <Text style={styles.bigNum}>{thisMonth}</Text>
          <Text style={styles.cardMeta}>This month</Text>
          <Text style={[styles.cardMeta, { marginTop: 2 }]}>Total: {jobs.length}</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => navigation.navigate('History')}>
            <Text style={styles.goldBtnText}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Current month stats */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current Month</Text>
          <Text style={styles.cardIcon}>📊</Text>
        </View>
        <Text style={styles.bigNum}>{(thisMonth * 450).toLocaleString()}</Text>
        <Text style={styles.cardMeta}>Tokens Used This Month</Text>
        <Text style={[styles.cardMeta, { marginTop: 2 }]}>Total Used: {tokensUsed.toLocaleString()}</Text>
      </View>

      {/* Generation status */}
      <View style={styles.card}>
        <View style={[styles.cardHeader, { marginBottom: 12 }]}>
          <Text style={styles.cardTitle}>Generation Status</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={{ color: '#9A6F0A', fontSize: 20 }}>↻</Text>
          </TouchableOpacity>
        </View>
        <StatusRow label="Processing" value={processing} color="#3B82F6" />
        <StatusRow label="Completed"  value={completed}  color="#22C55E" />
        <StatusRow label="Failed"     value={failed}     color="#EF4444" />
      </View>

      {/* Recent generations */}
      {recent.length > 0 && (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Recent Generations</Text>
          {recent.map(job => (
            <TouchableOpacity
              key={job.id}
              style={styles.recentRow}
              onPress={() => job.model_image_url && navigation.navigate('Gallery')}
            >
              <View style={styles.thumb}>
                {job.model_image_url
                  ? <Image source={{ uri: job.model_image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ color: '#444', fontSize: 18 }}>◆</Text>
                }
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {job.jewellery_description ?? 'Jewellery shoot'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[job.status] ?? '#888') + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[job.status] ?? '#888' }]}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Text>
                  </View>
                  {job.status === 'completed' && (
                    <Text style={{ color: '#9A6F0A', fontSize: 11 }}>450 tokens</Text>
                  )}
                </View>
                <Text style={styles.recentDate}>
                  {new Date(job.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {jobs.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ marginTop: 12 }}>
              <Text style={{ color: '#9A6F0A', textAlign: 'center', fontSize: 13 }}>
                View all {jobs.length} generations →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {jobs.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◆</Text>
          <Text style={styles.emptyTitle}>No shoots yet</Text>
          <Text style={styles.emptySubtitle}>Create your first AI jewellery photoshoot</Text>
          <TouchableOpacity style={[styles.goldBtn, { marginTop: 20, paddingHorizontal: 32 }]} onPress={() => navigation.navigate('Create')}>
            <Text style={styles.goldBtnText}>✦ Start Creating</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statusRow, { borderColor: color + '44', backgroundColor: color + '0d' }]}>
      <Text style={[styles.statusRowLabel, { color }]}>{label}</Text>
      <Text style={[styles.statusRowValue, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  content:   { padding: 16, paddingBottom: 32 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F2' },

  tokenBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1C1209', borderWidth: 0,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 12,
  },
  tokenLabel: { color: '#D4C48A', fontWeight: '700', fontSize: 14 },
  tokenValue: { color: '#FFFFFF', fontWeight: '900', fontSize: 20 },

  row:  { flexDirection: 'row', marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DDD0',
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle:  { color: '#1C1209', fontWeight: '700', fontSize: 14 },
  cardIcon:   { fontSize: 20 },
  cardMeta:   { color: '#7A6550', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  bigNum:     { color: '#9A6F0A', fontSize: 32, fontWeight: '900', marginBottom: 4 },

  goldBtn: {
    backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginTop: 8,
  },
  goldBtnText: { color: '#1C1209', fontWeight: '800', fontSize: 13 },

  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  statusRowLabel: { fontWeight: '600', fontSize: 13 },
  statusRowValue: { fontWeight: '800', fontSize: 14 },

  recentRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: {
    width: 52, height: 52, borderRadius: 10, backgroundColor: '#F0EBE0',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  recentTitle: { color: '#1C1209', fontWeight: '600', fontSize: 14 },
  recentDate:  { color: '#A8957E', fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  empty:       { alignItems: 'center', paddingTop: 48 },
  emptyIcon:   { fontSize: 40, color: '#C8B49A', marginBottom: 12 },
  emptyTitle:  { color: '#1C1209', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: '#A8957E', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
})
