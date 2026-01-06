import { useTheme } from '@/hooks/useTheme';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';

// Tela de cadastro de novo usuário
export default function T2Cadastro() {
  const { navigateTo, navigateBack, setUserProfile, registeredUsers, setRegisteredUsers } = useAppContext();
  const { colors, spacing, fontSize, borderRadius } = useTheme(); // Tema
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', cpf: '' }); // Dados formulário
  const [acceptedTerms, setAcceptedTerms] = useState(false); // Aceitou termos

  // Submete cadastro
  const handleSubmit = () => {
    if (!acceptedTerms) {
      Alert.alert('Atenção', 'Você precisa aceitar os termos e políticas'); // Valida termos
      return;
    }

    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'E-mail e senha são obrigatórios'); // Valida campos obrigatórios
      return;
    }

    const onlyDigitsCpf = (formData.cpf || '').replace(/\D/g, ''); // Remove não-dígitos
    if (onlyDigitsCpf.length !== 11) {
      Alert.alert('Erro', 'CPF inválido. Informe 11 dígitos.'); // Valida CPF
      return;
    }

    const userExists = registeredUsers.find((u) => u.email === formData.email); // Verifica e-mail duplicado
    if (userExists) {
      Alert.alert('Erro', 'E-mail já cadastrado. Faça login.');
      return;
    }

    const cpfExists = registeredUsers.find((u) => (u.cpf || '') === onlyDigitsCpf); // Verifica CPF duplicado
    if (cpfExists) {
      Alert.alert('Erro', 'CPF já cadastrado. Utilize o login.');
      return;
    }

    const newUser = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      cpf: onlyDigitsCpf,
      isPremium: false,
      createdAt: new Date().toISOString(),
    };
    setRegisteredUsers([...registeredUsers, newUser]); // Adiciona novo usuário
    setUserProfile(newUser); // Preenche perfil

    Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login para continuar.'); // Notifica sucesso
    navigateTo('T3'); // Redireciona para login
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
            Criar Minha Conta
          </Text>

          <View style={{ gap: 20 }}>
            {/* Nome */}
            <View>
              <Label style={{ color: colors.formLabel, marginBottom: spacing.sm }}>Nome Completo</Label>
              <Input
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Digite seu nome"
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

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

            {/* CPF */}
            <View>
              <Label style={{ color: colors.formLabel, marginBottom: spacing.sm }}>CPF</Label>
              <Input
                value={formData.cpf}
                onChangeText={(text) => setFormData({ ...formData, cpf: text })}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

            {/* Telefone */}
            <View>
              <Label style={{ color: colors.formLabel, marginBottom: spacing.sm }}>Telefone</Label>
              <Input
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="(11) 98765-4321"
                keyboardType="phone-pad"
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
              />
            </View>

            {/* Senha */}
            <View>
              <Label style={{ color: colors.formLabel, marginBottom: spacing.sm }}>Senha</Label>
              <Input
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                style={{ backgroundColor: colors.formInputBg, borderColor: colors.formBorder }}
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
                <Text style={{ color: colors.formLabel, fontSize: fontSize.sm }}>Aceito os </Text>
                <TouchableOpacity onPress={() => navigateTo('T8')}>
                  <Text style={{ color: colors.formLink, fontSize: fontSize.sm, textDecorationLine: 'underline' }}>
                    Termos de Consentimento LGPD
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão cadastrar */}
            <Button
              onPress={handleSubmit}
              disabled={!acceptedTerms}
              style={{
                backgroundColor: acceptedTerms ? colors.success : colors.muted,
                opacity: acceptedTerms ? 1 : 0.5,
                height: 48,
                borderRadius: borderRadius.md,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: fontSize.base, fontWeight: '600' }}>CRIAR CONTA</Text>
            </Button>

            {/* Link login */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigateTo('T3')}>
                <Text style={{ color: colors.formLink, fontSize: fontSize.sm, textDecorationLine: 'underline' }}>
                  Já tenho conta. Fazer login
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
});
