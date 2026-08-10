let trips = [];
let editingIndex = -1;


// ==========================================
// ΠΡΟΣΘΗΚΗ / ΑΛΛΑΓΗ ΤΑΞΙΔΙΟΥ
// ==========================================

document.getElementById("addTrip").addEventListener("click", function () {

    const embark = document.getElementById("embark").value;
    const discharge = document.getElementById("discharge").value;
    const rank = document.getElementById("rank").value;

    if (!embark || !discharge) {
        alert("Συμπλήρωσε την ημερομηνία ναυτολόγησης και απόλυσης.");
        return;
    }

    const start = toDate(embark);
    const end = toDate(discharge);

    if (end < start) {
        alert("Η ημερομηνία απόλυσης δεν μπορεί να είναι πριν από την ναυτολόγηση.");
        return;
    }

    if (editingIndex === -1) {

        trips.push({
            embark: embark,
            discharge: discharge,
            rank: rank
        });

    } else {

        trips[editingIndex] = {
            embark: embark,
            discharge: discharge,
            rank: rank
        };

        editingIndex = -1;

        document.getElementById("addTrip").textContent =
            "Προσθήκη Ταξιδιού";
    }

    document.getElementById("embark").value = "";
    document.getElementById("discharge").value = "";

    showTrips();
    calculateService();
});


// ==========================================
// ΜΕΤΑΤΡΟΠΗ ΗΜΕΡΟΜΗΝΙΑΣ
// ==========================================

