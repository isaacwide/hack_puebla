// --- Simulación de carga de configuración desde la web/backend ---
async function cargarConfiguracionSimulada() {
    // Simula un fetch a un backend remoto
    return new Promise(resolve => {
        setTimeout(() => {
            const categorias = [
                'Sitios de apuestas',
                'Contenido para adultos',
                'Redes sociales no permitidas',
                'Violencia explícita',
                'Desafíos peligrosos',
                'Fake news y desinformación'
            ];
            localStorage.setItem('categoriasFiltradas', JSON.stringify(categorias));
            resolve(categorias);
        }, 1000);
    });
}
    // Cargar configuración simulada al iniciar el popup
    cargarConfiguracionSimulada().then(categorias => {
        if (typeof categoriasList !== 'undefined' && Array.isArray(categorias)) {
            categoriasList.innerHTML = '';
            categorias.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = cat;
                categoriasList.appendChild(li);
            });
        }
    });
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


    // --- Modal educativo interactivo para el menor ---
    const ayudaContent = document.getElementById('ayuda-content');
    const ayudaPrev = document.getElementById('ayuda-prev');
    const ayudaNext = document.getElementById('ayuda-next');
    let ayudaIndex = 0;
    // Tarjetas educativas: tips, quiz, historias, recursos
    const ayudaTarjetas = [
        // 1. Tip visual
        {
            html: `<div style=\"font-size:2em;\">🔒</div><b>¡Tu seguridad es lo más importante!</b><br>Esta extensión bloquea sitios peligrosos y te avisa si detecta riesgos. ¡Así navegas más seguro!`,
        },
        // 2. Tip visual
        {
            html: `<div style=\"font-size:2em;\">🧑‍💻</div><b>¡No compartas tus datos!</b><br>Nunca des tu contraseña, dirección o teléfono a nadie por internet, ni siquiera a tus amigos.`,
        },
        // 3. Tip visual
        {
            html: `<div style=\"font-size:2em;\">🕵️‍♂️</div><b>¡Cuidado con los desconocidos!</b><br>Si alguien que no conoces te escribe, no respondas y avisa a un adulto.`,
        },
        // 4. Mini-quiz 1
        {
            html: `<b>Quiz rápido:</b><br>¿Qué debes hacer si ves un mensaje sospechoso en internet?<br><br>
                <button class='quiz-btn' data-correct='1'>Ignorarlo y avisar a un adulto</button><br>
                <button class='quiz-btn'>Responder y dar mis datos</button><br>
                <button class='quiz-btn'>Compartirlo con amigos</button>
                <div id='quiz-feedback' style='margin-top:8px;font-weight:bold;'></div>`
        },
        // 5. Mini-quiz 2
        {
            html: `<b>Quiz rápido:</b><br>¿Cuál de estas contraseñas es más segura?<br><br>
                <button class='quiz-btn'>123456</button><br>
                <button class='quiz-btn' data-correct='1'>Gato$Rojo_2025</button><br>
                <button class='quiz-btn'>miNombre</button>
                <div id='quiz-feedback' style='margin-top:8px;font-weight:bold;'></div>`
        },
        // 6. Mini-quiz 3
        {
            html: `<b>Quiz rápido:</b><br>¿Qué debes hacer si un amigo te pide tu contraseña?<br><br>
                <button class='quiz-btn'>Dársela, porque es mi amigo</button><br>
                <button class='quiz-btn' data-correct='1'>No compartirla nunca</button><br>
                <button class='quiz-btn'>Solo si me promete no decirle a nadie</button>
                <div id='quiz-feedback' style='margin-top:8px;font-weight:bold;'></div>`
        },
        // 7. Tip visual
        {
            html: `<div style=\"font-size:2em;\">💡</div><b>¡Pregunta siempre!</b><br>Si tienes dudas sobre algo que ves en internet, pregunta a tus padres o maestros.`,
        },
        // 8. Historia corta
        {
            html: `<b>Historia:</b><br>Alex recibió un mensaje de un desconocido. Recordó que debía avisar a sus padres y no respondió. ¡Así se mantuvo seguro!`,
        },
        // 9. Reconocimiento
        {
            html: `<div style=\"font-size:2em;\">🎉</div><b>¡Felicidades!</b><br>Por usar la extensión, estás cuidando tu seguridad digital. ¡Sigue así!`,
        },
        // 10. Recursos
        {
            html: `<b>¿Quieres aprender más?</b><br>
                <a href='https://beinternetawesome.withgoogle.com/es' target='_blank'>Google Interland: Sé genial en Internet</a><br>
                <a href='https://www.youtube.com/kids/' target='_blank'>YouTube Kids</a><br>
                <a href='https://www.chaval.es/' target='_blank'>Chaval.es: Seguridad infantil</a>`
        }
    ];

    function renderAyudaTarjeta() {
        ayudaContent.innerHTML = ayudaTarjetas[ayudaIndex].html;
        // Quiz feedback para todas las tarjetas de quiz
        if ([3,4,5].includes(ayudaIndex)) {
            const quizBtns = ayudaContent.querySelectorAll('.quiz-btn');
            quizBtns.forEach((btn, idx) => {
                btn.onclick = function() {
                    const feedback = ayudaContent.querySelector('#quiz-feedback');
                    if (btn.dataset.correct) {
                        feedback.textContent = '¡Correcto! ¡Sigue así!';
                        feedback.style.color = 'green';
                    } else {
                        // Mensajes personalizados según la pregunta
                        let msg = 'Respuesta incorrecta. ¡Recuerda siempre proteger tu información!';
                        if (ayudaIndex === 3) msg = 'Respuesta incorrecta. Nunca respondas ni compartas mensajes sospechosos.';
                        if (ayudaIndex === 4) msg = 'Respuesta incorrecta. Usa contraseñas largas, con letras, números y símbolos.';
                        if (ayudaIndex === 5) msg = 'Respuesta incorrecta. ¡Nunca compartas tu contraseña, ni siquiera con amigos!';
                        feedback.textContent = msg;
                        feedback.style.color = 'red';
                    }
                };
            });
        }
    }

    if (btnAyuda) btnAyuda.onclick = () => {
        ayudaIndex = 0;
        renderAyudaTarjeta();
        ayudaModal.style.display = 'flex';
    };
    if (closeAyuda) closeAyuda.onclick = () => ayudaModal.style.display = 'none';
    if (ayudaPrev) ayudaPrev.onclick = () => {
        if (ayudaIndex > 0) {
            ayudaIndex--;
            renderAyudaTarjeta();
        }
    };
    if (ayudaNext) ayudaNext.onclick = () => {
        if (ayudaIndex < ayudaTarjetas.length - 1) {
            ayudaIndex++;
            renderAyudaTarjeta();
        }
    };

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