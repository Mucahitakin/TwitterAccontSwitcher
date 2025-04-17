function renderAccounts() {
    chrome.storage.local.get(["accounts"], (data) => {
        const container = document.getElementById("accounts");
        container.innerHTML = "";

        const accounts = data.accounts || [];
        accounts.forEach((acc, i) => {
            const div = document.createElement("div");
            div.innerHTML = `
        <b>${acc.name}</b><br>
        <button data-index="${i}" class="switch">Geç</button>
        <button data-index="${i}" class="delete">Sil</button>
        <hr>
      `;
            container.appendChild(div);
        });

        document.querySelectorAll(".switch").forEach(btn =>
            btn.onclick = (e) => switchAccount(accounts[e.target.dataset.index])
        );

        document.querySelectorAll(".delete").forEach(btn =>
            btn.onclick = (e) => deleteAccount(e.target.dataset.index)
        );
    });
}

function addAccount() {
    const name = document.getElementById("name").value.trim();
    const token = document.getElementById("token").value.trim();

    if (!name || !token) return alert("Hesap adı ve auth_token boş olamaz.");

    chrome.storage.local.get(["accounts"], (data) => {
        const accounts = data.accounts || [];

        if (accounts.some(acc => acc.name === name)) {
            return alert("Bu isimde bir hesap zaten var.");
        }

        accounts.push({ name, token });

        chrome.storage.local.set({ accounts }, () => {
            document.getElementById("name").value = "";
            document.getElementById("token").value = "";
            renderAccounts();
        });
    });
}

function deleteAccount(index) {
    chrome.storage.local.get(["accounts"], (data) => {
        const accounts = data.accounts || [];
        accounts.splice(index, 1);
        chrome.storage.local.set({ accounts }, renderAccounts);
    });
}

function switchAccount(account) {
    chrome.cookies.set({
        url: "https://x.com",
        name: "auth_token",
        value: account.token,
        path: "/",
        domain: ".x.com"
    }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => location.reload()
            });
        });
    });
}
function importBulkTokens() {
    const input = document.getElementById("bulkTokens").value.trim();
    if (!input) return alert("Lütfen auth_token verilerini girin.");

    const tokens = input.split("\n").map(t => t.trim()).filter(t => t);
    if (tokens.length === 0) return alert("Geçerli token bulunamadı.");

    chrome.storage.local.get(["accounts"], (data) => {
        const existingAccounts = data.accounts || [];
        const startIndex = existingAccounts.length;

        tokens.forEach((token, idx) => {
            const name = `Hesap ${startIndex + idx + 1}`;
            existingAccounts.push({ name, token });
        });

        chrome.storage.local.set({ accounts: existingAccounts }, () => {
            document.getElementById("bulkTokens").value = "";
            renderAccounts();
            alert(`${tokens.length} hesap başarıyla eklendi.`);
        });
    });
}

document.getElementById("importBulk").onclick = importBulkTokens;

document.getElementById("add").onclick = addAccount;

renderAccounts();
