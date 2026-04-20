// ================================
// STEP 1: Get the climb ID from URL
// Example: climb-details.html?id=2
// ================================

const params = new URLSearchParams(window.location.search);
const climbId = params.get("id");

console.log("Looking for climb ID:", climbId);

// Date format function
function formatDate(dateStr) {
    if (!dateStr) return "—";

    // Split manually instead of using new Date("YYYY-MM-DD")
    const [year, month, day] = dateStr.split("-").map(Number);

    const date = new Date(year, month - 1, day); // local time

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
// ================================
// STEP 2: Load CSV instead of JSON
// ================================

fetch("climb-sheet.csv")
    .then((res) => res.text()) // read as text, NOT json
    .then((csv) => {
        // Convert CSV → JS objects
        const climbs = parseCSV(csv);

        // ================================
        // STEP 3: Find the correct climb
        // ================================

        const climb = climbs.find((c) => c.id == climbId);

        console.log("Found climb:", climb);

        // ================================
        // STEP 4: Handle missing climb
        // ================================

        if (!climb) {
            document.getElementById("climb-details").innerHTML =
                "<p>Climb not found.</p>";
            return;
        }

        // ================================
        // STEP 5: Display climb info
        // ================================

        const container = document.getElementById("climb-details");

        container.innerHTML = `
      <div class="details-card">
        <h2 id="climbCardName">${climb.name}</h2>





        
${
    climb.image
        ? `<img 
    src="climb-images/${climb.image}" 
    alt="${climb.name}" 
    onclick="openImage('climb-images/${climb.image}')"
>`
        : ""
}
        <p><strong>Grade:</strong> ${climb.grade}</p>
<p><strong>Rating:</strong> ${
            climb.rating ? `⭐ ${climb.rating}` : "Unrated ):"
        }</p>
        <p><strong>Setter:</strong> ${climb.setter || "Unknown"}</p>
        <p><strong>Date Set:</strong> ${formatDate(climb.date)}</p>

        ${climb.notes ? `<p><strong>Notes:</strong> ${climb.notes}</p>` : ""}
      </div>
    `;
    });


// Apply background
function setBackground(imageName) {
    document.body.style.backgroundImage = `url('images/${imageName}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";

    // Save to localStorage
    localStorage.setItem("selectedBackground", imageName);
}

// Load saved background on page load
function loadBackground() {
    const saved = localStorage.getItem("selectedBackground");

    if (saved) {
        setBackground(saved);
    }
}

loadBackground();

// ================================
// CSV → JS object converter
// (same as app.js — must be included here too)
// ================================

function parseCSV(csv) {
    const lines = csv.trim().split("\n");

    // 🔥 Ignore the "sep=;" line if it exists
    let startIndex = 0;
    if (lines[0].startsWith("sep=")) {
        startIndex = 1;
    }

    const headers = lines[startIndex].split(";").map((h) => h.trim());

    return lines.slice(startIndex + 1).map((line) => {
        const values = line.split(";");

        let obj = {};

        headers.forEach((header, i) => {
            let value = values[i]?.trim();

            // Convert numbers
            if (header === "id" || header === "rating") {
                value = value ? Number(value) : null;
            }

            // Keep tags (not used yet but future-proof)
            if (header === "tags") {
                value = value ? value.split(";").map((t) => t.trim()) : [];
            }

            obj[header] = value;
        });

        return obj;
    });
}

const overlay = document.getElementById("imageOverlay");
const overlayImg = document.getElementById("overlayImg");
const closeBtn = document.getElementById("closeOverlay");

let scale = 1;
let isDragging = false;
let startX,
    startY,
    translateX = 0,
    translateY = 0;

// Open image
function openImage(src) {
    overlay.classList.remove("hidden");
    overlayImg.src = src;

    // reset zoom
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
}

// Close image
closeBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
});

// Zoom with scroll (desktop)
overlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(1, scale), 4);
    updateTransform();
});

// Drag to move
overlayImg.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;

    updateTransform();
});

function updateTransform() {
    overlayImg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
}
