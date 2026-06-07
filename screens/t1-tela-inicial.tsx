import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Truck, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../components/ui/sonner';
import { useAppContext } from '../context/AppContext';
import { getAllActiveAnuncios, getNearbyActiveAnuncios } from '../src/services/anuncioService';
import { geocodeBusinessAddress } from '../src/services/geocodingService';
import DistanciaCardAnuncioSMOP from '../components/DistanciaCardAnuncioSMOP';

/** Degradê da barra superior — transição suave azul → verde */
const HEADER_GRADIENT = {
  light: {
    colors: ['#38bdf8', '#22d3ee', '#14b8a6', '#2dd4bf', '#4ade80'] as const,
    locations: [0, 0.22, 0.48, 0.72, 1] as const,
  },
  dark: {
    colors: ['#0f172a', '#152a4a', '#1a3378', '#1e3a8a'] as const,
    locations: [0, 0.33, 0.66, 1] as const,
  },
};
const HEADER_GRADIENT_START = { x: 0, y: 0 };
const HEADER_GRADIENT_END = { x: 1, y: 0 };

const MIN_RADIUS_KM = 0.5;
const MAX_RADIUS_KM = 8;
const DEFAULT_RADIUS_KM = 1;
const GEO_FETCH_RADIUS_KM = MAX_RADIUS_KM;

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const CATEGORIES = [
  'Imperdíveis',
  'Alimentação & Restaurantes',
  'Artesanato',
  'Beleza & Estética',
  'Cafés & Padarias',
  'Casa & Construção',
  'Educação & Cursos',
  'Entretenimento & Lazer',
  'Entrega Rápida na Região',
  'Eventos',
  'Limpeza & Manutenção',
  'Moda & Vestuário',
  'Pet Shop & Veterinária',
  'Presentes & Joias',
  'Saúde & Fitness',
  'Serviços Automotivos',
  'Tecnologia & Informática',
];

