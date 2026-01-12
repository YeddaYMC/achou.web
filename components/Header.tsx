import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin, Menu, Moon, Sun, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import logoAchou from '../assets/images/LOGO-ACHOU.png';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from './ui/sonner';

const WALKING_SPEED_KMH = 5;
const BIKE_SPEED_KMH = 15;
const CAR_SPEED_KMH = 40;
const DEFAULT_RADIUS_MINUTES = 15;

function LocationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { locationSettings, setLocationSettings } = useAppContext();
  const [draft, setDraft] = useState({ ...locationSettings });

  React.useEffect(() => setDraft({ ...locationSettings }), [locationSettings, open]);

  const save = () => {
    const minutes = draft.radiusMinutes || DEFAULT_RADIUS_MINUTES;
    const kmForWalking = parseFloat(((WALKING_SPEED_KMH * minutes) / 60).toFixed(2));
    setLocationSettings({ ...draft, radius: kmForWalking, radiusMinutes: minutes });
    onOpenChange(false);
    toast.success('Configuração de localização atualizada');
  };

  const useGpsNow = () => {
    if (navigator && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDraft((d: any) => ({ ...d, mode: 'gps', coords: { lat: pos.coords.latitude, lon: pos.coords.longitude } }));
          toast.success('Posição obtida com sucesso');
        },
        () => toast.error('Não foi possível obter a posição'),
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocalização não suportada neste navegador');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle style={styles.dialogTitle}>Configurar Localização</DialogTitle>
          <DialogDescription>Escolha como deseja localizar sua busca e o raio.</DialogDescription>
        </DialogHeader>
        <View style={styles.dialogBody}>
          <TouchableOpacity style={styles.radioRow} onPress={() => setDraft((d: any) => ({ ...d, mode: 'gps' }))}>
            <View style={[styles.radio, draft.mode === 'gps' && styles.radioChecked]} />
            <Text style={styles.radioLabel}>Usar localização GPS (padrão)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioRow} onPress={() => setDraft((d: any) => ({ ...d, mode: 'cep' }))}>
            <View style={[styles.radio, draft.mode === 'cep' && styles.radioChecked]} />
            <Text style={styles.radioLabel}>Usar CEP</Text>
          </TouchableOpacity>
          {draft.mode === 'cep' && (
            <View style={styles.inputField}>
              <Label>CEP</Label>
              <Input value={draft.cep} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, cep: v }))} placeholder="00000-000" />
            </View>
          )}
          <TouchableOpacity style={styles.radioRow} onPress={() => setDraft((d: any) => ({ ...d, mode: 'address' }))}>
            <View style={[styles.radio, draft.mode === 'address' && styles.radioChecked]} />
            <Text style={styles.radioLabel}>Usar endereço</Text>
          </TouchableOpacity>
          {draft.mode === 'address' && (
            <View style={styles.inputField}>
              <Label>Endereço</Label>
              <Input value={draft.address} onChangeText={(v: string) => setDraft((d: any) => ({ ...d, address: v }))} placeholder="Rua, número, bairro" />
            </View>
          )}
          <View style={styles.sliderField}>
            <Label>Tempo de alcance: {draft.radiusMinutes} min</Label>
            <Text style={styles.sliderNote}>
              Caminhada: {((WALKING_SPEED_KMH * draft.radiusMinutes) / 60).toFixed(2)} km • Bicicleta: {((BIKE_SPEED_KMH * draft.radiusMinutes) / 60).toFixed(2)} km • Carro: {((CAR_SPEED_KMH * draft.radiusMinutes) / 60).toFixed(2)} km
            </Text>
          </View>
          <View style={styles.dialogActions}>
            <Button onPress={useGpsNow} style={styles.btnFlex}>
              <Text style={styles.btnText}>Usar GPS agora</Text>
            </Button>
            <Button onPress={() => onOpenChange(false)} variant="outline" style={styles.btnFlex}>
              <Text style={styles.btnText}>Cancelar</Text>
            </Button>
            <Button onPress={save} style={styles.btnSave}>
              <Text style={styles.btnText}>Salvar</Text>
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}

export default function Header() {
  const { isLoggedIn, navigateTo, isDarkMode, setIsDarkMode } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const handleNavigation = (target: string) => {
    if (!isLoggedIn && (target === 'anunciar' || target === 'perfil' || target === 'favoritos')) {
      toast.error('Você precisa fazer login para acessar esta área');
      navigateTo('T3');
    } else {
      if (target === 'anunciar') navigateTo('T6');
      else if (target === 'perfil') navigateTo('T5');
      else if (target === 'favoritos') navigateTo('T9');
      else if (target === 'contato') navigateTo('T10');
      else if (target === 'politicas') navigateTo('T8');
      else if (target === 'home') navigateTo('T1');
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <LinearGradient
        colors={isDarkMode ? ['#0f172a', '#1e3a8a'] : ['#0ea5e9', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => handleNavigation('home')} style={styles.logoButton}>
            <View style={styles.logoCircle}>
              <Image source={logoAchou} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.logoText}>Achou!</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.iconButton}>
              {isDarkMode ? <Sun size={20} color="#fff" /> : <Moon size={20} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('favoritos')} style={styles.iconButton}>
              <Heart size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocationDialogOpen(true)} style={styles.iconButton}>
              <MapPin size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMobileMenuOpen(!mobileMenuOpen)} style={styles.iconButton}>
              {mobileMenuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
        {mobileMenuOpen && (
          <View style={styles.mobileMenu}>
            <TouchableOpacity onPress={() => handleNavigation('anunciar')} style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuText}>Anunciar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('contato')} style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuText}>Fale Conosco</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('home')} style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuText}>Início</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocationDialogOpen(true)} style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuText}>Localização</Text>
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
              style={styles.mobileMenuItem}
            >
              <Text style={styles.mobileMenuText}>Painel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('perfil')} style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuText}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigation('politicas')} style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuText}>Políticas de Privacidade</Text>
            </TouchableOpacity>
          </View>
        )}
        <LocationDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    justifyContent: 'space-between',
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  mobileMenu: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  mobileMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mobileMenuText: {
    color: '#fff',
    fontSize: 16,
  },
  dialogContent: {
    maxWidth: '90%',
  },
  dialogTitle: {
    color: '#0ea5e9',
  },
  dialogBody: {
    marginTop: 16,
    gap: 12,
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
  radioChecked: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  radioLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  inputField: {
    marginTop: 8,
  },
  sliderField: {
    marginTop: 8,
  },
  sliderNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  btnFlex: {
    flex: 1,
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#16a34a',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
