import CryptoJS from 'crypto-js';

const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'dev_secret_key_change_me_in_prod';

/**
 * Desencripta un payload AES en texto plano y lo convierte de nuevo a JSON.
 */
export function decryptPayload(encryptedText: string): any {
  if (!encryptedText || typeof encryptedText !== 'string') return null;
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    const decryptedJsonString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedJsonString);
  } catch (e) {
    console.error('Error desencriptando payload manual:', e);
    return null;
  }
}
