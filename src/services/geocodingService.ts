type GeocodeSource = 'cep' | 'endereco';

export interface GeocodeInput {
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  source: GeocodeSource;
  displayName?: string;
}

export interface AddressDetails {
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
}

export interface CepDetailsResult {
  lat?: number;
  lon?: number;
  details: AddressDetails;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_COUNTRY = 'Brasil';
const NOMINATIM_CONTACT_EMAIL = 'suporte@achou.app';
const REQUEST_TIMEOUT_MS = 12000;

const onlyDigits = (value: string) => (value || '').replace(/\D/g, '');
const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

function buildAddressParts(input: GeocodeInput): string[] {
  return [
    input.street,
    input.number,
    input.neighborhood,
    input.city,
    input.state,
    input.country || DEFAULT_COUNTRY,
  ]
    .map((p) => String(p || '').trim())
    .filter(Boolean);
}

function buildQueryFromAddress(input: GeocodeInput): string {
  return buildAddressParts(input).join(', ');
}

function buildNominatimParams(input: GeocodeInput) {
  const streetParts = [input.number, input.street]
    .map((p) => String(p || '').trim())
    .filter(Boolean);

  return {
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'br',
    addressdetails: '1',
    email: NOMINATIM_CONTACT_EMAIL,
    street: streetParts.join(' '),
    city: String(input.city || '').trim(),
    state: String(input.state || '').trim(),
    country: String(input.country || DEFAULT_COUNTRY).trim(),
    postalcode: onlyDigits(String(input.cep || '')) || undefined,
  };
}

function buildFuzzyAddressCandidates(input: GeocodeInput): string[] {
  const streetParts = [input.number, input.street]
    .map((p) => String(p || '').trim())
    .filter(Boolean);

  const fullAddress = buildAddressParts(input);
  const streetCityState = [
    streetParts.join(' '),
    input.neighborhood,
    input.city,
    input.state,
    input.country || DEFAULT_COUNTRY,
  ]
    .map((p) => String(p || '').trim())
    .filter(Boolean);

  const streetCity = [
    streetParts.join(' '),
    input.city,
    input.state,
    input.country || DEFAULT_COUNTRY,
  ]
    .map((p) => String(p || '').trim())
    .filter(Boolean);

  return [
    fullAddress.join(', '),
    streetCityState.join(', '),
    streetCity.join(', '),
  ].filter(Boolean);
}

function chooseBestResult(data: any[]): any | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  const scored = data
    .map((item) => {
      const importance = Number(item?.importance ?? 0);
      const hasHouseNumber = Boolean(item?.address?.house_number || item?.address?.road);
      const hasCity = Boolean(item?.address?.city || item?.address?.town || item?.address?.village);
      const hasState = Boolean(item?.address?.state);
      const rank = importance + (hasHouseNumber ? 0.2 : 0) + (hasCity ? 0.1 : 0) + (hasState ? 0.05 : 0);

      return { item, rank };
    })
    .sort((a, b) => b.rank - a.rank);

  return scored[0]?.item ?? null;
}

async function fetchNominatimByQuery(query: string, input?: GeocodeInput): Promise<GeocodeResult | null> {
  if (!query) return null;
  const runRequest = async (url: string, withUserAgent: boolean) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Accept-Language': 'pt-BR',
      };

      if (withUserAgent) {
        headers['User-Agent'] = `AchouAppRN/1.0 (${NOMINATIM_CONTACT_EMAIL})`;
      }

      return await fetch(url, {
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const parseResult = async (response: Response) => {
    if (!response.ok) return null;
    const data = await response.json();
    const first = chooseBestResult(data);
    if (!first) return null;

    const lat = Number(first?.lat);
    const lon = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      lat,
      lon,
      source: 'endereco' as const,
      displayName: first?.display_name,
    };
  };

  const structuredParams = new URLSearchParams();
  const structured = buildNominatimParams(input || {});
  Object.entries(structured).forEach(([key, value]) => {
    if (value) structuredParams.set(key, String(value));
  });

  const structuredUrl = `${NOMINATIM_BASE_URL}?${structuredParams.toString()}`;

  // Tentativa 1/2: por query estruturada (com e sem User-Agent)
  for (const withUserAgent of [true, false]) {
    try {
      const response = await runRequest(structuredUrl, withUserAgent);
      const result = await parseResult(response);
      if (result) return result;
    } catch {
      // Continua para próximas tentativas
    }
  }

  // Tentativa 3/4/5: endereço completo em texto livre, priorizando número + rua
  const addressCandidates = buildFuzzyAddressCandidates(input || {});
  for (const candidate of addressCandidates) {
    const qParams = new URLSearchParams({
      format: 'jsonv2',
      limit: '5',
      countrycodes: 'br',
      addressdetails: '1',
      email: NOMINATIM_CONTACT_EMAIL,
      q: candidate,
    });

    const queryUrl = `${NOMINATIM_BASE_URL}?${qParams.toString()}`;

    for (const withUserAgent of [true, false]) {
      try {
        const response = await runRequest(queryUrl, withUserAgent);
        const result = await parseResult(response);
        if (result) return result;
      } catch {
        // Continua para próximas tentativas
      }
    }
  }

  // Tentativa final: query por CEP estruturado, somente como fallback.
  const cepFromQuery = query.match(/\b\d{5}-?\d{3}\b/)?.[0];
  if (cepFromQuery) {
    const postalParams = new URLSearchParams({
      format: 'jsonv2',
      limit: '5',
      countrycodes: 'br',
      addressdetails: '1',
      email: NOMINATIM_CONTACT_EMAIL,
      postalcode: cepFromQuery,
      country: 'Brasil',
    });
    const postalUrl = `${NOMINATIM_BASE_URL}?${postalParams.toString()}`;

    for (const withUserAgent of [true, false]) {
      try {
        const response = await runRequest(postalUrl, withUserAgent);
        const result = await parseResult(response);
        if (result) return result;
      } catch {
        // Sem throw: devolve null no fim.
      }
    }
  }

  return null;
}

