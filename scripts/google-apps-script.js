/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: WEDDING GIFT (UPLOAD FOTO), RSVP, & WISHES (REALTIME)
 * =========================================================================
 * 
 * PETUNJUK PEMASANGAN:
 * 1. Buat Google Spreadsheet baru di https://sheets.new
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'
 * 3. Hapus kode bawaan dan tempel seluruh kode file ini ke editor Code.gs
 * 4. Klik tombol 'Deploy' (Terapkan) di kanan atas > 'New deployment'
 * 5. Pilih jenis 'Web app' (Aplikasi web)
 *    - Description: Wedding API v1
 *    - Execute as: Me (email anda)
 *    - Who has access: Anyone (Siapa saja)
 * 6. Klik 'Deploy', izinkan akses (Authorize Access)
 * 7. Salin Web App URL (akhiran /exec) dan masukkan ke file .env project Anda:
 *    VITE_GSCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
 */

const CONFIG = {
  SHEET_WISHES: 'Wishes',
  SHEET_RSVP: 'RSVP',
  SHEET_GIFTS: 'Gifts',
  DRIVE_FOLDER_NAME: 'Bukti_Transfer_Wedding',
  // Jika ingin menggunakan folder tertentu yang sudah ada, isi ID foldernya di sini:
  DRIVE_FOLDER_ID: ''
};

/**
 * GET ENDPOINT: Digunakan untuk mengambil ucapan secara realtime
 * URL: https://script.google.com/.../exec?action=getWishes
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getWishes';

    if (action === 'getWishes') {
      const wishes = getWishesList();
      return jsonResponse({
        success: true,
        data: wishes // Default kosong [] jika belum ada komentar di spreadsheet
      });
    }

    if (action === 'getRsvp') {
      const rsvps = getRsvpList();
      return jsonResponse({
        success: true,
        data: rsvps
      });
    }

    return jsonResponse({
      success: true,
      message: 'Wedding Google Apps Script API is running.',
      endpoints: ['?action=getWishes', '?action=getRsvp']
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * POST ENDPOINT: Menangani pengiriman Wishes, RSVP, dan Gift (Upload Foto)
 */
function doPost(e) {
  try {
    let payload = {};

    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    // 1. UCAPAN / WISHES
    if (action === 'sendWish' || action === 'wishes') {
      const result = saveWish(payload);
      return jsonResponse({
        success: true,
        message: 'Ucapan berhasil dikirim.',
        data: result
      });
    }

    // 2. RSVP (KONFIRMASI KEHADIRAN)
    if (action === 'submitRsvp' || action === 'rsvp') {
      const result = saveRsvp(payload);
      return jsonResponse({
        success: true,
        message: 'Konfirmasi kehadiran berhasil dicatat.',
        data: result
      });
    }

    // 3. WEDDING GIFT + UPLOAD FOTO
    if (action === 'submitGift' || action === 'gift') {
      const result = saveGift(payload);
      return jsonResponse({
        success: true,
        message: 'Konfirmasi kado dan foto bukti transfer berhasil disimpan.',
        data: result
      });
    }

    return jsonResponse({
      success: false,
      message: 'Aksi tidak dikenali. Gunakan action: "sendWish", "submitRsvp", atau "submitGift".'
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * =========================================================================
 * SHEET & DATA HANDLERS: WISHES (DEFAULT KOSONG & REALTIME)
 * =========================================================================
 */
function getWishesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_WISHES);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_WISHES);
    sheet.appendRow(['ID', 'Timestamp', 'Nama', 'Ucapan']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  return sheet;
}

function getWishesList() {
  const sheet = getWishesSheet();
  const lastRow = sheet.getLastRow();

  // DEFAULT KOSONG: Jika belum ada data baris (hanya header), kembalikan []
  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const wishes = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const id = row[0];
    const timestamp = row[1];
    const name = row[2];
    const message = row[3];

    if (name || message) {
      wishes.push({
        id: id || `wish-${i + 1}`,
        guest_name: String(name || ''),
        nama: String(name || ''),
        message: String(message || ''),
        ucapan: String(message || ''),
        created_at: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp || '')
      });
    }
  }

  // Balik urutan agar komentar terbaru di paling atas
  return wishes.reverse();
}

