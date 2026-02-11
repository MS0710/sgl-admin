export async function fetchPerformers(basicToken) {
  const res = await fetch('/api/v1/admin/performers/all', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json',
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)

  const data = JSON.parse(text)
  return Array.isArray(data.performers) ? data.performers : []
}
