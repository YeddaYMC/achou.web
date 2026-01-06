import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { useAppContext } from '../context/AppContext';

export default function T9Favoritos() {
  const { isDarkMode } = useAppContext();
  return (
    <LayoutRN>
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Favoritos</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Tela em desenvolvimento...</Text>
      </View>
    </LayoutRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
});
