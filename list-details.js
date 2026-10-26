const params = new URLSearchParams(window.location.search);
const listId = params.get("id");

// Load and parse a CSV using Papa Parse.
async function loadCSV(filename) {
    const response = await fetch(filename);

    if (!response.ok) {
        throw new Error(`Could not load ${filename}`);
    }

    const csv = await response.text();

    const result = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true
    });

    if (result.errors.some(error => error.type !== "Delimiter")) {
        console.warn(`CSV parsing warnings in ${filename}:`, result.errors);
    }

    return result.data;
}

async function displayList() {
    const details = document.getElementById("list-details");
    const climbsContainer = document.getElementById("list-climbs");

    try {
        // Load both spreadsheets.
        const [lists, climbs] = await Promise.all([
            loadCSV("map-packs.csv"),
            loadCSV("climb-sheet.csv")
        ]);

        // Find the selected list.
        const list = lists.find(
            item => String(item.id).trim() === String(listId).trim()
        );

        if (!list) {
            details.textContent = "List not found.";
            climbsContainer.innerHTML = "";
            return;
        }

        // Display the list information.
        const title = document.createElement("h1");
        title.textContent = list.name || "Unnamed List";

        const description = document.createElement("p");
        description.textContent = list.description || "No description.";

        const creator = document.createElement("p");
        creator.textContent = "Created by: " + (list.creator || "Unknown");

        details.replaceChildren(title, description, creator);

        // Split the climb IDs, including IDs with more than two digits.
        const climbIDs = (list.climbIDs || "")
            .split(",")
            .map(id => id.trim())
            .filter(id => id !== "");

        // Match IDs as strings to avoid problems with larger IDs.
        const listClimbs = climbIDs.map(id =>
            climbs.find(climb => String(climb.id).trim() === id)
        );

        climbsContainer.innerHTML = "";

        if (climbIDs.length === 0) {
            climbsContainer.textContent = "This list has no climbs yet.";
            return;
        }

        listClimbs.forEach((climb, index) => {
            if (!climb) {
                const missing = document.createElement("p");
                missing.textContent =
                    `Climb ID ${climbIDs[index]} could not be found.`;
                climbsContainer.appendChild(missing);
                return;
            }

            const card = document.createElement("div");
            card.className = "climb-card";

            const name = document.createElement("h3");
            name.textContent = climb.name || "Unnamed Climb";

            const grade = document.createElement("p");
            grade.textContent = climb.grade || "Grade unknown";

            card.append(name, grade);

            // Clicking a climb opens its existing details page.
            card.addEventListener("click", () => {
                window.location.href =
                    `climb-details.html?id=${encodeURIComponent(climb.id)}`;
            });

            climbsContainer.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        details.textContent =
            "Could not load this list. Check the CSV files and console.";
    }
}

displayList();
