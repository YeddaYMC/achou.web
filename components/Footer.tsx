import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function Footer() {
  const context = useAppContext();
  // Já desestruturamos o navigateBack aqui para garantir escopo limpo
  const { isDarkMode, navigateTo, navigateBack } = context;
  const { width } = useWindowDimensions();
  const isMobile = width < 640; 

  const handleBackStack = () => {
    if (typeof navigateBack === 'function') {
      navigateBack();
    } else {
      navigateTo('T1'); 
    }
  };

  return (
    <View style={[
      styles.footer, 
      isDarkMode && styles.footerDark,
      isMobile && styles.footerMobileMargin
    ]}>
      {/* Bloco de textos centralizado */}
      <View style={styles.textContainer}>
        <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>© 2025</Text>
        <Text style={[styles.footerText, styles.footerName, isDarkMode && styles.footerTextDark]}>
          YEDDA MARIA CARVALHAIS
        </Text>
        <Text style={[styles.footerText, styles.footerName, isDarkMode && styles.footerTextDark]}>
          MARY ANA CARVALHAIS CARNEIRO
        </Text>
        <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>
          Licenciado sob{' '}
          <Text onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-nc-sa/4.0/')} style={styles.footerLink}>
            CC BY-NC-SA 4.0
          </Text>
          .
        </Text>
      </View>

      {/* Botão redondo fixado na lateral direita com zIndex adicionado */}
      <TouchableOpacity
        onPress={handleBackStack}
        style={[styles.footerRoundBackButton, isDarkMode ? styles.backButtonDark : styles.backButtonLight]}
        activeOpacity={0.8}
      >
        <Text style={[styles.backButtonArrow, isDarkMode ? styles.arrowDark : styles.arrowLight]}>➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', 
  },
  footerDark: {
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
  },
  footerMobileMargin: {
    marginBottom: 60, 
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40, 
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    width: '100%',
    lineHeight: 13,
  },
  footerName: {
    fontWeight: '700',
  },
  footerTextDark: {
    color: '#94a3b8',
  },
  footerLink: {
    color: '#0ea5e9',
    textDecorationLine: 'underline',
  },
  footerRoundBackButton: {
    position: 'absolute', 
    right: 16,            
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
    zIndex: 99, // <--- ADICIONADO AQUI: Garante que o botão fique fisicamente por cima de tudo e receba o toque
  },
  backButtonLight: {
    backgroundColor: '#0ea5e9',
  },
  backButtonDark: {
    backgroundColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButtonArrow: {
    fontSize: 13,
    fontWeight: 'bold',
    transform: [{ scaleX: -1 }], 
  },
  arrowLight: {
    color: '#4ade80', 
  },
  arrowDark: {
    color: '#ffffff', 
  },
});
