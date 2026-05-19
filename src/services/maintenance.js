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

function maintenanceHeaders(basicToken) {
  return {
    Authorization: `Basic ${basicToken}`,
    Accept: 'application/json',
  }
}

function maintenanceJsonHeaders(basicToken) {
  return {
    ...maintenanceHeaders(basicToken),
    'Content-Type': 'application/json',
  }
}

export async function fetchSystemMaintenance(basicToken) {
  const res = await fetch('/api/v1/admin/system/maintenance', {
    method: 'GET',
    headers: maintenanceHeaders(basicToken),
  })
  return await readJsonOrText(res)
}

export async function updateSystemMaintenance(basicToken, payload) {
  const res = await fetch('/api/v1/admin/system/maintenance', {
    method: 'PATCH',
    headers: maintenanceJsonHeaders(basicToken),
    body: JSON.stringify(payload),
  })
  return await readJsonOrText(res)
}
