import { useTheme } from '@/hooks/useTheme';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { loginWithEmail, requestPasswordReset } from '../src/services/authService';

const REMEMBER_LOGIN_KEY = 'achou_remember_login';
const REMEMBER_EMAIL_KEY = 'achou_login_email';
const REMEMBER_PASSWORD_KEY = 'achou_login_password';

// Tela de login
export default function Login() {
  const { navigateTo, navigateBack, setIsLoggedIn, setUserProfile, returnTo, setReturnTo } = useAppContext();
  const { colors, spacing, fontSize, borderRadius, isDark } = useTheme();
  const formTextColor = isDark ? '#FFFFFF' : colors.formLabel;
  const fieldStyle = isDark
    ? { backgroundColor: '#374151', borderColor: '#60A5FA' }
    : { backgroundColor: colors.formInputBg, borderColor: colors.formBorder };
  const cardSurfaceStyle = isDark
    ? { backgroundColor: '#111827', borderColor: '#1D4ED8' }
    : { backgroundColor: colors.formBackground, borderColor: colors.formBorder };
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Wrappers seguros para SecureStore que fazem fallback para localStorage (web)
  const safeGetItemAsync = async (key: string) => {
    try {
      if (Platform.OS !== 'web' && SecureStore && typeof (SecureStore as any).getItemAsync === 'function') {
        return await (SecureStore as any).getItemAsync(key);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (err) {
      console.warn('safeGetItemAsync fallback error:', err);
      return null;
    }
  };

  const safeSetItemAsync = async (key: string, value: string) => {
    try {
      if (Platform.OS !== 'web' && SecureStore && typeof (SecureStore as any).setItemAsync === 'function') {
        return await (SecureStore as any).setItemAsync(key, value);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (err) {
      console.warn('safeSetItemAsync fallback error:', err);
    }
  };

  const safeDeleteItemAsync = async (key: string) => {
    try {
      if (Platform.OS !== 'web' && SecureStore && typeof (SecureStore as any).deleteItemAsync === 'function') {
        return await (SecureStore as any).deleteItemAsync(key);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (err) {
      console.warn('safeDeleteItemAsync fallback error:', err);
    }
  };

  useEffect(() => {
    const loadRememberedCredentials = async () => {
      try {
        const remember = await safeGetItemAsync(REMEMBER_LOGIN_KEY);
        const shouldRemember = remember === 'true';
        setRememberLogin(shouldRemember);

        if (shouldRemember) {
          const [savedEmail, savedPassword] = await Promise.all([
            safeGetItemAsync(REMEMBER_EMAIL_KEY),
            safeGetItemAsync(REMEMBER_PASSWORD_KEY),
          ]);

          setFormData({
            email: savedEmail || '',
            password: savedPassword || '',
          });
        }
      } catch (error) {
        console.warn('Falha ao carregar credenciais salvas:', error);
      }
    };

    void loadRememberedCredentials();
  }, []);

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
        setErrorMessage(result.error || 'E-mail ou senha incorretos');
        return;
      }

      // Login bem-sucedido
      if (rememberLogin) {
        await Promise.all([
          safeSetItemAsync(REMEMBER_LOGIN_KEY, 'true'),
          safeSetItemAsync(REMEMBER_EMAIL_KEY, formData.email.trim()),
          safeSetItemAsync(REMEMBER_PASSWORD_KEY, formData.password),
        ]);
      } else {
        await Promise.all([
          safeSetItemAsync(REMEMBER_LOGIN_KEY, 'false'),
          safeDeleteItemAsync(REMEMBER_EMAIL_KEY),
          safeDeleteItemAsync(REMEMBER_PASSWORD_KEY),
        ]);
      }

      setUserProfile(result.userData || null);
      setIsLoggedIn(true);
      Alert.alert('Sucesso', 'Login realizado com sucesso!');

      const destination = returnTo && returnTo !== 'T3' ? returnTo : 'T1';
      navigateTo(destination);
      setReturnTo(null);
    } catch (error) {
      setLoading(false);
      console.error('Erro no login:', error);
      setErrorMessage('Não foi possível fazer login. Tente novamente.');
    }
  };

  const openForgotPasswordDialog = () => {
    setForgotEmail((formData.email || '').trim());
    setForgotFeedback('');
    setForgotSuccess(false);
    setForgotDialogOpen(true);
  };

  const handleForgotPassword = async () => {
    const targetEmail = forgotEmail.trim();

    if (!targetEmail) {
      setForgotSuccess(false);
      setForgotFeedback('Informe seu e-mail para receber o link de redefinição.');
      return;
    }

    setForgotLoading(true);
    const result = await requestPasswordReset(targetEmail);
    setForgotLoading(false);

    if (result.success) {
      setForgotSuccess(true);
      setForgotFeedback('Link de redefinição enviado. Verifique seu e-mail (inclusive spam).');
      return;
    }

    setForgotSuccess(false);
    setForgotFeedback(result.error || 'Não foi possível enviar o link de redefinição.');
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
              backgroundColor: cardSurfaceStyle.backgroundColor,
              borderColor: cardSurfaceStyle.borderColor,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.formTitle, fontSize: fontSize['2xl'], marginBottom: spacing.sm }]}>
            Entrar na Minha Conta
          </Text>

          {/* Botão Criar Conta no Topo */}
          <Button
            onPress={() => navigateTo('T2')}
            disabled={loading}
            variant="outline"
            style={{
              height: 40,
              borderColor: colors.formBorder,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: formTextColor, fontSize: fontSize.sm, fontWeight: '600' }}>
              Não tem conta? Criar conta agora
            </Text>
          </Button>

          {/* Mensagem de erro visível */}
          {errorMessage ? (
            <View
              style={{
                backgroundColor: isDark ? '#3f1d24' : '#FEE2E2',
                borderColor: isDark ? '#ef4444' : '#EF4444',
                borderWidth: 1,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ color: isDark ? '#fecaca' : '#DC2626', fontSize: fontSize.sm, textAlign: 'center' }}>
                ⚠️ {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 20 }}>
            {/* E-mail */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>E-mail</Label>
              <Input
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            {/* Senha */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Senha</Label>
              <View style={styles.passwordRow}>
                <Input
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Digite sua senha"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  style={{ ...styles.passwordInput, ...fieldStyle }}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle} disabled={loading}>
                  <Text style={{ color: isDark ? '#BFDBFE' : colors.formLink, fontSize: fontSize.sm, fontWeight: '600' }}>
                    {showPassword ? 'Ocultar' : 'Ver senha'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Linha: Lembrar de mim + Botão Esqueci minha senha */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberRow}>
                <Checkbox checked={rememberLogin} onCheckedChange={setRememberLogin} />
                <Text style={{ color: formTextColor, fontSize: fontSize.sm }}>Lembrar de mim</Text>
              </View>

              {/* Botão real de esqueci a senha alinhado ao lado */}
              <Button
                onPress={openForgotPasswordDialog}
                disabled={loading}
                variant="outline"
                style={{
                  height: 36,
                  paddingHorizontal: 12,
                  borderColor: colors.formBorder,
                  borderRadius: borderRadius.md,
                }}
              >
                <Text style={{ color: formTextColor, fontSize: fontSize.xs, fontWeight: '600' }}>
                  Esqueci a senha
                </Text>
              </Button>
            </View>

            {/* Botão ENTRAR Principal */}
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
          </View>
        </View>
      </View>

      <Dialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: formTextColor }}>Redefinir senha</DialogTitle>
            <DialogDescription style={{ color: isDark ? '#E5E7EB' : colors.formLabel }}>Digite seu e-mail para receber o link de redefinição.</DialogDescription>
          </DialogHeader>

          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>E-mail</Label>
              <Input
                value={forgotEmail}
                onChangeText={setForgotEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!forgotLoading}
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

            {!!forgotFeedback && (
              <Text style={{ color: forgotSuccess ? '#86EFAC' : '#FCA5A5', fontSize: fontSize.sm, textAlign: 'center' }}>
                {forgotFeedback}
              </Text>
            )}

            <View style={{ gap: spacing.sm }}>
              <Button onPress={() => setForgotDialogOpen(false)} variant="cancel" style={{ minHeight: 48 }}>
                Cancelar
              </Button>
              <Button onPress={handleForgotPassword} variant="success" disabled={forgotLoading} style={{ minHeight: 48 }}>
                {forgotLoading ? 'Enviando...' : 'Solicitar link de redefinição'}
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 4,
  },
  formCard: {
    borderWidth: 2,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
