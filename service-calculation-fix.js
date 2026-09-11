/*
 * Sea-service calculation rule used by the calculator.
 *
 * Rule:
 * - Every non-February calendar month is treated as 30 days.
 * - February is treated as 28 or 29 days according to the year.
 * - The embarkation and discharge dates are included.
 * - Day 31 of a non-February month is treated as day 30 for this rule.
 * - Complete months count as 1 month.
 * - Remaining partial days are carried in groups of 30 into months.
 * - Overlapping/continuous trips are merged so service is not double-counted.
 */
(function () {
    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    function serviceMonthLength(year, month) {
        if (month === 2) {
            return isLeapYear(year) ? 29 : 28;
        }
        return 30;
    }

    function clampServiceDay(year, month, day) {
        return Math.min(day, serviceMonthLength(year, month));
    }

    function toDateSafe(value) {
        var parts = String(value).split("-").map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function dateOnlyMs(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    function addOneDay(date) {
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        d.setDate(d.getDate() + 1);
        return d;
    }

    function calculateSingleTrip(start, end) {
        var sy = start.getFullYear();
        var sm = start.getMonth() + 1;
        var sd = clampServiceDay(sy, sm, start.getDate());
        var ey = end.getFullYear();
        var em = end.getMonth() + 1;
        var ed = clampServiceDay(ey, em, end.getDate());

        if (dateOnlyMs(end) < dateOnlyMs(start)) {
            return { months: 0, days: 0, totalDays: 0 };
        }

        // Same calendar month: count the actual covered days, using the
        // service-day convention only for the month length.
        if (sy === ey && sm === em) {
            var sameMonthDays = Math.max(0, ed - sd + 1);
            return {
                months: Math.floor(sameMonthDays / 30),
                days: sameMonthDays % 30,
                totalDays: sameMonthDays
            };
        }

        var months = 0;
        var days = 0;

        // Embarkation month.
        var startMonthLength = serviceMonthLength(sy, sm);
        if (sd === 1) {
            months += 1;
        } else {
            days += startMonthLength - sd + 1;
        }

        // Complete calendar months between embarkation and discharge.
        var y = sy;
        var m = sm;
        while (true) {
            m += 1;
            if (m === 13) {
                m = 1;
                y += 1;
            }
            if (y === ey && m === em) {
                break;
            }
            months += 1;
        }

        // Discharge month.
        var endMonthLength = serviceMonthLength(ey, em);
        if (ed >= endMonthLength) {
            months += 1;
        } else {
            days += ed;
        }

        months += Math.floor(days / 30);
        days = days % 30;

        return {
            months: months,
            days: days,
            totalDays: months * 30 + days
        };
    }

    function mergeTrips(tripList) {
        var ranges = tripList.map(function (trip) {
            return {
                start: toDateSafe(trip.embark),
                end: toDateSafe(trip.discharge)
            };
        }).filter(function (range) {
            return dateOnlyMs(range.end) >= dateOnlyMs(range.start);
        }).sort(function (a, b) {
            return dateOnlyMs(a.start) - dateOnlyMs(b.start);
        });

        var merged = [];
        ranges.forEach(function (range) {
            if (!merged.length) {
                merged.push({ start: range.start, end: range.end });
                return;
            }

            var last = merged[merged.length - 1];
            var dayAfterLastEnd = addOneDay(last.end);

            if (dateOnlyMs(range.start) <= dateOnlyMs(dayAfterLastEnd)) {
                if (dateOnlyMs(range.end) > dateOnlyMs(last.end)) {
                    last.end = range.end;
                }
            } else {
                merged.push({ start: range.start, end: range.end });
            }
        });

        return merged;
    }

    // Replace the calculator's service function after app.js has loaded.
    window.calculateTripsService = function (tripList) {
        if (!Array.isArray(tripList) || tripList.length === 0) {
            return { months: 0, days: 0, totalDays: 0 };
        }

        var merged = mergeTrips(tripList);
        var months = 0;
        var days = 0;

        merged.forEach(function (range) {
            var service = calculateSingleTrip(range.start, range.end);
            months += service.months;
            days += service.days;
        });

        months += Math.floor(days / 30);
        days = days % 30;

        return {
            months: months,
            days: days,
            totalDays: months * 30 + days
        };
    };
})();
