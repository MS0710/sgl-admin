// src/services/specialties.js

async function readJsonOrText(res) {
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function fetchSpecialties(basicToken) {
  const res = await fetch('/api/v1/admin/specialties', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
    },
  })
  const data = await readJsonOrText(res)
  return Array.isArray(data.specialties) ? data.specialties : []
}

export async function createSpecialty(basicToken, payload) {
  const res = await fetch('/api/v1/admin/specialties', {
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

export async function updateSpecialty(basicToken, id, payload) {
  const res = await fetch(`/api/v1/admin/specialties/${id}`, {
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

export async function deleteSpecialty(basicToken, id) {
  const res = await fetch(`/api/v1/admin/specialties/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id, // ✅ 關鍵：後端實際從 body 讀 ID
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}