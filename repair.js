document.write('<script src="structured-result.js?v=1"><\/script>');
/* KEP2 visible Months/Days UI is owned by candidate-flow.js. */
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
/* Load the unified candidate controller after app/enhancements so it owns the KEP2 visible service UI. */
setTimeout(function(){var s=document.createElement('script');s.src='candidate-flow.js?v=7';document.body.appendChild(s)},0);
