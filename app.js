// ================================
// GLOBAL STATE
// ================================

// Stores all of the climbs loaded from the CSV.
let climbsData = [];

// Load previously saved filter settings from the browser.
//
// If there is nothing saved yet:
// - Minimum grade = VB
// - Maximum grade = V17
// - Search = empty
// - Sort = newest
let minGrade = localStorage.getItem("minGrade") || "";
let maxGrade = localStorage.getItem("maxGrade") || "";
let currentSearch = localStorage.getItem("currentSearch") || "";
let currentSort = localStorage.getItem("currentSort") || "date-desc";


// ================================
// RESTORE SAVED FILTER VALUES
// ================================

// Put the saved values into the actual controls on the page.

// Search box
document.getElementById("search").value = currentSearch;

// Minimum grade box
document.getElementById("minGrade").value = minGrade;

// Maximum grade box
document.getElementById("maxGrade").value = maxGrade;

// Sort dropdown
document.getElementById("sort").value = currentSort;


// ================================
// DATE FORMAT FUNCTION
// ================================

// Converts a date such as:
// 2026-04-08
//
// Into:
// April 8, 2026
//
// We build the date manually so JavaScript doesn't
// accidentally shift it by a day because of time zones.
function formatDate(dateStr) {
    if (!dateStr) return "—";

    // Split the date into year, month, and day.
    const [year, month, day] = dateStr.split("-").map(Number);

    // JavaScript months start at 0.
    // January = 0
    // February = 1
    // etc.
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}


// ================================
// LOAD CSV DATA
// ================================

// Fetch the climb spreadsheet CSV.
fetch("climb-sheet.csv")
    .then((res) => res.text())

    // Once the CSV has been downloaded...
    .then((csv) => {

        // Convert the CSV into JavaScript objects.
        climbsData = parseCSV(csv);

        // Display the climbs using the saved filters.
        updateDisplay();
    })

    // If something goes wrong, show the error in the console.
    .catch((error) => {
        console.error("Error loading climb CSV:", error);
    });


// ================================
// BACKGROUND SYSTEM
// ================================

// List of available background images.
const backgrounds = ["bg1.png", "bg2.png", "bg3.png"];


// Apply a background based on its position
// in the backgrounds array.
function applyBackground(index) {

    const imageName = backgrounds[index];

    document.body.style.backgroundImage =
        `url('images/${imageName}')`;

    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";

    // Save the selected background to the browser.
    localStorage.setItem("bgIndex", index);
}


// ================================
// CHANGE BACKGROUND
// ================================

// Moves to the next background in the list.
function cycleBackground() {

    // Get the currently selected background.
    let currentIndex = localStorage.getItem("bgIndex");

    // If there isn't one saved yet, start with the first background.
    if (currentIndex === null) {
        currentIndex = 0;
    } else {

        // localStorage stores everything as text,
        // so convert it back into a number.
        currentIndex = Number(currentIndex);

        // Move to the next background.
        //
        // The % makes it loop back to 0 when we
        // reach the end of the array.
        currentIndex =
            (currentIndex + 1) % backgrounds.length;
    }

    applyBackground(currentIndex);
}


// ================================
// LOAD SAVED BACKGROUND
// ================================

function loadBackground() {

    const savedIndex = localStorage.getItem("bgIndex");

    // If a background was saved before...
    if (savedIndex !== null) {
        applyBackground(Number(savedIndex));
    }

    // Otherwise, use the first background.
    else {
        applyBackground(0);
    }
}

// Apply the saved background as soon as the page loads.
loadBackground();


// ================================
// SEARCH INPUT
// ================================

document.getElementById("search").addEventListener("input", (e) => {

    // Get whatever the user typed.
    currentSearch = e.target.value.toLowerCase();

    // Save the search in localStorage.
    localStorage.setItem("currentSearch", currentSearch);

    // Re-filter the climbs.
    updateDisplay();
});


// ================================
// MINIMUM GRADE INPUT
// ================================

document.getElementById("minGrade").addEventListener("input", (e) => {

    // Convert the user's input to uppercase.
    //
    // For example:
    // v3 → V3
    minGrade = e.target.value.trim().toUpperCase() || "VB";

    // Save the setting.
    localStorage.setItem("minGrade", minGrade);

    // Re-filter the climbs.
    updateDisplay();
});


// ================================
// MAXIMUM GRADE INPUT
// ================================

