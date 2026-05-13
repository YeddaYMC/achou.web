import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../../components/Layout-RN';
import { Card } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { getContagemAnunciosPendentes, getResumoModeracaoAnuncios } from '../../src/services/anuncioService';
import { getContagemDenunciasPendentes, getResumoModeracaoDenuncias } from '../../src/services/denunciaService';

interface TarefaPendente {
  anuncios: number;
  denuncias: number;
}

interface ResumoModeracaoState {
  anuncios: {
    total: number;
    pendente: number;
    aprovado: number;
    reprovado: number;
    arquivado: number;
  };
  denuncias: {
    total: number;
    abertas: number;
    emAnalise: number;
    resolvidas: number;
    aceitas: number;
    naoProcedentes: number;
  };
}

export default function AdminPainel() {
  const { isDarkMode, setCurrentScreen, userProfile, navigateBack } = useAppContext();
  const [usuarioPapel, setUsuarioPapel] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<TarefaPendente>({
    anuncios: 0,     // TODO: integrar com Firestore
    denuncias: 0,
  });
  const [resumoModeracao, setResumoModeracao] = useState<ResumoModeracaoState>({
    anuncios: { total: 0, pendente: 0, aprovado: 0, reprovado: 0, arquivado: 0 },
    denuncias: { total: 0, abertas: 0, emAnalise: 0, resolvidas: 0, aceitas: 0, naoProcedentes: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setUsuarioPapel(userProfile.PERMISSAO || userProfile.permissao || userProfile.papel || 'usuario');
    }
  }, [userProfile]);

  // Buscar contagem de tarefas pendentes
  useEffect(() => {
    const carregarContagens = async () => {
      try {
        const anunciosCount = await getContagemAnunciosPendentes();
        const denunciasCount = await getContagemDenunciasPendentes();
        const resumoAnuncios = await getResumoModeracaoAnuncios();
        const resumoDenuncias = await getResumoModeracaoDenuncias();
        setTarefas({
          anuncios: anunciosCount,
          denuncias: denunciasCount,
        });
        setResumoModeracao({
          anuncios: resumoAnuncios,
          denuncias: resumoDenuncias,
        });
      } catch (error) {
        console.error('Erro ao carregar contagens:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarContagens();
  }, []);

  const styles = getStyles(isDarkMode);

  // Verificar se usuário tem permissão
  const temAcesso = usuarioPapel === 'admin' || usuarioPapel === 'moderador' || usuarioPapel === 'super_admin';

  if (!temAcesso) {
    return (
      <LayoutRN>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.noAccessContainer}>
            <Text style={styles.noAccessText}>🔒 Você não possui acesso a funções administrativas.</Text>
          </View>
        </ScrollView>
      </LayoutRN>
    );
  }

  const handleIrParaAprovacao = () => {
    setCurrentScreen('AdminAprovacao');
  };

  const handleIrParaDenuncias = () => {
    setCurrentScreen('AdminDenuncias');
  };

  return (
    <LayoutRN>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Botão Voltar */}
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <View style={styles.backContent}>
            <ChevronLeft size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={isDarkMode ? { ...styles.backText, ...styles.backTextDark } : styles.backText}>Voltar</Text>
          </View>
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>⚙️ Painel Admin</Text>
        </View>

        {/* Info */}
        <Text style={styles.infoText}>
          Gerencie anúncios e denúncias pendentes
        </Text>

        {/* Cards de Tarefas */}
        <View style={styles.tasksContainer}>
          {/* Anúncios Pendentes */}
          <TouchableOpacity onPress={handleIrParaAprovacao} style={styles.taskCardTouchable}>
            <Card style={[styles.taskCard, styles.taskCardAnuncios]}>
              <View style={styles.taskCardContent}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>📋 Anúncios Pendentes</Text>
                  <Text style={styles.taskDescription}>
                    Aprove ou rejeite anúncios
                  </Text>
                </View>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterNumber}>
                    {loading ? '...' : tarefas.anuncios}
                  </Text>
                </View>
              </View>
              <View style={styles.taskFooter}>
                <Text style={styles.taskAction}>Clique para gerenciar →</Text>
              </View>
            </Card>
          </TouchableOpacity>

          {/* Denúncias Pendentes */}
          <TouchableOpacity onPress={handleIrParaDenuncias} style={styles.taskCardTouchable}>
            <Card style={[styles.taskCard, styles.taskCardDenuncias]}>
              <View style={styles.taskCardContent}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>🚨 Denúncias Pendentes</Text>
                  <Text style={styles.taskDescription}>
                    Moderacione denúncias reportadas
                  </Text>
                </View>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterNumber}>
                    {loading ? '...' : tarefas.denuncias}
                  </Text>
                </View>
              </View>
              <View style={styles.taskFooter}>
                <Text style={styles.taskAction}>Clique para moderar →</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Resumo Total */}
        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={isDarkMode ? ['#0f172a', '#1d4ed8', '#059669'] : ['#dbeafe', '#bfdbfe', '#d1fae5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total de Tarefas Pendentes</Text>
              <Text style={styles.summaryNumber}>
                {tarefas.anuncios + tarefas.denuncias}
              </Text>
              <Text style={styles.summarySubtext}>
                {tarefas.anuncios} anúncios + {tarefas.denuncias} denúncias
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.bottomSummaryGrid}>
            <LinearGradient
              colors={isDarkMode ? ['#0f172a', '#1d4ed8'] : ['#eff6ff', '#dbeafe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bottomSummaryCard}
            >
              <Text style={styles.bottomSummaryTitle}>Anúncios</Text>
              <Text style={styles.bottomSummaryBig}>{resumoModeracao.anuncios.total}</Text>
              <Text style={styles.bottomSummaryLine}>Aprovados: {resumoModeracao.anuncios.aprovado}</Text>
              <Text style={styles.bottomSummaryLine}>Reprovados: {resumoModeracao.anuncios.reprovado}</Text>
              <Text style={styles.bottomSummaryLine}>Excluídos: {resumoModeracao.anuncios.arquivado}</Text>
            </LinearGradient>

            <LinearGradient
              colors={isDarkMode ? ['#0f172a', '#059669'] : ['#ecfdf5', '#d1fae5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bottomSummaryCard}
            >
              <Text style={styles.bottomSummaryTitle}>Denúncias</Text>
              <Text style={styles.bottomSummaryBig}>{resumoModeracao.denuncias.total}</Text>
              <Text style={styles.bottomSummaryLine}>Aceitas: {resumoModeracao.denuncias.aceitas}</Text>
              <Text style={styles.bottomSummaryLine}>Não procedentes: {resumoModeracao.denuncias.naoProcedentes}</Text>
              <Text style={styles.bottomSummaryLine}>Resolvidas: {resumoModeracao.denuncias.resolvidas}</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </LayoutRN>
  );
}

function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 80,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      textAlign: 'center',
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#666',
      marginBottom: 24,
      textAlign: 'center',
    },
    tasksContainer: {
      gap: 16,
      marginBottom: 32,
    },
    taskCardTouchable: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    taskCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
      borderLeftWidth: 5,
    },
    taskCardAnuncios: {
      borderLeftColor: '#2196f3',
    },
    taskCardDenuncias: {
      borderLeftColor: '#ff9800',
    },
    taskCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    taskInfo: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 4,
    },
    taskDescription: {
      fontSize: 13,
      color: isDarkMode ? '#aaa' : '#666',
    },
    counterBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDarkMode ? '#333' : '#e3f2fd',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    counterNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1976d2',
    },
    taskFooter: {
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
      paddingTop: 12,
    },
    taskAction: {
      fontSize: 12,
      color: isDarkMode ? '#88d3f0' : '#1976d2',
      fontWeight: '500',
    },
    summaryContainer: {
      marginTop: 16,
    },
    bottomSummaryGrid: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      flexWrap: 'wrap',
    },
    bottomSummaryCard: {
      flex: 1,
      minWidth: 150,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
    },
    bottomSummaryTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#e0f2fe' : '#0f172a',
      marginBottom: 6,
    },
    bottomSummaryBig: {
      fontSize: 28,
      fontWeight: '800',
      color: isDarkMode ? '#fff' : '#0f172a',
      marginBottom: 8,
    },
    bottomSummaryLine: {
      fontSize: 12,
      color: isDarkMode ? '#dbeafe' : '#1f2937',
      marginBottom: 3,
    },
    summaryCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
    },
    summaryContent: {
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      color: isDarkMode ? '#e0f2fe' : '#0f172a',
      marginBottom: 8,
    },
    summaryNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#0f172a',
      marginBottom: 4,
    },
    summarySubtext: {
      fontSize: 12,
      color: isDarkMode ? '#dbeafe' : '#1f2937',
      textAlign: 'center',
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
    noAccessContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    noAccessText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#ccc' : '#333',
      textAlign: 'center',
    },
  });
}
