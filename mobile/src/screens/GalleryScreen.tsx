import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator,
  Modal, Share, Alert, useWindowDimensions,
} from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import { listJobs } from '../lib/api'
import type { Job } from './types'

const COLS = 2

export default function GalleryScreen() {
  const { width } = useWindowDimensions()
  const ITEM_SIZE = (width - 16 * 2 - 8) / COLS
  const [images, setImages] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [preview, setPreview] = useState<Job | null>(null)

  const loadImages = useCallback(async () => {
    try {
      const data = await listJobs()
      const completed = (data ?? []).filter(
        (j: Job) => j.status === 'completed' && j.model_image_url,
      )
      setImages(completed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (!msg.includes('Clerk not ready') && !msg.includes('Not authenticated')) {
        console.error('Gallery load error:', e)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadImages() }, [loadImages])

  const handleSave = async (url: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to save photos.')
        return
      }
      const dest = FileSystem.cacheDirectory + `ornalens-${Date.now()}.jpg`
      await FileSystem.downloadAsync(url, dest)
      await MediaLibrary.saveToLibraryAsync(dest)
      FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {})
      Alert.alert('Saved!', 'Image saved to your gallery.')
    } catch {
      Alert.alert('Error', 'Could not save the image.')
    }
  }

  const handleShare = async (url: string, desc?: string) => {
    try {
      await Share.share({ message: `${desc ?? 'Jewellery shoot'} — ${url}`, url })
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    )
  }

  if (images.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🖼</Text>
        <Text style={styles.emptyTitle}>No images yet</Text>
        <Text style={styles.emptySub}>Completed AI photoshoots will appear here</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={j => j.id}
        numColumns={COLS}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadImages() }} tintColor="#D4AF37" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.cell, { width: ITEM_SIZE, height: ITEM_SIZE }]} onPress={() => setPreview(item)}>
            <Image source={{ uri: item.model_image_url! }} style={styles.cellImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
      />

      {/* Lightbox */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          {preview && (
            <View style={styles.modalCard}>
              <Image
                source={{ uri: preview.model_image_url! }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Text style={styles.modalDesc} numberOfLines={1}>
                {preview.jewellery_description ?? 'Jewellery shoot'}
              </Text>
              <Text style={styles.modalDate}>
                {new Date(preview.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.goldBg]}
                  onPress={() => handleSave(preview.model_image_url!)}
                >
                  <Text style={styles.goldBtnText}>⬇ Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.outlineBtn]}
                  onPress={() => handleShare(preview.model_image_url!, preview.jewellery_description)}
                >
                  <Text style={styles.outlineBtnText}>↗ Share</Text>
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
  center:    { flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', alignItems: 'center' },
  grid:      { padding: 16, paddingBottom: 32 },

  cell: {
    borderRadius: 12, overflow: 'hidden',
    margin: 4, backgroundColor: '#F0EBE0',
  },
  cellImage: { width: '100%', height: '100%' },

  emptyTitle: { color: '#1C1209', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySub:   { color: '#7A6550', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },

  modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E8DDD0' },
  modalImage: { width: '100%', aspectRatio: 1 },
  modalDesc: { color: '#1C1209', fontWeight: '700', fontSize: 15, paddingHorizontal: 16, paddingTop: 14 },
  modalDate: { color: '#A8957E', fontSize: 12, paddingHorizontal: 16, paddingBottom: 12, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },

  actionBtn:   { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  goldBg:      { backgroundColor: '#D4AF37' },
  goldBtnText: { color: '#1C1209', fontWeight: '800', fontSize: 14 },
  outlineBtn:  { borderWidth: 1, borderColor: '#9A6F0A' },
  outlineBtnText: { color: '#9A6F0A', fontWeight: '700', fontSize: 14 },

  closeBtn:     { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14 },
})
