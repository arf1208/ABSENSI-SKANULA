// --- script.js ---

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Pastikan form ditemukan
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            
            // Mengambil nilai input
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            let isValid = true; // Bendera validasi
            
            // 1. Validasi Username (NIS/NIP)
            if (username === '') {
                displayError('usernameError', 'NIS/NIP/Username tidak boleh kosong.');
                isValid = false;
            } else {
                hideError('usernameError');
            }
            
            // 2. Validasi Password
            if (password === '') {
                displayError('passwordError', 'Password tidak boleh kosong.');
                isValid = false;
            } else if (password.length < 6) {
                 displayError('passwordError', 'Password minimal 6 karakter.');
                 isValid = false;
            } else {
                hideError('passwordError');
            }
            
            // Jika validasi gagal, hentikan pengiriman form
            if (!isValid) {
                event.preventDefault(); 
            }
            
            // Catatan: Jika ingin menambahkan validasi yang lebih kompleks (misalnya format NIS), lakukan di sini.
        });
    }


    // --- Fungsi Bantuan ---

    function displayError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
});
