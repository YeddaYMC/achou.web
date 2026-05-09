import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { Check, ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAppContext } from '../context/AppContext';
import app from '../firebaseConfig';
import { createAnuncio, updateAnuncio } from '../src/services/anuncioService';
import { deleteCloudinaryImagesByUrls, uploadMultipleImages } from '../src/services/cloudinaryService';
import { geocodeBusinessAddress } from '../src/services/geocodingService';

const auth = getAuth(app);

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
  const { navigateTo, businesses, setBusinesses, userProfile, isDarkMode, selectedBusiness, setSelectedBusiness } = useAppContext();
  const resolveFirestoreId = (business: any): string | null => {
    if (!business) return null;
    if (typeof business.firestoreId === 'string' && business.firestoreId) return business.firestoreId;
    if (typeof business.id === 'string' && business.id) return business.id;
    return null;
  };

  const [editingFirestoreId, setEditingFirestoreId] = useState<string | null>(null);
  const isEditing = Boolean(editingFirestoreId);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
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
    fotos: [] as string[], // URLs do Cloudinary
  });

  const [contactVisibility, setContactVisibility] = useState({
    phone: false,
    whatsapp: true,
    email: false,
    site: false,
    instagram: false,
    facebook: false,
    pinterest: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  const [geoFeedback, setGeoFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [hasPublishedSuccessfully, setHasPublishedSuccessfully] = useState(false);
  const lastCepLookup = useRef('');

  // Reset do estado de publicação quando entra na tela sem selectedBusiness (novo anúncio)
  useEffect(() => {
    if (!selectedBusiness) {
      setHasPublishedSuccessfully(false);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (!selectedBusiness) return;

    const resolvedEditingId = resolveFirestoreId(selectedBusiness);
    if (resolvedEditingId) {
      setEditingFirestoreId(resolvedEditingId);
    }

    const category = selectedBusiness.category || selectedBusiness.categories?.[0] || '';
    const existingFotos = Array.isArray((selectedBusiness as any).fotos)
      ? (selectedBusiness as any).fotos.filter(Boolean)
      : (selectedBusiness.image ? [selectedBusiness.image] : []);

    setFormData((prev) => ({
      ...prev,
      name: selectedBusiness.name || '',
      category,
      location: selectedBusiness.location || '',
      cep: selectedBusiness.cep || '',
      street: selectedBusiness.street || '',
      neighborhood: selectedBusiness.neighborhood || '',
      city: selectedBusiness.city || '',
      state: selectedBusiness.state || '',
      number: selectedBusiness.number || '',
      phone: selectedBusiness.phone || '',
      whatsapp: selectedBusiness.whatsapp || '',
      email: (selectedBusiness as any).email || '',
      site: (selectedBusiness as any).site || '',
      instagram: selectedBusiness.instagram || '',
      facebook: selectedBusiness.facebook || '',
      pinterest: selectedBusiness.pinterest || '',
      description: selectedBusiness.description || '',
      entregaRapida: Boolean(selectedBusiness.entregaRapida),
      isImperdivel: Boolean((selectedBusiness as any).isImperdivel),
      fotos: existingFotos,
    }));

    setExistingImageUrls(existingFotos);

    if (selectedBusiness.contactVisibility) {
      setContactVisibility((prev) => ({
        ...prev,
        ...selectedBusiness.contactVisibility,
      }));
    }
  }, [selectedBusiness]);


  const ChevronLeftIcon: any = ChevronLeft;
  const CheckIcon: any = Check;

  // Modo de teste: sem travas de upgrade, com limite fixo de 1 imagem por anúncio
  const permissoes = {
    maxFotos: 1,
    isImperdivelEnabled: true,
    linksEnabled: true,
  };

  const normalizeUrl = (u: string) => {
    if (!u) return '';
    return u.startsWith('http://') || u.startsWith('https://') ? u : 'https://' + u;
  };

  const toUpperSafe = (value: string) => (value || '').toUpperCase();
  const onlyDigits = (value: string) => (value || '').replace(/\D/g, '');
  const formatCep = (value: string) => {
    const digits = onlyDigits(value).slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const normalizeAddressPayload = (data: any) => {
    const street = toUpperSafe(data?.logradouro || data?.street || '');
    const neighborhood = toUpperSafe(data?.bairro || data?.neighborhood || '');
    const city = toUpperSafe(data?.localidade || data?.city || '');
    const state = toUpperSafe(data?.uf || data?.state || '');

    return { street, neighborhood, city, state };
  };

  const fetchAddressByCep = async (cepDigits: string) => {
    if (cepDigits.length !== 8) return;
    if (lastCepLookup.current === cepDigits) return;

    setIsCepLoading(true);
    try {
      let data: any = null;

      // Primeira tentativa: ViaCEP
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const viaCepData = await response.json();
        if (!viaCepData?.erro) {
          data = viaCepData;
        }
      } catch {
        // Continua para fallback
      }

      // Fallback: BrasilAPI (mais estavel em alguns ambientes mobile)
      if (!data) {
        const fallbackResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepDigits}`);
        if (fallbackResponse.ok) {
          data = await fallbackResponse.json();
        }
      }

      if (!data) {
        Alert.alert('CEP não encontrado', 'Confira o CEP informado e tente novamente.');
        return;
      }

      const resolved = normalizeAddressPayload(data);
      const locationParts = [resolved.neighborhood, resolved.city, resolved.state].filter(Boolean);
      const location = locationParts.join(' - ');

      lastCepLookup.current = cepDigits;
      setFormData((prev) => ({
        ...prev,
        street: resolved.street || prev.street,
        neighborhood: resolved.neighborhood || prev.neighborhood,
        city: resolved.city || prev.city,
        state: resolved.state || prev.state,
        location: location || prev.location,
      }));
    } catch (error) {
      Alert.alert('Erro ao buscar CEP', 'Não foi possível consultar o CEP no momento.');
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setFormData((prev) => ({ ...prev, cep: formatted }));
    setGeoFeedback(null);

    const cepDigits = onlyDigits(formatted);
    if (cepDigits.length === 8) {
      fetchAddressByCep(cepDigits);
    } else {
      lastCepLookup.current = '';
    }
  };

  // Modo de teste: sem obrigatoriedade de campos, somente validação de imagem
  const validarFormulario = () => {
    const cepDigits = onlyDigits(formData.cep);
    const quantidadeFinalImagens = selectedImages.length > 0 ? selectedImages.length : existingImageUrls.length;

    if (cepDigits.length > 0 && cepDigits.length !== 8) {
      setErrosValidacao(['CEP deve estar no formato 00000-000']);
      Alert.alert(
        '⚠️ CEP inválido',
        'Use o formato 00000-000 para salvar o anúncio.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (quantidadeFinalImagens !== 1) {
      setErrosValidacao(['Selecione exatamente 1 imagem']);
      console.log('❌ Quantidade de imagens inválida:', quantidadeFinalImagens);

      Alert.alert(
        '⚠️ Imagem obrigatória',
        'Para este teste, selecione exatamente 1 imagem por anúncio.',
        [{ text: 'OK, vou selecionar' }]
      );
      return false;
    }

    setErrosValidacao([]);
    return true;
  };

  const applyPickedImage = (uris: string[]) => {
    const maxFotos = permissoes.maxFotos;
    if (uris.length > maxFotos) {
      Alert.alert('Limite de Fotos', `Você pode selecionar no máximo ${maxFotos} foto por anúncio.`);
      return;
    }

    setSelectedImages(uris);
    Alert.alert('Sucesso', `${uris.length} imagem(ns) selecionada(s)`);
  };

  const pickFromGallery = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão Necessária', 'Você precisa permitir acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      applyPickedImage(
        result.assets.map((asset) =>
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
        )
      );
    }
  };

  const pickFromCamera = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão Necessária', 'Você precisa permitir acesso à câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      cameraType: ImagePicker.CameraType.back,
      base64: true,
    });

    if (!result.canceled) {
      applyPickedImage(
        result.assets.map((asset) =>
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
        )
      );
    }
  };

  // Selecionar imagem com escolha entre câmera e galeria
  const handleSelectImages = async () => {
    Alert.alert('Selecionar foto', 'Escolha a origem da imagem:', [
      { text: 'Câmera', onPress: () => { void pickFromCamera(); } },
      { text: 'Galeria', onPress: () => { void pickFromGallery(); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // Upload e Salvamento
  const handleSubmit = async () => {
    if (hasPublishedSuccessfully && !isEditing) {
      Alert.alert(
        'Anúncio já publicado',
        'Esse anúncio já foi salvo e publicado nesta tela. Volte ao painel para criar outro.'
      );
      return;
    }

    console.log(`🚀 Iniciando ${isEditing ? 'edição' : 'publicação'} do anúncio...`);
    setGeoFeedback(null);
    
    // Validação de teste
    if (!validarFormulario()) {
      console.log('⚠️ Validação falhou');
      return;
    }

    console.log('✓ Validação OK - iniciando upload...');
    setIsLoading(true);

    try {
      const oldImageUrls = [...existingImageUrls];
      let fotosUrls: string[] = existingImageUrls;

      // Upload apenas quando usuário selecionar nova imagem
      if (selectedImages.length > 0) {
        console.log(`📸 Fazendo upload de ${selectedImages.length} imagem(ns)...`);
        try {
          fotosUrls = await uploadMultipleImages(
            selectedImages,
            formData.name,
            `${userProfile?.email}_${Date.now()}` // Usar email + timestamp como ID único
          );
        } catch (uploadError) {
          console.error('❌ Falha no upload Cloudinary:', uploadError);
          throw new Error('Falha no upload das imagens. Verifique internet e tente novamente.');
        }
        console.log('✓ Upload completo! URLs:', fotosUrls);
      }

      const normalizedForm = {
        ...formData,
        cep: formatCep(formData.cep),
        site: normalizeUrl(formData.site),
        instagram: normalizeUrl(formData.instagram),
        facebook: normalizeUrl(formData.facebook),
        pinterest: normalizeUrl(formData.pinterest),
        fotos: fotosUrls,
      };

      // Resolve coordenadas por CEP/endereco para habilitar georreferenciamento.
      const existingLat = typeof (selectedBusiness as any)?.lat === 'number' ? (selectedBusiness as any).lat : null;
      const existingLon = typeof (selectedBusiness as any)?.lon === 'number' ? (selectedBusiness as any).lon : null;
      const existingOrigemGeo = (selectedBusiness as any)?.origemGeo || null;

      let lat: number | null = isEditing ? existingLat : null;
      let lon: number | null = isEditing ? existingLon : null;
      let origemGeo: 'gps' | 'cep' | 'endereco' | null = isEditing ? existingOrigemGeo : null;
      let geocodeResolved = false;

      const hasGeoInput = Boolean(
        onlyDigits(normalizedForm.cep).length === 8 ||
        normalizedForm.street ||
        normalizedForm.neighborhood ||
        normalizedForm.city ||
        normalizedForm.state
      );

      if (hasGeoInput) {
        try {
          const geo = await geocodeBusinessAddress({
            cep: normalizedForm.cep,
            street: normalizedForm.street,
            number: normalizedForm.number,
            neighborhood: normalizedForm.neighborhood,
            city: normalizedForm.city,
            state: normalizedForm.state,
            country: 'Brasil',
          });

          if (geo) {
            lat = geo.lat;
            lon = geo.lon;
            origemGeo = geo.source;
            geocodeResolved = true;
          }
        } catch (geoError) {
          console.warn('Falha na geocodificacao do anuncio:', geoError);
        }

        if (geocodeResolved) {
          setGeoFeedback({
            type: 'success',
            message: 'Coordenadas atualizadas com sucesso para este anúncio.',
          });
        } else if (lat == null || lon == null) {
          setGeoFeedback({
            type: 'warning',
            message: 'Não foi possível obter coordenadas agora. O anúncio foi salvo sem lat/lon; revise CEP/endereço e tente novamente.',
          });
        } else {
          setGeoFeedback({
            type: 'warning',
            message: 'Não foi possível recalcular as coordenadas agora. O anúncio foi salvo com as coordenadas anteriores.',
          });
        }
      }

      // Salvar no Firestore - coleção "anuncios"
      console.log('💾 Salvando anúncio no Firestore...');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      let anuncioId = '';
      try {
        if (isEditing && editingFirestoreId) {
          await updateAnuncio(editingFirestoreId, {
            name: normalizedForm.name,
            category: normalizedForm.category,
            location: normalizedForm.location,
            cep: normalizedForm.cep,
            street: normalizedForm.street,
            neighborhood: normalizedForm.neighborhood,
            city: normalizedForm.city,
            state: normalizedForm.state,
            number: normalizedForm.number,
            lat,
            lon,
            origemGeo,
            phone: normalizedForm.phone,
            whatsapp: normalizedForm.whatsapp,
            email: normalizedForm.email,
            site: normalizedForm.site,
            instagram: normalizedForm.instagram,
            facebook: normalizedForm.facebook,
            pinterest: normalizedForm.pinterest,
            description: normalizedForm.description,
            fotos: fotosUrls,
            entregaRapida: normalizedForm.entregaRapida,
            isImperdivel: normalizedForm.isImperdivel,
            contactVisibility,
            status: 'active',
            reportCount: 0,
            anuncianteLevel: userProfile?.anuncianteLevel || 1,
          } as any);
          anuncioId = editingFirestoreId;
        } else {
          anuncioId = await createAnuncio({
            businessId: `${userProfile?.email}_${Date.now()}`, // Link ao negócio
            userId: currentUser.uid, // UID do Firebase Auth (não email!)
            userEmail: userProfile?.email || '',
            name: normalizedForm.name,
            category: normalizedForm.category,
            location: normalizedForm.location,
            cep: normalizedForm.cep,
            street: normalizedForm.street,
            neighborhood: normalizedForm.neighborhood,
            city: normalizedForm.city,
            state: normalizedForm.state,
            number: normalizedForm.number,
            lat,
            lon,
            origemGeo,
            phone: normalizedForm.phone,
            whatsapp: normalizedForm.whatsapp,
            email: normalizedForm.email,
            site: normalizedForm.site,
            instagram: normalizedForm.instagram,
            facebook: normalizedForm.facebook,
            pinterest: normalizedForm.pinterest,
            description: normalizedForm.description,
            fotos: fotosUrls,
            entregaRapida: normalizedForm.entregaRapida,
            isImperdivel: normalizedForm.isImperdivel,
            contactVisibility,
            status: 'active',
            reportCount: 0,
            anuncianteLevel: userProfile?.anuncianteLevel || 1,
          });
        }
      } catch (firestoreError) {
        console.error('❌ Falha ao salvar no Firestore:', firestoreError);
        throw new Error('Falha ao salvar no banco. Verifique regras/firestore e tente novamente.');
      }

      const existingBusinessRecord = businesses.find((b: any) => resolveFirestoreId(b) === anuncioId) || selectedBusiness || {};

      const mergedBusiness: any = {
        ...(existingBusinessRecord || {}),
        ...normalizedForm,
        id: (existingBusinessRecord as any)?.id ?? anuncioId,
        firestoreId: resolveFirestoreId(existingBusinessRecord) ?? anuncioId,
        categories: [normalizedForm.category],
        image: fotosUrls?.[0] || (existingBusinessRecord as any)?.image || null,
        fotos: fotosUrls,
        lat,
        lon,
        origemGeo,
        contactVisibility,
        owner: userProfile?.email || (existingBusinessRecord as any)?.owner || null,
        ownerId: currentUser.uid,
        updatedAt: new Date().toISOString(),
        status: 'active',
        reportCount: 0,
      };

      if (isEditing) {
        setBusinesses(
          businesses.map((b: any) =>
            resolveFirestoreId(b) === anuncioId
              ? { ...b, ...mergedBusiness, id: b.id, firestoreId: anuncioId }
              : b
          )
        );

        // Se uma nova imagem foi enviada, remove a antiga do Cloudinary para evitar consumo desnecessário.
        if (selectedImages.length > 0 && oldImageUrls.length > 0) {
          const cleanupResult = await deleteCloudinaryImagesByUrls(oldImageUrls);
          if (!cleanupResult.success) {
            console.warn('Falha ao limpar imagens antigas no Cloudinary:', cleanupResult.error);
          }
        }
      } else {
        setBusinesses([...businesses, mergedBusiness]);
        // Marca como publicado com sucesso apenas para criação (não para edição)
        setHasPublishedSuccessfully(true);
      }
      
      setIsLoading(false);
      setErrosValidacao([]); // Limpa erros de validação
      setEditingFirestoreId(null);
      setSelectedBusiness(null);
      
      console.log(`✅ Anúncio ${isEditing ? 'atualizado' : 'criado'} com sucesso! ID:`, anuncioId);
      
      // Mostrar alerta de sucesso com navegação explícita (sem redirecionamento automático)
      Alert.alert(
        isEditing ? '✅ Anúncio Atualizado com Sucesso!' : '✅ Anúncio Publicado com Sucesso!',
        isEditing
          ? `Seu anúncio "${normalizedForm.name}" foi atualizado com sucesso.`
          : `Seu anúncio "${normalizedForm.name}" foi criado e está ativo.`,
        [
          {
            text: 'Ir para Painel',
            onPress: () => {
              setHasPublishedSuccessfully(false);
              console.log('Navegando para Painel de Gestão...');
              navigateTo('T7');
            }
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      setIsLoading(false);
      console.error(`❌ Erro ao ${isEditing ? 'atualizar' : 'criar'} anúncio:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      Alert.alert(
        isEditing ? '❌ Erro ao Atualizar' : '❌ Erro ao Publicar',
        isEditing
          ? `Não foi possível atualizar seu anúncio.\n\nDetalhes: ${errorMessage}\n\nTente novamente.`
          : `Não foi possível publicar seu anúncio.\n\nDetalhes: ${errorMessage}\n\nTente novamente.`,
        [{ text: 'OK' }]
      );
    }
  };

  const containerStyle = isDarkMode ? { ...styles.container, ...styles.containerDark } : styles.container;
  const cardStyle = isDarkMode ? { ...styles.card, ...styles.cardDark } : styles.card;
  const titleStyle = isDarkMode ? { ...styles.title, ...styles.titleDark } : styles.title;
  const labelStyle = isDarkMode ? { ...styles.label, ...styles.labelDark } : styles.label;
  const inputStyle = isDarkMode ? { ...styles.input, ...styles.inputDark } : styles.input;
  const textareaStyle = isDarkMode ? { ...styles.textarea, ...styles.textareaDark } : styles.textarea;
  const backTextStyle = isDarkMode ? { ...styles.backText, ...styles.backTextDark } : styles.backText;
  const categoryButtonStyle = isDarkMode ? { ...styles.categoryButton, ...styles.categoryButtonDark } : styles.categoryButton;
  const categoryValueStyle = isDarkMode ? styles.categoryButtonTextDark : styles.categoryButtonText;
  const checkboxTextStyle = isDarkMode ? { ...styles.checkboxText, ...styles.checkboxTextDark } : styles.checkboxText;
  const checkboxStyle = isDarkMode ? { borderColor: '#60A5FA' } : { borderColor: '#1e3a8a' };
  const helperTextColor = isDarkMode ? '#D1D5DB' : '#6B7280';

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
          <Text style={titleStyle}>{isEditing ? 'Editar Anúncio' : 'Criar Anúncio'}</Text>

          <View style={styles.form}>
            {/* Nome do Negócio */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Nome do Negócio</Label>
              <Input
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: toUpperSafe(text) })}
                style={inputStyle}
                placeholder="Ex: Restaurante Sabor Local"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
            </View>

            {/* Categoria */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(category) => setFormData((prev) => ({ ...prev, category }))}
              >
                <SelectTrigger style={categoryButtonStyle}>
                  <SelectValue placeholder="Selecione uma categoria" style={categoryValueStyle} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>

            {/* CEP e UF */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>CEP</Label>
                <Input
                  value={formData.cep}
                  onChangeText={handleCepChange}
                  onBlur={() => {
                    const cepDigits = onlyDigits(formData.cep);
                    if (cepDigits.length === 8) {
                      fetchAddressByCep(cepDigits);
                    }
                  }}
                  style={inputStyle}
                  placeholder="00000-000"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  maxLength={9}
                  keyboardType="numeric"
                />
                {isCepLoading ? (
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#9CA3AF' : '#6B7280', marginTop: 6 }}>
                    Buscando endereco pelo CEP...
                  </Text>
                ) : null}
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>UF</Label>
                <Input
                  value={formData.state}
                  onChangeText={(text) => {
                    setGeoFeedback(null);
                    setFormData({ ...formData, state: toUpperSafe(text).slice(0, 2) });
                  }}
                  style={inputStyle}
                  placeholder="PR"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {geoFeedback && (
              <View style={geoFeedback.type === 'success' ? styles.geoSuccessBox : styles.geoWarningBox}>
                <Text style={geoFeedback.type === 'success' ? styles.geoSuccessText : styles.geoWarningText}>
                  {geoFeedback.type === 'success' ? '✅ ' : '⚠️ '}
                  {geoFeedback.message}
                </Text>
              </View>
            )}

            {/* Rua e Número */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Rua</Label>
                <Input
                  value={formData.street}
                  onChangeText={(text) => {
                    setGeoFeedback(null);
                    setFormData({ ...formData, street: toUpperSafe(text) });
                  }}
                  style={inputStyle}
                  placeholder="Ex: Rua das Flores"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Número</Label>
                <Input
                  value={formData.number}
                  onChangeText={(text) => {
                    setGeoFeedback(null);
                    setFormData({ ...formData, number: text });
                  }}
                  style={inputStyle}
                  placeholder="Ex: 123"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
            </View>

            {/* Bairro, Cidade e Estado */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChangeText={(text) => {
                    setGeoFeedback(null);
                    setFormData({ ...formData, neighborhood: toUpperSafe(text) });
                  }}
                  style={inputStyle}
                  placeholder="Ex: CENTRO"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Cidade</Label>
                <Input
                  value={formData.city}
                  onChangeText={(text) => {
                    setGeoFeedback(null);
                    setFormData({ ...formData, city: toUpperSafe(text) });
                  }}
                  style={inputStyle}
                  placeholder="Ex: PINHAIS"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
              </View>
            </View>

            {/* Telefone e WhatsApp */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Telefone</Label>
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
                    style={checkboxStyle}
                  />
                  <Text style={checkboxTextStyle}>Mostrar no anúncio</Text>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>WhatsApp</Label>
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
                    style={checkboxStyle}
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
                    style={checkboxStyle}
                  />
                  <Text style={checkboxTextStyle}>Mostrar no anúncio</Text>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Label style={labelStyle}>Site</Label>
                <Input
                  value={formData.site}
                  onChangeText={(text) => setFormData({ ...formData, site: text })}
                  style={inputStyle}
                  placeholder="seudominio.com"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  autoCapitalize="none"
                />
                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={contactVisibility.site}
                    onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, site: Boolean(v) })}
                    style={checkboxStyle}
                  />
                  <Text style={checkboxTextStyle}>Mostrar no anúncio</Text>
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
                  style={checkboxStyle}
                />
                <Text style={checkboxTextStyle}>Mostrar Instagram no anúncio</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Facebook</Label>
              <Input
                value={formData.facebook}
                onChangeText={(text) => setFormData({ ...formData, facebook: text })}
                style={inputStyle}
                placeholder="facebook.com/sua_pagina"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="none"
              />
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={contactVisibility.facebook}
                  onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, facebook: Boolean(v) })}
                  style={checkboxStyle}
                />
                <Text style={checkboxTextStyle}>Mostrar Facebook no anúncio</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Pinterest</Label>
              <Input
                value={formData.pinterest}
                onChangeText={(text) => setFormData({ ...formData, pinterest: text })}
                style={inputStyle}
                placeholder="pinterest.com/seu_perfil"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="none"
              />
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={contactVisibility.pinterest}
                  onCheckedChange={(v) => setContactVisibility({ ...contactVisibility, pinterest: Boolean(v) })}
                  style={checkboxStyle}
                />
                <Text style={checkboxTextStyle}>Mostrar Pinterest no anúncio</Text>
              </View>
            </View>

            {/* Seleção de Imagens */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Fotos do Anúncio *</Label>
              <Text style={{ fontSize: 12, color: helperTextColor, marginBottom: 8 }}>
                {isEditing
                  ? 'Mantenha a foto atual ou selecione uma nova imagem'
                  : `Máximo de ${permissoes.maxFotos} foto por anúncio (modo teste)`}
              </Text>
              
              <TouchableOpacity
                onPress={handleSelectImages}
                disabled={isLoading}
                style={[
                  styles.imageButton,
                  {
                    backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                    opacity: isLoading ? 0.6 : 1,
                  }
                ]}
              >
                <Text style={{ fontSize: 24, marginBottom: 8 }}>📷</Text>
                <Text style={[labelStyle, { textAlign: 'center' }]}>
                  {selectedImages.length > 0
                    ? `${selectedImages.length} imagem(ns) selecionada(s)`
                    : existingImageUrls.length > 0
                      ? 'Usando imagem atual do anúncio'
                      : 'Toque para selecionar imagens'}
                </Text>
              </TouchableOpacity>

              {isEditing && existingImageUrls.length > 0 && (
                <View style={styles.editImageActions}>
                  <Button onPress={handleSelectImages} variant="outline" style={styles.editImageButtonOutline} disabled={isLoading}>
                    <Text style={styles.editImageButtonOutlineText}>Trocar foto</Text>
                  </Button>
                  <Button
                    onPress={() => setSelectedImages([])}
                    style={styles.editImageButtonPrimary}
                    disabled={isLoading}
                  >
                    <Text style={styles.editImageButtonPrimaryText}>Manter foto atual</Text>
                  </Button>
                </View>
              )}

              {/* Preview das imagens selecionadas */}
              {(selectedImages.length > 0 || existingImageUrls.length > 0) && (
                <View style={styles.imagePreviewContainer}>
                  {(selectedImages.length > 0 ? selectedImages : existingImageUrls).map((uri, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <Image 
                        source={{ uri }} 
                        style={{ width: 80, height: 80, borderRadius: 8 }} 
                        resizeMode="cover"
                      />
                      <Text style={{ fontSize: 10, color: helperTextColor, marginTop: 4 }}>
                        {existingImageUrls.length > 0 && selectedImages.length === 0 ? 'Foto atual' : `Foto ${index + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
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

            {/* Tag Imperdível */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Destaque "Imperdível"</Label>
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={formData.isImperdivel}
                  onCheckedChange={(v) => setFormData({ ...formData, isImperdivel: Boolean(v) })}
                />
                <Text style={checkboxTextStyle}>
                  Marcar como "Imperdível" (maior visibilidade)
                </Text>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Label style={labelStyle}>Descrição</Label>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: toUpperSafe(text) })}
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

            {/* Caixa de Erros de Validação */}
            {errosValidacao.length > 0 && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ Atenção!</Text>
                <Text style={styles.errorSubtitle}>
                  Ajuste os itens abaixo antes de publicar:
                </Text>
                {errosValidacao.map((erro, index) => (
                  <Text key={index} style={styles.errorItem}>
                    • {erro}
                  </Text>
                ))}
              </View>
            )}

            {/* Botão Salvar */}
            <Button 
              onPress={handleSubmit}
              style={StyleSheet.flatten([styles.submitButton, { opacity: isLoading || (hasPublishedSuccessfully && !isEditing) ? 0.5 : 1 }])}
              disabled={isLoading || (hasPublishedSuccessfully && !isEditing)}
            >
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                      Publicando...
                    </Text>
                  </>
                ) : hasPublishedSuccessfully && !isEditing ? (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Já Publicado</Text>
                  </>
                ) : (
                  <>
                    <CheckIcon size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>{isEditing ? 'Salvar Alterações' : 'Salvar e Publicar'}</Text>
                  </>
                )}
              </View>
            </Button>

            <Button
              onPress={() => navigateTo('T1')}
              variant="outline"
              style={styles.cancelButton}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, isDarkMode && styles.cancelButtonTextDark]}>Cancelar</Text>
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
  cancelButton: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  cancelButtonText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  cancelButtonTextDark: {
    color: '#60A5FA',
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  imagePreview: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editImageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editImageButtonOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  editImageButtonOutlineText: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  editImageButtonPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    minHeight: 44,
  },
  editImageButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 12,
    fontWeight: '600',
  },
  errorItem: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 4,
    paddingLeft: 8,
  },
  geoWarningBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  geoWarningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  geoSuccessBox: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  geoSuccessText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
});
