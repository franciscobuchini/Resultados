import CryptoJS from 'crypto-js';

const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'dev_secret_key_change_me_in_prod';

export function decryptPayload(encryptedText: string): any {
  if (!encryptedText || typeof encryptedText !== 'string') return null;

  // Si ya es JSON plano, devolverlo directo sin intentar desencriptar
  const trimmed = encryptedText.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // no era JSON válido, intentar desencriptar igual
    }
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    const decryptedJsonString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedJsonString);
  } catch (e) {

    return null;
  }
}