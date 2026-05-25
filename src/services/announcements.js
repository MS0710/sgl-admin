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

function authHeaders(basicToken) {
  return {
    Authorization: `Basic ${basicToken}`,
    Accept: 'application/json',
  }
}

function jsonHeaders(basicToken) {
  return {
    ...authHeaders(basicToken),
    'Content-Type': 'application/json',
  }
}

export async function fetchAnnouncements(basicToken, params = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('page_no', String(params.pageNo ?? 1))
  searchParams.set('page_size', String(params.pageSize ?? 25))
  if (params.status) searchParams.set('status', params.status)
  if (params.ownerUserUuid) searchParams.set('owner_user_uuid', params.ownerUserUuid)

  const res = await fetch(`/api/v1/admin/announcements?${searchParams.toString()}`, {
    method: 'GET',
    headers: authHeaders(basicToken),
  })
  const data = await readJsonOrText(res)
  return {
    totalCount: Number(data?.total_count ?? 0),
    announcements: Array.isArray(data?.announcements) ? data.announcements : [],
  }
}

export async function fetchAnnouncementDetail(basicToken, uuid) {
  const res = await fetch(`/api/v1/admin/announcements/uuid/${encodeURIComponent(uuid)}`, {
    method: 'GET',
    headers: authHeaders(basicToken),
  })
  return await readJsonOrText(res)
}

export async function updateAnnouncementStatus(basicToken, uuid, status) {
  const res = await fetch(`/api/v1/admin/announcements/uuid/${encodeURIComponent(uuid)}/status`, {
    method: 'PATCH',
    headers: jsonHeaders(basicToken),
    body: JSON.stringify({ status }),
  })
  return await readJsonOrText(res)
}
