// pageBlocker.js
// Módulo para bloquear páginas web peligrosas detectadas por Gemini

// Analiza la URL actual enviando un mensaje al background
function analizarUrlConGemini(url) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'ANALIZAR_URL', url }, (response) => {
            if (response && response.resultado) {
                resolve(response.resultado);
            } else {
                console.error('Error al consultar Gemini:', response && response.error);
                resolve(null);
            }
        });
    });
}

// Función para bloquear la página (puedes personalizar el mensaje)
function bloquearPagina() {
    document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#fff;"><h1 style="color:#e11d48;">⚠️ Acceso bloqueado</h1><p>Esta página ha sido bloqueada por tu seguridad.</p></div>';
}

// Lógica principal: analizar la URL y bloquear si es peligrosa
(async function() {
    const url = window.location.href;
    const resultado = await analizarUrlConGemini(url);
    if (resultado && resultado.toLowerCase().includes('peligros')) {
        bloquearPagina();
    }
})();

// Nota: Incluye este script como content script en manifest.json para que se ejecute en todas las páginas.
