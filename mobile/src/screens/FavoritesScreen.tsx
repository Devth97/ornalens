import React, { useState, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, Dimensions
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { TEMPLATES, type Template } from '../data/templates'

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_GAP = 10
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2

// For now favorites are stored in memory. Will move to Supabase later.
// This screen shares favorites state via a simple global set — in the future
// we'll lift this into React Context or Zustand.
let _globalFavorites = new Set<string>()

export function setGlobalFavorites(favs: Set<string>) {
  _globalFavorites = favs
}

export function getGlobalFavorites(): Set<string> {
  return _globalFavorites
}

export default function FavoritesScreen() {
  const navigation = useNavigation<any>()
  const [, setRefresh] = useState(0)

  const favoriteTemplates = useMemo(() => {
    return TEMPLATES.filter(t => _globalFavorites.has(t.id))
  }, [_globalFavorites.size])

  const removeFavorite = (id: string) => {
    _globalFavorites.delete(id)
    setRefresh(n => n + 1)
  }

  const renderCard = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TemplatePhotoshoot', { template: item })}
      activeOpacity={0.85}
    >
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: item.thumbnail }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => removeFavorite(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.heartIcon}>♥</Text>
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
      <Text style={styles.header}>Favorites</Text>
      <FlatList
        data={favoriteTemplates}
        numColumns={2}
        keyExtractor={t => t.id}
        renderItem={renderCard}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>♡</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse templates and tap the heart icon to save your favorites
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { color: '#fff', fontSize: 24, fontWeight: '800', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },

  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },

  card: {
    width: CARD_WIDTH,
    backgroundColor: '#141414',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: CARD_WIDTH, backgroundColor: '#1a1a1a' },
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
  heartIcon: { fontSize: 16, color: '#EF4444' },

  cardInfo: { padding: 10 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#888', fontSize: 11, lineHeight: 16 },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, color: '#333', marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
})
