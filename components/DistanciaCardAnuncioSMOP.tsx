import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DistanciaProps {
  userLat: number | undefined | null;
  userLon: number | undefined | null;
  business: {
    lat: number | undefined | null;
    lon: number | undefined | null;
    distanceM: number | null;
  };
  isDarkMode: boolean;
}

export default function DistanciaCardAnuncioSMOP({ userLat, userLon, business, isDarkMode }: DistanciaProps) {
  // Começa exibindo o valor do Haversine (convertido) enquanto o OSRM calcula em background
  const [textoDistancia, setTextoDistancia] = useState(() => {
    if (business.distanceM != null) {
      return business.distanceM < 1000 
        ? `${Math.round(business.distanceM)}m (ar)` 
        : `${(business.distanceM / 1000).toFixed(1)}km (ar)`;
    }
    return 'Calculando...';
  });

  useEffect(() => {
    // Só dispara a busca se tiver as coordenadas do usuário e do card
    if (!userLat || !userLon || !business.lat || !business.lon) return;

    let ativo = true;

    const buscarDistanciaRealOSRM = async () => {
      try {
        // ATENÇÃO: OSRM exige Longitude ANTES da Latitude na URL
        const url = `http://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${business.lon},${business.lat}?overview=false`;
        
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (ativo && dados.code === 'Ok' && dados.routes && dados.routes[0]) {
          const metrosReais = dados.routes[0].distance; // Distância em metros pelas ruas
          
          // Formata o texto final bonitinho para o Card
          const formatoTexto = metrosReais < 1000 
            ? `${Math.round(metrosReais)}m` 
            : `${(metrosReais / 1000).toFixed(1)}km`;
            
          setTextoDistancia(formatoTexto);
        }
      } catch (error) {
        console.warn('Erro ao buscar rota real no OSRM, mantendo Haversine:', error);
      }
    };

    buscarDistanciaRealOSRM();

    // Limpa o efeito caso o card saia da tela antes da API responder
    return () => {
      ativo = false;
    };
  }, [userLat, userLon, business.lat, business.lon]);

  return (
    <View style={styles.distanceRow}>
      <Text style={[styles.businessDistance, isDarkMode && styles.businessDistanceDark]}>
        🎯 {textoDistancia}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessDistance: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  businessDistanceDark: {
    color: '#38bdf8',
  },
});
