// src/background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "analyzeUrl") {
        const url = message.url;
        console.log(`URL a analizar: ${url}`);
        
        fetch('http://127.0.0.1:3000/analizar-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta del servidor:", data);
            const resultado = data.resultado;
            
            // Guarda el resultado en el almacenamiento local para que el popup lo lea
            chrome.storage.local.set({ 'lastAnalysis': resultado });
            
            // Envía el resultado a la extensión
            sendResponse({ status: "success", result: resultado });
        })
        .catch(error => {
            console.error("Error al conectar con el servidor:", error);
            sendResponse({ status: "error", message: error.toString() });
        });
        
        // Retorna true para indicar que la respuesta será asíncrona
        return true; 
    }
});