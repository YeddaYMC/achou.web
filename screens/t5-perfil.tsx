import { ChevronLeft, Edit, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';

export default function T5Perfil() {
  const { userProfile, setUserProfile, navigateTo, setIsLoggedIn, showUpdateProfileDialog, setShowUpdateProfileDialog, setFavorites, isDarkMode, registeredUsers, setRegisteredUsers, setReturnTo, setReportBusiness, setSelectedBusiness } = useAppContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: userProfile?.name || '', 
    email: userProfile?.email || '', 
    password: userProfile?.password || '', 
    phone: userProfile?.phone || '', 
    cpf: userProfile?.cpf || '', 
    isPremium: userProfile?.isPremium || false, 
    createdAt: userProfile?.createdAt || '' 
  });

  const initials = useMemo(() => {
    const name = userProfile?.name || '';
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }, [userProfile]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const performDeleteAccount = () => {
    setShowDeleteConfirm(false);
    try { setIsLoggedIn(false); } catch {}
    try { setUserProfile({ name: '', email: '', phone: '', cpf: '', isPremium: false, createdAt: '' }); } catch {}
    try { if (setFavorites) setFavorites([]); } catch {}
    Alert.alert('Sucesso', 'Sua conta e dados foram excluídos permanentemente');
    navigateTo('T1');
  };

  const handleUpdateProfile = () => {
    setUserProfile(formData);
    // Sincroniza também com registeredUsers
    try {
      if (Array.isArray(registeredUsers) && setRegisteredUsers) {
        const updated = registeredUsers.map((u: any) =>
          u.email === userProfile?.email ? { ...u, name: formData.name, phone: formData.phone, cpf: formData.cpf } : u
        );
        setRegisteredUsers(updated);
      }
    } catch (_) {}
    setShowUpdateProfileDialog(false);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleLogout = () => {
    try { setIsLoggedIn(false); } catch {}
    try { setReturnTo(null); } catch {}
    try { setReportBusiness(null); } catch {}
    try { setSelectedBusiness(null as any); } catch {}
    try { if (setFavorites) setFavorites([]); } catch {}
    Alert.alert('Sessão encerrada', 'Você saiu da sua conta.');
    navigateTo('T1');
  };

  const containerStyle = isDarkMode ? { ...styles.container, ...styles.containerDark } : styles.container;
  const cardStyle = isDarkMode ? { ...styles.card, ...styles.cardDark } : styles.card;
  const titleStyle = isDarkMode ? { ...styles.title, ...styles.titleDark } : styles.title;
  const infoLabelStyle = isDarkMode ? { ...styles.infoLabel, ...styles.infoLabelDark } : styles.infoLabel;
  const infoTextStyle = isDarkMode ? { ...styles.infoText, ...styles.infoTextDark } : styles.infoText;
  const avatarTextStyle = isDarkMode ? { ...styles.avatarText, ...styles.avatarTextDark } : styles.avatarText;
  const backTextStyle = isDarkMode ? { ...styles.backText, ...styles.backTextDark } : styles.backText;

  return (
    <LayoutRN>
      <ScrollView style={containerStyle}>
        <TouchableOpacity onPress={() => navigateTo('T1')} style={styles.backButton}>
          <View style={styles.backContent}>
            <ChevronLeft width={20} height={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={backTextStyle}>Voltar</Text>
          </View>
        </TouchableOpacity>

        <View style={cardStyle}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={avatarTextStyle}>{initials}</Text>
            </View>

            <Text style={titleStyle}>Meu Perfil</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={infoLabelStyle}>Nome Completo</Text>
              <Text style={infoTextStyle}>{userProfile?.name || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={infoLabelStyle}>E-mail</Text>
              <Text style={infoTextStyle}>{userProfile?.email || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={infoLabelStyle}>Telefone</Text>
              <Text style={infoTextStyle}>{userProfile?.phone || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={infoLabelStyle}>CPF</Text>
              <Text style={infoTextStyle}>{userProfile?.cpf || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={infoLabelStyle}>Data de Criação da Conta</Text>
              <Text style={infoTextStyle}>{formatDate(userProfile?.createdAt || '')}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button onPress={() => setShowUpdateProfileDialog(true)} variant="outline" style={styles.actionOutlined}>
              <View style={styles.buttonContent}>
                <Edit width={20} height={20} color={isDarkMode ? '#60A5FA' : '#1e3a8a'} />
                <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Atualizar Perfil</Text>
              </View>
            </Button>

            <Button onPress={() => setShowDeleteConfirm(true)} variant="destructive" style={styles.actionDanger}>
              <View style={styles.buttonContent}>
                <Trash2 width={20} height={20} color="#fff" />
                <Text style={styles.buttonText}>Excluir Conta</Text>
              </View>
            </Button>

            <Button onPress={handleLogout} variant="outline" style={styles.actionOutlined}>
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Sair (Logout)</Text>
              </View>
            </Button>
          </View>
        </View>

        <Dialog open={showUpdateProfileDialog} onOpenChange={setShowUpdateProfileDialog}>
          <DialogContent style={styles.dialogContent}>
            <DialogHeader>
              <DialogTitle style={titleStyle}>Atualizar Perfil</DialogTitle>
              <DialogDescription>Atualize suas informações pessoais</DialogDescription>
            </DialogHeader>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Label>Nome Completo</Label>
                <Input value={formData.name} onChangeText={(v: string) => setFormData({ ...formData, name: v })} style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Label>E-mail</Label>
                <Input value={formData.email} onChangeText={(v: string) => setFormData({ ...formData, email: v })} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Label>Telefone</Label>
                <Input value={formData.phone} onChangeText={(v: string) => setFormData({ ...formData, phone: v })} keyboardType="phone-pad" style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Label>CPF</Label>
                <Input value={formData.cpf} onChangeText={(v: string) => setFormData({ ...formData, cpf: v })} keyboardType="numeric" style={styles.input} />
              </View>
              <View style={styles.formActions}>
                <Button variant="outline" onPress={() => setShowUpdateProfileDialog(false)} style={styles.formButtonOutline}>
                  <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Cancelar</Text>
                </Button>
                <Button onPress={handleUpdateProfile} style={styles.formButtonPrimary}>
                  <Text style={styles.buttonText}>Salvar</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent style={styles.dialogContent}>
            <DialogHeader>
              <DialogTitle style={{ color: '#dc2626', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Confirmar exclusão de conta</DialogTitle>
              <DialogDescription style={{ fontSize: 14, marginBottom: 12 }}>Esta ação é irreversível. Ao confirmar, todos os seus dados serão excluídos permanentemente.</DialogDescription>
            </DialogHeader>
            <View>
              <Text style={{ fontSize: 14, color: isDarkMode ? '#e5e7eb' : '#374151', marginBottom: 16 }}>
                Pela LGPD exigimos sua confirmação explícita. Se você realmente deseja prosseguir, clique em "Sim, desejo excluir meus dados". Esta ação não poderá ser desfeita.
              </Text>
              <View style={styles.deleteActions}>
                <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} style={styles.deleteCancelButton}>
                  <Text style={styles.deleteCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={performDeleteAccount} style={styles.deleteConfirmButton}>
                  <Text style={styles.deleteConfirmText}>Sim, desejo excluir meus dados</Text>
                </TouchableOpacity>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      </ScrollView>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#0f172a',
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
  card: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#0ea5e9',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700',
  },
  avatarTextDark: {
    color: '#ffffff',
  },
  title: {
    fontSize: 18,
    color: '#1e3a8a',
    fontWeight: '700',
  },
  titleDark: {
    color: '#60A5FA',
  },
  infoList: {
    marginTop: 12,
    marginBottom: 16,
  },
  infoItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  infoLabelDark: {
    color: '#9CA3AF',
  },
  infoText: {
    fontSize: 14,
    color: '#111827',
  },
  infoTextDark: {
    color: '#F3F4F6',
  },
  actions: {
    marginTop: 8,
  },
  actionOutlined: {
    height: 48,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionDanger: {
    height: 48,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonTextDark: {
    color: '#FFFFFF',
  },
  dialogContent: {
    maxWidth: '90%',
  },
  form: {
    paddingTop: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  formButtonOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  formButtonPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActions: {
    flexDirection: 'column',
    gap: 12,
  },
  deleteCancelButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  deleteCancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
