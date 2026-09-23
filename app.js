// ================================
// GLOBAL STATE
// ================================

// Stores all of the climbs loaded from climb-sheet.csv.
let climbsData = [];

// Stores all of the ascents loaded from ascents.csv.
// We need this so the website can calculate average ratings.
let ascentsData = [];


// ================================
// SAVED FILTER SETTINGS
// ================================

// Load previously saved filter settings from the browser.
//
// Blank minimum = no lower limit.
// Blank maximum = no upper limit (treated as V17).
let minGrade = localStorage.getItem("minGrade") || "";
let maxGrade = localStorage.getItem("maxGrade") || "";
let currentSearch = localStorage.getItem("currentSearch") || "";
let currentSort = localStorage.getItem("currentSort") || "date-desc";


// ================================
// RESTORE SAVED FILTER VALUES
// ================================

// Put the saved values back into the controls.

document.getElementById("search").value = currentSearch;

document.getElementById("minGrade").value = minGrade;

document.getElementById("maxGrade").value = maxGrade;

document.getElementById("sort").value = currentSort;


// ================================
// DATE FORMAT FUNCTION
// ================================

// Converts a date such as:
//
// 2026-04-08
//
// Into:
//
// April 8, 2026
//
// We build the date manually so JavaScript does not
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
// LOAD CLIMBS + ASCENTS
// ================================

// Load both CSV files at the same time.
//
// We need both files before displaying the climbs because
// the climb rating now comes from the ascent ratings.
Promise.all([
    fetch("climb-sheet.csv").then((res) => res.text()),
    fetch("ascents.csv").then((res) => res.text()),
])

    .then(([climbCSV, ascentCSV]) => {

        // Convert both CSV files into JavaScript objects.
        climbsData = parseCSV(climbCSV);
        ascentsData = parseCSV(ascentCSV);

        // Now that both files are loaded,
        // display the climbs.
        updateDisplay();
    })

    .catch((error) => {
        console.error("Error loading CSV files:", error);
    });


// ================================
// BACKGROUND SYSTEM
// ================================

// List of available background images.
const backgrounds = ["bg1.png", "bg2.png", "bg3.png"];


// ================================
// APPLY BACKGROUND
// ================================

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

    // If there is not one saved yet,
    // start with the first background.
    if (currentIndex === null) {

        currentIndex = 0;

    } else {

        // localStorage stores values as text,
        // so convert it back into a number.
        currentIndex = Number(currentIndex);

        // Move to the next background.
        //
        // The % makes it loop back to 0
        // when we reach the end of the array.
        currentIndex =
            (currentIndex + 1) % backgrounds.length;
    }

    applyBackground(currentIndex);
}


// ================================
// LOAD SAVED BACKGROUND
// ================================

function loadBackground() {

    const savedIndex =
        localStorage.getItem("bgIndex");

    // If a background was saved before...
    if (savedIndex !== null) {

        applyBackground(Number(savedIndex));

    } else {

        // Otherwise, use the first background.
        applyBackground(0);
    }
}


// Run when page loads.
loadBackground();


// ================================
// SEARCH INPUT
// ================================

document.getElementById("search").addEventListener("input", (e) => {

    // Save whatever the user typed.
    currentSearch = e.target.value.toLowerCase();

    localStorage.setItem(
        "currentSearch",
        currentSearch
    );

    updateDisplay();
});


// ================================
// MINIMUM GRADE INPUT
// ================================

document.getElementById("minGrade").addEventListener("input", (e) => {

    // Convert the user's input to uppercase.
    //
    // Example:
    // v5 → V5
    minGrade =
        e.target.value.trim().toUpperCase();

    // Save the setting.
    localStorage.setItem(
        "minGrade",
        minGrade
    );

    updateDisplay();
});


// ================================
// MAXIMUM GRADE INPUT
// ================================

document.getElementById("maxGrade").addEventListener("input", (e) => {

    // Keep the box visually blank if the user leaves it blank.
    maxGrade =
        e.target.value.trim().toUpperCase();

    // Save the setting.
    localStorage.setItem(
        "maxGrade",
        maxGrade
    );

    updateDisplay();
});


// ================================
// SORTING
// ================================

document.getElementById("sort").addEventListener("change", (e) => {

    currentSort = e.target.value;

    // Save the selected sorting method.
    localStorage.setItem(
        "currentSort",
        currentSort
    );

    updateDisplay();
});


