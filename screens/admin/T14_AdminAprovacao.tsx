import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, where } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../../components/Layout-RN';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAppContext } from '../../context/AppContext';
import app from '../../firebaseConfig';
import type { Anuncio as ServiceAnuncio } from '../../src/services/anuncioService';
import { aprovarAnuncio, deleteAnuncio, getAllActiveAnuncios, getAnunciosPendentes, reprovarAnuncio } from '../../src/services/anuncioService';

// Usamos o tipo `Anuncio` exportado pelo serviço para manter a tipagem consistente
type Anuncio = ServiceAnuncio;

export default function AdminAprovacao() {
  const { isDarkMode, setCurrentScreen, navigateBack, navigateTo, setSelectedBusiness, businesses, setBusinesses } = useAppContext();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [selectedAnuncio, setSelectedAnuncio] = useState<Anuncio | null>(null);
  const [anuncioRelacionado, setAnuncioRelacionado] = useState<any>(null);
  const [loadingAnuncioRelacionado, setLoadingAnuncioRelacionado] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('pendente');
  const [acao, setAcao] = useState<'aprovar' | 'reprovar' | 'excluir' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAnuncios, setLoadingAnuncios] = useState(true);

  const styles = getStyles(isDarkMode);

  // Carregar anúncios pendentes ao montar componente
  useEffect(() => {
    const carregarAnuncios = async () => {
      try {
        setLoadingAnuncios(true);
        const anunciosPendentes = await getAnunciosPendentes();
        setAnuncios(anunciosPendentes);
      } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
        alert('Erro ao carregar anúncios. Verifique os logs.');
      } finally {
        setLoadingAnuncios(false);
      }
    };

    carregarAnuncios();
  }, []);

  const handleVoltar = () => {
    setCurrentScreen('AdminPainel');
  };

  const handleAbrirDetalhe = async (anuncio: Anuncio) => {
    setSelectedAnuncio(anuncio);
    setAcao(null);
    setMotivo('');
    setAnuncioRelacionado(null);
    setShowDetailDialog(true);
    setLoadingAnuncioRelacionado(true);

    try {
      const firestore = getFirestore(app);
      const rawAnuncioId = String(anuncio.id || '').trim();
      const numericAnuncioId = Number(rawAnuncioId);

      // Tenta obter documento direto por ID
      const anuncioRef = doc(firestore, 'anuncios', rawAnuncioId);
      const anuncioSnap = await getDoc(anuncioRef);

      if (anuncioSnap.exists()) {
        setAnuncioRelacionado({ id: anuncioSnap.id, ...anuncioSnap.data() });
        return;
      }

      // Tentativas de fallback: idNegocio, businessId, id (campos legados)
      const candidates: Array<string | number> = [rawAnuncioId];
      if (!Number.isNaN(numericAnuncioId)) candidates.push(numericAnuncioId);

      // Busca correspondência em businesses do contexto para obter firestoreId quando disponível
      const businessMatch = (businesses || []).find((b: any) =>
        b.firestoreId === rawAnuncioId || String(b.id) === rawAnuncioId || (!Number.isNaN(numericAnuncioId) && b.id === numericAnuncioId)
      );

      if (businessMatch?.firestoreId) candidates.push(businessMatch.firestoreId);

      let found = false;
      for (const candidate of candidates) {
        const fallbackQueries = [where('idNegocio', '==', candidate), where('businessId', '==', candidate), where('id', '==', candidate)];
        for (const fallbackWhere of fallbackQueries) {
          const fallbackSnapshot = await getDocs(query(collection(firestore, 'anuncios'), fallbackWhere, limit(1)));
          if (!fallbackSnapshot.empty) {
            const docSnap = fallbackSnapshot.docs[0];
            setAnuncioRelacionado({ id: docSnap.id, ...docSnap.data() });
            found = true;
            break;
          }
        }
        if (found) break;
      }

      if (!found) setAnuncioRelacionado(null);
    } catch (error) {
      console.warn('Erro ao carregar anúncio relacionado (AdminAprovacao):', error);
      setAnuncioRelacionado(null);
    } finally {
      setLoadingAnuncioRelacionado(false);
    }
  };

  const handleTomarAcao = async () => {
    if (!selectedAnuncio || !acao) {
      alert('Escolha uma ação');
      return;
    }

    if ((acao === 'reprovar' || acao === 'excluir') && !motivo.trim()) {
      alert('Justifique a ação');
      return;
    }

    setLoading(true);
    try {
      // Executar ação de moderação no Firestore
      const currentUser = getAuth(app).currentUser;
      const moderadorId = currentUser?.uid || currentUser?.email || '';
      if (!selectedAnuncio.id) {
        alert('ID do anúncio ausente. Impossível processar a ação.');
        setLoading(false);
        return;
      }

      const anuncioId = selectedAnuncio.id;

      if (acao === 'aprovar') {
        await aprovarAnuncio(anuncioId, moderadorId);
      } else if (acao === 'reprovar') {
        await reprovarAnuncio(anuncioId, moderadorId, motivo);
      } else if (acao === 'excluir') {
        await deleteAnuncio(anuncioId);
      }

      // Atualizar lista local removendo o anúncio moderado
      setAnuncios(prev => prev.filter(a => a.id !== selectedAnuncio.id));

      // Recarregar anúncios aprovados para atualizar feed público
      try {
        const anunciosAtivos = await getAllActiveAnuncios();
        // Mapear para formato Business semelhante ao AppContext
        const mapped = anunciosAtivos.map((anuncio) => {
          const enderecoPartes = [anuncio.street, anuncio.number, anuncio.neighborhood, anuncio.city, anuncio.state]
            .filter(Boolean)
            .join(', ');

          const stableId = anuncio.id ? Math.abs(Array.from(String(anuncio.id)).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)) : Math.abs(Array.from(String(anuncio.name + '-' + anuncio.userId)).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0));

          return ({
            id: stableId,
            firestoreId: anuncio.id,
            name: anuncio.name,
            category: anuncio.category,
            categories: [anuncio.category],
            location: anuncio.location || enderecoPartes,
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
            fotos: anuncio.fotos || [],
            lat: typeof anuncio.lat === 'number' ? anuncio.lat : null,
            lon: typeof anuncio.lon === 'number' ? anuncio.lon : null,
            origemGeo: anuncio.origemGeo ?? null,
            instagram: anuncio.instagram,
            facebook: anuncio.facebook,
            pinterest: anuncio.pinterest,
            owner: anuncio.userEmail || null,
            ownerId: anuncio.userId || null,
            entregaRapida: anuncio.entregaRapida,
            contactVisibility: anuncio.contactVisibility,
          });
        });

        setBusinesses(mapped);
      } catch (err) {
        console.warn('Falha ao recarregar anúncios após moderação:', err);
      }
      
      alert('Ação realizada com sucesso!');
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Erro ao processar anúncio:', error);
      alert('Erro ao processar anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerAnuncio = () => {
    if (!anuncioRelacionado) return;

    const selectedBusiness = {
      id: 0,
      firestoreId: anuncioRelacionado.id,
      name: anuncioRelacionado.nome || anuncioRelacionado.name || selectedAnuncio?.name || (selectedAnuncio as any)?.titulo || 'Anúncio',
      category: anuncioRelacionado.categoria || anuncioRelacionado.category || '',
      categories: [anuncioRelacionado.categoria || anuncioRelacionado.category].filter(Boolean),
      location: anuncioRelacionado.localizacao || anuncioRelacionado.location || '',
      cep: anuncioRelacionado.cep || '',
      street: anuncioRelacionado.rua || anuncioRelacionado.street || '',
      neighborhood: anuncioRelacionado.bairro || anuncioRelacionado.neighborhood || '',
      city: anuncioRelacionado.cidade || anuncioRelacionado.city || '',
      state: anuncioRelacionado.estado || anuncioRelacionado.state || '',
      number: anuncioRelacionado.numero || anuncioRelacionado.number || '',
      phone: anuncioRelacionado.telefone || anuncioRelacionado.phone || '',
      whatsapp: anuncioRelacionado.whatsapp || '',
      description: anuncioRelacionado.descricao || anuncioRelacionado.description || '',
      image: (Array.isArray(anuncioRelacionado.fotos) ? anuncioRelacionado.fotos[0] : null) || anuncioRelacionado.image || null,
      fotos: anuncioRelacionado.fotos || [],
      lat: typeof anuncioRelacionado.lat === 'number' ? anuncioRelacionado.lat : anuncioRelacionado.latitude ?? null,
      lon: typeof anuncioRelacionado.lon === 'number' ? anuncioRelacionado.lon : anuncioRelacionado.longitude ?? null,
      origemGeo: anuncioRelacionado.origemGeo || null,
      owner: anuncioRelacionado.emailUsuario || anuncioRelacionado.userEmail || null,
      ownerId: anuncioRelacionado.usuarioId || anuncioRelacionado.userId || null,
    };

    setSelectedBusiness(selectedBusiness as any);
    // navegar para tela de detalhes
    navigateTo('T4');
  };

  return (
    <LayoutRN>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
            <ChevronLeft width={24} height={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aprovação de Anúncios</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.infoText}>
          Aprove, rejeite ou exclua anúncios submetidos pelos usuários.
        </Text>

        <View style={styles.listContainer}>
          {anuncios.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum anúncio com status "{filtroStatus}"</Text>
              <Text style={styles.emptyStateSubtext}>
                Novos anúncios aparecerão aqui após sincronização com Firestore
              </Text>
            </View>
          ) : (
            anuncios.map((anuncio) => (
              <Card key={anuncio.id} style={styles.anuncioCard}>
                <View style={styles.anuncioHeader}>
                  <Text style={styles.anuncioTitulo} numberOfLines={1}>{anuncio.name || (anuncio as any).titulo || 'Sem título'}</Text>
                  <View style={[styles.statusBadge, styles[`status_${anuncio.status}`]]}>
                    <Text style={styles.statusText}>{anuncio.status}</Text>
                  </View>
                </View>
                <Text style={styles.anuncioDescricao} numberOfLines={2}>{anuncio.description || (anuncio as any).descricao || ''}</Text>
                <View style={styles.anuncioMeta}>
                  <Text style={styles.metaText}>Usuário: {(anuncio.userId ?? (anuncio as any).usuarioId ?? '').slice(0, 8) || '—' }...</Text>
                </View>
                <Button onPress={() => handleAbrirDetalhe(anuncio)} style={styles.detalheButton} textStyle={styles.detalheButtonText}>
                  <Text style={styles.detalheButtonText}>Ver Detalhes</Text>
                </Button>
              </Card>
            ))
          )}
        </View>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent style={styles.dialogContent}>
            <DialogHeader>
              <DialogTitle style={isDarkMode ? styles.dialogTitleDark : undefined}>Moderar Anúncio</DialogTitle>
                <DialogDescription style={isDarkMode ? styles.dialogDescriptionDark : undefined}>
                Título: {selectedAnuncio?.name || (selectedAnuncio as any)?.titulo}
              </DialogDescription>
            </DialogHeader>

            <ScrollView style={styles.dialogScroll} contentContainerStyle={styles.dialogScrollContent} showsVerticalScrollIndicator={true}>
              {(selectedAnuncio as any)?.carimbo && (
                <View style={styles.carimboBox}>
                  <Text style={styles.carimboLabel}>Carimbo da ação</Text>
                  <Text style={styles.carimboText}>{(selectedAnuncio as any).carimbo}</Text>
                </View>
              )}

              <View style={styles.dialogBody}>
                <Text style={styles.label}>Descrição:</Text>
                <Text style={styles.descricaoText}>{selectedAnuncio?.description || (selectedAnuncio as any)?.descricao}</Text>
                {loadingAnuncioRelacionado ? (
                  <Text style={[styles.previewLoadingText, isDarkMode && styles.previewLoadingTextDark]}>
                    Carregando anúncio relacionado...
                  </Text>
                ) : anuncioRelacionado ? (
                  <>
                    <Text style={[styles.label, styles.labelMarginTop]}>Anúncio:</Text>
                    <View style={[styles.anuncioPreview, isDarkMode && styles.anuncioPreviewDark]}>
                      <Text style={[styles.anuncioPreviewTitle, isDarkMode && styles.anuncioPreviewTitleDark]}>
                        {anuncioRelacionado.nome || anuncioRelacionado.name || selectedAnuncio?.name || (selectedAnuncio as any)?.titulo}
                      </Text>
                      <Text style={[styles.anuncioPreviewMeta, isDarkMode && styles.anuncioPreviewMetaDark]}> 
                        {anuncioRelacionado.categoria || anuncioRelacionado.category || ''}
                      </Text>
                      <Text style={[styles.anuncioPreviewDesc, isDarkMode && styles.anuncioPreviewDescDark]} numberOfLines={2}>
                        {anuncioRelacionado.descricao || anuncioRelacionado.description || ''}
                      </Text>
                      <Button onPress={handleVerAnuncio} style={styles.previewButton} textStyle={styles.previewButtonText}>
                        Ver Anúncio
                      </Button>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.previewMissingText, isDarkMode && styles.previewMissingTextDark]}>
                    Não foi possível carregar o anúncio relacionado.
                  </Text>
                )}

                <Text style={[styles.label, styles.labelMarginTop]}>Ação:</Text>
                <View style={styles.acaoButtons}>
                  <Button onPress={() => setAcao('aprovar')} style={[styles.acaoBtn, acao === 'aprovar' && styles.acaoBtnAprovado]} textStyle={styles.acaoBtnText}>
                    <Text style={styles.acaoBtnText}>✓ Aprovar</Text>
                  </Button>
                  <Button onPress={() => setAcao('reprovar')} style={[styles.acaoBtn, acao === 'reprovar' && styles.acaoBtnReprovado]} textStyle={styles.acaoBtnText}>
                    <Text style={styles.acaoBtnText}>✗ Reprovar</Text>
                  </Button>
                  <Button onPress={() => setAcao('excluir')} style={[styles.acaoBtn, acao === 'excluir' && styles.acaoBtnExcluir]} textStyle={styles.acaoBtnText}>
                    <Text style={styles.acaoBtnText}>🗑 Excluir</Text>
                  </Button>
                </View>

                {(acao === 'reprovar' || acao === 'excluir') && (
                  <>
                    <Label style={[styles.label, styles.labelMarginTop] as any}>Motivo:</Label>
                    <Input
                      placeholder="Explique a decisão..."
                      value={motivo}
                      onChangeText={setMotivo}
                      multiline
                      style={styles.motivoInput}
                      placeholderTextColor={isDarkMode ? '#666' : '#ccc'}
                    />
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.dialogActions}>
              <Button onPress={() => setShowDetailDialog(false)} style={styles.btnCancel} textStyle={styles.btnCancelText}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </Button>
              <Button
                onPress={handleTomarAcao}
                disabled={loading || !acao}
                style={[styles.btnSubmit, (loading || !acao) && styles.btnDisabled] as any}
                textStyle={styles.btnSubmitText}
              >
                <Text style={styles.btnSubmitText}>{loading ? 'Processando...' : 'Confirmar'}</Text>
              </Button>
            </View>
          </DialogContent>
        </Dialog>
      </ScrollView>
    </LayoutRN>
  );
}

