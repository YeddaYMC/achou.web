import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode, createContext, useContext, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

// Contexto do Select
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

// Hook para usar contexto do Select
function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) throw new Error('Select components must be used within Select'); // Erro se fora do contexto
  return context;
}

// Select principal
interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false); // Estado modal aberto/fechado

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      {children}
    </SelectContext.Provider>
  );
}

// Trigger do Select (botão que abre)
interface SelectTriggerProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function SelectTrigger({ children, style }: SelectTriggerProps) {
  const { setIsOpen } = useSelectContext();
  const { colors, borderRadius } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => setIsOpen(true)} // Abre modal
      style={[
        styles.trigger,
        { backgroundColor: colors.inputBackground, borderColor: colors.border, borderRadius: borderRadius.md },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

// Value do Select (texto exibido)
interface SelectValueProps {
  placeholder: string;
  style?: TextStyle;
}

export function SelectValue({ placeholder, style }: SelectValueProps) {
  const { value } = useSelectContext();
  const { colors } = useTheme();

  return (
    <Text style={[styles.valueText, { color: value ? colors.foreground : colors.mutedForeground }, style]}>
      {value || placeholder}
    </Text>
  );
}

// Content do Select (modal com opções)
interface SelectContentProps {
  children: ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const { isOpen, setIsOpen } = useSelectContext();
  const { colors } = useTheme();

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
        <View style={[styles.modalContent, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={true}>
            {children}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Item do Select
interface SelectItemProps {
  value: string;
  children: ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setIsOpen } = useSelectContext();
  const { colors } = useTheme();
  const isSelected = selectedValue === value; // Verifica se está selecionado
  const isImperdiveis = value === 'Imperdíveis'; // Verifica se é Imperdíveis

  return (
    <TouchableOpacity
      onPress={() => {
        onValueChange(value); // Define novo valor
        setIsOpen(false); // Fecha modal
      }}
      style={[
        styles.item,
        { backgroundColor: colors.card },
        isSelected && { backgroundColor: colors.accent },
        isImperdiveis && styles.itemImperdiveis
      ]}
    >
      <Text style={[
        styles.itemText, 
        { color: colors.foreground }, 
        isSelected && { fontWeight: '600' },
        isImperdiveis && styles.itemTextImperdiveis
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 12, // Padding horizontal
    paddingVertical: 12, // Padding vertical
    borderWidth: 1, // Borda
  },
  valueText: {
    fontSize: 14, // Tamanho fonte
  },
  modalOverlay: {
    flex: 1, // Tela cheia
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escurecido
    justifyContent: 'center', // Centraliza
    alignItems: 'center', // Centraliza
  },
  modalContent: {
    width: '80%', // Largura
    maxHeight: '60%', // Altura máxima
    borderRadius: 12, // Borda arredondada
    borderWidth: 1, // Borda
    paddingVertical: 8, // Padding vertical
  },
  item: {
    paddingHorizontal: 16, // Padding horizontal
    paddingVertical: 12, // Padding vertical
  },
  itemImperdiveis: {
    backgroundColor: '#fff', // Mantém fundo branco
    borderWidth: 3, // Borda dupla (mais grossa)
    borderColor: '#39ff14', // Borda verde neon
    shadowColor: '#39ff14', // Sombra verde neon
    shadowOffset: { width: 0, height: 0 }, // Sem offset
    shadowOpacity: 0.9, // Opacidade alta
    shadowRadius: 10, // Raio largo para brilho
    elevation: 8, // Elevação Android
    borderRadius: 6, // Bordas arredondadas
    marginVertical: 2, // Espaço para sombra
  },
  itemText: {
    fontSize: 14, // Tamanho fonte
  },
  itemTextImperdiveis: {
    color: '#1e3a8a', // Azul escuro
    fontWeight: '700', // Extra bold
    fontSize: 15, // Tamanho um pouco maior
  },
});
