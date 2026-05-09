import { useTheme } from '@/hooks/useTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { registerWithEmail } from '../src/services/authService';
import { fetchCepDetails } from '../src/services/geocodingService';

// Tela de cadastro de novo usuário
export default function T2Cadastro() {
  const { navigateTo, navigateBack, setUserProfile, setIsLoggedIn, registrationDraft, setRegistrationDraft } = useAppContext();
  const { colors, spacing, fontSize, borderRadius, isDark } = useTheme();
  const formTextColor = isDark ? '#FFFFFF' : colors.formLabel;
  const formLinkTextColor = isDark ? '#BFDBFE' : colors.formLink;
  const fieldStyle = isDark
    ? { backgroundColor: '#374151', borderColor: '#60A5FA' }
    : { backgroundColor: colors.formInputBg, borderColor: colors.formBorder };
  const cardSurfaceStyle = isDark
    ? { backgroundColor: '#111827', borderColor: '#1D4ED8' }
    : { backgroundColor: colors.formBackground, borderColor: colors.formBorder };
  const initialFormData = {
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
  };
  const [formData, setFormData] = useState({
    ...initialFormData,
    ...registrationDraft,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cepLookupLoading, setCepLookupLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const toUpperSafe = (value: string) => (value || '').toUpperCase();

  useEffect(() => {
    setRegistrationDraft(formData);
  }, [formData, setRegistrationDraft]);

  useEffect(() => {
    let cancelled = false;

    const autoFillAddressFromCep = async () => {
      const cepDigits = (formData.cep || '').replace(/\D/g, '');

      if (cepDigits.length !== 8) {
        setCepLookupLoading(false);
        return;
      }

      setCepLookupLoading(true);

      try {
        const result = await fetchCepDetails(cepDigits);
        if (cancelled || !result?.details) return;

        setFormData((prev) => ({
          ...prev,
          street: prev.street || toUpperSafe(result.details.road || ''),
          neighborhood: prev.neighborhood || toUpperSafe(result.details.suburb || ''),
          city: prev.city || toUpperSafe(result.details.city || ''),
          state: prev.state || toUpperSafe(result.details.state || ''),
        }));
      } catch (error) {
        console.warn('Falha ao buscar endereço pelo CEP no cadastro:', error);
      } finally {
        if (!cancelled) {
          setCepLookupLoading(false);
        }
      }
    };

    autoFillAddressFromCep();

    return () => {
      cancelled = true;
    };
  }, [formData.cep]);

  // Submete cadastro
  const handleSubmit = async () => {
    setErrorMessage(''); // Limpa erro anterior
    
    if (!acceptedTerms) {
      setErrorMessage('Você precisa aceitar os termos e políticas');
      Alert.alert('Atenção', 'Você precisa aceitar os termos e políticas.');
      return;
    }

    if (!formData.email || !formData.password || !formData.name) {
      setErrorMessage('Nome, e-mail e senha são obrigatórios');
      Alert.alert('Atenção', 'Nome, e-mail e senha são obrigatórios.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Senha deve ter no mínimo 6 caracteres');
      Alert.alert('Atenção', 'Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('As senhas não conferem');
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    const onlyDigitsCpf = (formData.cpf || '').replace(/\D/g, '');
    if (onlyDigitsCpf.length !== 11) {
      setErrorMessage('CPF inválido. Informe 11 dígitos.');
      Alert.alert('Atenção', 'CPF inválido. Informe 11 dígitos.');
      return;
    }

    const cepDigits = (formData.cep || '').replace(/\D/g, '');
    let currentFormData = formData;

    if (cepDigits.length === 8 && (!currentFormData.street || !currentFormData.neighborhood || !currentFormData.city || !currentFormData.state)) {
      setCepLookupLoading(true);
      try {
        const cepResult = await fetchCepDetails(cepDigits);
        if (cepResult?.details) {
          currentFormData = {
            ...currentFormData,
            street: currentFormData.street || toUpperSafe(cepResult.details.road || ''),
            neighborhood: currentFormData.neighborhood || toUpperSafe(cepResult.details.suburb || ''),
            city: currentFormData.city || toUpperSafe(cepResult.details.city || ''),
            state: currentFormData.state || toUpperSafe(cepResult.details.state || ''),
          };
          setFormData(currentFormData);
        }
      } catch (error) {
        console.warn('Falha ao completar endereço pelo CEP no envio do cadastro:', error);
      } finally {
        setCepLookupLoading(false);
      }
    }

    if (cepDigits.length !== 8 || !currentFormData.street || !currentFormData.number || !currentFormData.neighborhood || !currentFormData.city || !currentFormData.state) {
      setErrorMessage('Informe o endereço completo para definir a localização padrão');
      Alert.alert('Atenção', 'Informe CEP, rua, número, bairro, cidade e estado.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithEmail(formData.email, formData.password, {
        name: toUpperSafe(formData.name),
        nickname: formData.nickname ? toUpperSafe(formData.nickname) : undefined,
        email: formData.email,
        phone: formData.phone,
        cpf: onlyDigitsCpf,
        anuncianteLevel: 1,
        cep: currentFormData.cep,
        street: toUpperSafe(currentFormData.street),
        number: currentFormData.number,
        neighborhood: toUpperSafe(currentFormData.neighborhood),
        city: toUpperSafe(currentFormData.city),
        state: toUpperSafe(currentFormData.state),
      });
      setLoading(false);

      console.log('Resultado do cadastro:', result);

      if (!result.success) {
        setErrorMessage(result.error || 'Tente novamente');
        Alert.alert('Erro no cadastro', result.error || 'Não foi possível criar sua conta.');
        return;
      }

      setRegistrationDraft(initialFormData);

      // Cadastro bem-sucedido
      setUserProfile({ 
        name: toUpperSafe(formData.name),
        nickname: formData.nickname ? toUpperSafe(formData.nickname) : undefined,
        email: formData.email,
        phone: formData.phone,
        cpf: onlyDigitsCpf, 
        anuncianteLevel: 1, 
        createdAt: new Date().toISOString(),
        cep: currentFormData.cep,
        street: toUpperSafe(currentFormData.street),
        number: currentFormData.number,
        neighborhood: toUpperSafe(currentFormData.neighborhood),
        city: toUpperSafe(currentFormData.city),
        state: toUpperSafe(currentFormData.state),
      });
      setIsLoggedIn(true);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigateTo('T1');
    } catch (error) {
      setLoading(false);
      console.error('Erro no cadastro:', error);
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    }
  };

  return (
    <LayoutRN>
      <View style={[styles.container, { padding: spacing.md, maxWidth: 448, backgroundColor: colors.background }]}>
        {/* Botão voltar */}
        <TouchableOpacity onPress={navigateBack} style={{ marginBottom: spacing.lg }} disabled={loading}>
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
          <Text style={[styles.title, { color: colors.formTitle, fontSize: fontSize['2xl'], marginBottom: spacing.lg }]}> 
            Criar Minha Conta
          </Text>

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
              {errorMessage.includes('já está cadastrado') ? (
                <TouchableOpacity
                  onPress={() => navigateTo('T3')}
                  style={{ marginTop: spacing.sm, alignItems: 'center' }}
                >
                  <Text style={{ color: isDark ? '#fecaca' : '#DC2626', fontSize: fontSize.sm, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Fazer login →
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={{ gap: 20 }}>
            {/* Nome */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Nome Completo</Label>
              <Input
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: toUpperSafe(text) })}
                placeholder="Digite seu nome"
                editable={!loading}
                style={fieldStyle}
              />
              {cepLookupLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <ActivityIndicator size="small" color={colors.success} />
                  <Text style={{ color: formTextColor, fontSize: fontSize.xs }}>
                    Buscando endereço pelo CEP...
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Apelido (opcional) */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>
                Como você quer ser chamado? <Text style={{ fontSize: fontSize.xs, opacity: 0.7 }}>(opcional)</Text>
              </Label>
              <Input
                value={formData.nickname}
                onChangeText={(text) => setFormData({ ...formData, nickname: toUpperSafe(text) })}
                placeholder="Apelido ou como prefere ser chamado"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

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

            {/* CPF */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>CPF</Label>
              <Input
                value={formData.cpf}
                onChangeText={(text) => setFormData({ ...formData, cpf: text })}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            {/* Telefone */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Telefone</Label>
              <Input
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="(11) 98765-4321"
                keyboardType="phone-pad"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            {/* Endereço padrão */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>CEP</Label>
              <Text style={{ color: isDark ? '#E5E7EB' : colors.formLabel, fontSize: fontSize.xs, marginBottom: 6, opacity: 0.9 }}>
                Informe o CEP para preencher automaticamente rua, bairro, cidade e estado.
              </Text>
              <Input
                value={formData.cep}
                onChangeText={(text) => setFormData({ ...formData, cep: text })}
                placeholder="00000-000"
                keyboardType="numeric"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Rua</Label>
              <Input
                value={formData.street}
                onChangeText={(text) => setFormData({ ...formData, street: toUpperSafe(text) })}
                placeholder="Rua, avenida, estrada"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Número</Label>
              <Input
                value={formData.number}
                onChangeText={(text) => setFormData({ ...formData, number: text })}
                placeholder="123"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Bairro</Label>
              <Input
                value={formData.neighborhood}
                onChangeText={(text) => setFormData({ ...formData, neighborhood: toUpperSafe(text) })}
                placeholder="Centro"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Cidade</Label>
              <Input
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: toUpperSafe(text) })}
                placeholder="Curitiba"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Estado</Label>
              <Input
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: toUpperSafe(text) })}
                placeholder="PR"
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            {/* Senha */}
            <View>
              <View style={styles.passwordLabelRow}>
                <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Senha</Label>
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} disabled={loading} style={styles.passwordToggle}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={colors.formLink}
                  />
                  <Text style={{ color: formLinkTextColor, fontSize: fontSize.xs, marginLeft: 6 }}>
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Input
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry={!showPassword}
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            {/* Confirmar senha */}
            <View>
              <Label style={{ color: formTextColor, marginBottom: spacing.sm }}>Confirmar senha</Label>
              <Input
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Repita a senha"
                secureTextEntry={!showPassword}
                editable={!loading}
                style={fieldStyle}
              />
            </View>

            {/* Termos */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                style={{ borderColor: colors.formBorder }}
              />
              <View style={styles.checkboxLabel}>
                <Text style={{ color: formTextColor, fontSize: fontSize.sm }}>Aceito os </Text>
                <TouchableOpacity onPress={() => navigateTo('T11')} disabled={loading}>
                  <Text style={{ color: formLinkTextColor, fontSize: fontSize.sm, textDecorationLine: 'underline' }}>
                    Termos de Uso
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: formTextColor, fontSize: fontSize.sm }}> e as </Text>
                <TouchableOpacity onPress={() => navigateTo('T8')} disabled={loading}>
                  <Text style={{ color: formLinkTextColor, fontSize: fontSize.sm, textDecorationLine: 'underline' }}>
                    Políticas de Privacidade
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão cadastrar */}
            <Button
              onPress={() => {
                if (!acceptedTerms || loading || cepLookupLoading) return;
                void handleSubmit();
              }}
              style={{
                backgroundColor: acceptedTerms && !loading && !cepLookupLoading ? colors.success : colors.muted,
                opacity: 1,
                height: 48,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : cepLookupLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: fontSize.base, fontWeight: '600' }}>CRIAR CONTA</Text>
              )}
            </Button>

            {/* Link login */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigateTo('T3')} disabled={loading}>
                <Text style={{ color: formLinkTextColor, fontSize: fontSize.sm, textDecorationLine: 'underline' }}>
                  Já tenho conta. Fazer login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.success} />
            <Text style={styles.loadingText}>Criando sua conta...</Text>
          </View>
        </View>
      )}
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
  checkboxContainer: {
    flexDirection: 'row', // Direção horizontal
    alignItems: 'flex-start', // Alinha início
    gap: 12, // Espaço entre itens
    paddingVertical: 12, // Padding vertical
  },
  checkboxLabel: {
    flex: 1, // Ocupa espaço disponível
    flexDirection: 'row', // Direção horizontal
    flexWrap: 'wrap', // Quebra linha
    alignItems: 'center', // Alinha centro
  },
  footer: {
    alignItems: 'center', // Centraliza
    paddingTop: 12, // Espaço superior
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});
