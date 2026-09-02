document.write('<script src="structured-result.js?v=1"><\/script>');
/* workflow-v2 temporarily disabled: isolate KEP 1 / KEP 2 selection from archive workflow. */
(function(){
  function ready(){
    var tripForm=document.getElementById('tripForm');
    if(!tripForm)return;
    if(!document.getElementById('kep1Months')){var m=document.createElement('input');m.type='hidden';m.id='kep1Months';tripForm.appendChild(m)}
    if(!document.getElementById('kep1Days')){var d=document.createElement('input');d.type='hidden';d.id='kep1Days';tripForm.appendChild(d)}
    function serviceFromTrips(list){
      if(!Array.isArray(list)||!list.length)return{months:0,days:0,totalDays:0};
      var set=new Set();function key(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')}
      list.forEach(function(t){if(!t||!t.embark||!t.discharge)return;var s=new Date(t.embark+'T00:00:00'),e=new Date(t.discharge+'T00:00:00');while(s<=e){set.add(key(s));s.setDate(s.getDate()+1)}});
      var groups={};Array.from(set).sort().forEach(function(x){var p=x.split('-').map(Number),k=p[0]+'-'+String(p[1]).padStart(2,'0');(groups[k]||(groups[k]={days:[]})).days.push(p[2])});
      var months=0,days=0;Object.keys(groups).forEach(function(k){var p=k.split('-').map(Number),last=new Date(p[0],p[1],0).getDate(),a=groups[k].days;if(a.length===last&&Math.min.apply(null,a)===1&&Math.max.apply(null,a)===last)months++;else days+=a.length});months+=Math.floor(days/30);days%=30;return{months:months,days:days,totalDays:months*30+days}
    }
    function syncTripForm(){
      var selected=document.querySelector('input[name="kep"]:checked'),value=selected&&selected.value;tripForm.style.display=value?'block':'none';
      var months=document.getElementById('kep1Months'),days=document.getElementById('kep1Days');
      if(value==='2'){
        if(window.syncStructuredKep2Inputs)window.syncStructuredKep2Inputs();
        else{var saved=(typeof kep1SavedTrips!=='undefined'&&Array.isArray(kep1SavedTrips))?kep1SavedTrips:[],service=serviceFromTrips(saved);months.value=service.months;days.value=service.days}
      }else{months.value='';days.value=''}
    }
    document.querySelectorAll('input[name="kep"]').forEach(function(radio){radio.addEventListener('change',function(){syncTripForm();setTimeout(syncTripForm,0)})});
    syncTripForm();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
/* Keep KEP 1 / KEP 2 controls compact on every phone. */
(function(){
  function compactKepControls(){
    if(document.getElementById('compact-kep-controls'))return;var s=document.createElement('style');s.id='compact-kep-controls';s.textContent='input[type="radio"][name="kep"]{width:auto!important;min-height:0!important;height:16px!important;padding:0!important;margin:0 5px 0 0!important;border:0!important;box-sizing:border-box!important;vertical-align:middle!important}#kep1Choice>label,#kep2Choice>label{display:inline-flex!important;align-items:center!important;width:auto!important;margin:0!important;padding:0!important;font-size:16px!important;font-weight:700!important;white-space:nowrap!important}#kep1Choice,#kep2Choice{width:auto!important;box-sizing:border-box!important}';document.head.appendChild(s)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',compactKepControls);else compactKepControls();
})();
/* KEP document workflow: service eligibility is checked before documents. */
(function(){
  var bound=false, docsReady=false;
  function $(id){return document.getElementById(id)}
  function val(id){var e=$(id);return e?(e.value||'').trim():''}
  function resultText(){return (($('result')&&$('result').innerText)||'').trim()}
  function redService(t){return /δεν μπορεί να εξεταστεί|μικρότερη από την ελάχιστα απαιτούμενη|ανεπαρκή υπηρεσία/i.test(t||'')}
  function kep(){var e=document.querySelector('input[name="kep"]:checked');return e?e.value:''}
  function examiner(){return val(kep()==='1'?'examinerKep1':'examinerKep2')}
  function now(){var d=new Date();return{iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
  function records(){try{return JSON.parse(localStorage.getItem('seaServiceArchive')||'[]')}catch(e){return[]}}
  function saveRecords(a){localStorage.setItem('seaServiceArchive',JSON.stringify(a))}
  function setupDocs(){
    var s=$('documentsStatus'); if(!s)return;
    if(!Array.prototype.some.call(s.options,function(o){return o.value==='Εκκρεμότητα'})){var o=document.createElement('option');o.value='Εκκρεμότητα';o.textContent='Εκκρεμότητα';s.appendChild(o)}
    if(!docsReady){
      var grid=s.closest('.exam-grid');
      if(grid&&!$('documentsNoteWrap')){
        var lab=document.createElement('label');lab.id='documentsNoteWrap';lab.style.display='none';lab.style.gridColumn='1/-1';lab.innerHTML='Περιγραφή εκκρεμότητας<textarea id="documentsNote" rows="3" placeholder="Περιγράψτε τι εκκρεμεί και τι πρέπει να προσκομιστεί."></textarea>';grid.appendChild(lab);var ta=lab.querySelector('textarea');ta.style.cssText='width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #ccc;border-radius:8px;font:inherit;resize:vertical;min-height:80px';
      }
      s.addEventListener('change',function(){var w=$('documentsNoteWrap');if(w)w.style.display=(s.value==='Εκκρεμότητα'||s.value==='Ελλιπή')?'block':'none'});docsReady=true;
    }
    var w=$('documentsNoteWrap');if(w)w.style.display=(s.value==='Εκκρεμότητα'||s.value==='Ελλιπή')?'block':'none';
  }
  function panel(){var p=$('examinationPanel'),t=resultText();if(!p||!t)return;if(redService(t)){p.style.display='none';if($('documentsStatus'))$('documentsStatus').value='Δεν έχει ελεγχθεί';}else{p.style.display='block';setupDocs()}}
  function build(){
    var t=resultText(), red=redService(t), r=val('registryNumber'), n=val('fullName'), k=kep(), z=now();
    if(!r||!n||!t){alert('Για να καταχωρηθεί η εξέταση πρέπει να συμπληρωθούν Μητρώο, Ονοματεπώνυμο και να έχει ολοκληρωθεί ο Υπολογισμός Υπηρεσίας.');return null}
    if(red)return{id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:r,fullName:n,kep:k?'ΚΕΠ '+k:'',examiner:examiner()||'Δεν απαιτείται',documents:'Δεν απαιτείται — ανεπαρκής υπηρεσία',documentsNote:'',examinationStatus:'Δεν εξετάστηκε — ανεπαρκής υπηρεσία',grade:'Δεν βαθμολογήθηκε',finalDecision:'Απορριπτέα',result:t,success:false,trips:[]};
    if(!examiner()){alert('Πρέπει να επιλέξεις τον εξεταστή του συγκεκριμένου ΚΕΠ πριν από την καταχώριση.');return null}
    var docs=val('documentsStatus'),note=val('documentsNote');
    if(!docs||docs==='Δεν έχει ελεγχθεί'){alert('Η υπηρεσία είναι επαρκής. Πρέπει πρώτα να δηλώσεις την κατάσταση των δικαιολογητικών.');return null}
    if((docs==='Εκκρεμότητα'||docs==='Ελλιπή')&&!note){alert('Περιέγραψε την εκκρεμότητα των δικαιολογητικών πριν από την καταχώριση.');return null}
    var status=val('examinationStatus')||'Δεν εξετάστηκε',grade=val('examGrade')||'Δεν βαθμολογήθηκε',decision=val('finalDecision')||'Σε αναμονή';
    if(docs==='Ελλιπή'){status='Δεν εξετάστηκε';grade='Δεν βαθμολογήθηκε';decision='Δεν ολοκληρώθηκε λόγω ελλιπών δικαιολογητικών'}
    if(docs==='Εκκρεμότητα')decision='Σε εκκρεμότητα δικαιολογητικών';
    var extra=(docs==='Εκκρεμότητα'||docs==='Ελλιπή')?'\n\nΕκκρεμότητα δικαιολογητικών: '+note:'';
    return{id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:r,fullName:n,kep:k?'ΚΕΠ '+k:'',examiner:examiner(),documents:docs,documentsNote:note,examinationStatus:status,grade:grade,finalDecision:decision,result:t+extra,success:decision==='Επιτυχής',trips:[]};
  }
  function intercept(e){
    var b=e.target&&e.target.closest?e.target.closest('#saveArchive'):null;if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    var r=build();if(!r)return;var a=records();a.unshift(r);saveRecords(a);alert('Η εξέταση καταχωρήθηκε στο Αρχείο Εξέτασης ΚΕΠ.');
  }
  function bind(){
    panel();if(!bound){document.addEventListener('click',intercept,true);bound=true}
    var result=$('result');if(result&&!result.__docsObserver){var mo=new MutationObserver(panel);mo.observe(result,{childList:true,subtree:true,characterData:true});result.__docsObserver=true}
  }
  setInterval(bind,300);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
/* Direct no-history KEP 2 control. The legacy app.js status box must not treat
   zero recovered service as an actual KEP 1 service. */
(function(){
  function $$(id){return document.getElementById(id)}
  function registry(){return (($$('registryNumber')?.value)||'').trim()}
  function archiveKep1(){try{var a=JSON.parse(localStorage.getItem('seaServiceArchive')||'[]');if(!Array.isArray(a))return null;return a.filter(function(r){return String(r.registryNumber||'').trim()===registry()&&String(r.kep||'').trim()==='ΚΕΠ 1'}).sort(function(a,b){return Number(b.id||0)-Number(a.id||0})[0]||null}catch(e){return null}}
  function recoveredHasService(r){if(!r)return false;if(Number(r.kep1ServiceTotalDays||0)>0)return true;if(Number(r.kep1ServiceMonths||0)>0||Number(r.kep1ServiceDays||0)>0)return true;if(Array.isArray(r.trips)&&r.trips.length>0)return true;if(r.calculation&&Number(r.calculation.currentService?.totalDays||0)>0)return true;return false}
  function ensureManual(){var box=$$('directManualKep1');if(box)return box;box=document.createElement('div');box.id='directManualKep1';box.style.cssText='display:none;margin:10px 0 15px;padding:14px;background:#fff;border:1px solid #cfd5dc;border-radius:9px';box.innerHTML='<strong>Δεν υπάρχουν στοιχεία για ανάκτηση υπηρεσίας ΚΕΠ 1</strong><p style="margin:7px 0 12px">Δεν υπάρχει προηγούμενη υπηρεσία ΚΕΠ 1 στο Αρχείο. Καταχωρήστε χειροκίνητα την υπηρεσία που πρέπει να συνυπολογιστεί στο ΚΕΠ 2.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label style="font-weight:700">Μήνες<input id="directKep1Months" type="number" min="0" step="1" value="0" style="width:100%;box-sizing:border-box;margin-top:5px"></label><label style="font-weight:700">Ημέρες<input id="directKep1Days" type="number" min="0" max="29" step="1" value="0" style="width:100%;box-sizing:border-box;margin-top:5px"></label></div>';var ref=$$('kep2Section');if(ref&&ref.parentNode)ref.parentNode.insertBefore(box,ref);else document.body.appendChild(box);return box}
  function sync(){var selected=document.querySelector('input[name="kep"]:checked');var box=ensureManual();if(!selected||selected.value!=='2'){box.style.display='none';return}var r=archiveKep1();var has=recoveredHasService(r);var prev=$$('kep1PreviousService');var status=$$('kep1InputStatus');if(!has){if(prev)prev.style.display='none';if(status)status.innerHTML='';box.style.display='block';var m=$$('directKep1Months'),d=$$('directKep1Days'),hm=$$('kep1Months'),hd=$$('kep1Days');if(hm&&hm.value!=='0')hm.value='0';if(hd&&hd.value!=='0')hd.value='0';return}box.style.display='none'}
  function bind(){document.querySelectorAll('input[name="kep"]').forEach(function(r){if(r.__directNoHistory)return;r.__directNoHistory=true;r.addEventListener('change',function(){setTimeout(sync,0)})});sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();setInterval(bind,250)
})();
/* Load the unified candidate controller after app/enhancements so legacy UI handlers cannot overwrite it. */
setTimeout(function(){var s=document.createElement('script');s.src='candidate-flow.js?v=6';document.body.appendChild(s)},0);
