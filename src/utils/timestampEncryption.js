// timestampEncryption.js
const textEncoder = new TextEncoder();

function getSecretKey() {
  const secret = import.meta.env.VITE_TIMESTAMP_SECRET_KEY;
  if (!secret) {
    throw new Error('缺少时间戳加密所需的密钥配置 VITE_TIMESTAMP_SECRET_KEY');
  }
  return secret;
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(plainText) {
  // 纯文本做 URL-safe Base64
  if (typeof window !== 'undefined' && window.btoa) {
    // 浏览器：btoa 只接收 Latin1，这里做 UTF-8 安全转换
    const encoded = window.btoa(unescape(encodeURIComponent(plainText)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  // Node
  return Buffer.from(plainText, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

// 关键：统一拿到 SubtleCrypto（浏览器 or Node）
async function getSubtle() {
  if (globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle; // 浏览器或 Node 20+
  }
  try {
    // Node 16+ 提供 webcrypto；用 node:crypto（不要用 'crypto'，避免被打包器替换成浏览器垫片）
    const { webcrypto } = await import('node:crypto');
    if (webcrypto?.subtle) return webcrypto.subtle;
  } catch (_) {
    // ignore
  }
  throw new Error('当前环境不支持 Web Crypto（SubtleCrypto）。请在 HTTPS/localhost 或升级 Node 版本。');
}

async function generateHmacHex(message) {
  const secret = getSecretKey();
  const subtle = await getSubtle();

  const key = await subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await subtle.sign('HMAC', key, textEncoder.encode(message));
  return bufferToHex(signature);
}

function normalizeTimestampInput(input) {
  if (input === null || input === undefined) {
    throw new Error('时间参数不能为空');
  }
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error('时间参数不是有效的日期');
    }
    return input.getTime();
  }
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new Error('时间参数不是有效的毫秒时间戳');
    }
    return Math.floor(input);
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('时间参数不是有效的日期格式');
  }
  return parsed.getTime();
}

export async function encryptTimestamp(input) {
  const millis = normalizeTimestampInput(input);
  if (millis < 0) {
    throw new Error('时间参数不能为负数');
  }
  const timestampPart = Math.floor(millis).toString();
  const signature = await generateHmacHex(timestampPart);
  const plainText = `${timestampPart}.${signature}`;
  return base64UrlEncode(plainText);
}

export default encryptTimestamp;
