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

  useEffect(() => {
    let ativo = true;

    if (!userLat || !userLon || !business?.lat || !business?.lon) {
      if (business?.distanceM != null) {
        setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m` : `${(business.distanceM / 1000).toFixed(1)}km`);
      } else {
        setTextoDistancia('---');
      }
      return;
    }

    // CORREÇÃO INTELEGENTE DE INVERSÃO:
    // No Brasil, a longitude fica na casa dos -45 a -55 e a latitude na casa dos -10 a -30.
    // Se o userLat que chegou for menor que -35, significa que as variáveis vieram invertidas da T1.
    let latUsuario = userLat;
    let lonUsuario = userLon;
    if (userLat < -35 && userLon > -35) {
      latUsuario = userLon;
      lonUsuario = userLat;
    }

    let latNegocio = business.lat;
    let lonNegocio = business.lon;
    if (business.lat < -35 && business.lon > -35) {
      latNegocio = business.lon;
      lonNegocio = business.lat;
    }

    const buscarDistanciaRealOSRM = async () => {
      try {
        // Agora a URL é montada com a garantia matemática de que Longitude e Latitude estão nos lugares certos
        const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lonUsuario},${latUsuario};${lonNegocio},${latNegocio}?overview=false`;
        
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (ativo && dados.code === 'Ok' && dados.routes && dados.routes[0]) {
          const metrosReais = dados.routes[0].distance; // Distância real por ruas
          
          const formatoTexto = metrosReais < 1000 
            ? `${Math.round(metrosReais)}m` 
            : `${(metrosReais / 1000).toFixed(1)}km`;
            
          setTextoDistancia(formatoTexto);
        } else if (ativo && business.distanceM != null) {
          setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m` : `${(business.distanceM / 1000).toFixed(1)}km`);
        }
      } catch (error) {
        console.warn('Erro ao processar rota real, aplicando Haversine:', error);
        if (ativo && business.distanceM != null) {
          setTextoDistancia(business.distanceM < 1000 ? `${Math.round(business.distanceM)}m` : `${(business.distanceM / 1000).toFixed(1)}km`);
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