document.getElementById("maxGrade").addEventListener("input", (e) => {
    // Save exactly what the user typed.
    // An empty box remains an empty value.
    maxGrade = e.target.value.trim().toUpperCase();

    localStorage.setItem("maxGrade", maxGrade);

    updateDisplay();
});


// ================================
// SORTING
// ================================

document.getElementById("sort").addEventListener("change", (e) => {

    // Save the selected sorting method.
    currentSort = e.target.value;

    // Save it in localStorage.
    localStorage.setItem("currentSort", currentSort);

    // Re-sort the climbs.
    updateDisplay();
});


// ================================
// MAIN UPDATE FUNCTION
// ================================

// This function takes all of the climbs,
// applies the current filters and sorting,
// and then displays the results.
function updateDisplay() {

    // Create a copy of the original array.
    //
    // We do this because sorting an array directly
    // changes the original array.
    let filtered = [...climbsData];


    // ------------------------
    // GRADE RANGE FILTER
    // ------------------------

    const min = getGradeNumber(minGrade);

    // A blank maximum means V17.
    const max = maxGrade === "" ? 17 : getGradeNumber(maxGrade);

    filtered = filtered.filter((c) => {

        const g = getGradeNumber(c.grade);

        return g >= min && g <= max;
    });


    // ------------------------
    // SEARCH FILTER
    // ------------------------

    if (currentSearch) {

        filtered = filtered.filter((c) => {

            // Search the climb name.
            const matchesName =
                c.name &&
                c.name.toLowerCase().includes(currentSearch);

            // Search the grade.
            const matchesGrade =
                c.grade &&
                c.grade.toLowerCase().includes(currentSearch);

            // Search tags if they exist.
            const matchesTags =
                c.tags &&
                c.tags.join(" ")
                    .toLowerCase()
                    .includes(currentSearch);

            // The climb is shown if ANY of those match.
            return matchesName || matchesGrade || matchesTags;
        });
    }


    // ------------------------
    // SORTING
    // ------------------------

    // Grade: easiest → hardest
    if (currentSort === "grade-asc") {

        filtered.sort(
            (a, b) =>
                getGradeNumber(a.grade) -
                getGradeNumber(b.grade)
        );
    }


    // Grade: hardest → easiest
    if (currentSort === "grade-desc") {

        filtered.sort(
            (a, b) =>
                getGradeNumber(b.grade) -
                getGradeNumber(a.grade)
        );
    }


    // Rating: highest → lowest
    if (currentSort === "rating-desc") {

        filtered.sort((a, b) => {

            // Empty ratings go to the bottom.
            const ratingA =
                a.rating === null ? -1 : Number(a.rating);

            const ratingB =
                b.rating === null ? -1 : Number(b.rating);

            return ratingB - ratingA;
        });
    }


    // Newest → oldest
    if (currentSort === "date-desc") {

        filtered.sort((a, b) => {

            // Convert dates into timestamps.
            const dateA = a.date
                ? new Date(a.date).getTime()
                : 0;

            const dateB = b.date
                ? new Date(b.date).getTime()
                : 0;

            return dateB - dateA;
        });
    }


    // Oldest → newest
    if (currentSort === "date-asc") {

        filtered.sort((a, b) => {

            const dateA = a.date
                ? new Date(a.date).getTime()
                : Infinity;

            const dateB = b.date
                ? new Date(b.date).getTime()
                : Infinity;

            return dateA - dateB;
        });
    }


    // Finally, display the results.
    displayClimbs(filtered);
}


// ================================
// DISPLAY CLIMBS -=-----------------------------------------------------------------------------------------------------------------------------------------------------
// ================================

// Creates the climb cards on the page.
function displayClimbs(climbs) {

    const container =
        document.getElementById("climb-list");

    // Clear the old results first.
    container.innerHTML = "";


    // If there aren't any matching climbs...
    if (climbs.length === 0) {

        container.innerHTML =
            "<p>No climbs found.</p>";

        return;
    }


    // Create one card for every climb.
    climbs.forEach((climb) => {

        const card =
            document.createElement("div");

        card.className = "climb-card";


        // Build the HTML inside the card.
        card.innerHTML = `
        <div class="upper">
            <h3>${climb.name}</h3>

            <p><strong>${climb.grade}</strong></p>
        </div>
        <div class="lower">
            <p>
                By
                ${climb.setter || "Unknown"}
            </p>
            
            <p>
                ${
                    climb.rating
                        ? `⭐ ${climb.rating}`
                        : "Unrated ):"
                }
            </p>
        </div>
        `;


        // Clicking the card takes the user
        // to the climb's details page.
        card.onclick = () => {

            window.location.href =
                `climb-details.html?id=${climb.id}`;
        };


        // Add the card to the page.
        container.appendChild(card);
    });
}


