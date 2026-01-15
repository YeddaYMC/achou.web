import { Heart, MapPin, Phone } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';

export default function T9Favoritos() {
  const { isDarkMode, favorites, setFavorites, businesses, setSelectedBusiness, navigateTo, isLoggedIn, userProfile } = useAppContext();
  const { colors, spacing, fontSize, borderRadius } = useTheme();

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
    console.log('T9 - Favoritos:', favorites, 'Negócios encontrados:', filtered.length);
    if (filtered.length > 0) {
      console.log('Negócios:', filtered.map(b => ({ id: b.id, name: b.name })));
    }
    return filtered;
  }, [businesses, favorites]);

  const handleRemoveFavorite = (businessId: number) => {
    console.log('Removendo favorito:', businessId);
    setFavorites((favorites || []).filter((id) => id !== businessId));
  };

  const handleViewBusiness = (business: any) => {
    setSelectedBusiness(business);
    navigateTo('T4');
  };

  return (
    <LayoutRN>
      <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: spacing.md }]}>
        <Text style={[styles.title, { color: colors.foreground, fontSize: fontSize['2xl'], marginBottom: spacing.lg, marginTop: spacing.lg }]}>
          ❤️ Meus Favoritos
        </Text>

        {favoriteBusinesses.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>😔</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum favorito ainda</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Adicione seus negócios favoritos ao clicar no ❤️</Text>
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
                    backgroundColor: colors.formBackground,
                    borderColor: colors.formBorder,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                {/* Imagem */}
                {business.image && (
                  <Image
                    source={business.image}
                    style={{
                      width: '100%',
                      height: 160,
                      borderTopLeftRadius: borderRadius.lg,
                      borderTopRightRadius: borderRadius.lg,
                    }}
                    resizeMode="cover"
                  />
                )}

                {/* Conteúdo */}
                <View style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.businessName, { color: colors.foreground }]}>{business.name}</Text>
                      {business.categories && business.categories.length > 0 && (
                        <Text style={[styles.businessCategory, { color: colors.muted }]}>
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
                      <MapPin size={16} color={colors.muted} />
                      <Text style={[styles.businessInfo, { color: colors.muted }]}>{business.location}</Text>
                    </View>
                  )}

                  {/* Telefone */}
                  {business.phone && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
                      <Phone size={16} color={colors.muted} />
                      <Text style={[styles.businessInfo, { color: colors.muted }]}>{business.phone}</Text>
                    </View>
                  )}

                  {/* Descrição */}
                  {business.description && (
                    <Text
                      style={[styles.businessDescription, { color: colors.foreground, marginTop: spacing.sm }]}
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
