    // Utilidad: hash SHA-256 con Web Crypto API
    async function hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- PIN setup en configuración inicial ---
    const pinSetup = document.getElementById('pin-setup');
    const pinInput = document.getElementById('pin-input');
    const setPinBtn = document.getElementById('set-pin-btn');
    const pinError = document.getElementById('pin-error');
    // Mostrar campo de PIN si no existe
    if (!localStorage.getItem('pinHash')) {
        pinSetup.style.display = 'block';
        setPinBtn.onclick = async function() {
            const pin = pinInput.value;
            if (!/^\d{4}$/.test(pin)) {
                pinError.style.display = 'block';
                return;
            }
            pinError.style.display = 'none';
            const hash = await hashPin(pin);
            localStorage.setItem('pinHash', hash);
            pinSetup.style.display = 'none';
            alert('PIN guardado correctamente.');
        };
    }
document.addEventListener('DOMContentLoaded', function() {

    // Lógica de bienvenida y términos
    const welcomeContainer = document.getElementById('welcome-container');
    const popupContainer = document.getElementById('popup-container');
    const acceptTerms = document.getElementById('accept-terms');
    const acceptButton = document.getElementById('accept-button');
    const googleLinkBtn = document.getElementById('google-link-btn');
    const googleUserInfo = document.getElementById('google-user-info');

    // Estado de vinculación
    let googleLinked = false;

    // Mostrar bienvenida solo si no se han aceptado los términos
    if (!localStorage.getItem('termsAccepted')) {
        welcomeContainer.style.display = 'block';
        popupContainer.style.display = 'none';
    } else {
        welcomeContainer.style.display = 'none';
        popupContainer.style.display = 'block';
    }

    // Vincular cuenta de Google
    if (googleLinkBtn) {
        googleLinkBtn.addEventListener('click', function() {
            if (!chrome.identity) {
                alert('No se puede acceder a la API de identidad de Chrome.');
                return;
            }
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError || !token) {
                    alert('No se pudo vincular la cuenta de Google.');
                    return;
                }
                // Obtener info del usuario
                fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: 'Bearer ' + token }
                })
                .then(res => res.json())
                .then(user => {
                    googleUserInfo.style.display = 'block';
                    googleUserInfo.textContent = `Cuenta vinculada: ${user.email}`;
                    googleLinked = true;
                    localStorage.setItem('googleLinked', 'true');
                    localStorage.setItem('googleEmail', user.email);
                });
            });
        });
    }

    // Habilitar botón aceptar solo si términos y Google vinculados
    function updateAcceptButton() {
        acceptButton.disabled = !(acceptTerms.checked && (googleLinked || localStorage.getItem('googleLinked') === 'true'));
    }
    if (acceptTerms && acceptButton) {
        acceptTerms.addEventListener('change', updateAcceptButton);
        updateAcceptButton();
        acceptButton.addEventListener('click', function() {
            localStorage.setItem('termsAccepted', 'true');
            welcomeContainer.style.display = 'none';
            popupContainer.style.display = 'block';
        });
    }

    // Mostrar info de Google si ya está vinculada
    if (localStorage.getItem('googleLinked') === 'true' && localStorage.getItem('googleEmail')) {
        googleUserInfo.style.display = 'block';
        googleUserInfo.textContent = `Cuenta vinculada: ${localStorage.getItem('googleEmail')}`;
        googleLinked = true;
    }


    // Menú principal: lógica de botones
    const btnCategorias = document.getElementById('btn-categorias');
    const btnAyuda = document.getElementById('btn-ayuda');
    const btnLogout = document.getElementById('btn-logout');
    const categoriasModal = document.getElementById('categorias-modal');
    const ayudaModal = document.getElementById('ayuda-modal');
    const closeCategorias = document.getElementById('close-categorias');
    const closeAyuda = document.getElementById('close-ayuda');
    const categoriasList = document.getElementById('categorias-list');

    // Ejemplo de categorías filtradas (puedes cargar dinámicamente)
    const categoriasEjemplo = [
        'Sitios de apuestas',
        'Contenido para adultos',
        'Redes sociales no permitidas',
        'Violencia explícita',
        'Desafíos peligrosos',
        'Fake news y desinformación'
    ];

    if (btnCategorias) {
        btnCategorias.addEventListener('click', function() {
            categoriasList.innerHTML = '';
            categoriasEjemplo.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = cat;
                categoriasList.appendChild(li);
            });
            categoriasModal.style.display = 'flex';
        });
    }
    if (closeCategorias) closeCategorias.onclick = () => categoriasModal.style.display = 'none';

    if (btnAyuda) btnAyuda.onclick = () => ayudaModal.style.display = 'flex';
    if (closeAyuda) closeAyuda.onclick = () => ayudaModal.style.display = 'none';

    // --- Cierre de sesión con PIN ---
    const logoutModal = document.getElementById('logout-modal');
    const logoutPinInput = document.getElementById('logout-pin-input');
    const logoutPinError = document.getElementById('logout-pin-error');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    if (btnLogout) btnLogout.onclick = () => {
        logoutPinInput.value = '';
        logoutPinError.style.display = 'none';
        logoutModal.style.display = 'flex';
    };
    if (cancelLogout) cancelLogout.onclick = () => logoutModal.style.display = 'none';
    if (confirmLogout) confirmLogout.onclick = async function() {
        const pin = logoutPinInput.value;
        const hash = await hashPin(pin);
        if (hash === localStorage.getItem('pinHash')) {
            // Cierra sesión
            localStorage.removeItem('googleLinked');
            localStorage.removeItem('googleEmail');
            localStorage.removeItem('termsAccepted');
            localStorage.removeItem('pinHash');
            logoutModal.style.display = 'none';
            location.reload();
        } else {
            logoutPinError.style.display = 'block';
        }
    };
});