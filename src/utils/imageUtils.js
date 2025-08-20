import { ElMessage } from 'element-plus'

// 格式化图片时间
export const formatImageTime = (time) => {
  if (!time) return ''
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

// 格式化文件大小
export const formatSize = (size) => {
  if (!size && size !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let s = size
  let i = 0
  while (s >= 1024 && i < units.length - 1) {
    s /= 1024
    i++
  }
  return `${s.toFixed(s >= 10 ? 0 : 1)} ${units[i]}`
}

// 复制图片链接
export const copyImageUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('图片链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 下载单张图片
export const downloadSingleImage = (image) => {
  try {
    const link = document.createElement('a')
    link.href = image.url
    link.download = image.name || 'image'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success(`开始下载: ${image.name}`)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 标准化图片数据
export const normalizeImageData = (executionImages, executionId) => {
  return executionImages.map((img, index) => ({
    id: img.stored_file_name || img.original_file_name || `img_${index}`,
    name: img.original_file_name || `图片_${index + 1}`,
    url: img.url,
    time: img.time,
    size: img.file_size,
    executionId: img.execution_id || executionId
  })).filter(img => img.url)
}
