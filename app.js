// ================================
// GLOBAL STATE
// ================================

let climbsData = [];

// Grade range (default = full range)
let minGrade = "VB";
let maxGrade = "V17";

// Search + sorting state
let currentSearch = "";
let currentSort = "date-desc";

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
// LOAD CSV DATA
// ================================

fetch("climb-sheet.csv")
    .then((res) => res.text())
    .then((csv) => {
        climbsData = parseCSV(csv);
        updateDisplay();
    });

// List of your backgrounds
const backgrounds = ["bg1.png", "bg2.png", "bg3.png"];

// Apply background
function applyBackground(index) {
    const imageName = backgrounds[index];

    document.body.style.backgroundImage = `url('images/${imageName}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";

    // Save index instead of name (easier)
    localStorage.setItem("bgIndex", index);
}

function viewProfile(userName) {
  window.location.href = `profile.html?user=${encodeURIComponent(userName)}`;
}

// Cycle to next background
function cycleBackground() {
    let currentIndex = localStorage.getItem("bgIndex");

    // If nothing saved yet, start at 0
    if (currentIndex === null) {
        currentIndex = 0;
    } else {
        currentIndex = Number(currentIndex);
        currentIndex = (currentIndex + 1) % backgrounds.length;
    }

    applyBackground(currentIndex);
}

// Load saved background on page load
function loadBackground() {
    let savedIndex = localStorage.getItem("bgIndex");

    if (savedIndex !== null) {
        applyBackground(Number(savedIndex));
    } else {
        applyBackground(0); // default background
    }
}

// Run on page load
loadBackground();

// ================================
// SEARCH INPUT
// ================================

document.getElementById("search").addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase();
    updateDisplay();
});

// ================================
// GRADE RANGE INPUTS
// ================================

document.getElementById("minGrade").addEventListener("input", (e) => {
    minGrade = e.target.value.trim().toUpperCase() || "VB";
    updateDisplay();
});

document.getElementById("maxGrade").addEventListener("input", (e) => {
    maxGrade = e.target.value.trim().toUpperCase() || "V17";
    updateDisplay();
});

// ================================
// SORTING
// ================================

document.getElementById("sort").addEventListener("change", (e) => {
    currentSort = e.target.value;
    updateDisplay();
});

// ================================
// MAIN UPDATE FUNCTION
// ================================

function updateDisplay() {
    let filtered = [...climbsData];

    // ------------------------
    // GRADE RANGE FILTER
    // ------------------------
    const min = getGradeNumber(minGrade);
    const max = getGradeNumber(maxGrade);

    filtered = filtered.filter((c) => {
        const g = getGradeNumber(c.grade);
        return g >= min && g <= max;
    });

    // ------------------------
    // SEARCH FILTER
    // ------------------------
    if (currentSearch) {
        filtered = filtered.filter(
            (c) =>
                c.name.toLowerCase().includes(currentSearch) ||
                c.grade.toLowerCase().includes(currentSearch) ||
                (c.tags &&
                    c.tags.join(" ").toLowerCase().includes(currentSearch)),
        );
    }

    // ------------------------
    // SORTING
    // ------------------------

    if (currentSort === "grade-asc") {
        filtered.sort(
            (a, b) => getGradeNumber(a.grade) - getGradeNumber(b.grade),
        );
    }

    if (currentSort === "grade-desc") {
        filtered.sort(
            (a, b) => getGradeNumber(b.grade) - getGradeNumber(a.grade),
        );
    }

    if (currentSort === "rating-desc") {
        filtered.sort((a, b) => b.rating - a.rating);
    }

    // Newest first
    if (currentSort === "date-desc") {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Oldest first
    if (currentSort === "date-asc") {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    displayClimbs(filtered);
}

// ================================
// DISPLAY CLIMBS
// ================================

function displayClimbs(climbs) {
    const container = document.getElementById("climb-list");
    container.innerHTML = "";

    if (climbs.length === 0) {
        container.innerHTML = "<p>No climbs found.</p>";
        return;
    }

    climbs.forEach((climb) => {
        const card = document.createElement("div");
        card.className = "climb-card";

        card.innerHTML = `
  <h3>${climb.name}</h3>
  <p>${climb.grade}</p>
  <p><strong>Rating:</strong> ${climb.rating ? `⭐ ${climb.rating}` : "Unrated ):"}</p>  <p><strong>Setter:</strong> ${climb.setter || "Unknown"}</p>
  <p><strong>Date Set:</strong> ${formatDate(climb.date)}</p>
`;

        card.onclick = () => {
            window.location.href = `climb-details.html?id=${climb.id}`;
        };

        container.appendChild(card);
    });
}

// ================================
// CSV PARSER
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

// ================================
// GRADE CONVERSION
// ================================

function getGradeNumber(grade) {
    if (grade === "VB") return -1;

    const num = parseInt(grade.replace("V", ""));

    return isNaN(num) ? 0 : num;
}


// ================================
// Load users from accounts.csv
// ================================

let usersVisible = false;

function toggleUsers() {

  const container = document.getElementById("users-list");
  const button = document.getElementById("usersBtn");

  // If currently visible → hide
  if (usersVisible) {
    container.innerHTML = "";
    button.textContent = "Show Users";
    usersVisible = false;
    return;
  }

  // If not visible → load + show
  fetch("accounts.csv")
    .then(res => res.text())
    .then(csv => {

      const users = parseCSV(csv);

      container.innerHTML = users.map(u => `
        <div class="user-card">
          <span class="user-link" onclick='viewProfile("${u.name}")'>
            ${u.name}
          </span>
        </div>
      `).join("");

      button.textContent = "Hide Users";
      usersVisible = true;
    });
}


// ================================
// Go to profile page
// ================================
function viewProfile(userName) {
  window.location.href = `profile.html?user=${encodeURIComponent(userName)}`;
}
