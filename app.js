let trips = [];
let editingIndex = -1;

let currentKEP = "";
let kep1SavedTrips = [];

// Public accessors used by the workflow layer so archived trips can be
// restored into the real calculator state (not a separate copy).
window.getSeaServiceTrips = function () {
    return trips;
};

window.setSeaServiceTrips = function (list) {
    trips = Array.isArray(list)
        ? list.map(function (trip) { return { ...trip }; })
        : [];
    editingIndex = -1;
    showTrips();
    calculateService();
};


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
