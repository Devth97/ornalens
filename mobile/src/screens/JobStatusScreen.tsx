import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, Share, Alert
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import { getJob } from '../lib/api'
import type { Job, AngleShot } from './types'

const PIPELINE_STEPS = [
  { key: 'processing',  label: 'Placing jewellery on model',   icon: '👗' },
  { key: 'model_done',  label: 'Generating 5 angle shots',     icon: '📸' },
  { key: 'shots_done',  label: 'Creating video clips (Kling)', icon: '🎬' },
  { key: 'videos_done', label: 'Stitching with transitions',    icon: '✂️' },
  { key: 'completed',   label: 'Final video ready!',           icon: '✅' },
]

const STATUS_ORDER = ['pending', 'processing', 'model_done', 'shots_done', 'videos_done', 'stitching', 'completed']

function getStepIndex(status: string): number {
  return STATUS_ORDER.indexOf(status)
}

// ─── Download helper ────────────────────────────────────────────────────────
async function downloadToGallery(url: string, filename: string, isVideo = false): Promise<void> {
  // Request permission
  const { status } = await MediaLibrary.requestPermissionsAsync()
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Allow storage access to save files to your gallery.')
    return
  }

  Alert.alert('Downloading…', `Saving ${filename} to your gallery`)

  try {
    // Download to temp cache first
    const ext = isVideo ? 'mp4' : 'jpg'
    const localPath = FileSystem.cacheDirectory + filename + '.' + ext
    const { uri } = await FileSystem.downloadAsync(url, localPath)

    // Save to device gallery
    const asset = await MediaLibrary.createAssetAsync(uri)

    // Put in a named album for easy finding
    const album = await MediaLibrary.getAlbumAsync('Ornalens')
    if (album === null) {
      await MediaLibrary.createAlbumAsync('Ornalens', asset, false)
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
    }

    Alert.alert('✅ Saved!', `${filename} saved to your gallery in the "Ornalens" album.`)
  } catch (e) {
    console.error('Download failed:', e)
    Alert.alert('Download failed', String(e))
  }
}

