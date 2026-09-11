/**
 * Helper untuk membaca parameter nama tamu dari URL (?to=...)
 * Mendukung query string standar (?to=Nama) maupun hash query (#/?to=Nama)
 */
export function getGuestFromUrl(): string {
  if (typeof window === 'undefined') return ''
  
  // 1. Cek query string standar: ?to=...
  const searchParam = new URLSearchParams(window.location.search).get('to')
  if (searchParam && searchParam.trim()) {
    return searchParam.trim()
  }

  // 2. Cek jika query string berada di dalam hash: #/?to=...
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'))
    const hashParam = new URLSearchParams(hashQuery).get('to')
    if (hashParam && hashParam.trim()) {
      return hashParam.trim()
    }
  }

  return ''
}
