// Core libs
const { jsPDF } = window.jspdf;

// Elements
const el = (id) => document.getElementById(id);
const jenisSuratSelect = el('jenisSurat');
const preview = el('preview');

// Letter options (BM + EN)
const LETTER_TYPES = [
  { value: 'tidakHadir', label: 'Tidak Hadir Sekolah (BM)', context: 'sekolah' },
  { value: 'cutiSakit', label: 'Cuti Sakit (BM)', context: 'sekolah' },
  { value: 'permohonanCuti', label: 'Permohonan Cuti (BM)', context: 'kerja' },
  { value: 'perletakanJawatan', label: 'Perletakan Jawatan (BM)', context: 'kerja' },
  { value: 'resignation', label: 'Resignation Letter (EN)', context: 'kerja' }
];

// Init options
function initJenisSurat() {
  LETTER_TYPES.forEach(t => {
    const o = document.createElement('option');
    o.value = t.value; o.textContent = t.label;
    jenisSuratSelect.appendChild(o);
  });
}

// Helpers
const monthMY = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const monthEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(value, lang='my') {
  if (!value) return '';
  const d = new Date(value + 'T00:00:00');
  const day = d.getDate();
  const month = lang === 'en' ? monthEN[d.getMonth()] : monthMY[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function diffDays(a, b) {
  if (!a || !b) return null;
  const d1 = new Date(a + 'T00:00:00'); const d2 = new Date(b + 'T00:00:00');
  const ms = Math.abs(d2 - d1);
  return Math.floor(ms / (1000*60*60*24)) + 1; // inclusive
}

function titleize(s) {
  return (s || '').trim().replace(/\s+/g,' ').toLowerCase().replace(/\b\p{L}/gu, m => m.toUpperCase());
}

function blockAddress(lines = []) {
  return lines.filter(Boolean).join('\n');
}

function boldTitle(s) { return s ? s.toUpperCase() : ''; }

function numberedParas(paras = []) {
  return paras.map((p, i) => `${i+1}. ${p}`).join('\n');
}

function getLang() { return el('lang').value || 'my'; }

// Gather form data
function getFormData() {
  const perengganTambahan = Array.from(document.querySelectorAll('textarea[name="perenggan[]"]'))
    .map(t => t.value.trim()).filter(Boolean);

  return {
    lang: getLang(),
    jenis: el('jenisSurat').value,
    tarikh: el('tarikh').value,
    namaPengirim: titleize(el('namaPengirim').value),
    telefon: el('telefon').value.trim(),
    alamatPengirim: el('alamatPengirim').value.trim(),
    poskodBandarPengirim: el('poskodBandarPengirim').value.trim(),
    negeriPengirim: titleize(el('negeriPengirim').value),

    // sekolah
    namaPelajar: titleize(el('namaPelajar').value),
    kelas: el('kelas').value.trim(),
    hubungan: titleize(el('hubungan').value),
    namaSekolah: titleize(el('namaSekolah').value),
    alamatSekolah: el('alamatSekolah').value.trim(),
    poskodBandarSekolah: el('poskodBandarSekolah').value.trim(),
    negeriSekolah: titleize(el('negeriSekolah').value),

    // kerja
    jawatan: titleize(el('jawatan').value),
    majikan: titleize(el('majikan').value),
    alamatMajikan: el('alamatMajikan').value.trim(),
    poskodBandarMajikan: el('poskodBandarMajikan').value.trim(),
    negeriMajikan: titleize(el('negeriMajikan').value),
    penerimaJawatan: titleize(el('penerimaJawatan').value),

    // surat
    tajukKustom: el('tajukKustom').value.trim(),
    sebab: el('sebab').value.trim(),
    tarikhMula: el('tarikhMula').value,
    tarikhAkhir: el('tarikhAkhir').value,

    perengganTambahan
  };
}

// Templates
function templateTidakHadir(d) {
  const tajuk = d.tajukKustom || 'Permohonan Tidak Hadir Ke Sekolah';
  const t = formatDate(d.tarikh, 'my');
  const tM = formatDate(d.tarikhMula, 'my');
  const tA = formatDate(d.tarikhAkhir, 'my');
  const hari = diffDays(d.tarikhMula, d.tarikhAkhir);

  const pengirim = blockAddress([
    d.namaPengirim,
    d.alamatPengirim,
    [d.poskodBandarPengirim, d.negeriPengirim].filter(Boolean).join(', '),
    `Tel: ${d.telefon}`.trim()
  ]);

  const penerima = blockAddress([
    `Kepada:`,
    `Guru Kelas ${d.kelas || ''}`.trim(),
    d.namaSekolah,
    d.alamatSekolah,
    [d.poskodBandarSekolah, d.negeriSekolah].filter(Boolean).join(', ')
  ]);

  const isi = [
    `Dengan hormatnya perkara di atas adalah dirujuk.`,
    `Ingin saya memaklumkan bahawa anak/waris saya, ${d.namaPelajar}${d.kelas ? ` (${d.kelas})` : ''} tidak dapat hadir ke sekolah pada ${tM}${tA ? ` hingga ${tA}` : ''}${hari ? ` (${hari} hari)` : ''} atas sebab ${d.sebab || 'urusan keluarga'}.`,
    `Sehubungan itu, saya memohon kebenaran pihak tuan/puan untuk ketidakhadiran tersebut.`,
    `Kerjasama dan perhatian daripada pihak tuan/puan amat saya hargai.`
  ];

  const tambahan = d.perengganTambahan.length ? d.perengganTambahan : [];

  return [
    pengirim,
    '',
    penerima,
    '',
    `Tarikh: ${t}`,
    '',
    boldTitle(tajuk),
    '',
    numberedParas([...isi, ...tambahan]),
    '',
    'Sekian, terima kasih.',
    '',
    'Yang benar,',
    '',
    d.namaPengirim
  ].join('\n');
}

function templateCutiSakit(d) {
  const tajuk = d.tajukKustom || 'Makluman Cuti Sakit Pelajar';
  const t = formatDate(d.tarikh, 'my');
  const tM = formatDate(d.tarikhMula, 'my');
  const tA = formatDate(d.tarikhAkhir, 'my');
  const hari = diffDays(d.tarikhMula, d.tarikhAkhir);

  const pengirim = blockAddress([
    d.namaPengirim,
    d.alamatPengirim,
    [d.poskodBandarPengirim, d.negeriPengirim].filter(Boolean).join(', '),
    `Tel: ${d.telefon}`.trim()
  ]);

  const penerima = blockAddress([
    `Kepada:`,
    `Guru Kelas ${d.kelas || ''}`.trim(),
    d.namaSekolah,
    d.alamatSekolah,
    [d.poskodBandarSekolah, d.negeriSekolah].filter(Boolean).join(', ')
  ]);

  const isi = [
    `Merujuk perkara di atas, dimaklumkan bahawa anak/waris saya, ${d.namaPelajar}${d.kelas ? ` (${d.kelas})` : ''} disahkan tidak sihat dan memerlukan rehat.`,
    `Cuti sakit adalah pada ${tM}${tA ? ` hingga ${tA}` : ''}${hari ? ` (${hari} hari)` : ''}. Rujukan: ${d.sebab || 'Sijil cuti sakit'}.`,
    `Mohon jasa baik pihak tuan/puan untuk makluman rekod kehadiran.`
  ];

  const tambahan = d.perengganTambahan.length ? d.perengganTambahan : [];

  return [
    pengirim, '', penerima, '', `Tarikh: ${t}`, '', boldTitle(tajuk), '',
    numberedParas([...isi, ...tambahan]),
    '', 'Sekian, terima kasih.', '', 'Yang benar,', '', d.namaPengirim
  ].join('\n');
}

function templatePermohonanCuti(d) {
  const tajuk = d.tajukKustom || 'Permohonan Cuti';
  const t = formatDate(d.tarikh, 'my');
  const tM = formatDate(d.tarikhMula, 'my');
  const tA = formatDate(d.tarikhAkhir, 'my');
  const hari = diffDays(d.tarikhMula, d.tarikhAkhir);

  const pengirim = blockAddress([
    d.namaPengirim,
    d.jawatan,
    d.majikan,
    d.alamatPengirim,
    [d.poskodBandarPengirim, d.negeriPengirim].filter(Boolean).join(', '),
    `Tel: ${d.telefon}`.trim()
  ]);

  const penerima = blockAddress([
    `Kepada:`,
    d.penerimaJawatan || 'Pengurus Sumber Manusia',
    d.majikan,
    d.alamatMajikan,
    [d.poskodBandarMajikan, d.negeriMajikan].filter(Boolean).join(', ')
  ]);

  const isi = [
    `Perkara di atas dirujuk. Saya dengan ini memohon cuti pada ${tM}${tA ? ` hingga ${tA}` : ''}${hari ? ` (${hari} hari)` : ''}.`,
    `Tujuan cuti: ${d.sebab || 'Urusan peribadi'}.`,
    `Saya akan memastikan penyerahan tugas dan kelangsungan kerja berjalan lancar.`
  ];
  const tambahan = d.perengganTambahan.length ? d.perengganTambahan : [];

  return [
    pengirim, '', penerima, '', `Tarikh: ${t}`, '', boldTitle(tajuk), '',
    numberedParas([...isi, ...tambahan]),
    '', 'Sekian, terima kasih.', '', 'Yang benar,', '',
    d.namaPengirim
  ].join('\n');
}

function templatePerletakanJawatan(d) {
  const tajuk = d.tajukKustom || 'Perletakan Jawatan';
  const t = formatDate(d.tarikh, 'my');
  const tM = formatDate(d.tarikhMula, 'my');

  const pengirim = blockAddress([
    d.namaPengirim,
    d.jawatan,
    d.majikan,
    d.alamatPengirim,
    [d.poskodBandarPengirim, d.negeriPengirim].filter(Boolean).join(', '),
    `Tel: ${d.telefon}`.trim()
  ]);

  const penerima = blockAddress([
    `Kepada:`,
    d.penerimaJawatan || 'Pengurus Sumber Manusia',
    d.majikan,
    d.alamatMajikan,
    [d.poskodBandarMajikan, d.negeriMajikan].filter(Boolean).join(', ')
  ]);

  const isi = [
    `Dengan segala hormatnya dimaklumkan bahawa saya ingin meletakkan jawatan sebagai ${d.jawatan || 'pekerja'} di ${d.majikan || 'syarikat'} berkuat kuasa pada ${tM || 'tarikh notis'}.`,
    `Sebab ringkas: ${d.sebab || 'komitmen peribadi/kerjaya'}.`,
    `Saya komited untuk membantu proses penyerahan tugas sepanjang tempoh notis.`
  ];
  const tambahan = d.perengganTambahan.length ? d.perengganTambahan : [];

  return [
    pengirim, '', penerima, '', `Tarikh: ${t}`, '', boldTitle(tajuk), '',
    numberedParas([...isi, ...tambahan]),
    '', 'Sekian, terima kasih.', '', 'Yang benar,', '',
    d.namaPengirim
  ].join('\n');
}

function templateResignationEN(d) {
  const title = d.tajukKustom || 'Resignation Letter';
  const t = formatDate(d.tarikh, 'en');
  const start = formatDate(d.tarikhMula, 'en');

  const sender = blockAddress([
    d.namaPengirim,
    d.jawatan,
    d.majikan,
    d.alamatPengirim,
    [d.poskodBandarPengirim, d.negeriPengirim].filter(Boolean).join(', '),
    `Tel: ${d.telefon}`.trim()
  ]);

  const recipient = blockAddress([
    `To:`,
    d.penerimaJawatan || 'Human Resources Manager',
    d.majikan,
    d.alamatMajikan,
    [d.poskodBandarMajikan, d.negeriMajikan].filter(Boolean).join(', ')
  ]);

  const paras = [
    `With reference to the above, please accept this letter as formal notice of my resignation from the position of ${d.jawatan || 'staff'}, effective ${start || 'on notice'}.`,
    `Reason (brief): ${d.sebab || 'personal/career commitments'}.`,
    `I will fully support handover to ensure a smooth transition during the notice period.`
  ];
  const extras = d.perengganTambahan.length ? d.perengganTambahan : [];

  return [
    sender, '', recipient, '', `Date: ${t}`, '', boldTitle(title), '',
    numberedParas([...paras, ...extras]),
    '', 'Thank you.', '', 'Sincerely,', '',
    d.namaPengirim
  ].join('\n');
}

function generateLetter(d) {
  switch (d.jenis) {
    case 'tidakHadir': return templateTidakHadir(d);
    case 'cutiSakit': return templateCutiSakit(d);
    case 'permohonanCuti': return templatePermohonanCuti(d);
    case 'perletakanJawatan': return templatePerletakanJawatan(d);
    case 'resignation': return templateResignationEN(d);
    default: return '';
  }
}

// UI updates
function toggleContexts() {
  const jenis = el('jenisSurat').value;
  const meta = LETTER_TYPES.find(x => x.value === jenis);
  el('konteksSekolah').classList.toggle('hidden', meta?.context !== 'sekolah');
  el('konteksKerja').classList.toggle('hidden', meta?.context !== 'kerja');
}

function updatePreview() {
  const d = getFormData();
  const surat = generateLetter(d);
  preview.classList.remove('skeleton');
  preview.innerText = surat;
  autoSave(d);
}

// Actions
function addParagraphField() {
  const container = el('perengganContainer');
  const label = document.createElement('label');
  label.className = 'field';
  label.innerHTML = `<span class="label">Perenggan tambahan</span>
  <textarea name="perenggan[]" rows="3" placeholder="Perincian tambahan (opsyenal)"></textarea>`;
  container.appendChild(label);
  label.querySelector('textarea').addEventListener('input', updatePreview);
}

function copyText() {
  const text = preview.innerText || '';
  if (!text.trim()) return toast('Tiada kandungan untuk disalin.');
  navigator.clipboard.writeText(text).then(() => toast('Teks disalin!'));
}

function downloadPDF() {
  const text = preview.innerText || '';
  if (!text.trim()) return toast('Tiada kandungan untuk PDF.');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 56;
  const maxWidth = 595.28 - margin*2;
  doc.setFont('Times','normal'); doc.setFontSize(12);
  const lines = doc.splitTextToSize(text, maxWidth);
  let y = margin;
  lines.forEach(line => {
    if (y > 841.89 - margin) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 16;
  });
  doc.save('surat-rasmi.pdf');
}

function printLetter() {
  const w = window.open('', 'PRINT', 'height=800,width=700');
  const style = `
    <style>
      body { font-family: "Times New Roman", serif; white-space: pre-wrap; line-height: 1.7; font-size: 12pt; padding: 24px; }
    </style>`;
  w.document.write(`<html><head><title>Surat Rasmi</title>${style}</head><body>${preview.innerText.replace(/\n/g,'<br>')}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

function resetForm() {
  if (!confirm('Reset semua medan?')) return;
  document.querySelectorAll('input, textarea, select').forEach(elm => {
    if (elm.id === 'lang') return; // keep language
    if (elm.tagName === 'SELECT') {
      if (elm.id === 'jenisSurat') elm.selectedIndex = 0;
      else elm.selectedIndex = 0;
    } else {
      elm.value = '';
    }
  });
  // remove extra paragraphs except first
  const pts = document.querySelectorAll('textarea[name="perenggan[]"]');
  pts.forEach((t, i) => { if (i > 0) t.parentElement.remove(); });
  clearSave();
  toggleContexts();
  updatePreview();
}

// Toast
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Autosave (localStorage)
const LS_KEY = 'surat_app_state_v1';
function autoSave(state) { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch{} }
function loadSave() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    applyState(s);
  } catch {}
}
function clearSave() { try { localStorage.removeItem(LS_KEY); } catch {} }

// Permalink (URL hash base64)
function shareLink() {
  const state = getFormData();
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  const url = `${location.origin}${location.pathname}#${b64}`;
  navigator.clipboard.writeText(url).then(() => toast('Pautan disalin!'));
}
function loadFromHash() {
  if (!location.hash) return;
  try {
    const b64 = location.hash.slice(1);
    const json = decodeURIComponent(escape(atob(b64)));
    const s = JSON.parse(json);
    applyState(s);
  } catch {}
}

// Apply state to form
function applyState(s) {
  const set = (id, v) => { const e = el(id); if (e != null && v != null) e.value = v; };
  set('lang', s.lang);
  set('jenisSurat', s.jenis);
  set('tarikh', s.tarikh);
  set('namaPengirim', s.namaPengirim);
  set('telefon', s.telefon);
  set('alamatPengirim', s.alamatPengirim);
  set('poskodBandarPengirim', s.poskodBandarPengirim);
  set('negeriPengirim', s.negeriPengirim);

  set('namaPelajar', s.namaPelajar);
  set('kelas', s.kelas);
  set('hubungan', s.hubungan);
  set('namaSekolah', s.namaSekolah);
  set('alamatSekolah', s.alamatSekolah);
  set('poskodBandarSekolah', s.poskodBandarSekolah);
  set('negeriSekolah', s.negeriSekolah);

  set('jawatan', s.jawatan);
  set('majikan', s.majikan);
  set('alamatMajikan', s.alamatMajikan);
  set('poskodBandarMajikan', s.poskodBandarMajikan);
  set('negeriMajikan', s.negeriMajikan);
  set('penerimaJawatan', s.penerimaJawatan);

  set('tajukKustom', s.tajukKustom);
  set('sebab', s.sebab);
  set('tarikhMula', s.tarikhMula);
  set('tarikhAkhir', s.tarikhAkhir);

  // paragraphs
  const container = el('perengganContainer');
  // clear existing extra
  const all = container.querySelectorAll('label.field');
  all.forEach((lbl, i) => { if (i > 0) lbl.remove(); });
  const paras = Array.isArray(s.perengganTambahan) ? s.perengganTambahan : [];
  if (paras.length) {
    const first = container.querySelector('textarea[name="perenggan[]"]');
    first.value = paras[0] || '';
    for (let i = 1; i < paras.length; i++) {
      addParagraphField();
      const last = container.querySelectorAll('textarea[name="perenggan[]"]');
      last[last.length - 1].value = paras[i] || '';
    }
  }

  toggleContexts();
  updatePreview();
}

// Event wiring
function wire() {
  // populate select
  initJenisSurat();

  // initial contexts
  toggleContexts();

  // input listeners
  document.querySelectorAll('input, textarea, select').forEach(e => {
    e.addEventListener('input', updatePreview);
    e.addEventListener('change', updatePreview);
  });

  jenisSuratSelect.addEventListener('change', toggleContexts);
  el('btnTambahPerenggan').addEventListener('click', addParagraphField);
  el('btnSalin').addEventListener('click', copyText);
  el('btnPDF').addEventListener('click', downloadPDF);
  el('btnPrint').addEventListener('click', printLetter);
  el('btnReset').addEventListener('click', resetForm);
  el('btnShare').addEventListener('click', shareLink);

  // load from URL hash or localStorage
  loadFromHash();
  if (!location.hash) loadSave();

  // initial render
  updatePreview();
}

// Start
document.addEventListener('DOMContentLoaded', wire);
