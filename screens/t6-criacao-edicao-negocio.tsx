import { Check, ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';

const CATEGORIES = [
  'Alimentação & Restaurantes',
  'Artesanato',
  'Beleza & Estética',
  'Cafés & Padarias',
  'Casa & Construção',
  'Educação & Cursos',
  'Entretenimento & Lazer',
  'Eventos',
  'Limpeza & Manutenção',
  'Moda & Vestuário',
  'Pet Shop & Veterinária',
  'Presentes & Joias',
  'Saúde & Fitness',
  'Serviços Automotivos',
  'Tecnologia & Informática',
  'Outros'
];

export default function T6CriacaoEdicao() {
  const { navigateTo, businesses, setBusinesses, userProfile, isDarkMode } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    cep: '',
    street: '',
    number: '',
    phone: '',
    email: '',
    site: '',
    instagram: '',
    facebook: '',
    pinterest: '',
    whatsapp: '',
    description: '',
    entregaRapida: false,
    isImperdivel: false,
  });

  const [contactVisibility, setContactVisibility] = useState({
    phone: true,
    whatsapp: true,
    email: true,
    site: true,
    instagram: true,
    facebook: true,
    pinterest: true,
  });

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const ChevronLeftIcon: any = ChevronLeft;
  const CheckIcon: any = Check;

  // Função auxiliar para verificar permissões por nível
  const getNivelPermissoes = () => {
    const nivel = userProfile?.anuncianteLevel || 1;
    return {
      maxFotos: [1, 1, 3, 5][nivel - 1],
      isImperdivelEnabled: nivel >= 3,
      linksEnabled: nivel >= 2,
      maxCategorias: nivel === 1 ? 1 : Infinity,
      relatoriosEnabled: nivel === 4
    };
  };

  const permissoes = getNivelPermissoes();

  const normalizeUrl = (u: string) => {
    if (!u) return '';
    return u.startsWith('http://') || u.startsWith('https://') ? u : 'https://' + u;
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.cep || !formData.phone || !formData.whatsapp || !formData.description) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios (Nome, Categoria, CEP, Telefone, WhatsApp, Descrição)');
      return;
    }

    const normalizedForm = {
      ...formData,
      site: normalizeUrl(formData.site),
      instagram: normalizeUrl(formData.instagram),
      facebook: normalizeUrl(formData.facebook),
      pinterest: normalizeUrl(formData.pinterest),
    };

    // Estrutura para Firebase Firestore
    const newBusiness: any = {
      ...normalizedForm,
      id: businesses.length + 1,
      image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400',
      contactVisibility,
      entregaRapida: formData.entregaRapida,
      owner: userProfile?.email || null,
      ownerId: userProfile?.email || null, // Para consultas futuras
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active', // Para gerenciamento (active, inactive, reported, deleted)
      reportCount: 0,
    };

    setBusinesses([...businesses, newBusiness]);
    Alert.alert('Sucesso', 'Anúncio criado com sucesso!');
    navigateTo('T7');
  };

  const containerStyle = isDarkMode ? { ...styles.container, ...styles.containerDark } : styles.container;
  const cardStyle = isDarkMode ? { ...styles.card, ...styles.cardDark } : styles.card;
  const titleStyle = isDarkMode ? { ...styles.title, ...styles.titleDark } : styles.title;
  const labelStyle = isDarkMode ? { ...styles.label, ...styles.labelDark } : styles.label;
  const inputStyle = isDarkMode ? { ...styles.input, ...styles.inputDark } : styles.input;
  const textareaStyle = isDarkMode ? { ...styles.textarea, ...styles.textareaDark } : styles.textarea;
  const backTextStyle = isDarkMode ? { ...styles.backText, ...styles.backTextDark } : styles.backText;
  const categoryButtonStyle = isDarkMode ? { ...styles.categoryButton, ...styles.categoryButtonDark } : styles.categoryButton;
  const checkboxTextStyle = isDarkMode ? { ...styles.checkboxText, ...styles.checkboxTextDark } : styles.checkboxText;

  return (
    <LayoutRN>
      <ScrollView style={containerStyle}>
        <TouchableOpacity onPress={() => navigateTo('T1')} style={styles.backButton}>
          <View style={styles.backContent}>
            <ChevronLeftIcon size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={backTextStyle}>Voltar</Text>
          </View>
        </TouchableOpacity>

        <View style={cardStyle}>
          <Text style={titleStyle}>Criar Anúncio</Text>

          <View style={styles.form}>
            {/* Nome do Negócio */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Nome do Negócio *</Label>
              <Input
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={inputStyle}
                placeholder="Ex: Restaurante Sabor Local"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
            </View>

            {/* Categoria */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Categoria *</Label>
              <TouchableOpacity 
                style={categoryButtonStyle}
                onPress={() => setCategoryPickerVisible(!categoryPickerVisible)}
              >
                <Text style={[styles.categoryButtonText, isDarkMode && styles.categoryButtonTextDark]}>
                  {formData.category || 'Selecione uma categoria'}
                </Text>
              </TouchableOpacity>
              {categoryPickerVisible && (
                <View style={[styles.categoryList, isDarkMode && styles.categoryListDark]}>
                  <ScrollView style={styles.categoryScroll}>
                    {CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={styles.categoryItem}
                        onPress={() => {
                          setFormData({ ...formData, category });
                          setCategoryPickerVisible(false);
                        }}
                      >
                        <Text style={[styles.categoryItemText, isDarkMode && styles.categoryItemTextDark]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Localização e CEP */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Localização</Label>
                <Input
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  style={inputStyle}
                  placeholder="Ex: Centro"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>CEP *</Label>
                <Input
                  value={formData.cep}
                  onChangeText={(text) => setFormData({ ...formData, cep: text })}
                  style={inputStyle}
                  placeholder="00000-000"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  maxLength={9}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Rua e Número */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Rua</Label>
                <Input
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                  style={inputStyle}
                  placeholder="Ex: Rua das Flores"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Número</Label>
                <Input
                  value={formData.number}
                  onChangeText={(text) => setFormData({ ...formData, number: text })}
                  style={inputStyle}
                  placeholder="Ex: 123"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
            </View>

            {/* Telefone e WhatsApp */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Telefone *</Label>
                <Input
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  style={inputStyle}
                  placeholder="(11) 98765-4321"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  keyboardType="phone-pad"
                />
                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={contactVisibility.phone}
                    onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, phone: Boolean(v) })}
                  />
                  <Text style={checkboxTextStyle}>Mostrar no anúncio</Text>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>WhatsApp *</Label>
                <Input
                  value={formData.whatsapp}
                  onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                  style={inputStyle}
                  placeholder="5511987654321"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  keyboardType="phone-pad"
                />
                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={contactVisibility.whatsapp}
                    onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, whatsapp: Boolean(v) })}
                  />
                  <Text style={checkboxTextStyle}>Mostrar no anúncio</Text>
                </View>
              </View>
            </View>

            {/* E-mail e Site */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>E-mail</Label>
                <Input
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  style={inputStyle}
                  placeholder="contato@exemplo.com"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={contactVisibility.email}
                    onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, email: Boolean(v) })}
                  />
                  <Text style={checkboxTextStyle}>Mostrar no anúncio</Text>
                </View>
              </View>
              <View style={styles.halfInput}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Label style={labelStyle}>Site</Label>
                  {!permissoes.linksEnabled && (
                    <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '600' }}>
                      ⓘ Nível 2+
                    </Text>
                  )}
                </View>
                <Input
                  value={formData.site}
                  onChangeText={(text) => {
                    if (!permissoes.linksEnabled) {
                      Alert.alert(
                        'Recurso Premium',
                        'Links adicionais estão disponíveis a partir do Nível 2 (R$ 19,99).\n\nFaça upgrade para adicionar seu site!'
                      );
                      return;
                    }
                    setFormData({ ...formData, site: text });
                  }}
                  style={[inputStyle, { opacity: permissoes.linksEnabled ? 1 : 0.5 }]}
                  placeholder="seudominio.com"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  autoCapitalize="none"
                  editable={permissoes.linksEnabled}
                />
                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={contactVisibility.site}
                    onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, site: Boolean(v) })}
                    disabled={!permissoes.linksEnabled}
                  />
                  <Text style={[checkboxTextStyle, { opacity: permissoes.linksEnabled ? 1 : 0.5 }]}>Mostrar no anúncio</Text>
                </View>
              </View>
            </View>

            {/* Redes Sociais */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Instagram</Label>
              <Input
                value={formData.instagram}
                onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                style={inputStyle}
                placeholder="instagram.com/seu_perfil"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="none"
              />
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={contactVisibility.instagram}
                  onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, instagram: Boolean(v) })}
                />
                <Text style={checkboxTextStyle}>Mostrar Instagram no anúncio</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Label style={labelStyle}>Facebook</Label>
                {!permissoes.linksEnabled && (
                  <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '600' }}>
                    ⓘ Nível 2+
                  </Text>
                )}
              </View>
              <Input
                value={formData.facebook}
                onChangeText={(text) => {
                  if (!permissoes.linksEnabled) {
                    Alert.alert(
                      'Recurso Premium',
                      'Links adicionais estão disponíveis a partir do Nível 2 (R$ 19,99).'
                    );
                    return;
                  }
                  setFormData({ ...formData, facebook: text });
                }}
                style={[inputStyle, { opacity: permissoes.linksEnabled ? 1 : 0.5 }]}
                placeholder="facebook.com/sua_pagina"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="none"
                editable={permissoes.linksEnabled}
              />
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={contactVisibility.facebook}
                  onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, facebook: Boolean(v) })}
                  disabled={!permissoes.linksEnabled}
                />
                <Text style={[checkboxTextStyle, { opacity: permissoes.linksEnabled ? 1 : 0.5 }]}>Mostrar Facebook no anúncio</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Label style={labelStyle}>Pinterest</Label>
                {!permissoes.linksEnabled && (
                  <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '600' }}>
                    ⓘ Nível 2+
                  </Text>
                )}
              </View>
              <Input
                value={formData.pinterest}
                onChangeText={(text) => {
                  if (!permissoes.linksEnabled) {
                    Alert.alert(
                      'Recurso Premium',
                      'Links adicionais estão disponíveis a partir do Nível 2 (R$ 19,99).'
                    );
                    return;
                  }
                  setFormData({ ...formData, pinterest: text });
                }}
                style={[inputStyle, { opacity: permissoes.linksEnabled ? 1 : 0.5 }]}
                placeholder="pinterest.com/seu_perfil"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="none"
                editable={permissoes.linksEnabled}
              />
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={contactVisibility.pinterest}
                  onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, pinterest: Boolean(v) })}
                  disabled={!permissoes.linksEnabled}
                />
                <Text style={[checkboxTextStyle, { opacity: permissoes.linksEnabled ? 1 : 0.5 }]}>Mostrar Pinterest no anúncio</Text>
              </View>
            </View>

            {/* Tag Entrega Rápida */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Entrega Rápida na Região</Label>
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={formData.entregaRapida}
                  onCheckedChange={(v) => setFormData({ ...formData, entregaRapida: Boolean(v) })}
                />
                <Text style={checkboxTextStyle}>Meu negócio oferece entrega rápida na região</Text>
              </View>
            </View>

            {/* Tag Imperdível (somente níveis 3 e 4) */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Label style={labelStyle}>Destaque "Imperdível"</Label>
                {!permissoes.isImperdivelEnabled && (
                  <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '600' }}>
                    ⓘ Disponível a partir do Nível 3
                  </Text>
                )}
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={formData.isImperdivel}
                  onCheckedChange={(v) => {
                    if (!permissoes.isImperdivelEnabled) {
                      Alert.alert(
                        'Recurso Premium',
                        'O destaque "Imperdível" está disponível a partir do Nível 3 (R$ 29,99).\n\nFaça upgrade para destacar seu negócio!',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    setFormData({ ...formData, isImperdivel: Boolean(v) });
                  }}
                  disabled={!permissoes.isImperdivelEnabled}
                  style={{ opacity: permissoes.isImperdivelEnabled ? 1 : 0.4 }}
                />
                <Text style={[checkboxTextStyle, { opacity: permissoes.isImperdivelEnabled ? 1 : 0.4 }]}>
                  Marcar como "Imperdível" (maior visibilidade)
                </Text>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Descrição *</Label>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                style={textareaStyle}
                placeholder="Descreva seu negócio... (máx. 500 caracteres)"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, isDarkMode && styles.charCountDark]}>
                {formData.description.length}/500
              </Text>
            </View>

            {/* Botão Salvar */}
            <Button onPress={handleSubmit} style={styles.submitButton}>
              <View style={styles.buttonContent}>
                <CheckIcon size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Salvar e Publicar</Text>
              </View>
            </Button>
          </View>
        </View>
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
    marginLeft: 4,
  },
  backTextDark: {
    color: '#60A5FA',
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  cardDark: {
    backgroundColor: '#111827',
    borderColor: '#1e40af',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 20,
  },
  titleDark: {
    color: '#60A5FA',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  labelDark: {
    color: '#D1D5DB',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 6,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputDark: {
    backgroundColor: '#1F2937',
    borderColor: '#1D4ED8',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 6,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  categoryButtonDark: {
    backgroundColor: '#1F2937',
    borderColor: '#1D4ED8',
  },
  categoryButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  categoryButtonTextDark: {
    color: '#FFFFFF',
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 200,
  },
  categoryListDark: {
    backgroundColor: '#1F2937',
    borderColor: '#1D4ED8',
  },
  categoryScroll: {
    maxHeight: 200,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryItemText: {
    color: '#374151',
    fontSize: 14,
  },
  categoryItemTextDark: {
    color: '#D1D5DB',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 6,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textareaDark: {
    backgroundColor: '#1F2937',
    borderColor: '#1D4ED8',
    color: '#FFFFFF',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  charCountDark: {
    color: '#9CA3AF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkboxText: {
    fontSize: 12,
    color: '#374151',
  },
  checkboxTextDark: {
    color: '#D1D5DB',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
