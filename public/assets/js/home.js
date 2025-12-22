const searchInput = document.getElementById("search");
const searchForm = document.getElementById("form");
const suggestions = document.getElementById("suggestions");
const searchTip = document.getElementById("search-tip");
const engineDropdown = document.getElementById("engine-dropdown");
const engineSelected = engineDropdown.querySelector(".select-selected");
const engineItems = engineDropdown.querySelector(".select-items");

let debounceTimeout;
let selectedIndex = -1;
let engineSelectedIndex = -1;

const engineIcons = {
    ddg: "/ddg.png",
    google: "/google.png",
    brave: "/brave.png"
};

// Load saved search engine
let currentEngine = localStorage.getItem("shuttle||search") || "ddg";
updateEngineUI(currentEngine);

function updateEngineUI(engine) {
    const icon = engineSelected.querySelector("img");
    icon.src = engineIcons[engine];
    icon.alt = engine;
    localStorage.setItem("shuttle||search", engine);
}

// Custom Select Logic
function toggleEngineDropdown() {
    engineItems.classList.toggle("select-hide");
    if (!engineItems.classList.contains("select-hide")) {
        engineSelectedIndex = -1;
        updateEngineSelectedIndex(-1);
    }
}

engineSelected.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleEngineDropdown();
});

function updateEngineSelectedIndex(index) {
    const items = engineItems.querySelectorAll("div");
    items.forEach(item => item.classList.remove("active"));
    
    engineSelectedIndex = index;
    if (engineSelectedIndex >= 0 && engineSelectedIndex < items.length) {
        items[engineSelectedIndex].classList.add("active");
    }
}

engineDropdown.addEventListener("keydown", (e) => {
    const items = engineItems.querySelectorAll("div");
    
    if (e.key === "Enter" || e.key === " ") {
        if (engineItems.classList.contains("select-hide")) {
            e.preventDefault();
            toggleEngineDropdown();
        } else if (engineSelectedIndex >= 0) {
            e.preventDefault();
            const val = items[engineSelectedIndex].dataset.value;
            currentEngine = val;
            updateEngineUI(val);
            engineItems.classList.add("select-hide");
            searchInput.focus();
        }
    } else if (e.key === "ArrowDown" && !engineItems.classList.contains("select-hide")) {
        e.preventDefault();
        updateEngineSelectedIndex((engineSelectedIndex + 1) % items.length);
    } else if (e.key === "ArrowUp" && !engineItems.classList.contains("select-hide")) {
        e.preventDefault();
        updateEngineSelectedIndex((engineSelectedIndex - 1 + items.length) % items.length);
    } else if (e.key === "Escape") {
        engineItems.classList.add("select-hide");
    }
});

engineItems.querySelectorAll("div").forEach((item, index) => {
    item.addEventListener("click", () => {
        currentEngine = item.dataset.value;
        updateEngineUI(currentEngine);
        engineItems.classList.add("select-hide");
    });
    item.addEventListener("mouseenter", () => {
        updateEngineSelectedIndex(index);
    });
});

document.addEventListener("click", () => {
    engineItems.classList.add("select-hide");
});

function updateTipVisibility(visible) {
    if (searchTip) {
        if (visible) searchTip.classList.add("visible");
        else searchTip.classList.remove("visible");
    }
}

searchForm.addEventListener("submit", (event) => {
	event.preventDefault();
    const activeItem = suggestions.querySelector(".suggestion-item.active");
    if (activeItem) {
        const text = activeItem.querySelector("span").innerText;
        searchInput.value = text;
        go(text);
    } else {
        go(searchInput.value);
    }
    suggestions.style.display = "none";
    updateTipVisibility(false);
});

async function fetchResults(searchText) {
	try {
		const response = await bare.fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(searchText)}`);
		const data = await response.json();
		
		if (!Array.isArray(data)) return;

		suggestions.innerHTML = "";
        selectedIndex = -1;
		
		data.forEach((item, index) => {
            const result = item.phrase;
			const suggestionItem = document.createElement("div");
			suggestionItem.className = "suggestion-item";
            suggestionItem.dataset.index = index;
			
            suggestionItem.innerHTML = `<i class="fas fa-search"></i><span>${result}</span>`;

			suggestionItem.addEventListener("click", () => {
				searchInput.value = result;
				go(result);
                suggestions.style.display = "none";
                updateTipVisibility(false);
			});

            suggestionItem.addEventListener("mouseenter", () => {
                updateSelectedIndex(index);
            });

			suggestions.appendChild(suggestionItem);
		});

        if (data.length > 0) {
            suggestions.style.display = "block";
            updateTipVisibility(true);
        } else {
            suggestions.style.display = "none";
            updateTipVisibility(false);
        }
	} catch (e) {
		console.error(e);
	}
}

function updateSelectedIndex(index) {
    const items = suggestions.querySelectorAll(".suggestion-item");
    items.forEach(item => item.classList.remove("active"));
    
    selectedIndex = index;
    if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].classList.add("active");
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

searchInput.addEventListener("keydown", (e) => {
    const items = suggestions.querySelectorAll(".suggestion-item");
    
    if (suggestions.style.display === "block" && items.length > 0) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            updateSelectedIndex((selectedIndex + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            updateSelectedIndex((selectedIndex - 1 + items.length) % items.length);
        } else if (e.key === "Escape") {
            suggestions.style.display = "none";
            updateTipVisibility(false);
            selectedIndex = -1;
        }
    }
});

searchInput.addEventListener("input", (event) => {
	clearTimeout(debounceTimeout);
	const searchText = event.target.value.trim();

	debounceTimeout = setTimeout(() => {
		if (searchText.length >= 1) {
			fetchResults(searchText)
		} else {
			suggestions.style.display = "none";
            updateTipVisibility(false);
            selectedIndex = -1;
		}
	}, 150);
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (!searchForm.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = "none";
        updateTipVisibility(false);
        selectedIndex = -1;
    }
});

searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length >= 1 && suggestions.children.length > 0) {
        suggestions.style.display = "block";
        updateTipVisibility(true);
    }
});