export default function T1TelaInicial() {
  const { navigateTo, setSelectedBusiness, favorites, toggleFavorite, isDarkMode, businesses, locationSettings, userProfile } = useAppContext();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [isGeoSearching, setIsGeoSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState<null | { lat: number; lon: number }>(null);
  const geoCacheRef = useRef<{ key: string; businesses: any[] } | null>(null);

  const stableNumericIdFromString = (value: string): number => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const mapAnuncioToBusiness = (anuncio: any) => {
    const fallbackId = anuncio.id
      ? stableNumericIdFromString(anuncio.id)
      : stableNumericIdFromString(`${anuncio.name}-${anuncio.userId}`);

    return {
      id: fallbackId,
      firestoreId: anuncio.id,
      name: anuncio.name,
      category: anuncio.category,
      categories: [anuncio.category],
      location: anuncio.location,
      cep: anuncio.cep,
      street: anuncio.street,
      neighborhood: anuncio.neighborhood,
      city: anuncio.city,
      state: anuncio.state,
      number: anuncio.number,
      phone: anuncio.phone,
      whatsapp: anuncio.whatsapp,
      description: anuncio.description,
      image: anuncio.fotos?.[0] || null,
      lat: anuncio.lat,
      lon: anuncio.lon,
      origemGeo: anuncio.origemGeo ?? null,
      instagram: anuncio.instagram,
      facebook: anuncio.facebook,
      pinterest: anuncio.pinterest,
      owner: anuncio.userEmail || null,
      ownerId: anuncio.userId || null,
      entregaRapida: anuncio.entregaRapida,
      contactVisibility: anuncio.contactVisibility,
    };
  };

  useEffect(() => {
    let active = true;

    const resolveCenter = async () => {
      if (locationSettings?.coords && typeof locationSettings.coords.lat === 'number' && typeof locationSettings.coords.lon === 'number') {
        if (active) setSearchCenter(locationSettings.coords);
        return;
      }

      const profileLat = toFiniteNumber(userProfile?.lat);
      const profileLon = toFiniteNumber(userProfile?.lon);
      if (profileLat != null && profileLon != null) {
        if (active) setSearchCenter({ lat: profileLat, lon: profileLon });
        return;
      }

      const profileHasAddress = Boolean(
        userProfile?.cep || userProfile?.street || userProfile?.number || userProfile?.neighborhood || userProfile?.city || userProfile?.state
      );

      if (profileHasAddress) {
        try {
          const geo = await geocodeBusinessAddress({
            cep: userProfile?.cep,
            street: userProfile?.street,
            number: userProfile?.number,
            neighborhood: userProfile?.neighborhood,
            city: userProfile?.city,
            state: userProfile?.state,
            country: 'Brasil',
          });
          if (!active) return;
          if (geo) setSearchCenter({ lat: geo.lat, lon: geo.lon });
          return;
        } catch {
          if (active) setSearchCenter(null);
          return;
        }
      }

      if (active) setSearchCenter(null);
    };

    void resolveCenter();
    return () => { active = false; };
  }, [locationSettings, userProfile]);

  const { width } = useWindowDimensions();
  const GRID_GAP = 12;
  const H_PADDING = 32;
  const contentW = Math.max(280, width - H_PADDING);

  const numColumns = width >= 1200 ? 4 : width >= 900 ? 3 : width >= 640 ? 2 : 1;
  const showCategoryChipRow = Platform.OS === 'web' && width >= 768;
  const cardWidth =
    numColumns === 1
      ? Math.min(contentW, Platform.OS === 'web' ? 640 : 560)
      : Math.max(220, Math.floor((contentW - GRID_GAP * (numColumns - 1)) / numColumns));

  const cardOuterStyle = {
    width: cardWidth,
    minWidth: cardWidth,
    maxWidth: cardWidth,
  };

  useEffect(() => {
    if (!searchCenter) {
      geoCacheRef.current = null;
    }
  }, [searchCenter]);

  useEffect(() => {
    let isActive = true;

    const runFilters = async () => {
      const center = searchCenter;
      const radiusKm = locationSettings?.radiusKm || DEFAULT_RADIUS_KM;

      let baseBusinesses = businesses;
      if (center) {
        const businessesSignature = (businesses || [])
          .map((b: any) => String(b.firestoreId || b.id || b.name || ''))
          .join('|');
        const geoCacheKey = `${center.lat.toFixed(5)}|${center.lon.toFixed(5)}|${businessesSignature}`;

        if (geoCacheRef.current?.key === geoCacheKey) {
          baseBusinesses = geoCacheRef.current.businesses;
        } else {
          setIsGeoSearching(true);
          try {
            let nearby = await getNearbyActiveAnuncios({ center, radiusKm: GEO_FETCH_RADIUS_KM });
            if (nearby.length === 0) {
              nearby = await getAllActiveAnuncios();
            }

            const existingByFirestoreId = new Map(
              (businesses || [])
                .filter((b: any) => typeof b.firestoreId === 'string' && b.firestoreId)
                .map((b: any) => [b.firestoreId, b])
            );

            baseBusinesses = nearby.map((anuncio) => {
              const matched = anuncio.id ? existingByFirestoreId.get(anuncio.id) : null;
              return matched || mapAnuncioToBusiness(anuncio);
            });

            geoCacheRef.current = { key: geoCacheKey, businesses: baseBusinesses };
          } catch {
            baseBusinesses = businesses;
          } finally {
            if (isActive) setIsGeoSearching(false);
          }
        }
      }

      let results = baseBusinesses.map(b => {
        let distanceM = null;
        if (center && typeof b.lat === 'number' && typeof b.lon === 'number') {
          distanceM = haversineM(center.lat, center.lon, b.lat, b.lon);
        }
        return { ...b, distanceM };
      });

      if (selectedCategories.length > 0) {
        results = results.filter(b => {
          const categories = Array.isArray(b.categories) ? b.categories : [];
          if (selectedCategories.includes('Entrega Rápida na Região')) {
            const hasDelivery = b.entregaRapida === true;
            const hasOtherCategory = categories.some(cat => selectedCategories.filter(c => c !== 'Entrega Rápida na Região').includes(cat));
            return selectedCategories.length > 1 ? (hasDelivery && hasOtherCategory) : hasDelivery;
          }
          return categories.some(cat => selectedCategories.includes(cat));
        });
      }

      if (center) {
        const maxDistanceM = radiusKm * 1000;
        results = results.filter(b => b.distanceM != null && b.distanceM <= maxDistanceM);
        results.sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
      }

      if (isActive) setFilteredBusinesses(results);
    };

    void runFilters();
    return () => { isActive = false; };
  }, [selectedCategories, businesses, locationSettings, searchCenter]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  return (
    <LayoutRN>
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.filtersCard, isDarkMode && styles.filtersCardDark]}>
          <View style={styles.filterGroup}>
            {showCategoryChipRow ? (
              <View style={styles.categoryWebRow}>
                <Label style={[styles.categoryLabelInline, isDarkMode && styles.categoryLabelInlineDark]}>Categorias</Label>
                <View style={styles.categoryChipsWrap}>
                  {CATEGORIES.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleCategory(category)}
                        style={[
                          styles.categoryChip,
                          isDarkMode && styles.categoryChipDark,
                          category === 'Imperdíveis' && styles.categoryChipImperdiveis,
                          category === 'Imperdíveis' && isDarkMode && styles.categoryChipImperdiveisDark,
                          selected && styles.categoryChipSelected,
                          selected && isDarkMode && styles.categoryChipSelectedDark,
                          category === 'Imperdíveis' && styles.categoryChipImperdiveisGlow,
                        ]}
                      >
                        <Text style={[styles.categoryChipText, isDarkMode && styles.categoryChipTextDark, selected && styles.categoryChipTextSelected]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <Select value="" onValueChange={toggleCategory}>
                <SelectTrigger style={styles.selectTrigger}><SelectValue placeholder="Filtrar Categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </View>
        </View>

        <Text style={[styles.resultsText, isDarkMode && styles.resultsTextDark]}>{filteredBusinesses.length} negócio(s) encontrado(s)</Text>
        
        <View style={[styles.cardGrid, numColumns === 1 && contentW > cardWidth + 8 && styles.cardGridSingleCentered]}>
          {filteredBusinesses.map((business) => (
            <TouchableOpacity key={business.id} onPress={() => navigateTo('T4')} style={[styles.cardWrapper, cardOuterStyle, numColumns > 1 && styles.cardWrapperGrid]}>
              <LinearGradient
                colors={isDarkMode ? ['#0f172a', '#1d4ed8'] : ['#eff6ff', '#dbeafe']}
                style={[styles.businessCardGradient, isDarkMode ? styles.businessCardGradientBorderDark : styles.businessCardGradientBorderLight, numColumns > 1 && styles.businessCardGradientUniform]}
              >
                <View style={styles.titleAboveImageWrap}>
                  <Text style={[styles.businessNameTop, isDarkMode && styles.businessNameTopDark]} numberOfLines={1}>{business.name}</Text>
                </View>

                <LinearGradient colors={[...HEADER_GRADIENT[isDarkMode ? 'dark' : 'light'].colors]} style={styles.imageContainer}>
                  <Image source={typeof business.image === 'string' ? { uri: business.image } : business.image} style={styles.cardImage} resizeMode="contain" />
                </LinearGradient>

                <View style={styles.cardContent}>
                  <View style={styles.badgesRowMin}>
                    <View style={styles.badgesRow}>
                      {business.categories.map((category: string, idx: number) => (
                        <Badge key={idx} style={[styles.categoryBadge, category === 'Imperdíveis' && styles.categoryBadgeImperdiveis]}>
                          <Text style={[styles.badgeText, category === 'Imperdíveis' && styles.badgeTextImperdiveis]}>{category}</Text>
                        </Badge>
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.businessDesc, isDarkMode && styles.businessDescDark]} numberOfLines={2}>{business.description}</Text>
                  <Text style={[styles.businessLocation, isDarkMode && styles.businessLocationDark]} numberOfLines={1}>📍 {business.location}</Text>

                  <DistanciaCardAnuncioSMOP userLat={searchCenter?.lat} userLon={searchCenter?.lon} business={business} isDarkMode={isDarkMode} />
                </View>

                <TouchableOpacity style={styles.favIcon} onPress={() => toggleFavorite(business.id)}>
                  <Heart size={16} color={favorites?.includes(business.id) ? '#ef4444' : '#cbd5e1'} fill={favorites?.includes(business.id) ? '#ef4444' : 'none'} />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 16,
  },
  activeBadgesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  activeBadgesLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  activeBadgesLabelDark: {
    color: '#cbd5e1',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badgesRowMin: {
    minHeight: 44, 
    marginBottom: 4,
    justifyContent: 'flex-start',
  },
  activeBadge: {
    marginBottom: 4,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  filtersCard: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filtersCardDark: {
    backgroundColor: '#1f2937',
    borderColor: '#0ea5e9',
  },
  filterGroup: {
    marginBottom: 12,
  },
  categoryWebRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryLabelInline: {
    marginBottom: 0,
    flexShrink: 0,
    paddingTop: 10,
    maxWidth: 110,
  },
  categoryLabelInlineDark: {
    color: '#e2e8f0',
  },
  categoryChipsWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    backgroundColor: '#ffffff',
    maxWidth: 300,
    alignSelf: 'flex-start',
  },
  categoryChipDark: {
    borderColor: '#38bdf8',
    backgroundColor: '#1f2937',
  },
  categoryChipSelected: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  categoryChipSelectedDark: {
    backgroundColor: '#0ea5e9',
    borderColor: '#7dd3fc',
  },
  categoryChipInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: 280,
  },
  categoryChipIcon: {
    marginTop: 2,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
    flexShrink: 1,
    lineHeight: 16,
    maxWidth: 260,
  },
  categoryChipTextDark: {
    color: '#e0f2fe',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  categoryChipImperdiveis: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryChipImperdiveisDark: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(6,78,59,0.45)',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryChipImperdiveisGlow: {
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
  categoryClearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
    alignSelf: 'flex-start',
  },
  categoryClearChipDark: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(127,29,29,0.35)',
    color: '#fecaca',
  },
  categoryClearChipDisabled: {
    opacity: 0.45,
    borderColor: '#94a3b8',
    backgroundColor: '#f1f5f9',
  },
  categoryClearChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
  },
  categoryClearChipTextDisabled: {
    color: '#64748b',
  },
  selectTrigger: {
    marginTop: 8,
  },
  filterButtonRow: {
    marginTop: 12,
  },
  filterButtonClear: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    minHeight: 44,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#fff',
  },
  resultsText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
  },
  resultsTextDark: {
    color: '#cbd5e1',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  cardGridSingleCentered: {
    justifyContent: 'center',
  },
  cardWrapper: {
    marginBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'column',
  },
  cardWrapperGrid: {
    alignSelf: 'stretch',
  },
  businessCardGradient: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    width: '100%',
  },
  businessCardGradientUniform: {
    minHeight: Platform.OS === 'web' ? 275 : 260,
    flex: 1,
    width: '100%',
  },
  businessCardGradientBorderLight: {
    borderColor: 'rgba(30,58,138,0.35)',
  },
  businessCardGradientBorderDark: {
    borderColor: 'rgba(56,189,248,0.55)',
  },
  imageContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? 110 : 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  titleAboveImageWrap: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  businessNameTop: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  businessNameTopDark: {
    color: '#e0f2fe',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 8,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  categoryBadge: {
    marginBottom: 4,
    marginRight: 6,
  },
  categoryBadgeImperdiveis: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  badgeTextImperdiveis: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
  entregaBadge: {
    backgroundColor: '#10b981',
    borderWidth: 0,
  },
  entregaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  businessDesc: {
    fontSize: 12,
    lineHeight: 16,
    height: 32,
    color: '#444',
    marginBottom: 6,
    overflow: 'hidden',
  },
  businessDescDark: {
    color: '#cbd5e1',
  },
  businessLocation: {
    fontSize: 11,
    color: '#555',
  },
  businessLocationDark: {
    color: '#94a3b8',
  },
  distanceRow: {
    minHeight: 18,
    justifyContent: 'flex-end',
  },
  businessDistance: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  businessDistanceDark: {
    color: '#6ee7b7',
  },
  distancePlaceholder: {
    height: 14,
    marginTop: 2,
  },
  favIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },

  // Ajustes de destaque do bairro adicionados de forma limpa ao final
  bairroDestaque: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 6,
  },
  bairroDestaqueDark: {
    color: '#38bdf8',
  },
});
