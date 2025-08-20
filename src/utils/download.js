/**
 * 下载文件
 * @param {Blob} blob - 文件数据
 * @param {string} filename - 文件名
 */
export const downloadFile = (blob, filename) => {
  // 创建下载链接
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 下载文本文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} type - MIME类型
 */
export const downloadTextFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  downloadFile(blob, filename)
}

/**
 * 下载JSON文件
 * @param {Object} data - 要下载的数据对象
 * @param {string} filename - 文件名
 */
export const downloadJsonFile = (data, filename) => {
  const jsonStr = JSON.stringify(data, null, 2)
  downloadTextFile(jsonStr, filename, 'application/json')
}

/**
 * 下载CSV文件
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @param {string} filename - 文件名
 */
export const downloadCsvFile = (data, headers, filename) => {
  let csvContent = ''
  
  // 添加表头
  if (headers && headers.length > 0) {
    csvContent += headers.join(',') + '\n'
  }
  
  // 添加数据行
  data.forEach(row => {
    const values = Array.isArray(row) ? row : Object.values(row)
    const escapedValues = values.map(value => {
      // 处理包含逗号、引号或换行符的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent += escapedValues.join(',') + '\n'
  })
  
  // 添加BOM以支持中文
  const BOM = '\uFEFF'
  downloadTextFile(BOM + csvContent, filename, 'text/csv')
}

/**
 * 通过URL下载文件
 * @param {string} url - 文件URL
 * @param {string} filename - 文件名（可选）
 */
export const downloadFromUrl = async (url, filename) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const finalFilename = filename || getFilenameFromUrl(url) || 'download'
    downloadFile(blob, finalFilename)
    
  } catch (error) {
    console.error('下载失败:', error)
    throw error
  }
}

/**
 * 从URL中提取文件名
 * @param {string} url - URL地址
 * @returns {string} 文件名
 */
const getFilenameFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname
    return pathname.split('/').pop() || ''
  } catch {
    return ''
  }
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名
 */
export const getFileExtension = (filename) => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : ''
}

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array} allowedTypes - 允许的文件类型数组
 * @returns {boolean} 是否为允许的类型
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes || allowedTypes.length === 0) return false
  
  const fileExtension = getFileExtension(file.name)
  const mimeType = file.type
  
  return allowedTypes.some(type => {
    // 支持扩展名匹配（如 'jpg', 'png'）
    if (type.startsWith('.')) {
      return fileExtension === type.slice(1)
    }
    // 支持MIME类型匹配（如 'image/*', 'application/pdf'）
    if (type.includes('/')) {
      if (type.endsWith('/*')) {
        return mimeType.startsWith(type.slice(0, -1))
      }
      return mimeType === type
    }
    // 支持纯扩展名匹配（如 'jpg', 'png'）
    return fileExtension === type.toLowerCase()
  })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * 读取文件内容
 * @param {File} file - 文件对象
 * @param {string} readAs - 读取方式: 'text', 'dataURL', 'arrayBuffer', 'binaryString'
 * @returns {Promise} 文件内容
 */
export const readFile = (file, readAs = 'text') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e.target.error)
    
    switch (readAs) {
      case 'text':
        reader.readAsText(file)
        break
      case 'dataURL':
        reader.readAsDataURL(file)
        break
      case 'arrayBuffer':
        reader.readAsArrayBuffer(file)
        break
      case 'binaryString':
        reader.readAsBinaryString(file)
        break
      default:
        reject(new Error(`不支持的读取方式: ${readAs}`))
    }
  })
}

/**
 * 批量下载文件
 * @param {Array} files - 文件数组 [{blob, filename}, ...]
 * @param {number} delay - 下载间隔（毫秒）
 */
export const downloadMultipleFiles = async (files, delay = 100) => {
  for (let i = 0; i < files.length; i++) {
    const { blob, filename } = files[i]
    downloadFile(blob, filename)
    
    // 添加延迟避免浏览器阻止多个下载
    if (i < files.length - 1 && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