// ─── Download button component ──────────────────────────────────────────────
function DownloadBtn({ url, label, isVideo = false }: { url: string; label: string; isVideo?: boolean }) {
  const [loading, setLoading] = useState(false)

  const handlePress = async () => {
    setLoading(true)
    await downloadToGallery(url, label, isVideo)
    setLoading(false)
  }

  return (
    <TouchableOpacity style={styles.downloadBtn} onPress={handlePress} disabled={loading}>
      {loading
        ? <ActivityIndicator size="small" color="#D4AF37" />
        : <Text style={styles.downloadBtnText}>⬇  {isVideo ? 'Download Video' : 'Download Image'}</Text>
      }
    </TouchableOpacity>
  )
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function JobStatusScreen() {
  const route = useRoute<any>()
  const { jobId } = route.params
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  const loadJob = useCallback(async () => {
    try {
      const data = await getJob(jobId)
      setJob(data)
    } catch (e) {
      console.error('Failed to load job:', e)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadJob()
    const interval = setInterval(() => {
      if (job?.status !== 'completed' && job?.status !== 'failed') {
        loadJob()
      }
    }, 6000)
    return () => clearInterval(interval)
  }, [loadJob, job?.status])

  const shareVideo = async () => {
    if (!job?.final_video_url) return
    try {
      await Share.share({
        message: `Check out this AI-generated jewellery video: ${job.final_video_url}`,
        url: job.final_video_url,
      })
    } catch (e) {
      console.error('Share failed:', e)
    }
  }

  if (loading || !job) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    )
  }

  const currentStepIdx = getStepIndex(job.status)
  const isFailed = job.status === 'failed'
  const isDone = job.status === 'completed'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Job title */}
      <Text style={styles.title} numberOfLines={2}>
        {job.jewellery_description ?? 'Jewellery Shoot'}
      </Text>

      {/* Pipeline progress */}
      {!isFailed && (
        <View style={styles.pipelineCard}>
          {PIPELINE_STEPS.map((step) => {
            const stepStatus = getStepIndex(step.key)
            const done = currentStepIdx >= stepStatus
            const active = currentStepIdx === stepStatus - 1 || (step.key === 'processing' && currentStepIdx === 1)
            return (
              <View key={step.key} style={styles.pipelineStep}>
                <View style={[
                  styles.stepDot,
                  done ? styles.stepDotDone : active ? styles.stepDotActive : styles.stepDotPending
                ]}>
                  {done && !active
                    ? <Text style={styles.stepDotCheck}>✓</Text>
                    : active
                    ? <ActivityIndicator size="small" color="#D4AF37" />
                    : null
                  }
                </View>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                  {step.icon}  {step.label}
                </Text>
              </View>
            )
          })}
        </View>
      )}

      {/* Error state — show error but DON'T hide images/videos below */}
      {isFailed && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Pipeline Failed</Text>
          <Text style={styles.errorMsg}>{job.error_message ?? 'Unknown error'}</Text>
          {(job.model_image_url || job.angle_shots?.length > 0) && (
            <Text style={styles.errorHint}>↓ Scroll down — your images and videos are still available below</Text>
          )}
        </View>
      )}

      {/* Model image */}
      {job.model_image_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model with Jewellery</Text>
          <Image source={{ uri: job.model_image_url }} style={styles.modelImage} resizeMode="cover" />
          <DownloadBtn
            url={job.model_image_url}
            label={`model_${jobId.slice(0, 8)}`}
          />
        </View>
      )}

      {/* Angle shots grid */}
      {job.angle_shots?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Angle Shots ({job.angle_shots.length})</Text>
            {/* Download all shots button */}
            <TouchableOpacity
              style={styles.downloadAllBtn}
              onPress={async () => {
                for (let i = 0; i < job.angle_shots.length; i++) {
                  const shot = job.angle_shots[i]
                  if (shot.image_url) {
                    await downloadToGallery(
                      shot.image_url,
                      `shot_${shot.angle}_${jobId.slice(0, 8)}`,
                      false
                    )
                  }
                }
              }}
            >
              <Text style={styles.downloadAllText}>⬇ All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shotsGrid}>
            {job.angle_shots.map((shot: AngleShot, i: number) => (
              <View key={i} style={styles.shotCell}>
                {shot.image_url ? (
                  <>
                    <Image source={{ uri: shot.image_url }} style={styles.shotImage} resizeMode="cover" />
                    <DownloadBtn
                      url={shot.image_url}
                      label={`shot_${shot.angle}_${jobId.slice(0, 8)}`}
                    />
                  </>
                ) : (
                  <View style={styles.shotPlaceholder}>
                    <ActivityIndicator color="#D4AF37" size="small" />
                  </View>
                )}
                <Text style={styles.shotAngle}>{shot.angle.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Individual video clips — show as soon as videos are ready */}
      {(job.status === 'videos_done' || job.status === 'stitching' || job.status === 'completed' || job.status === 'failed') &&
        job.angle_shots?.some((s: AngleShot) => s.video_url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Clips ▶</Text>
          {job.angle_shots.filter((s: AngleShot) => s.video_url).map((shot: AngleShot, i: number) => (
            <View key={i} style={styles.clipRow}>
              <Text style={styles.clipLabel}>{shot.angle.replace('_', ' ')}</Text>
              <View style={styles.clipBtns}>
                <TouchableOpacity
                  style={styles.watchSmallBtn}
                  onPress={() => Linking.openURL(shot.video_url!)}
                >
                  <Text style={styles.watchSmallText}>▶ Watch</Text>
                </TouchableOpacity>
                <DownloadBtn
                  url={shot.video_url!}
                  label={`clip_${shot.angle}_${jobId.slice(0, 8)}`}
                  isVideo
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Final video */}
      {isDone && job.final_video_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Final Video ✦</Text>
          <View style={styles.videoCard}>
            <Text style={styles.videoUrl} numberOfLines={2}>{job.final_video_url}</Text>

            <TouchableOpacity
              style={styles.watchBtn}
              onPress={() => Linking.openURL(job.final_video_url!)}
            >
              <Text style={styles.watchBtnText}>▶  Watch Video</Text>
            </TouchableOpacity>

            {/* Download final video */}
            <DownloadBtn
              url={job.final_video_url}
              label={`final_video_${jobId.slice(0, 8)}`}
              isVideo
            />

            <TouchableOpacity style={styles.shareBtn} onPress={shareVideo}>
              <Text style={styles.shareBtnText}>Share with Client</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isDone && !isFailed && (
        <Text style={styles.processingHint}>
          This usually takes 8–15 minutes. You can close this screen — we'll keep processing in the background.
        </Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 20, lineHeight: 30 },

  pipelineCard: {
    backgroundColor: '#141414', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#1f1f1f', marginBottom: 24,
  },
  pipelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepDot: { width: 28, height: 28, borderRadius: 14, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  stepDotDone:    { backgroundColor: '#22C55E' },
  stepDotActive:  { backgroundColor: '#D4AF3722', borderWidth: 2, borderColor: '#D4AF37' },
  stepDotPending: { backgroundColor: '#1f1f1f' },
  stepDotCheck:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepLabel:     { color: '#555', fontSize: 14 },
  stepLabelDone: { color: '#fff' },

  errorCard: { backgroundColor: '#EF444420', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EF4444', marginBottom: 20 },
  errorTitle: { color: '#EF4444', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  errorMsg:   { color: '#EF4444aa', fontSize: 11, lineHeight: 18 },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#D4AF37', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  modelImage: { width: '100%', height: 360, borderRadius: 14, borderWidth: 1, borderColor: '#D4AF3722', marginBottom: 8 },

  shotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shotCell:  { width: '47%', marginBottom: 4 },
  shotImage: { width: '100%', height: 160, borderRadius: 10, marginBottom: 6 },
  shotPlaceholder: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  shotAngle: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 2, textTransform: 'capitalize' },

  videoCard: { backgroundColor: '#141414', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#D4AF3744', gap: 10 },
  videoUrl:  { color: '#555', fontSize: 11 },
  watchBtn:  { backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  watchBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 15 },
  shareBtn:  { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  shareBtnText: { color: '#D4AF37', fontWeight: '700', fontSize: 14 },

  // Download buttons
  downloadBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF3744',
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  downloadBtnText: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },

  downloadAllBtn: {
    backgroundColor: '#D4AF3722',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D4AF3755',
  },
  downloadAllText: { color: '#D4AF37', fontSize: 12, fontWeight: '700' },

  processingHint: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginTop: 8 },
  errorHint: { color: '#D4AF37', fontSize: 12, marginTop: 8, fontWeight: '600' },

  // Individual clip rows
  clipRow: { backgroundColor: '#141414', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  clipLabel: { color: '#fff', fontSize: 13, fontWeight: '700', textTransform: 'capitalize', marginBottom: 8 },
  clipBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  watchSmallBtn: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  watchSmallText: { color: '#0a0a0a', fontWeight: '700', fontSize: 12 },
})
