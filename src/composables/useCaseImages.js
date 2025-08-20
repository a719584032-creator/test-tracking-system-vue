import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { casesApi } from '@/api/cases'

export function useCaseImages() {
  const showDialog = ref(false)
  const currentImages = ref([])
  const currentExecutionId = ref(null)
  const imageLoading = ref(false)
  const imageError = ref(false)
  const imageCache = ref(new Map())

  const openImages = async (row) => {
    if (!row.ExecutionID) {
      ElMessage.warning('该用例没有执行记录')
      return
    }
    const execId = row.ExecutionID
    currentExecutionId.value = execId
    showDialog.value = true
    imageError.value = false
    currentImages.value = []

    if (imageCache.value.has(execId)) {
      currentImages.value = imageCache.value.get(execId)
      return
    }

    row._imageLoading = true
    imageLoading.value = true
    try {
      const res = await casesApi.getImages(execId)
      if (res.data && res.data.images) {
        const list = res.data.images[execId.toString()]
        if (Array.isArray(list) && list.length) {
          const normalized = list
            .map((img, i) => ({
              id: img.stored_file_name || img.original_file_name || `img_${i}`,
              name: img.original_file_name || `图片_${i + 1}`,
              url: img.url,
              time: img.time,
              size: img.file_size,
              executionId: img.execution_id || execId
            }))
            .filter(x => x.url)
          currentImages.value = normalized
            imageCache.value.set(execId, normalized)
          ElMessage.success(`找到 ${normalized.length} 张图片`)
        } else {
          ElMessage.info('该用例暂无相关图片')
        }
      } else {
        imageError.value = true
        ElMessage.warning('图片数据格式异常')
      }
    } catch (e) {
      console.error('获取图片失败:', e)
      ElMessage.error(`获取图片失败: ${e.message || '请稍后重试'}`)
      imageError.value = true
    } finally {
      row._imageLoading = false
      imageLoading.value = false
    }
  }

  const retry = () => {
    if (currentExecutionId.value) {
      imageCache.value.delete(currentExecutionId.value)
      openImages({ ExecutionID: currentExecutionId.value, _imageLoading: false })
    }
  }

  const close = () => {
    showDialog.value = false
    currentImages.value = []
    currentExecutionId.value = null
    imageLoading.value = false
    imageError.value = false
  }

  const downloadSingle = (img) => {
    try {
      const a = document.createElement('a')
      a.href = img.url
      a.download = img.name || 'image'
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      ElMessage.success(`开始下载: ${img.name}`)
    } catch (e) {
      ElMessage.error('下载失败，请稍后重试')
    }
  }

  const downloadAll = async () => {
    if (!currentImages.value.length) {
      ElMessage.info('暂无图片可下载')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确定要下载全部 ${currentImages.value.length} 张图片吗？`,
        '确认下载',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
      )
      ElMessage.info(`开始下载 ${currentImages.value.length} 张图片...`)
      for (let i = 0; i < currentImages.value.length; i++) {
        downloadSingle(currentImages.value[i])
        if (i < currentImages.value.length - 1) {
          await new Promise(r => setTimeout(r, 200))
        }
      }
    } catch (e) {
      if (e !== 'cancel') {
        ElMessage.error('批量下载失败')
      }
    }
  }

  return {
    showDialog,
    currentImages,
    currentExecutionId,
    imageLoading,
    imageError,
    openImages,
    retry,
    close,
    downloadSingle,
    downloadAll
  }
}
