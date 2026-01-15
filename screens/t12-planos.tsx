import { getAuth } from 'firebase/auth';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Checkbox } from '../components/ui/checkbox';
import { useAppContext } from '../context/AppContext';
import app from '../firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

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
  const [isLoading, setIsLoading] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [nivelEmUpgrade, setNivelEmUpgrade] = useState<number | null>(null);

  const ChevronLeftIcon: any = ChevronLeft;

  const handleUpgrade = async (nivel: number) => {
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

    // Mostrar modal de termos antes de upgrade
    setNivelEmUpgrade(nivel);
    setAceitouTermos(false);
  };

  const handleConfirmUpgrade = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      Alert.alert('Erro', 'Usuário não identificado');
      return;
    }

    if (!aceitouTermos) {
      Alert.alert('Aviso', 'Você precisa aceitar os termos e condições');
      return;
    }

    if (!nivelEmUpgrade) {
      Alert.alert('Erro', 'Nível de upgrade não definido');
      return;
    }

    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        anuncianteLevel: nivelEmUpgrade,
        updatedAt: new Date().toISOString(),
      });

      setUserProfile({
        ...userProfile,
        anuncianteLevel: nivelEmUpgrade as 1 | 2 | 3 | 4,
      } as any);

      Alert.alert('Sucesso', 'Upgrade realizado com sucesso!');
      setNivelEmUpgrade(null);
      setAceitouTermos(false);
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      Alert.alert('Erro', 'Erro ao processar seu upgrade. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelUpgrade = () => {
    setNivelEmUpgrade(null);
    setAceitouTermos(false);
  };

  const planoUpgrade = PLANOS.find(p => p.nivel === nivelEmUpgrade);

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
        </ScrollView>

        {/* Modal de Termos e Condições */}
        <Modal
          visible={nivelEmUpgrade !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={handleCancelUpgrade}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBgColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Confirmar {planoUpgrade?.nome}
              </Text>
              
              <View style={styles.modalBody}>
                <Text style={[styles.modalText, { color: subtextColor }]}>
                  Você está prestes a fazer upgrade para o plano{' '}
                  <Text style={{ fontWeight: '600', color: textColor }}>
                    {planoUpgrade?.nome}
                  </Text>
                  {' '}por{' '}
                  <Text style={{ fontWeight: '600', color: planoUpgrade?.cor }}>
                    {planoUpgrade?.preco}
                  </Text>
                  .
                </Text>

                {/* Checkbox de Termos */}
                <View style={styles.termsContainer}>
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      checked={aceitouTermos}
                      onCheckedChange={setAceitouTermos}
                    />
                    <Text style={[styles.termsText, { color: subtextColor }]}>
                      Li e aceito os{' '}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      handleCancelUpgrade();
                      navigateTo('T11');
                    }}
                  >
                    <Text style={[styles.termsLink, { color: planoUpgrade?.cor }]}>
                      Termos e Condições
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botões de ação */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleCancelUpgrade}
                  style={[styles.modalButton, styles.cancelButton, { borderColor: subtextColor }]}
                >
                  <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleConfirmUpgrade}
                  disabled={!aceitouTermos || isLoading}
                  style={[
                    styles.modalButton,
                    styles.confirmButton,
                    {
                      backgroundColor: aceitouTermos && !isLoading ? planoUpgrade?.cor : '#D1D5DB',
                    },
                  ]}
                >
                  <Text style={styles.confirmButtonText}>
                    {isLoading ? 'Processando...' : 'Confirmar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    marginLeft: 8,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
