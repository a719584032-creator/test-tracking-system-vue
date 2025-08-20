/**
 * 通用格式化工具集合
 * 说明：
 * 1. 删除了重复的函数定义（原文件出现两份重复）
 * 2. 新增：
 *    - formatImageTime：图片场景常用的 月-日 时:分
 *    - formatSize：对外统一的文件大小格式化别名（内部复用 formatFileSize）
 *    - formatTimeShort：YYYY-MM-DD HH:mm（可选场景）
 * 3. 所有空值 / 非法值做了安全处理
 */

/**
 * 格式化数字，添加千分位分隔符
 * @param {number|string} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || num === '' || isNaN(Number(num))) return '0'
  return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化百分比
 * @param {number} value - 0-1 或 0-100
 * @param {number} decimals - 小数位（默认 1）
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  const percentage = value > 1 ? value : value * 100
  return `${Number(percentage).toFixed(decimals)}%`
}

/**
 * 格式化时间（分钟 -> 中文可读）
 * @param {number} minutes
 * @returns {string}
 */
export const formatTime = (minutes) => {
  if (!minutes || minutes <= 0) return '0 分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes === 0
    ? `${hours} 小时`
    : `${hours} 小时 ${remainingMinutes} 分钟`
}

/**
 * 格式化文件大小
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  const value = bytes / Math.pow(k, i)
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(2)} ${sizes[i]}`
}

/**
 * （别名）统一暴露给组件的文件大小格式化
 * @param {number} bytes
 * @returns {string}
 */
export const formatSize = (bytes) => formatFileSize(bytes)

/**
 * 格式化日期时间
 * @param {string|Date|number} date
 * @param {string} format - 默认 'YYYY-MM-DD HH:mm:ss'
 * 支持 token: YYYY MM DD HH mm ss
 * @returns {string}
 */
export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date && date !== 0) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 相对时间（中文）
 * @param {string|Date|number} date
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date && date !== 0) return ''
  const target = new Date(date)
  if (isNaN(target.getTime())) return ''
  const now = Date.now()
  const diff = now - target.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < month) return `${Math.floor(diff / day)} 天前`
  if (diff < year) return `${Math.floor(diff / month)} 个月前`
  return `${Math.floor(diff / year)} 年前`
}

/**
 * 格式化货币
 * @param {number|string} amount
 * @param {string} currency - 默认 '¥'
 * @param {number} decimals - 默认 2
 * @returns {string}
 */
export const formatCurrency = (amount, currency = '¥', decimals = 2) => {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return `${currency}0.${'0'.repeat(decimals)}`
  }
  const fixed = Number(amount).toFixed(decimals)
  const withCommas = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${withCommas}`
}

/**
 * 格式化手机号（大陆 11 位）
 * @param {string|number} phone
 * @returns {string}
 */
export const formatPhone = (phone) => {
  if (!phone && phone !== 0) return ''
  const cleaned = phone.toString().replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  }
  return phone.toString()
}

/**
 * 格式化身份证号
 * @param {string|number} idCard
 * @param {boolean} mask - 是否脱敏
 * @returns {string}
 */
export const formatIdCard = (idCard, mask = false) => {
  if (!idCard && idCard !== 0) return ''
  const cleaned = idCard.toString().replace(/\s/g, '')
  if (cleaned.length === 18) {
    if (mask) {
      return cleaned.replace(/(\d{6})\d{8}(\w{4})/, '$1********$2')
    }
    return cleaned.replace(/(\d{6})(\d{8})(\w{4})/, '$1 $2 $3')
  }
  return idCard.toString()
}

/**
 * 截断文本
 * @param {string} text
 * @param {number} maxLength
 * @param {string} suffix
 * @returns {string}
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + suffix
}

/**
 * 首字母大写
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 驼峰转下划线
 * @param {string} str
 * @returns {string}
 */
export const camelToSnake = (str) => {
  if (!str) return ''
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * 下划线转驼峰
 * @param {string} str
 * @returns {string}
 */
export const snakeToCamel = (str) => {
  if (!str) return ''
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/* ==================== 新增方法（为组件适配） ==================== */

/**
 * 图片时间专用：MM-DD HH:mm
 * @param {string|Date|number} time
 * @returns {string}
 */
export const formatImageTime = (time) => {
  if (!time && time !== 0) return ''
  const d = new Date(time)
  if (isNaN(d.getTime())) return ''
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

/**
 * 短日期时间：YYYY-MM-DD HH:mm
 * @param {string|Date|number} date
 * @returns {string}
 */
export const formatTimeShort = (date) => {
  if (!date && date !== 0) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 可选：数值安全转换（内部工具，不导出给 UI 也行）
 * @param {any} v
 * @param {number} fallback
 * @returns {number}
 */
export const safeNumber = (v, fallback = 0) => {
  const n = Number(v)
  return isNaN(n) ? fallback : n
}
