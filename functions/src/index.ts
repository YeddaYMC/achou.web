import axios from 'axios';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Inicializa Firebase Admin
admin.initializeApp();

// Configurações do Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dkwhytmtk';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

/**
 * Cloud Function para deletar imagens do Cloudinary de forma segura
 * Autenticação: requer Firebase Auth token válido
 * 
 * Esperado:
 * {
 *   publicIds: ['image_id_1', 'image_id_2']
 * }
 * 
 * Retorna:
 * {
 *   success: true,
 *   deleted: 2,
 *   skipped: 0,
 *   message: "..."
 * }
 */
export const deleteCloudinaryImages = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
  // Valida autenticação do Firebase
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado. Faça login e tente novamente.'
    );
  }

  const uid = context.auth.uid;
  console.log(`[DELETE] Usuário ${uid} solicitou deleção de imagens`);

  // Valida payload
  const { publicIds } = data;
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return {
      success: true,
      deleted: 0,
      skipped: 0,
      message: 'Nenhuma imagem para deletar.',
    };
  }

  // Valida configuração do Cloudinary
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary API credentials não configuradas');
    throw new functions.https.HttpsError(
      'internal',
      'Credenciais do Cloudinary não estão configuradas no servidor.'
    );
  }

  let deletedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  try {
    // Processa cada imagem
    for (const publicId of publicIds) {
      try {
        console.log(`[DELETE] Deletando: ${publicId}`);

        // URL da API do Cloudinary para deletar by public_id
        const deleteUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/by_public_ids`;

        const response = await axios.post(
          deleteUrl,
          { public_ids: [publicId] },
          {
            auth: {
              username: CLOUDINARY_API_KEY,
              password: CLOUDINARY_API_SECRET,
            },
            timeout: 5000,
          }
        );

        if (response.status === 200) {
          deletedCount++;
          console.log(`✓ Deletado: ${publicId}`);
        } else {
          skippedCount++;
          errors.push(`${publicId}: status ${response.status}`);
        }
      } catch (error: any) {
        skippedCount++;
        const errorMsg = error?.response?.data?.error?.message || error?.message || 'Erro desconhecido';
        errors.push(`${publicId}: ${errorMsg}`);
        console.warn(`⚠ Falha ao deletar ${publicId}:`, errorMsg);
      }
    }

    const message = `${deletedCount} imagem(ns) deletada(s)${skippedCount > 0 ? `, ${skippedCount} falharam` : ''}`;
    console.log(`[DELETE] Resultado: ${message}`);

    return {
      success: skippedCount === 0,
      deleted: deletedCount,
      skipped: skippedCount,
      message,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error('❌ Erro ao deletar imagens:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Falha ao deletar imagens: ${error?.message || 'Erro desconhecido'}`
    );
  }
  });

/**
 * Cloud Function para health check
 */
export const healthCheck = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      cloudinaryConfigured: Boolean(CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
      region: 'southamerica-east1',
    };
  });