// ================================
// CSV PARSER
// ================================

// Converts the CSV text into an array
// of JavaScript objects using PapaParse.
function parseCSV(csv) {

    // If the CSV starts with:
    //
    // sep=;
    //
    // remove that line.
    //
    // This is mostly here for compatibility
    // in case an older CSV still has it.
    if (csv.startsWith("sep=")) {

        csv = csv
            .split("\n")
            .slice(1)
            .join("\n");
    }


    // Ask PapaParse to process the CSV.
    const result = Papa.parse(csv, {

        // Use the first row as column names.
        header: true,

        // Ignore completely empty rows.
        skipEmptyLines: true
    });


    // PapaParse gives us an array of objects.
    const data = result.data;


    // Clean up and convert certain values.
    return data.map((obj) => {

        let newObj = {};


        // Go through every column in the row.
        for (let key in obj) {

            let value = obj[key];


            // Remove extra whitespace.
            if (
                value !== undefined &&
                value !== null
            ) {
                value = value.trim();
            }


            // Convert numeric columns into actual numbers.
            if (
                key === "id" ||
                key === "rating" ||
                key === "attempts"
            ) {

                value = value
                    ? Number(value)
                    : null;
            }


            // Tags are kept as an array so
            // we can use them later.
            if (key === "tags") {

                value = value
                    ? value
                        .split(",")
                        .map((t) => t.trim())
                    : [];
            }


            // Store the cleaned value.
            newObj[key] = value;
        }


        return newObj;
    });
}


// ================================
// GRADE CONVERSION
// ================================

// Turns:
// VB → -1
// V0 → 0
// V1 → 1
// V5 → 5
// V17 → 17
//
// This lets JavaScript compare grades numerically.
function getGradeNumber(grade) {

    if (!grade) {
        return 0;
    }


    // VB is easier than V0,
    // so give it a value below V0.
    if (grade === "VB") {
        return -1;
    }


    const num =
        parseInt(grade.replace("V", ""));


    // If the grade isn't valid,
    // return 0 instead of causing an error.
    return isNaN(num) ? 0 : num;
}


// ================================
// USERS
// ================================

// Keeps track of whether the user list is
// currently visible.
let usersVisible = false;


// Toggle the users list on and off.
function toggleUsers() {

    const container =
        document.getElementById("users-list");

    const button =
        document.getElementById("usersBtn");


    // ------------------------
    // HIDE USERS
    // ------------------------

    if (usersVisible) {

        container.innerHTML = "";

        button.textContent = "Show Users";

        usersVisible = false;

        return;
    }


    // ------------------------
    // SHOW USERS
    // ------------------------

    fetch("accounts.csv")

        // Read the CSV as text.
        .then((res) => res.text())

        // Parse and display it.
        .then((csv) => {

            const users = parseCSV(csv);


            container.innerHTML =
                users.map((u) => `

                    <div class="user-card">

                        <span
                            class="user-link"
                            onclick='viewProfile("${u.name}")'
                        >
                            ${u.name}
                        </span>

                    </div>

                `).join("");


            // Change button to "Hide Users".
            button.textContent = "Hide Users";

            usersVisible = true;
        })

        // Catch any errors.
        .catch((error) => {

            console.error(
                "Error loading accounts.csv:",
                error
            );
        });
}


// ================================
// PROFILE NAVIGATION
// ================================

// Opens a user's profile page.
function viewProfile(userName) {

    window.location.href =
        `profile.html?user=${encodeURIComponent(userName)}`;
}

// ================================
// CLEAR FILTERS BUTTON
// ================================

document.getElementById("clearFilters").addEventListener("click", () => {

    // Reset the variables to their defaults.
    minGrade = "";
    maxGrade = "";
    currentSearch = "";
    currentSort = "date-desc";

    // Reset the visible controls on the page.
    document.getElementById("search").value = "";
    document.getElementById("minGrade").value = "";
    document.getElementById("maxGrade").value = "";
    document.getElementById("sort").value = "date-desc";

    // Remove ONLY the filter settings from localStorage.
    //
    // This does NOT remove:
    // - Background
    // - User selection
    // - Ascents
    // - Any other saved information
    localStorage.removeItem("minGrade");
    localStorage.removeItem("maxGrade");
    localStorage.removeItem("currentSearch");
    localStorage.removeItem("currentSort");

    // Show all climbs using the default settings.
    updateDisplay();
});