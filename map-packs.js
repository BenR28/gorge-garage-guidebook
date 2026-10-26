fetch("map-packs.csv")
    .then(response => {
        if (!response.ok) {
            throw new Error("Could not load lists.csv");
        }
        return response.text();
    })
    .then(csv => {
        const result = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true
        });

        const lists = result.data;
        const container = document.getElementById("lists-container");

        container.innerHTML = "";

        if (lists.length === 0) {
            container.textContent = "No lists found.";
            return;
        }

        lists.forEach(list => {
            const card = document.createElement("div");
            card.className = "list-card";

            const title = document.createElement("h3");
            title.textContent = list.name || "Unnamed List";

            const description = document.createElement("p");
            description.textContent = list.description || "No description.";

            const creator = document.createElement("p");
            creator.textContent = "Created by: " + (list.creator || "Unknown");

            card.append(title, description, creator);

            card.addEventListener("click", () => {
                window.location.href =
                    `list-details.html?id=${encodeURIComponent(list.id.trim())}`;
            });

            container.appendChild(card);
        });
    })
    .catch(error => {
        console.error(error);
        document.getElementById("lists-container").textContent =
            "Could not load lists. Check the CSV file and console.";
    });