export async function geocodeBusinessAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  const cepDigits = onlyDigits(input.cep || '');
  const addressCandidates = buildFuzzyAddressCandidates(input);

  // Primeiro tenta endereço completo com número (mais preciso que CEP)
  for (const addressQuery of addressCandidates) {
    const addressResult = await fetchNominatimByQuery(addressQuery, input);
    if (addressResult) {
      return {
        ...addressResult,
        source: 'endereco',
      };
    }
  }

  // Fallback por CEP (somente quando o endereço completo não funcionar)
  if (cepDigits.length === 8) {
    const cepCandidates = [
      `${formatCep(cepDigits)}, ${input.country || DEFAULT_COUNTRY}`,
      `${cepDigits}, ${input.country || DEFAULT_COUNTRY}`,
      formatCep(cepDigits),
      cepDigits,
    ];

    for (const cepQuery of cepCandidates) {
      const cepResult = await fetchNominatimByQuery(cepQuery, input);
      if (cepResult) {
        return {
          ...cepResult,
          source: 'cep',
        };
      }
    }
  }

  const query = buildQueryFromAddress(input);
  if (!query) return null;

  return fetchNominatimByQuery(query, input);
}

// Busca detalhes de endereço pelo CEP (para auto-preenchimento em formulários)
export async function fetchCepDetails(cep: string): Promise<CepDetailsResult | null> {
  try {
    const cepClean = onlyDigits(cep);
    if (cepClean.length !== 8) return null;

    // 1) ViaCEP costuma trazer logradouro/bairro com melhor qualidade para CEP no Brasil.
    let viaCepDetails: AddressDetails = {};
    try {
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (viaCepResponse.ok) {
        const viaCepData = await viaCepResponse.json();
        if (!viaCepData?.erro) {
          viaCepDetails = {
            road: String(viaCepData.logradouro || '').trim(),
            suburb: String(viaCepData.bairro || '').trim(),
            city: String(viaCepData.localidade || '').trim(),
            state: String(viaCepData.uf || '').trim(),
          };
        }
      }
    } catch {
      // Silencioso: continua fallback no Nominatim.
    }

    const params = new URLSearchParams({
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'br',
      addressdetails: '1',
      email: NOMINATIM_CONTACT_EMAIL,
      postalcode: cepClean,
      country: 'Brasil',
    });

    const url = `${NOMINATIM_BASE_URL}?${params.toString()}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
          'User-Agent': `AchouAppRN/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        // Se Nominatim falhar mas ViaCEP tiver retornado dados, devolve mesmo assim.
        const hasViaCepData = Boolean(viaCepDetails.road || viaCepDetails.suburb || viaCepDetails.city || viaCepDetails.state);
        return hasViaCepData ? { details: viaCepDetails } : null;
      }
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        const hasViaCepData = Boolean(viaCepDetails.road || viaCepDetails.suburb || viaCepDetails.city || viaCepDetails.state);
        return hasViaCepData ? { details: viaCepDetails } : null;
      }

      const first = data[0];
      const lat = Number(first?.lat);
      const lon = Number(first?.lon);

      const address = first?.address || {};
      const nominatimDetails: AddressDetails = {
        road: address.road || address.address100 || '',
        suburb: address.suburb || address.address50 || '',
        city: address.city || address.town || address.village || address.address75 || '',
        state: address.state || address.address70 || '',
      };

      const mergedDetails: AddressDetails = {
        // ViaCEP é priorizado para rua/bairro no Brasil.
        road: viaCepDetails.road || nominatimDetails.road || '',
        suburb: viaCepDetails.suburb || nominatimDetails.suburb || '',
        city: viaCepDetails.city || nominatimDetails.city || '',
        state: viaCepDetails.state || nominatimDetails.state || '',
      };

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        const hasAnyData = Boolean(mergedDetails.road || mergedDetails.suburb || mergedDetails.city || mergedDetails.state);
        return hasAnyData ? { details: mergedDetails } : null;
      }

      return {
        lat,
        lon,
        details: mergedDetails,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn('Erro ao buscar detalhes do CEP:', error);
    return null;
  }
}
