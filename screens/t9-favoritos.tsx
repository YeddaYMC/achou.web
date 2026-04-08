import { Heart, MapPin, Phone } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';

export default function T9Favoritos() {
  const { isDarkMode, favorites, toggleFavorite, businesses, setSelectedBusiness, navigateTo, isLoggedIn, userProfile } = useAppContext();
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const titleTextColor = isDarkMode ? '#F9FAFB' : colors.foreground;
  const businessNameColor = isDarkMode ? '#F3F4F6' : '#1E3A8A';
  const secondaryTextColor = isDarkMode ? '#E5E7EB' : '#374151';
  const descriptionTextColor = isDarkMode ? '#F3F4F6' : colors.foreground;
  const screenBg = isDarkMode ? '#252525' : colors.background;

  // Log ao entrar na tela
  React.useEffect(() => {
    console.log('=== TELA T9 ABERTA ===');
    console.log('isLoggedIn:', isLoggedIn);
    console.log('userProfile:', userProfile?.name);
    console.log('businesses.length:', businesses.length);
    console.log('favorites:', favorites);
  }, []);

  // Filtra negócios favoritados
  const favoriteBusinesses = useMemo(() => {
    const filtered = businesses.filter((b) => favorites?.includes(b.id));
    const sorted = [...filtered].sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR', { sensitivity: 'base' })
    );
    console.log('T9 - Favoritos:', favorites, 'Negócios encontrados:', filtered.length);
    if (sorted.length > 0) {
      console.log('Negócios:', sorted.map(b => ({ id: b.id, name: b.name })));
    }
    return sorted;
  }, [businesses, favorites]);

  const handleRemoveFavorite = (businessId: number) => {
    console.log('Removendo favorito:', businessId);
    toggleFavorite(businessId);
  };

  const handleViewBusiness = (business: any) => {
    setSelectedBusiness(business);
    navigateTo('T4');
  };

  const getBusinessImageSource = (business: any) => {
    const rawImage = business?.image ?? business?.fotos?.[0] ?? null;
    if (!rawImage) return null;

    if (typeof rawImage === 'string') {
      return { uri: rawImage };
    }

    if (rawImage?.uri && typeof rawImage.uri === 'string') {
      return { uri: rawImage.uri };
    }

    return rawImage;
  };

  return (
    <LayoutRN>
      <ScrollView style={[styles.container, { backgroundColor: screenBg, paddingHorizontal: spacing.md }]}>
        <View style={[styles.titleRow, { marginBottom: spacing.lg, marginTop: spacing.lg }]}> 
          <Heart size={26} color="#EF4444" fill="#EF4444" />
          <Text style={[styles.title, { color: titleTextColor, fontSize: fontSize['2xl'] }]}> 
            Meus Favoritos
          </Text>
        </View>

        {favoriteBusinesses.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>😔</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum favorito ainda</Text>
            <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>Adicione seus negócios favoritos ao clicar no ❤️</Text>
            <Button
              onPress={() => navigateTo('T1')}
              style={{
                backgroundColor: colors.success,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                marginTop: spacing.lg,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Explorar Negócios</Text>
            </Button>
          </View>
        ) : (
          <View style={{ gap: spacing.md, paddingBottom: spacing.xl }}>
            {favoriteBusinesses.map((business) => (
              <View
                key={business.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDarkMode ? '#111827' : colors.formBackground,
                    borderColor: colors.formBorder,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={{ alignItems: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      textAlign: 'center',
                      color: businessNameColor,
                    }}
                  >
                    {business.name}
                  </Text>
                </View>

                {/* Imagem */}
                {getBusinessImageSource(business) && (
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: 16 / 9,
                      backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                      borderTopLeftRadius: borderRadius.lg,
                      borderTopRightRadius: borderRadius.lg,
                      padding: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={getBusinessImageSource(business) as any}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Conteúdo */}
                <View style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      {business.categories && business.categories.length > 0 && (
                        <Text style={[styles.businessCategory, { color: secondaryTextColor }]}>
                          {business.categories.join(', ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFavorite(business.id)} style={{ padding: 8 }}>
                      <Heart size={24} color="#EF4444" fill="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Localização */}
                  {business.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
                      <MapPin size={16} color={secondaryTextColor} />
                      <Text style={[styles.businessInfo, { color: secondaryTextColor }]}>{business.location}</Text>
                    </View>
                  )}

                  {/* Telefone */}
                  {business.phone && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
                      <Phone size={16} color={secondaryTextColor} />
                      <Text style={[styles.businessInfo, { color: secondaryTextColor }]}>{business.phone}</Text>
                    </View>
                  )}

                  {/* Descrição */}
                  {business.description && (
                    <Text
                      style={[styles.businessDescription, { color: descriptionTextColor, marginTop: spacing.sm }]}
                      numberOfLines={2}
                    >
                      {business.description}
                    </Text>
                  )}

                  {/* Botão Ver Detalhes */}
                  <Button
                    onPress={() => handleViewBusiness(business)}
                    style={{
                      backgroundColor: colors.success,
                      marginTop: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: fontSize.sm }}>Ver Detalhes</Text>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  businessCategory: {
    fontSize: 12,
    marginTop: 4,
  },
  businessInfo: {
    fontSize: 12,
  },
  businessDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
