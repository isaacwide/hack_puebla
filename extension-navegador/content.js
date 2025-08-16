console.log("Script de monitoreo de control parental inyectado.");

const selectors = 'input[type="text"], textarea, [contenteditable="true"]';

document.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const targetElement = event.target;
        if (targetElement.matches(selectors)) {
            const textContent = targetElement.value || targetElement.textContent;
            if (textContent && textContent.trim().length > 0) {
                chrome.runtime.sendMessage({
                    type: "ANALYZE_TEXT",
                    text: textContent
                });
            }
        }
    }
});