// ================================
// Get username from URL
// ================================
const params = new URLSearchParams(window.location.search);
const userName = params.get("user");

document.getElementById("profile-name").textContent = userName;


// ================================
// Load ascents
// ================================
fetch("ascents.csv")
  .then(res => res.text())
  .then(csv => {

    const ascents = parseCSV(csv);

    // Filter this user's ascents
    const userAscents = ascents.filter(a => a.userName === userName);

    // ================================
    // STATS
    // ================================

    const total = userAscents.length;

    const ratings = userAscents
      .map(a => Number(a.rating))
      .filter(r => !isNaN(r));

    const avgRating = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "—";

    // Hardest climb (based on grade string)
    // NOTE: This is a simple version
    const hardest = getHardest(userAscents);

    document.getElementById("profile-stats").innerHTML = `
      <p><strong>Total Ascents:</strong> ${total}</p>
      <p><strong>Hardest Climb:</strong> ${hardest || "—"}</p>
    `;


    // ================================
    // ASCENTS LIST
    // ================================

    const container = document.getElementById("profile-ascents");

    container.innerHTML = userAscents.map(a => `
      <div class="ascent-card">
        <h3>${a.climbName}</h3>
        <p><strong>Date:</strong> ${a.date}</p>
        <p><strong>Attempts:</strong> ${a.attempts || "—"}</p>
        <p><strong>Rating:</strong> ⭐ ${a.rating || "—"}</p>
        ${a.comments ? `<p>${a.comments}</p>` : ""}
      </div>
    `).join("");

  });


// ================================
// SIMPLE grade comparison
// ================================
function getHardest(ascents) {

  const order = [
    "VB","V0","V1","V2","V3","V4","V5",
    "V6","V7","V8","V9","V10"
  ];

  let hardestIndex = -1;
  let hardestName = "";

  ascents.forEach(a => {

    const grade = a.suggestedGrade || "";
    const index = order.indexOf(grade);

    if (index > hardestIndex) {
      hardestIndex = index;
      hardestName = `${a.climbName} (${grade})`;
    }
  });

  return hardestName;
}


// ================================
// CSV parser (same as yours)
// ================================
function parseCSV(csv) {

  const lines = csv.trim().split("\n");

  let startIndex = 0;
  if (lines[0].startsWith("sep=")) {
    startIndex = 1;
  }

  const headers = lines[startIndex]
    .split(";")
    .map(h => h.trim());

  return lines.slice(startIndex + 1).map(line => {

    const values = line.split(";");

    let obj = {};

    headers.forEach((header, i) => {
      obj[header] = values[i]?.trim();
    });

    return obj;
  });
}



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