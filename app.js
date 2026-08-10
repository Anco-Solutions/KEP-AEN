let trips = [];
let editingIndex = -1;

let currentKEP = "";
let kep1SavedTrips = [];


// ==========================================
// ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ
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


function dateKey(date) {

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}


function formatGreekDate(dateString) {

    const [year, month, day] =
        dateString.split("-");

    return `${day}/${month}/${year}`;
}


function getTripDates(start, end) {

    const dates = [];

    let current = new Date(start);

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


    const monthGroups = {};


    dates.forEach(function (dateString) {

        const [year, month, day] =
            dateString.split("-").map(Number);


        const key =
            year +
            "-" +
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


            const fullMonth =
                group.days.length === lastDay &&
                firstDay === 1 &&
                lastCoveredDay === lastDay;


            if (fullMonth) {

                months++;

            } else {

                days += group.days.length;

            }

        }
    );


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
// ΥΠΗΡΕΣΙΑ ΛΙΣΤΑΣ ΤΑΞΙΔΙΩΝ
// ==========================================

function calculateTripsService(tripList) {

    const allDates =
        new Set();


    tripList.forEach(function (trip) {

        const start =
            toDate(trip.embark);


        const end =
            toDate(trip.discharge);


        getTripDates(
            start,
            end
        ).forEach(function (date) {

            allDates.add(date);

        });

    });


    return calculateServiceFromDates(
        allDates
    );
}


// ==========================================
// ΠΡΟΣΘΗΚΗ / ΑΛΛΑΓΗ ΤΑΞΙΔΙΟΥ
// ==========================================

document
    .getElementById("addTrip")
    .addEventListener(
        "click",
        function () {

            const embark =
                document.getElementById(
                    "embark"
                ).value;


            const discharge =
                document.getElementById(
                    "discharge"
                ).value;


            const rank =
                document.getElementById(
                    "rank"
                ).value;


            if (!embark || !discharge) {

                alert(
                    "Συμπλήρωσε την ημερομηνία ναυτολόγησης και απόλυσης."
                );

                return;
            }


            const start =
                toDate(embark);


            const end =
                toDate(discharge);


            if (end < start) {

                alert(
                    "Η ημερομηνία απόλυσης δεν μπορεί να είναι πριν από την ναυτολόγηση."
                );

                return;
            }


            const trip = {

                embark: embark,

                discharge: discharge,

                rank: rank

            };


            if (editingIndex === -1) {

                trips.push(trip);

            } else {

                trips[editingIndex] =
                    trip;

                editingIndex = -1;


                document.getElementById(
                    "addTrip"
                ).textContent =
                    "Προσθήκη Ταξιδιού";
            }


            document.getElementById(
                "embark"
            ).value = "";


            document.getElementById(
                "discharge"
            ).value = "";


            showTrips();

            calculateService();

        }
    );


// ==========================================
// ΕΜΦΑΝΙΣΗ ΤΑΞΙΔΙΩΝ
// ==========================================

function showTrips() {

    const list =
        document.getElementById(
            "tripList"
        );


    if (trips.length === 0) {

        list.innerHTML =
            "Δεν υπάρχουν ακόμη ταξίδια.";

        return;
    }


    let html = "";


    trips.forEach(function (trip, index) {

        const service =
            calculateTripsService([
                trip
            ]);


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
                ${formatGreekDate(
                    trip.embark
                )}

                <br>

                Απόλυση:
                ${formatGreekDate(
                    trip.discharge
                )}

                <br>

                Ειδικότητα:
                ${trip.rank}

                <br>

                Υπηρεσία:
                ${service.months}
                μήνες και
                ${service.days}
                ημέρες


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
                        "
                    >
                        🗑️ Διαγραφή
                    </button>

                </div>

            </div>

        `;

    });


    list.innerHTML =
        html;
}


// ==========================================
// ΑΛΛΑΓΗ ΤΑΞΙΔΙΟΥ
// ==========================================

function editTrip(index) {

    const trip =
        trips[index];


    document.getElementById(
        "embark"
    ).value =
        trip.embark;


    document.getElementById(
        "discharge"
    ).value =
        trip.discharge;


    document.getElementById(
        "rank"
    ).value =
        trip.rank;


    editingIndex =
        index;


    document.getElementById(
        "addTrip"
    ).textContent =
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
            formatGreekDate(
                trip.embark
            ) +

            "\n" +

            "Απόλυση: " +
            formatGreekDate(
                trip.discharge
            ) +

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


    editingIndex = -1;


    document.getElementById(
        "addTrip"
    ).textContent =
        "Προσθήκη Ταξιδιού";


    showTrips();

    calculateService();
}


// ==========================================
// ΥΠΗΡΕΣΙΑ ΑΝΑ ΕΙΔΙΚΟΤΗΤΑ
// ==========================================

function createRankMessage(tripList) {

    const ranks = [

        "Καθαριστής",

        "Μηχανοδηγός / Λιπαντής",

        "Βοηθός Ηλεκτρολόγου",

        "Δόκιμος Μηχανικός",

        "Δόκιμος Ηλεκτρολόγος"

    ];


    let message = `

        <h3 style="
            margin-top:25px;
        ">

            Υπηρεσία ανά Ειδικότητα

        </h3>

    `;


    ranks.forEach(function (rank) {

        const rankTrips =
            tripList.filter(
                function (trip) {

                    return trip.rank === rank;

                }
            );


        if (rankTrips.length === 0) {

            return;
        }


        const service =
            calculateTripsService(
                rankTrips
            );


        message += `

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

                ${service.months}
                μήνες και
                ${service.days}
                ημέρες

            </div>

        `;

    });


    return message;
}


// ==========================================
// ΥΠΗΡΕΣΙΑ ΚΕΠ 1 — ΧΕΙΡΟΚΙΝΗΤΗ
// ==========================================

function getKEP1ManualService() {

    const months =
        Number(
            document.getElementById(
                "kep1Months"
            ).value
        ) || 0;


    const days =
        Number(
            document.getElementById(
                "kep1Days"
            ).value
        ) || 0;


    return {

        months: months,

        days: days,

        totalDays:
            months * 30 + days

    };
}


// ==========================================
// ΜΗΝΥΜΑ ΥΠΗΡΕΣΙΑΣ ΚΕΠ 1
// ==========================================

function updateKEP1ManualStatus() {

    const status =
        document.getElementById(
            "kep1InputStatus"
        );


    if (!status) {

        return;
    }


    if (currentKEP !== "2") {

        status.innerHTML = "";

        return;
    }


    const service =
        getKEP1ManualService();


    // ------------------------------------------
    // ΜΗ ΕΓΚΥΡΕΣ ΗΜΕΡΕΣ
    // ------------------------------------------

    if (
        service.days < 0 ||
        service.days > 29
    ) {

        status.innerHTML = `

            <div style="
                color:#dc3545;
                font-weight:bold;
                margin-top:10px;
                padding:12px;
                background:#fff5f5;
                border-radius:8px;
            ">

                ❌ Οι ημέρες πρέπει να είναι
                από 0 έως 29.

            </div>

        `;

        return;
    }


    // ------------------------------------------
    // ΚΕΠ 1 < 3 ΜΗΝΕΣ
    // ------------------------------------------

    if (
        service.totalDays < 90
    ) {

        status.innerHTML = `

            <div style="
                color:#dc3545;
                font-weight:bold;
                margin-top:10px;
                padding:12px;
                background:#fff5f5;
                border-radius:8px;
            ">

                ❌ Η υπηρεσία ΚΕΠ 1 είναι
                μικρότερη από την ελάχιστα
                απαιτούμενη υπηρεσία των 3 μηνών.

                <br><br>

                Το ΚΕΠ δεν μπορεί να εξεταστεί.

            </div>

        `;

        return;
    }


    // ------------------------------------------
    // ΚΕΠ 1 >= 3 ΜΗΝΕΣ
    // ------------------------------------------

    status.innerHTML = `

        <div style="
            color:#198754;
            font-weight:bold;
            margin-top:10px;
            padding:12px;
            background:#f0fff4;
            border-radius:8px;
        ">

            ✅ Η υπηρεσία ΚΕΠ 1 είναι
            ${service.months}
            μήνες και
            ${service.days}
            ημέρες.

            <br><br>

            Το ΚΕΠ μπορεί να εξεταστεί.

        </div>

    `;
}


// ==========================================
// ΑΛΛΑΓΗ ΚΕΠ
// ==========================================

document
    .querySelectorAll(
        'input[name="kep"]'
    )
    .forEach(function (radio) {

        radio.addEventListener(
            "change",
            function () {

                if (
                    radio.value === "2"
                ) {

                    // Αποθήκευση ΚΕΠ 1

                    kep1SavedTrips =
                        trips.map(
                            function (trip) {

                                return {
                                    ...trip
                                };

                            }
                        );


                    // Νέα λίστα για ΚΕΠ 2

                    trips = [];
editingIndex = -1;
currentKEP = "2";

document.getElementById(
    "kep1PreviousService"
).style.display = "none";

document.getElementById(
    "kep2Section"
).style.display = "block";


                } else {

                    // Επιστροφή στο ΚΕΠ 1

                    trips =
                        kep1SavedTrips.map(
                            function (trip) {

                                return {
                                    ...trip
                                };

                            }
                        );


                    editingIndex = -1;

                    currentKEP = "1";


        document.getElementById(
    "kep1PreviousService"
).style.display =
    "block";

document.getElementById(
    "kep2Section"
).style.display =
    "none";
    
                }


                document.getElementById(
                    "embark"
                ).value = "";


                document.getElementById(
                    "discharge"
                ).value = "";


                document.getElementById(
                    "result"
                ).innerHTML = "";


                showTrips();

                updateKEP1ManualStatus();

            }

        );

    });


// ==========================================
// ΕΝΗΜΕΡΩΣΗ ΜΗΝΩΝ / ΗΜΕΡΩΝ ΚΕΠ 1
// ==========================================

document
    .getElementById(
        "kep1Months"
    )
    .addEventListener(
        "input",
        updateKEP1ManualStatus
    );


document
    .getElementById(
        "kep1Days"
    )
    .addEventListener(
        "input",
        updateKEP1ManualStatus
    );


// ==========================================
// ΕΛΕΓΧΟΣ ΚΕΠ 1
// ==========================================

function calculateKEP1Status(
    service
) {

    if (
        service.totalDays < 90
    ) {

        return `

            <div style="
                color:#dc3545;
                font-weight:bold;
                margin-top:20px;
                padding:14px;
                background:#fff5f5;
                border-radius:8px;
            ">

                ❌ Η υπηρεσία ΚΕΠ 1 είναι
                μικρότερη από την ελάχιστα
                απαιτούμενη υπηρεσία των 3 μηνών.

                <br><br>

                Το ΚΕΠ δεν μπορεί να εξεταστεί.

            </div>

        `;

    }


    if (
        service.totalDays > 180
    ) {

        return `

            <div style="
                color:#198754;
                font-weight:bold;
                margin-top:20px;
                padding:14px;
                background:#f0fff4;
                border-radius:8px;
            ">

                ✅ Η υπηρεσία ΚΕΠ 1 είναι
                ${service.months}
                μήνες και
                ${service.days}
                ημέρες.

                <br><br>

                Το ΚΕΠ μπορεί να εξεταστεί.

                <br><br>

                Έχει ξεπεράσει την απαιτούμενη
                υπηρεσία των έξι μηνών.

                <br>

                Θα ληφθούν υπόψη μόνο
                οι έξι μήνες υπηρεσίας.

            </div>

        `;

    }


    return `

        <div style="
            color:#198754;
            font-weight:bold;
            margin-top:20px;
            padding:14px;
            background:#f0fff4;
            border-radius:8px;
        ">

            ✅ Η υπηρεσία ΚΕΠ 1 είναι
            ${service.months}
            μήνες και
            ${service.days}
            ημέρες.

            <br><br>

            Το ΚΕΠ μπορεί να εξεταστεί.

        </div>

    `;
}


// ==========================================
// ΚΥΡΙΟΣ ΥΠΟΛΟΓΙΣΜΟΣ
// ==========================================

document
    .getElementById(
        "calculate"
    )
    .addEventListener(
        "click",
        calculateService
    );


function calculateService() {

    const resultElement =
        document.getElementById(
            "result"
        );


    // ======================================
    // ΚΕΠ 1
    // ======================================

    if (
        currentKEP === "1"
    ) {

        if (
            trips.length === 0
        ) {

            resultElement.innerHTML = "";

            return;
        }


        const kep1Service =
            calculateTripsService(
                trips
            );


        const rankMessage =
            createRankMessage(
                trips
            );


        resultElement.innerHTML = `

            <h3>
                Συνολική Υπηρεσία
            </h3>

            <p>

                <strong>

                    ${kep1Service.months}
                    μήνες και
                    ${kep1Service.days}
                    ημέρες

                </strong>

            </p>

            ${rankMessage}

            ${calculateKEP1Status(
                kep1Service
            )}

        `;


        return;
    }


    // ======================================
    // ΚΕΠ 2
    // ======================================

    const kep1Service =
        getKEP1ManualService();


    // ======================================
    // ΕΛΕΓΧΟΣ ΚΕΠ 1
    // ======================================

    if (
        kep1Service.days < 0 ||
        kep1Service.days > 29
    ) {

        resultElement.innerHTML = `

            <div style="
                color:#dc3545;
                font-weight:bold;
                padding:14px;
                background:#fff5f5;
                border-radius:8px;
            ">

                ❌ Οι ημέρες της υπηρεσίας
                ΚΕΠ 1 πρέπει να είναι
                από 0 έως 29.

            </div>

        `;

        return;
    }


    if (
        kep1Service.totalDays < 90
    ) {

        resultElement.innerHTML = `

            <div style="
                color:#dc3545;
                font-weight:bold;
                padding:14px;
                background:#fff5f5;
                border-radius:8px;
            ">

                ❌ Η υπηρεσία ΚΕΠ 1 είναι
                μικρότερη από την ελάχιστα
                απαιτούμενη υπηρεσία των 3 μηνών.

                <br><br>

                Το ΚΕΠ δεν μπορεί να εξεταστεί.

            </div>

        `;

        return;
    }


    // ======================================
    // ΜΕΓΙΣΤΟ ΚΕΠ 1 = 6 ΜΗΝΕΣ
    // ======================================

    const kep1CountedDays =
        Math.min(
            kep1Service.totalDays,
            180
        );


    // ======================================
    // ΥΠΗΡΕΣΙΑ ΚΕΠ 2
    // ======================================

    const kep2Service =
        calculateTripsService(
            trips
        );


    // ======================================
    // ΣΥΝΟΛΟ ΚΕΠ 1 + ΚΕΠ 2
    // ======================================

    const combinedDays =
        kep1CountedDays +
        kep2Service.totalDays;


    const combinedMonths =
        Math.floor(
            combinedDays / 30
        );


    const combinedRemainder =
        combinedDays % 30;


    // ======================================
    // ΕΠΙΚΑΛΥΨΕΙΣ ΚΕΠ 2
    // ======================================

    const allDates =
        new Set();


    const dateTrips = {};


    trips.forEach(
        function (trip, index) {

            const dates =
                getTripDates(
                    toDate(trip.embark),
                    toDate(trip.discharge)
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


    let overlapMessage = "";


    if (
        overlappingDates.length > 0
    ) {

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
                ${overlappingDates.length}

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
    // ΜΗΝΥΜΑ ΓΙΑ ΠΑΝΩ ΑΠΟ 6 ΜΗΝΕΣ
    // ======================================

    let sixMonthMessage = "";


    if (
        kep1Service.totalDays > 180
    ) {

        sixMonthMessage = `

            <div style="
                color:#198754;
                font-weight:bold;
                padding:14px;
                background:#f0fff4;
                border-radius:8px;
                margin-top:15px;
            ">

                Η υπηρεσία ΚΕΠ 1 είναι
                ${kep1Service.months}
                μήνες και
                ${kep1Service.days}
                ημέρες.

                <br><br>

                Έχει ξεπεράσει την απαιτούμενη
                υπηρεσία των έξι μηνών.

                <br>

                Θα ληφθούν υπόψη μόνο
                οι έξι μήνες υπηρεσίας.

            </div>

        `;

    }


    // ======================================
    // ΕΛΕΓΧΟΣ 12 ΜΗΝΩΝ
    // ======================================

    let twelveMonthMessage = "";


    if (
        combinedDays >= 360
    ) {

        twelveMonthMessage = `

            <div style="
                color:#198754;
                font-weight:bold;
                padding:14px;
                background:#f0fff4;
                border-radius:8px;
                margin-top:15px;
            ">

                ✅ Έχει συμπληρωθεί η απαιτούμενη
                συνολική υπηρεσία των 12 μηνών.

                <br><br>

                Το ΚΕΠ 2 μπορεί να εξεταστεί.

            </div>

        `;

    } else {

        const remaining =
            360 -
            combinedDays;


        const remainingMonths =
            Math.floor(
                remaining / 30
            );


        const remainingDays =
            remaining % 30;


twelveMonthMessage = `

    <div style="
        color:#dc3545;
        font-weight:bold;
        padding:14px;
        background:#fff5f5;
        border-radius:8px;
        margin-top:15px;
    ">

        ❌ Δεν έχουν συμπληρωθεί
        οι απαιτούμενοι 12 μήνες υπηρεσίας.

        <br><br>

        Υπολείπονται:

        ${remainingMonths}
        μήνες και
        ${remainingDays}
        ημέρες.

        <br><br>

        Το ΚΕΠ δεν μπορεί να εξεταστεί.

    </div>

`;

    }


    // ======================================
    // ΥΠΗΡΕΣΙΑ ΑΝΑ ΕΙΔΙΚΟΤΗΤΑ
    // ======================================

    const rankMessage =
        createRankMessage(
            trips
        );


    // ======================================
    // ΤΕΛΙΚΗ ΕΜΦΑΝΙΣΗ
    // ======================================

    resultElement.innerHTML = `

        <h3>
            Συνολική Υπηρεσία ΚΕΠ 2
        </h3>


        <p>

            <strong>

                ${kep2Service.months}
                μήνες και
                ${kep2Service.days}
                ημέρες

            </strong>

        </p>


        ${overlapMessage}


        ${rankMessage}


        <div style="
            margin-top:25px;
            padding:15px;
            background:white;
            border-radius:8px;
        ">

            <h3 style="margin-top:0;">

                Συνολική Υπηρεσία
                ΚΕΠ 1 + ΚΕΠ 2

            </h3>


            <p>

                Υπηρεσία ΚΕΠ 1:

                <strong>

                    ${Math.floor(
                        kep1CountedDays / 30
                    )}
                    μήνες και
                    ${kep1CountedDays % 30}
                    ημέρες

                </strong>

            </p>


            <p>

                Υπηρεσία ΚΕΠ 2:

                <strong>

                    ${kep2Service.months}
                    μήνες και
                    ${kep2Service.days}
                    ημέρες

                </strong>

            </p>


            <p>

                <strong>

                    Σύνολο:

                    ${combinedMonths}
                    μήνες και
                    ${combinedRemainder}
                    ημέρες

                </strong>

            </p>

        </div>


        ${sixMonthMessage}


        ${twelveMonthMessage}

    `;
}


// ==========================================
// ΑΡΧΙΚΗ ΕΜΦΑΝΙΣΗ
// ==========================================

showTrips();

updateKEP1ManualStatus();