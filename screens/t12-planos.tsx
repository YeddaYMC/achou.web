import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { useAppContext } from '../context/AppContext';

const PLANOS = [
  {
    nivel: 1,
    nome: 'Gratuito',
    preco: 'R$ 0,00',
    precoMensal: 0,
    cor: '#6B7280',
    recursos: [
      '1 anúncio ativo',
      '1 foto por anúncio',
      '1 categoria',
      'Contatos básicos (telefone, WhatsApp, email)',
      'Sem links adicionais',
      'Sem destaque "Imperdível"',
    ],
  },
  {
    nivel: 2,
    nome: 'Básico',
    preco: 'R$ 19,99/mês',
    precoMensal: 19.99,
    cor: '#3B82F6',
    recursos: [
      '1 anúncio ativo',
      '1 foto por anúncio',
      'Múltiplas categorias',
      'Todos os contatos',
      '✨ Links adicionais (Site, Instagram, Facebook, Pinterest)',
      'Sem destaque "Imperdível"',
    ],
  },
  {
    nivel: 3,
    nome: 'Profissional',
    preco: 'R$ 29,99/mês',
    precoMensal: 29.99,
    cor: '#8B5CF6',
    recursos: [
      '1 anúncio ativo',
      '⭐ Até 3 fotos por anúncio',
      'Múltiplas categorias',
      'Todos os contatos',
      'Links adicionais',
      '🔥 Destaque "Imperdível" no anúncio',
      'Melhor visibilidade nos resultados',
    ],
  },
  {
    nivel: 4,
    nome: 'Premium',
    preco: 'R$ 39,99/mês',
    precoMensal: 39.99,
    cor: '#F59E0B',
    recursos: [
      '1 anúncio ativo',
      '⭐ Até 5 fotos por anúncio',
      'Múltiplas categorias',
      'Todos os contatos',
      'Links adicionais',
      'Destaque "Imperdível"',
      'Prioridade máxima nos resultados',
      '📊 Relatórios de visualizações',
      'Suporte prioritário',
    ],
  },
];

export default function T12Planos() {
  const { navigateTo, userProfile, setUserProfile, isDarkMode } = useAppContext();
  const nivelAtual = userProfile?.anuncianteLevel || 1;

  const ChevronLeftIcon: any = ChevronLeft;

  const handleUpgrade = (nivel: number) => {
    if (nivel === nivelAtual) {
      Alert.alert('Plano Atual', 'Você já está neste plano!');
      return;
    }

    if (nivel < nivelAtual) {
      Alert.alert(
        'Downgrade de Plano',
        'Para fazer downgrade do seu plano, entre em contato com nosso suporte.',
        [{ text: 'OK' }]
      );
      return;
    }

    const plano = PLANOS.find((p) => p.nivel === nivel);
    if (!plano) return;

    Alert.alert(
      'Upgrade de Plano',
      `Deseja fazer upgrade para o plano ${plano.nome} (${plano.preco})?\n\nEsta é uma demonstração. Em produção, aqui seria integrado um gateway de pagamento.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar (DEMO)',
          onPress: () => {
            // DEMO: Atualiza o nível localmente
            if (userProfile) {
              setUserProfile({ ...userProfile, anuncianteLevel: nivel as 1 | 2 | 3 | 4 });
              Alert.alert('Sucesso!', `Plano atualizado para ${plano.nome}! (Demonstração)`, [
                { text: 'OK', onPress: () => navigateTo('perfil') },
              ]);
            }
          },
        },
      ]
    );
  };

  const cardBgColor = isDarkMode ? '#1F2937' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const subtextColor = isDarkMode ? '#D1D5DB' : '#6B7280';

  return (
    <LayoutRN>
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('perfil')}>
            <ChevronLeftIcon size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Planos e Upgrade</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Escolha o melhor plano para o seu negócio
          </Text>

          {PLANOS.map((plano) => {
            const isAtual = plano.nivel === nivelAtual;
            const isPastLevel = plano.nivel < nivelAtual;

            return (
              <View
                key={plano.nivel}
                style={[
                  styles.planCard,
                  { backgroundColor: cardBgColor },
                  isAtual && { borderColor: plano.cor, borderWidth: 3 },
                ]}
              >
                {/* Badge do nível atual */}
                {isAtual && (
                  <View style={[styles.currentBadge, { backgroundColor: plano.cor }]}>
                    <Text style={styles.currentBadgeText}>Plano Atual</Text>
                  </View>
                )}

                {/* Cabeçalho do plano */}
                <View style={styles.planHeader}>
                  <Text style={[styles.planNome, { color: textColor }]}>{plano.nome}</Text>
                  <Text style={[styles.planPreco, { color: plano.cor }]}>{plano.preco}</Text>
                </View>

                {/* Lista de recursos */}
                <View style={styles.recursosList}>
                  {plano.recursos.map((recurso, idx) => (
                    <View key={idx} style={styles.recursoItem}>
                      <Text style={{ color: plano.cor, fontSize: 16, marginRight: 8 }}>✓</Text>
                      <Text style={[styles.recursoText, { color: subtextColor }]}>{recurso}</Text>
                    </View>
                  ))}
                </View>

                {/* Botão de ação */}
                <TouchableOpacity
                  onPress={() => handleUpgrade(plano.nivel)}
                  disabled={isAtual}
                  style={[
                    styles.actionButton,
                    { backgroundColor: isAtual ? '#9CA3AF' : plano.cor },
                  ]}
                >
                  <Text style={styles.actionButtonText}>
                    {isAtual ? 'Plano Atual' : isPastLevel ? 'Fazer Downgrade' : 'Fazer Upgrade'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Informação adicional */}
          <View style={[styles.infoBox, { backgroundColor: cardBgColor }]}>
            <Text style={[styles.infoTitle, { color: textColor }]}>💡 Informações</Text>
            <Text style={[styles.infoText, { color: subtextColor }]}>
              • Todos os planos permitem 1 anúncio ativo{'\n'}
              • Você pode fazer upgrade a qualquer momento{'\n'}
              • Para downgrade, entre em contato com o suporte{'\n'}
              • Pagamento mensal recorrente{'\n'}
              • Cancele quando quiser, sem multas
            </Text>
          </View>
        </ScrollView>
      </View>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  planNome: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  planPreco: {
    fontSize: 20,
    fontWeight: '600',
  },
  recursosList: {
    marginBottom: 20,
  },
  recursoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recursoText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
