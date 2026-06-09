import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, Timestamp, where } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../../components/Layout-RN';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAppContext } from '../../context/AppContext';
import app from '../../firebaseConfig';
import { getDenunciasPendentes, resolverDenuncia } from '../../src/services/denunciaService';

interface Denuncia {
  id: string;
  anuncioId: string;
  denuncianteId: string;
  motivo: string;
  descricao: string;
  criadoEm: Timestamp;
  status: 'aberta' | 'em_analise' | 'resolvida';
  carimbo?: string;
  moderadoPor?: string;
  moderadoEm?: Timestamp;
}

export default function AdminDenuncias() {
  function ClientDate({ value, options }: { value: any; options?: Intl.DateTimeFormatOptions }) {
    const [text, setText] = useState<string>(() => {
      if (!value) return '';
      try {
        if (typeof value === 'string') return value;
        if (value?.toDate) return value.toDate().toISOString();
        if (value instanceof Date) return value.toISOString();
      } catch {}
      return '';
    });

    useEffect(() => {
      if (!value) return setText('');
      let date: Date | null = null;
      if (typeof value === 'string') date = new Date(value);
      else if (value?.toDate) date = value.toDate();
      else if (value instanceof Date) date = value;
      if (!date || isNaN(date.getTime())) return setText('');
      setText(date.toLocaleDateString('pt-BR', options || { day: '2-digit', month: '2-digit', year: 'numeric' }));
    }, [value, options]);

    return <Text>{text}</Text>;
  }

  const { isDarkMode, setCurrentScreen, navigateTo, setSelectedBusiness, businesses } = useAppContext();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [anuncioRelacionado, setAnuncioRelacionado] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [decisao, setDecisao] = useState<'aceita' | 'nao_aceita' | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const justificativaRef = useRef<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAnuncioRelacionado, setLoadingAnuncioRelacionado] = useState(false);
  const [loadingDenuncias, setLoadingDenuncias] = useState(true);

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    const carregarDenuncias = async () => {
      try {
        setLoadingDenuncias(true);
        const denunciasPendentes = await getDenunciasPendentes();
        setDenuncias(denunciasPendentes);
      } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        alert('Erro ao carregar denúncias. Verifique os logs.');
      } finally {
        setLoadingDenuncias(false);
      }
    };

    carregarDenuncias();
  }, []);

  const handleVoltar = () => {
    setCurrentScreen('AdminPainel');
  };

  const handleAbrirDetalhe = async (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setDecisao(null);
    setJustificativa('');
    justificativaRef.current = '';
    setAnuncioRelacionado(null);
    setShowDetailDialog(true);
    setLoadingAnuncioRelacionado(true);

    try {
      const firestore = getFirestore(app);
      const rawAnuncioId = String(denuncia.anuncioId || '').trim();
      const numericAnuncioId = Number(rawAnuncioId);
      const businessMatch = businesses.find((business: any) =>
        business.firestoreId === rawAnuncioId ||
        String(business.id) === rawAnuncioId ||
        (!Number.isNaN(numericAnuncioId) && business.id === numericAnuncioId)
      );

      const directDocId = businessMatch?.firestoreId ?? rawAnuncioId;
      const anuncioRef = doc(firestore, 'anuncios', directDocId);
      const anuncioSnap = await getDoc(anuncioRef);

      if (anuncioSnap.exists()) {
        const data = anuncioSnap.data();
        setAnuncioRelacionado({
          id: anuncioSnap.id,
          ...data,
        });
        return;
      }

      const candidates: Array<string | number> = [rawAnuncioId];
      if (!Number.isNaN(numericAnuncioId)) {
        candidates.push(numericAnuncioId);
      }
      if (businessMatch?.firestoreId && businessMatch.firestoreId !== rawAnuncioId) {
        candidates.push(businessMatch.firestoreId);
      }

      let found = false;
      for (const candidate of candidates) {
        const fallbackQueries = [
          where('idNegocio', '==', candidate),
          where('businessId', '==', candidate),
          where('id', '==', candidate),
        ];

        for (const fallbackWhere of fallbackQueries) {
          const fallbackSnapshot = await getDocs(
            query(collection(firestore, 'anuncios'), fallbackWhere, limit(1))
          );

          if (!fallbackSnapshot.empty) {
            const fallbackDoc = fallbackSnapshot.docs[0];
            setAnuncioRelacionado({
              id: fallbackDoc.id,
              ...fallbackDoc.data(),
            });
            found = true;
            break;
          }
        }

        if (found) break;
      }

      if (!found) {
        setAnuncioRelacionado(null);
      }
    } catch (error) {
      console.warn('Erro ao carregar anúncio relacionado:', error, 'denuncia.anuncioId=', denuncia.anuncioId);
      setAnuncioRelacionado(null);
    } finally {
      setLoadingAnuncioRelacionado(false);
    }
  };

  function handleSelectDecisao(dec: 'aceita' | 'nao_aceita') {
    const current = (justificativaRef.current || '').trim();
    if (!current) {
      let novo = '';
      if (dec === 'aceita') {
        novo = 'Agradecemos sua denúncia. Após verificação, confirmamos que o conteúdo viola nossas normas e já aplicamos as medidas corretivas necessárias. Sua colaboração é fundamental para nossa comunidade!';
      } else {
        novo = 'Obrigado por nos ajudar a manter a plataforma segura. Após análise, não identificamos violações às nossas diretrizes neste caso específico. Por isso, nenhuma ação foi tomada no momento. Seguimos à disposição!';
      }

      setJustificativa(novo);
      justificativaRef.current = novo;
    }

    setDecisao(dec);
  }

  const handleVerAnuncio = () => {
    if (!anuncioRelacionado) return;

    // Retornado exatamente ao seu mapeamento original
    const selectedBusiness = {
      id: 0,
      firestoreId: anuncioRelacionado.id,
      name: anuncioRelacionado.nome || anuncioRelacionado.name || 'Anúncio denunciado',
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
    navigateTo('T4');
  };

  const handleTomarDecisao = async () => {
    if (!selectedDenuncia || !decisao || !justificativa.trim()) {
      alert('Preencha a justificativa e escolha uma decisão');
      return;
    }

    // Identifica o ID correto do anúncio para a resolução
    const idDoAnuncio = anuncioRelacionado?.id || selectedDenuncia.anuncioId;

    if (!idDoAnuncio) {
      alert('Erro: Não foi possível mapear o ID do anúncio.');
      return;
    }

    setLoading(true);
    try {
      const moderadorId = getAuth(app).currentUser?.uid || '';
      
      // Executa a função passando o ID do anúncio conforme solicitado
      await resolverDenuncia(selectedDenuncia.id, moderadorId, decisao, justificativa, idDoAnuncio);

      setDenuncias(prev => prev.filter(d => d.id !== selectedDenuncia.id));
      alert('Denúncia resolvida com sucesso!');
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Erro ao resolver denúncia:', error);
      alert('Erro ao resolver denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutRN>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
            <ChevronLeft width={24} height={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Moderação de Denúncias</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.infoText}>
          Analise e tome decisões sobre as denúncias reportadas pelos usuários.
        </Text>

        <View style={styles.listContainer}>
          {loadingDenuncias ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Carregando denúncias...</Text>
            </View>
          ) : denuncias.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma denúncia pendente</Text>
              <Text style={styles.emptyStateSubtext}>
                Novas denúncias aparecerão aqui após sincronização com Firestore
              </Text>
            </View>
          ) : (
            denuncias.map((denuncia) => (
              <Card key={denuncia.id} style={styles.denunciaCard}>
                <View style={styles.denunciaHeader}>
                  <Text style={styles.denunciaMotivo}>{denuncia.motivo}</Text>
                  <View style={[styles.statusBadge, styles[`status_${denuncia.status}`]]}>
                    <Text style={styles.statusText}>{denuncia.status}</Text>
                  </View>
                </View>
                <Text style={styles.denunciaDescricao} numberOfLines={2}>
                  {denuncia.descricao}
                </Text>
                <Text style={styles.denunciaData}>
                  {denuncia.criadoEm.toDate().toLocaleDateString('pt-BR')}
                </Text>
                <Button
                  onPress={() => handleAbrirDetalhe(denuncia)}
                  style={styles.detalheButton}
                  textStyle={styles.detalheButtonText}
                >
                  Ver Detalhes
                </Button>
              </Card>
            ))
          )}
        </View>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent style={styles.dialogContent}>
            <ScrollView style={styles.dialogScroll} showsVerticalScrollIndicator={true}>
              <DialogHeader>
                <DialogTitle style={isDarkMode ? styles.dialogTitleDark : undefined}>
                  Decidir sobre Denúncia
                </DialogTitle>
                <DialogDescription style={isDarkMode ? styles.dialogDescriptionDark : undefined}>
                  Motivo: {selectedDenuncia?.motivo}
                </DialogDescription>
              </DialogHeader>

              {selectedDenuncia?.carimbo && (
                <View style={styles.carimboBox}>
                  <Text style={styles.carimboLabel}>Carimbo da ação</Text>
                  <Text style={styles.carimboText}>{selectedDenuncia.carimbo}</Text>
                </View>
              )}

              <View style={styles.dialogBody}>
                <Text style={styles.label}>Descrição da Denúncia:</Text>
                <Text style={styles.descricaoText}>{selectedDenuncia?.descricao}</Text>

                {loadingAnuncioRelacionado ? (
                  <Text style={[styles.previewLoadingText, isDarkMode && styles.previewLoadingTextDark]}>
                    Carregando anúncio relacionado...
                  </Text>
                ) : anuncioRelacionado ? (
                  <>
                    <Text style={[styles.label, styles.labelMarginTop]}>Anúncio Denunciado:</Text>
                    <View style={[styles.anuncioPreview, isDarkMode && styles.anuncioPreviewDark]}>
                      <Text style={[styles.anuncioPreviewTitle, isDarkMode && styles.anuncioPreviewTitleDark]}>
                        {anuncioRelacionado.nome || anuncioRelacionado.name}
                      </Text>
                      <Text style={[styles.anuncioPreviewMeta, isDarkMode && styles.anuncioPreviewMetaDark]}>
                        {anuncioRelacionado.categoria || anuncioRelacionado.category}
                      </Text>
                      <Text style={[styles.anuncioPreviewDesc, isDarkMode && styles.anuncioPreviewDescDark]} numberOfLines={3}>
                        {anuncioRelacionado.descricao || anuncioRelacionado.description}
                      </Text>
                      <Button
                        onPress={handleVerAnuncio}
                        style={styles.previewButton}
                        textStyle={styles.previewButtonText}
                      >
                        Ver Anúncio
                      </Button>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.previewMissingText, isDarkMode && styles.previewMissingTextDark]}>
                    Não foi possível carregar o anúncio relacionado.
                  </Text>
                )}

                <Text style={[styles.label, styles.labelMarginTop]}>Sua Decisão:</Text>
                <View style={styles.decisaoButtons}>
                  <Button
                    onPress={() => handleSelectDecisao('aceita')}
                    style={[
                      styles.decisaoBtn,
                      decisao === 'aceita' && styles.decisaoBtnAceita,
                    ]}
                    textStyle={styles.decisaoBtnText}
                  >
                    ✓ Aceitar Denúncia
                  </Button>
                  <Button
                    onPress={() => handleSelectDecisao('nao_aceita')}
                    style={[
                      styles.decisaoBtn,
                      decisao === 'nao_aceita' && styles.decisaoBtnNegada,
                    ]}
                    textStyle={styles.decisaoBtnText}
                  >
                    ✗ Rejeitar Denúncia
                  </Button>
                </View>

                <Label style={[styles.label, styles.labelMarginTop]}>Justificativa:</Label>
                <Input
                  id={selectedDenuncia ? `justificativa-${selectedDenuncia.id}` : 'justificativa-modal'}
                  name="justificativa"
                  placeholder="Explique sua decisão..."
                  value={justificativa}
                  onChangeText={(t) => { setJustificativa(t); justificativaRef.current = t; }}
                  multiline
                  style={styles.justificativaInput}
                  placeholderTextColor={isDarkMode ? '#666' : '#ccc'}
                />
              </View>
            </ScrollView>

            <View style={styles.dialogActions}>
              <Button
                onPress={() => setShowDetailDialog(false)}
                style={styles.btnCancel}
                textStyle={styles.btnCancelText}
              >
                Cancelar
              </Button>
              <Button
                onPress={handleTomarDecisao}
                disabled={loading || !decisao}
                style={[styles.btnSubmit, (loading || !decisao) && styles.btnDisabled]}
                textStyle={styles.btnSubmitText}
              >
                {loading ? 'Processando...' : 'Confirmar Decisão'}
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
    infoText: { fontSize: 14, color: isDarkMode ? '#aaa' : '#666', marginBottom: 20, textAlign: 'center' },
    listContainer: { gap: 12 },
    emptyState: { paddingVertical: 40, alignItems: 'center' },
    emptyStateText: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#ccc' : '#333', marginBottom: 8 },
    emptyStateSubtext: { fontSize: 13, color: isDarkMode ? '#888' : '#999', textAlign: 'center' },
    denunciaCard: { padding: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9', borderLeftWidth: 4, borderLeftColor: '#ff9800' },
    denunciaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    denunciaMotivo: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#fff' : '#000', flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    status_aberta: { backgroundColor: '#ff9800' },
    status_em_analise: { backgroundColor: '#2196f3' },
    status_resolvida: { backgroundColor: '#4caf50' },
    statusText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    denunciaDescricao: { fontSize: 12, color: isDarkMode ? '#bbb' : '#666', marginBottom: 8 },
    denunciaData: { fontSize: 11, color: isDarkMode ? '#888' : '#999', marginBottom: 10 },
    detalheButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1976d2', borderRadius: 4 },
    detalheButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    dialogContent: { width: '100%', minWidth: 320, maxHeight: '75%', paddingBottom: 16 },
    dialogScroll: { maxHeight: '72%', flexGrow: 0 },
    dialogTitleDark: { color: '#fff' },
    dialogDescriptionDark: { color: '#aaa' },
    carimboBox: { marginBottom: 8, padding: 8, borderRadius: 8, backgroundColor: isDarkMode ? '#262626' : '#fff7ed', borderLeftWidth: 4, borderLeftColor: '#ff9800' },
    carimboLabel: { fontSize: 12, fontWeight: '700', color: isDarkMode ? '#ddd' : '#9a3412', marginBottom: 4 },
    carimboText: { fontSize: 13, color: isDarkMode ? '#f3f4f6' : '#1f2937', lineHeight: 18 },
    dialogBody: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#fff' : '#000' },
    labelMarginTop: { marginTop: 6 },
    descricaoText: { fontSize: 13, color: isDarkMode ? '#bbb' : '#666', padding: 6, backgroundColor: isDarkMode ? '#0a0a0a' : '#f0f0f0', borderRadius: 4 },
    decisaoButtons: { flexDirection: 'row', gap: 8 },
    decisaoBtn: { flex: 1, paddingVertical: 10, borderRadius: 4, backgroundColor: isDarkMode ? '#333' : '#eee', borderWidth: 2, borderColor: 'transparent' },
    decisaoBtnAceita: { borderColor: '#4caf50', backgroundColor: '#4caf5022' },
    decisaoBtnNegada: { borderColor: '#f44336', backgroundColor: '#f4433622' },
    decisaoBtnText: { fontSize: 12, fontWeight: '600', color: isDarkMode ? '#fff' : '#000' },
    justificativaInput: { height: 140, textAlignVertical: 'top', padding: 12, fontSize: 14, borderRadius: 6 },
    anuncioPreview: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 8, backgroundColor: '#f9fafb' },
    anuncioPreviewDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
    anuncioPreviewTitle: { fontSize: 14, fontWeight: '700', color: '#1e3a8a', marginBottom: 3 },
    anuncioPreviewTitleDark: { color: '#93c5fd' },
    anuncioPreviewMeta: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
    anuncioPreviewMetaDark: { color: '#9ca3af' },
    anuncioPreviewDesc: { fontSize: 12, color: '#4b5563', lineHeight: 18 },
    anuncioPreviewDescDark: { color: '#cbd5e1' },
    previewButton: { marginTop: 8, paddingVertical: 10, borderRadius: 6, backgroundColor: '#1976d2', alignItems: 'center', justifyContent: 'center' },
    previewButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    previewLoadingText: { marginTop: 12, fontSize: 13, color: '#6b7280' },
    previewLoadingTextDark: { color: '#d1d5db' },
    previewMissingText: { marginTop: 12, fontSize: 13, color: '#b91c1c' },
    previewMissingTextDark: { color: '#fca5a5' },
    dialogActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    btnCancel: { flex: 1, paddingVertical: 10, backgroundColor: isDarkMode ? '#333' : '#eee', borderRadius: 4 },
    btnCancelText: { fontSize: 13, fontWeight: '600', color: isDarkMode ? '#fff' : '#000' },
    btnSubmit: { flex: 1, paddingVertical: 10, backgroundColor: '#4caf50', borderRadius: 4 },
    btnSubmitText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    btnDisabled: { opacity: 0.5 },
  });
}
