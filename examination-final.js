(function(){
'use strict';
function init(){
  var p=document.getElementById('examinationPanel');
  var result=document.getElementById('result');
  if(!p)return;
  var grid=p.querySelector('.exam-grid');
  if(!grid)return;
  grid.innerHTML='';
  var old=document.getElementById('examFinalStyle');
  if(!old){old=document.createElement('style');old.id='examFinalStyle';old.textContent='#examinationPanel .exam-grid{display:block}.final-exam-block{margin:0 0 18px}.final-exam-title{font-weight:800;font-size:16px;margin-bottom:9px}.final-exam-options{display:flex;gap:18px;flex-wrap:wrap}.final-exam-option{display:inline-flex!important;align-items:center!important;gap:7px!important;width:auto!important;margin:0!important;padding:0!important;font-weight:600!important}.final-exam-option input{width:18px!important;height:18px!important;min-height:0!important;margin:0!important}.final-grade{display:none}.final-grade input{width:130px!important;padding:10px!important;border:1px solid #c8ced6!important;border-radius:8px!important;font:inherit!important;font-weight:700!important}.final-grade-result{margin-top:8px;padding:10px 12px;border-radius:8px;background:#f5f7fa;font-weight:800;display:none}.final-decision{display:none;margin-top:8px;padding:11px 13px;border-radius:8px;font-weight:800}.final-decision.ok{background:#eef9f0;border:1px solid #a8d5ad}.final-decision.pending{background:#fff8e8;border:1px solid #e6c76a}.final-decision.bad{background:#fff0f0;border:1px solid #e1aaaa;color:#9b1c1c}';document.head.appendChild(old)}
  function block(title){var b=document.createElement('div');b.className='final-exam-block';var h=document.createElement('div');h.className='final-exam-title';h.textContent=title;b.appendChild(h);return b}
  function radio(name,label,value){var l=document.createElement('label');l.className='final-exam-option';var i=document.createElement('input');i.type='radio';i.name=name;i.value=value;l.appendChild(i);l.appendChild(document.createTextNode(label));return l}
  var docsBlock=block('Δικαιολογητικά'),docsOpts=document.createElement('div');docsOpts.className='final-exam-options';
  ['Δεν έχουν ελεγχθεί','Πλήρη','Ελλιπή'].forEach(function(x){docsOpts.appendChild(radio('finalDocs',x,x))});docsBlock.appendChild(docsOpts);grid.appendChild(docsBlock);
  var examBlock=block('Εξέταση'),examOpts=document.createElement('div');examOpts.className='final-exam-options';
  ['Εκκρεμεί','Ολοκληρώθηκε'].forEach(function(x){examOpts.appendChild(radio('finalExam',x,x))});examBlock.appendChild(examOpts);grid.appendChild(examBlock);
  var gradeBlock=block('Βαθμός εξέτασης'),gradeWrap=document.createElement('div');gradeWrap.className='final-grade';var input=document.createElement('input');input.type='number';input.min='0';input.max='10';input.step='0.01';input.inputMode='decimal';input.placeholder='0,00';gradeWrap.appendChild(input);var gradeResult=document.createElement('div');gradeResult.className='final-grade-result';gradeWrap.appendChild(gradeResult);gradeBlock.appendChild(gradeWrap);grid.appendChild(gradeBlock);
  var decisionBlock=block('Τελική απόφαση'),decision=document.createElement('div');decision.className='final-decision';decisionBlock.appendChild(decision);grid.appendChild(decisionBlock);
  function setHidden(id,val){var e=document.getElementById(id);if(e)e.value=val}
  function calc(){
    var d=document.querySelector('input[name="finalDocs"]:checked');var ex=document.querySelector('input[name="finalExam"]:checked');
    setHidden('documentsStatus',d?d.value:'Δεν έχουν ελεγχθεί');setHidden('examinationStatus',ex?ex.value:'Εκκρεμεί');
    gradeWrap.style.display=ex&&ex.value==='Ολοκληρώθηκε'?'block':'none';decision.style.display='none';gradeResult.style.display='none';
    if(!ex||ex.value!=='Ολοκληρώθηκε'){setHidden('examGrade','Δεν βαθμολογήθηκε');setHidden('finalDecision','Σε αναμονή');return}
    var n=parseFloat(String(input.value).replace(',','.'));
    if(!Number.isFinite(n)||n<0||n>10){setHidden('examGrade','Δεν βαθμολογήθηκε');setHidden('finalDecision','Σε αναμονή');return}
    var label=n<5?'Ανεπιτυχής':n<6.5?'Καλώς — Επιτυχής':n<8.5?'Λίαν Καλώς — Επιτυχής':'Άριστα — Επιτυχής';
    gradeResult.textContent=label;gradeResult.style.display='block';setHidden('examGrade',n.toFixed(2).replace('.',','));decision.className='final-decision';
    if(n<5){decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΑΠΟΡΡΙΠΤΕΑ';decision.classList.add('bad');setHidden('finalDecision','ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΑΠΟΡΡΙΠΤΕΑ');}
    else if(d&&d.value==='Πλήρη'){decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ';decision.classList.add('ok');setHidden('finalDecision','ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ');}
    else if(d&&d.value==='Ελλιπή'){decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ — Εκκρεμότητα δικαιολογητικών';decision.classList.add('pending');setHidden('finalDecision','ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ — Εκκρεμότητα δικαιολογητικών');}
    else {decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ — Εκκρεμεί ο έλεγχος δικαιολογητικών';decision.classList.add('pending');setHidden('finalDecision','ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ — Εκκρεμεί ο έλεγχος δικαιολογητικών');}
    decision.style.display='block';
  }
  grid.querySelectorAll('input[name="finalDocs"],input[name="finalExam"]').forEach(function(i){i.addEventListener('change',calc)});input.addEventListener('input',calc);calc();
  function place(){if(result&&result.parentNode&&(p.parentNode!==result.parentNode||p.previousElementSibling!==result))result.parentNode.insertBefore(p,result.nextSibling)}
  function eligible(){var t=String(result?result.innerText||result.textContent:'').replace(/\s+/g,' ');return /μπορεί να εξεταστεί|υπηρεσία .* επαρκής/i.test(t)&&!/δεν μπορεί να εξεταστεί|ανεπαρκή υπηρεσία/i.test(t)}
  function sync(){place();var k=document.querySelector('input[name="kep"]:checked');p.style.display=k&&eligible()?'block':'none'}
  sync();if(result&&!result.__finalExamObs){new MutationObserver(function(){setTimeout(sync,0)}).observe(result,{childList:true,subtree:true,characterData:true});result.__finalExamObs=true}document.querySelectorAll('input[name="kep"]').forEach(function(i){i.addEventListener('change',function(){setTimeout(sync,50)})});[100,300,700,1200,2000].forEach(function(ms){setTimeout(sync,ms)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
