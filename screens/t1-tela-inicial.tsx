import { Heart, Truck, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../components/ui/sonner';
import { useAppContext } from '../context/AppContext';
import { mockBusinesses } from '../dados-teste/negociosTesteP';

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
  const { navigateTo, setSelectedBusiness, favorites, isDarkMode } = useAppContext();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Categorias selecionadas (múltiplas)
  const [filteredBusinesses, setFilteredBusinesses] = useState(mockBusinesses); // Negócios filtrados
  
  // Aplica filtros quando categorias mudam
  useEffect(() => {
    let results = mockBusinesses;
    if (selectedCategories.length > 0) {
      results = results.filter(b => {
        // Se filtro de Entrega Rápida está selecionado
        if (selectedCategories.includes('Entrega Rápida na Região')) {
          const hasDelivery = b.entregaRapida === true;
          const hasOtherCategory = b.categories.some(cat => selectedCategories.filter(c => c !== 'Entrega Rápida na Região').includes(cat));
          // Se há outros filtros além de Entrega Rápida, deve ter entrega E uma das categorias
          if (selectedCategories.length > 1) {
            return hasDelivery && hasOtherCategory;
          }
          // Se só tem filtro de Entrega Rápida, retorna apenas os que têm entrega
          return hasDelivery;
        }
        // Filtro normal de categorias
        return b.categories.some(cat => selectedCategories.includes(cat));
      });
    }
    console.log('Categorias selecionadas:', selectedCategories);
    console.log('Resultados filtrados:', results.map(b => ({ name: b.name, categories: b.categories, entregaRapida: b.entregaRapida })));
    setFilteredBusinesses(results); // Atualiza lista
  }, [selectedCategories]);

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
        <View style={styles.cardGrid}>
          {filteredBusinesses.map((business) => (
            <TouchableOpacity key={business.id} onPress={() => handleCardClick(business)} style={styles.cardWrapper}>
              <Card style={[styles.businessCard, isDarkMode && styles.businessCardDark]}>
                <Image
                  source={typeof business.image === 'string' ? { uri: business.image } : business.image}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardContent}>
                  <View style={styles.badgesRow}>
                    {business.categories.map((category, idx) => (
                      <Badge 
                        key={idx}
                        variant="default" 
                        style={[
                          styles.categoryBadge,
                          category === 'Imperdíveis' && styles.categoryBadgeImperdiveis
                        ]}
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
                  <Text style={[styles.businessName, isDarkMode && styles.businessNameDark]}>{business.name}</Text>
                  <Text style={[styles.businessDesc, isDarkMode && styles.businessDescDark]} numberOfLines={2}>
                    {business.description}
                  </Text>
                  <Text style={[styles.businessLocation, isDarkMode && styles.businessLocationDark]}>
                    📍 {business.location} • {business.cep}
                  </Text>
                </View>

                {/* Ícone de favorito */}
                <View style={styles.favIcon}>
                  <Heart
                    size={20}
                    color={favorites?.includes(business.id) ? '#ef4444' : '#cbd5e1'}
                    fill={favorites?.includes(business.id) ? '#ef4444' : 'none'}
                  />
                </View>
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
    backgroundColor: '#0f172a', // Fundo dark
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
    backgroundColor: '#1e293b', // Fundo dark
    borderColor: '#0ea5e9', // Cor borda dark
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
    height: 44, // Altura fixa
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
  },
  cardWrapper: {
    width: '100%', // Largura total
    marginBottom: 8, // Espaço inferior
  },
  businessCard: {
    overflow: 'hidden', // Corta conteúdo
    borderWidth: 2, // Borda
    borderColor: '#1e3a8a', // Cor borda
  },
  businessCardDark: {
    borderColor: '#0ea5e9', // Cor borda dark
  },
  cardImage: {
    width: '100%', // Largura total
    height: 200, // Altura fixa
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
