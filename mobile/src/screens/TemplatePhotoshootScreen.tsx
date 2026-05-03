import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { uploadJewelleryImage, generatePhotoshoot } from '../lib/api'
import type { Template, AspectRatio } from '../data/templates'

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:5', '3:2', '16:9', '9:16']
const QUALITY_OPTIONS = ['Standard', 'High'] as const

export default function TemplatePhotoshootScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const template: Template = route.params.template

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(template.defaultAspectRatio)
  const [quality, setQuality] = useState<'Standard' | 'High'>('Standard')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload jewellery images')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      quality: 0.9,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access required')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.9,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleGenerate = async () => {
    if (!imageUri) { Alert.alert('Photo required', 'Please upload a jewellery photo'); return }

    setLoading(true)
    try {
      setLoadingStep('Uploading image...')
      const imageUrl = await uploadJewelleryImage(imageUri)

      setLoadingStep('Generating photoshoot...')
      const result = await generatePhotoshoot({
        jewellery_image_url: imageUrl,
        template_id: template.id,
        prompt: template.prompt,
        additional_notes: additionalNotes.trim() || undefined,
        aspect_ratio: aspectRatio,
        quality,
      })

      navigation.navigate('PhotoResult', {
        resultImageUrl: result.image_url,
        templateTitle: template.title,
        jobId: result.job_id,
      })
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message ?? 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Template Preview */}
      <View style={styles.templatePreview}>
        <Image source={{ uri: template.thumbnail }} style={styles.templateThumb} resizeMode="cover" />
        <View style={styles.templateInfo}>
          <Text style={styles.templateTitle}>{template.title}</Text>
          <Text style={styles.templateCategory}>{template.category}</Text>
        </View>
      </View>

      {/* 1. Upload Jewellery */}
      <Text style={styles.sectionNum}>1. Upload Your Jewellery</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnIcon}>🖼</Text>
          <Text style={styles.photoBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
          <Text style={styles.photoBtnIcon}>📷</Text>
          <Text style={styles.photoBtnText}>Camera</Text>
        </TouchableOpacity>
      </View>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      {/* 2. Additional Notes (optional) */}
      <Text style={styles.sectionNum}>2. Additional Notes</Text>
      <Text style={styles.notesHint}>Optional — add any specific requirements for your photoshoot</Text>
      <TextInput
        style={styles.notesInput}
        value={additionalNotes}
        onChangeText={setAdditionalNotes}
        placeholder="e.g. Focus on the center diamond, show the side profile, warmer lighting..."
        placeholderTextColor="#444"
        multiline
        numberOfLines={3}
      />
      <View style={styles.aiHint}>
        <Text style={styles.aiHintIcon}>✦</Text>
        <Text style={styles.aiHintText}>
          Our AI uses a premium studio prompt tailored for this template. Your notes will fine-tune the result.
        </Text>
      </View>

      {/* 3. Image Options */}
      <Text style={styles.sectionNum}>3. Image Options</Text>

      <Text style={styles.optionLabel}>ASPECT RATIO</Text>
      <View style={styles.optionRow}>
        {ASPECT_RATIOS.map(ar => (
          <TouchableOpacity
            key={ar}
            style={[styles.optionChip, aspectRatio === ar && styles.optionChipActive]}
            onPress={() => setAspectRatio(ar)}
          >
            <Text style={[styles.optionChipText, aspectRatio === ar && styles.optionChipTextActive]}>
              {ar}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.optionLabel}>IMAGE QUALITY</Text>
      <View style={styles.optionRow}>
        {QUALITY_OPTIONS.map(q => (
          <TouchableOpacity
            key={q}
            style={[styles.qualityChip, quality === q && styles.qualityChipActive]}
            onPress={() => setQuality(q)}
          >
            <Text style={[styles.qualityChipText, quality === q && styles.qualityChipTextActive]}>
              {q}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, (loading || !imageUri) && styles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={loading || !imageUri}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#0a0a0a" style={{ marginRight: 8 }} />
            <Text style={styles.generateBtnText}>{loadingStep}</Text>
          </>
        ) : (
          <Text style={styles.generateBtnText}>✦  Generate Photoshoot</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 60 },

  templatePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4AF3744',
    marginBottom: 24,
  },
  templateThumb: { width: 80, height: 80 },
  templateInfo: { flex: 1, paddingHorizontal: 14 },
  templateTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  templateCategory: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },

  sectionNum: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 12 },

  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#D4AF3733',
  },

  notesHint: { color: '#666', fontSize: 12, marginBottom: 10, lineHeight: 18 },
  notesInput: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    lineHeight: 22,
  },
  aiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF3710',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  aiHintIcon: { color: '#D4AF37', fontSize: 16 },
  aiHintText: { color: '#D4AF37', fontSize: 12, flex: 1, lineHeight: 18 },

  optionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },

  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  optionChipActive: { backgroundColor: '#0a0a0a', borderColor: '#D4AF37' },
  optionChipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  optionChipTextActive: { color: '#D4AF37' },

  qualityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  qualityChipActive: { backgroundColor: '#0a0a0a', borderColor: '#D4AF37' },
  qualityChipText: { color: '#888', fontSize: 14, fontWeight: '700' },
  qualityChipTextActive: { color: '#D4AF37' },

  generateBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 16 },
})
