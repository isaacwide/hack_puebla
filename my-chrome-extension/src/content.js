// src/content.js
// Captura la URL actual de la página
const currentUrl = window.location.href;

// Envía un mensaje al service worker (background.js) con la URL
chrome.runtime.sendMessage({
    action: "analyzeUrl",
    url: currentUrl
});