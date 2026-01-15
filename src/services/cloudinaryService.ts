import { Cloudinary } from '@cloudinary/url-gen';

// Configuração do Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: 'dkwhytmtk', // Seu Cloud Name
  },
  url: {
    secure: true, // Sempre usar HTTPS
  },
});

// Opções de upload (Unsigned Preset)
const uploadOptions = {
  upload_preset: 'ACHOU_APP_UPLOADS', // Nome do preset criado no Cloudinary
  unsigned: true, // Unsigned upload (seguro para mobile)
};

/**
 * Cria um slug sanitizado a partir do nome do negócio
 * @param businessName - Nome do negócio (ex: "PetShop AuAu")
 * @returns Slug sanitizado (ex: "petshop_auau")
 */
const createSlug = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por _
    .replace(/^_+|_+$/g, ''); // Remove _ do início e fim
};

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param fileUri - URI da imagem local (ex: file:///data/user/0/.../image.jpg)
 * @param businessName - Nome do negócio (ex: "PetShop AuAu")
 * @param businessId - ID único do anúncio (ex: "abc123xyz")
 * @param imageIndex - Índice da imagem (1, 2, 3...)
 * @returns Promise com a URL segura da imagem no Cloudinary
 */
export const uploadImage = async (
  fileUri: string,
  businessName: string,
  businessId: string,
  imageIndex: number
): Promise<string> => {
  try {
    // Cria o publicId no formato: petshop_auau_abc123_1
    const slug = createSlug(businessName);
    const publicId = `${slug}_${businessId}_${imageIndex}`;

    console.log('📤 Fazendo upload para Cloudinary...', { publicId, fileUri });

    // Criar FormData para o upload
    const formData = new FormData();
    
    // Adicionar o arquivo
    // No web, fileUri é um blob URL. No mobile, é um file:// URI
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    formData.append('file', blob);
    formData.append('upload_preset', uploadOptions.upload_preset);
    formData.append('public_id', publicId);
    formData.append('folder', 'ACHOU/ANUNCIOS');

    // Upload para Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/dkwhytmtk/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Erro no upload:', errorText);
      throw new Error(`Upload falhou: ${uploadResponse.status} ${errorText}`);
    }

    const data = await uploadResponse.json();
    console.log('✅ Upload realizado com sucesso:', data.secure_url);
    
    return data.secure_url;
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    throw error;
  }
};

/**
 * Faz upload de múltiplas imagens
 * @param fileUris - Array de URIs de imagens locais
 * @param businessName - Nome do negócio (ex: "PetShop AuAu")
 * @param businessId - ID único do anúncio (ex: "abc123xyz")
 * @returns Promise com array de URLs seguras das imagens
 */
export const uploadMultipleImages = async (
  fileUris: string[],
  businessName: string,
  businessId: string
): Promise<string[]> => {
  try {
    const uploadPromises = fileUris.map((uri, index) => 
      uploadImage(uri, businessName, businessId, index + 1)
    );
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Erro ao fazer upload de múltiplas imagens:', error);
    throw error;
  }
};

/**
 * Valida quantidade de imagens baseado no nível do usuário
 * @param nivel - Nível do anunciante (1, 2, 3, 4)
 * @param quantidadeAtual - Quantidade de imagens que o usuário quer enviar
 * @returns true se permitido, false caso contrário
 */
export const validateImageCount = (
  nivel: 1 | 2 | 3 | 4,
  quantidadeAtual: number
): { valid: boolean; maxAllowed: number } => {
  const limites = {
    1: 1,
    2: 1,
    3: 3,
    4: 5,
  };

  const maxAllowed = limites[nivel];
  return {
    valid: quantidadeAtual <= maxAllowed,
    maxAllowed,
  };
};

export { cld };

