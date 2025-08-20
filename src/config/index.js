// 应用配置
export const appConfig = {
  // API 相关配置
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://patvs.lenovo.com',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
    ignoreSSL: import.meta.env.VITE_IGNORE_SSL === 'true',
    protocol: import.meta.env.VITE_API_BASE_URL?.startsWith('https://') ? 'HTTPS' : 'HTTP'
  },
  
  // 应用信息
  app: {
    name: import.meta.env.VITE_APP_NAME || 'TestManagementSystem',
    title: import.meta.env.VITE_APP_TITLE || '测试管理系统',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  },
  
  // 环境信息
  env: {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    nodeEnv: import.meta.env.NODE_ENV
  }
}

// 导出常用配置
export const { api: apiConfig, app: appInfo, env: envInfo } = appConfig

// 开发环境打印配置信息
if (envInfo.isDev) {
  console.log('🔧 App Config:', appConfig)
  console.log(`🌐 API Protocol: ${apiConfig.protocol}`)
  
  if (apiConfig.protocol === 'HTTPS' && apiConfig.ignoreSSL) {
    console.warn('⚠️  HTTPS SSL Certificate verification is DISABLED!')
  } else if (apiConfig.protocol === 'HTTP') {
    console.info('ℹ️  Using HTTP protocol (development mode)')
  }
}
