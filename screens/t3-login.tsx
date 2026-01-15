import { useTheme } from '@/hooks/useTheme';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { loginWithEmail } from '../src/services/authService';

// Tela de login
export default function Login() {
  const { navigateTo, navigateBack, setIsLoggedIn, setUserProfile } = useAppContext();
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Submete login
  const handleSubmit = async () => {
    setErrorMessage(''); // Limpa erro anterior
    
    if (!formData.email || !formData.password) {
      setErrorMessage('E-mail e senha são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithEmail(formData.email, formData.password);
      setLoading(false);

      console.log('Resultado do login:', result);

      if (!result.success) {
        // Mostra erro visível na tela
        setErrorMessage(result.error || 'E-mail ou senha incorretos');
        return;
      }

      // Login bem-sucedido
      setUserProfile(result.userData || null);
      setIsLoggedIn(true);
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      navigateTo('T1');
    } catch (error) {
      setLoading(false);
      console.error('Erro no login:', error);
      setErrorMessage('Não foi possível fazer login. Tente novamente.');
    }
  };

  return (
    <LayoutRN>
      <View style={[styles.container, { padding: spacing.md, maxWidth: 448, backgroundColor: colors.background }]}>
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

          {/* Mensagem de erro visível */}
          {errorMessage ? (
            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderColor: '#EF4444',
                borderWidth: 1,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: fontSize.sm, textAlign: 'center' }}>
                ⚠️ {errorMessage}
              </Text>
              {errorMessage.includes('não encontrado') || errorMessage.includes('incorretos') ? (
                <TouchableOpacity
                  onPress={() => navigateTo('T2')}
                  style={{ marginTop: spacing.sm, alignItems: 'center' }}
                >
                  <Text style={{ color: '#DC2626', fontSize: fontSize.sm, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Criar conta agora →
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

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
                editable={!loading}
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
                editable={!loading}
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

            {/* Botão login */}
            <Button
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: colors.success,
                height: 48,
                borderRadius: borderRadius.md,
                opacity: loading ? 0.6 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: fontSize.base, fontWeight: '600' }}>ENTRAR</Text>
              )}
            </Button>

            {/* Separador OU */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.formBorder }} />
              <Text style={{ color: colors.formLabel, fontSize: fontSize.sm }}>OU</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.formBorder }} />
            </View>

            {/* Botão Google (desabilitado temporariamente) */}
            <Button
              onPress={() => setErrorMessage('Login com Google será implementado em breve')}
              disabled={loading}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: colors.formBorder,
                height: 48,
                borderRadius: borderRadius.md,
                opacity: loading ? 0.6 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Text style={{ fontSize: 20 }}>🔐</Text>
              <Text style={{ color: colors.formLabel, fontSize: fontSize.base, fontWeight: '600' }}>
                Entrar com Google
              </Text>
            </Button>

            {/* Link cadastro */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigateTo('T2')} disabled={loading}>
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