function toDate(dateString) {

    const [year, month, day] =
        dateString.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


// ==========================================
// ΚΛΕΙΔΙ ΗΜΕΡΟΜΗΝΙΑΣ
// ==========================================

function dateKey(date) {

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}


// ==========================================
// ΜΕΤΑΤΡΟΠΗ ΗΜΕΡΟΜΗΝΙΑΣ ΣΕ ΕΛΛΗΝΙΚΗ ΜΟΡΦΗ
// ==========================================

function formatGreekDate(dateString) {

    const [year, month, day] =
        dateString.split("-");

    return `${day}/${month}/${year}`;
}


// ==========================================
// ΠΑΡΑΓΩΓΗ ΟΛΩΝ ΤΩΝ ΗΜΕΡΟΜΗΝΙΩΝ ΤΟΥ ΤΑΞΙΔΙΟΥ
// ==========================================

function getTripDates(start, end) {

    const dates = [];

    let current =
        new Date(start);

    while (current <= end) {

        dates.push(
            dateKey(current)
        );

        current.setDate(
            current.getDate() + 1
        );
    }

    return dates;
}


// ==========================================
// ΥΠΟΛΟΓΙΣΜΟΣ ΥΠΗΡΕΣΙΑΣ
//
// Κανόνας:
// Πλήρης ημερολογιακός μήνας = 1 μήνας
// Μερικός μήνας = πραγματικές ημέρες
// ==========================================

function calculateServiceFromDates(dateSet) {

    if (dateSet.size === 0) {

        return {
            months: 0,
            days: 0,
            totalDays: 0
        };
    }


    const dates =
        Array.from(dateSet).sort();


    // ==========================================
    // ΟΜΑΔΟΠΟΙΗΣΗ ΑΝΑ ΜΗΝΑ
    // ==========================================

    const monthGroups = {};


    dates.forEach(function (dateString) {

        const [year, month, day] =
            dateString.split("-").map(Number);


        const key =
            year + "-" +
            String(month).padStart(2, "0");


        if (!monthGroups[key]) {

            monthGroups[key] = {

                year: year,

                month: month,

                days: []

            };
        }


        monthGroups[key].days.push(day);

    });


    let months = 0;

    let days = 0;


    // ==========================================
    // ΥΠΟΛΟΓΙΣΜΟΣ ΚΑΘΕ ΜΗΝΑ
    //
    // Πλήρης μήνας:
    //     1 → τελευταία ημέρα
    //     = 1 μήνας
    //
    // Μερικός μήνας:
    //     υπολογίζεται με βάση τις 30 ημέρες
    //
    // ==========================================

    Object.values(monthGroups).forEach(
        function (group) {

            const lastDay =
                new Date(
                    group.year,
                    group.month,
                    0
                ).getDate();


            const firstDay =
                Math.min(...group.days);


            const lastCoveredDay =
                Math.max(...group.days);


            // --------------------------------------
            // ΠΛΗΡΗΣ ΜΗΝΑΣ
            // --------------------------------------

            const fullMonth =
                group.days.length === lastDay &&
                firstDay === 1 &&
                lastCoveredDay === lastDay;


            if (fullMonth) {

                // Ολόκληρος ο μήνας
                // μετράει ως 1 μήνας

                months++;

                return;
            }


            // --------------------------------------
            // ΜΕΡΙΚΟΣ ΜΗΝΑΣ
            // --------------------------------------

            let partialDays;


            if (firstDay === 1) {

                // Από την 1η μέχρι κάποια ημέρα

                partialDays =
                    lastCoveredDay;

            } else {

                // Από κάποια ημέρα μέχρι
                // το τέλος του μήνα

                partialDays =
                    30 -
                    firstDay +
                    1;
            }


            days += partialDays;

        }
    );


    // ==========================================
    // ΚΑΘΕ 30 ΜΕΡΙΚΕΣ ΗΜΕΡΕΣ = 1 ΜΗΝΑΣ
    // ==========================================

    months +=
        Math.floor(days / 30);


    days =
        days % 30;


    return {

        months: months,

        days: days,

        totalDays:
            months * 30 + days

    };
}


// ==========================================
// ΥΠΗΡΕΣΙΑ ΕΝΟΣ ΤΑΞΙΔΙΟΥ
// ==========================================

function calculateTripDays(start, end) {

    const dates =
        new Set(
            getTripDates(
                start,
                end
            )
        );


    const result =
        calculateServiceFromDates(
            dates
        );


    return result.totalDays;
}


// ==========================================
// ΕΜΦΑΝΙΣΗ ΤΑΞΙΔΙΩΝ
// ==========================================

function showTrips() {

    const list =
        document.getElementById("tripList");


    if (trips.length === 0) {

        list.innerHTML =
            "Δεν υπάρχουν ακόμη ταξίδια.";

        return;
    }


    let html = "";


    trips.forEach(function (trip, index) {

        const start =
            toDate(trip.embark);

        const end =
            toDate(trip.discharge);


        const dates =
    new Set(
        getTripDates(
            start,
            end
        )
    );

const tripResult =
    calculateServiceFromDates(
        dates
    );


        html += `

            <div style="
                margin-bottom:15px;
                padding:12px;
                background:white;
                border-radius:8px;
            ">

                <strong>
                    Πλοίο ${index + 1}
                </strong>

                <br>

                Ναυτολόγηση:
                ${formatGreekDate(trip.embark)}

                <br>

                Απόλυση:
                ${formatGreekDate(trip.discharge)}

                <br>

                Ειδικότητα:
                ${trip.rank}

                <br>

                Υπηρεσία:
${tripResult.months} μήνες και
${tripResult.days} ημέρες


                <div style="
                    margin-top:10px;
                    display:flex;
                    gap:8px;
                ">

                    <button
                        type="button"
                        onclick="editTrip(${index})"
                        style="
                            background:#007bff;
                            color:white;
                            border:none;
                            padding:8px 14px;
                            border-radius:6px;
                            cursor:pointer;
                        "
                    >
                        ✏️ Αλλαγή
                    </button>


                    <button
                        type="button"
                        onclick="deleteTrip(${index})"
                        style="
                            background:#dc3545;
                            color:white;
                            border:none;
                            padding:8px 14px;
                            border-radius:6px;
                            cursor:pointer;
                        "
                    >
                        🗑️ Διαγραφή
                    </button>

                </div>

            </div>

        `;
    });


    list.innerHTML = html;
}


// ==========================================
// ΑΛΛΑΓΗ ΤΑΞΙΔΙΟΥ
// ==========================================

function editTrip(index) {

    const trip =
        trips[index];


    document.getElementById("embark").value =
        trip.embark;


    document.getElementById("discharge").value =
        trip.discharge;


    document.getElementById("rank").value =
        trip.rank;


    editingIndex =
        index;


    document.getElementById("addTrip").textContent =
        "Αποθήκευση Αλλαγής";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// ΔΙΑΓΡΑΦΗ ΤΑΞΙΔΙΟΥ
// ==========================================

function deleteTrip(index) {

    const trip =
        trips[index];


    const answer =
        confirm(
            "Θέλετε να διαγράψετε το ταξίδι;\n\n" +
            "Ναυτολόγηση: " +
            formatGreekDate(trip.embark) +
            "\n" +
            "Απόλυση: " +
            formatGreekDate(trip.discharge) +
            "\n" +
            "Ειδικότητα: " +
            trip.rank
        );


    if (!answer) {
        return;
    }


    trips.splice(
        index,
        1
    );


    if (
        editingIndex === index
    ) {

        editingIndex = -1;

        document.getElementById(
            "addTrip"
        ).textContent =
            "Προσθήκη Ταξιδιού";


        document.getElementById(
            "embark"
        ).value = "";


        document.getElementById(
            "discharge"
        ).value = "";

    }


    else if (
        editingIndex > index
    ) {

        editingIndex--;
    }


    showTrips();

    calculateService();
}


// ==========================================
// ΚΟΥΜΠΙ ΥΠΟΛΟΓΙΣΜΟΥ
// ==========================================

document
    .getElementById("calculate")
    .addEventListener(
        "click",
        calculateService
    );


// ==========================================
// ΥΠΟΛΟΓΙΣΜΟΣ ΣΥΝΟΛΙΚΗΣ ΥΠΗΡΕΣΙΑΣ
// ==========================================

function calculateService() {

    if (trips.length === 0) {

        document.getElementById(
            "result"
        ).innerHTML = "";

        return;
    }


    // ======================================
    // ΟΛΕΣ ΟΙ ΜΟΝΑΔΙΚΕΣ ΗΜΕΡΟΜΗΝΙΕΣ
    // ======================================

    const allDates =
        new Set();


    // ======================================
    // ΗΜΕΡΟΜΗΝΙΕΣ ΑΝΑ ΤΑΞΙΔΙ
    // ΓΙΑ ΕΝΤΟΠΙΣΜΟ ΕΠΙΚΑΛΥΨΕΩΝ
    // ======================================

    const dateTrips = {};


    trips.forEach(
        function (trip, index) {

            const start =
                toDate(trip.embark);

            const end =
                toDate(trip.discharge);


            const dates =
                getTripDates(
                    start,
                    end
                );


            dates.forEach(
                function (date) {

                    allDates.add(date);


                    if (
                        !dateTrips[date]
                    ) {

                        dateTrips[date] = [];
                    }


                    dateTrips[date].push(
                        index + 1
                    );
                }
            );
        }
    );


    // ======================================
    // ΣΥΝΟΛΙΚΗ ΥΠΗΡΕΣΙΑ
    // ======================================

    const totalResult =
        calculateServiceFromDates(
            allDates
        );


    // ======================================
    // ΕΠΙΚΑΛΥΨΕΙΣ
    // ======================================

    const overlappingDates =
        Object.keys(dateTrips)
            .filter(
                function (date) {

                    return (
                        dateTrips[date].length > 1
                    );

                }
            )
            .sort();


    const overlappingDays =
        overlappingDates.length;


    let overlapMessage = "";


    if (
        overlappingDays > 0
    ) {

        const dayText =
            overlappingDays === 1
                ? "ημέρα"
                : "ημέρες";


        let overlapList = "";


        overlappingDates.forEach(
            function (date) {

                const tripNumbers =
                    dateTrips[date]
                        .map(
                            function (number) {

                                return (
                                    "Πλοίο " +
                                    number
                                );

                            }
                        )
                        .join(" ↔ ");


                overlapList += `

                    <li style="
                        margin-bottom:6px;
                    ">

                        ${formatGreekDate(date)}
                        —
                        ${tripNumbers}

                    </li>

                `;
            }
        );


        overlapMessage = `

            <div style="
                color:red;
                font-weight:bold;
                margin-top:15px;
                padding:12px;
                background:#fff5f5;
                border-radius:8px;
            ">

                ⚠️ Επικαλυπτόμενες
                ημέρες ταξιδιών:
                ${overlappingDays}
                ${dayText}


                <ul style="
                    margin-top:8px;
                    margin-bottom:0;
                    font-weight:normal;
                ">

                    ${overlapList}

                </ul>

            </div>

        `;
    }


    // ======================================
    // ΥΠΗΡΕΣΙΑ ΑΝΑ ΕΙΔΙΚΟΤΗΤΑ
    // ======================================

    const ranks = [

        "Καθαριστής",

        "Μηχανοδηγός / Λιπαντής",

        "Βοηθός Ηλεκτρολόγου",

        "Δόκιμος Μηχανικός",

        "Δόκιμος Ηλεκτρολόγος"

    ];


    let rankMessage = `

        <h3 style="
            margin-top:25px;
        ">

            Υπηρεσία ανά Ειδικότητα

        </h3>

    `;


    ranks.forEach(
        function (rank) {

            const rankTrips =
                trips.filter(
                    function (trip) {

                        return (
                            trip.rank === rank
                        );

                    }
                );


            if (
                rankTrips.length === 0
            ) {

                return;
            }


            const rankDates =
                new Set();


            rankTrips.forEach(
                function (trip) {

                    const start =
                        toDate(
                            trip.embark
                        );


                    const end =
                        toDate(
                            trip.discharge
                        );


                    const dates =
                        getTripDates(
                            start,
                            end
                        );


                    dates.forEach(
                        function (date) {

                            rankDates.add(
                                date
                            );

                        }
                    );
                }
            );


            const rankResult =
                calculateServiceFromDates(
                    rankDates
                );


            rankMessage += `

                <div style="
                    background:white;
                    padding:12px;
                    margin-top:10px;
                    border-radius:8px;
                    border-left:5px solid #007bff;
                ">

                    <strong>
                        ${rank}
                    </strong>

                    <br>

                    ${rankResult.months}
                    μήνες και
                    ${rankResult.days}
                    ημέρες

                    <br>

        

                </div>

            `;
        }
    );


    // ======================================
    // ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
    // ======================================

    document.getElementById(
        "result"
    ).innerHTML = `

        <h3>
            Συνολική Υπηρεσία
        </h3>


        <p>

            <strong>

                ${totalResult.months}
                μήνες και
                ${totalResult.days}
                ημέρες

            </strong>

        </p>



        ${overlapMessage}


        ${rankMessage}

    `;
}


// ==========================================
// ΑΡΧΙΚΗ ΕΜΦΑΝΙΣΗ
// ==========================================

showTrips();