// ================================
// STEP 1: GET CLIMB ID FROM URL
// Example:
// climb-details.html?id=2
// ================================

const params =
    new URLSearchParams(
        window.location.search
    );

const climbId =
    params.get("id");

console.log(
    "Looking for climb ID:",
    climbId
);


// ================================
// DATE FORMAT FUNCTION
// ================================

// Converts:
// 2026-04-08
//
// Into:
// April 8, 2026
function formatDate(dateStr) {

    if (!dateStr) {
        return "—";
    }


    // Split the date into its parts.
    const [year, month, day] =
        dateStr
            .split("-")
            .map(Number);


    // JavaScript months start at 0.
    const date =
        new Date(
            year,
            month - 1,
            day
        );


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
}


// ================================
// STEP 2: LOAD CLIMB CSV
// ================================

fetch("climb-sheet.csv")

    .then((res) => res.text())

    .then((csv) => {

        // Convert CSV into JavaScript objects.
        const climbs =
            parseCSV(csv);


        // ================================
        // STEP 3: FIND CORRECT CLIMB
        // ================================

        const climb =
            climbs.find(
                (c) => c.id == climbId
            );


        console.log(
            "Found climb:",
            climb
        );


        // ================================
        // STEP 4: HANDLE MISSING CLIMB
        // ================================

        if (!climb) {

            document.getElementById(
                "climb-details"
            ).innerHTML =
                "<p>Climb not found.</p>";

            return;
        }


        // ================================
        // STEP 5: DISPLAY CLIMB INFO
        // ================================

        const container =
            document.getElementById(
                "climb-details"
            );


        container.innerHTML = `
            <div class="details-card">

                <h2 id="climbCardName">
                    ${climb.name}
                </h2>


                ${
                    climb.image
                        ? `
                            <img
                                src="climb-images/${climb.image}"
                                alt="${climb.name}"
                                onclick="openImage('climb-images/${climb.image}')"
                            >
                        `
                        : ""
                }


                <p id="climbRating">
                    <strong>Rating:</strong>
                    Unrated ):
                </p>


                <p>
                    <strong>Grade:</strong>
                    ${climb.grade}
                </p>


                <p>
                    <strong>Setter:</strong>
                    ${climb.setter || "Unknown"}
                </p>


                <p>
                    <strong>Date Set:</strong>
                    ${formatDate(climb.date)}
                </p>


                ${
                    climb.notes
                        ? `
                            <p>
                                <strong>Notes:</strong>
                                ${climb.notes}
                            </p>
                        `
                        : ""
                }

            </div>
        `;


        // ================================
        // LOAD ASCENTS
        // ================================

        loadClimbAscents(climbId);
    })


    .catch((error) => {

        console.error(
            "Error loading climb CSV:",
            error
        );
    });


// ================================
// BACKGROUND
// ================================

// Apply a background.
function setBackground(imageName) {

    document.body.style.backgroundImage =
        `url('images/${imageName}')`;

    document.body.style.backgroundSize =
        "cover";

    document.body.style.backgroundPosition =
        "center";


    // Save the selected background.
    localStorage.setItem(
        "selectedBackground",
        imageName
    );
}


// Load saved background.
function loadBackground() {

    const saved =
        localStorage.getItem(
            "selectedBackground"
        );


    if (saved) {
        setBackground(saved);
    }
}


loadBackground();


// ================================
// CSV → JAVASCRIPT OBJECTS
// ================================

function parseCSV(csv) {

    // Remove "sep=;" if an older CSV
    // contains that line.
    if (csv.startsWith("sep=")) {

        csv =
            csv
                .split("\n")
                .slice(1)
                .join("\n");
    }


    // Let PapaParse handle the CSV.
    const result =
        Papa.parse(csv, {

            header: true,

            skipEmptyLines: true,
        });


    const data =
        result.data;


    return data.map((obj) => {

        let newObj = {};


        // Go through every column.
        for (let key in obj) {

            let value =
                obj[key];


            // Remove extra whitespace.
            if (
                value !== undefined &&
                value !== null
            ) {
                value =
                    value.trim();
            }


            // Convert number fields.
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


            newObj[key] =
                value;
        }


        return newObj;
    });
}


// ================================
// LOAD ASCENTS FOR THIS CLIMB
// ================================

