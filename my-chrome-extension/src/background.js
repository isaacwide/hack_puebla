chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeUrlAndContent") {
        chrome.tabs.executeScript({
            code: `
                // Retorna un objeto con la URL de la página y el texto de todo el cuerpo del documento
                {
                    url: window.location.href,
                    content: document.body.innerText
                };
            `
        }, (result) => {
            if (chrome.runtime.lastError || !result || !result[0]) {
                sendResponse({ success: false, error: "No se pudo obtener la URL o el contenido de la página." });
                return;
            }

            const { url, content } = result[0];

            const serverUrl = 'http://127.0.0.1:5000/api/analizar-url';

            fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, content })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de red: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                sendResponse({ success: false, error: `Error en la comunicación con el servidor: ${error.message}` });
            });
            return true;
        });
        return true;
    }
});

