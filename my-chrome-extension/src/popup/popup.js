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

    // ...tu lógica previa para el botón principal...
    const button = document.getElementById('action-button');
    if (button) {
        button.addEventListener('click', function() {
            // Aquí tu lógica principal
            alert('Funcionalidad principal de la extensión');
        });
    }
});