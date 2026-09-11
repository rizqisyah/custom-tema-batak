/**
 * Google Apps Script API Client
 * Menghubungkan frontend langsung ke Web App Google Apps Script
 */

export const GSCRIPT_URL = ("https://script.google.com/macros/s/AKfycbz9-hYp_D6GZHRWmeGWITNAnPOAJOFYn-Yp92DQGIvj8kRurSKtIzRXazt_D8KiAYWB/exec" || '').trim()

export function isGScriptConfigured(): boolean {
  return Boolean(GSCRIPT_URL && GSCRIPT_URL.startsWith('http'))
}

export interface WishItem {
  id?: string
  guest_name?: string
  nama?: string
  message?: string
  ucapan?: string
  created_at?: string
}

export interface RsvpPayload {
  nama: string
  no_hp?: string
  hadir: string
  jumlah: number
  catatan?: string
}

export interface GiftPayload {
  name: string
  bank?: string
  owner: string
  amount: string | number
  message?: string
  file?: File | null
}

/**
 * Mengubah file gambar ke format Base64 untuk dikirim ke Google Apps Script
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Fetch daftar ucapan secara realtime.
 * Default mengembalikan array kosong [] jika belum ada data di spreadsheet.
 */
export async function fetchWishes(): Promise<WishItem[]> {
  if (!isGScriptConfigured()) {
    return []
  }

  try {
    const res = await fetch(`${GSCRIPT_URL}?action=getWishes&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`)
    }

    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data
    }
    return []
  } catch (err) {
    console.warn('[GScript] Gagal fetch wishes:', err)
    return []
  }
}

async function postToGAS(payload: any, fallbackMessage: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(GSCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    console.error('[GScript] Network / fetch error:', err)
    throw new Error(
      'Gagal terhubung ke Google Apps Script (NetworkError/CORS). Pastikan Web App di-deploy dengan "Who has access: Anyone" (Siapa saja).'
    )
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Akses Google Apps Script ditolak (403 Forbidden). Pastikan opsi "Who has access" pada Web App diatur ke "Anyone" (Siapa saja).'
      )
    }
    throw new Error(`Gagal menghubungi server Google (HTTP ${res.status}).`)
  }

  try {
    const json = await res.json()
    if (!json.success) {
      throw new Error(json.message || fallbackMessage)
    }
    return json
  } catch (err: any) {
    if (err.name === 'SyntaxError') {
      throw new Error(
        'Respons Google Apps Script bukan JSON. Pastikan Web App telah diotorisasi dan di-deploy dengan benar.'
      )
    }
    throw err
  }
}

/**
 * Kirim ucapan baru ke Google Apps Script
 */
export async function sendWishGAS(data: { guest_name: string; message: string }): Promise<any> {
  const payload = {
    action: 'sendWish',
    guest_name: data.guest_name,
    message: data.message,
  }

  if (!isGScriptConfigured()) {
    // Mode simulasi lokal jika URL belum diisi di .env
    return {
      success: true,
      data: {
        id: `local-${Date.now()}`,
        guest_name: data.guest_name,
        message: data.message,
        created_at: new Date().toISOString(),
      },
    }
  }

  return await postToGAS(payload, 'Gagal mengirim ucapan.')
}

/**
 * Kirim konfirmasi kehadiran (RSVP) ke Google Apps Script
 */
export async function submitRsvpGAS(data: RsvpPayload): Promise<any> {
  const payload = {
    action: 'submitRsvp',
    nama: data.nama,
    no_hp: data.no_hp || '',
    hadir: data.hadir,
    jumlah: data.jumlah || 1,
    catatan: data.catatan || '',
  }

  if (!isGScriptConfigured()) {
    return {
      success: true,
      message: 'Simulasi RSVP berhasil disimpan (VITE_GSCRIPT_URL belum diset).',
    }
  }

  return await postToGAS(payload, 'Gagal menyimpan konfirmasi RSVP.')
}

/**
 * Kirim konfirmasi hadiah & upload bukti transfer ke Google Apps Script (Drive)
 */
export async function submitGiftGAS(data: GiftPayload): Promise<any> {
  let base64 = ''
  let fileName = ''

  if (data.file) {
    base64 = await fileToBase64(data.file)
    fileName = data.file.name
  }

  const payload = {
    action: 'submitGift',
    name: data.name,
    bank: data.bank || '',
    owner: data.owner,
    amount: data.amount,
    message: data.message || '',
    image: base64,
    fileName: fileName,
  }

  if (!isGScriptConfigured()) {
    return {
      success: true,
      message: 'Simulasi kado & upload foto berhasil (VITE_GSCRIPT_URL belum diset).',
    }
  }

  return await postToGAS(payload, 'Gagal mengirim bukti hadiah.')
}

