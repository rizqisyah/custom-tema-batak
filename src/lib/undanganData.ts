/*
 * The four "Turut Mengundang" bands — the design's own invitation name lists.
 *
 * Generated from the Figma REST node table (.figma-ref/frame9-nodes.json), not retyped:
 * these are hundreds of Batak names and honorifics, and a transcription slip here prints
 * a real family's name wrong. Regenerate rather than hand-edit.
 *
 * Every list node carries AUTHORED NEWLINES — one guest per line — so each is stored as
 * a single string with \n and rendered with `white-space: pre-line`. Splitting them into
 * arrays and joining with <br> would work too, but the design's node IS one text box and
 * keeping it as one string is what makes the leading match.
 *
 * Geometry is band-local design px. Heading sizes differ per band (28.87 / 25.87), which
 * is the design's own doing, not a rounding artefact.
 */
export type UndanganSpec = {
  key: string
  /** band height in design px */
  h: number
  heading: { text: string; x: number; y: number; w: number; size: number; lh: number }
  /** the small black line above the peranak list; absent on the other three */
  note?: { text: string; x: number; y: number; w: number; size: number; lh: number }
  list: { text: string; x: number; y: number; w: number; size: number; lh: number }
  layers: { z: number; id: string; file: string; x: number; y: number; w: number; h: number }[]
}

