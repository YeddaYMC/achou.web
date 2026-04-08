import { getAuth } from 'firebase/auth';
import { geohashForLocation } from 'geofire-common';
import { ChevronLeft, Edit, KeyRound, LogOut, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import app from '../firebaseConfig';
import { changePasswordWithCurrent, deleteAccountAndData, logout, updateUserProfile } from '../src/services/authService';
import { fetchCepDetails, geocodeBusinessAddress } from '../src/services/geocodingService';

export default function T5Perfil() {
  const { isLoggedIn, userProfile, setUserProfile, navigateTo, setIsLoggedIn, showUpdateProfileDialog, setShowUpdateProfileDialog, setFavorites, isDarkMode, registeredUsers, setRegisteredUsers, setReturnTo, setReportBusiness, setSelectedBusiness, setLocationSettings } = useAppContext();
  const { height } = useWindowDimensions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({ 
    name: userProfile?.name || '', 
    nickname: userProfile?.nickname || '',
    email: userProfile?.email || '', 
    password: userProfile?.password || '', 
    phone: userProfile?.phone || '', 
    cpf: userProfile?.cpf || '', 
    anuncianteLevel: userProfile?.anuncianteLevel || 1, 
    createdAt: userProfile?.createdAt || '',
    cep: userProfile?.cep || '',
    street: userProfile?.street || '',
    number: userProfile?.number || '',
    neighborhood: userProfile?.neighborhood || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
  });

  // Sincroniza formData quando userProfile mudar
  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        nickname: userProfile.nickname || '',
        email: userProfile.email || '',
        password: userProfile.password || '',
        phone: userProfile.phone || '',
        cpf: userProfile.cpf || '',
        anuncianteLevel: userProfile.anuncianteLevel || 1,
        createdAt: userProfile.createdAt || '',
        cep: userProfile.cep || '',
        street: userProfile.street || '',
        number: userProfile.number || '',
        neighborhood: userProfile.neighborhood || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
      });
    }
  }, [userProfile]);

  // Auto-preenche endereço quando CEP for preenchido
  React.useEffect(() => {
    const autoFillAddressFromCep = async () => {
      const cepClean = formData.cep.replace(/\D/g, '');
      
      // Verifica se o CEP tem 8 dígitos
      if (cepClean.length !== 8) return;
      
      // Se rua já foi preenchida manualmente, não sobrescreve
      if (formData.street && formData.street.trim().length > 0) return;
      
      try {
        const result = await fetchCepDetails(formData.cep);
        
        if (result && result.details) {
          setFormData(prev => ({
            ...prev,
            street: result.details.road || '',
            neighborhood: result.details.suburb || '',
            city: result.details.city || '',
            state: result.details.state || '',
          }));
        }
      } catch (error) {
        console.warn('Falha ao buscar endereço pelo CEP:', error);
      }
    };
    
    if (showUpdateProfileDialog) {
      autoFillAddressFromCep();
    }
  }, [formData.cep, showUpdateProfileDialog]);

  // Bloqueia acesso ao perfil sem autenticação
  React.useEffect(() => {
    if (!isLoggedIn) {
      Alert.alert('Acesso restrito', 'Você precisa fazer login para acessar seu perfil.');
      navigateTo('T3');
    }
  }, [isLoggedIn, navigateTo]);

  if (!isLoggedIn) {
    return null;
  }

  const initials = useMemo(() => {
    const name = userProfile?.name || '';
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }, [userProfile]);

  const greetingName = useMemo(() => {
    const nickname = (userProfile?.nickname || '').trim();
    if (nickname) return nickname;

    const firstName = (userProfile?.name || '').trim().split(' ').filter(Boolean)[0];
    if (firstName) return firstName;

    return 'usuário';
  }, [userProfile]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const performDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);
    setShowDeleteConfirm(false);

    if (!deletePassword) {
      setIsDeletingAccount(false);
      Alert.alert('Atenção', 'Informe sua senha atual para confirmar a exclusão da conta.');
      return;
    }

    let result;
    try {
      result = await deleteAccountAndData(deletePassword);
    } catch (error: any) {
      setIsDeletingAccount(false);
      Alert.alert('Erro ao excluir conta', error?.message || 'Falha inesperada ao excluir seus dados.');
      return;
    }

    if (!result.success) {
      setIsDeletingAccount(false);
      Alert.alert('Erro ao excluir conta', result.error || 'Não foi possível excluir seus dados.');
      return;
    }

    try { setIsLoggedIn(false); } catch {}
    try { setUserProfile(null); } catch {}
    try { if (setFavorites) setFavorites([]); } catch {}
    setDeletePassword('');
    setIsDeletingAccount(false);
    Alert.alert(
      'Dados excluídos permanentemente',
      `Seu perfil foi removido com sucesso. ${result.deletedAnuncios || 0} anúncio(s) vinculado(s) também foi(ram) excluído(s) de forma permanente.`,
      [{ text: 'OK', onPress: () => navigateTo('T1') }]
    );
  };

  const handleUpdateProfile = async () => {
    let resolvedCoords: null | { lat: number; lon: number } = null;
    let resolvedGeoSource: 'cep' | 'endereco' | null = null;
    let resolvedGeohash: string | null = null;

    try {
      const geo = await geocodeBusinessAddress({
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        country: 'Brasil',
      });

      if (geo) {
        resolvedCoords = { lat: geo.lat, lon: geo.lon };
        resolvedGeoSource = geo.source;
        resolvedGeohash = geohashForLocation([geo.lat, geo.lon]);
      }
    } catch (error) {
      console.warn('Falha ao geocodificar endereço do perfil:', error);
    }

    setUserProfile({
      ...formData,
      ...(resolvedCoords ? { lat: resolvedCoords.lat, lon: resolvedCoords.lon, geohash: resolvedGeohash || undefined } : {}),
    } as any);

    if (resolvedCoords) {
      setLocationSettings({
        mode: 'address',
        cep: formData.cep,
        address: [formData.street, formData.number, formData.neighborhood, formData.city, formData.state].filter(Boolean).join(', '),
        coords: resolvedCoords,
        geoSource: resolvedGeoSource,
      });
    }
    
    // Sincroniza também com registeredUsers
    try {
      if (Array.isArray(registeredUsers) && setRegisteredUsers) {
        const updated = registeredUsers.map((u: any) =>
          u.email === userProfile?.email ? { ...u, name: formData.name, nickname: formData.nickname, phone: formData.phone, cpf: formData.cpf, cep: formData.cep, street: formData.street, number: formData.number, neighborhood: formData.neighborhood, city: formData.city, state: formData.state } : u
        );
        setRegisteredUsers(updated);
      }
    } catch (_) {}
    
    // Sincroniza com Firebase
    try {
      const auth = getAuth(app);
      if (auth.currentUser?.uid) {
        await updateUserProfile(auth.currentUser.uid, {
          name: formData.name,
          nickname: formData.nickname,
          phone: formData.phone,
          cpf: formData.cpf,
          email: formData.email,
          anuncianteLevel: formData.anuncianteLevel,
          createdAt: formData.createdAt,
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          ...(resolvedCoords ? { lat: resolvedCoords.lat, lon: resolvedCoords.lon, geohash: resolvedGeohash || undefined } : {}),
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil no Firebase:', error);
    }
    
    setShowUpdateProfileDialog(false);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleLogout = async () => {
    try {
      // Chamar logout do Firebase para sincronizar
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    
    try { setIsLoggedIn(false); } catch {}
    try { setReturnTo(null); } catch {}
    try { setReportBusiness(null); } catch {}
    try { setSelectedBusiness(null as any); } catch {}
    try { if (setFavorites) setFavorites([]); } catch {}
    Alert.alert('Sessão encerrada', 'Você saiu da sua conta.');
    navigateTo('T1');
  };

  const handlePasswordReset = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos de senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'A confirmação da nova senha não confere.');
      return;
    }

    const result = await changePasswordWithCurrent(currentPassword, newPassword);
    if (result.success) {
      Alert.alert('Sucesso', 'Senha atualizada com sucesso.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordDialog(false);
      return;
    }

    Alert.alert('Erro', result.error || 'Não foi possível redefinir a senha.');
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

            <Text style={titleStyle}>Olá, {greetingName}!</Text>
          </View>

          <View style={styles.infoList}>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>Nome Completo</Text>
              <Text style={infoTextStyle}>{userProfile?.name || 'Não informado'}</Text>
            </View>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>E-mail</Text>
              <Text style={infoTextStyle}>{userProfile?.email || 'Não informado'}</Text>
            </View>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>Telefone</Text>
              <Text style={infoTextStyle}>{userProfile?.phone || 'Não informado'}</Text>
            </View>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>CPF</Text>
              <Text style={infoTextStyle}>{userProfile?.cpf || 'Não informado'}</Text>
            </View>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>Endereço padrão de busca</Text>
              <Text style={infoTextStyle}>
                {[
                  userProfile?.street,
                  userProfile?.number,
                  userProfile?.neighborhood,
                  userProfile?.city,
                  userProfile?.state,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Não informado'}
              </Text>
              <Text style={[infoLabelStyle, { marginTop: 6 }]}>CEP: {userProfile?.cep || 'Não informado'}</Text>
            </View>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>Plano Atual</Text>
              <Text style={infoTextStyle}>
                Nível {userProfile?.anuncianteLevel || 1} 
                {userProfile?.anuncianteLevel === 1 && ' (Gratuito)'}
                {userProfile?.anuncianteLevel === 2 && ' (R$ 19,99)'}
                {userProfile?.anuncianteLevel === 3 && ' (R$ 29,99)'}
                {userProfile?.anuncianteLevel === 4 && ' (R$ 39,99)'}
              </Text>
            </View>
            <View style={[styles.infoItem, isDarkMode && { backgroundColor: '#374151', borderColor: '#60A5FA' }]}>
              <Text style={infoLabelStyle}>Data de Criação da Conta</Text>
              <Text style={infoTextStyle}>{formatDate(userProfile?.createdAt || '')}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button onPress={() => setShowUpdateProfileDialog(true)} variant="cancel" style={styles.actionButton}>
              <View style={styles.buttonContent}>
                <Edit width={20} height={20} color={isDarkMode ? '#374151' : '#374151'} />
                <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Atualizar</Text>
              </View>
            </Button>

            <Button onPress={() => setShowPasswordDialog(true)} variant="cancel" style={styles.actionButton}>
              <View style={styles.buttonContent}>
                <KeyRound width={20} height={20} color={isDarkMode ? '#374151' : '#374151'} />
                <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Redefinir Senha</Text>
              </View>
            </Button>

            <Button
              onPress={() => {
                setDeletePassword('');
                setShowDeleteConfirm(true);
              }}
              variant="destructive"
              style={styles.actionButton}
            >
              <View style={styles.buttonContent}>
                <Trash2 width={20} height={20} color="#fff" />
                <Text style={styles.buttonText}>Excluir Conta</Text>
              </View>
            </Button>

            <Button onPress={handleLogout} variant="cancel" style={styles.actionButton}>
              <View style={styles.buttonContent}>
                <LogOut width={20} height={20} color={isDarkMode ? '#374151' : '#374151'} />
                <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Sair</Text>
              </View>
            </Button>
          </View>
        </View>

        <Dialog open={showUpdateProfileDialog} onOpenChange={setShowUpdateProfileDialog}>
          <DialogContent style={{ ...styles.dialogContent, maxHeight: Math.min(640, Math.floor(height * 0.82)) }}>
            <DialogHeader>
              <DialogTitle style={titleStyle}>Atualizar Perfil</DialogTitle>
              <DialogDescription>Atualize suas informações pessoais</DialogDescription>
            </DialogHeader>
            <View style={styles.dialogBody}>
              <ScrollView
                style={styles.dialogScroll}
                contentContainerStyle={styles.dialogScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Label>Nome Completo</Label>
                    <Input 
                      value={formData.name} 
                      onChangeText={(v: string) => setFormData({ ...formData, name: v })} 
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]} 
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Como você quer ser chamado? (opcional)</Label>
                    <Input 
                      value={formData.nickname} 
                      onChangeText={(v: string) => setFormData({ ...formData, nickname: v })} 
                      placeholder="Apelido" 
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]} 
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>E-mail</Label>
                    <Input 
                      value={formData.email} 
                      onChangeText={(v: string) => setFormData({ ...formData, email: v })} 
                      keyboardType="email-address" 
                      autoCapitalize="none" 
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]} 
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Telefone</Label>
                    <Input 
                      value={formData.phone} 
                      onChangeText={(v: string) => setFormData({ ...formData, phone: v })} 
                      keyboardType="phone-pad" 
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]} 
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>CPF</Label>
                    <Input 
                      value={formData.cpf} 
                      onChangeText={(v: string) => setFormData({ ...formData, cpf: v })} 
                      keyboardType="numeric" 
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]} 
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>CEP</Label>
                    <Input
                      value={formData.cep}
                      onChangeText={(v: string) => setFormData({ ...formData, cep: v })}
                      keyboardType="numeric"
                      placeholder="00000-000"
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Rua</Label>
                    <Input
                      value={formData.street}
                      onChangeText={(v: string) => setFormData({ ...formData, street: v })}
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Número</Label>
                    <Input
                      value={formData.number}
                      onChangeText={(v: string) => setFormData({ ...formData, number: v })}
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Bairro</Label>
                    <Input
                      value={formData.neighborhood}
                      onChangeText={(v: string) => setFormData({ ...formData, neighborhood: v })}
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Cidade</Label>
                    <Input
                      value={formData.city}
                      onChangeText={(v: string) => setFormData({ ...formData, city: v })}
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Label>Estado</Label>
                    <Input
                      value={formData.state}
                      onChangeText={(v: string) => setFormData({ ...formData, state: v })}
                      style={[styles.input, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    />
                  </View>
                </View>
              </ScrollView>
              <View style={styles.dialogActions}>
                <Button variant="cancel" onPress={() => setShowUpdateProfileDialog(false)} style={styles.formButtonFlex}>
                  Cancelar
                </Button>
                <Button variant="success" onPress={handleUpdateProfile} style={styles.formButtonFlex}>
                  Salvar
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
                Pela LGPD exigimos sua confirmação explícita. Ao confirmar, seu perfil e todos os anúncios vinculados a esta conta serão apagados permanentemente. Esta ação não poderá ser desfeita.
              </Text>
              <View style={styles.inputGroup}>
                <Label>Senha atual</Label>
                <View style={styles.passwordRow}>
                  <Input
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    secureTextEntry={!showDeletePassword}
                    style={[styles.input, styles.passwordInput, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    placeholder="Digite sua senha atual"
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  />
                  <TouchableOpacity onPress={() => setShowDeletePassword((prev) => !prev)} style={styles.passwordToggle}>
                    <Text style={[styles.passwordToggleText, isDarkMode && styles.passwordToggleTextDark]}>
                      {showDeletePassword ? 'Ocultar' : 'Ver senha'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.formActions}>
                <Button variant="cancel" onPress={() => setShowDeleteConfirm(false)} style={[styles.formButtonFlex, isDeletingAccount && { opacity: 0.5 }]} disabled={isDeletingAccount}>
                  <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Cancelar</Text>
                </Button>
                <Button variant="destructive" onPress={performDeleteAccount} style={[styles.formButtonFlex, isDeletingAccount && { opacity: 0.5 }]} disabled={isDeletingAccount}>
                  <Text style={styles.buttonText}>{isDeletingAccount ? 'Excluindo...' : 'Sim, Excluir dados'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>

        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent style={styles.dialogContent}>
            <DialogHeader>
              <DialogTitle style={titleStyle}>Redefinir senha</DialogTitle>
              <DialogDescription>Altere sua senha sem sair do app.</DialogDescription>
            </DialogHeader>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Label>Senha atual</Label>
                <View style={styles.passwordRow}>
                  <Input
                    value={passwordData.currentPassword}
                    onChangeText={(v: string) => setPasswordData((p) => ({ ...p, currentPassword: v }))}
                    secureTextEntry={!showCurrentPassword}
                    style={[styles.input, styles.passwordInput, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword((prev) => !prev)} style={styles.passwordToggle}>
                    <Text style={[styles.passwordToggleText, isDarkMode && styles.passwordToggleTextDark]}>{showCurrentPassword ? 'Ocultar' : 'Ver senha'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Label>Nova senha</Label>
                <View style={styles.passwordRow}>
                  <Input
                    value={passwordData.newPassword}
                    onChangeText={(v: string) => setPasswordData((p) => ({ ...p, newPassword: v }))}
                    secureTextEntry={!showNewPassword}
                    style={[styles.input, styles.passwordInput, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)} style={styles.passwordToggle}>
                    <Text style={[styles.passwordToggleText, isDarkMode && styles.passwordToggleTextDark]}>{showNewPassword ? 'Ocultar' : 'Ver senha'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Label>Confirmar nova senha</Label>
                <View style={styles.passwordRow}>
                  <Input
                    value={passwordData.confirmPassword}
                    onChangeText={(v: string) => setPasswordData((p) => ({ ...p, confirmPassword: v }))}
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, styles.passwordInput, { color: '#000000', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.passwordToggle}>
                    <Text style={[styles.passwordToggleText, isDarkMode && styles.passwordToggleTextDark]}>{showConfirmPassword ? 'Ocultar' : 'Ver senha'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.formActions}>
                <Button
                  variant="cancel"
                  onPress={() => {
                    setShowPasswordDialog(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  style={styles.formButtonFlex}
                >
                  <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Cancelar</Text>
                </Button>
                <Button variant="success" onPress={handlePasswordReset} style={styles.formButtonFlex}>
                  <Text style={styles.buttonText}>Salvar senha</Text>
                </Button>
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
    backgroundColor: 'transparent',
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
  actionButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginLeft: 8,
    textAlign: 'center',
  },
  buttonTextDark: {
    color: '#FFFFFF',
  },
  dialogContent: {
    maxWidth: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  dialogBody: {
    marginTop: 16,
    gap: 12,
    flexShrink: 1,
  },
  dialogScroll: {
    flexGrow: 0,
  },
  dialogScrollContent: {
    gap: 12,
    paddingBottom: 12,
  },
  form: {
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#F3F4F6',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 0,
    gap: 12,
    flexShrink: 0,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 12,
    flexShrink: 0,
  },
  formButtonFlex: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  passwordToggleTextDark: {
    color: '#93c5fd',
  },
});
