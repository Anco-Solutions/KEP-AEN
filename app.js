let trips = [];

document.getElementById("addTrip").addEventListener("click", function () {

    const embark = document.getElementById("embark").value;
    const discharge = document.getElementById("discharge").value;
    const rank = document.getElementById("rank").value;

    if (!embark || !discharge) {
        alert("Συμπλήρωσε την ημερομηνία επιβίβασης και απόλυσης.");
        return;
    }

    const start = new Date(embark);
    const end = new Date(discharge);

    if (end < start) {
        alert("Η ημερομηνία απόλυσης δεν μπορεί να είναι πριν από την επιβίβαση.");
        return;
    }

    trips.push({
        embark: embark,
        discharge: discharge,
        rank: rank
    });

    document.getElementById("embark").value = "";
    document.getElementById("discharge").value = "";

    showTrips();
});


function calculateDays(startDate, endDate) {

    const start = new Date(startDate);
    const end = new Date(endDate);

    return Math.floor(
        (end - start) / (1000 * 60 * 60 * 24)
    ) + 1;
}


function showTrips() {

    const list = document.getElementById("tripList");

    if (trips.length === 0) {
        list.innerHTML = "Δεν υπάρχουν ακόμη ταξίδια.";
        return;
    }

    let html = "";

    trips.forEach(function (trip, index) {

        const days = calculateDays(
            trip.embark,
            trip.discharge
        );

        html += `
            <div style="margin-bottom:15px;padding:10px;background:white;border-radius:8px;">
                <strong>Πλοίο ${index + 1}</strong><br>
                Επιβίβαση: ${trip.embark}<br>
                Απόλυση: ${trip.discharge}<br>
                Ειδικότητα: ${trip.rank}<br>
                Υπηρεσία: ${days} ημέρες
            </div>
        `;
    });

    list.innerHTML = html;
}


document.getElementById("calculate").addEventListener("click", function () {

    if (trips.length === 0) {
        alert("Πρόσθεσε τουλάχιστον ένα ταξίδι.");
        return;
    }

    function toDate(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function daysInclusive(start, end) {
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor((end - start) / oneDay) + 1;
    }

    // Δημιουργία διαστημάτων
    const intervals = trips.map(function (trip) {
        return {
            start: toDate(trip.embark),
            end: toDate(trip.discharge)
        };
    });

    // Συνολικές ημέρες όλων των ταξιδιών
    let rawTotalDays = 0;

    intervals.forEach(function (interval) {
        rawTotalDays += daysInclusive(
            interval.start,
            interval.end
        );
    });

    // Ταξινόμηση
    intervals.sort(function (a, b) {
        return a.start - b.start;
    });

    // Ενοποίηση διαστημάτων για να βρούμε την πραγματική υπηρεσία
    let totalDays = 0;

    let currentStart = intervals[0].start;
    let currentEnd = intervals[0].end;

    for (let i = 1; i < intervals.length; i++) {

        const next = intervals[i];

        const dayAfterCurrentEnd = new Date(currentEnd);
        dayAfterCurrentEnd.setDate(
            dayAfterCurrentEnd.getDate() + 1
        );

        if (next.start <= dayAfterCurrentEnd) {

            if (next.end > currentEnd) {
                currentEnd = next.end;
            }

        } else {

            totalDays += daysInclusive(
                currentStart,
                currentEnd
            );

            currentStart = next.start;
            currentEnd = next.end;
        }
    }

    // Προσθήκη τελευταίου διαστήματος
    totalDays += daysInclusive(
        currentStart,
        currentEnd
    );

    // Η διαφορά είναι οι επικαλυπτόμενες ημέρες
    const overlappingDays = rawTotalDays - totalDays;

    // 30 ημέρες = 1 μήνας
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;

    let overlapMessage = "";

    if (overlappingDays > 0) {

        const dayText =
            overlappingDays === 1
                ? "ημέρα"
                : "ημέρες";

        overlapMessage = `
            <p style="
                color:red;
                font-weight:bold;
                margin-top:15px;
            ">
                ⚠️ Επικαλυπτόμενες ημέρες ταξιδιών:
                ${overlappingDays} ${dayText}
            </p>
        `;
    }

    document.getElementById("result").innerHTML = `
        <h3>Συνολική Υπηρεσία</h3>

        <p>
            <strong>
                ${months} μήνες και ${days} ημέρες
            </strong>
        </p>

        <p>
            Σύνολο: ${totalDays} ημέρες
        </p>

        ${overlapMessage}
    `;
});