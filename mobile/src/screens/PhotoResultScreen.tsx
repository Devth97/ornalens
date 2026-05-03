import React, { useState } from 'react'
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Share
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'

export default function PhotoResultScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const { resultImageUrl, templateTitle, jobId } = route.params
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync(true)
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to save files to your gallery.')
      return
    }

    setDownloading(true)
    try {
      const localPath = FileSystem.cacheDirectory + `photoshoot_${jobId?.slice(0, 8) ?? 'result'}.jpg`
      const result = await FileSystem.downloadAsync(resultImageUrl, localPath)
      if (result.status !== 200) throw new Error(`Download failed — server returned ${result.status}`)
      await MediaLibrary.saveToLibraryAsync(result.uri)
      Alert.alert('✅ Saved!', 'Saved to your camera roll.')
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : String(e))
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this AI jewellery photoshoot: ${resultImageUrl}`,
        url: resultImageUrl,
      })
    } catch (e) {
      console.error('Share failed:', e)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{templateTitle}</Text>
      <Text style={styles.subtitle}>Your photoshoot is ready!</Text>

      <View style={styles.imageWrap}>
        <Image source={{ uri: resultImageUrl }} style={styles.resultImage} resizeMode="contain" />
      </View>

      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={downloading}>
        {downloading
          ? <ActivityIndicator color="#0a0a0a" />
          : <Text style={styles.downloadBtnText}>⬇  Download to Gallery</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share with Client</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.newBtnText}>✦  Create Another</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 60, alignItems: 'center' },

  title: { color: '#D4AF37', fontSize: 18, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 20, textAlign: 'center' },

  imageWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4AF3733',
    marginBottom: 24,
    backgroundColor: '#141414',
  },
  resultImage: { width: '100%', height: 400 },

  downloadBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  downloadBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 16 },

  shareBtn: {
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
  },
  shareBtnText: { color: '#D4AF37', fontWeight: '700', fontSize: 15 },

  newBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  newBtnText: { color: '#888', fontWeight: '600', fontSize: 14 },
})
