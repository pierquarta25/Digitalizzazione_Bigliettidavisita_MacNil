import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Utilizziamo una fallback key locale per sviluppo. IN PRODUZIONE DEVE essere impostata in env.
// Deve essere esattamente di 32 bytes (256 bits).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_test_key_must_be_32_bytes'; 

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return text as null;
  
  // Garantiamo che la chiave sia di 32 byte passandola ad hash
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Errore durante la crittografia:', error);
    return text; 
  }
}

export function decrypt(text: string | null | undefined): string | null {
  if (!text || !text.includes(':')) return text as null; 
  
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);

  try {
    const parts = text.split(':');
    if (parts.length !== 3) return text; 
    
    const [ivHex, authTagHex, encryptedText] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Errore durante la decrittografia:', error);
    return '*** DATO CIFRATO ***';
  }
}
