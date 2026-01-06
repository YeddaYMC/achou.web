import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { useAppContext } from '../context/AppContext';

export default function T10Contato() {
  const { isDarkMode, navigateTo, reportBusiness, setReportBusiness } = useAppContext();
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Atenção', 'Por favor, escreva sua mensagem');
      return;
    }
    
    Alert.alert('Sucesso', 'Sua mensagem foi enviada com sucesso!');
    setMessage('');
    setReportBusiness(null); // Limpar denúncia após envio
  };

  // Limpa a denúncia ao sair da tela (abandono sem envio)
  useEffect(() => {
    return () => {
      try { setReportBusiness(null); } catch {}
    };
  }, []);

  const containerStyle = isDarkMode ? { ...styles.container, ...styles.containerDark } : styles.container;
  const titleStyle = isDarkMode ? { ...styles.title, ...styles.titleDark } : styles.title;
  const labelStyle = isDarkMode ? { ...styles.label, ...styles.labelDark } : styles.label;
  const inputStyle = isDarkMode ? { ...styles.input, ...styles.inputDark } : styles.input;

  return (
    <LayoutRN>
      <ScrollView style={containerStyle}>
        <Text style={titleStyle}>Fale Conosco</Text>

        {reportBusiness && (
          <View style={[styles.reportBanner, isDarkMode && styles.reportBannerDark]}>
            <Text style={[styles.reportBannerText, isDarkMode && styles.reportBannerTextDark]}>
              Denúncia de: <Text style={{ fontWeight: 'bold' }}>{reportBusiness.name}</Text> (ID: {reportBusiness.id})
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={labelStyle}>Mensagem</Text>
          <TextInput
            style={[inputStyle, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder={reportBusiness ? `Descreva o problema com "${reportBusiness.name}"...` : "Digite sua mensagem aqui..."}
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Enviar Mensagem</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => { try { setReportBusiness(null); } catch {}; navigateTo('T1'); }}
        >
          <Text style={styles.backButtonText}>Voltar para a Home</Text>
        </TouchableOpacity>
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
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#D1D5DB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputDark: {
    borderColor: '#4B5563',
    color: '#FFFFFF',
    backgroundColor: '#1F2937',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 10,
  },
  reportBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  reportBannerDark: {
    backgroundColor: '#7F1D1D',
    borderLeftColor: '#FCA5A5',
  },
  reportBannerText: {
    fontSize: 14,
    color: '#991B1B',
  },
  reportBannerTextDark: {
    color: '#FCA5A5',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});