function loadClimbAscents(climbId) {

    // Load the ascents spreadsheet.
    fetch("ascents.csv")

        .then((res) => res.text())

        .then((csv) => {

            // Convert CSV into JavaScript objects.
            const ascents =
                parseCSV(csv);


            // Keep only ascents belonging
            // to the current climb.
            const climbAscents =
                ascents.filter(
                    (ascent) =>
                        String(
                            ascent.climbId
                        ) ===
                        String(climbId)
                );


            // ================================
            // CALCULATE AVERAGE RATING
            // ================================

            const ratings =
                climbAscents

                    // Get every rating.
                    .map((ascent) =>
                        Number(ascent.rating)
                    )

                    // Ignore blank/invalid ratings.
                    .filter(
                        (rating) =>
                            !isNaN(rating)
                    );


            const ratingElement =
                document.getElementById(
                    "climbRating"
                );


            // No ratings yet.
            if (ratings.length === 0) {

                ratingElement.innerHTML =
                    `
                        <strong>Rating:</strong>
                        Unrated ):
                    `;

            } else {

                // Add all ratings together.
                const total =
                    ratings.reduce(
                        (sum, rating) =>
                            sum + rating,
                        0
                    );


                // Calculate average.
                const average =
                    total / ratings.length;


                // Round to one decimal place.
                const roundedAverage =
                    Math.round(
                        average * 10
                    ) / 10;


                ratingElement.innerHTML =
                    `
                        <strong>Rating:</strong>
                        ⭐ ${roundedAverage}
                    `;
            }


            // ================================
            // ASCENT LIST
            // ================================

            const container =
                document.getElementById(
                    "ascent-list"
                );


            // Make sure the HTML container exists.
            if (!container) {

                console.error(
                    "Could not find #ascent-list in climb-details.html"
                );

                return;
            }


            // If nobody has climbed it yet...
            if (climbAscents.length === 0) {

                container.innerHTML =
                    "<p>No ascents yet.</p>";

                return;
            }


            // ================================
            // SORT ASCENTS BY DATE
            // ================================

            // Newest first.
            climbAscents.sort((a, b) => {

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


            // ================================
            // DISPLAY ASCENTS
            // ================================

            container.innerHTML =
                climbAscents
                    .map(
                        (ascent) => `

                            <div class="ascent-card">
        <h3>${ascent.userName}</h3>
        <p><strong>Suggested Grade:</strong> ${ascent.suggestedGrade}</p>
        <div class="ascent-mini-info">
        <p><strong>Date:</strong> ${ascent.date}</p>
        <p><strong>Attempts:</strong> ${ascent.attempts || "—"}</p>
        <p class="ascent-card-rating"><strong>Rating:</strong> ⭐ ${ascent.rating || "—"}</p>
        </div>
        ${ascent.comments ? `<p class="ascent-comment">${ascent.comments}</p>` : ""}
      </div>

                        `
                    )
                    .join("");
        })


        .catch((error) => {

            console.error(
                "Error loading ascents:",
                error
            );
        });
}


// ================================
// IMAGE ZOOM OVERLAY
// ================================

const overlay =
    document.getElementById(
        "imageOverlay"
    );

const overlayImg =
    document.getElementById(
        "overlayImg"
    );

const closeBtn =
    document.getElementById(
        "closeOverlay"
    );


let scale = 1;

let isDragging = false;

let startX,
    startY,
    translateX = 0,
    translateY = 0;


// ================================
// OPEN IMAGE
// ================================

function openImage(src) {

    overlay.classList.remove(
        "hidden"
    );


    overlayImg.src = src;


    // Reset zoom.
    scale = 1;

    translateX = 0;
    translateY = 0;


    updateTransform();
}


// ================================
// CLOSE IMAGE
// ================================

closeBtn.addEventListener(
    "click",
    () => {

        overlay.classList.add(
            "hidden"
        );
    }
);


// ================================
// ZOOM WITH MOUSE WHEEL
// ================================

overlay.addEventListener(
    "wheel",
    (e) => {

        e.preventDefault();


        // Change zoom amount.
        scale +=
            e.deltaY * -0.001;


        // Keep zoom between
        // 1× and 4×.
        scale =
            Math.min(
                Math.max(1, scale),
                4
            );


        updateTransform();
    }
);


// ================================
// DRAG IMAGE
// ================================

overlayImg.addEventListener(
    "mousedown",
    (e) => {

        isDragging = true;


        startX =
            e.clientX -
            translateX;


        startY =
            e.clientY -
            translateY;
    }
);


window.addEventListener(
    "mouseup",
    () => {

        isDragging = false;
    }
);


window.addEventListener(
    "mousemove",
    (e) => {

        if (!isDragging) return;


        translateX =
            e.clientX -
            startX;


        translateY =
            e.clientY -
            startY;


        updateTransform();
    }
);


// ================================
// APPLY IMAGE TRANSFORM
// ================================

function updateTransform() {

    overlayImg.style.transform =
        `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
}
