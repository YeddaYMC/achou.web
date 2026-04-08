import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { Modal, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

// Props do Dialog
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

// Dialog principal
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
      <View style={styles.overlay}>
        <View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

// Props do DialogContent
interface DialogContentProps {
  children: ReactNode;
  style?: ViewStyle;
}

// Conteúdo do Dialog
export function DialogContent({ children, style }: DialogContentProps) {
  const { colors, borderRadius, spacing, shadows } = useTheme();

  return (
    <View
      style={[
        styles.content,
        {
          backgroundColor: colors.card, // Fundo card
          borderRadius: borderRadius.lg, // Borda arredondada
          padding: spacing.lg, // Padding
        },
        shadows.lg, // Sombra
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Props do DialogHeader
interface DialogHeaderProps {
  children: ReactNode;
}

// Header do Dialog
export function DialogHeader({ children }: DialogHeaderProps) {
  return <View style={{ marginBottom: 16 }}>{children}</View>;
}

// Props do DialogTitle
interface DialogTitleProps {
  children: ReactNode;
  style?: TextStyle;
}

// Título do Dialog
export function DialogTitle({ children, style }: DialogTitleProps) {
  const { colors, fontSize } = useTheme();

  return (
    <Text
      style={[
        styles.title,
        {
          color: colors.foreground, // Cor texto
          fontSize: fontSize.lg, // Tamanho fonte
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// Props do DialogDescription
interface DialogDescriptionProps {
  children: ReactNode;
  style?: TextStyle;
}

// Descrição do Dialog
export function DialogDescription({ children, style }: DialogDescriptionProps) {
  const { colors, fontSize } = useTheme();

  return (
    <Text
      style={[
        styles.description,
        {
          color: colors.mutedForeground, // Cor texto suave
          fontSize: fontSize.sm, // Tamanho fonte pequeno
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, // Tela cheia
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escurecido
    justifyContent: 'center', // Centraliza vertical
    alignItems: 'center', // Centraliza horizontal
    padding: 16, // Padding externo
  },
  content: {
    width: '90%', // Largura
    maxWidth: 400, // Largura máxima
  },
  title: {
    fontWeight: '600', // Semi-negrito
    marginBottom: 8, // Espaço inferior
  },
  description: {
    lineHeight: 20, // Altura linha
  },
});