// ================================
// CLEAR FILTERS
// ================================

// This clears only the search/filter settings.
// It does NOT affect the background, users,
// ascents, or anything else stored in localStorage.
document.getElementById("clearFilters").addEventListener("click", () => {

    // Reset filter variables.
    minGrade = "";
    maxGrade = "";
    currentSearch = "";
    currentSort = "date-desc";

    // Reset the visible controls.
    document.getElementById("search").value = "";
    document.getElementById("minGrade").value = "";
    document.getElementById("maxGrade").value = "";
    document.getElementById("sort").value = "date-desc";

    // Delete only the filter settings.
    localStorage.removeItem("minGrade");
    localStorage.removeItem("maxGrade");
    localStorage.removeItem("currentSearch");
    localStorage.removeItem("currentSort");

    // Show the climbs again.
    updateDisplay();
});


// ================================
// CALCULATE AVERAGE FUNNESS RATING
// ================================

// Gets the average rating for a particular climb.
//
// Example:
//
// Ratings:
// 5
// 4
// 3
//
// Result:
// 4
//
// If there are no ratings, this returns null.
function getAverageRating(climbId) {

    // Find all ascents for this climb.
    const ratings = ascentsData

        .filter((ascent) =>
            String(ascent.climbId) ===
            String(climbId)
        )

        // Convert the ratings into numbers.
        .map((ascent) => Number(ascent.rating))

        // Ignore blank or invalid ratings.
        .filter((rating) => !isNaN(rating));


    // No ratings yet.
    if (ratings.length === 0) {
        return null;
    }


    // Add all ratings together.
    const total = ratings.reduce(
        (sum, rating) => sum + rating,
        0
    );


    // Calculate the average.
    const average =
        total / ratings.length;


    // Round to one decimal place.
    return Math.round(average * 10) / 10;
}


// ================================
// MAIN UPDATE FUNCTION
// ================================

// Applies filters and sorting,
// then displays the resulting climbs.
function updateDisplay() {

    // Make a copy of the climb data.
    let filtered = [...climbsData];


    // ================================
    // GRADE RANGE FILTER
    // ================================

    // Blank minimum means VB.
    const min =
        minGrade === ""
            ? -1
            : getGradeNumber(minGrade);

    // Blank maximum means V17.
    const max =
        maxGrade === ""
            ? 17
            : getGradeNumber(maxGrade);


    filtered = filtered.filter((c) => {

        const grade =
            getGradeNumber(c.grade);

        return grade >= min && grade <= max;
    });


    // ================================
    // SEARCH FILTER
    // ================================

    if (currentSearch) {

        filtered = filtered.filter((c) => {

            // Search climb name.
            const matchesName =
                c.name &&
                c.name
                    .toLowerCase()
                    .includes(currentSearch);


            // Search grade.
            const matchesGrade =
                c.grade &&
                c.grade
                    .toLowerCase()
                    .includes(currentSearch);


            // Search tags if they exist.
            const matchesTags =
                c.tags &&
                c.tags
                    .join(" ")
                    .toLowerCase()
                    .includes(currentSearch);


            // Show the climb if any field matches.
            return (
                matchesName ||
                matchesGrade ||
                matchesTags
            );
        });
    }


    // ================================
    // SORTING
    // ================================

    // ------------------------
    // Grade: easiest → hardest
    // ------------------------
    if (currentSort === "grade-asc") {

        filtered.sort(
            (a, b) =>
                getGradeNumber(a.grade) -
                getGradeNumber(b.grade)
        );
    }


    // ------------------------
    // Grade: hardest → easiest
    // ------------------------
    if (currentSort === "grade-desc") {

        filtered.sort(
            (a, b) =>
                getGradeNumber(b.grade) -
                getGradeNumber(a.grade)
        );
    }


    // ------------------------
    // Rating: highest → lowest
    // ------------------------

    if (currentSort === "rating-desc") {

        filtered.sort((a, b) => {

            const ratingA =
                getAverageRating(a.id);

            const ratingB =
                getAverageRating(b.id);


            // Put unrated climbs at the bottom.
            const valueA =
                ratingA === null
                    ? -1
                    : ratingA;

            const valueB =
                ratingB === null
                    ? -1
                    : ratingB;


            return valueB - valueA;
        });
    }


    // ------------------------
    // Newest → oldest
    // ------------------------

    if (currentSort === "date-desc") {

        filtered.sort((a, b) => {

            const dateA =
                a.date
                    ? new Date(a.date).getTime()
                    : 0;

            const dateB =
                b.date
                    ? new Date(b.date).getTime()
                    : 0;

            return dateB - dateA;
        });
    }


    // ------------------------
    // Oldest → newest
    // ------------------------

    if (currentSort === "date-asc") {

        filtered.sort((a, b) => {

            const dateA =
                a.date
                    ? new Date(a.date).getTime()
                    : Infinity;

            const dateB =
                b.date
                    ? new Date(b.date).getTime()
                    : Infinity;

            return dateA - dateB;
        });
    }


    // Display the final results.
    displayClimbs(filtered);
}


