import { ref, onMounted, onUnmounted } from 'vue'

export function useImagePreview(imagesRef) {
  const showPreview = ref(false)
  const index = ref(0)
  const zoom = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)
  const dragging = ref(false)
  const startX = ref(0)
  const startY = ref(0)

  const open = (i) => {
    index.value = i
    reset()
    showPreview.value = true
  }

  const close = () => { showPreview.value = false }

  const prev = () => {
    if (index.value > 0) {
      index.value--
      reset()
    }
  }

  const next = () => {
    if (index.value < imagesRef.value.length - 1) {
      index.value++
      reset()
    }
  }

  const zoomIn = () => (zoom.value = Math.min(zoom.value * 1.2, 5))
  const zoomOut = () => (zoom.value = Math.max(zoom.value / 1.2, 0.1))
  const reset = () => {
    zoom.value = 1
    translateX.value = 0
    translateY.value = 0
  }

  const wheel = (e) => {
    e.preventDefault()
    e.deltaY > 0 ? zoomOut() : zoomIn()
  }

  const startDrag = (e) => {
    if (zoom.value <= 1) return
    dragging.value = true
    startX.value = e.clientX - translateX.value
    startY.value = e.clientY - translateY.value
  }
  const onDrag = (e) => {
    if (!dragging.value || zoom.value <= 1) return
    translateX.value = e.clientX - startX.value
    translateY.value = e.clientY - startY.value
  }
  const endDrag = () => { dragging.value = false }

  const handleKey = (e) => {
    if (!showPreview.value) return
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); prev(); break
      case 'ArrowRight': e.preventDefault(); next(); break
      case 'Escape': e.preventDefault(); close(); break
      case '+':
      case '=': e.preventDefault(); zoomIn(); break
      case '-': e.preventDefault(); zoomOut(); break
      case '0': e.preventDefault(); reset(); break
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKey))
  onUnmounted(() => document.removeEventListener('keydown', handleKey))

  return {
    showPreview,
    index,
    zoom,
    translateX,
    translateY,
    open,
    close,
    prev,
    next,
    zoomIn,
    zoomOut,
    reset,
    wheel,
    startDrag,
    onDrag,
    endDrag
  }
}
