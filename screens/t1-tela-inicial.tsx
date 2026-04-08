import { Heart, Truck, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../components/ui/sonner';
import { useAppContext } from '../context/AppContext';
import { getAllActiveAnuncios, getNearbyActiveAnuncios } from '../src/services/anuncioService';
import { geocodeBusinessAddress } from '../src/services/geocodingService';

// Constantes de raio
const MIN_RADIUS_KM = 0.5;
const MAX_RADIUS_KM = 8;
const DEFAULT_RADIUS_KM = 1;
const GEO_FETCH_RADIUS_KM = MAX_RADIUS_KM;

// Função para calcular distância em metros usando fórmula de Haversine
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // raio da Terra em metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Categorias disponíveis
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

// Tela principal de listagem
export default function T1TelaInicial() {
  const { navigateTo, setSelectedBusiness, favorites, toggleFavorite, isDarkMode, businesses, locationSettings, userProfile } = useAppContext();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Categorias selecionadas (múltiplas)
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]); // Negócios filtrados
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
        userProfile?.cep ||
        userProfile?.street ||
        userProfile?.number ||
        userProfile?.neighborhood ||
        userProfile?.city ||
        userProfile?.state
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
          setSearchCenter(geo ? { lat: geo.lat, lon: geo.lon } : null);
          return;
        } catch {
          if (active) setSearchCenter(null);
          return;
        }
      }

      if (locationSettings?.mode === 'profile') {
        const hasProfileAddressData = Boolean(
          userProfile?.cep ||
            userProfile?.street ||
            userProfile?.number ||
            userProfile?.neighborhood ||
            userProfile?.city ||
            userProfile?.state
        );

        if (hasProfileAddressData) {
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
            setSearchCenter(geo ? { lat: geo.lat, lon: geo.lon } : null);
            return;
          } catch {
            if (active) setSearchCenter(null);
            return;
          }
        }
      }

      if (locationSettings?.mode === 'address' || locationSettings?.mode === 'custom') {
        const hasAddressData = Boolean(
          locationSettings?.cep ||
            locationSettings?.street ||
            locationSettings?.number ||
            locationSettings?.neighborhood ||
            locationSettings?.city ||
            locationSettings?.state
        );

        if (hasAddressData) {
          try {
            const geo = await geocodeBusinessAddress({
              cep: locationSettings?.cep,
              street: locationSettings?.street,
              number: locationSettings?.number,
              neighborhood: locationSettings?.neighborhood,
              city: locationSettings?.city,
              state: locationSettings?.state,
              country: 'Brasil',
            });
            if (!active) return;
            setSearchCenter(geo ? { lat: geo.lat, lon: geo.lon } : null);
            return;
          } catch {
            if (active) setSearchCenter(null);
            return;
          }
        }
      }

      if (locationSettings?.mode === 'cep' && locationSettings?.cep) {
        try {
          const geo = await geocodeBusinessAddress({ cep: locationSettings.cep, country: 'Brasil' });
          if (!active) return;
          setSearchCenter(geo ? { lat: geo.lat, lon: geo.lon } : null);
          return;
        } catch {
          if (active) setSearchCenter(null);
          return;
        }
      }

      if (active) setSearchCenter(null);
    };

    void resolveCenter();

    return () => {
      active = false;
    };
  }, [locationSettings, userProfile]);
  
  // Layout responsivo
  const { width } = useWindowDimensions();
  const numColumns = width > 1024 ? 3 : width > 768 ? 2 : 1;
  const cardWidth = width > 768 
    ? `${(100 - (1.6 * (numColumns - 1))) / numColumns}%` // 1.6% gap entre cards
    : '100%';
  
  // Aplica filtros quando categorias mudam e calcula distância
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
            console.warn('Busca geográfica vazia, aplicando fallback para carregar a base completa.');
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

        // Fallback local para anúncios antigos sem geohash indexado: usa a base já carregada em memória.
        const localGeoBusinesses = (businesses || []).filter((b: any) => {
          if (typeof b?.lat !== 'number' || typeof b?.lon !== 'number') return false;
          const d = haversineM(center.lat, center.lon, b.lat, b.lon);
          return d <= GEO_FETCH_RADIUS_KM * 1000;
        });

        if (localGeoBusinesses.length > 0) {
          const merged = new Map<string, any>();

          baseBusinesses.forEach((b: any) => {
            const key = String(b.firestoreId || b.id || b.name || '');
            merged.set(key, b);
          });

          localGeoBusinesses.forEach((b: any) => {
            const key = String(b.firestoreId || b.id || b.name || '');
            if (!merged.has(key)) {
              merged.set(key, b);
            }
          });

          baseBusinesses = Array.from(merged.values());
        }

          geoCacheRef.current = { key: geoCacheKey, businesses: baseBusinesses };
      } catch (error) {
        console.warn('Falha na busca geográfica otimizada, aplicando fallback local:', error);
        baseBusinesses = businesses;
      } finally {
        if (isActive) setIsGeoSearching(false);
      }
      }
    } else {
      setIsGeoSearching(false);
    }

    let results = baseBusinesses.map(b => {
      // Calcula distância se houver ponto de origem e coordenadas no negócio
      let distanceM = null;
      if (center && typeof b.lat === 'number' && typeof b.lon === 'number') {
        distanceM = haversineM(center.lat, center.lon, b.lat, b.lon);
      }
      return { ...b, distanceM };
    });

    // Filtra por categoria
    if (selectedCategories.length > 0) {
      results = results.filter(b => {
        // Se filtro de Entrega Rápida está selecionado
        if (selectedCategories.includes('Entrega Rápida na Região')) {
          const hasDelivery = b.entregaRapida === true;
          const categories = Array.isArray(b.categories) ? b.categories : [];
          const hasOtherCategory = categories.some(cat => selectedCategories.filter(c => c !== 'Entrega Rápida na Região').includes(cat));
          // Se há outros filtros além de Entrega Rápida, deve ter entrega E uma das categorias
          if (selectedCategories.length > 1) {
            return hasDelivery && hasOtherCategory;
          }
          // Se só tem filtro de Entrega Rápida, retorna apenas os que têm entrega
          return hasDelivery;
        }
        // Filtro normal de categorias
        const categories = Array.isArray(b.categories) ? b.categories : [];
        return categories.some(cat => selectedCategories.includes(cat));
      });
    }

    // Filtra por distância configurada quando há origem definida
    if (center) {
      const maxDistanceM = radiusKm * 1000; // Converte km para metros
      results = results.filter(b => b.distanceM != null && b.distanceM <= maxDistanceM);
    }

    // Se há localização, ordena por proximidade. Sem localização, ordem alfabética.
    if (center) {
      results.sort((a, b) => {
        const aDist = typeof a.distanceM === 'number' ? a.distanceM : Number.MAX_SAFE_INTEGER;
        const bDist = typeof b.distanceM === 'number' ? b.distanceM : Number.MAX_SAFE_INTEGER;
        if (aDist !== bDist) return aDist - bDist;
        return String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR', { sensitivity: 'base' });
      });
    } else {
      results.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR', { sensitivity: 'base' }));
    }

    if (isActive) {
      setFilteredBusinesses(results);
    }
  };

    void runFilters();

    return () => {
      isActive = false;
    };
  }, [selectedCategories, businesses, locationSettings, searchCenter]);

  // Adiciona ou remove categoria
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) // Remove se já existe
        : [...prev, category] // Adiciona se não existe
    );
  };

  // Remove categoria específica
  const removeCategory = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  // Limpa todos os filtros
  const handleClearFilters = () => {
    setSelectedCategories([]); // Reseta categorias
    toast.info('Filtros limpos'); // Notifica usuário
  };

  // Seleciona negócio e navega
  const handleCardClick = (business: any) => {
    setSelectedBusiness(business); // Define negócio selecionado
    navigateTo('T4'); // Navega para detalhes
  };

  return (
    <LayoutRN>
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        {/* Filtros de Busca */}
        <View style={[styles.filtersCard, isDarkMode && styles.filtersCardDark]}>
          <View style={styles.filterGroup}>
            <Label>Categorias (selecione múltiplas)</Label>
            <Select value="" onValueChange={toggleCategory}>
              <SelectTrigger style={styles.selectTrigger}>
                <SelectValue placeholder="Adicionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'Entrega Rápida na Região' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Truck size={16} color="#10b981" />
                        <Text>{category}</Text>
                      </View>
                    ) : (
                      category
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          {/* Badges de filtros ativos */}
          {selectedCategories.length > 0 && (
            <View style={styles.activeBadgesContainer}>
              <Text style={[styles.activeBadgesLabel, isDarkMode && styles.activeBadgesLabelDark]}>Filtros ativos:</Text>
              <View style={styles.badgesRow}>
                {selectedCategories.map((category) => (
                  <TouchableOpacity key={category} onPress={() => removeCategory(category)} style={styles.activeBadge}>
                    <Badge variant="default" style={styles.filterBadge}>
                      <View style={styles.badgeContent}>
                        <Text style={styles.filterBadgeText}>{category}</Text>
                        <X size={14} color="#fff" />
                      </View>
                    </Badge>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.filterButtonRow}>
            <Button 
              onPress={handleClearFilters} 
              variant="outline" 
              style={styles.filterButtonClear}
              disabled={selectedCategories.length === 0}
            >
              <View style={styles.buttonContent}>
                <X size={18} color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Remover Todos os Filtros</Text>
              </View>
            </Button>
          </View>
        </View>

        {/* Resultados - Grid de Cards */}
        <Text style={[styles.resultsText, isDarkMode && styles.resultsTextDark]}>
          {filteredBusinesses.length} negócio(s) encontrado(s)
        </Text>
        {isGeoSearching && (
          <Text style={[styles.resultsText, isDarkMode && styles.resultsTextDark]}>
            Buscando por proximidade...
          </Text>
        )}
        <View style={styles.cardGrid}>
          {filteredBusinesses.map((business) => (
            <TouchableOpacity 
              key={business.id} 
              onPress={() => handleCardClick(business)} 
              style={[styles.cardWrapper, { width: cardWidth as any }]}
            >
              <Card style={StyleSheet.flatten([styles.businessCard, isDarkMode && styles.businessCardDark])}>
                <View style={styles.titleAboveImageWrap}>
                  <Text style={StyleSheet.flatten([styles.businessNameTop, isDarkMode && styles.businessNameTopDark])} numberOfLines={2}>
                    {business.name}
                  </Text>
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={typeof business.image === 'string' ? { uri: business.image } : business.image}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.badgesRow}>
                    {business.categories.map((category: string, idx: number) => (
                      <Badge 
                        key={idx}
                        variant="default" 
                        style={StyleSheet.flatten([
                          styles.categoryBadge,
                          category === 'Imperdíveis' && styles.categoryBadgeImperdiveis
                        ])}
                      >
                        <Text style={[
                          styles.badgeText,
                          category === 'Imperdíveis' && styles.badgeTextImperdiveis
                        ]}>
                          {category}
                        </Text>
                      </Badge>
                    ))}
                    {business.entregaRapida && (
                      <Badge variant="default" style={styles.entregaBadge}>
                        <Text style={styles.entregaBadgeText}>🚀 Entrega Rápida</Text>
                      </Badge>
                    )}
                  </View>
                  <Text style={[styles.businessDesc, isDarkMode && styles.businessDescDark]} numberOfLines={2}>
                    {business.description}
                  </Text>
                  <Text style={[styles.businessLocation, isDarkMode && styles.businessLocationDark]}>
                    📍 {business.location} • {business.cep}
                  </Text>
                  {business.distanceM != null && (
                    <Text style={[styles.businessDistance, isDarkMode && styles.businessDistanceDark]}>
                      🎯 {business.distanceM < 1000 ? `${Math.round(business.distanceM)}m` : `${(business.distanceM / 1000).toFixed(2)}km`}
                    </Text>
                  )}
                </View>

                {/* Ícone de favorito */}
                <TouchableOpacity style={styles.favIcon} onPress={() => toggleFavorite(business.id)}>
                  <Heart
                    size={20}
                    color={favorites?.includes(business.id) ? '#ef4444' : '#cbd5e1'}
                    fill={favorites?.includes(business.id) ? '#ef4444' : 'none'}
                  />
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', // Fundo branco
    padding: 16, // Padding interno
  },
  activeBadgesContainer: {
    marginTop: 12, // Espaço superior
    marginBottom: 8, // Espaço inferior
  },
  activeBadgesLabel: {
    fontSize: 12, // Tamanho fonte
    color: '#666', // Cor cinza
    marginBottom: 8, // Espaço inferior
    fontWeight: '600', // Peso médio
  },
  activeBadgesLabelDark: {
    color: '#cbd5e1', // Cor cinza claro
  },
  badgesRow: {
    flexDirection: 'row', // Direção horizontal
    flexWrap: 'wrap', // Quebra linha
    gap: 8, // Espaço entre badges
  },
  activeBadge: {
    marginBottom: 4, // Espaço inferior
  },
  filterBadge: {
    paddingHorizontal: 12, // Padding horizontal
    paddingVertical: 6, // Padding vertical
  },
  badgeContent: {
    flexDirection: 'row', // Direção horizontal
    alignItems: 'center', // Alinha centro
    gap: 6, // Espaço entre texto e X
  },
  filterBadgeText: {
    fontSize: 12, // Tamanho fonte
    fontWeight: '600', // Peso médio
    color: '#fff', // Texto branco
  },
  containerDark: {
    backgroundColor: 'transparent', // Deixa degradê global visível
  },
  filtersCard: {
    backgroundColor: '#f3f4f6', // Fundo claro
    borderWidth: 2, // Borda
    borderColor: '#1e3a8a', // Cor borda
    borderRadius: 12, // Arredondamento
    padding: 16, // Padding
    marginBottom: 16, // Espaço inferior
  },
  filtersCardDark: {
    backgroundColor: '#1f2937', // Fundo dark anterior dos cards de filtro
    borderColor: '#0ea5e9', // Borda dark anterior
  },
  filterGroup: {
    marginBottom: 12, // Espaço inferior
  },
  selectTrigger: {
    marginTop: 8, // Espaço superior
  },
  filterButtonRow: {
    marginTop: 12, // Espaço superior
  },
  filterButtonClear: {
    width: '100%', // Largura total
    flexDirection: 'row', // Direção horizontal
    alignItems: 'center', // Alinha centro
    justifyContent: 'center', // Centraliza
    borderWidth: 2, // Borda
    borderColor: '#1e3a8a', // Cor borda
    minHeight: 50,
  },
  buttonContent: {
    flexDirection: 'row', // Direção horizontal
    alignItems: 'center', // Alinha centro
    gap: 8, // Espaço entre itens
  },
  buttonText: {
    color: '#000', // Texto preto
    fontSize: 14, // Tamanho fonte
    fontWeight: '600', // Peso médio
  },
  buttonTextDark: {
    color: '#fff', // Texto branco
  },
  resultsText: {
    fontSize: 14, // Tamanho fonte
    color: '#666', // Cor cinza
    marginBottom: 12, // Espaço inferior
  },
  resultsTextDark: {
    color: '#cbd5e1', // Cor cinza claro
  },
  cardGrid: {
    flexDirection: 'row', // Direção horizontal
    flexWrap: 'wrap', // Quebra linha
    gap: 16, // Espaço entre cards
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    width: '100%', // Mobile: 1 por linha
    minWidth: 280, // Largura mínima
    maxWidth: 400, // Largura máxima para manter padrão
    marginBottom: 8, // Espaço inferior
    // Em telas maiores (tablet/desktop), mostra múltiplos por linha
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '100%',
  },
  businessCard: {
    overflow: 'hidden', // Corta conteúdo
    borderWidth: 2, // Borda
    borderColor: '#1e3a8a', // Cor borda
  },
  businessCardDark: {
    backgroundColor: '#111827', // Fundo dark anterior dos cards
    borderColor: '#0ea5e9', // Borda dark anterior
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  titleAboveImageWrap: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
  },
  businessNameTop: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  businessNameTopDark: {
    color: '#e0f2fe',
  },
  imageTopOverlay: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  cardImage: {
    width: '100%', // Largura total
    height: '100%', // Altura preenchida
  },
  businessNameOnImage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  businessNameOnImageDark: {
    color: '#e0f2fe',
    backgroundColor: 'rgba(15,23,42,0.82)',
  },
  cardContent: {
    padding: 16, // Padding interno
  },
  categoryBadge: {
    marginBottom: 4, // Espaço inferior
    marginRight: 6, // Espaço à direita para múltiplos badges
  },
  categoryBadgeImperdiveis: {
    backgroundColor: '#fff', // Mantém fundo branco
    borderWidth: 3, // Borda dupla (mais grossa)
    borderColor: '#39ff14', // Borda verde neon
    shadowColor: '#39ff14', // Sombra verde neon
    shadowOffset: { width: 0, height: 0 }, // Sem offset
    shadowOpacity: 0.9, // Opacidade alta
    shadowRadius: 10, // Raio largo para brilho
    elevation: 8, // Elevação Android
  },
  badgeText: {
    fontSize: 12, // Tamanho fonte
    fontWeight: '600', // Peso médio
    color: '#fff', // Texto branco
  },
  badgeTextImperdiveis: {
    color: '#1e3a8a', // Azul escuro
    fontWeight: '700', // Peso extra bold
  },
  entregaBadge: {
    backgroundColor: '#10b981', // Verde
    borderWidth: 0,
  },
  entregaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  businessName: {
    fontSize: 16, // Tamanho fonte
    fontWeight: '600', // Peso médio
    color: '#1e3a8a', // Cor azul
    marginBottom: 8, // Espaço inferior
    textAlign: 'center', // Centraliza o nome no card
  },
  businessNameDark: {
    color: '#e0f2fe', // Cor azul claro
  },
  businessDesc: {
    fontSize: 14, // Tamanho fonte
    color: '#666', // Cor cinza
    marginBottom: 8, // Espaço inferior
  },
  businessDescDark: {
    color: '#cbd5e1', // Cor cinza claro
  },
  businessLocation: {
    fontSize: 12, // Tamanho fonte
    color: '#888', // Cor cinza
  },
  businessLocationDark: {
    color: '#94a3b8', // Cor cinza claro
  },
  businessDistance: {
    fontSize: 12, // Tamanho fonte
    color: '#10b981', // Verde indicando proximidade
    fontWeight: '600', // Peso médio
    marginTop: 4, // Espaço superior
  },
  businessDistanceDark: {
    color: '#6ee7b7', // Verde claro
  },
  favIcon: {
    position: 'absolute', // Posição absoluta
    bottom: 12, // Distância inferior
    right: 12, // Distância direita
    backgroundColor: 'rgba(255,255,255,0.9)', // Fundo branco transparente
    borderRadius: 20, // Círculo
    width: 40, // Largura
    height: 40, // Altura
    justifyContent: 'center', // Centraliza
    alignItems: 'center', // Centraliza
    shadowColor: '#000', // Cor sombra
    shadowOffset: { width: 0, height: 1 }, // Offset sombra
    shadowOpacity: 0.1, // Opacidade sombra
    shadowRadius: 2, // Raio sombra
    elevation: 2, // Elevação Android
  },
});
