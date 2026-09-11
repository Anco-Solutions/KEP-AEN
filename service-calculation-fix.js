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
        ranges.forEach(function(r){if(!merged.length){merged.push({start:r.start,end:r.end});return;}var last=merged[merged.length-1];if(dateOnlyMs(r.start)<=dateOnlyMs(addOneDay(last.end))){if(dateOnlyMs(r.end)>dateOnlyMs(last.end))last.end=r.end;}else merged.push({start:r.start,end:r.end});});
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
        else {var tl=document.getElementById('tripList');if(tl)tl.textContent='Δεν υπάρχουν ακόμη ταξίδια.';}
        var tripList=document.getElementById('tripList');if(tripList)tripList.textContent='Δεν υπάρχουν ακόμη ταξίδια.';
        ['kepStatus','kep1CurrentService','kep1PreviousService','kep2Section','tripForm','examinationPanel','examWarning'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
        var manager=document.getElementById('examinerManager');if(manager)manager.classList.remove('open');
        var e1=document.getElementById('kep1Examiner'),e2=document.getElementById('kep2Examiner');if(e1)e1.classList.remove('active');if(e2)e2.classList.remove('active');
        window.scrollTo({top:0,behavior:'smooth'});
        var registry=document.getElementById('registryNumber');if(registry)registry.focus();
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
    function init(){setupBottomActions();}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
