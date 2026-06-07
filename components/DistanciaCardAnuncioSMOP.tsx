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
  const [textoDistancia, setTextoDistancia] = useState('Calculando...');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    let ativo = true;

    // 1. Diagnóstico de entrada de dados
    const statusCoordenadas = `U: ${userLat ?? 'nulo'},${userLon ?? 'nulo'} | B: ${business?.lat ?? 'nulo'},${business?.lon ?? 'nulo'}`;
    setDebugInfo(statusCoordenadas);
    console.log("=== DEBUG SMOP ===", statusCoordenadas);

    if (!userLat || !userLon || !business?.lat || !business?.lon) {
      if (business?.distanceM != null) {
        setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m (ar)` : `${(business.distanceM / 1000).toFixed(1)}km (ar)`);
      } else {
        setTextoDistancia('Sem Coordenadas');
      }
      return;
    }

    const buscarDistanciaRealOSRM = async () => {
      try {
        const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${userLon},${userLat};${business.lon},${business.lat}?overview=false`;
        
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
          throw new Error(`HTTP Erro: ${resposta.status}`);
        }
        
        const dados = await resposta.json();

        if (ativo && dados.code === 'Ok' && dados.routes && dados.routes[0]) {
          const metrosReais = dados.routes[0].distance;
          
          const formatoTexto = metrosReais < 1000 
            ? `${Math.round(metrosReais)}m` 
            : `${(metrosReais / 1000).toFixed(1)}km`;
            
          setTextoDistancia(formatoTexto);
          setDebugInfo(`Sucesso: ${formatoTexto}`);
        } else {
          throw new Error(dados.code || 'Estrutura JSON inválida');
        }
      } catch (error: any) {
        console.error('Erro na requisição SMOP/OSRM:', error);
        if (ativo) {
          setDebugInfo(`Erro: ${error?.message || 'Falha de Rede'}`);
          if (business.distanceM != null) {
            setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m (ar)` : `${(business.distanceM / 1000).toFixed(1)}km (ar)`);
          } else {
            setTextoDistancia('Erro na Rota');
          }
        }
      }
    };

    buscarDistanciaRealOSRM();

    return () => {
      ativo = false;
    };
  }, [userLat, userLon, business?.lat, business?.lon, business?.distanceM]);

  return (
    <View style={styles.distanceRow}>
      <Text style={[styles.businessDistance, isDarkMode && styles.businessDistanceDark]}>
        🎯 {textoDistancia}
      </Text>
      {/* Texto auxiliar temporário que vai te mostrar no celular ou navegador o que está acontecendo por baixo dos panos */}
      <Text style={{ fontSize: 9, color: 'gray', marginTop: 2 }}>
        {debugInfo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  distanceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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
