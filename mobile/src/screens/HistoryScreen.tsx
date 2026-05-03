import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator,
  Modal, Share, Alert, TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import { listJobs } from '../lib/api'
import { TEMPLATES } from '../data/templates'
import type { Job } from './types'

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  pending:    { text: '#888',     bg: '#88888822' },
  processing: { text: '#3B82F6', bg: '#3B82F622' },
  completed:  { text: '#22C55E', bg: '#22C55E22' },
  failed:     { text: '#EF4444', bg: '#EF444422' },
}

export default function HistoryScreen() {
  const navigation = useNavigation<any>()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Job | null>(null)

  const loadJobs = useCallback(async () => {
    try {
      const data = await listJobs()
      setJobs(data ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (!msg.includes('Clerk not ready') && !msg.includes('Not authenticated')) {
        console.error('History load error:', e)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs
    const q = search.toLowerCase()
    return jobs.filter(j =>
      (j.jewellery_description ?? '').toLowerCase().includes(q) || j.status.includes(q)
    )
  }, [jobs, search])

  const handleSave = async (url: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow access to save photos.'); return }
      const dest = FileSystem.cacheDirectory + `ornalens-${Date.now()}.jpg`
      await FileSystem.downloadAsync(url, dest)
      await MediaLibrary.saveToLibraryAsync(dest)
      FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {})
      Alert.alert('Saved!', 'Image saved to your gallery.')
    } catch { Alert.alert('Error', 'Could not save the image.') }
  }

  const handleShare = async (url: string, desc?: string) => {
    try { await Share.share({ message: `${desc ?? 'Jewellery shoot'} — ${url}`, url }) }
    catch { /* ignore */ }
  }

  const renderItem = ({ item }: { item: Job }) => {
    const sc = STATUS_COLORS[item.status] ?? { text: '#888', bg: '#88888822' }
    const templateId = (item as any).model_style?.template_id

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <TouchableOpacity
            style={styles.thumb}
            onPress={() => item.model_image_url && setPreview(item)}
          >
            {item.model_image_url
              ? <Image source={{ uri: item.model_image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <Text style={{ color: '#C8B49A', fontSize: 22 }}>◆</Text>
            }
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.jewellery_description ?? 'Jewellery shoot'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.badgeText, { color: sc.text }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              {item.status === 'completed' && (
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>450 tokens</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, !item.model_image_url && styles.disabled]}
            onPress={() => item.model_image_url && setPreview(item)}
          >
            <Text style={styles.actionText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, !item.model_image_url && styles.disabled]}
            onPress={() => item.model_image_url && handleSave(item.model_image_url)}
          >
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (!templateId) return
              const tpl = TEMPLATES.find(t => t.id === templateId)
              if (!tpl) return
              navigation.navigate('Create', { screen: 'TemplatePhotoshoot', params: { template: tpl } })
            }}
          >
            <Text style={styles.actionText}>Redo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn, !item.model_image_url && styles.disabled]}
            onPress={() => item.model_image_url && handleShare(item.model_image_url, item.jewellery_description)}
          >
            <Text style={[styles.actionText, { color: '#9A6F0A' }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#D4AF37" size="large" /></View>
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by attributes..."
          placeholderTextColor="#B0A090"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={j => j.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs() }} tintColor="#D4AF37" />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🕐</Text>
            <Text style={styles.emptyTitle}>No shoots yet</Text>
            <Text style={styles.emptySub}>Your generations will appear here</Text>
          </View>
        }
      />

      {/* Lightbox */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          {preview && (
            <View style={styles.modalCard}>
              <Image source={{ uri: preview.model_image_url! }} style={styles.modalImage} resizeMode="contain" />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D4AF37' }]}
                  onPress={() => handleSave(preview.model_image_url!)}>
                  <Text style={{ color: '#1C1209', fontWeight: '800' }}>⬇ Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { borderWidth: 1, borderColor: '#9A6F0A' }]}
                  onPress={() => handleShare(preview.model_image_url!, preview.jewellery_description)}>
                  <Text style={{ color: '#9A6F0A', fontWeight: '700' }}>↗ Share</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setPreview(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  center:    { flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list:      { padding: 16, paddingBottom: 32 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DDD0',
    borderRadius: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 12,
  },
  searchIcon:  { color: '#A8957E', fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#1C1209', fontSize: 14, paddingVertical: 12 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8DDD0',
    marginBottom: 12, overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', padding: 14 },
  thumb: {
    width: 72, height: 72, borderRadius: 12, backgroundColor: '#F0EBE0',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  title:     { color: '#1C1209', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  badgeRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  tokenBadge: { backgroundColor: '#D4AF3728', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tokenBadgeText: { color: '#9A6F0A', fontSize: 11, fontWeight: '600' },
  date:      { color: '#A8957E', fontSize: 11 },

  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E8DDD0' },
  actionBtn: {
    flex: 1, paddingVertical: 11, alignItems: 'center',
    borderRightWidth: 1, borderRightColor: '#E8DDD0',
  },
  shareBtn:  { borderRightWidth: 0 },
  actionText: { color: '#4A3828', fontSize: 13, fontWeight: '600' },
  disabled:  { opacity: 0.35 },

  emptyTitle: { color: '#1C1209', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySub:   { color: '#7A6550', fontSize: 13 },

  modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E8DDD0' },
  modalImage: { width: '100%', aspectRatio: 1 },
  modalActions: { flexDirection: 'row', gap: 10, padding: 16 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14 },
})
