function changeFavicon(value) {
	setFavicon(value);
	localStorage.setItem("shuttle||favicon", value);
}

function changeTitle(value) {
	document.title = value;
	localStorage.setItem("shuttle||title", value);
}

function resetTabSettings() {
    localStorage.removeItem("shuttle||title");
    localStorage.removeItem("shuttle||favicon");
    
    document.title = "Shuttle";
    setFavicon("/favicon.ico"); // Restore default favicon
    
    document.getElementById("tab-title-input").value = "";
    document.getElementById("tab-icon-input").value = "";
}

window.addEventListener("load", () => {
	// Load saved preferences
	try {
		const savedTheme = localStorage.getItem("shuttle||themehex");
		const savedAccent = localStorage.getItem("shuttle||accenthex");
		const savedBorder = localStorage.getItem("shuttle||borderhex");
        const savedSearch = localStorage.getItem("shuttle||search") || "ddg";
        const savedTitle = localStorage.getItem("shuttle||title");
        const savedIcon = localStorage.getItem("shuttle||favicon");

        const style = getComputedStyle(document.documentElement);

		if (savedTheme) {
			document.documentElement.style.setProperty('--bg-color', savedTheme);
		}
        document.querySelector("#colorPicker").value = style.getPropertyValue('--bg-color').trim();

		if (savedAccent) {
			document.documentElement.style.setProperty('--accent-color', savedAccent);
		}
        document.querySelector("#accentPicker").value = style.getPropertyValue('--accent-color').trim();

		if (savedBorder) {
			document.documentElement.style.setProperty('--border-color', savedBorder);
		}
        document.querySelector("#borderPicker").value = style.getPropertyValue('--border-color').trim();

        if (savedTitle) {
            document.getElementById("tab-title-input").value = savedTitle;
        }
        if (savedIcon) {
            document.getElementById("tab-icon-input").value = savedIcon;
        }

        // Set search engine radio
        const seRadio = document.querySelector(`input[name="se"][value="${savedSearch}"]`);
        if (seRadio) seRadio.checked = true;

	} catch (e) {}

	// Search engine radio logic
    document.querySelectorAll('input[name="se"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            localStorage.setItem("shuttle||search", e.target.value);
        });
    });

	document.querySelector("#reset-theme").addEventListener("click", resetTheme);
	document.querySelector("#abc").addEventListener("click", abc);
	document.querySelector("#mystery-button").addEventListener("click", setFortniteMode);
});

function changeTheme(value) {
	localStorage.setItem("shuttle||themehex", value);
	document.documentElement.style.setProperty('--bg-color', value);
}

function changeAccent(value) {
	localStorage.setItem("shuttle||accenthex", value);
	document.documentElement.style.setProperty('--accent-color', value);
}

function changeBorder(value) {
	localStorage.setItem("shuttle||borderhex", value);
	document.documentElement.style.setProperty('--border-color', value);
}

function resetTheme() {
	localStorage.removeItem("shuttle||themehex");
	localStorage.removeItem("shuttle||accenthex");
	localStorage.removeItem("shuttle||borderhex");
	
	document.documentElement.style.removeProperty('--bg-color');
	document.documentElement.style.removeProperty('--accent-color');
	document.documentElement.style.removeProperty('--border-color');

	// Reset pickers to defaults (from CSS)
	const style = getComputedStyle(document.documentElement);
	const bgColor = style.getPropertyValue('--bg-color').trim();
	const accentColor = style.getPropertyValue('--accent-color').trim();
	const borderColor = style.getPropertyValue('--border-color').trim();
	
	if (document.querySelector("#colorPicker")) document.querySelector("#colorPicker").value = bgColor;
	if (document.querySelector("#accentPicker")) document.querySelector("#accentPicker").value = accentColor;
	if (document.querySelector("#borderPicker")) document.querySelector("#borderPicker").value = borderColor;
}

function setFortniteMode() {
	if (localStorage.getItem("shuttle||fortniteMode") === "activated") {
		document.body.style.backgroundImage = "";
		localStorage.removeItem("shuttle||fortniteMode")
	} else {
		document.body.style.backgroundImage = "url(\"https://i.ytimg.com/vi/6evDWowLMbE/maxresdefault.jpg\")";
		localStorage.setItem("shuttle||fortniteMode", "activated");
	}
}