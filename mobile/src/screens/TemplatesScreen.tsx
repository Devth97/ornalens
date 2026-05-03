import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, StyleSheet, useWindowDimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { TEMPLATES, CATEGORIES, type Template, type TemplateCategory } from '../data/templates'

const CARD_GAP = 10
const H_PADDING = 16

export default function TemplatesScreen() {
  const navigation = useNavigation<any>()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const cardWidth = (screenWidth - H_PADDING * 2 - CARD_GAP) / 2
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = TEMPLATES
    if (activeCategory !== 'All') {
      list = list.filter(t => t.category === activeCategory)
    }
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

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const renderCard = ({ item }: { item: Template }) => (
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

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search photoshoot styles..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Category Tabs — horizontally scrollable */}
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

      {/* Template Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={t => t.id}
        renderItem={renderCard}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchIcon: { color: '#666', fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },

  categoryRow: { paddingHorizontal: H_PADDING, paddingBottom: 12, paddingRight: 32 },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
  },
  categoryChipActive: { backgroundColor: '#0a0a0a', borderColor: '#D4AF37' },
  categoryChipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: '#D4AF37' },

  grid: { paddingHorizontal: H_PADDING },
  gridRow: { justifyContent: 'space-between' as const, marginBottom: CARD_GAP },

  card: {
    backgroundColor: '#141414',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  cardImageWrap: { position: 'relative' as const },
  cardImage: { width: '100%', backgroundColor: '#1a1a1a' },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: { color: '#D4AF37', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: { fontSize: 16, color: '#999' },
  heartActive: { color: '#EF4444' },

  cardInfo: { padding: 10 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#888', fontSize: 11, lineHeight: 16 },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14 },
})
