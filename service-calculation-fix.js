/* Sea-service calculation + progressive candidate controls. */
(function () {
    function isLeapYear(year) { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0); }
    function serviceMonthLength(year, month) { return month === 2 ? (isLeapYear(year) ? 29 : 28) : 30; }
    function clampServiceDay(year, month, day) { return Math.min(day, serviceMonthLength(year, month)); }
    function toDateSafe(value) { var parts = String(value).split('-').map(Number); return new Date(parts[0], parts[1] - 1, parts[2]); }
    function dateOnlyMs(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); }
    function addOneDay(date) { var d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() + 1); return d; }
    function calculateSingleTrip(start, end) {
        var sy=start.getFullYear(), sm=start.getMonth()+1, sd=clampServiceDay(sy,sm,start.getDate());
        var ey=end.getFullYear(), em=end.getMonth()+1, ed=clampServiceDay(ey,em,end.getDate());
        if(dateOnlyMs(end)<dateOnlyMs(start)) return {months:0,days:0,totalDays:0};
        if(sy===ey&&sm===em){var same=Math.max(0,ed-sd+1);return {months:Math.floor(same/30),days:same%30,totalDays:same};}
        var months=0,days=0,startLen=serviceMonthLength(sy,sm);
        if(sd===1) months++; else days+=startLen-sd+1;
        var y=sy,m=sm;
        while(true){m++;if(m===13){m=1;y++;}if(y===ey&&m===em)break;months++;}
        var endLen=serviceMonthLength(ey,em);
        if(ed>=endLen) months++; else days+=ed;
        months+=Math.floor(days/30);days%=30;
        return {months:months,days:days,totalDays:months*30+days};
    }
    function mergeTrips(list){
        var ranges=list.map(function(t){return {start:toDateSafe(t.embark),end:toDateSafe(t.discharge)};}).filter(function(r){return dateOnlyMs(r.end)>=dateOnlyMs(r.start);}).sort(function(a,b){return dateOnlyMs(a.start)-dateOnlyMs(b.start);});
        var merged=[];
        ranges.forEach(function(r){if(!merged.length){merged.push({start:r.start,end:r.end});return;}var last=merged[merged.length-1];if(dateOnlyMs(r.start)<=dateOnlyMs(addOneDay(last.end))){if(dateOnlyMs(r.end)>dateOnlyMs(last.end))last.end=r.end;}else merged.push(r);});
        return merged;
    }
    window.calculateTripsService=function(list){
        if(!Array.isArray(list)||!list.length)return {months:0,days:0,totalDays:0};
        var months=0,days=0;
        mergeTrips(list).forEach(function(r){var s=calculateSingleTrip(r.start,r.end);months+=s.months;days+=s.days;});
        months+=Math.floor(days/30);days%=30;
        return {months:months,days:days,totalDays:months*30+days};
    };

    function resetField(id){var el=document.getElementById(id);if(!el)return;if(el.tagName==='SELECT')el.selectedIndex=0;else if('value' in el)el.value='';}
    function newEntry(){
        ['registryNumber','fullName','embark','discharge','examinerKep1','examinerKep2','documentsStatus','examinationStatus','examGrade','finalDecision'].forEach(resetField);
        document.querySelectorAll('input[name="kep"]').forEach(function(r){r.checked=false;});
        var result=document.getElementById('result');if(result)result.innerHTML='';
        if(typeof window.setSeaServiceTrips==='function'){try{window.setSeaServiceTrips([]);}catch(e){}}
        var tripList=document.getElementById('tripList');if(tripList)tripList.textContent='Δεν υπάρχουν ακόμη ταξίδια.';
        ['kepStatus','kep1CurrentService','kep1PreviousService','kep2Section','tripForm','examinationPanel','examWarning'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
        var manager=document.getElementById('examinerManager');if(manager)manager.classList.remove('open');
        var e1=document.getElementById('kep1Examiner'),e2=document.getElementById('kep2Examiner');if(e1)e1.classList.remove('active');if(e2)e2.classList.remove('active');
        window.scrollTo({top:0,behavior:'smooth'});
        var registry=document.getElementById('registryNumber');if(registry)registry.focus();
    }
    function examinerList(){try{var a=JSON.parse(localStorage.getItem('seaServiceExaminers')||'[]');return Array.isArray(a)?a.filter(function(x){return String(x||'').trim();}):[]}catch(e){return[]}}
    function populateExaminerSelect(select){
        if(!select)return;
        var current=select.value, list=examinerList();
        select.innerHTML='';
        var first=document.createElement('option');first.value='';first.textContent=list.length?'— Επιλέξτε εξεταστή —':'— Δεν υπάρχουν εξεταστές —';select.appendChild(first);
        list.forEach(function(name){var o=document.createElement('option');o.value=String(name);o.textContent=String(name);select.appendChild(o);});
        if(list.indexOf(current)!==-1)select.value=current;
    }
    function refreshExaminerSelection(){
        var manage=document.getElementById('manageExaminers');
        if(manage){manage.style.display='none';manage.disabled=true;}
        var manager=document.getElementById('examinerManager');if(manager){manager.style.display='none';manager.classList.remove('open');}
        var e1=document.getElementById('kep1Examiner'),e2=document.getElementById('kep2Examiner');
        [e1,e2].forEach(function(w){if(!w)return;w.classList.remove('active');var strong=w.querySelector('strong');if(strong)strong.textContent='Εξεταστής';var s=w.querySelector('select');populateExaminerSelect(s);});
        var selected=document.querySelector('input[name="kep"]:checked');
        if(selected){var box=document.getElementById(selected.value==='1'?'kep1Examiner':'kep2Examiner');if(box)box.classList.add('active');}
    }
    function setupExaminerSelection(){
        refreshExaminerSelection();
        document.querySelectorAll('input[name="kep"]').forEach(function(r){if(!r.__examinerBound){r.__examinerBound=true;r.addEventListener('change',function(){setTimeout(refreshExaminerSelection,0);});}});
        var e1=document.getElementById('examinerKep1'),e2=document.getElementById('examinerKep2');
        [e1,e2].forEach(function(s){if(s&&!s.__examinerRefreshBound){s.__examinerRefreshBound=true;s.addEventListener('focus',function(){populateExaminerSelect(s);});}});
    }
    function setupBottomActions(){
        var container=document.querySelector('.container');if(!container)return;
        var button=document.getElementById('saveArchiveTop');if(!button)return;
        var actions=document.getElementById('archiveActionsBottom');
        if(!actions){actions=document.createElement('div');actions.id='archiveActionsBottom';actions.style.cssText='margin:28px 0 8px;padding-top:16px;border-top:1px solid rgba(0,0,0,.10);display:flex;flex-direction:column;gap:10px;';container.appendChild(actions);}
        button.textContent='📁 Αποθήκευση Αρχείου';
        button.className='pending-save';
        button.style.cssText='width:100%;margin:0;padding:13px 16px;border:0;border-radius:9px;background:#214f83;color:#fff;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.12);';
        actions.appendChild(button);
        var newBtn=document.getElementById('newEntryButton');
        if(!newBtn){
            newBtn=document.createElement('button');newBtn.type='button';newBtn.id='newEntryButton';newBtn.textContent='＋ Νέα καταχώριση';
            newBtn.style.cssText='width:100%;padding:12px 16px;border:1px solid #cfd5dc;border-radius:9px;background:#fff;color:#26344f;font:inherit;font-weight:800;cursor:pointer;';
            newBtn.addEventListener('click',function(e){e.preventDefault();if(confirm('Να ξεκινήσει νέα καταχώριση; Η υπάρχουσα καταχώριση στο Αρχείο δεν θα διαγραφεί.'))newEntry();});
        }
        actions.appendChild(newBtn);
    }

    (function setupRegistrationAudit(){
        var KEY='seaServiceArchive', AUDIT='seaServiceAuditLog', bound=false;
        function $(id){return document.getElementById(id)}
        function val(id){var e=$(id);return e?(e.value||'').trim():''}
        function now(){var d=new Date();return{iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
        function read(key){try{var x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
        function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
        function kep(){var e=document.querySelector('input[name="kep"]:checked');return e?e.value:''}
        function examiner(){return val(kep()==='1'?'examinerKep1':kep()==='2'?'examinerKep2':'')}
        function resultText(){return (($('result')&&$('result').innerText)||'').trim()}
        function trips(){try{return typeof window.getSeaServiceTrips==='function'?window.getSeaServiceTrips():[]}catch(e){return[]}}
        function save(){
            var r=val('registryNumber'),n=val('fullName'),who=examiner(),k=kep(),z=now();
            if(!r||!n){alert('Για να αποθηκευτεί η καταχώριση απαιτούνται Μητρώο και Ονοματεπώνυμο.');return false}
            if(!who){alert('Για να αποθηκευτεί η καταχώριση πρέπει να επιλεγεί ο Εξεταστής που έκανε την καταχώριση.');return false}
            var archive=read(KEY),idx=archive.findIndex(function(x){return String(x.registryNumber||'').trim()===r}),old=idx>=0?(archive[idx]||{}):null;
            var t=trips(),res=resultText(),status=val('examinationStatus')||'Σε εκκρεμότητα',grade=val('examGrade')||'Δεν βαθμολογήθηκε',decision=val('finalDecision')||'Σε αναμονή',docs=val('documentsStatus')||'Εκκρεμότητα',note=val('documentsNote');
            var rec=old?Object.assign({},old):{};
            rec.id=old&&old.id?old.id:Date.now();
            rec.timestamp=old&&old.timestamp?old.timestamp:z.iso;rec.date=old&&old.date?old.date:z.date;rec.time=old&&old.time?old.time:z.time;
            rec.registryNumber=r;rec.fullName=n;rec.kep=k?'ΚΕΠ '+k:(old&&old.kep)||'';rec.examiner=who;
            rec.createdBy=old&&old.createdBy?old.createdBy:who;rec.createdAt=old&&old.createdAt?old.createdAt:{iso:z.iso,date:z.date,time:z.time};
            rec.lastUpdatedBy=who;rec.lastUpdatedAt={iso:z.iso,date:z.date,time:z.time};
            if(t.length)rec.trips=t;
            if(res)rec.result=res;
            if(!rec.result)rec.result='Δεν έχει ακόμη ολοκληρωθεί ο υπολογισμός υπηρεσίας.';
            rec.documents=docs==='Δεν έχει ελεγχθεί'?'Εκκρεμότητα':docs;rec.documentsNote=note||rec.documentsNote||'';
            rec.examinationStatus=status==='Δεν εξετάστηκε'?'Σε εκκρεμότητα':status;rec.grade=grade;
            rec.finalDecision=decision==='Σε αναμονή'?'Σε εκκρεμότητα':decision;
            var event={id:Date.now()+Math.floor(Math.random()*1000),action:old?'Ενημέρωση καταχώρισης':'Νέα καταχώριση',timestamp:z.iso,date:z.date,time:z.time,by:who,registryNumber:r,fullName:n,kep:rec.kep,result:rec.result};
            rec.history=Array.isArray(old&&old.history)?old.history.slice():[];rec.history.push(event);
            var audit=read(AUDIT);audit.push(event);write(AUDIT,audit);
            if(idx>=0)archive.splice(idx,1);archive.unshift(rec);write(KEY,archive);
            alert(old?'Η καταχώριση ενημερώθηκε και καταγράφηκε στο ιστορικό.':'Η καταχώριση αποθηκεύτηκε και καταγράφηκε με Εξεταστή, ημερομηνία και ώρα.');
            return true;
        }
        function intercept(e){var b=e.target&&e.target.closest?e.target.closest('#saveArchiveTop'):null;if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();save()}
        function bind(){if(bound)return;document.addEventListener('click',intercept,true);bound=true}
        if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
    })();

    function init(){setupExaminerSelection();setupBottomActions();}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
