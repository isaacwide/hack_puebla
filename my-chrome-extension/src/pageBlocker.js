
// pageBlocker.js - BLOQUEO AUTOMÁTICO usando backend Yagel
function bloquearPagina() {
    document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#fff;"><h1 style="color:#e11d48;">⚠️ Acceso bloqueado</h1><p>Esta página ha sido bloqueada por tu seguridad.</p></div>';
}

// Evita ejecutar en iframes
if (window.top === window.self) {
    console.log('[ParentalControl] pageBlocker.js ejecutado en', window.location.href);
    (async function() {
        const url = window.location.href;
        chrome.runtime.sendMessage({ action: 'analyzeUrl', url }, (response) => {
            console.log('[ParentalControl] Respuesta del background:', response);
            if (response && response.status === 'success') {
                const resultado = response.result && response.result.trim();
                // Bloquea si NO es "URL Segura", "SAFE" o "SEGURA"
                if (resultado && !["URL Segura", "SAFE", "SEGURA"].includes(resultado)) {
                    console.log('[ParentalControl] Bloqueando página por resultado:', resultado);
                    bloquearPagina();
                } else {
                    console.log('[ParentalControl] Página considerada segura:', resultado);
                }
            } else {
                console.warn('[ParentalControl] Error o sin respuesta del background:', response);
            }
        });
    })();
}
// Nota: Incluye este script como content script en manifest.json para que se ejecute en todas las páginas.
