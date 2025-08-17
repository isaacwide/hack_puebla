// pageBlocker.js
// Módulo para bloquear páginas web peligrosas detectadas por Gemini

// Analiza la URL actual enviando un mensaje al background
function analizarUrlConGemini(url) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'analyzeUrl', url }, (response) => {
            if (response && response.status === 'success') {
                resolve(response.result);
            } else {
                console.error('Error al consultar Gemini:', response && response.message);
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

// Categorías que deben bloquearse (deben coincidir con las del backend)
const categoriasBloqueo = [
    "Sitios de apuestas",
    "Contenido para adultos",
    "Redes sociales no permitidas",
    "Violencia explícita",
    "Desafíos peligrosos",
    "Fake news y desinformación"
];

(async function() {
    const url = window.location.href;
    const resultado = await analizarUrlConGemini(url);
    if (resultado && categoriasBloqueo.includes(resultado.trim())) {
        bloquearPagina();
    }
})();

// Nota: Incluye este script como content script en manifest.json para que se ejecute en todas las páginas.
