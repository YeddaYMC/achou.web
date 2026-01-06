// Sistema de cores e design tokens para React Native
export const colors = {
  light: {
    background: '#ffffff', // Fundo principal
    foreground: '#252525', // Texto principal
    card: '#ffffff', // Fundo cards
    cardForeground: '#252525', // Texto cards
    popover: '#ffffff', // Fundo popover
    popoverForeground: '#252525', // Texto popover
    primary: '#030213', // Cor primária
    primaryForeground: '#ffffff', // Texto primário
    secondary: '#f2f2f5', // Cor secundária
    secondaryForeground: '#030213', // Texto secundário
    muted: '#ececf0', // Cor suave
    mutedForeground: '#717182', // Texto suave
    accent: '#e9ebef', // Cor destaque
    accentForeground: '#030213', // Texto destaque
    destructive: '#d4183d', // Cor destrutiva
    destructiveForeground: '#ffffff', // Texto destrutivo
    border: 'rgba(0, 0, 0, 0.1)', // Cor borda
    input: 'transparent', // Fundo input
    inputBackground: '#f3f3f5', // Fundo input sólido
    switchBackground: '#cbced4', // Fundo switch
    ring: '#b3b3b3', // Cor foco
    chart1: '#e8824e', // Gráfico 1
    chart2: '#86c5d8', // Gráfico 2
    chart3: '#4d5d70', // Gráfico 3
    chart4: '#ead45b', // Gráfico 4
    chart5: '#e0a04c', // Gráfico 5
    sidebar: '#fbfbfb', // Fundo sidebar
    sidebarForeground: '#252525', // Texto sidebar
    sidebarPrimary: '#030213', // Primário sidebar
    sidebarPrimaryForeground: '#fbfbfb', // Texto primário sidebar
    sidebarAccent: '#f7f7f7', // Destaque sidebar
    sidebarAccentForeground: '#343434', // Texto destaque sidebar
    sidebarBorder: '#ebebeb', // Borda sidebar
    sidebarRing: '#b3b3b3', // Foco sidebar
    // Cores específicas de formulários
    formBackground: '#F3F4F6', // Fundo formulário light
    formBorder: '#1E3A8A', // Borda formulário light
    formTitle: '#2563EB', // Título formulário light
    formInputBg: '#FFFFFF', // Fundo input formulário light
    formLabel: '#374151', // Label formulário light
    formLink: '#2563EB', // Link formulário light
    success: '#16A34A', // Cor sucesso
  },
  dark: {
    background: '#252525', // Fundo principal
    foreground: '#fbfbfb', // Texto principal
    card: '#252525', // Fundo cards
    cardForeground: '#fbfbfb', // Texto cards
    popover: '#252525', // Fundo popover
    popoverForeground: '#fbfbfb', // Texto popover
    primary: '#fbfbfb', // Cor primária
    primaryForeground: '#343434', // Texto primário
    secondary: '#444444', // Cor secundária
    secondaryForeground: '#fbfbfb', // Texto secundário
    muted: '#444444', // Cor suave
    mutedForeground: '#b3b3b3', // Texto suave
    accent: '#444444', // Cor destaque
    accentForeground: '#fbfbfb', // Texto destaque
    destructive: '#7d3547', // Cor destrutiva
    destructiveForeground: '#e07a8d', // Texto destrutivo
    border: '#444444', // Cor borda
    input: '#444444', // Fundo input
    ring: '#707070', // Cor foco
    chart1: '#7a64d1', // Gráfico 1
    chart2: '#a0d8bd', // Gráfico 2
    chart3: '#e0a04c', // Gráfico 3
    chart4: '#b77ec4', // Gráfico 4
    chart5: '#d87352', // Gráfico 5
    sidebar: '#343434', // Fundo sidebar
    sidebarForeground: '#fbfbfb', // Texto sidebar
    sidebarPrimary: '#7a64d1', // Primário sidebar
    sidebarPrimaryForeground: '#fbfbfb', // Texto primário sidebar
    sidebarAccent: '#444444', // Destaque sidebar
    sidebarAccentForeground: '#fbfbfb', // Texto destaque sidebar
    sidebarBorder: '#444444', // Borda sidebar
    sidebarRing: '#707070', // Foco sidebar
    inputBackground: '#1F2937', // Fundo input dark
    switchBackground: '#6B7280', // Fundo switch dark
    // Cores específicas de formulários
    formBackground: '#111827', // Fundo formulário dark
    formBorder: '#1D4ED8', // Borda formulário dark
    formTitle: '#60A5FA', // Título formulário dark
    formInputBg: '#1F2937', // Fundo input formulário dark
    formLabel: '#D1D5DB', // Label formulário dark
    formLink: '#60A5FA', // Link formulário dark
    success: '#16A34A', // Cor sucesso
  },
} as const;

// Espaçamentos baseados em 4px
export const spacing = {
  xs: 4, // Extra pequeno
  sm: 8, // Pequeno
  md: 16, // Médio
  lg: 24, // Grande
  xl: 32, // Extra grande
  '2xl': 48, // 2x extra grande
  '3xl': 64, // 3x extra grande
} as const;

// Tamanhos de fonte baseados em 16px
export const fontSize = {
  xs: 12, // Extra pequeno
  sm: 14, // Pequeno
  base: 16, // Base
  lg: 18, // Grande
  xl: 20, // Extra grande
  '2xl': 24, // 2x grande
  '3xl': 30, // 3x grande
  '4xl': 36, // 4x grande
} as const;

// Pesos de fonte
export const fontWeight = {
  normal: '400' as const, // Normal
  medium: '500' as const, // Médio
  semibold: '600' as const, // Semi-negrito
  bold: '700' as const, // Negrito
};

// Raio de borda
export const borderRadius = {
  none: 0, // Sem raio
  sm: 6, // Pequeno (--radius - 4px)
  md: 8, // Médio (--radius - 2px)
  lg: 10, // Grande (--radius)
  xl: 14, // Extra grande (--radius + 4px)
  full: 9999, // Circular
} as const;

// Opacidades
export const opacity = {
  disabled: 0.5, // Desabilitado
  hover: 0.8, // Hover
  pressed: 0.6, // Pressionado
} as const;

// Sombras (compatível com React Native)
export const shadows = {
  sm: {
    shadowColor: '#000', // Cor sombra
    shadowOffset: { width: 0, height: 1 }, // Offset
    shadowOpacity: 0.05, // Opacidade
    shadowRadius: 2, // Raio
    elevation: 1, // Android
  },
  md: {
    shadowColor: '#000', // Cor sombra
    shadowOffset: { width: 0, height: 2 }, // Offset
    shadowOpacity: 0.1, // Opacidade
    shadowRadius: 4, // Raio
    elevation: 3, // Android
  },
  lg: {
    shadowColor: '#000', // Cor sombra
    shadowOffset: { width: 0, height: 4 }, // Offset
    shadowOpacity: 0.15, // Opacidade
    shadowRadius: 8, // Raio
    elevation: 5, // Android
  },
} as const;

// Tema padrão exportado
export const theme = {
  colors: colors.light, // Cores light por padrão
  spacing, // Espaçamentos
  fontSize, // Tamanhos de fonte
  fontWeight, // Pesos de fonte
  borderRadius, // Raios de borda
  opacity, // Opacidades
  shadows, // Sombras
} as const;

// Type helper para uso com TypeScript
export type Theme = typeof theme;
export type ColorScheme = keyof typeof colors;
