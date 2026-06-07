import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin, Menu, Moon, Shield, Sun, User, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import logoAchou from '../assets/images/LOGO-ACHOU.png';
import { useAppContext } from '../context/AppContext';
import { geocodeBusinessAddress } from '../src/services/geocodingService';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from './ui/sonner';

const MIN_RADIUS_KM = 0.5;
const MAX_RADIUS_KM = 8;
const DEFAULT_RADIUS_KM = 1;
const STEP_KM = 0.5; 

type LocationMode = 'profile' | 'custom' | 'cep';

const buildProfileAddressPayload = (userProfile: any, locationSettings: any) => ({
  cep: userProfile?.cep || locationSettings?.cep || '',
  street: userProfile?.street || locationSettings?.street || '',
  number: userProfile?.number || locationSettings?.number || '',
  neighborhood: userProfile?.neighborhood || locationSettings?.neighborhood || '',
  city: userProfile?.city || locationSettings?.city || '',
  state: userProfile?.state || locationSettings?.state || '',
});

function LocationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { locationSettings, setLocationSettings, isDarkMode, userProfile } = useAppContext();
  const { height } = useWindowDimensions();

  const normalizeMode = (mode: string | undefined): LocationMode => {
    if (mode === 'profile' || mode === 'custom' || mode === 'cep') return mode;
    if (mode === 'address') return 'custom';
    return 'profile';
  };

  const buildInitialDraft = () => ({
    radiusKm: DEFAULT_RADIUS_KM,
    ...locationSettings,
    mode: normalizeMode(locationSettings?.mode),
    ...buildProfileAddressPayload(userProfile, locationSettings),
  });

  const [draft, setDraft] = useState(buildInitialDraft());

  React.useEffect(() => {
    setDraft(buildInitialDraft());
  }, [locationSettings, open, userProfile]);

  const isProfileMode = draft.mode === 'profile';
  const isCustomMode = draft.mode === 'custom';
  const isCepMode = draft.mode === 'cep';

  const profileAddressPayload = buildProfileAddressPayload(userProfile, locationSettings);

  const save = async () => {
    const nextSettings: any = {
      ...locationSettings,
      ...draft,
      radiusKm: draft?.radiusKm || locationSettings?.radiusKm || DEFAULT_RADIUS_KM,
    };

    if (nextSettings.mode === 'profile') {
      const addressPayload = profileAddressPayload;

      nextSettings.cep = addressPayload.cep;
      nextSettings.street = addressPayload.street;
      nextSettings.number = addressPayload.number;
      nextSettings.neighborhood = addressPayload.neighborhood;
      nextSettings.city = addressPayload.city;
      nextSettings.state = addressPayload.state;

      const hasProfileAddress = Boolean(
        addressPayload.cep ||
          addressPayload.street ||
          addressPayload.number ||
          addressPayload.neighborhood ||
          addressPayload.city ||
          addressPayload.state
      );

      if (hasProfileAddress) {
        try {
          const geo = await geocodeBusinessAddress({
            ...addressPayload,
            country: 'Brasil',
          });
          if (geo) {
            nextSettings.coords = { lat: geo.lat, lon: geo.lon };
            nextSettings.geoSource = geo.source;
          }
        } catch {
          // Mantém configuração
        }
      } else if (!nextSettings?.coords) {
        toast.error('Seu perfil ainda não tem endereço cadastrado.');
        return;
      }
    } else if (nextSettings.mode === 'custom') {
      const addressPayload = {
        cep: draft?.cep || userProfile?.cep || locationSettings?.cep || '',
        street: draft?.street || '',
        number: draft?.number || '',
        neighborhood: draft?.neighborhood || '',
        city: draft?.city || '',
        state: draft?.state || '',
      };

      nextSettings.cep = addressPayload.cep;
      nextSettings.street = addressPayload.street;
      nextSettings.number = addressPayload.number;
      nextSettings.neighborhood = addressPayload.neighborhood;
      nextSettings.city = addressPayload.city;
      nextSettings.state = addressPayload.state;

      const hasAddress = Boolean(
        addressPayload.cep ||
          addressPayload.street ||
          addressPayload.number ||
          addressPayload.neighborhood ||
          addressPayload.city ||
          addressPayload.state
      );

      if (hasAddress) {
        try {
          const geo = await geocodeBusinessAddress({
            ...addressPayload,
            country: 'Brasil',
          });
          if (geo) {
            nextSettings.coords = { lat: geo.lat, lon: geo.lon };
            nextSettings.geoSource = geo.source;
          }
        } catch {
          // Mantém configuração
        }
      } else if (!nextSettings?.coords) {
        toast.error('Informe um endereço ou CEP para definir sua localização.');
        return;
      }
    } else if (nextSettings.mode === 'cep') {
      const cepToUse = String(draft?.cep || userProfile?.cep || locationSettings?.cep || '').trim();
      nextSettings.cep = cepToUse;

      if (cepToUse) {
        try {
          const geo = await geocodeBusinessAddress({ cep: cepToUse, country: 'Brasil' });
          if (geo) {
            nextSettings.coords = { lat: geo.lat, lon: geo.lon };
            nextSettings.geoSource = geo.source;
          }
        } catch {
          // Mantém configuração
        }
      } else if (!nextSettings?.coords) {
        toast.error('Informe um endereço ou CEP para definir sua localização.');
        return;
      }
    }

    setLocationSettings(nextSettings);
    onOpenChange(false);
    toast.success('Configuração de localização atualizada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ ...styles.dialogContent, ...(isDarkMode ? styles.dialogContentDark : {}), maxHeight: Math.min(640, Math.floor(height * 0.82)) }}>
        <DialogHeader>
          <DialogTitle style={isDarkMode ? styles.dialogTitleDark : undefined}>Configurar Localização</DialogTitle>
          <DialogDescription style={isDarkMode ? styles.dialogDescriptionDark : undefined}>Escolha entre seu endereço cadastrado, outro endereço ou somente o CEP.</DialogDescription>
          <Text style={isDarkMode ? styles.dialogInfoDark : styles.dialogInfo}>Usando o endereço informado no seu perfil como base padrão da busca.</Text>
        </DialogHeader>
        <View style={styles.dialogBody}>
          <View style={styles.sliderFieldTop}>
            <Label style={isDarkMode ? styles.inputLabelDark : undefined}>Ajuste a distância: {(draft.radiusKm || DEFAULT_RADIUS_KM).toFixed(1)} km</Label>
            <View style={styles.sliderControls}>
              <TouchableOpacity
                style={[styles.sliderBtn, (draft.radiusKm || DEFAULT_RADIUS_KM) <= MIN_RADIUS_KM && styles.sliderBtnDisabled]}
                onPress={() => {
                  const current = draft.radiusKm || DEFAULT_RADIUS_KM;
                  if (current > MIN_RADIUS_KM) {
                    setDraft((d: any) => ({ ...d, radiusKm: Math.round((current - STEP_KM) * 10) / 10 }));
                  }
                }}
                disabled={(draft.radiusKm || DEFAULT_RADIUS_KM) <= MIN_RADIUS_KM}
              >
                <Text style={styles.sliderBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.sliderDisplay}>
                <Text style={styles.sliderValue}>{(draft.radiusKm || DEFAULT_RADIUS_KM).toFixed(1)} km</Text>
                <Text style={[styles.sliderNote, isDarkMode && styles.sliderNoteDark]}>{Math.round((draft.radiusKm || DEFAULT_RADIUS_KM) * 1000)} metros</Text>
              </View>
              <TouchableOpacity
                style={[styles.sliderBtn, (draft.radiusKm || DEFAULT_RADIUS_KM) >= MAX_RADIUS_KM && styles.sliderBtnDisabled]}
                onPress={() => {
                  const current = draft.radiusKm || DEFAULT_RADIUS_KM;
                  if (current < MAX_RADIUS_KM) {
                    setDraft((d: any) => ({ ...d, radiusKm: Math.round((current + STEP_KM) * 10) / 10 }));
                  }
                }}
                disabled={(draft.radiusKm || DEFAULT_RADIUS_KM) >= MAX_RADIUS_KM}
              >
                <Text style={styles.sliderBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.rangeNote, isDarkMode && styles.rangeNoteDark]}>Mínimo: {MIN_RADIUS_KM}km ({MIN_RADIUS_KM * 1000}m) • Máximo: {MAX_RADIUS_KM}km • Incremento: {STEP_KM * 1000}m</Text>
          </View>
          <ScrollView
            style={styles.dialogScroll}
            contentContainerStyle={styles.dialogScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={styles.radioRow} onPress={() => setDraft((d: any) => ({ ...d, mode: 'profile' }))}>
              <View style={[styles.radio, isDarkMode && styles.radioDark, isProfileMode && styles.radioChecked]} />
              <Text style={[styles.radioLabel, isDarkMode && styles.radioLabelDark]}>Usar meu endereço</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioRow} onPress={() => setDraft((d: any) => ({ ...d, mode: 'custom' }))}>
              <View style={[styles.radio, isDarkMode && styles.radioDark, isCustomMode && styles.radioChecked]} />
              <Text style={[styles.radioLabel, isDarkMode && styles.radioLabelDark]}>Usar outro endereço</Text>
            </TouchableOpacity>
            {draft.mode === 'custom' && (
              <>
                <View style={styles.inputField}>
                  <Label style={isDarkMode ? styles.inputLabelDark : undefined}>CEP</Label>
                  <Input value={draft.cep} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, cep: v }))} placeholder="00000-000" />
                </View>
                <View style={styles.inputField}>
                  <Label style={isDarkMode ? styles.inputLabelDark : undefined}>Rua</Label>
                  <Input value={draft.street} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, street: v }))} placeholder="Rua, avenida, estrada" />
                </View>
                <View style={styles.inputField}>
                  <Label style={isDarkMode ? styles.inputLabelDark : undefined}>Número</Label>
                  <Input value={draft.number} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, number: v }))} placeholder="123" />
                </View>
                <View style={styles.inputField}>
                  <Label style={isDarkMode ? styles.inputLabelDark : undefined}>Bairro</Label>
                  <Input value={draft.neighborhood} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, neighborhood: v }))} placeholder="Centro" />
                </View>
                <View style={styles.inputField}>
                  <Label style={isDarkMode ? styles.inputLabelDark : undefined}>Cidade</Label>
                  <Input value={draft.city} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, city: v }))} placeholder="Curitiba" />
                </View>
                <View style={styles.inputField}>
                  <Label style={isDarkMode ? styles.inputLabelDark : undefined}>Estado</Label>
                  <Input value={draft.state} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, state: v }))} placeholder="PR" />
                </View>
              </>
            )}
            <TouchableOpacity style={styles.radioRow} onPress={() => setDraft((d: any) => ({ ...d, mode: 'cep' }))}>
              <View style={[styles.radio, isDarkMode && styles.radioDark, isCepMode && styles.radioChecked]} />
              <Text style={[styles.radioLabel, isDarkMode && styles.radioLabelDark]}>Usar somente o CEP</Text>
            </TouchableOpacity>
            {draft.mode === 'cep' && (
              <View style={styles.inputField}>
                <Label style={isDarkMode ? styles.inputLabelDark : undefined}>CEP</Label>
                <Input value={draft.cep} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, cep: v }))} placeholder="00000-000" />
              </View>
            )}
          </ScrollView>
          <View style={styles.dialogActions}>
            <Button onPress={() => onOpenChange(false)} variant="cancel" style={styles.btnFlex}>
              Cancelar
            </Button>
            <Button onPress={save} variant="success" style={styles.btnFlex}>
              Salvar
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}

