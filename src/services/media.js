async function readJsonOrText(res) {
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function uploadImage(basicToken, file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/v1/admin/media/image', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
    },
    body: formData,
  })

  const data = await readJsonOrText(res)
  if (!data?.url) throw new Error('Upload succeeded but response did not include url')
  return data.url
}