export const UNDANGAN: UndanganSpec[] = [
  {
    key: "pria",
    h: 889,
    heading: { text: "Turut Mengundang Keluarga Pria", x: 39.0, y: 255.0, w: 489.0, size: 28.8700008392334, lh: 18.64 },
    list: { text: "Bapak. Caroll J. A. Senduk, SH dan Ibu drg. Jean d’arc Karundeng (Walikota Tomohon, Paman dan Tante Waraney, Tomohon)\nBapak Drs. Johny Runtuwene, DEA- dan Ibu Dra. Lidya Poluan (Ketua DPRD Tomohon, Opa dan Oma Waraney, Tomohon)\nBapak dr. Dolly D Kaunang, SpJ - Tiurmalina P. Loebis (Opung Waraney, Jakarta)\nBapak Pdt. Senduk G.A. Roeroe, STh, MTh dan Ibu Fince Pomantow, STh (Paman dan Tante Waraney, Tomohon)\nBapak Yuno Mandagi dan Ibu Emilia Roeroe (Paman & Tante Waraney, Tomohon)\nBapak Barce Wariki, SP, M.Si (Paman Waraney, Tomohon)\nBapak Drs. Randy Wuntu, MSi dan Ibu Evelyne Pelealu, STh (Orang Tua Baptis Waraney, Manado)\nBapak Bart Senduk dan Ibu Milly Mosal, SP (Orang Tua Baptis Waraney, Tomohon)\nBapak Dr. Artis Salendu, MSi dan Prof. Dr. dr. Sarah Warouw, SpA(K) (Orang Tua Baptis Waraney, Manado)\nBapak Brigjen Pol (Purn) Drs. Aridan Roeroe dan dr. Diana Tamboto (Paman dan Tante Waraney, Jakarta)\nBapak Jacobus A Wowor, SH dan Sarah Roeroe, SH, MH (Paman dan Tante Waraney, Tomohon)\nBapak Drs. Octavianus Mandagi, MAP dan Wulan Roeroe, SE, MSi (Paman dan Tante Waraney, Tomohon)", x: 48.0, y: 299.0, w: 499.0, size: 17.0, lh: 22.1 },
    layers: [
      { z: 14, id: "2143:1458", file: "undangan-pria/parts/2143-1458.webp", x: -44.0, y: 292.0, w: 738.0, h: 597.0 },
      { z: 16, id: "2143:1477", file: "undangan-pria/parts/2143-1477.webp", x: -54.0, y: 235.0, w: 738.0, h: 61.0 },
      { z: 151, id: "2143:1455", file: "undangan-pria/parts/2143-1455.webp", x: 218.0, y: 0.0, w: 161.0, h: 161.0 },
    ],
  },
  {
    key: "peranak",
    h: 1069,
    heading: { text: "Turut Mengundang Pihak Peranak", x: 54.0, y: 20.0, w: 489.0, size: 25.8700008392334, lh: 18.64 },
    note: { text: "Hami Na manggokhon :", x: -85.0, y: 87.0, w: 489.0, size: 19.8700008392334, lh: 18.64 },
    list: { text: "S. Sianturi, S.Pd / L. Br. Manurung, S.Pd / Op. Gevariel Sianturi — (Natorasna — Ma. Bungo)\nH. Aritonang, SH / G. Br. Sianturi, S.Pd / A. Caroline — (Lae/Ibotona — Duri)\nJ. Siringoringo, S.Kom / G. Br. Sianturi, S.Pd / A. Elsy — (Lae/Ibotona — Bangko)\nG. Sianturi, SH / Br. Bali / A. Gevariel — (Abangna — Jayapura)\nG. Sianturi, S.Pd / E. Br. Simamora / A. Fabian — (Abangna — Jambi)\nGiven Bioretson Sianturi / S. Br. Marbun / A. Paimah — (Anggina — Ma. Bungo)\nDrs. J. Sianturi / Dra. D. Br. Simamora / Op. Kembar — (Bapatua — Bekasi)\nOp. Nisi Hadasa Sianturi (+) / Br. Togatorop — (Inangtuana — Muara)\nOp. Sorta Sianturi / Br. Siburian — Bapatuana — (M. Bungo)\nA. Moryent Sianturi (+) / Br. Manihuruk — (Inangtuana — Jambi)\nA. Tupado Sianturi / Br. Banjar nahor — (Bapaudana — Muara)\nA. Gaby Sianturi / Br. Siburian — (Bapaudana — Bekasi)\nA. Frans Sianturi / Br. Pakpahan — (Bapaudana — Muara)\nA. Amora Sianturi / Br. Monulang — (Bapaudana — Belawan)\nJ. C. Sianturi, ST / Y. Br. Situmorang, SP / A. Mika — (Bapaudana — Medan)\nC. Sianturi, SE / Br. Napitupulu, SP / A. Fredrik — (Bapaudana — Pontianak)\nJ. Sianturi, SE / Br. Silitonga, SP — (Bapaudana — Medan)\nA. Ester Simbolon / Br. Sianturi — (Namboruna — Serang)\nR. Siringoringo (+) / R. Br. Sianturi / Op. Nisi Gheafanny — (Namboruna — Jambi)\nG. Sianturi, SE / L. Br. Simamora / A. Kembar — (Abangna — Bekasi)\nA. Syela Manalu / J. Br. Togatorop — (Laena — Jayapura)\nPunguan Toga Simatupang Boru, Bere, Ibabere — (Ma. Bungo Sekitarnya)\nPunguan Pangaranto nasian Muara — (Ma. Bungo Sekitarnya)\nPunguan Raja Toga Manurung Boru, Bere, Ibabere — (Ma. Bungo Sekitarnya)\nPunguan Toga Raja Siburian Boru, Bere, Ibabere — (Ma. Bungo Sekitarnya)\nPunguan Simamora Debataraja Boru, Bere, Ibabere — (Ma. Bungo Sekitarnya)\nPunguan Persahutoan Agave — (Muara Bungo)", x: 48.0, y: 101.0, w: 508.0, size: 17.0, lh: 22.1 },
    layers: [
      { z: 15, id: "2143:1476", file: "undangan-peranak/parts/2143-1476.webp", x: -44.0, y: 0.0, w: 738.0, h: 61.0 },
      { z: 18, id: "2143:1460", file: "undangan-peranak/parts/2143-1460.webp", x: -44.0, y: 61.0, w: 738.0, h: 1055.0 },
    ],
  },
  {
    key: "parboru",
    h: 815,
    heading: { text: "Turut Mengundang dari Parboru", x: 54.0, y: 191.0, w: 489.0, size: 28.8700008392334, lh: 18.64 },
    list: { text: "R. Manurung, S.Pd., M.Si./br. Simamora (Op. Raja) —   Natorasna, Manado\nU. Manurung / br. Manado (Ama Raja) — Iboto Na, Manado\nGeby Manurung — Anggi Na, Manado\nR. Manurung / br. Sitorus (Op. Lionel) — Bapa Tua Na, Bandung\nR. Manurung / br. Naibaho, S.Pd. (Ama Nikita) — Bapa Tua Na, Papua\nM. Manurung, S.E., M.M. / br. Gultom, S.H. (Ama Putri) — Bapa Tua Na, Papua\nR. Manurung, A.Md.T / br. Sihombing, S.Kep. (Ama Albert) — Bapa Uda Na, Batam\nR. Manurung / br. Marpaung, S.E. (Ama Edwin) — Bapa Uda Na, Papua\nA. Manurung / br. Hutahaean, S.E. (Ama Lerry) — Bapa Uda Na, Papua\nR. Manurung / br. Napitu (Ama Alex) — Bapa Uda Na, Medan\nD. Manurung / br. Sihombing, S.Pd. (Ama Lionel) — Iboto Na, Papua\nS. Siregar / br. Manurung (Ama Naomi) — Namboruna, Batam\nP. Tambunan, S.Par. / br. Manurung, S.IP. — Kakak Na, Papua\nPunguan Raja Toga Manurung Dohot Boruna Se-Jayapura dan Sekitarnya", x: 45.0, y: 242.0, w: 508.0, size: 17.0, lh: 22.1 },
    layers: [
      { z: 12, id: "2143:1481", file: "undangan-parboru/parts/2143-1481.webp", x: -93.0, y: 111.0, w: 738.0, h: 975.0 },
      { z: 13, id: "2143:1480", file: "undangan-parboru/parts/2143-1480.webp", x: -9.0, y: 0.0, w: 614.0, h: 222.0 },
      { z: 17, id: "2143:1478", file: "undangan-parboru/parts/2143-1478.webp", x: -71.0, y: 171.0, w: 738.0, h: 61.0 },
    ],
  },
  {
    key: "wanita",
    h: 445,
    heading: { text: "Turut Mengundang Wanita", x: 54.0, y: 20.0, w: 489.0, size: 25.8700008392334, lh: 18.64 },
    list: { text: "Tangapo Kaumpungan — Bapatua, Manado\nTangapo Jacob — Bapatua, Manado\nTangapo Josep — Bapatua, Manado\nTangkere Tangapo — Bapatua, Manado\nTangapo Loho — Bapatua, Manado\nKoolang Tangapo — Bapatua, Manado\nTangapo Manopo — Bapaade, Manado", x: 54.0, y: 61.0, w: 508.0, size: 17.0, lh: 22.1 },
    layers: [
      { z: 11, id: "2144:1490", file: "undangan-wanita/parts/2144-1490.webp", x: -110.0, y: 271.0, w: 798.0, h: 225.0 },
      { z: 160, id: "2143:1486", file: "undangan-wanita/parts/2143-1486.webp", x: -71.0, y: 0.0, w: 738.0, h: 61.0 },
    ],
  },
]
