// Escuchador de mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Verifica si la acción solicitada es analizar la URL y el contenido
    if (request.action === "analyzeUrlAndContent") {
        // Ejecuta un script en la pestaña activa para obtener la URL y el contenido
        // de toda la página
        chrome.tabs.executeScript({
            code: `
                // Retorna un objeto con la URL de la página y el texto de todo el cuerpo del documento
                {
                    url: window.location.href,
                    content: document.body.innerText
                };
            `
        }, (result) => {
            // Verifica si se obtuvo un resultado válido del script
            if (chrome.runtime.lastError || !result || !result[0]) {
                // Si hubo un error, informa al popup y detiene la ejecución
                sendResponse({ success: false, error: "No se pudo obtener la URL o el contenido de la página." });
                return;
            }

            const { url, content } = result[0];

            // URL del servidor Flask
            const serverUrl = 'http://127.0.0.1:5000/api/analizar-url';

            // Realiza la petición POST a tu servidor Flask
            fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // El cuerpo de la petición contiene la URL y el contenido de la página
                body: JSON.stringify({ url, content })
            })
            .then(response => {
                // Maneja respuestas que no son exitosas (códigos 4xx o 5xx)
                if (!response.ok) {
                    throw new Error(`Error de red: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Envía la respuesta del servidor Flask de vuelta al popup
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                // Si la petición falla, informa al popup
                sendResponse({ success: false, error: `Error en la comunicación con el servidor: ${error.message}` });
            });
            // Retorna 'true' para indicar que la respuesta será asíncrona
            return true;
        });
        // Retorna 'true' para mantener abierto el canal de comunicación para la respuesta asíncrona
        return true;
    }
});

