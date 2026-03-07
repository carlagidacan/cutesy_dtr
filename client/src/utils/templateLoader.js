const templateCache = new Map()

export const imageToBase64 = (fileOrBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(fileOrBlob)
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to convert image to base64'))
  })
}

export const loadAttendanceTemplate = async (imageUrl) => {
  if (!imageUrl) {
    throw new Error('Template image URL is required')
  }

  if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
    return imageUrl
  }

  if (templateCache.has(imageUrl)) {
    return templateCache.get(imageUrl)
  }

  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('Failed to load attendance template image')
  }

  const imageBlob = await response.blob()
  const base64Image = await imageToBase64(imageBlob)
  templateCache.set(imageUrl, base64Image)

  return base64Image
}