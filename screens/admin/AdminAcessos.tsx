import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Layout from '../../components/Layout-RN';
import { Button } from '../../components/ui/button';
import { useAppContext } from '../../context/AppContext';

interface AdminAcessosProps {
  route?: any;
}

export default function AdminAcessos(props: AdminAcessosProps) {
  const { isDarkMode, setCurrentScreen, userProfile } = useAppContext();
  const [usuarioPapel, setUsuarioPapel] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setUsuarioPapel(userProfile.PERMISSAO || userProfile.permissao || userProfile.papel || 'usuario');
    }
  }, [userProfile]);

  const styles = getStyles(isDarkMode);

  const podeAcessarGeral = usuarioPapel === 'super_admin';
  const podeAcessarAdmin = usuarioPapel === 'admin' || usuarioPapel === 'super_admin';
  const podeAcessarModerador = usuarioPapel === 'moderador' || usuarioPapel === 'admin' || usuarioPapel === 'super_admin';
  const podeAcessarUsuarios = usuarioPapel === 'super_admin';

  const handleAcessarGeral = () => {
    setCurrentScreen('AdminPainel');
  };

  const handleAcessarAdmin = () => {
    setCurrentScreen('AdminPainel');
  };

  const handleAcessarModerador = () => {
    setCurrentScreen('AdminPainel');
  };

  const handleAcessarUsuarios = () => {
    if (!podeAcessarUsuarios) {
      return;
    }

    setCurrentScreen('AdminUsuarios');
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Ionicons name="settings" size={32} color={isDarkMode ? '#ffffff' : '#000000'} />
          <Text style={styles.headerTitle}>Acessos & Permissões</Text>
        </View>

        {/* Instrução */}
        <Text style={styles.instructionText}>
          Selecione sua permissão para acessar as funcionalidades administrativas
        </Text>

        {/* Informação de Papel Atual */}
        <View style={styles.currentRoleContainer}>
          <Text style={styles.currentRoleLabel}>Seu Papel:</Text>
          <Text style={styles.currentRoleValue}>
            {usuarioPapel === 'super_admin' && '🔑 Super Admin'}
            {usuarioPapel === 'admin' && '👨‍💼 Admin'}
            {usuarioPapel === 'moderador' && '⚖️ Moderador'}
            {usuarioPapel === 'usuario' && '👤 Usuário Comum'}
          </Text>
        </View>

        {/* Botões de Acesso */}
        <View style={styles.buttonsContainer}>
          {/* Botão Geral - Super Admin */}
          <View style={styles.buttonWrapper}>
            {!podeAcessarGeral && (
              <Text style={styles.lockedLabel}>Bloqueado para este papel</Text>
            )}
            <Button
              onPress={podeAcessarGeral ? handleAcessarGeral : undefined}
              disabled={!podeAcessarGeral}
              style={[
                styles.permissionButton,
                podeAcessarGeral ? styles.geralButton : styles.geralButtonDisabled,
              ]}
              textStyle={[
                styles.permissionButtonText,
                !podeAcessarGeral && styles.permissionButtonTextDisabled,
              ]}
            >
              <Text style={[styles.permissionButtonText, !podeAcessarGeral && styles.permissionButtonTextDisabled]}>
                🔑 Geral (Super Admin)
              </Text>
            </Button>
            <Text style={styles.permissionDescription}>
              Gestão total: usuários, papéis, configurações sistema
            </Text>
          </View>

          {/* Botão Admin */}
          <View style={styles.buttonWrapper}>
            {!podeAcessarAdmin && (
              <Text style={styles.lockedLabel}>Bloqueado para este papel</Text>
            )}
            <Button
              onPress={podeAcessarAdmin ? handleAcessarAdmin : undefined}
              disabled={!podeAcessarAdmin}
              style={[
                styles.permissionButton,
                podeAcessarAdmin ? styles.adminButton : styles.adminButtonDisabled,
              ]}
              textStyle={[
                styles.permissionButtonText,
                !podeAcessarAdmin && styles.permissionButtonTextDisabled,
              ]}
            >
              <Text style={[styles.permissionButtonText, !podeAcessarAdmin && styles.permissionButtonTextDisabled]}>
                👨‍💼 Admin
              </Text>
            </Button>
            <Text style={styles.permissionDescription}>
              Moderação de anúncios e denúncias
            </Text>
          </View>

          {/* Botão Moderador */}
          <View style={styles.buttonWrapper}>
            {!podeAcessarModerador && (
              <Text style={styles.lockedLabel}>Bloqueado para este papel</Text>
            )}
            <Button
              onPress={podeAcessarModerador ? handleAcessarModerador : undefined}
              disabled={!podeAcessarModerador}
              style={[
                styles.permissionButton,
                podeAcessarModerador ? styles.moderadorButton : styles.moderadorButtonDisabled,
              ]}
              textStyle={[
                styles.permissionButtonText,
                !podeAcessarModerador && styles.permissionButtonTextDisabled,
              ]}
            >
              <Text style={[styles.permissionButtonText, !podeAcessarModerador && styles.permissionButtonTextDisabled]}>
                ⚖️ Moderador
              </Text>
            </Button>
            <Text style={styles.permissionDescription}>
              Análise e decisão sobre denúncias
            </Text>
          </View>

          {/* Botão Usuários / Papéis */}
          <View style={styles.buttonWrapper}>
            {!podeAcessarUsuarios && (
              <Text style={styles.lockedLabel}>Bloqueado para este papel</Text>
            )}
            <Button
              onPress={handleAcessarUsuarios}
              disabled={!podeAcessarUsuarios}
              style={[
                styles.permissionButton,
                podeAcessarUsuarios ? styles.usuariosButton : styles.usuariosButtonDisabled,
              ]}
              textStyle={[
                styles.permissionButtonText,
                !podeAcessarUsuarios && styles.permissionButtonTextDisabled,
              ]}
            >
              <Text style={[styles.permissionButtonText, !podeAcessarUsuarios && styles.permissionButtonTextDisabled]}>
                👥 Usuários / Papéis
              </Text>
            </Button>
            <Text style={styles.permissionDescription}>
              {podeAcessarUsuarios
                ? 'Gerencie permissões e atribua papéis aos usuários'
                : 'Apenas Super Admin pode acessar esta área'}
            </Text>
          </View>

          {/* Mensagem se usuário não tem acesso */}
          {!podeAcessarGeral && !podeAcessarAdmin && !podeAcessarModerador && (
            <View style={styles.noAccessContainer}>
              <Text style={styles.noAccessText}>
                Você não possui acesso a funções administrativas.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Layout>
  );
}

function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      paddingBottom: 40,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    instructionText: {
      fontSize: 14,
      color: isDarkMode ? '#cccccc' : '#666666',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    currentRoleContainer: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f4f8',
      borderLeftWidth: 4,
      borderLeftColor: '#1976d2',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 32,
    },
    currentRoleLabel: {
      fontSize: 12,
      color: isDarkMode ? '#aaaaaa' : '#666666',
      marginBottom: 4,
    },
    currentRoleValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#1f2937',
    },
    buttonsContainer: {
      gap: 16,
    },
    buttonWrapper: {
      marginBottom: 8,
    },
    lockedLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#9ca3af',
      marginBottom: 6,
      textAlign: 'center',
    },
    permissionButton: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    permissionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    geralButton: {
      backgroundColor: '#7c3aed',
    },
    geralButtonDisabled: {
      backgroundColor: '#e5e7eb',
    },
    adminButton: {
      backgroundColor: '#2196f3',
    },
    adminButtonDisabled: {
      backgroundColor: '#e5e7eb',
    },
    moderadorButton: {
      backgroundColor: '#ff9800',
    },
    moderadorButtonDisabled: {
      backgroundColor: '#e5e7eb',
    },
    usuariosButton: {
      backgroundColor: '#6d28d9',
    },
    usuariosButtonDisabled: {
      backgroundColor: '#e5e7eb',
    },
    permissionDescription: {
      fontSize: 13,
      color: isDarkMode ? '#aaaaaa' : '#666666',
      textAlign: 'center',
      marginHorizontal: 8,
    },
    permissionButtonTextDisabled: {
      color: '#9ca3af',
    },
    noAccessContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noAccessText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#cccccc' : '#333333',
      textAlign: 'center',
    },
  });
}
