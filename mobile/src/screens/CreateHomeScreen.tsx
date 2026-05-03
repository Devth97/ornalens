import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, StyleSheet, useWindowDimensions, RefreshControl,
  ActivityIndicator, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import { TEMPLATES, CATEGORIES, type Template, type TemplateCategory } from '../data/templates'
import { listJobs } from '../lib/api'
import type { Job } from './types'

type Mode = 'photoshoot' | 'video'

const CARD_GAP   = 10
const H_PADDING  = 16

const STATUS_COLORS: Record<string, string> = {
  pending:    '#888',
  processing: '#3B82F6',
  model_done: '#8B5CF6',
  shots_done: '#F59E0B',
  videos_done:'#10B981',
  stitching:  '#F97316',
  completed:  '#22C55E',
  failed:     '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Queued',
  processing: 'Placing jewellery...',
  model_done: 'Generating shots...',
  shots_done: 'Creating videos...',
  videos_done:'Stitching video...',
  stitching:  'Final render...',
  completed:  'Ready ✓',
  failed:     'Failed ✗',
}

export default function CreateHomeScreen() {
  const navigation = useNavigation<any>()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const isFocused = useIsFocused()
  const [mode, setMode] = useState<Mode>('photoshoot')

  // ── Photoshoot state ────────────────────────────────────────────────────────
  const cardWidth = (screenWidth - H_PADDING * 2 - CARD_GAP) / 2
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = TEMPLATES
    if (activeCategory !== 'All') list = list.filter(t => t.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCategory, search])

  const toggleFavorite = (id: string) =>
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // ── Video Shoot state ───────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadJobs = useCallback(async () => {
    try {
      const data = await listJobs()
      setJobs(data ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (!msg.includes('Clerk not ready') && !msg.includes('Not authenticated')) {
        console.error('Video jobs load error:', e)
      }
    } finally {
      setLoadingJobs(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (mode === 'video' && isFocused) {
      setLoadingJobs(true)
      loadJobs()
      const interval = setInterval(loadJobs, 8000)
      return () => clearInterval(interval)
    }
  }, [mode, isFocused, loadJobs])

  // ── Renderers ───────────────────────────────────────────────────────────────
  const renderTemplateCard = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={() => navigation.navigate('TemplatePhotoshoot', { template: item })}
      activeOpacity={0.85}
    >
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: item.thumbnail }} style={[styles.cardImage, { height: cardWidth }]} resizeMode="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.heartIcon, favorites.has(item.id) && styles.heartActive]}>
            {favorites.has(item.id) ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  )

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobStatus', { jobId: item.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.jewellery_description ?? 'Jewellery shoot'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? '#888') + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? '#888' }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.jobDate}>
        {new Date(item.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </Text>
      {item.status !== 'completed' && item.status !== 'failed' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${getProgress(item.status)}%`,
            backgroundColor: STATUS_COLORS[item.status] ?? '#888',
          }]} />
        </View>
      )}
    </TouchableOpacity>
  )

  // ── Shared top switcher ─────────────────────────────────────────────────────
  const TopSwitcher = (
    <View style={styles.switcher}>
      <TouchableOpacity
        style={[styles.switcherBtn, mode === 'photoshoot' && styles.switcherBtnActive]}
        onPress={() => setMode('photoshoot')}
      >
        <Text style={[styles.switcherIcon, mode === 'photoshoot' && styles.switcherTextActive]}>📷</Text>
        <Text style={[styles.switcherLabel, mode === 'photoshoot' && styles.switcherTextActive]}>
          Photoshoot
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.switcherBtn, mode === 'video' && styles.switcherBtnActive]}
        onPress={() => setMode('video')}
      >
        <Text style={[styles.switcherIcon, mode === 'video' && styles.switcherTextActive]}>🎬</Text>
        <Text style={[styles.switcherLabel, mode === 'video' && styles.switcherTextActive]}>
          Video Shoot
        </Text>
      </TouchableOpacity>
    </View>
  )

  // ── Photoshoot UI ───────────────────────────────────────────────────────────
  if (mode === 'photoshoot') {
    return (
      <View style={styles.container}>
        {TopSwitcher}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search photoshoot styles..."
            placeholderTextColor="#B0A090"
          />
        </View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={c => c}
          contentContainerStyle={styles.categoryRow}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          )}
        />
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={t => t.id}
          renderItem={renderTemplateCard}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No templates found</Text>
            </View>
          }
        />
      </View>
    )
  }

  // ── Video Shoot UI ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {TopSwitcher}
      {loadingJobs
        ? <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={jobs}
            keyExtractor={j => j.id}
            renderItem={renderJobCard}
            contentContainerStyle={[styles.jobList, { paddingBottom: 8 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadJobs() }}
                tintColor="#D4AF37"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyTitle}>No video shoots yet</Text>
                <Text style={styles.emptyText}>
                  Tap below to create your first AI jewellery video shoot
                </Text>
              </View>
            }
          />
        )
      }
      {/* FAB as a regular bottom view — no absolute positioning */}
      <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewJob')}>
          <Text style={styles.fabText}>＋  New Video Shoot</Text>
        </TouchableOpacity>
      </View>
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
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  // ── Switcher ──────────────────────────────────────────────────────────────
  switcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F0EBE0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    padding: 4,
    gap: 4,
  },
  switcherBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10,
  },
  switcherBtnActive: { backgroundColor: '#D4AF37' },
  switcherIcon:      { fontSize: 16 },
  switcherLabel:     { color: '#A8957E', fontWeight: '700', fontSize: 14 },
  switcherTextActive: { color: '#1C1209' },

  // ── Photoshoot ────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    marginHorizontal: H_PADDING, marginTop: 10, marginBottom: 8,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#E8DDD0',
  },
  searchIcon:  { color: '#A8957E', fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#1C1209', fontSize: 15, paddingVertical: 12 },

  categoryRow: { paddingHorizontal: H_PADDING, paddingBottom: 12, paddingRight: 32 },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 10, minHeight: 40,
    borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DDD0',
    justifyContent: 'center',
  },
  categoryChipActive:     { backgroundColor: '#FAF7F2', borderColor: '#9A6F0A' },
  categoryChipText:       { color: '#A8957E', fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: '#9A6F0A' },

  grid:    { paddingHorizontal: H_PADDING },
  gridRow: { justifyContent: 'space-between' as const, marginBottom: CARD_GAP },

  card: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E8DDD0' },
  cardImageWrap:     { position: 'relative' as const },
  cardImage:         { width: '100%', backgroundColor: '#F0EBE0' },
  categoryBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  categoryBadgeText: { color: '#F5E8C0', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  heartBtn: {
    position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  heartIcon:   { fontSize: 16, color: '#C8B49A' },
  heartActive: { color: '#EF4444' },
  cardInfo:    { padding: 10 },
  cardTitle:   { color: '#1C1209', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardDesc:    { color: '#7A6550', fontSize: 11, lineHeight: 16 },

  // ── Video Shoot ───────────────────────────────────────────────────────────
  jobList: { padding: 16 },
  jobCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E8DDD0',
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle:  { color: '#1C1209', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  jobDate:     { color: '#A8957E', fontSize: 12, marginBottom: 8 },
  progressBar: { height: 3, backgroundColor: '#E8DDD0', borderRadius: 2, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 2 },

  fabWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: '#FAF7F2',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
  },
  fab: {
    backgroundColor: '#D4AF37', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: '#B8860B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 },
    }),
  },
  fabText: { color: '#1C1209', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  // ── Shared ────────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon:  { fontSize: 36, marginBottom: 12 },
  emptyTitle: { color: '#1C1209', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText:  { color: '#7A6550', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
})
