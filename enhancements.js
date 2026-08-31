/* SeaService Calculator — archive / print / email enhancements */
(function () {
    const ARCHIVE_KEY = "seaServiceArchive";

    function readArchive() {
        try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); }
        catch (e) { return []; }
    }

    function saveArchive(records) {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(records));
    }

    function currentKep() {
        const checked = document.querySelector('input[name="kep"]:checked');
        return checked ? checked.value : "";
    }

    function today() {
        const d = new Date();
        return d.toISOString().slice(0, 10);
    }

    function getName() {
        const el = document.getElementById("fullName");
        return el ? el.value.trim() : "";
    }

    function showNameFromArchive() {
        const reg = (document.getElementById("registryNumber")?.value || "").trim();
        const name = document.getElementById("fullName");
        if (!name || !reg) return;
        const found = readArchive().find(r => String(r.registryNumber || "") === reg && r.fullName);
        if (found) {
            name.value = found.fullName;
            name.dataset.fromArchive = "true";
        }
    }

    function buildRecord() {
        const result = document.getElementById("result");
        const reg = (document.getElementById("registryNumber")?.value || "").trim();
        const name = getName();
        if (!reg || !name || !result || !result.innerText.trim()) return null;

        const text = result.innerText.trim();
        const success = !/δεν μπορεί|απορρί|ανεπαρκ|❌/i.test(text);
        return {
            id: Date.now(),
            date: today(),
            registryNumber: reg,
            fullName: name,
            kep: currentKep() ? "ΚΕΠ " + currentKep() : "",
            service: "Υπηρεσία θα συμπληρωθεί στο επόμενο στάδιο",
            documents: "Δεν έχει δηλωθεί",
            result: text,
            success: success,
            trips: Array.isArray(window.trips) ? window.trips : []
        };
    }

    function archiveCurrent() {
        const record = buildRecord();
        if (!record) {
            alert("Συμπλήρωσε Μητρώο, Ονοματεπώνυμο και ολοκλήρωσε πρώτα τον υπολογισμό.");
            return;
        }
        const records = readArchive();
        records.unshift(record);
        saveArchive(records);
        alert("Η εξέταση καταχωρήθηκε στο Αρχείο Εξέτασης ΚΕΠ.");
    }

    function printCurrent() {
        const result = document.getElementById("result");
        if (!result || !result.innerText.trim()) {
            alert("Κάνε πρώτα τον Υπολογισμό Υπηρεσίας.");
            return;
        }
        window.print();
    }

    function emailCurrent() {
        const record = buildRecord();
        if (!record) {
            alert("Συμπλήρωσε Μητρώο, Ονοματεπώνυμο και ολοκλήρωσε πρώτα τον υπολογισμό.");
            return;
        }
        const subject = encodeURIComponent("Αρχείο Εξέτασης ΚΕΠ — " + record.fullName + " — " + record.registryNumber);
        const body = encodeURIComponent(
            "Αρχείο Εξέτασης ΚΕΠ\n\n" +
            "Μητρώο: " + record.registryNumber + "\n" +
            "Ονοματεπώνυμο: " + record.fullName + "\n" +
            "ΚΕΠ: " + record.kep + "\n" +
            "Ημερομηνία: " + record.date + "\n\n" +
            record.result
        );
        window.location.href = "mailto:?subject=" + subject + "&body=" + body;
    }

    function addActions() {
        if (document.getElementById("archiveActions")) return;
        const result = document.getElementById("result");
        if (!result) return;
        const panel = document.createElement("div");
        panel.id = "archiveActions";
        panel.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:15px;";
        panel.innerHTML = `
            <button type="button" id="printResult">🖨️ Εκτύπωση / PDF</button>
            <button type="button" id="emailResult">✉️ Αποστολή με email</button>
            <button type="button" id="saveArchive">📁 Αποθήκευση στο Αρχείο</button>
        `;
        result.parentNode.insertBefore(panel, result.nextSibling);
        document.getElementById("printResult").onclick = printCurrent;
        document.getElementById("emailResult").onclick = emailCurrent;
        document.getElementById("saveArchive").onclick = archiveCurrent;
    }

    function init() {
        addActions();
        const reg = document.getElementById("registryNumber");
        if (reg) reg.addEventListener("blur", showNameFromArchive);
        const calculate = document.getElementById("calculate");
        if (calculate) calculate.addEventListener("click", () => setTimeout(addActions, 50));
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