export default function Header() {
  const { width } = useWindowDimensions();
  const { isLoggedIn, navigateTo, isDarkMode, setIsDarkMode, userProfile, setSelectedBusiness } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const perfilPermissao = userProfile?.PERMISSAO || userProfile?.permissao || userProfile?.papel;

  const isMobile = width < 640; 

  const nav = useMemo(() => {
    const xwide = width >= 1280;
    const wide = width >= 960;
    const medium = width >= 640;
    return {
      icon: xwide ? 36 : wide ? 30 : medium ? 26 : 24,
      navIcon: xwide ? 38 : wide ? 32 : medium ? 28 : 26,
      stroke: xwide ? 2.6 : wide ? 2.45 : medium ? 2.25 : 2.1,
      logoText: xwide ? 26 : wide ? 23 : medium ? 20 : 25, 
      logoFallback: xwide ? 32 : wide ? 28 : medium ? 26 : 24,
      logoCircle: xwide ? 68 : wide ? 60 : medium ? 54 : 50,
      logoImage: xwide ? 60 : wide ? 54 : medium ? 48 : 44,
      padV: xwide ? 18 : wide ? 16 : medium ? 14 : 12,
      padH: xwide ? 28 : wide ? 22 : medium ? 16 : 14,
      actionsGap: xwide ? 20 : wide ? 16 : medium ? 14 : 12,
      logoGap: xwide ? 16 : wide ? 14 : 12,
      userDot: xwide ? 38 : wide ? 34 : medium ? 30 : 28,
      userInitialsFS: xwide ? 15 : wide ? 13 : medium ? 12 : 11,
      iconBtnPad: xwide ? 14 : wide ? 12 : medium ? 10 : 9,
      mobileMenuFs: xwide ? 20 : wide ? 18 : medium ? 17 : 16,
      mobileMenuPadV: xwide ? 14 : wide ? 12 : 11,
      spreadIcons: width >= 640,
    };
  }, [width]);

  const userInitials = useMemo(() => {
    const name = userProfile?.name || '';
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }, [userProfile]);

  const handleNavigation = (target: string) => {
    if (!isLoggedIn && (target === 'anunciar' || target === 'perfil' || target === 'favoritos' || target === 'admin')) {
      toast.error('Você precisa fazer login para acessar esta área');
      navigateTo('T3');
    } else {
      if (target === 'anunciar') {
        setSelectedBusiness(null);
        navigateTo('T6');
      } else if (target === 'perfil') navigateTo('T5');
      else if (target === 'favoritos' navigateTo('T9');
      else if (target === 'contato') navigateTo('T10');
      else if (target === 'politicas') navigateTo('T8');
      else if (target === 'admin') navigateTo('AdminAcessos');
      else if (target === 'home') navigateTo('T1');
    }
    setMobileMenuOpen(false);
  };

  const handleOpenLocationDialog = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa fazer login para configurar a localização');
      navigateTo('T3');
      setMobileMenuOpen(false
