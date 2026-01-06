import { Alert } from 'react-native';

// Toast simples usando Alert do React Native
export const toast = {
  success: (message: string) => Alert.alert('Sucesso', message), // Toast sucesso
  error: (message: string) => Alert.alert('Erro', message), // Toast erro
  info: (message: string) => Alert.alert('Info', message), // Toast info
  warning: (message: string) => Alert.alert('Aviso', message), // Toast aviso
};
