const textEncoder = new TextEncoder()

function getSecretKey() {
  const secret = import.meta.env.VITE_TIMESTAMP_SECRET_KEY
  if (!secret) {
    throw new Error('缺少时间戳加密所需的密钥配置 VITE_TIMESTAMP_SECRET_KEY')
  }
  return secret
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function base64UrlEncode(plainText) {
  if (typeof window !== 'undefined' && window.btoa) {
    const encoded = window.btoa(unescape(encodeURIComponent(plainText)))
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  return Buffer.from(plainText, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function generateHmacHex(message) {
  const secret = getSecretKey()
  if (globalThis.crypto?.subtle) {
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      textEncoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await globalThis.crypto.subtle.sign('HMAC', key, textEncoder.encode(message))
    return bufferToHex(signature)
  }

  const { createHmac } = await import('crypto')
  return createHmac('sha256', secret).update(message).digest('hex')
}

function normalizeTimestampInput(input) {
  if (input === null || input === undefined) {
    throw new Error('时间参数不能为空')
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error('时间参数不是有效的日期')
    }
    return input.getTime()
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new Error('时间参数不是有效的毫秒时间戳')
    }
    return Math.floor(input)
  }

  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('时间参数不是有效的日期格式')
  }
  return parsed.getTime()
}

export async function encryptTimestamp(input) {
  const millis = normalizeTimestampInput(input)
  if (millis < 0) {
    throw new Error('时间参数不能为负数')
  }
  const timestampPart = Math.floor(millis).toString()
  const signature = await generateHmacHex(timestampPart)
  const plainText = `${timestampPart}.${signature}`
  return base64UrlEncode(plainText)
}

export default encryptTimestamp
