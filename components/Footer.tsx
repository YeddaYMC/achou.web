import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function Footer() {
  const { isDarkMode } = useAppContext();

  return (
    <View style={[styles.footer, isDarkMode && styles.footerDark]}>
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
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexShrink: 0,
    alignItems: 'center',
  },
  footerDark: {
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
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
});
