import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LayoutRN from '../components/Layout-RN';
import { useAppContext } from '../context/AppContext';

export default function T11TermosCondicoes() {
  const { isDarkMode, navigateBack } = useAppContext();
  
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
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <View style={styles.backContent}>
            <ChevronLeftIcon size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={backTextStyle}>Voltar</Text>
          </View>
        </TouchableOpacity>

        <View style={cardStyle}>
          <Text style={titleStyle}>Termos e Condições de Uso</Text>
          
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={sectionTitleStyle}>1. Política de Conteúdo e Imagens</Text>
              
              <View style={[styles.section, { marginBottom: 12 }]}>
                <Text style={[sectionTitleStyle, { fontSize: 16 }]}>1.1 Responsabilidade do Usuário</Text>
                <Text style={textStyle}>
                  Ao realizar o upload de qualquer imagem, logotipo ou fotografia para o Aplicativo, o Usuário 
                  declara e garante que:
                </Text>
                <View style={styles.list}>
                  <Text style={listItemStyle}>
                    • É o legítimo proprietário da imagem ou possui autorização expressa dos detentores dos 
                    direitos autorais para utilizá-la comercialmente
                  </Text>
                  <Text style={listItemStyle}>
                    • A imagem não viola direitos de propriedade intelectual, marcas registradas ou direitos 
                    de privacidade de terceiros
                  </Text>
                  <Text style={listItemStyle}>
                    • O conteúdo da imagem é verídico e representa fielmente o estabelecimento ou serviço anunciado
                  </Text>
                </View>
              </View>

              <View style={[styles.section, { marginBottom: 12 }]}>
                <Text style={[sectionTitleStyle, { fontSize: 16 }]}>1.2 Conteúdo Proibido</Text>
                <Text style={textStyle}>É terminantemente proibido o upload de imagens que contenham:</Text>
                <View style={styles.list}>
                  <Text style={listItemStyle}>• Nudez, conteúdo sexualmente explícito ou obsceno</Text>
                  <Text style={listItemStyle}>
                    • Violência, armas, drogas ou apologia a atividades ilícitas
                  </Text>
                  <Text style={listItemStyle}>
                    • Discurso de ódio, conteúdo discriminatório ou ofensivo a grupos e indivíduos
                  </Text>
                  <Text style={listItemStyle}>
                    • Informações pessoais de terceiros sem consentimento (como placas de veículos ou rostos 
                    de transeuntes)
                  </Text>
                </View>
              </View>

              <View style={[styles.section, { marginBottom: 12 }]}>
                <Text style={[sectionTitleStyle, { fontSize: 16 }]}>1.3 Moderação e Direito de Exclusão</Text>
                <Text style={textStyle}>
                  O Aplicativo utiliza um sistema de moderação para todos os anúncios:
                </Text>
                <View style={styles.list}>
                  <Text style={listItemStyle}>
                    • Todo novo anúncio ou alteração de imagem poderá permanecer em estado "Privado" ou 
                    "Pendente", não sendo exibido publicamente até que seja revisado e aprovado pela equipe 
                    de administração
                  </Text>
                  <Text style={listItemStyle}>
                    • O Aplicativo reserva-se o direito de remover qualquer imagem ou anúncio que viole estes 
                    Termos ou que seja alvo de denúncias fundamentadas, sem necessidade de aviso prévio ou 
                    indenização ao Usuário
                  </Text>
                </View>
              </View>

              <View style={[styles.section, { marginBottom: 12 }]}>
                <Text style={[sectionTitleStyle, { fontSize: 16 }]}>1.4 Armazenamento e Limitações Técnicas</Text>
                <View style={styles.list}>
                  <Text style={listItemStyle}>
                    • As imagens são armazenadas em servidores de infraestrutura de terceiros e o Aplicativo 
                    não garante o armazenamento perpétuo das mesmas
                  </Text>
                  <Text style={listItemStyle}>
                    • O Aplicativo reserva-se o direito de aplicar otimizações técnicas (redimensionamento e 
                    compressão) nas imagens enviadas para garantir a performance da plataforma
                  </Text>
                </View>
              </View>

              <View style={[styles.section, { marginBottom: 12 }]}>
                <Text style={[sectionTitleStyle, { fontSize: 16 }]}>1.5 Licença de Uso</Text>
                <Text style={textStyle}>
                  Ao enviar uma imagem, o Usuário concede ao Aplicativo uma licença gratuita, não exclusiva e 
                  mundial para hospedar, exibir e reproduzir tal conteúdo estritamente para os fins de 
                  funcionamento do serviço de anúncios dentro da plataforma.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>2. Limitações de Uso</Text>
              <View style={styles.list}>
                <Text style={listItemStyle}>
                  • FREE: máximo 1 negócio e 1 foto por negócio
                </Text>
                <Text style={listItemStyle}>
                  • PREMIUM: máximo 3 negócios e 3 fotos por negócio
                </Text>
                <Text style={listItemStyle}>
                  • Favoritos: ilimitados para todos os usuários
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>3. Responsabilidade do Usuário</Text>
              <Text style={textStyle}>
                O Usuário é responsável por todas as atividades realizadas em sua conta e pelas informações 
                fornecidas. O Usuário concorda em usar a plataforma de forma legal e ética, respeitando todos 
                os direitos de terceiros.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>4. Isenção de Responsabilidade</Text>
              <Text style={textStyle}>
                O Aplicativo é fornecido "no estado em que se encontra". Não garantimos a disponibilidade 
                contínua, precisão das informações ou adequação para fins específicos. O Aplicativo não é 
                responsável por perdas ou danos causados pelo uso da plataforma.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={sectionTitleStyle}>5. Modificações dos Termos</Text>
              <Text style={textStyle}>
                O Aplicativo reserva-se o direito de modificar estes Termos a qualquer momento. Modificações 
                serão efetivas imediatamente após publicação. O uso contínuo implica aceitação das modificações.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={updateTextStyle}>Última atualização: Janeiro de 2026</Text>
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
    backgroundColor: 'transparent',
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
});
