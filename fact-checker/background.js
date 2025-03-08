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

        // Inject loading popup with selected text
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
                args: [data.result]
            });
        })
        .catch(error => {
            console.error("Fact-checking failed:", error);
        });
    }
});

// Injected function: Show a floating loading popup with animation and close button
function showLoadingPopup(selectedText) {
    let existingPopup = document.getElementById("fact-check-popup");
    if (existingPopup) existingPopup.remove();

    let popup = document.createElement("div");
    popup.id = "fact-check-popup";
    popup.classList.add("fact-check-popup");

    // Nội dung popup ban đầu với nút đóng và trạng thái loading
    popup.innerHTML = `
        <button class="popup-close">&times;</button>
        <div class="popup-content">Checking...</div>
    `;
    
    // Xác định vị trí dựa vào vùng được chọn
    let selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    } else {
        // Vị trí mặc định nếu không tìm thấy vùng chọn
        popup.style.left = "50%";
        popup.style.top = "50%";
    }
    
    document.body.appendChild(popup);

    // Áp dụng hiệu ứng hiển thị (fade-in và scale)
    setTimeout(() => {
        popup.classList.add("show");
    }, 10);

    // Xử lý nút đóng
    popup.querySelector(".popup-close").addEventListener("click", () => {
        popup.remove();
    });
}


// Injected function: Update popup with AI result
function updatePopupWithResult(resultText) {
    let popup = document.getElementById("fact-check-popup");
    if (popup) {
        let contentDiv = popup.querySelector(".popup-content");
        if (contentDiv) {
            contentDiv.innerHTML = `<strong>AI Fact Check:</strong><br>${resultText}`;
        } else {
            popup.innerHTML = `<strong>AI Fact Check:</strong><br>${resultText}`;
        }
    }
}
