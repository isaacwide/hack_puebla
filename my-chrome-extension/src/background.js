
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "analyzeUrl") {
        const url = message.url;
        fetch('http://127.0.0.1:5000/api/analizar-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            // Envía el resultado a la extensión, usando la clave que exista
            const result = data.resultado || data.result || data.tipo_de_incidente || undefined;
            sendResponse({ status: "success", result });
        })
        .catch(error => {
            sendResponse({ status: "error", message: error.toString() });
        });
        // Retorna true para indicar que la respuesta será asíncrona
        return true;
    }
});

