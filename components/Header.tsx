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
      logoText: xwide ? 26 : wide ? 23 : medium ? 20 : 24, // Aumentado de 19 para 24 no mobile
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
      else if (target === 'favoritos') navigateTo('T9');
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
      setMobileMenuOpen(false);
      return;
    }
    setLocationDialogOpen(true);
  };

  useEffect(() => {
    setLogoFailed(false);
  }, [isDarkMode, mobileMenuOpen]);

  const renderActions = (isBottomBar = false) => (
    <View 
      style={[
        styles.headerActions, 
        isBottomBar ? styles.bottomBarActions : {
          flex: 1,
          justifyContent: nav.spreadIcons ? 'space-evenly' : 'flex-end',
          gap: nav.spreadIcons ? 0 : nav.actionsGap,
          marginLeft: 10,
          minHeight: Math.max(nav.logoCircle, nav.navIcon + nav.iconBtnPad * 2),
        }
      ]}
    >
      {isBottomBar && (
        <TouchableOpacity onPress={() => handleNavigation('home')} style={styles.bottomBarButton}>
          <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>Início</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => setIsDarkMode(!isDarkMode)}
        style={isBottomBar ? styles.bottomBarButton : [styles.iconButton, { padding: nav.iconBtnPad }]}
      >
        {isDarkMode ? (
          <Sun size={isBottomBar ? 20 : nav.icon} color={isBottomBar ? '#94a3b8' : '#fff'} strokeWidth={isBottomBar ? 2 : nav.stroke} />
        ) : (
          <Moon size={isBottomBar ? 20 : nav.icon} color={isBottomBar ? '#64748b' : '#fff'} strokeWidth={isBottomBar ? 2 : nav.stroke} />
        )}
        {isBottomBar && <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>Tema</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleNavigation('favoritos')}
        style={isBottomBar ? styles.bottomBarButton : [styles.iconButton, { padding: nav.iconBtnPad }]}
      >
        <Heart size={isBottomBar ? 20 : nav.icon} color={isBottomBar ? (isDarkMode ? '#94a3b8' : '#64748b') : '#fff'} strokeWidth={isBottomBar ? 2 : nav.stroke} />
        {isBottomBar && <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>Favoritos</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => isLoggedIn ? navigateTo('T5') : navigateTo('T3')}
        style={isBottomBar ? styles.bottomBarButton : [styles.iconButton, { padding: nav.iconBtnPad }]}
      >
        {isLoggedIn ? (
          <View
            style={[
              styles.userInitialsCircle,
              isBottomBar ? styles.userInitialsCircleBottom : {
                width: nav.userDot,
                height: nav.userDot,
                borderRadius: nav.userDot / 2,
              },
            ]}
          >
            <Text style={[styles.userInitialsText, isBottomBar ? styles.userInitialsTextBottom : { fontSize: nav.userInitialsFS }]}>{userInitials}</Text>
          </View>
        ) : (
          <User size={isBottomBar ? 20 : nav.icon} color={isBottomBar ? (isDarkMode ? '#94a3b8' : '#64748b') : '#fff'} strokeWidth={isBottomBar ? 2 : nav.stroke} />
        )}
        {isBottomBar && <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>Perfil</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleOpenLocationDialog}
        style={isBottomBar ? styles.bottomBarButton : [styles.iconButton, { padding: nav.iconBtnPad }]}
      >
        <MapPin size={isBottomBar ? 20 : nav.icon} color={isBottomBar ? (isDarkMode ? '#94a3b8' : '#64748b') : '#fff'} strokeWidth={isBottomBar ? 2 : nav.stroke} />
        {isBottomBar && <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>Filtros</Text>}
      </TouchableOpacity>

      {isLoggedIn && (perfilPermissao === 'admin' || perfilPermissao === 'moderador' || perfilPermissao === 'super_admin') && (
        <TouchableOpacity
          onPress={() => handleNavigation('admin')}
          style={isBottomBar ? styles.bottomBarButton : [styles.iconButton, { padding: nav.iconBtnPad }]}
        >
          <Shield size={isBottomBar ? 20 : nav.icon} color={isBottomBar ? (isDarkMode ? '#94a3b8' : '#64748b') : '#fff'} strokeWidth={isBottomBar ? 2 : nav.stroke} />
          {isBottomBar && <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>Admin</Text>}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <LinearGradient
        colors={
          isDarkMode
            ? ['#0f172a', '#152a4a', '#1a3378', '#1e3a8a']
            : ['#38bdf8', '#22d3ee', '#14b8a6', '#2dd4bf', '#4ade80']
        }
        locations={isDarkMode ? [0, 0.33, 0.66, 1] : [0, 0.22, 0.48, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.header,
          { paddingVertical: nav.padV, paddingHorizontal: nav.padH },
        ]}
      >
        <View style={styles.headerContent}>
          {/* View fantasma para equilibrar o espaço à esquerda e centralizar o logo perfeitamente no mobile */}
          {isMobile && <View style={styles.spacerPlaceholder} />}

          <TouchableOpacity
            onPress={() => handleNavigation('home')}
            style={[
              styles.logoButton, 
              isMobile ? styles.logoButtonCentered : {},
              { gap: nav.logoGap }
            ]}
          >
            <View
              style={[
                styles.logoCircle,
                isDarkMode ? { backgroundColor: '#0f172a' } : { backgroundColor: '#fff' },
                {
                  width: nav.logoCircle,
                  height: nav.logoCircle,
                  borderRadius: nav.logoCircle / 2,
                },
              ]}
            >
              {logoFailed ? (
                <Text
                  style={[
                    styles.logoFallbackText,
                    isDarkMode && { color: '#60A5FA' },
                    { fontSize: nav.logoFallback },
                  ]}
                >
                  A
                </Text>
              ) : (
                <Image
                  source={logoAchou}
                  style={{ width: nav.logoImage, height: nav.logoImage }}
                  resizeMode="contain"
                  onError={() => setLogoFailed(true)}
                  onLoad={() => setLogoFailed(false)}
                  accessibilityLabel="Logo Achou"
                />
              )}
            </View>
            <Text style={[
              styles.logoText, 
              isDarkMode && { color: '#e5e7eb' }, 
              { fontSize: nav.logoText }
            ]}>
              Achou!
            </Text>
          </TouchableOpacity>

          {!isMobile && renderActions(false)}

          {isMobile && (
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={[styles.iconButton, { padding: nav.iconBtnPad, marginLeft: 'auto' }]}
            >
              {mobileMenuOpen ? (
                <X size={nav.navIcon} color="#fff" strokeWidth={nav.stroke} />
              ) : (
                <Menu size={nav.navIcon} color="#fff" strokeWidth={nav.stroke} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {mobileMenuOpen && (
          <View style={styles.mobileMenu}>
            <TouchableOpacity onPress={() => handleNavigation('anunciar')} style={[styles.mobileMenuItem, { paddingVertical: nav.mobileMenuPadV }]}>
              <Text style={[styles.mobileMenuText, { fontSize: nav.mobileMenuFs }]}>Anunciar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('contato')} style={[styles.mobileMenuItem, { paddingVertical: nav.mobileMenuPadV }]}>
              <Text style={[styles.mobileMenuText, { fontSize: nav.mobileMenuFs }]}>Fale Conosco</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!isLoggedIn) {
                  toast.error('Você precisa fazer login para acessar esta área');
                  navigateTo('T3');
                } else {
                  navigateTo('T7');
                  setMobileMenuOpen(false);
                }
              }}
              style={[styles.mobileMenuItem, { paddingVertical: nav.mobileMenuPadV }]}
            >
              <Text style={[styles.mobileMenuText, { fontSize: nav.mobileMenuFs }]}>Gestão de Anúncios</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('politicas')} style={[styles.mobileMenuItem, { paddingVertical: nav.mobileMenuPadV }]}>
              <Text style={[styles.mobileMenuText, { fontSize: nav.mobileMenuFs }]}>Políticas de Privacidade</Text>
            </TouchableOpacity>
          </View>
        )}
        <LocationDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} />
      </LinearGradient>

      {isMobile && (
        <View style={[styles.bottomNavigationBar, isDarkMode ? styles.bottomBarDark : styles.bottomBarLight]}>
          {renderActions(true)}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexShrink: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoButtonCentered: {
    marginLeft: 'auto',
  },
  spacerPlaceholder: {
    width: 44, // Equilibra visualmente o tamanho do botão Menu da direita fazendo o logo ficar no meio exato
  },
  logoCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    color: '#1e3a8a',
    fontWeight: '900',
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'sans-serif-rounded', // Deixa as letras arredondadas por padrão no Android/Web
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitialsCircle: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  userInitialsText: {
    color: '#fff',
    fontWeight: '700',
  },
  mobileMenu: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  mobileMenuItem: {
    paddingHorizontal: 12,
  },
  mobileMenuText: {
    color: '#fff',
    fontWeight: '500',
  },
  dialogContent: {
    maxWidth: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  dialogContentDark: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  dialogTitle: {
    color: '#0ea5e9',
  },
  dialogTitleDark: {
    color: '#60a5fa',
  },
  dialogDescriptionDark: {
    color: '#9ca3af',
  },
  dialogInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
  },
  dialogInfoDark: {
    marginTop: 8,
    fontSize: 12,
    color: '#cbd5e1',
  },
  dialogBody: {
    marginTop: 16,
    gap: 12,
    flexShrink: 1,
  },
  sliderFieldTop: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  radioDark: {
    borderColor: '#64748b',
  },
  radioChecked: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  radioLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  radioLabelDark: {
    color: '#e5e7eb',
  },
  inputLabelDark: {
    color: '#d1d5db',
  },
  inputField: {
    marginTop: 8,
  },
  sliderField: {
    marginTop: 8,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  sliderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderBtnDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.5,
  },
  sliderBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  sliderDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  sliderNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sliderNoteDark: {
    color: '#9ca3af',
  },
  rangeNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  rangeNoteDark: {
    color: '#cbd5e1',
  },
  dialogActions: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 8,
    paddingBottom: 6,
    flexShrink: 0,
  },
  dialogScroll: {
    flexGrow: 0,
  },
  dialogScrollContent: {
    gap: 12,
    paddingBottom: 12,
  },
  btnFlex: {
    width: '100%',
    minHeight: 40,
  },
  bottomNavigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  bottomBarLight: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
  },
  bottomBarDark: {
    backgroundColor: '#0f172a',
    borderTopColor: '#334155',
  },
  bottomBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  bottomBarButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  barLabelDark: {
    color: '#94a3b8',
  },
  userInitialsCircleBottom: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitialsTextBottom: {
    color: '#0ea5e9',
    fontSize: 10,
  },
});
