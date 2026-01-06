import { useTheme } from '@/hooks/useTheme';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';

// Tela de login
export default function Login() {
  const { navigateTo, navigateBack, setIsLoggedIn, setUserProfile, registeredUsers, returnTo } = useAppContext();
  const { colors, spacing, fontSize, borderRadius } = useTheme(); // Tema
  const [formData, setFormData] = useState({ email: '', password: '' }); // Dados formulário

  // Submete login
  const handleSubmit = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'E-mail e senha são obrigatórios'); // Valida campos
      return;
    }

    const user = registeredUsers.find((u) => u.email === formData.email && u.password === formData.password); // Busca usuário
    if (!user) {
      Alert.alert('Erro', 'E-mail ou senha incorretos'); // Credenciais inválidas
      return;
    }

    setUserProfile(user); // Define perfil
    setIsLoggedIn(true); // Define como logado
    Alert.alert('Sucesso', `Bem-vindo(a), ${user.name}!`); // Notifica sucesso
    navigateTo(returnTo || 'T1'); // Redireciona para tela desejada ou T1
  };

  return (
    <LayoutRN>
      <View style={[styles.container, { padding: spacing.md, maxWidth: 448 }]}>
        {/* Botão voltar */}
        <TouchableOpacity onPress={navigateBack} style={{ marginBottom: spacing.lg }}>
          <View style={styles.backButton}>
            <ChevronLeft size={20} color={colors.formLink} />
            <Text style={[styles.backButtonText, { color: colors.formLink, fontSize: fontSize.base }]}>Voltar</Text>
          </View>
        </TouchableOpacity>

        {/* Card formulário */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.formBackground,
              borderColor: colors.formBorder,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.formTitle, fontSize: fontSize['2xl'], marginBottom: spacing.lg }]}>
            Entrar na Minha Conta
          </Text>

          <View style={{ gap: 20 }}>
            {/* E-mail */}
            <View>
              <Label style={{ color: colors.formLabel, marginBottom: spacing.sm }}>E-mail</Label>
              <Input
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

            {/* Senha */}
            <View>
              <Label style={{ color: colors.formLabel, marginBottom: spacing.sm }}>Senha</Label>
              <Input
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Digite sua senha"
                secureTextEntry
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

            {/* Botão login */}
            <Button
              onPress={handleSubmit}
              style={{
                backgroundColor: colors.success,
                height: 48,
                borderRadius: borderRadius.md,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: fontSize.base, fontWeight: '600' }}>ENTRAR</Text>
            </Button>

            {/* Link cadastro */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigateTo('T2')}>
                <Text style={{ color: colors.formLink, fontSize: fontSize.sm, textDecorationLine: 'underline' }}>
                  Não tenho conta. Criar agora
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Tela cheia
    width: '100%', // Largura total
    alignSelf: 'center', // Centraliza
  },
  backButton: {
    flexDirection: 'row', // Direção horizontal
    alignItems: 'center', // Alinha centro
  },
  backButtonText: {
    marginLeft: 4, // Espaço à esquerda
  },
  formCard: {
    borderWidth: 2, // Borda
  },
  title: {
    fontWeight: 'bold', // Negrito
    textAlign: 'center', // Centralizado
  },
  footer: {
    alignItems: 'center', // Centraliza
    paddingTop: 12, // Espaço superior
  },
});
