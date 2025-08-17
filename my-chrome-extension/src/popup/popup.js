// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. Referencias a los elementos del DOM ---
    const contentDisplay = document.getElementById('content-display');
    const loadingSpinner = document.getElementById('loading-spinner');
    const refreshButton = document.getElementById('refresh-button');
    const flaskServerUrl = 'http://127.0.0.1:5000/api/analizar-url'; // URL de tu servidor Flask
    
    // Elementos de la nueva UI (bienvenida, PIN, menús, modales)
    const welcomeContainer = document.getElementById('welcome-container');
    const popupContainer = document.getElementById('popup-container');
    const acceptTerms = document.getElementById('accept-terms');
    const acceptButton = document.getElementById('accept-button');
    const googleLinkBtn = document.getElementById('google-link-btn');
    const googleUserInfo = document.getElementById('google-user-info');
    const pinSetup = document.getElementById('pin-setup');
    const pinInput = document.getElementById('pin-input');
    const setPinBtn = document.getElementById('set-pin-btn');
    const pinError = document.getElementById('pin-error');
    const btnCategorias = document.getElementById('btn-categorias');
    const btnAyuda = document.getElementById('btn-ayuda');
    const btnLogout = document.getElementById('btn-logout');
    const categoriasModal = document.getElementById('categorias-modal');
    const ayudaModal = document.getElementById('ayuda-modal');
    const closeCategorias = document.getElementById('close-categorias');
    const closeAyuda = document.getElementById('close-ayuda');
    const categoriasList = document.getElementById('categorias-list');
    const ayudaContent = document.getElementById('ayuda-content');
    const ayudaPrev = document.getElementById('ayuda-prev');
    const ayudaNext = document.getElementById('ayuda-next');
    const logoutModal = document.getElementById('logout-modal');
    const logoutPinInput = document.getElementById('logout-pin-input');
    const logoutPinError = document.getElementById('logout-pin-error');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');

    // Estado de la vinculación de Google
    let googleLinked = localStorage.getItem('googleLinked') === 'true';

    // --- 2. Funciones de Utilidad y UI ---
    
    /**
     * Muestra un mensaje temporal en la interfaz
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - 'success', 'error', 'info'.
     */
    const showMessage = (message, type = 'info') => {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;
        
        let colorClass = '';
        switch (type) {
            case 'success':
                colorClass = 'text-green-500';
                break;
            case 'error':
                colorClass = 'text-red-500';
                break;
            case 'info':
            default:
                colorClass = 'text-blue-500';
                break;
        }

        messageContainer.textContent = message;
        messageContainer.className = `text-center text-sm mb-4 ${colorClass}`;
        messageContainer.style.display = 'block';
    };

    /**
     * Muestra el estado de carga en la interfaz
     */
    const showLoading = () => {
        if (contentDisplay) contentDisplay.innerHTML = `<p class="text-gray-400">Analizando el sitio actual...</p>`;
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (refreshButton) refreshButton.disabled = true;
    };

    /**
     * Oculta el estado de carga
     */
    const hideLoading = () => {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (refreshButton) refreshButton.disabled = false;
    };

    // --- CÓDIGO AGREGADO/MODIFICADO AQUÍ ---
    /**
     * Muestra el resultado del análisis en la interfaz, incluyendo los consejos.
     * @param {object} result - El objeto de respuesta completo del backend.
     */
    const displayResult = (result) => {
        let titleColor, bgColor;
        const status = result.tipo_de_incidente;
        const geminiResponse = result.gemini_response;
        const consejos = result.consejos_seguridad;
        
        // La lógica de color se mantiene basada en las categorías conocidas
        switch (status) {
            case 'URL Segura':
                titleColor = 'text-green-500';
                bgColor = 'bg-green-800/20';
                break;
            case 'Página para Adultos':
                titleColor = 'text-red-500';
                bgColor = 'bg-red-800/20';
                break;
            case 'Contenido Inapropiado para Menores':
                titleColor = 'text-yellow-500';
                bgColor = 'bg-yellow-800/20';
                break;
            default:
                titleColor = 'text-gray-500';
                bgColor = 'bg-gray-800/20';
        }

        // Genera el HTML para los consejos de seguridad
        let consejosHtml = '';
        if (consejos && consejos.length > 0) {
            consejosHtml = `
                <h3 class="font-semibold text-green-400 mb-2">Consejos de Seguridad:</h3>
                <ul class="list-disc list-inside space-y-1 text-sm text-gray-400">
                    ${consejos.map(tip => `<li><strong>${tip.titulo}:</strong> ${tip.descripcion}</li>`).join('')}
                </ul>
            `;
        }

        if (contentDisplay) {
            contentDisplay.innerHTML = `
                <div class="${bgColor} rounded-md p-4 mb-4">
                    <h2 class="text-lg font-semibold ${titleColor} mb-2">${status}</h2>
                    <p class="text-gray-300 text-sm italic">${geminiResponse}</p>
                    ${consejosHtml}
                </div>
            `;
        }
    };
    // --- FIN DEL CÓDIGO AGREGADO/MODIFICADO ---

    /**
     * Llama al servidor Flask para analizar la URL
     * @param {string} url - La URL a analizar
     */
    const analyzeUrl = async (url) => {
        showLoading();
        try {
            const response = await fetch(flaskServerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            // --- CÓDIGO MODIFICADO AQUÍ: Pasar el objeto de datos completo ---
            displayResult(data);
            // --- FIN DEL CÓDIGO MODIFICADO ---

        } catch (error) {
            console.error('Error al analizar la URL:', error);
            if (contentDisplay) contentDisplay.innerHTML = `<p class="text-red-500 text-sm">Error: No se pudo conectar con el servidor.</p>`;
        } finally {
            hideLoading();
        }
    };

    /**
     * Obtiene la URL de la pestaña activa y la analiza
     */
    const getActiveTabAndAnalyze = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab && activeTab.url) {
                analyzeUrl(activeTab.url);
            } else {
                if (contentDisplay) contentDisplay.innerHTML = `<p class="text-gray-400">No se pudo obtener la URL de la pestaña.</p>`;
            }
        });
    };

    /**
     * Utilidad: hash SHA-256 con Web Crypto API
     * @param {string} pin - El PIN a hashear.
     * @returns {Promise<string>} - El hash en formato hexadecimal.
     */
    async function hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- 3. Lógica de UI Principal (Bienvenida, PIN, Autenticación) ---

    // Mostrar bienvenida o popup principal
    if (!localStorage.getItem('termsAccepted')) {
        if (welcomeContainer) welcomeContainer.style.display = 'block';
        if (popupContainer) popupContainer.style.display = 'none';
    } else {
        if (welcomeContainer) welcomeContainer.style.display = 'none';
        if (popupContainer) popupContainer.style.display = 'block';
    }

    // Mostrar campo de PIN si no existe
    if (pinSetup && !localStorage.getItem('pinHash')) {
        pinSetup.style.display = 'block';
        if (setPinBtn) {
            setPinBtn.onclick = async function() {
                const pin = pinInput.value;
                if (!/^\d{4}$/.test(pin)) {
                    if (pinError) pinError.style.display = 'block';
                    return;
                }
                if (pinError) pinError.style.display = 'none';
                const hash = await hashPin(pin);
                localStorage.setItem('pinHash', hash);
                pinSetup.style.display = 'none';
                showMessage('PIN guardado correctamente.', 'success');
            };
        }
    }

    // Vincular cuenta de Google
    if (googleLinkBtn) {
        googleLinkBtn.addEventListener('click', function() {
            if (!chrome.identity) {
                showMessage('No se puede acceder a la API de identidad de Chrome.', 'error');
                return;
            }
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError || !token) {
                    showMessage('No se pudo vincular la cuenta de Google.', 'error');
                    return;
                }
                fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: 'Bearer ' + token }
                })
                .then(res => res.json())
                .then(user => {
                    if (googleUserInfo) {
                        googleUserInfo.style.display = 'block';
                        googleUserInfo.textContent = `Cuenta vinculada: ${user.email}`;
                    }
                    googleLinked = true;
                    localStorage.setItem('googleLinked', 'true');
                    localStorage.setItem('googleEmail', user.email);
                })
                .catch(error => {
                    console.error('Error al obtener info de Google:', error);
                    showMessage('Error al obtener información de usuario.', 'error');
                });
            });
        });
    }

    // Habilitar botón de aceptar solo si términos y Google vinculados
    const updateAcceptButton = () => {
        if (acceptButton && acceptTerms) {
            acceptButton.disabled = !(acceptTerms.checked && googleLinked);
        }
    };

    if (acceptTerms) {
        acceptTerms.addEventListener('change', updateAcceptButton);
    }
    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            localStorage.setItem('termsAccepted', 'true');
            if (welcomeContainer) welcomeContainer.style.display = 'none';
            if (popupContainer) popupContainer.style.display = 'block';
        });
    }

    // Mostrar info de Google si ya está vinculada
    if (googleLinked && localStorage.getItem('googleEmail')) {
        if (googleUserInfo) {
            googleUserInfo.style.display = 'block';
            googleUserInfo.textContent = `Cuenta vinculada: ${localStorage.getItem('googleEmail')}`;
        }
    }
    
    // --- 4. Carga de Configuración y Lógica de Modales ---

    // Simulación de carga de configuración desde el backend
    async function cargarConfiguracionSimulada() {
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

    // Menú principal: lógica de botones
    if (btnCategorias && categoriasModal && categoriasList) {
        btnCategorias.addEventListener('click', async () => {
            const categorias = JSON.parse(localStorage.getItem('categoriasFiltradas'));
            if (categorias) {
                categoriasList.innerHTML = '';
                categorias.forEach(cat => {
                    const li = document.createElement('li');
                    li.textContent = cat;
                    categoriasList.appendChild(li);
                });
                categoriasModal.style.display = 'flex';
            }
        });
    }
    if (closeCategorias) closeCategorias.onclick = () => categoriasModal.style.display = 'none';

    // --- Modal educativo interactivo para el menor ---
    let ayudaIndex = 0;
    const ayudaTarjetas = [
        { html: `<div style="font-size:2em;">🔒</div><b>¡Tu seguridad es lo más importante!</b><br>Esta extensión bloquea sitios peligrosos y te avisa si detecta riesgos. ¡Así navegas más seguro!` },
        { html: `<div style="font-size:2em;">🧑‍💻</div><b>¡No compartas tus datos!</b><br>Nunca des tu contraseña, dirección o teléfono a nadie por internet, ni siquiera a tus amigos.` },
        { html: `<div style="font-size:2em;">🕵️‍♂️</div><b>¡Cuidado con los desconocidos!</b><br>Si alguien que no conoces te escribe, no respondas y avisa a un adulto.` },
        { html: `<b>Quiz rápido:</b><br>¿Qué debes hacer si ves un mensaje sospechoso en internet?<br><br><button class='quiz-btn' data-correct='1'>Ignorarlo y avisar a un adulto</button><br><button class='quiz-btn'>Responder y dar mis datos</button><br><button class='quiz-btn'>Compartirlo con amigos</button><div id='quiz-feedback' style='margin-top:8px;font-weight:bold;'></div>` },
        { html: `<b>Quiz rápido:</b><br>¿Cuál de estas contraseñas es más segura?<br><br><button class='quiz-btn'>123456</button><br><button class='quiz-btn' data-correct='1'>Gato$Rojo_2025</button><br><button class='quiz-btn'>miNombre</button><div id='quiz-feedback' style='margin-top:8px;font-weight:bold;'></div>` },
        { html: `<b>Quiz rápido:</b><br>¿Qué debes hacer si un amigo te pide tu contraseña?<br><br><button class='quiz-btn'>Dársela, porque es mi amigo</button><br><button class='quiz-btn' data-correct='1'>No compartirla nunca</button><br><button class='quiz-btn'>Solo si me promete no decirle a nadie</button><div id='quiz-feedback' style='margin-top:8px;font-weight:bold;'></div>` },
        { html: `<div style="font-size:2em;">💡</div><b>¡Pregunta siempre!</b><br>Si tienes dudas sobre algo que ves en internet, pregunta a tus padres o maestros.` },
        { html: `<b>Historia:</b><br>Alex recibió un mensaje de un desconocido. Recordó que debía avisar a sus padres y no respondió. ¡Así se mantuvo seguro!` },
        { html: `<div style="font-size:2em;">🎉</div><b>¡Felicidades!</b><br>Por usar la extensión, estás cuidando tu seguridad digital. ¡Sigue así!` },
        { html: `<b>¿Quieres aprender más?</b><br><a href='https://beinternetawesome.withgoogle.com/es' target='_blank'>Google Interland: Sé genial en Internet</a><br><a href='https://www.youtube.com/kids/' target='_blank'>YouTube Kids</a><br><a href='https://www.chaval.es/' target='_blank'>Chaval.es: Seguridad infantil</a>` }
    ];

    const renderAyudaTarjeta = () => {
        ayudaContent.innerHTML = ayudaTarjetas[ayudaIndex].html;
        const quizBtns = ayudaContent.querySelectorAll('.quiz-btn');
        const feedback = ayudaContent.querySelector('#quiz-feedback');
        if (quizBtns.length > 0 && feedback) {
            quizBtns.forEach(btn => {
                btn.onclick = () => {
                    if (btn.dataset.correct) {
                        feedback.textContent = '¡Correcto! ¡Sigue así!';
                        feedback.style.color = 'green';
                    } else {
                        let msg = 'Respuesta incorrecta. ¡Recuerda siempre proteger tu información!';
                        feedback.textContent = msg;
                        feedback.style.color = 'red';
                    }
                };
            });
        }
    };
    
    if (btnAyuda) {
        btnAyuda.onclick = () => {
            ayudaIndex = 0;
            renderAyudaTarjeta();
            if (ayudaModal) ayudaModal.style.display = 'flex';
        };
    }
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
    if (btnLogout) {
        btnLogout.onclick = () => {
            if (logoutPinInput) logoutPinInput.value = '';
            if (logoutPinError) logoutPinError.style.display = 'none';
            if (logoutModal) logoutModal.style.display = 'flex';
        };
    }
    if (cancelLogout) cancelLogout.onclick = () => logoutModal.style.display = 'none';
    if (confirmLogout) {
        confirmLogout.onclick = async function() {
            const pin = logoutPinInput.value;
            const storedHash = localStorage.getItem('pinHash');
            const hash = await hashPin(pin);
            if (hash === storedHash) {
                localStorage.removeItem('googleLinked');
                localStorage.removeItem('googleEmail');
                localStorage.removeItem('termsAccepted');
                localStorage.removeItem('pinHash');
                if (logoutModal) logoutModal.style.display = 'none';
                location.reload();
            } else {
                if (logoutPinError) logoutPinError.style.display = 'block';
            }
        };
    }

    // --- 5. Inicialización de la Aplicación ---
    
    // Simular carga de configuración al iniciar
    cargarConfiguracionSimulada().then(() => {
        // La configuración se ha cargado, ahora podemos inicializar la UI
        updateAcceptButton();
    });

    // Llama a la función principal para analizar la URL si la UI ya está en el popup
    if (localStorage.getItem('termsAccepted')) {
        getActiveTabAndAnalyze();
    }

    // Añade el evento de clic al botón de re-analizar
    if (refreshButton) {
        refreshButton.addEventListener('click', getActiveTabAndAnalyze);
    }
});

