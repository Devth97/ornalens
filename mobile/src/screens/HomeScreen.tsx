import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useClerk } from '@clerk/expo'
import { listJobs } from '../lib/api'
import type { Job } from './types'

const STATUS_COLORS: Record<string, string> = {
  pending:     '#555',
  processing:  '#3B82F6',
  model_done:  '#8B5CF6',
  shots_done:  '#F59E0B',
  videos_done: '#10B981',
  stitching:   '#F97316',
  completed:   '#22C55E',
  failed:      '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Queued',
  processing:  'Placing jewellery...',
  model_done:  'Generating shots...',
  shots_done:  'Creating videos...',
  videos_done: 'Stitching video...',
  stitching:   'Final render...',
  completed:   'Ready ✓',
  failed:      'Failed ✗',
}

export default function HomeScreen() {
  const navigation = useNavigation<any>()
  const { signOut } = useClerk()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadJobs = useCallback(async () => {
    try {
      const data = await listJobs()
      setJobs(data ?? [])
    } catch (e) {
      console.error('Failed to load jobs:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
    // Poll every 8s for in-progress jobs
    const interval = setInterval(loadJobs, 8000)
    return () => clearInterval(interval)
  }, [loadJobs])

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobStatus', { jobId: item.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.jewellery_description ?? 'Jewellery shoot'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.jobDate}>
        {new Date(item.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })}
      </Text>
      {item.status !== 'completed' && item.status !== 'failed' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${getProgress(item.status)}%`,
            backgroundColor: STATUS_COLORS[item.status]
          }]} />
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {loading
        ? <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={jobs}
            keyExtractor={j => j.id}
            renderItem={renderJob}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadJobs() }}
                tintColor="#D4AF37"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyGem}>◆</Text>
                <Text style={styles.emptyTitle}>No shoots yet</Text>
                <Text style={styles.emptySubtitle}>
                  Upload a jewellery photo to create your first AI shoot
                </Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Shoots</Text>
                <TouchableOpacity onPress={() => signOut()}>
                  <Text style={styles.signOutText}>Sign out</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      }

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewJob')}
      >
        <Text style={styles.fabText}>＋  New Shoot</Text>
      </TouchableOpacity>
    </View>
  )
}

function getProgress(status: string): number {
  const steps: Record<string, number> = {
    pending: 5, processing: 15, model_done: 35,
    shots_done: 55, videos_done: 75, stitching: 90,
  }
  return steps[status] ?? 0
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  list: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  signOutText: { color: '#555', fontSize: 13 },
  jobCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  jobDate: { color: '#555', fontSize: 12, marginBottom: 8 },
  progressBar: { height: 3, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyGem: { fontSize: 40, color: '#333', marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: '#0a0a0a', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
})
