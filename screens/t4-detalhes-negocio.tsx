import { ChevronLeft, Flag, Heart, MessageCircle, Navigation, Phone } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { toast } from '../components/ui/sonner';
import { useAppContext } from '../context/AppContext';
import { geocodeBusinessAddress } from '../src/services/geocodingService';

const buildAddressString = (parts: Array<string | undefined | null>) =>
  parts.filter(Boolean).map((part) => String(part).trim()).filter(Boolean).join(', ');

const buildMapsDirectionValue = (address: string | null, coords: { lat: number; lon: number } | null) => {
  if (address) {
    return encodeURIComponent(address);
  }

  if (coords) {
    return `${coords.lat},${coords.lon}`;
  }

  return '';
};

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

export default function T4Detalhes() {
  const { isLoggedIn, navigateTo, navigateBack, selectedBusiness, favorites, toggleFavorite, locationSettings, businesses, isDarkMode, setReturnTo, setReportBusiness, userProfile } = useAppContext();
  const [reported, setReported] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [enderecoPorCep, setEnderecoPorCep] = useState('');
  const [enderecoLoading, setEnderecoLoading] = useState(false);
  const [searchCenter, setSearchCenter] = useState<null | { lat: number; lon: number }>(null);
  const { width, height } = useWindowDimensions();
  const imageHeight = Math.max(280, Math.floor(height * 0.55));

  const isFavorite = useMemo(() => favorites?.includes(selectedBusiness?.id ?? 0) ?? false, [favorites, selectedBusiness]);

  const hasProfileAddress = Boolean(
    userProfile?.cep ||
    userProfile?.street ||
    userProfile?.number ||
    userProfile?.neighborhood ||
    userProfile?.city ||
    userProfile?.state
  );

  if (!selectedBusiness) {
    return (
      <LayoutRN>
        <View style={{ padding: 16 }}>
          <Text>Negócio não encontrado</Text>
        </View>
      </LayoutRN>
    );
  }

  const resolveOriginCoords = async (): Promise<null | { lat: number; lon: number }> => {
    if (locationSettings?.coords && typeof locationSettings.coords.lat === 'number' && typeof locationSettings.coords.lon === 'number') {
      return locationSettings.coords;
    }

    if (typeof userProfile?.lat === 'number' && typeof userProfile?.lon === 'number') {
      return { lat: userProfile.lat, lon: userProfile.lon };
    }

    if (hasProfileAddress) {
      const geo = await geocodeBusinessAddress({
        cep: userProfile?.cep,
        street: userProfile?.street,
        number: userProfile?.number,
        neighborhood: userProfile?.neighborhood,
        city: userProfile?.city,
        state: userProfile?.state,
        country: 'Brasil',
      });

      if (geo) {
        return { lat: geo.lat, lon: geo.lon };
      }
    }

    return null;
  };

  const resolveDestinationCoords = async (): Promise<null | { lat: number; lon: number }> => {
    if (typeof selectedBusiness.lat === 'number' && typeof selectedBusiness.lon === 'number') {
      return { lat: selectedBusiness.lat, lon: selectedBusiness.lon };
    }

    const geo = await geocodeBusinessAddress({
      cep: selectedBusiness.cep,
      street: selectedBusiness.street,
      number: selectedBusiness.number,
      neighborhood: selectedBusiness.neighborhood,
      city: selectedBusiness.city,
      state: selectedBusiness.state,
      country: 'Brasil',
    });

    if (geo) {
      return { lat: geo.lat, lon: geo.lon };
    }

    return null;
  };

  const handleAction = async (action: string) => {
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
      try {
        const [origin, destination] = await Promise.all([resolveOriginCoords(), resolveDestinationCoords()]);

        if (!origin) {
          toast.error('Localização do seu perfil não encontrada');
          return;
        }

        if (!destination) {
          toast.error('Coordenadas do anúncio não disponíveis');
          return;
        }

        const originAddress = buildAddressString([
          userProfile?.street,
          userProfile?.number,
          userProfile?.neighborhood,
          userProfile?.city,
          userProfile?.state,
          userProfile?.cep,
          'Brasil',
        ]);

        const destinationAddress = buildAddressString([
          selectedBusiness.street,
          selectedBusiness.number,
          selectedBusiness.neighborhood,
          selectedBusiness.city,
          selectedBusiness.state,
          selectedBusiness.cep,
          'Brasil',
        ]);

        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${buildMapsDirectionValue(originAddress, origin)}&destination=${buildMapsDirectionValue(destinationAddress, destination)}&travelmode=driving`;
        await Linking.openURL(mapsUrl);
        toast.success('Abrindo rota no Maps...');
      } catch {
        toast.error('Não foi possível abrir a rota no Maps');
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

    toggleFavorite(selectedBusiness.id);
    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
  };

  const handleReport = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa fazer login para reportar');
      setReturnTo('T4');
      navigateTo('T3');
      return;
    }
    setReportBusiness({ id: selectedBusiness.id, firestoreId: selectedBusiness.firestoreId ?? undefined, name: selectedBusiness.name });
    navigateTo('T10');
  };

  // RESOLVE CENTRO DA BUSCA UTILIZANDO VIACEP + NOMINATIM SEQUENCIALMENTE
  useEffect(() => {
    let active = true;

    const resolveCenter = async () => {
      if (locationSettings?.coords && typeof locationSettings.coords.lat === 'number' && typeof locationSettings.coords.lon === 'number') {
        if (active) setSearchCenter(locationSettings.coords);
        return;
      }

      if (locationSettings?.mode === 'cep' && locationSettings?.cep) {
        try {
          const cepDigits = String(locationSettings.cep).replace(/\D/g, '');
          
          // 1. Busca primeiro no ViaCEP para pegar os dados nominais da rua
          const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
          const viaCepData = await viaCepResponse.json();

          if (!active) return;

          if (viaCepData && !viaCepData.erro) {
            // 2. Manda os dados estruturados da rua para o Nominatim em vez do CEP cru
            const geo = await geocodeBusinessAddress({
              street: viaCepData.logradouro,
              neighborhood: viaCepData.bairro,
              city: viaCepData.localidade,
              state: viaCepData.uf,
              cep: cepDigits,
              country: 'Brasil'
            });

            if (active) setSearchCenter(geo ? { lat: geo.lat, lon: geo.lon } : null);
          } else {
            // Fallback caso o ViaCEP falhe ou não encontre, tenta o método antigo pelo CEP cru
            const geoFallback = await geocodeBusinessAddress({ cep: locationSettings.cep, country: 'Brasil' });
            if (active) setSearchCenter(geoFallback ? { lat: geoFallback.lat, lon: geoFallback.lon } : null);
          }
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
  }, [locationSettings]);

  // Cálculo de distância
  const center = searchCenter;

  const distM = center && typeof selectedBusiness.lat === 'number' && typeof selectedBusiness.lon === 'number'
    ? haversineM(center.lat, center.lon, selectedBusiness.lat, selectedBusiness.lon)
    : null;

  const sb: any = selectedBusiness;
  const enderecoBasePartes = [
    sb.street || sb.rua,
    sb.number || sb.numero,
    sb.neighborhood || sb.bairro,
    sb.city || sb.cidade,
    sb.state || sb.estado,
  ].filter(Boolean);

  const enderecoCompleto = [
    ...enderecoBasePartes,
    sb.cep,
  ]
    .filter(Boolean)
    .join(', ');

  const hasEnderecoDetalhado = enderecoBasePartes.length > 0;

  useEffect(() => {
    let active = true;

    const buscarEnderecoPorCep = async () => {
      const cepDigits = String(sb.cep || '').replace(/\D/g, '');
      if (!cepDigits || cepDigits.length !== 8 || hasEnderecoDetalhado) {
        setEnderecoPorCep('');
        setEnderecoLoading(false);
        return;
      }

      setEnderecoLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const data = await response.json();

        if (!active) return;

        if (!data?.erro) {
          const resolved = [data.logradouro, data.bairro, data.localidade, data.uf, sb.cep]
            .filter(Boolean)
            .join(', ');
          setEnderecoPorCep(resolved);
        } else {
          setEnderecoPorCep('');
        }
      } catch {
        if (!active) return;
        setEnderecoPorCep('');
      } finally {
        if (active) setEnderecoLoading(false);
      }
    };

    void buscarEnderecoPorCep();

    return () => {
      active = false;
    };
  }, [sb.cep, hasEnderecoDetalhado]);

  const enderecoExibicao = hasEnderecoDetalhado
    ? enderecoCompleto
    : (enderecoPorCep || (enderecoLoading ? 'Buscando endereço completo...' : 'Endereço completo não informado'));

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
          <View style={styles.titleAboveImageWrap}>
            <View style={styles.badge}><Text style={styles.badgeText}>{selectedBusiness.category}</Text></View>
            <Text style={titleStyle} numberOfLines={2}>{selectedBusiness.name}</Text>
          </View>

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

          <Separator style={{ marginVertical: 10 }} />

          <View style={styles.actionsGrid}>
            <View style={styles.primaryActionRow}>
              <Button onPress={() => handleAction('whatsapp')} style={styles.primaryGreenButton}>
                <View style={styles.actionContent}><MessageCircle size={20 as any} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.actionText}>WhatsApp</Text></View>
              </Button>
            </View>

            <Separator style={styles.actionsSeparator} />

            <View style={styles.actionsRow}>
              {selectedBusiness.phone && (
                <Button onPress={() => handleAction('phone')} style={styles.smallBlueButton}>
                  <View style={styles.actionContent}><Phone size={18 as any} color="#fff" /><Text style={styles.smallActionText}>Ligar</Text></View>
                </Button>
              )}
              <Button onPress={() => handleAction('route')} style={styles.smallBlueButton}>
                <View style={styles.actionContent}><Navigation size={18 as any} color="#fff" /><Text style={styles.smallActionText}>Rota</Text></View>
              </Button>
            </View>
          </View>

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            <View style={styles.iconActions}>
              <View style={styles.favoriteButtonContainer}>
                <TouchableOpacity onPress={handleFavorite} style={styles.iconButton} accessibilityLabel="Favoritar">
                  <Heart size={22 as any} color={isFavorite ? '#ef4444' : (isDarkMode ? '#93c5fd' : '#1e3a8a')} fill={isFavorite ? '#ef4444' : 'transparent'} />
                </TouchableOpacity>
                {selectedBusiness?.totalFavoritos !== undefined && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>
                      {selectedBusiness.totalFavoritos > 99 ? '99+' : selectedBusiness.totalFavoritos}
                    </Text>
                  </View>
                )}
              </View>
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

          <Text style={textMuted}>
            {String(selectedBusiness.description || '').length > 200
              ? String(selectedBusiness.description).slice(0, 200) + '...'
              : (selectedBusiness.description || '')}
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text style={labelMuted}>📍 <Text style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}>{enderecoExibicao}</Text></Text>
            {selectedBusiness.phone && (
              <Text style={labelMuted}>📞 <Text style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}>{selectedBusiness.phone}</Text></Text>
            )}

            <View style={{ marginTop: 10 }}>
              {/* Bloco de exibição de distância comentado mantendo compatibilidade
              center && distM != null ? (
                <View style={styles.distanceRow}>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceValue}>
                      🎯 {distM < 1000 ? `${Math.round(distM)}m` : `${(distM / 1000).toFixed(2)}km`}
                    </Text>
                    <Text style={styles.distanceNote}>Distância em linha reta</Text>
                    <TouchableOpacity onPress={() => handleAction('route')} accessibilityRole="button">
                      <Text style={styles.routeLink}>Clique aqui para ver rota</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => navigateTo('T3')} accessibilityRole="button">
                  <Text style={[textMuted, { textDecorationLine: 'underline' }]}>Faça login ou entre com sua conta</Text>
                </TouchableOpacity>
              )
              */}
            </View>

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
    backgroundColor: 'transparent',
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
    position: 'relative',
  },
  titleAboveImageWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
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
    paddingTop: 8,
    paddingBottom: 8,
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
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.84)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  titleDark: {
    color: '#93c5fd',
    backgroundColor: 'rgba(17,24,39,0.82)',
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
  favoriteButtonContainer: {
    position: 'relative' as any,
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute' as any,
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  favoriteBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
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
  routeLink: {
    fontSize: 12,
    color: '#1d4ed8',
    textDecorationLine: 'underline',
    fontWeight: '600',
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
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  primaryActionRow: {
    width: '100%',
    alignSelf: 'stretch',
  },
  actionsSeparator: {
    marginVertical: 4,
    opacity: 0.9,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  smallBlueButton: {
    minHeight: 48,
    backgroundColor: '#2563EB',
    flex: 1,
  },
  primaryGreenButton: {
    minHeight: 48,
    backgroundColor: '#16A34A',
    width: '100%',
    alignSelf: 'stretch',
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
    lineHeight: 20,
  },
  smallActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 6,
  },
});
