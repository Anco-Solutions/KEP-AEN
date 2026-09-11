/* Sea-service calculation + progressive candidate controls. */
(function () {
    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    function serviceMonthLength(year, month) {
        return month === 2 ? (isLeapYear(year) ? 29 : 28) : 30;
    }
    function clampServiceDay(year, month, day) {
        return Math.min(day, serviceMonthLength(year, month));
    }
    function toDateSafe(value) {
        var parts = String(value).split('-').map(Number);
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
        var sy = start.getFullYear(), sm = start.getMonth() + 1, sd = clampServiceDay(sy, sm, start.getDate());
        var ey = end.getFullYear(), em = end.getMonth() + 1, ed = clampServiceDay(ey, em, end.getDate());
        if (dateOnlyMs(end) < dateOnlyMs(start)) return { months: 0, days: 0, totalDays: 0 };
        if (sy === ey && sm === em) {
            var sameMonthDays = Math.max(0, ed - sd + 1);
            return { months: Math.floor(sameMonthDays / 30), days: sameMonthDays % 30, totalDays: sameMonthDays };
        }
        var months = 0, days = 0;
        var startMonthLength = serviceMonthLength(sy, sm);
        if (sd === 1) months += 1;
        else days += startMonthLength - sd + 1;
        var y = sy, m = sm;
        while (true) {
            m += 1;
            if (m === 13) { m = 1; y += 1; }
            if (y === ey && m === em) break;
            months += 1;
        }
        var endMonthLength = serviceMonthLength(ey, em);
        if (ed >= endMonthLength) months += 1;
        else days += ed;
        months += Math.floor(days / 30);
        days %= 30;
        return { months: months, days: days, totalDays: months * 30 + days };
    }
    function mergeTrips(tripList) {
        var ranges = tripList.map(function (trip) {
            return { start: toDateSafe(trip.embark), end: toDateSafe(trip.discharge) };
        }).filter(function (range) {
            return dateOnlyMs(range.end) >= dateOnlyMs(range.start);
        }).sort(function (a, b) {
            return dateOnlyMs(a.start) - dateOnlyMs(b.start);
        });
        var merged = [];
        ranges.forEach(function (range) {
            if (!merged.length) { merged.push({ start: range.start, end: range.end }); return; }
            var last = merged[merged.length - 1];
            if (dateOnlyMs(range.start) <= dateOnlyMs(addOneDay(last.end))) {
                if (dateOnlyMs(range.end) > dateOnlyMs(last.end)) last.end = range.end;
            } else merged.push({ start: range.start, end: range.end });
        });
        return merged;
    }
    window.calculateTripsService = function (tripList) {
        if (!Array.isArray(tripList) || !tripList.length) return { months: 0, days: 0, totalDays: 0 };
        var months = 0, days = 0;
        mergeTrips(tripList).forEach(function (range) {
            var s = calculateSingleTrip(range.start, range.end);
            months += s.months; days += s.days;
        });
        months += Math.floor(days / 30); days %= 30;
        return { months: months, days: days, totalDays: months * 30 + days };
    };

    function getTrips() {
        try { return typeof window.getSeaServiceTrips === 'function' ? window.getSeaServiceTrips() : []; }
        catch (e) { return []; }
    }
    function resetControl(id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else if ('value' in el) el.value = '';
    }
    function newEntry() {
        var ids = ['registryNumber','fullName','embark','discharge','result','examinerKep1','examinerKep2','documentsStatus','examinationStatus','examGrade','finalDecision'];
        ids.forEach(resetControl);
        document.querySelectorAll('input[name="kep"]').forEach(function (r) { r.checked = false; });
        ['tripList','kepStatus','kep1CurrentService','kep1PreviousService','kep2Section','tripForm','examinationPanel','examWarning'].forEach(function (id) {
            var el = document.getElementById(id); if (el) el.style.display = id === 'tripList' ? '' : 'none';
        });
        var tripList = document.getElementById('tripList');
        if (tripList) tripList.textContent = 'Δεν υπάρχουν ακόμη ταξίδια.';
        var manager = document.getElementById('examinerManager');
        if (manager) manager.classList.remove('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        var registry = document.getElementById('registryNumber');
        if (registry) registry.focus();
    }
    function setupBottomActions() {
        var container = document.querySelector('.container');
        if (!container) return;
        var old = document.getElementById('saveArchiveTop');
        var oldWrap = document.getElementById('saveArchiveTopWrap');
        if (oldWrap) oldWrap.remove();
        var actions = document.getElementById('archiveActionsBottom');
        if (!actions) {
            actions = document.createElement('div');
            actions.id = 'archiveActionsBottom';
            actions.style.cssText = 'margin:28px 0 8px;padding-top:16px;border-top:1px solid rgba(0,0,0,.10);display:flex;flex-direction:column;gap:10px;';
            container.appendChild(actions);
        }
        if (old) {
            old.textContent = '📁 Αποθήκευση Αρχείου';
            old.removeAttribute('style');
            old.className = 'pending-save';
            old.style.cssText = 'width:100%;margin:0;padding:13px 16px;border:0;border-radius:9px;background:#214f83;color:#fff;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.12);';
            actions.appendChild(old);
        } else {
            return;
        }
        var newBtn = document.getElementById('newEntryButton');
        if (!newBtn) {
            newBtn = document.createElement('button');
            newBtn.type = 'button';
            newBtn.id = 'newEntryButton';
            newBtn.textContent = '＋ Νέα καταχώριση';
            newBtn.style.cssText = 'width:100%;padding:12px 16px;border:1px solid #cfd5dc;border-radius:9px;background:#fff;color:#26344f;font:inherit;font-weight:800;cursor:pointer;';
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (confirm('Να ξεκινήσει νέα καταχώριση; Η υπάρχουσα καταχώριση στο Αρχείο δεν θα διαγραφεί.')) newEntry();
            });
        }
        actions.appendChild(newBtn);
    }
    function init() {
        setupBottomActions();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
