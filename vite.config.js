import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.184.37.17:8888', // Flask 后端地址和端口
        //target: 'https://patvs.lenovo.com',
        changeOrigin: true,
        secure: false,
      //  rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  }
})