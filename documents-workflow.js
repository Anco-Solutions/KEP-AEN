/* KEP document workflow UI: documents are checked only after green service. */
(function(){
  function ready(){
    var docs=document.getElementById('documentsStatus');
    var status=document.getElementById('examinationStatus');
    var grade=document.getElementById('examGrade');
    var decision=document.getElementById('finalDecision');
    var note=document.getElementById('documentsNote');
    var noteWrap=document.getElementById('documentsNoteWrap');
    if(!docs)return;
    function sync(){
      var v=docs.value;
      var blocked=v==='Ελλιπή'||v==='Εκκρεμότητα';
      if(noteWrap)noteWrap.style.display=blocked?'block':'none';
      if(note){note.placeholder=v==='Ελλιπή'?'Περιγράψτε ποια δικαιολογητικά είναι ελλιπή και τι πρέπει να προσκομιστεί.':'Περιγράψτε ποια δικαιολογητικά εκκρεμούν και τι πρέπει να προσκομιστεί.';}
      [status,grade,decision].forEach(function(el){if(!el)return;el.disabled=blocked;el.style.opacity=blocked?'.55':'';});
      if(blocked){
        if(status)status.value='Δεν εξετάστηκε';
        if(grade)grade.value='Δεν βαθμολογήθηκε';
        if(decision)decision.value=v==='Ελλιπή'?'Δεν ολοκληρώθηκε λόγω ελλιπών δικαιολογητικών':'Σε εκκρεμότητα δικαιολογητικών';
      }
    }
    docs.addEventListener('change',sync);
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
