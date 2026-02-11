// src/services/invitation_codes.js

async function readJsonOrText(res) {
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return text }
}

export async function createCompanyInvitationCodes(basicToken, payload) {
  const res = await fetch('/api/v1/admin/invitation-codes/company', {
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
