chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "factCheck",
        title: "Fact Check with AI",
        contexts: ["selection"] // Only show when text is selected
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "factCheck") {
        const selectedText = info.selectionText;
        if (!selectedText) return;

        // Send a message to content script to show loading popup
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: showLoadingPopup,
            args: [selectedText]
        });

        // Send request to AI backend
        fetch("http://localhost:8000/fact-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: selectedText })
        })
        .then(response => response.json())
        .then(data => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: updatePopupWithResult,
                args: [data.fake-likeliness, data.reason, data.source]
            });
        })
        .catch(error => {
            console.error("Fact-checking failed:", error);
        });
    }
});

// Injected function: Show a floating loading popup
function showLoadingPopup(selectedText) {
    let existingPopup = document.getElementById("fact-check-popup");
    if (existingPopup) existingPopup.remove();

    let popup = document.createElement("div");
    popup.id = "fact-check-popup";
    popup.style.position = "absolute";
    popup.style.background = "white";
    popup.style.border = "1px solid #ccc";
    popup.style.padding = "8px";
    popup.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "10000";
    popup.style.fontSize = "14px";
    popup.innerText = "Checking...";
    
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();

    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

    document.body.appendChild(popup);
}

// Injected function: Update popup with AI result
function updatePopupWithResult(resultText) {
    let popup = document.getElementById("fact-check-popup");
    if (popup) {
        popup.innerHTML = `<strong>AI Fact Check:</strong><br>${resultText}`;
    }
}
