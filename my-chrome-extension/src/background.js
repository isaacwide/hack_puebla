// This file contains the background script for the Chrome extension. It handles events and manages the extension's lifecycle.

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});

// Listener para analizar URLs desde el content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALIZAR_URL') {
        fetch('http://127.0.0.1:3000/analizar-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: message.url })
        })
        .then(resp => resp.json())
        .then(data => sendResponse({ resultado: data.resultado }))
        .catch(err => sendResponse({ error: err.toString() }));
        // Indica que la respuesta es asíncrona
        return true;
    }
});