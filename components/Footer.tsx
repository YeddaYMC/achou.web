import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function Footer() {
  const { isDarkMode } = useAppContext();

  return (
    <View style={[styles.footer, isDarkMode && styles.footerDark]}>
      <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>
        © 2025 YEDDA MARIA CARVALHAIS. Licenciado sob{' '}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  footerDark: {
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  footerTextDark: {
    color: '#94a3b8',
  },
  footerLink: {
    color: '#0ea5e9',
    textDecorationLine: 'underline',
  },
});
