/* SeaService Calculator — structured KEP archive / print / email enhancements */
(function () {
    const ARCHIVE_KEY = "seaServiceArchive";
    function readArchive(){try{return JSON.parse(localStorage.getItem(ARCHIVE_KEY)||"[]")}catch(e){return[]}}
    function saveArchive(records){localStorage.setItem(ARCHIVE_KEY,JSON.stringify(records))}
    function currentKep(){const c=document.querySelector('input[name="kep"]:checked');return c?c.value:""}
    function now(){const d=new Date();return {iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
    function val(id){const e=document.getElementById(id);return e?e.value.trim():""}
    function showNameFromArchive(){const reg=val("registryNumber"),name=document.getElementById("fullName");if(!name||!reg)return;const found=readArchive().find(r=>String(r.registryNumber||"")===reg&&r.fullName);if(found){name.value=found.fullName;name.dataset.fromArchive="true"}}
    function ensurePanel(){const p=document.getElementById("examinationPanel");if(p)p.style.display="block"}
    function resultText(){const r=document.getElementById("result");return r?r.innerText.trim():""}
    function isServiceBlocked(text){return /δεν μπορεί να εξεταστεί|μικρότερη από την ελάχιστα απαιτούμενη|ανεπαρκή υπηρεσία/i.test(text||"")}

    function syncExaminationFields(){
        const text=resultText();if(!text)return;ensurePanel();
        const blocked=isServiceBlocked(text),docs=val("documentsStatus");
        const status=document.getElementById("examinationStatus"),grade=document.getElementById("examGrade"),decision=document.getElementById("finalDecision"),warning=document.getElementById("examWarning");
        if(blocked){
            if(status)status.value="Δεν εξετάστηκε";
            if(grade)grade.value="Δεν βαθμολογήθηκε";
            if(decision)decision.value="Δεν εξετάστηκε λόγω ανεπαρκούς υπηρεσίας";
            if(warning){warning.style.display="block";warning.textContent="Η απαιτούμενη υπηρεσία δεν έχει συμπληρωθεί. Η εξέταση δεν μπορεί να ολοκληρωθεί."}
        }else if(docs==="Ελλιπή"){
            if(status)status.value="Δεν εξετάστηκε";
            if(grade)grade.value="Δεν βαθμολογήθηκε";
            if(decision)decision.value="Δεν ολοκληρώθηκε λόγω ελλιπών δικαιολογητικών";
            if(warning){warning.style.display="block";warning.textContent="Τα δικαιολογητικά είναι ελλιπή. Η εξέταση δεν ολοκληρώνεται μέχρι να συμπληρωθούν."}
        }else{
            if(warning){warning.style.display="none";warning.textContent=""}
            if(status&&status.value==="Δεν εξετάστηκε")status.value="Εξετάστηκε - Επιτυχής";
            if(decision&&(decision.value==="Σε αναμονή"||decision.value==="Δεν εξετάστηκε λόγω ανεπαρκούς υπηρεσίας"||decision.value==="Δεν ολοκληρώθηκε λόγω ελλιπών δικαιολογητικών"))decision.value="Μπορεί να προχωρήσει";
        }
    }

    function buildRecord(){
        const reg=val("registryNumber"),name=val("fullName"),text=resultText();
        if(!reg||!name||!text)return null;
        syncExaminationFields();const n=now(),docs=val("documentsStatus")||"Δεν έχει ελεγχθεί",blocked=isServiceBlocked(text);
        const status=blocked||docs==="Ελλιπή"?"Δεν εξετάστηκε":val("examinationStatus")||"Δεν εξετάστηκε";
        const grade=blocked||docs!=="Εντάξει"?"Δεν βαθμολογήθηκε":val("examGrade")||"Δεν βαθμολογήθηκε";
        let decision=val("finalDecision")||"Σε αναμονή";
        if(blocked)decision="Δεν εξετάστηκε λόγω ανεπαρκούς υπηρεσίας";else if(docs==="Ελλιπή")decision="Δεν ολοκληρώθηκε λόγω ελλιπών δικαιολογητικών";
        return {id:Date.now(),timestamp:n.iso,date:n.date,time:n.time,registryNumber:reg,fullName:name,kep:currentKep()?"ΚΕΠ "+currentKep():"",service:val("serviceKep1")||val("serviceKep2")||"",serviceKep1:val("serviceKep1"),serviceKep2:val("serviceKep2"),documents:docs,examinationStatus:status,grade:grade,finalDecision:decision,result:text,success:status==="Εξετάστηκε - Επιτυχής"&&decision==="Μπορεί να προχωρήσει",trips:[]};
    }

    function archiveCurrent(){const r=buildRecord();if(!r){alert("Συμπλήρωσε Μητρώο, Ονοματεπώνυμο και ολοκλήρωσε πρώτα τον υπολογισμό.");return}const a=readArchive();a.unshift(r);saveArchive(a);alert("Η εξέταση καταχωρήθηκε στο Αρχείο Εξέτασης ΚΕΠ.")}
    function printCurrent(){if(!resultText()){alert("Κάνε πρώτα τον Υπολογισμό Υπηρεσίας.");return}syncExaminationFields();window.print()}
    function emailCurrent(){const r=buildRecord();if(!r){alert("Συμπλήρωσε Μητρώο, Ονοματεπώνυμο και ολοκλήρωσε πρώτα τον υπολογισμό.");return}const subject=encodeURIComponent("Αρχείο Εξέτασης ΚΕΠ — "+r.fullName+" — "+r.registryNumber),body=encodeURIComponent("Αρχείο Εξέτασης ΚΕΠ\n\nΜητρώο: "+r.registryNumber+"\nΟνοματεπώνυμο: "+r.fullName+"\nΚΕΠ: "+r.kep+"\nΗμερομηνία: "+r.date+"\nΏρα: "+r.time+"\nΥπηρεσία ΚΕΠ 1: "+(r.serviceKep1||"—")+"\nΥπηρεσία ΚΕΠ 2: "+(r.serviceKep2||"—")+"\nΔικαιολογητικά: "+r.documents+"\nΚατάσταση εξέτασης: "+r.examinationStatus+"\nΒαθμός: "+r.grade+"\nΤελική απόφαση: "+r.finalDecision+"\n\n"+r.result);window.location.href="mailto:?subject="+subject+"&body="+body}

    function addActions(){
        if(document.getElementById("archiveActions"))return;const result=document.getElementById("result");if(!result)return;
        const p=document.createElement("div");p.id="archiveActions";p.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin-top:15px";
        p.innerHTML='<button type="button" id="printResult">🖨️ Εκτύπωση / PDF</button><button type="button" id="emailResult">✉️ Αποστολή με email</button><button type="button" id="saveArchive">📁 Καταχώριση στο Αρχείο</button>';
        result.parentNode.insertBefore(p,result.nextSibling);document.getElementById("printResult").onclick=printCurrent;document.getElementById("emailResult").onclick=emailCurrent;document.getElementById("saveArchive").onclick=archiveCurrent;
    }

    function init(){
        addActions();const reg=document.getElementById("registryNumber");if(reg){reg.addEventListener("blur",showNameFromArchive);reg.addEventListener("input",showNameFromArchive)}
        const calculate=document.getElementById("calculate");if(calculate)calculate.addEventListener("click",()=>setTimeout(()=>{addActions();syncExaminationFields()},100));
        ["documentsStatus","examinationStatus","examGrade","finalDecision","serviceKep1","serviceKep2"].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener("change",()=>{if(id==="documentsStatus")syncExaminationFields()})});
        document.querySelectorAll('input[name="kep"]').forEach(r=>r.addEventListener("change",()=>setTimeout(ensurePanel,50)));
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
