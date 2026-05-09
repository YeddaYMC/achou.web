import { getAuth } from 'firebase/auth';
import { ChevronLeft, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';
import app from '../firebaseConfig';
import { deleteAnuncio } from '../src/services/anuncioService';
import { deleteCloudinaryImagesByUrls } from '../src/services/cloudinaryService';

const { width } = Dimensions.get('window');
const TEST_UNLIMITED_BUSINESS_EMAIL = 'yedda2026@gmail.com';

export default function T7PainelGestao() {
  const {
    navigateTo,
    navigateBack,
    setSelectedBusiness,
    businesses,
    userProfile,
    setBusinesses,
    isDarkMode,
  } = useAppContext();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<any>(null);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);

  const currentUid = getAuth(app).currentUser?.uid;
  const canCreateUnlimitedBusinesses = Boolean(
    userProfile?.email && userProfile.email.trim().toLowerCase() === TEST_UNLIMITED_BUSINESS_EMAIL
  );

  // Filtra apenas os anúncios do usuário (por email ou uid)
  const myBusinesses = businesses.filter((b: any) => {
    const byEmail = Boolean(userProfile?.email) && b.owner === userProfile?.email;
    const byUid = Boolean(currentUid) && b.ownerId === currentUid;
    return byEmail || byUid;
  }).sort((a: any, b: any) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR', { sensitivity: 'base' })
  );

  const formatAddress = (b: any) => {
    const parts = [b?.street, b?.number, b?.neighborhood, b?.city, b?.state, b?.cep].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    return b?.location || 'Endereço não informado';
  };

  const handleViewBusiness = (business: any) => {
    setSelectedBusiness(business);
    navigateTo('T4');
  };

  const handleDeleteRequest = (business: any) => {
    setBusinessToDelete(business);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!businessToDelete || isDeletingBusiness) return;

    setIsDeletingBusiness(true);
    try {
      const imageUrls: string[] = Array.isArray(businessToDelete.fotos)
        ? businessToDelete.fotos
        : (businessToDelete.image ? [businessToDelete.image] : []);

      // Se tiver ID string de Firestore, remove no banco também
      if (typeof businessToDelete.id === 'string' && businessToDelete.id.length > 0) {
        await deleteAnuncio(businessToDelete.id);
      }

      const cloudinaryResult = await deleteCloudinaryImagesByUrls(imageUrls);

      setBusinesses(businesses.filter(b => b.id !== businessToDelete.id));
      setDeleteModalVisible(false);
      setBusinessToDelete(null);

      if (!cloudinaryResult.success && cloudinaryResult.error) {
        console.warn('⚠️ Falha ao remover imagens do Cloudinary:', cloudinaryResult.error);
        Alert.alert(
          '⚠️ Aviso de Limpeza',
          `Anúncio excluído do banco, mas não foi possível remover ${cloudinaryResult.skipped} imagem(ns) do servidor de armazenamento.\n\nDetalhes: ${cloudinaryResult.error}`,
          [{ text: 'OK' }]
        );
      } else if (cloudinaryResult.deleted > 0) {
        console.log(`✓ ${cloudinaryResult.deleted} imagem(ns) removida(s) do Cloudinary`);
      }
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
    } finally {
      setIsDeletingBusiness(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setBusinessToDelete(null);
  };

  const containerStyle = {
    ...styles.container,
    ...(isDarkMode && styles.containerDark),
  };

  const cardStyle = {
    ...styles.card,
    ...(isDarkMode && styles.cardDark),
  };

  const titleStyle = {
    ...styles.title,
    ...(isDarkMode && styles.titleDark),
  };

  const sectionTitleStyle = {
    ...styles.sectionTitle,
    ...(isDarkMode && styles.sectionTitleDark),
  };

  const textStyle = {
    ...styles.text,
    ...(isDarkMode && styles.textDark),
  };

  const businessItemStyle = {
    ...styles.businessItem,
    ...(isDarkMode && styles.businessItemDark),
  };

  const businessNameStyle = {
    ...styles.businessName,
    ...(isDarkMode && styles.businessNameDark),
  };

  const businessInfoStyle = {
    ...styles.businessInfo,
    ...(isDarkMode && styles.businessInfoDark),
  };

  const modalContentStyle = {
    ...styles.modalContent,
    ...(isDarkMode && styles.modalContentDark),
  };

  const modalTitleStyle = {
    ...styles.modalTitle,
    ...(isDarkMode && styles.modalTitleDark),
  };

  const modalTextStyle = {
    ...styles.modalText,
    ...(isDarkMode && styles.modalTextDark),
  };

  return (
    <LayoutRN>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <ChevronLeft size={20} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
            <Text style={{ color: isDarkMode ? '#60a5fa' : '#2563eb', marginLeft: 4 }}>
              Voltar
            </Text>
          </TouchableOpacity>

          <View style={containerStyle}>
            <Text style={titleStyle}>Gestão de Anúncios</Text>

            <View style={styles.sections}>
              <View style={cardStyle}>
                <Text style={sectionTitleStyle}>Meus Anúncios</Text>

                {myBusinesses.length === 0 ? (
                  <View>
                    <Text style={textStyle}>
                      Você ainda não possui anúncio publicado.
                    </Text>
                    <View style={styles.buttonContainer}>
                      <Button
                        onPress={() => {
                          if (!canCreateUnlimitedBusinesses && myBusinesses.length >= 1) {
                            setLimitModalVisible(true);
                          } else {
                            setSelectedBusiness(null);
                            navigateTo('T6');
                          }
                        }}
                        style={styles.insertButton}
                      >
                        Inserir Anúncio
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View style={styles.businessList}>
                    {myBusinesses.map((mb: any) => (
                      <View key={mb.id} style={businessItemStyle}>
                        <View style={styles.businessInfo}>
                          <Text style={businessNameStyle}>{mb.name}</Text>
                          <Text style={businessInfoStyle}>
                            {(mb.category || mb.categories?.[0] || 'Sem categoria')} • {formatAddress(mb)}
                          </Text>
                        </View>
                        <View style={styles.businessActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedBusiness(mb);
                              navigateTo('T6');
                            }}
                            style={styles.actionButtonOutline}
                          >
                            <Text style={styles.actionButtonOutlineText}>Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleViewBusiness(mb)}
                            style={styles.actionButtonOutline}
                          >
                            <Text style={styles.actionButtonOutlineText}>
                              Visualizar
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteRequest(mb)}
                            style={styles.actionButtonDelete}
                          >
                            <Text style={styles.actionButtonDeleteText}>
                              Excluir
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <View style={styles.buttonContainer}>
                      <Button
                        onPress={() => {
                          if (!canCreateUnlimitedBusinesses && myBusinesses.length >= 1) {
                            setLimitModalVisible(true);
                          } else {
                            setSelectedBusiness(null);
                            navigateTo('T6');
                          }
                        }}
                        style={styles.insertAnotherButton}
                      >
                        Inserir outro anúncio
                      </Button>
                    </View>
                  </View>
                )}
              </View>

              <View style={cardStyle}>
                <Text style={sectionTitleStyle}>Configurações</Text>
                <Button
                  onPress={() => navigateTo('T5')}
                  style={styles.configButton}
                >
                  <View style={styles.configButtonContent}>
                    <User size={20} color="#fff" style={styles.configButtonIcon} />
                    <Text style={styles.configButtonText}>
                      Gerenciar Minha Conta
                    </Text>
                  </View>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={modalContentStyle}>
            <Text style={modalTitleStyle}>Confirmar Exclusão</Text>
            <Text style={modalTextStyle}>
              Tem certeza que deseja excluir este anúncio? Esta ação não pode ser
              desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleDeleteCancel}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteConfirm}
                style={[styles.modalConfirmButton, isDeletingBusiness && { opacity: 0.6 }]}
                disabled={isDeletingBusiness}
              >
                <Text style={styles.modalConfirmText}>{isDeletingBusiness ? 'Excluindo...' : 'Sim, excluir'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de limite Freemium */}
      <Modal
        visible={limitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLimitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={modalContentStyle}>
            <Text style={modalTitleStyle}>Limite de anúncios atingido</Text>
            <Text style={modalTextStyle}>
              Todos os planos permitem 1 anúncio ativo por CPF. Para publicar um novo anúncio,
              exclua um anúncio existente ou entre em contato para mais opções.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setLimitModalVisible(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setLimitModalVisible(false);
                  // Futuro: navegar para tela de assinatura
                }}
                style={styles.modalSuccessButton}
              >
                <Text style={styles.modalSuccessText}>Assinar Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  container: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    padding: 24,
  },
  containerDark: {
    backgroundColor: '#111827',
    borderColor: '#1d4ed8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 32,
  },
  titleDark: {
    color: '#60a5fa',
  },
  sections: {
    gap: 16,
  },
  card: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#1f2937',
    borderColor: '#1d4ed8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#93c5fd',
  },
  text: {
    color: '#6b7280',
    marginBottom: 16,
  },
  textDark: {
    color: '#9ca3af',
  },
  buttonContainer: {
    marginTop: 12,
  },
  insertButton: {
    height: 48,
    backgroundColor: '#16a34a',
  },
  insertAnotherButton: {
    height: 48,
    backgroundColor: '#2563eb',
  },
  businessList: {
    gap: 16,
  },
  businessItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  businessItemDark: {
    backgroundColor: '#111827',
    borderColor: '#374151',
  },
  businessInfo: {
    marginBottom: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  businessNameDark: {
    color: '#93c5fd',
  },
  businessInfoStyle: {
    fontSize: 14,
    color: '#6b7280',
  },
  businessInfoDark: {
    color: '#9ca3af',
  },
  businessActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButtonOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  actionButtonOutlineText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonDelete: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  actionButtonDeleteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  configButton: {
    height: 48,
    backgroundColor: '#16a34a',
  },
  configButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configButtonIcon: {
    marginRight: 8,
  },
  configButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#1f2937',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  modalTitleDark: {
    color: '#93c5fd',
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalTextDark: {
    color: '#d1d5db',
  },
  modalActions: {
    flexDirection: 'column',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    backgroundColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingVertical: 12,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSuccessButton: {
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSuccessText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