function saveWish(payload) {
  const sheet = getWishesSheet();
  const id = 'W-' + Utilities.getUuid().slice(0, 8);
  const now = new Date();
  const name = payload.guest_name || payload.nama || payload.name || 'Tamu';
  const message = payload.message || payload.ucapan || payload.text || '';

  if (!message.toString().trim()) {
    throw new Error('Pesan ucapan tidak boleh kosong.');
  }

  sheet.appendRow([id, now, name, message]);

  return {
    id: id,
    guest_name: name,
    nama: name,
    message: message,
    ucapan: message,
    created_at: now.toISOString()
  };
}

/**
 * =========================================================================
 * SHEET & DATA HANDLERS: RSVP
 * =========================================================================
 */
function getRsvpSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_RSVP);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_RSVP);
    sheet.appendRow(['Timestamp', 'Nama', 'No HP', 'Kehadiran', 'Jumlah Tamu', 'Catatan / Doa']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  return sheet;
}

function saveRsvp(payload) {
  const sheet = getRsvpSheet();
  const now = new Date();
  const nama = payload.nama || payload.name || '';
  const hp = payload.no_hp || payload.hp || payload.phone || '';
  const hadir = payload.hadir || payload.status || 'hadir';
  const jumlah = payload.jumlah || payload.guests || 1;
  const catatan = payload.catatan || payload.pesan || '';

  if (!nama.toString().trim()) {
    throw new Error('Nama wajib diisi untuk konfirmasi kehadiran.');
  }

  sheet.appendRow([now, nama, "'" + hp, hadir, jumlah, catatan]);

  return {
    nama: nama,
    hadir: hadir,
    jumlah: jumlah,
    created_at: now.toISOString()
  };
}

function getRsvpList() {
  const sheet = getRsvpSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return values.map(function(row) {
    return {
      created_at: row[0],
      nama: row[1],
      no_hp: row[2],
      hadir: row[3],
      jumlah: row[4],
      catatan: row[5]
    };
  }).reverse();
}

/**
 * =========================================================================
 * SHEET & DATA HANDLERS: WEDDING GIFT (UPLOAD FOTO GOOGLE DRIVE)
 * =========================================================================
 */
function getGiftsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_GIFTS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_GIFTS);
    sheet.appendRow(['Timestamp', 'Nama Pengirim', 'Bank / Rekening', 'Nama Pemilik Rekening', 'Nominal', 'Pesan / Doa', 'Link Bukti Foto', 'File ID']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }
  return sheet;
}

function getUploadFolder() {
  if (CONFIG.DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  }

  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

function saveGift(payload) {
  const sheet = getGiftsSheet();
  const now = new Date();

  const name = payload.name || payload.nama || '';
  const bank = payload.bank || '';
  const owner = payload.owner || payload.nama_rekening || '';
  const amount = payload.amount || payload.nominal || 0;
  const message = payload.message || payload.pesan || '';

  let fileUrl = '';
  let fileId = '';

  if (payload.image || payload.file || payload.proof) {
    const rawImage = payload.image || payload.file || payload.proof;
    const fileName = payload.fileName || `Bukti_${name.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    
    const uploaded = uploadBase64ToDrive(rawImage, fileName);
    fileUrl = uploaded.url;
    fileId = uploaded.id;
  }

  sheet.appendRow([
    now,
    name,
    bank,
    owner,
    amount,
    message,
    fileUrl,
    fileId
  ]);

  return {
    name: name,
    amount: amount,
    fileUrl: fileUrl,
    created_at: now.toISOString()
  };
}

function uploadBase64ToDrive(base64Data, fileName) {
  const folder = getUploadFolder();
  let contentType = 'image/jpeg';
  let cleanBase64 = base64Data;

  if (base64Data.indexOf(';base64,') > -1) {
    const parts = base64Data.split(';base64,');
    contentType = parts[0].replace('data:', '');
    cleanBase64 = parts[1];
  }

  const decoded = Utilities.base64Decode(cleanBase64);
  const blob = Utilities.newBlob(decoded, contentType, fileName);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const previewUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();

  return {
    id: file.getId(),
    url: previewUrl,
    driveUrl: file.getUrl()
  };
}

/**
 * RESPONSE HELPER (CORS Friendly)
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSpreadsheet() {
  getWishesSheet();
  getRsvpSheet();
  getGiftsSheet();
  const folder = getUploadFolder();
  Logger.log('Inisialisasi selesai! Folder Google Drive: ' + folder.getName() + ' (ID: ' + folder.getId() + ')');
}