function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 80 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#000', flex: 1, textAlign: 'center' },
    infoText: { fontSize: 14, color: isDarkMode ? '#aaa' : '#666', marginBottom: 16, textAlign: 'center' },
    listContainer: { gap: 12 },
    emptyState: { paddingVertical: 40, alignItems: 'center' },
    emptyStateText: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#ccc' : '#333', marginBottom: 8 },
    emptyStateSubtext: { fontSize: 13, color: isDarkMode ? '#888' : '#999', textAlign: 'center' },
    anuncioCard: { padding: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9', borderLeftWidth: 4, borderLeftColor: '#2196f3' },
    anuncioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    anuncioTitulo: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#fff' : '#000', flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    status_pendente: { backgroundColor: '#ffa500' },
    status_aprovado: { backgroundColor: '#4caf50' },
    status_reprovado: { backgroundColor: '#f44336' },
    status_arquivado: { backgroundColor: '#9e9e9e' },
    statusText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    anuncioDescricao: { fontSize: 12, color: isDarkMode ? '#ccc' : '#666', marginBottom: 8 },
    anuncioMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metaText: { fontSize: 11, color: isDarkMode ? '#888' : '#999' },
    detalheButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2196f3', borderRadius: 6 },
    detalheButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    dialogContent: { padding: 20, borderRadius: 12, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', maxHeight: '80%' },
    dialogScroll: { maxHeight: 440 },
    dialogScrollContent: { gap: 16, paddingBottom: 8 },
    dialogTitleDark: { color: '#fff' },
    dialogDescriptionDark: { color: '#aaa' },
    carimboBox: { marginTop: 12, marginBottom: 12, padding: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#262626' : '#eef2ff', borderLeftWidth: 4, borderLeftColor: '#6d28d9' },
    carimboLabel: { fontSize: 12, fontWeight: '700', color: isDarkMode ? '#ddd' : '#4c1d95', marginBottom: 4 },
    carimboText: { fontSize: 13, color: isDarkMode ? '#f3f4f6' : '#1f2937', lineHeight: 18 },
    dialogBody: { gap: 16, marginTop: 16 },
    label: { fontSize: 13, fontWeight: '600', color: isDarkMode ? '#e5e7eb' : '#1f2937' },
    labelMarginTop: { marginTop: 16 },
    descricaoText: { fontSize: 13, color: isDarkMode ? '#ccc' : '#666', padding: 8, backgroundColor: isDarkMode ? '#333' : '#f0f0f0', borderRadius: 4 },
    anuncioPreview: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 6,
      padding: 8,
      backgroundColor: '#f9fafb',
    },
    anuncioPreviewDark: {
      backgroundColor: '#1f2937',
      borderColor: '#374151',
    },
    anuncioPreviewTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1e3a8a',
      marginBottom: 3,
    },
    anuncioPreviewTitleDark: {
      color: '#93c5fd',
    },
    anuncioPreviewMeta: {
      fontSize: 12,
      color: '#6b7280',
      marginBottom: 8,
    },
    anuncioPreviewMetaDark: {
      color: '#9ca3af',
    },
    anuncioPreviewDesc: {
      fontSize: 12,
      color: '#4b5563',
      lineHeight: 18,
    },
    anuncioPreviewDescDark: {
      color: '#cbd5e1',
    },
    previewButton: {
      marginTop: 8,
      paddingVertical: 10,
      borderRadius: 6,
      backgroundColor: '#1976d2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    previewLoadingText: {
      marginTop: 12,
      fontSize: 13,
      color: '#6b7280',
    },
    previewLoadingTextDark: {
      color: '#d1d5db',
    },
    previewMissingText: {
      marginTop: 12,
      fontSize: 13,
      color: '#b91c1c',
    },
    previewMissingTextDark: {
      color: '#fca5a5',
    },
    acaoButtons: { gap: 8 },
    acaoBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: isDarkMode ? '#333' : '#e0e0e0' },
    acaoBtnAprovado: { backgroundColor: '#4caf50' },
    acaoBtnReprovado: { backgroundColor: '#f44336' },
    acaoBtnExcluir: { backgroundColor: '#ef4444' },
    acaoBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    motivoInput: { borderWidth: 1, borderColor: isDarkMode ? '#444' : '#ddd', borderRadius: 6, padding: 10, color: isDarkMode ? '#fff' : '#000', minHeight: 80 },
    dialogActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    btnCancel: { flex: 1, paddingVertical: 12, backgroundColor: isDarkMode ? '#444' : '#e0e0e0', borderRadius: 6 },
    btnCancelText: { color: isDarkMode ? '#fff' : '#000', fontWeight: '600', fontSize: 13 },
    btnSubmit: { flex: 1, paddingVertical: 12, backgroundColor: '#2196f3', borderRadius: 6 },
    btnSubmitText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    btnDisabled: { backgroundColor: '#bdbdbd' },
  });
}
