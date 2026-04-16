import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation } from '@react-navigation/native'
import { uploadJewelleryImage, createJob } from '../lib/api'

const SKIN_TONES = ['Fair', 'Medium', 'Dusky', 'Dark']
const BODY_TYPES = ['Slim', 'Athletic', 'Curvy', 'Plus']
const POSES = ['Standing', 'Seated', 'Candid', 'Runway walk']

export default function NewJobScreen() {
  const navigation = useNavigation<any>()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [skinTone, setSkinTone] = useState('Medium')
  const [bodyType, setBodyType] = useState('Slim')
  const [pose, setPose] = useState('Standing')
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

  const handleSubmit = async () => {
    if (!imageUri) { Alert.alert('Photo required', 'Please upload a jewellery photo'); return }
    if (!description.trim()) { Alert.alert('Description required', 'Describe the jewellery piece'); return }

    setLoading(true)
    try {
      setLoadingStep('Uploading image...')
      const imageUrl = await uploadJewelleryImage(imageUri)

      setLoadingStep('Creating job...')
      const jobId = await createJob({
        jewellery_image_url: imageUrl,
        jewellery_description: description.trim(),
        model_style: {
          skin_tone: skinTone.toLowerCase(),
          body_type: bodyType.toLowerCase(),
          pose: pose.toLowerCase(),
        },
      })

      navigation.replace('JobStatus', { jobId })
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message ?? 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Photo upload */}
      <Text style={styles.sectionTitle}>Jewellery Photo</Text>
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

      {/* Description */}
      <Text style={styles.sectionTitle}>Describe the Jewellery</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Diamond necklace with rose gold chain, kundan earrings..."
        placeholderTextColor="#444"
        multiline
        numberOfLines={3}
      />

      {/* Model options */}
      <Text style={styles.sectionTitle}>Model Preference</Text>

      <Text style={styles.optionLabel}>Skin Tone</Text>
      <View style={styles.optionRow}>
        {SKIN_TONES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.optionChip, skinTone === t && styles.optionChipSelected]}
            onPress={() => setSkinTone(t)}
          >
            <Text style={[styles.optionChipText, skinTone === t && styles.optionChipTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.optionLabel}>Build</Text>
      <View style={styles.optionRow}>
        {BODY_TYPES.map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.optionChip, bodyType === b && styles.optionChipSelected]}
            onPress={() => setBodyType(b)}
          >
            <Text style={[styles.optionChipText, bodyType === b && styles.optionChipTextSelected]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.optionLabel}>Pose Style</Text>
      <View style={styles.optionRow}>
        {POSES.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.optionChip, pose === p && styles.optionChipSelected]}
            onPress={() => setPose(p)}
          >
            <Text style={[styles.optionChipText, pose === p && styles.optionChipTextSelected]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (loading || !imageUri || !description) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading || !imageUri || !description.trim()}
      >
        {loading
          ? <>
              <ActivityIndicator color="#0a0a0a" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>{loadingStep}</Text>
            </>
          : <Text style={styles.submitBtnText}>◆  Generate Shoot  →</Text>
        }
      </TouchableOpacity>

      <Text style={styles.hint}>
        Pipeline: AI places jewellery on model → 5 angle shots → video clips → final edited video with dissolve transitions
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
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
    height: 220,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#D4AF3733',
  },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  optionLabel: { color: '#666', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  optionChipSelected: { backgroundColor: '#D4AF3722', borderColor: '#D4AF37' },
  optionChipText: { color: '#666', fontSize: 13, fontWeight: '600' },
  optionChipTextSelected: { color: '#D4AF37' },
  submitBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 16 },
  hint: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 18 },
})
