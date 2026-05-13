import { ChevronLeft, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../../components/Layout-RN';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAppContext } from '../../context/AppContext';
import { getAllUsers, setUserPermission } from '../../src/services/authService';
interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: 'usuario' | 'moderador' | 'admin' | 'super_admin';
  nivelAnunciante: 1 | 2 | 3 | 4;
  criadoEm: string;
}

export default function AdminUsuarios() {
  const { isDarkMode, navigateTo, setCurrentScreen, userProfile } = useAppContext();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [novoPapel, setNovoPapel] = useState<string>('usuario');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'todos' | 'admin' | 'moderador' | 'super_admin'>('todos');
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [clickedFilter, setClickedFilter] = useState(false);

  const styles = getStyles(isDarkMode);

  const permissaoPerfil = userProfile?.PERMISSAO || userProfile?.permissao || userProfile?.papel;
  const ehSuperAdmin = permissaoPerfil === 'super_admin';

  const handleVoltar = () => {
    setCurrentScreen('AdminAcessos');
  };

  const handleAbrirDetalhe = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setNovoPapel(usuario.papel);
    setShowDetailDialog(true);
  };

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const fetchedUsers = await getAllUsers();
        const users = fetchedUsers.map((user: any) => {
          const papelRaw = user.papel || user.PERMISSAO || user.permissao || 'usuario';
          const papelNorm = String(papelRaw)
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_');
          const allowed = ['usuario', 'moderador', 'admin', 'super_admin'];
          const papel = allowed.includes(papelNorm) ? (papelNorm as 'usuario' | 'moderador' | 'admin' | 'super_admin') : 'usuario';

          return {
            id: user.id,
            nome: user.name || user.nome || '',
            email: user.email || '',
            papel,
            nivelAnunciante: user.anuncianteLevel || user.nivelAnunciante || 1,
            criadoEm: user.createdAt || user.criadoEm || new Date().toISOString(),
          };
        });
        setUsuarios(users);
        
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    carregarUsuarios();
  }, []);

  // debug logs removed in production

  useEffect(() => {
    if (!ehSuperAdmin) return;
    if (!busca.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => setIsSearching(false), 400);
    return () => clearTimeout(timeout);
  }, [busca, ehSuperAdmin]);

  const handleAtribuirPapel = async () => {
    if (!selectedUsuario || !novoPapel) {
      alert('Escolha um papel');
      return;
    }

    if (novoPapel === selectedUsuario.papel) {
      alert('O usuário já possui este papel');
      return;
    }

    setLoading(true);
    try {
      console.log('Atribuindo papel:', { usuarioId: selectedUsuario.id, papel: novoPapel });
      const res = await setUserPermission(selectedUsuario.id, novoPapel);
      if (!res || !res.success) {
        throw new Error(res?.error || 'Falha ao atualizar permissão');
      }
      // Atualiza estado local para refletir mudança imediata
      setUsuarios((prev) => prev.map((u) => (u.id === selectedUsuario.id ? { ...u, papel: novoPapel as any } : u)));
      alert('Papel atribuído com sucesso');
      setShowDetailDialog(false);
    } catch (error) {
      alert('Erro ao atribuir papel');
    } finally {
      setLoading(false);
    }
  };

  const adminUsers = usuarios.filter((u) => u.papel !== 'usuario');
  const papelCounts = {
    admin: adminUsers.filter((u) => u.papel === 'admin').length,
    moderador: adminUsers.filter((u) => u.papel === 'moderador').length,
    super_admin: adminUsers.filter((u) => u.papel === 'super_admin').length,
  };

  const filteredByRole =
    roleFilter === 'todos'
      ? usuarios
      : usuarios.filter((u) => u.papel === roleFilter);

  const papeisFiltrados = filteredByRole.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  const totalUsuarios = usuarios.length;
  const superAdmins = usuarios.filter((u) => u.papel === 'super_admin');

  return (
    <LayoutRN>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header com botão voltar */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
            <ChevronLeft width={24} height={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gerenciar Permissões</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info */}
        <Text style={styles.infoText}>
          {ehSuperAdmin
            ? 'Busque e atribua papéis aos usuários (Super Admin apenas)'
            : 'Você não tem permissão para atribuir papéis'}
        </Text>

        {/* Filtro de papéis */}
        <>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={18} color={isDarkMode ? '#d1d5db' : '#6b7280'} />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={busca}
                  onChangeText={setBusca}
                  style={styles.searchInput}
                  placeholderTextColor={isDarkMode ? '#d1d5db' : '#6b7280'}
                />
              </View>
              {isSearching && (
                <View style={styles.searchStatus}>
                  <ActivityIndicator size="small" color={isDarkMode ? '#f3f4f6' : '#111827'} />
                  <Text style={styles.searchStatusText}>Buscando...</Text>
                </View>
              )}
            </View>

            {/* Resultados da busca */}
            {/* Filtros de papel: movidos para abaixo do campo de busca */}
            <View style={styles.roleFilterRow}>
              {['todos', 'admin', 'moderador', 'super_admin'].map((papel) => (
                <TouchableOpacity
                  key={papel}
                  onPress={() => { setRoleFilter(papel as typeof roleFilter); setClickedFilter(true); }}
                  style={[
                    styles.roleButton,
                    roleFilter === papel && styles.roleButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      roleFilter === papel && styles.roleButtonTextSelected,
                    ]}
                  >
                    {papel === 'todos' ? 'Todos' : papel === 'super_admin' ? 'Super' : papel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.listContainer}>
              {loadingUsuarios ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Carregando usuários...</Text>
                </View>
              ) : papeisFiltrados.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Nenhum usuário encontrado</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Verifique o nome ou email e tente novamente
                  </Text>
                </View>
              ) : (
                papeisFiltrados.map((usuario) => (
                  <Card key={usuario.id} style={styles.usuarioCard}>
                    <View style={styles.usuarioHeader}>
                      <View style={styles.usuarioInfo}>
                        <Text style={styles.usuarioNome}>{usuario.nome}</Text>
                        <Text style={styles.usuarioEmail} numberOfLines={1}>
                          {usuario.email}
                        </Text>
                      </View>
                      <View style={[styles.papelBadge, styles[`papel_${usuario.papel}`]]}>
                        <Text style={styles.papelText}>{usuario.papel}</Text>
                      </View>
                    </View>

                    <View style={styles.usuarioMeta}>
                      <Text style={styles.metaText}>Nível Anunciante: {usuario.nivelAnunciante}</Text>
                      <Text style={styles.metaText}>
                        Cadastro: {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>

                    <Button
                      onPress={() => handleAbrirDetalhe(usuario)}
                      style={styles.detalheButton}
                      textStyle={styles.detalheButtonText}
                    >
                      Atribuir Papel
                    </Button>
                  </Card>
                ))
              )}
            </View>

            

            {/* Mostrar contagens/debug somente após o clique nos botões de filtro */}
            {clickedFilter && (
              <>
                <View style={styles.adminSummary}>
                  <Text style={styles.adminSummaryText}>
                    Administradores: {papelCounts.admin} · Moderadores: {papelCounts.moderador} · Super Admins: {papelCounts.super_admin}
                  </Text>
                </View>
                <View style={styles.debugBox}>
                  <Text style={styles.debugText}>Total usuários: {totalUsuarios}</Text>
                  <Text style={styles.debugText}>Papéis: admin {papelCounts.admin} · moderador {papelCounts.moderador} · super_admin {papelCounts.super_admin}</Text>
                  <Text style={styles.debugText}>SuperAdmin encontrados: {superAdmins.length}</Text>
                  {superAdmins.slice(0, 5).map((s) => (
                    <Text key={s.id} style={styles.debugText}>- {s.nome} • {s.email}</Text>
                  ))}
                </View>
              </>
            )}
          </>

        {/* Quando não for Super Admin */}
        {!ehSuperAdmin && (
          <View style={styles.noAccessState}>
            <Text style={styles.noAccessText}>
              🔒 Apenas Super Admin podem gerenciar usuários e papéis
            </Text>
          </View>
        )}

        {/* Dialog de atribuição */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent style={styles.dialogContent}>
            <DialogHeader>
              <DialogTitle style={isDarkMode ? styles.dialogTitleDark : undefined}>
                Atribuir Papel
              </DialogTitle>
              <DialogDescription style={isDarkMode ? styles.dialogDescriptionDark : undefined}>
                {selectedUsuario?.nome}
              </DialogDescription>
            </DialogHeader>

            <View style={styles.dialogBody}>
              <Text style={styles.label}>Usuário:</Text>
              <View style={styles.usuarioDado}>
                <Text style={styles.usuarioDadoText}>{selectedUsuario?.nome}</Text>
                <Text style={styles.usuarioDadoEmail}>{selectedUsuario?.email}</Text>
              </View>

              <Text style={[styles.label, styles.labelMarginTop]}>Papel Atual:</Text>
              <View style={[styles.papelBadge, styles[`papel_${selectedUsuario?.papel ?? 'usuario'}`]]}>
                <Text style={styles.papelText}>{selectedUsuario?.papel}</Text>
              </View>

              <Label style={[styles.label, styles.labelMarginTop]}>Novo Papel:</Label>
              <View style={styles.papelOptions}>
                {['usuario', 'moderador', 'admin', 'super_admin'].map((papel) => (
                  <TouchableOpacity
                    key={papel}
                    onPress={() => setNovoPapel(papel)}
                    style={[
                      styles.papelOption,
                      novoPapel === papel && styles.papelOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.papelRadio,
                        novoPapel === papel && styles.papelRadioSelected,
                      ]}
                    />
                    <Text style={styles.papelOptionText}>{papel}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.dialogActions}>
                <Button
                  onPress={() => setShowDetailDialog(false)}
                  style={styles.btnCancel}
                  textStyle={styles.btnCancelText}
                >
                  Cancelar
                </Button>
                <Button
                  onPress={handleAtribuirPapel}
                  disabled={loading || novoPapel === selectedUsuario?.papel}
                  style={[
                    styles.btnSubmit,
                    (loading || novoPapel === selectedUsuario?.papel) && styles.btnDisabled,
                  ]}
                  textStyle={styles.btnSubmitText}
                >
                  {loading ? 'Processando...' : 'Confirmar'}
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
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
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      flex: 1,
      textAlign: 'center',
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#666',
      marginBottom: 16,
      textAlign: 'center',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#0f172a' : '#f0f0f0',
      borderWidth: 1,
      borderColor: isDarkMode ? '#475569' : '#d1d5db',
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      paddingVertical: 0,
      color: isDarkMode ? '#fff' : '#000',
      backgroundColor: 'transparent',
    },
    searchStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#d1d5db',
    },
    searchStatusText: {
      marginLeft: 4,
      fontSize: 12,
      color: isDarkMode ? '#d1d5db' : '#111827',
    },
    adminSummary: {
      marginBottom: 10,
      padding: 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#111827' : '#eef2ff',
    },
    adminSummaryText: {
      fontSize: 13,
      color: isDarkMode ? '#d1d5db' : '#1e3a8a',
    },
    roleFilterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12,
    },
    roleButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#d1d5db',
    },
    roleButtonSelected: {
      backgroundColor: '#9c27b0',
      borderColor: '#9c27b0',
    },
    roleButtonText: {
      fontSize: 12,
      color: isDarkMode ? '#fff' : '#111827',
      textTransform: 'capitalize',
    },
    roleButtonTextSelected: {
      color: '#fff',
    },
    listContainer: {
      gap: 12,
    },
    noAccessState: {
      paddingVertical: 40,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? '#2a1a1a' : '#ffe0e0',
      borderRadius: 8,
      alignItems: 'center',
    },
    noAccessText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#ff8080' : '#d32f2f',
      textAlign: 'center',
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#ccc' : '#333',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 13,
      color: isDarkMode ? '#888' : '#999',
      textAlign: 'center',
    },
    usuarioCard: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
      borderLeftWidth: 4,
      borderLeftColor: '#9c27b0',
    },
    usuarioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    usuarioInfo: {
      flex: 1,
    },
    usuarioNome: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 4,
    },
    usuarioEmail: {
      fontSize: 12,
      color: isDarkMode ? '#aaa' : '#666',
    },
    papelBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    papel_usuario: {
      backgroundColor: '#e0e0e0',
    },
    papel_moderador: {
      backgroundColor: '#ff9800',
    },
    papel_admin: {
      backgroundColor: '#1976d2',
    },
    papel_super_admin: {
      backgroundColor: '#8b0000',
    },
    papelText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    usuarioMeta: {
      marginBottom: 10,
      gap: 4,
    },
    metaText: {
      fontSize: 11,
      color: isDarkMode ? '#888' : '#999',
    },
    detalheButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#9c27b0',
      borderRadius: 4,
    },
    detalheButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    dialogContent: {
      maxHeight: '85%',
    },
    dialogTitleDark: {
      color: '#fff',
    },
    dialogDescriptionDark: {
      color: '#aaa',
    },
    dialogBody: {
      gap: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
    },
    labelMarginTop: {
      marginTop: 8,
    },
    usuarioDado: {
      padding: 8,
      backgroundColor: isDarkMode ? '#0a0a0a' : '#f0f0f0',
      borderRadius: 4,
    },
    usuarioDadoText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 4,
    },
    usuarioDadoEmail: {
      fontSize: 12,
      color: isDarkMode ? '#aaa' : '#666',
    },
    papelOptions: {
      gap: 8,
    },
    papelOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 6,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    papelOptionSelected: {
      borderColor: '#9c27b0',
      backgroundColor: isDarkMode ? '#2d1b3d' : '#f3e5f5',
    },
    papelRadio: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isDarkMode ? '#666' : '#ccc',
      marginRight: 10,
    },
    papelRadioSelected: {
      borderColor: '#9c27b0',
      backgroundColor: '#9c27b0',
    },
    papelOptionText: {
      fontSize: 13,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#000',
    },
    dialogActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    btnCancel: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: isDarkMode ? '#333' : '#eee',
      borderRadius: 4,
    },
    btnCancelText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
    },
    btnSubmit: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: '#9c27b0',
      borderRadius: 4,
    },
    btnSubmitText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
    },
    btnDisabled: {
      opacity: 0.5,
    },
    debugBox: {
      padding: 10,
      borderRadius: 6,
      backgroundColor: isDarkMode ? '#0b1220' : '#eef2ff',
      marginBottom: 12,
    },
    debugText: {
      fontSize: 12,
      color: isDarkMode ? '#cbd5e1' : '#0f172a',
    },
  });
}
