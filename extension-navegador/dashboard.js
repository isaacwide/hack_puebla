document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-btn');
    const statusMessage = document.getElementById('status-message');

    chrome.storage.local.get('geminiApiKey', (data) => {
        if (data.geminiApiKey) {
            apiKeyInput.value = data.geminiApiKey;
            statusMessage.textContent = 'Clave de API cargada.';
            statusMessage.style.color = 'green';
        }
    });

    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
                statusMessage.textContent = 'Clave guardada con éxito.';
                statusMessage.style.color = 'green';
            });
        } else {
            statusMessage.textContent = 'Por favor, ingresa una clave válida.';
            statusMessage.style.color = 'red';
        }
    });
});