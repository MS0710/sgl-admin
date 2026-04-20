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

function bannerHeaders(basicToken) {
  return {
    Authorization: `Basic ${basicToken}`,
    Accept: 'application/json',
  }
}

function bannerJsonHeaders(basicToken) {
  return {
    ...bannerHeaders(basicToken),
    'Content-Type': 'application/json',
  }
}

export async function fetchBanners(basicToken) {
  const res = await fetch('/api/v1/admin/banners', {
    method: 'GET',
    headers: bannerHeaders(basicToken),
  })
  const data = await readJsonOrText(res)
  return Array.isArray(data?.items) ? data.items : []
}

export async function createBanner(basicToken, payload) {
  const res = await fetch('/api/v1/admin/banners', {
    method: 'POST',
    headers: bannerJsonHeaders(basicToken),
    body: JSON.stringify(payload),
  })
  return await readJsonOrText(res)
}

export async function fetchBanner(basicToken, uuid) {
  const res = await fetch(`/api/v1/admin/banners/uuid/${uuid}`, {
    method: 'GET',
    headers: bannerHeaders(basicToken),
  })
  return await readJsonOrText(res)
}

export async function updateBanner(basicToken, uuid, payload) {
  const res = await fetch(`/api/v1/admin/banners/uuid/${uuid}`, {
    method: 'PATCH',
    headers: bannerJsonHeaders(basicToken),
    body: JSON.stringify(payload),
  })
  return await readJsonOrText(res)
}

export async function deleteBanner(basicToken, uuid) {
  const res = await fetch(`/api/v1/admin/banners/uuid/${uuid}`, {
    method: 'DELETE',
    headers: bannerHeaders(basicToken),
  })
  return await readJsonOrText(res)
}
