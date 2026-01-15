import { ChevronLeft, Flag, Heart, MessageCircle, Navigation, Phone } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { toast } from '../components/ui/sonner';
import { useAppContext } from '../context/AppContext';

const WALKING_SPEED_KMH = 5;
const BIKE_SPEED_KMH = 15;
const CAR_SPEED_KMH = 40;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function T4Detalhes() {
  const { isLoggedIn, navigateTo, navigateBack, selectedBusiness, favorites, setFavorites, locationSettings, businesses, isDarkMode, setReturnTo, setReportBusiness } = useAppContext();
  const [reported, setReported] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { width, height } = useWindowDimensions();
  const imageHeight = Math.max(280, Math.floor(height * 0.55)); // Aumentado para 280px mínimo e 55% da altura

  const isFavorite = useMemo(() => favorites?.includes(selectedBusiness?.id ?? 0) ?? false, [favorites, selectedBusiness]);

  if (!selectedBusiness) {
    return (
      <LayoutRN>
        <View style={{ padding: 16 }}>
          <Text>Negócio não encontrado</Text>
        </View>
      </LayoutRN>
    );
  }

  const handleAction = (action: string) => {
    if (!isLoggedIn) {
      toast.error('Você precisa fazer login para realizar esta ação');
      setReturnTo('T4');
      navigateTo('T3');
      return;
    }

    if (action === 'phone') {
      const phone = selectedBusiness.phone || '';
      const digits = String(phone).replace(/\D/g, '');
      if (!digits) {
        toast.error('Telefone não disponível');
        return;
      }
      Linking.openURL(`tel:${digits}`).catch(() => toast.error('Não foi possível abrir o discador'));
      toast.success('Abrindo discador...');
    } else if (action === 'whatsapp') {
      const whatsapp = selectedBusiness.whatsapp || selectedBusiness.phone || '';
      const digits = String(whatsapp).replace(/\D/g, '');
      if (!digits) {
        toast.error('WhatsApp não disponível');
        return;
      }
      Linking.openURL(`https://wa.me/${digits}`).catch(() => toast.error('Não foi possível abrir o WhatsApp'));
      toast.success('Abrindo WhatsApp...');
    } else if (action === 'route') {
      const { lat, lon } = selectedBusiness;
      if (typeof lat === 'number' && typeof lon === 'number') {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`).catch(() => toast.error('Não foi possível abrir os mapas'));
        toast.success('Abrindo aplicativo de mapas...');
      } else {
        toast.error('Coordenadas do anúncio não disponíveis');
      }
    }
  };

  const handleFavorite = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa fazer login para favoritar');
      setReturnTo('T4');
      navigateTo('T3');
      return;
    }

    if (isFavorite) {
      setFavorites(favorites.filter((id: number) => id !== selectedBusiness.id));
      toast.success('Removido dos favoritos');
    } else {
      setFavorites([...(favorites || []), selectedBusiness.id]);
      toast.success('Adicionado aos favoritos!');
    }
  };

  const handleReport = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa fazer login para reportar');
      setReturnTo('T4');
      navigateTo('T3');
      return;
    }
    // Setar o anúncio a denunciar e navegar para T10
    setReportBusiness({ id: selectedBusiness.id, name: selectedBusiness.name });
    navigateTo('T10');
  };

  // Cálculo de distância
  let center: null | { lat: number; lon: number } = null;
  if (locationSettings?.mode === 'gps' && locationSettings?.coords) {
    center = locationSettings.coords;
  } else if (locationSettings?.mode === 'cep' && locationSettings?.cep) {
    const cepPrefix = String(locationSettings.cep).replace(/\D/g, '').substring(0, 5);
    const match = (businesses || []).find((b: any) => b.cep && String(b.cep).replace(/\D/g, '').substring(0, 5) === cepPrefix);
    if (match && match.lat != null && match.lon != null) center = { lat: match.lat, lon: match.lon };
  }
  if (!center) {
    if (selectedBusiness.lat != null && selectedBusiness.lon != null) center = { lat: selectedBusiness.lat, lon: selectedBusiness.lon };
  }

  const distKm = center && typeof selectedBusiness.lat === 'number' && typeof selectedBusiness.lon === 'number'
    ? haversineKm(center.lat, center.lon, selectedBusiness.lat, selectedBusiness.lon)
    : null;

  // Styles
  const containerStyle = isDarkMode ? { ...styles.container, ...styles.containerDark } : styles.container;
  const cardStyle = isDarkMode ? { ...styles.card, ...styles.cardDark } : styles.card;
  const titleStyle = isDarkMode ? { ...styles.title, ...styles.titleDark } : styles.title;
  const labelMuted = isDarkMode ? { color: '#D1D5DB' } : { color: '#6B7280' };
  const textMuted = isDarkMode ? { color: '#9CA3AF' } : { color: '#6B7280' };

  return (
    <LayoutRN>
      <ScrollView style={containerStyle}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <View style={styles.backContent}>
            <ChevronLeft size={20 as any} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={isDarkMode ? { ...styles.backText, ...styles.backTextDark } : styles.backText}>Voltar</Text>
          </View>
        </TouchableOpacity>

        <View style={cardStyle}>
          <View style={[styles.imageWrapper, { height: imageHeight }]}>
            {selectedBusiness.image ? (
              <Image
                source={typeof selectedBusiness.image === 'string' ? { uri: selectedBusiness.image } : selectedBusiness.image}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={textMuted}>Imagem não disponível</Text>
              </View>
            )}
          </View>

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badge}><Text style={styles.badgeText}>{selectedBusiness.category}</Text></View>
              <Text style={titleStyle}>{selectedBusiness.name}</Text>
            </View>
            <View style={styles.iconActions}>
              <TouchableOpacity onPress={handleFavorite} style={styles.iconButton} accessibilityLabel="Favoritar">
                <Heart size={24 as any} color={isFavorite ? '#ef4444' : (isDarkMode ? '#93c5fd' : '#1e3a8a')} fill={isFavorite ? '#ef4444' : 'transparent'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleReport} 
                style={styles.iconButton} 
                accessibilityLabel="Denunciar anúncio"
                {...{ onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false) } as any}
              >
                <Flag size={20 as any} color={isDarkMode ? '#93c5fd' : '#1e3a8a'} />
                {showTooltip && (
                  <View style={[styles.tooltip, isDarkMode && styles.tooltipDark]}>
                    <Text style={[styles.tooltipText, isDarkMode && styles.tooltipTextDark]}>Denunciar anúncio</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Descrição truncada */}
          <Text style={textMuted}>
            {String(selectedBusiness.description || '').length > 200
              ? String(selectedBusiness.description).slice(0, 200) + '...'
              : (selectedBusiness.description || '')}
          </Text>

          <View style={{ marginTop: 16 }}>
            <Text style={labelMuted}>📍 Localização: <Text style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}>{selectedBusiness.location || 'Não informada'}</Text></Text>
            <Text style={labelMuted}>📞 Telefone: <Text style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}>{selectedBusiness.phone || 'Não informado'}</Text></Text>

            <View style={{ marginTop: 12 }}>
              {center && distKm != null ? (
                <View style={styles.distanceRow}>
                  <View style={styles.distanceBadge}><Text style={styles.distanceValue}>{distKm.toFixed(2)} km</Text><Text style={styles.distanceNote}>Caminhar ~ {Math.round((distKm / WALKING_SPEED_KMH) * 60)} min</Text></View>
                  <View style={styles.distanceBadge}><Text style={styles.distanceValue}>{distKm.toFixed(2)} km</Text><Text style={styles.distanceNote}>Bicicleta ~ {Math.round((distKm / BIKE_SPEED_KMH) * 60)} min</Text></View>
                  <View style={styles.distanceBadge}><Text style={styles.distanceValue}>{distKm.toFixed(2)} km</Text><Text style={styles.distanceNote}>Carro ~ {Math.round((distKm / CAR_SPEED_KMH) * 60)} min</Text></View>
                </View>
              ) : (
                <Text style={textMuted}>Localização de busca não definida — permita GPS ou selecione um CEP.</Text>
              )}
            </View>

            {/* Redes sociais */}
            <View style={styles.socialRow}>
              {selectedBusiness.instagram && selectedBusiness.contactVisibility?.instagram && (
                <TouchableOpacity onPress={() => Linking.openURL(String(selectedBusiness.instagram))} style={[styles.socialIcon, { backgroundColor: '#ec4899' }]} accessibilityLabel="Instagram">
                  <Text style={{ color: '#fff' }}>📸</Text>
                </TouchableOpacity>
              )}
              {selectedBusiness.facebook && selectedBusiness.contactVisibility?.facebook && (
                <TouchableOpacity onPress={() => Linking.openURL(String(selectedBusiness.facebook))} style={[styles.socialIcon, { backgroundColor: '#2563eb' }]} accessibilityLabel="Facebook">
                  <Text style={{ color: '#fff' }}>📘</Text>
                </TouchableOpacity>
              )}
              {selectedBusiness.pinterest && selectedBusiness.contactVisibility?.pinterest && (
                <TouchableOpacity onPress={() => Linking.openURL(String(selectedBusiness.pinterest))} style={[styles.socialIcon, { backgroundColor: '#ef4444' }]} accessibilityLabel="Pinterest">
                  <Text style={{ color: '#fff' }}>📌</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Separator style={{ marginVertical: 16 }} />

          <View style={styles.actionsGrid}>
            <Button onPress={() => handleAction('phone')} style={styles.primaryBlueButton}>
              <View style={styles.actionContent}><Phone size={20 as any} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.actionText}>Ligar</Text></View>
            </Button>
            <Button onPress={() => handleAction('whatsapp')} style={styles.primaryGreenButton}>
              <View style={styles.actionContent}><MessageCircle size={20 as any} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.actionText}>WhatsApp</Text></View>
            </Button>
            <Button onPress={() => handleAction('route')} style={styles.primaryBlueButton}>
              <View style={styles.actionContent}><Navigation size={20 as any} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.actionText}>Traçar Rota</Text></View>
            </Button>
          </View>
        </View>
      </ScrollView>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  backButton: {
    marginBottom: 16,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  backTextDark: {
    color: '#60A5FA',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#111827',
    borderColor: '#1d4ed8',
  },
  imageWrapper: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  titleDark: {
    color: '#93c5fd',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    height: 48,
    width: 48,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative' as any,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceBadge: {
    flexDirection: 'column',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  distanceNote: {
    fontSize: 12,
    color: '#6b7280',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  socialIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute' as any,
    bottom: 52,
    right: 0,
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 100,
  },
  tooltipDark: {
    backgroundColor: '#1f2937',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipTextDark: {
    color: '#e5e7eb',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  primaryBlueButton: {
    height: 56,
    backgroundColor: '#2563EB',
    flex: 1,
  },
  primaryGreenButton: {
    height: 56,
    backgroundColor: '#16A34A',
    flex: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
