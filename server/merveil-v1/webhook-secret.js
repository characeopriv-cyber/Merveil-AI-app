import crypto from 'node:crypto';

const key=()=>{
 const raw=process.env.MERVEIL_WEBHOOK_ENCRYPTION_KEY||process.env.MERVEIL_WEBHOOK_SECRET||'';
 if(!raw) throw new Error('Webhook encryption key is not configured');
 return crypto.createHash('sha256').update(raw).digest();
};
export function encryptWebhookSecret(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const ciphertext=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;}
export function decryptWebhookSecret(value){const [iv,tag,data]=String(value||'').split('.');if(!iv||!tag||!data) throw new Error('Invalid encrypted webhook secret');const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');}
