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
            if (data.hasOwnProperty("error")) {
                // Handle the error case
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: updatePopupWithError, // New function to handle error display
                    args: [data["error"]]
                });
            } else {
                // Handle the successful response
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: updatePopupWithResult,
                    args: [data["fake_likelihood"], data["reason"], data["source"]]
                });
            }
        })
        .catch(error => {
            console.error("Fact-checking failed:", error);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: updatePopupWithError,
                args: [error]
            })
        });
    }
});

// Injected function: Show a floating loading popup with animation and close button
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
    popup.innerHTML = `<button onclick='this.parentElement.remove()'
        style="background: grey, color: black">X</button> Checking...`;

    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();

    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

    document.body.appendChild(popup);
}


// Injected function: Update popup with AI result
function updatePopupWithResult(fakeLikelihood, reason, source) {
    let popup = document.getElementById("fact-check-popup");
    if (popup) {
        let sourcesHTML = source.map(link => `<a href="${link}" target="_blank">${link}</a>`).join("<br>");
        popup.innerHTML = `<strong>AI Fact Check:</strong><br>
            Fake likeliness (1-least to 5-most): ${fakeLikelihood}<br><br>
            <strong>Reason:</strong> ${reason}<br><br>
            <strong>Sources:</strong><br> ${sourcesHTML}<br><br>
            <button onclick='this.parentElement.remove()' style="background: grey, color: black">Done</button>`;
    }
}

function updatePopupWithError(error) {
    let popup = document.getElementById("fact-check-popup");
    if (popup) {
        let sourcesHTML = source.map(link => `<a href="${link}" target="_blank">${link}</a>`).join("<br>");
        popup.innerHTML = `<strong>Error: </strong><br>Unexpected agent response: ${error}<br>
            Please try again.<br><br>
            <button onclick='this.parentElement.remove()' style="background: grey, color: black">Done</button>`;
    }
}
