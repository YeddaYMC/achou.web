import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { useAppContext } from '../context/AppContext';

export default function T8Politicas() {
  const { isDarkMode, navigateTo } = useAppContext();
  
  const ChevronLeftIcon: any = ChevronLeft;
  
  const containerStyle = isDarkMode ? { ...styles.container, ...styles.containerDark } : styles.container;
  const cardStyle = isDarkMode ? { ...styles.card, ...styles.cardDark } : styles.card;
  const titleStyle = isDarkMode ? { ...styles.title, ...styles.titleDark } : styles.title;
  const sectionTitleStyle = isDarkMode ? { ...styles.sectionTitle, ...styles.sectionTitleDark } : styles.sectionTitle;
  const textStyle = isDarkMode ? { ...styles.text, ...styles.textDark } : styles.text;
  const listItemStyle = isDarkMode ? { ...styles.listItem, ...styles.listItemDark } : styles.listItem;
  const backTextStyle = isDarkMode ? { ...styles.backText, ...styles.backTextDark } : styles.backText;
  const updateTextStyle = isDarkMode ? { ...styles.updateText, ...styles.updateTextDark } : styles.updateText;

  return (
    <LayoutRN>
      <ScrollView style={containerStyle}>
        <TouchableOpacity onPress={() => navigateTo('T1')} style={styles.backButton}>
          <View style={styles.backContent}>
            <ChevronLeftIcon size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={backTextStyle}>Voltar</Text>
          </View>
        </TouchableOpacity>

        <View style={cardStyle}>
          <Text style={titleStyle}>Políticas de Privacidade e LGPD</Text>
          
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={sectionTitleStyle}>1. Coleta de Dados</Text>
              <Text style={textStyle}>
                Coletamos apenas os dados necessários para o funcionamento da plataforma, incluindo nome, 
                e-mail, telefone e informações de negócios. Todos os dados são tratados em conformidade 
                com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>2. Uso dos Dados</Text>
              <Text style={textStyle}>Seus dados são utilizados exclusivamente para:</Text>
              <View style={styles.list}>
                <Text style={listItemStyle}>• Criação e gerenciamento de sua conta</Text>
                <Text style={listItemStyle}>• Publicação de anúncios de negócios</Text>
                <Text style={listItemStyle}>• Facilitação de contato entre usuários e empreendedores</Text>
                <Text style={listItemStyle}>• Melhorias na plataforma</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>3. Compartilhamento de Dados</Text>
              <Text style={textStyle}>
                Seus dados pessoais não são vendidos ou compartilhados com terceiros, exceto quando 
                necessário para o funcionamento da plataforma (por exemplo, informações de contato 
                visíveis em anúncios públicos).
              </Text>
              <Text style={[textStyle, { marginTop: 12 }]}>
                Poderemos também divulgar dados pessoais quando exigido por lei, ordem judicial ou
                requisição de autoridade competente, ou quando for necessário para proteger direitos,
                a segurança da plataforma ou de terceiros. Quando possível e legalmente permitido,
                procuraremos notificar o titular sobre tais solicitações.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>4. Direitos do Usuário</Text>
              <Text style={textStyle}>De acordo com a LGPD, você tem direito a:</Text>
              <View style={styles.list}>
                <Text style={listItemStyle}>• Acessar seus dados</Text>
                <Text style={listItemStyle}>• Corrigir dados incompletos ou incorretos</Text>
                <Text style={listItemStyle}>• Solicitar a exclusão de seus dados</Text>
                <Text style={listItemStyle}>• Revogar o consentimento</Text>
                <Text style={listItemStyle}>• Portabilidade dos dados</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>5. Segurança</Text>
              <Text style={textStyle}>
                Implementamos medidas de segurança técnicas e administrativas para proteger seus 
                dados contra acesso não autorizado, alteração, divulgação ou destruição.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>6. Contato</Text>
              <Text style={textStyle}>
                Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados,{' '}
              </Text>
              <TouchableOpacity onPress={() => navigateTo('T10')} style={styles.contactButton}>
                <Text style={styles.contactButtonText}>entre em contato através do formulário Fale Conosco</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={updateTextStyle}>Última atualização: Novembro de 2025</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: '#0f172a',
  },
  backButton: {
    marginBottom: 16,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  backTextDark: {
    color: '#60A5FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  cardDark: {
    backgroundColor: '#111827',
    borderColor: '#1e40af',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 24,
  },
  titleDark: {
    color: '#60A5FA',
  },
  content: {
    gap: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#93c5fd',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  textDark: {
    color: '#D1D5DB',
  },
  list: {
    marginTop: 8,
    gap: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    paddingLeft: 8,
  },
  listItemDark: {
    color: '#D1D5DB',
  },
  updateText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  updateTextDark: {
    color: '#9CA3AF',
  },
  contactButton: {
    marginTop: 8,
  },
  contactButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
