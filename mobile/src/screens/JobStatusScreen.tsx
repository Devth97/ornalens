import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, Share, Alert
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { getJob } from '../lib/api'
import type { Job, AngleShot } from './types'

const PIPELINE_STEPS = [
  { key: 'processing',  label: 'Placing jewellery on model',   icon: '👗' },
  { key: 'model_done',  label: 'Generating 5 angle shots',     icon: '📸' },
  { key: 'shots_done',  label: 'Creating video clips (Veo 3)', icon: '🎬' },
  { key: 'videos_done', label: 'Stitching with transitions',    icon: '✂️' },
  { key: 'completed',   label: 'Final video ready!',           icon: '✅' },
]

const STATUS_ORDER = ['pending', 'processing', 'model_done', 'shots_done', 'videos_done', 'stitching', 'completed']

function getStepIndex(status: string): number {
  return STATUS_ORDER.indexOf(status)
}

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
    // Poll every 6s while job is in progress
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
          {PIPELINE_STEPS.map((step, idx) => {
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

      {/* Error state */}
      {isFailed && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Pipeline Failed</Text>
          <Text style={styles.errorMsg}>{job.error_message ?? 'Unknown error'}</Text>
        </View>
      )}

      {/* Model image (step 1 output) */}
      {job.model_image_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model with Jewellery</Text>
          <Image source={{ uri: job.model_image_url }} style={styles.modelImage} resizeMode="cover" />
        </View>
      )}

      {/* Angle shots grid */}
      {job.angle_shots?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Angle Shots ({job.angle_shots.length})</Text>
          <View style={styles.shotsGrid}>
            {job.angle_shots.map((shot: AngleShot, i: number) => (
              <View key={i} style={styles.shotCell}>
                {shot.image_url
                  ? <Image source={{ uri: shot.image_url }} style={styles.shotImage} resizeMode="cover" />
                  : <View style={styles.shotPlaceholder}>
                      <ActivityIndicator color="#D4AF37" size="small" />
                    </View>
                }
                <Text style={styles.shotAngle}>{shot.angle.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
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
            <TouchableOpacity style={styles.shareBtn} onPress={shareVideo}>
              <Text style={styles.shareBtnText}>Share with Client</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Still processing */}
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
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    marginBottom: 24,
  },
  pipelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone:    { backgroundColor: '#22C55E' },
  stepDotActive:  { backgroundColor: '#D4AF3722', borderWidth: 2, borderColor: '#D4AF37' },
  stepDotPending: { backgroundColor: '#1f1f1f' },
  stepDotCheck:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepLabel:     { color: '#555', fontSize: 14 },
  stepLabelDone: { color: '#fff' },
  errorCard: { backgroundColor: '#EF444420', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EF4444', marginBottom: 20 },
  errorTitle: { color: '#EF4444', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  errorMsg: { color: '#EF4444aa', fontSize: 13, lineHeight: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 },
  modelImage: { width: '100%', height: 360, borderRadius: 14, borderWidth: 1, borderColor: '#D4AF3722' },
  shotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shotCell: { width: '47%' },
  shotImage: { width: '100%', height: 160, borderRadius: 10 },
  shotPlaceholder: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  shotAngle: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 4, textTransform: 'capitalize' },
  videoCard: { backgroundColor: '#141414', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#D4AF3744', gap: 12 },
  videoUrl: { color: '#555', fontSize: 11 },
  watchBtn: { backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  watchBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 15 },
  shareBtn: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  shareBtnText: { color: '#D4AF37', fontWeight: '700', fontSize: 14 },
  processingHint: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginTop: 8 },
})
