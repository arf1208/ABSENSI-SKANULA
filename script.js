// --- Data Dummy (Simulasi Database) ---
const STUDENT_DATABASE = [
    { id: "S12345678", name: "Budi Santoso", class: "X RPL 1" },
    { id: "S87654321", name: "Siti Aminah", class: "XI TKJ 2" },
];
const TEACHER_DATABASE = [
    { id: "G0001", name: "Ibu Rina", subject: "Matematika" },
    { id: "G0002", name: "Bapak Tono", subject: "Informatika" },
];

const STORAGE_KEY = 'absensi_barcode_log';
let attendanceLog = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentMode = 'SISWA'; // Default mode aktif
let lastScannedBarcode = null; // Mencegah scan duplikat

// --- Fungsi Utilitas ---

function getCurrentTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function getTodayDate() {
    return new Date().toLocaleDateString('id-ID');
}

// --- Kontrol Scanner ---

function startScanner() {
    // Hentikan scanner jika sudah berjalan
    if (Quagga.running) {
        Quagga.stop();
    }
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#interactive'),
            constraints: {
                facingMode: "environment" // Gunakan kamera belakang
            }
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader", "code_39_reader"]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            const msg = 'ERROR: Gagal akses kamera. Pastikan izin diberikan.';
            document.getElementById('statusMessage').textContent = msg;
            document.getElementById('statusMessage').className = 'status-message status-error';
            return;
        }
        Quagga.start();
        console.log("QuaggaJS berhasil dimulai.");
    });

    // Pasang event listener deteksi
    Quagga.onDetected(handleBarcodeDetected);
}

function handleBarcodeDetected(data) {
    const barcode = data.codeResult.code;

    // Pencegahan scan duplikat dalam 3 detik
    if (barcode === lastScannedBarcode && (Date.now() - window.lastScanTime < 3000)) {
        return; 
    }

    lastScannedBarcode = barcode;
    window.lastScanTime = Date.now();
    
    document.getElementById('barcode-result').textContent = barcode;
    Quagga.stop(); // Hentikan scanner setelah sukses
    
    processAttendance(barcode);
}

// --- Logika Absensi ---

function processAttendance(id) {
    const statusDiv = document.getElementById('statusMessage');
    const today = getTodayDate();
    const currentTime = getCurrentTime();
    let entity = null;
    let type = currentMode; // Mengambil mode aktif saat pemindaian

    // Tentukan entitas (Siswa atau Guru)
    if (type === 'SISWA') {
        entity = STUDENT_DATABASE.find(s => s.id === id);
    } else if (type === 'GURU') {
        entity = TEACHER_DATABASE.find(t => t.id === id);
    }
    
    if (!entity) {
        statusDiv.textContent = `ID ${id} (${type}) tidak ditemukan di database.`;
        statusDiv.className = 'status-message status-error';
        setTimeout(startScanner, 3000);
        return;
    }

    // Cek duplikasi absensi hari ini untuk ID yang sama
    const isAlreadyAbsent = attendanceLog.some(item => 
        item.id === id && item.date === today
    );

    if (isAlreadyAbsent) {
        statusDiv.textContent = `Error: ${entity.name} (${type}) sudah absen hari ini!`;
        statusDiv.className = 'status-message status-error';
        setTimeout(startScanner, 3000);
        return;
    }

    // Catat Absensi Baru
    const newEntry = {
        date: today,
        time: currentTime,
        id: id,
        name: entity.name,
        type: type,
        detail: type === 'SISWA' ? entity.class : entity.subject,
        status: "Hadir"
    };

    attendanceLog.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendanceLog));

    // Beri Feedback Sukses
    statusDiv.textContent = `Sukses! ${entity.name} (${type}) Hadir pada ${currentTime}.`;
    statusDiv.className = 'status-message status-success';
    
    renderAttendanceLog();
    
    // Mulai scanner lagi
    setTimeout(startScanner, 3000); 
}

// --- Tampilan Log dan Kontrol Mode ---

function renderAttendanceLog() {
    const body = document.getElementById('attendanceBody');
    body.innerHTML = '';
    const today = getTodayDate();

    // Filter dan tampilkan log hari ini (terbaru di atas)
    const todayLog = attendanceLog.filter(item => item.date === today);
    todayLog.reverse(); 

    todayLog.forEach(item => {
        const row = body.insertRow();
        row.insertCell().textContent = item.time;
        row.insertCell().textContent = `${item.id} (${item.name})`;
        row.insertCell().textContent = item.status;
        row.insertCell().textContent = item.type;
    });
}

function switchMode(newMode) {
    currentMode = newMode;
    document.getElementById('currentMode').textContent = newMode;
    document.getElementById('barcode-result').textContent = 'Menunggu pemindaian...';
    document.getElementById('statusMessage').textContent = `Siap memindai ID ${newMode}.`;
    document.getElementById('statusMessage').className = 'status-message';
    
    // Update tombol aktif
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.mode-btn[data-mode="${newMode}"]`).classList.add('active');

    // Mulai ulang scanner
    startScanner();
}

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners untuk tombol mode
    document.getElementById('modeStudent').addEventListener('click', () => switchMode('SISWA'));
    document.getElementById('modeTeacher').addEventListener('click', () => switchMode('GURU'));

    // Inisialisasi tampilan awal
    renderAttendanceLog(); 
    // Mulai scanner untuk mode default
    startScanner();
});
