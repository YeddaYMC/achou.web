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
  // Estado inicial limpo. O componente vai calcular a rota real pelas ruas imediatamente.
  const [textoDistancia, setTextoDistancia] = useState('Calculando...');

  useEffect(() => {
    let ativo = true;

    // Se faltarem as coordenadas do usuário ou do anúncio, usa o Haversine padrão como contingência
    if (!userLat || !userLon || !business.lat || !business.lon) {
      if (business.distanceM != null) {
        const formatoHaversine = business.distanceM < 1000 
          ? `${Math.round(business.distanceM)}m` 
          : `${(business.distanceM / 1000).toFixed(1)}km`;
        setTextoDistancia(formatoHaversine);
      } else {
        setTextoDistancia('---');
      }
      return;
    }

    const buscarDistanciaRealOSRM = async () => {
      try {
        // CORREÇÃO: Endpoint estável com HTTPS certificado (OpenStreetMap) para aceitar chamadas na Web sem CORS/Mixed Content
        const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${userLon},${userLat};${business.lon},${business.lat}?overview=false`;
        
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (ativo && dados.code === 'Ok' && dados.routes && dados.routes[0]) {
          const metrosReais = dados.routes[0].distance; // Distância exata da rota por ruas/avenidas
          
          const formatoTexto = metrosReais < 1000 
            ? `${Math.round(metrosReais)}m` 
            : `${(metrosReais / 1000).toFixed(1)}km`;
            
          setTextoDistancia(formatoTexto);
        } else if (ativo && business.distanceM != null) {
          // Se a API falhar no parse, renderiza o plano B (Haversine) sem o sufixo travado
          setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m` : `${(business.distanceM / 1000).toFixed(1)}km`);
        }
      } catch (error) {
        console.warn('Erro ao processar rota real, aplicando Haversine de contingência:', error);
        if (ativo && business.distanceM != null) {
          setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m` : `${(business.distanceM / 1000).toFixed(1)}km`);
        }
      }
    };

    buscarDistanciaRealOSRM();

    return () => {
      ativo = false;
    };
    // CORREÇÃO DE ACURÁCIA: Escutando propriedades primitivas individuais para forçar a re-renderização precisa
  }, [userLat, userLon, business.lat, business.lon, business.distanceM]);

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
