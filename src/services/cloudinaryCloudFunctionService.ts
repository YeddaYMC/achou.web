import { FirebaseApp as FirebaseAppType } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

let functionsInstance: any = null;
let functionsFallbackInstance: any = null;

export const initCloudinaryService = (app: FirebaseAppType, emulatorEnabled: boolean = false) => {
  const functions = getFunctions(app, 'southamerica-east1'); // Região preferencial
  const fallbackFunctions = getFunctions(app, 'us-central1'); // Compatibilidade com deploy antigo

  if (emulatorEnabled) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectFunctionsEmulator(fallbackFunctions, 'localhost', 5001);
  }

  functionsInstance = functions;
  functionsFallbackInstance = fallbackFunctions;
  return functions;
};

/**
 * Deleta imagens do Cloudinary via Cloud Function segura
 * @param publicIds - Array de IDs públicos das imagens no Cloudinary
 * @returns Promise com resultado da operação
 */
export const deleteCloudinaryImagesSecure = async (publicIds: string[]) => {
  if (!functionsInstance) {
    throw new Error('Cloud Functions não inicializado. Chame initCloudinaryService primeiro.');
  }

  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return {
      success: true,
      deleted: 0,
      skipped: 0,
      message: 'Nenhuma imagem para deletar.',
    };
  }

  try {
    const deleteCloudinaryImages = httpsCallable(
      functionsInstance,
      'deleteCloudinaryImages'
    );

    const result = await deleteCloudinaryImages({ publicIds });

    console.log('✓ Deleção no Cloudinary bem-sucedida:', result.data);
    return result.data;
  } catch (error: any) {
    const code = String(error?.code || '');

    // Fallback para região padrão quando função ainda estiver em us-central1
    if ((code === 'functions/not-found' || code === 'not-found') && functionsFallbackInstance) {
      try {
        const deleteCloudinaryImagesFallback = httpsCallable(
          functionsFallbackInstance,
          'deleteCloudinaryImages'
        );

        const fallbackResult = await deleteCloudinaryImagesFallback({ publicIds });
        console.log('✓ Deleção no Cloudinary (fallback us-central1) bem-sucedida:', fallbackResult.data);
        return fallbackResult.data;
      } catch (fallbackError: any) {
        console.error('❌ Erro no fallback da Cloud Function:', fallbackError);
      }
    }

    console.error('❌ Erro ao chamar Cloud Function:', error);

    // Tratamento de erro específico
    if (code === 'functions/unauthenticated' || code === 'unauthenticated') {
      throw new Error('Você precisa estar autenticado para deletar imagens.');
    }

    if (code === 'functions/internal' || code === 'internal') {
      throw new Error(
        error.message || 'Erro interno ao deletar imagens no servidor.'
      );
    }

    if (code === 'functions/not-found' || code === 'not-found') {
      throw new Error('Função de deleção não encontrada no Firebase. Faça deploy das functions.');
    }

    if (code === 'functions/permission-denied' || code === 'permission-denied') {
      throw new Error('Sem permissão para executar Cloud Function no projeto Firebase atual.');
    }

    throw new Error(
      error.message || 'Falha ao deletar imagens. Tente novamente.'
    );
  }
};

/**
 * Health check da Cloud Function
 */
export const checkCloudFunctionHealth = async () => {
  if (!functionsInstance) {
    return { status: 'not_initialized' };
  }

  try {
    const healthCheck = httpsCallable(functionsInstance, 'healthCheck');
    const result = await healthCheck({});
    return result.data;
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    return { status: 'error' };
  }
};
