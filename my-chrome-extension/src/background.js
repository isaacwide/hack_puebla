// This file contains the background script for the Chrome extension. It handles events and manages the extension's lifecycle.

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});

// Add any additional event listeners or background tasks here.