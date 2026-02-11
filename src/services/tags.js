async function readJsonOrText(res) {
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function fetchTags(basicToken) {
  const res = await fetch('/api/v1/admin/tags', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
    },
  })
  const data = await readJsonOrText(res)
  return Array.isArray(data?.tags) ? data.tags : []
}

export async function createTag(basicToken, payload) {
  const res = await fetch('/api/v1/admin/tags', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return await readJsonOrText(res)
}

export async function updateTag(basicToken, id, payload) {
  const res = await fetch(`/api/v1/admin/tags/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return await readJsonOrText(res)
}
