// URL de tu servidor Flask. Si lo ejecutas localmente, no cambies esta URL.
const FLASK_SERVER_URL = "http://127.0.0.1:5000";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=";

const parentalControlPrompt = (text) => `
    Eres un asistente de monitoreo digital para padres. Analiza el siguiente texto y clasifícalo según su riesgo para un menor. Tu objetivo es ayudar a los padres a identificar posibles amenazas como el 'grooming', el acoso, el lenguaje ofensivo o la exposición a contenido inapropiado.
    
    Clasifica el texto en una de las siguientes categorías de riesgo:
    - 'ninguno': No hay riesgo aparente.
    - 'riesgo_bajo': Lenguaje soez o insultos leves.
    - 'riesgo_medio': Acoso leve, temas inapropiados, o conversaciones sobre información personal.
    - 'riesgo_alto': Amenazas, 'grooming' (ej. intento de obtener confianza, peticiones de fotos), o contenido sexualmente explícito.
    - 'riesgo_grave': Intento de incitar a autolesiones, discursos de odio o contenido que represente abuso.
    
    Tu respuesta debe ser en formato JSON con la siguiente estructura:
    {
      "categoria_riesgo": "<categoría_elegida>",
      "motivos_detectados": "<Una breve explicación de los indicios encontrados>"
    }
    
    Ahora, analiza el siguiente texto.
    
    Texto: '${text}'
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ANALYZE_TEXT") {
        chrome.storage.local.get('geminiApiKey', (data) => {
            const apiKey = data.geminiApiKey;
            if (!apiKey) {
                console.error('Clave de API de Gemini no encontrada. Por favor, configúrala en el panel de la extensión.');
                return;
            }

            fetch(GEMINI_API_URL + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "contents": [{ "parts": [{ "text": parentalControlPrompt(request.text) }] }],
                    "generation_config": {
                        "response_mime_type": "application/json"
                    }
                })
            })
            .then(response => response.json())
            .then(data => {
                const result = JSON.parse(data.candidates[0].content.parts[0].text);
                const categoria = result.categoria_riesgo;

                if (categoria !== 'ninguno' && categoria !== 'riesgo_bajo') {
                    chrome.tabs.get(sender.tab.id, (tab) => {
                        const incidente = {
                            texto: request.text,
                            url: tab.url,
                            categoria: categoria,
                            motivo: result.motivos_detectados
                        };

                        fetch(`${FLASK_SERVER_URL}/api/incidente`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(incidente)
                        })
                        .then(res => res.json())
                        .then(response => console.log('Incidente enviado a Flask:', response))
                        .catch(err => console.error('Error al enviar el incidente al servidor:', err));
                        
                        chrome.action.setBadgeText({ text: '!' });
                        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
                    });
                }
            })
            .catch(error => {
                console.error('Error al llamar a la API de Gemini:', error);
            });
        });
        return true;
    }
});