// ================================
// DISPLAY CLIMBS
// ================================

function displayClimbs(climbs) {

    const container =
        document.getElementById("climb-list");

    // Remove the previous cards.
    container.innerHTML = "";


    // If no climbs match the filters...
    if (climbs.length === 0) {

        container.innerHTML =
            "<p>No climbs found.</p>";

        return;
    }


    // Create a card for every climb.
    climbs.forEach((climb) => {

        const card =
            document.createElement("div");

        card.className = "climb-card";


        // Calculate this climb's average rating.
        const averageRating =
            getAverageRating(climb.id);


        // Build the card HTML.
        card.innerHTML = `
            <div class="upper">

                <h3>
                    ${climb.name}
                </h3>

                <p>
                    <strong>
                        ${climb.grade}
                    </strong>
                </p>

            </div>

            <div class="lower">

                <p>
                    By
                    ${climb.setter || "Unknown"}
                </p>

                <p>
                    ${
                        averageRating !== null
                            ? `⭐ ${averageRating}`
                            : "Unrated ):"
                    }
                </p>

            </div>
        `;


        // Clicking the card opens its details page.
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

// Converts CSV text into JavaScript objects.
//
// PapaParse handles:
// - commas inside quotes
// - escaped quotes
// - empty fields
// - standard CSV formatting
function parseCSV(csv) {

    // Remove "sep=;" if an older CSV
    // still happens to contain it.
    if (csv.startsWith("sep=")) {

        csv = csv
            .split("\n")
            .slice(1)
            .join("\n");
    }


    const result = Papa.parse(csv, {

        // Use the first row as column names.
        header: true,

        // Ignore empty rows.
        skipEmptyLines: true,
    });


    const data = result.data;


    // Clean up the parsed values.
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


            // Convert number fields to actual numbers.
            if (
                key === "id" ||
                key === "rating" ||
                key === "attempts"
            ) {

                value =
                    value
                        ? Number(value)
                        : null;
            }


            // Keep tags available for future use.
            if (key === "tags") {

                value =
                    value
                        ? value
                            .split(",")
                            .map((t) => t.trim())
                        : [];
            }


            newObj[key] = value;
        }


        return newObj;
    });
}


// ================================
// GRADE CONVERSION
// ================================

// Converts climbing grades into numbers
// so JavaScript can compare them.
//
// VB → -1
// V0 → 0
// V1 → 1
// V5 → 5
// V17 → 17
function getGradeNumber(grade) {

    if (!grade) {
        return 0;
    }


    if (grade === "VB") {
        return -1;
    }


    const num =
        parseInt(
            grade.replace("V", "")
        );


    return isNaN(num)
        ? 0
        : num;
}


// ================================
// USERS
// ================================

let usersVisible = false;


// Toggle the users list.
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

        button.textContent =
            "Show Users";

        usersVisible = false;

        return;
    }


    // ------------------------
    // SHOW USERS
    // ------------------------

    fetch("accounts.csv")

        .then((res) => res.text())

        .then((csv) => {

            const users =
                parseCSV(csv);


            container.innerHTML =
                users
                    .map((u) => `

                        <div class="user-card">

                            <span
                                class="user-link"
                                onclick='viewProfile("${u.name}")'
                            >
                                ${u.name}
                            </span>

                        </div>

                    `)
                    .join("");


            button.textContent =
                "Hide Users";

            usersVisible = true;
        })

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