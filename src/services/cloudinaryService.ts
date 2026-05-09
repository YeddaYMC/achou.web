import { Cloudinary } from '@cloudinary/url-gen';
import { deleteCloudinaryImagesSecure } from './cloudinaryCloudFunctionService';

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

    const isDataUri = String(fileUri).startsWith('data:image');

    if (isDataUri) {
      // Fallback robusto para Expo: upload direto de base64/data URI
      formData.append('file', fileUri as any);
    } else {
      // Em React Native/Expo, usar uri direto é mais estável do que fetch(file://...)
      const uriParts = String(fileUri).split('.');
      const extension = (uriParts[uriParts.length - 1] || 'jpg').toLowerCase();
      const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
      const fileName = `${publicId}.${extension === 'png' || extension === 'webp' ? extension : 'jpg'}`;

      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      } as any);
    }
    formData.append('upload_preset', uploadOptions.upload_preset);
    formData.append('public_id', publicId);
    formData.append('folder', 'ACHOU/ANUNCIOS');

    // Upload para Cloudinary
    let uploadResponse: Response | null = null;
    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/dkwhytmtk/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        break;
      } catch (err) {
        lastError = err;
        if (attempt === 2) throw err;
      }
    }

    if (!uploadResponse) {
      throw lastError || new Error('Falha de rede no upload para Cloudinary');
    }

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

// Extrai o public_id de uma URL do Cloudinary (ex.: pasta/arquivo sem extensão)
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url || !url.includes('res.cloudinary.com')) return null;

    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const afterUpload = url.substring(uploadIndex + '/upload/'.length);
    const pathWithoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutQuery = pathWithoutVersion.split('?')[0];
    const withoutExtension = withoutQuery.replace(/\.[a-zA-Z0-9]+$/, '');

    return withoutExtension || null;
  } catch {
    return null;
  }
};

/**
 * Deleta imagens do Cloudinary de forma segura via Cloud Function Firebase.
 * Observação: a Cloud Function cuida da autenticação e usa credenciais seguras do servidor.
 */
export const deleteCloudinaryImagesByUrls = async (
  imageUrls: string[]
): Promise<{ success: boolean; deleted: number; skipped: number; error?: string }> => {
  try {
    const publicIds = (imageUrls || [])
      .map(extractPublicIdFromUrl)
      .filter((id): id is string => Boolean(id));

    if (publicIds.length === 0) {
      return { success: true, deleted: 0, skipped: imageUrls.length };
    }

    // Chama a Cloud Function segura
    const result = await deleteCloudinaryImagesSecure(publicIds);

    return {
      success: result.success,
      deleted: result.deleted || 0,
      skipped: result.skipped || 0,
      error: result.errors?.join('; ') || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      deleted: 0,
      skipped: imageUrls.length,
      error: error?.message || 'Falha ao excluir imagens no Cloudinary.',
    };
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

