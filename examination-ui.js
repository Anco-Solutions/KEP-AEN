(function(){
'use strict';
function $(id){return document.getElementById(id)}
function v(id){var e=$(id);return e?String(e.value||'').trim():''}
function set(id,value){var e=$(id);if(e){e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}))}}
function resultText(){var r=$('result');return r?String(r.innerText||r.textContent||'').replace(/\s+/g,' ').trim():''}
function selectedKep(){var r=document.querySelector('input[name="kep"]:checked');return r?r.value:''}
function serviceEligible(){var t=resultText();return !!t&&/μπορεί να εξεταστεί|υπηρεσία .* επαρκής/i.test(t)&&!/δεν μπορεί να εξεταστεί|ανεπαρκή υπηρεσία/i.test(t)}
function placeAfterResult(){var p=$('examinationPanel'),r=$('result');if(p&&r&&p.parentNode&&r.parentNode===p.parentNode&&p.previousElementSibling!==r)r.parentNode.insertBefore(p,r.nextSibling)}
function build(){
  var p=$('examinationPanel');
  if(!p||p.__cleanExamUI)return;
  var docs=$('documentsStatus'), exam=$('examinationStatus'), grade=$('examGrade'), decision=$('finalDecision');
  if(!docs||!exam||!grade||!decision)return;
  p.__cleanExamUI=true;
  docs.style.display='none'; exam.style.display='none'; grade.style.display='none'; decision.style.display='none';
  var grid=p.querySelector('.exam-grid');
  if(!grid)return;
  grid.innerHTML='';
  var style=document.createElement('style');style.id='clean-exam-ui-style';style.textContent=`
    #examinationPanel .exam-grid{display:block}
    .clean-exam-block{margin:0 0 18px}
    .clean-exam-title{display:block;font-weight:800;font-size:16px;margin:0 0 9px}
    .clean-exam-options{display:flex;gap:18px;flex-wrap:wrap}
    .clean-exam-option{display:inline-flex!important;align-items:center!important;gap:7px!important;font-weight:600!important;width:auto!important;margin:0!important;padding:0!important}
    .clean-exam-option input{width:18px!important;height:18px!important;min-height:0!important;margin:0!important;padding:0!important}
    .clean-exam-result{margin-top:8px;padding:10px 12px;border-radius:8px;background:#f5f7fa;font-weight:800;display:none}
    .clean-exam-note{margin-top:8px;font-size:13px;color:#666}
    .clean-exam-grade{display:none;margin-top:4px}
    .clean-exam-grade input{width:130px!important;box-sizing:border-box!important;padding:10px!important;border:1px solid #c8ced6!important;border-radius:8px!important;font:inherit!important;font-weight:700!important}
    .clean-exam-decision{margin-top:8px;padding:11px 13px;border-radius:8px;font-weight:800;display:none}
    .clean-exam-decision.ok{background:#eef9f0;border:1px solid #a8d5ad}
    .clean-exam-decision.pending{background:#fff8e8;border:1px solid #e6c76a}
    .clean-exam-decision.bad{background:#fff0f0;border:1px solid #e1aaaa;color:#9b1c1c}
  `;document.head.appendChild(style);
  function block(title){var b=document.createElement('div');b.className='clean-exam-block';var h=document.createElement('div');h.className='clean-exam-title';h.textContent=title;b.appendChild(h);return b}
  function option(name,label,value,checked){var l=document.createElement('label');l.className='clean-exam-option';var r=document.createElement('input');r.type='radio';r.name=name;r.value=value;r.checked=!!checked;l.appendChild(r);l.appendChild(document.createTextNode(label));return l}
  var b1=block('Δικαιολογητικά'),o1=document.createElement('div');o1.className='clean-exam-options';
  o1.appendChild(option('cleanDocs','Δεν έχουν ελεγχθεί','Δεν έχουν ελεγχθεί',v('documentsStatus')==='Δεν έχουν ελεγχθεί'));
  o1.appendChild(option('cleanDocs','Πλήρη','Πλήρη',v('documentsStatus')==='Πλήρη'));
  o1.appendChild(option('cleanDocs','Ελλιπή','Ελλιπή',v('documentsStatus')==='Ελλιπή'));
  b1.appendChild(o1);grid.appendChild(b1);
  var b2=block('Εξέταση'),o2=document.createElement('div');o2.className='clean-exam-options';
  o2.appendChild(option('cleanExam','Εκκρεμεί','Εκκρεμεί',v('examinationStatus')==='Εκκρεμεί'||v('examinationStatus')==='Σε εκκρεμότητα'));
  o2.appendChild(option('cleanExam','Ολοκληρώθηκε','Ολοκληρώθηκε',v('examinationStatus')==='Ολοκληρώθηκε'||v('examinationStatus')==='Πραγματοποιήθηκε'));
  b2.appendChild(o2);grid.appendChild(b2);
  var b3=block('Βαθμός εξέτασης'),gwrap=document.createElement('div');gwrap.className='clean-exam-grade';
  var gi=document.createElement('input');gi.type='number';gi.min='0';gi.max='10';gi.step='0.01';gi.inputMode='decimal';gi.placeholder='0,00';gi.setAttribute('aria-label','Βαθμός εξέτασης');gwrap.appendChild(gi);
  var gres=document.createElement('div');gres.className='clean-exam-result';gwrap.appendChild(gres);b3.appendChild(gwrap);grid.appendChild(b3);
  var b4=block('Τελική απόφαση'),dres=document.createElement('div');dres.className='clean-exam-decision';b4.appendChild(dres);grid.appendChild(b4);
  var note=p.querySelector('.exam-note');if(note)note.textContent='Καλώς 5,00–6,49 · Λίαν Καλώς 6,50–8,49 · Άριστα 8,50–10,00 · κάτω από 5,00: Ανεπιτυχής.';
  var docsRadios=o1.querySelectorAll('input'),examRadios=o2.querySelectorAll('input');
  function updateDecision(n){
    var d=document.querySelector('input[name="cleanDocs"]:checked')?.value||'';
    var ex=document.querySelector('input[name="cleanExam"]:checked')?.value||'';
    dres.className='clean-exam-decision';dres.style.display='none';
    if(ex!=='Ολοκληρώθηκε'||!Number.isFinite(n)){set('finalDecision','');return}
    if(n<5){dres.textContent='Η εξέταση του ΚΕΠ ολοκληρώθηκε — Ανεπιτυχής.';dres.classList.add('bad');dres.style.display='block';set('finalDecision','Ανεπιτυχής');return}
    if(d==='Πλήρη'){dres.textContent='Η εξέταση του ΚΕΠ ολοκληρώθηκε με επιτυχία.';dres.classList.add('ok');dres.style.display='block';set('finalDecision','Επιτυχής');return}
    if(d==='Ελλιπή'){dres.textContent='Η εξέταση του ΚΕΠ ολοκληρώθηκε με επιτυχία, αλλά υπάρχει εκκρεμότητα στα δικαιολογητικά.';dres.classList.add('bad');dres.style.display='block';set('finalDecision','Επιτυχής — υπάρχει εκκρεμότητα στα δικαιολογητικά');return}
    dres.textContent='Η εξέταση του ΚΕΠ ολοκληρώθηκε με επιτυχία, αλλά εκκρεμεί ο έλεγχος των δικαιολογητικών.';dres.classList.add('pending');dres.style.display='block';set('finalDecision','Επιτυχής — εκκρεμεί ο έλεγχος δικαιολογητικών');
  }
  function updateGrade(){
    var n=parseFloat(String(gi.value).replace(',','.'));
    if(!Number.isFinite(n)||n<0||n>10){gres.style.display='none';set('examGrade','Δεν βαθμολογήθηκε');dres.style.display='none';set('finalDecision','');return}
    var label=n<5?'Ανεπιτυχής':n<6.5?'Καλώς — Επιτυχής':n<8.5?'Λίαν Καλώς — Επιτυχής':'Άριστα — Επιτυχής';
    gres.textContent=label;gres.style.display='block';set('examGrade',n.toFixed(2).replace('.',','));updateDecision(n);
  }
  function sync(){
    var d=document.querySelector('input[name="cleanDocs"]:checked')?.value||'';
    var ex=document.querySelector('input[name="cleanExam"]:checked')?.value||'';
    set('documentsStatus',d||'Δεν έχουν ελεγχθεί');
    set('examinationStatus',ex||'Εκκρεμεί');
    b2.style.display='block';
    b3.style.display=ex==='Ολοκληρώθηκε'?'block':'none';
    if(ex!=='Ολοκληρώθηκε'){gi.value='';gres.style.display='none';set('examGrade','Δεν βαθμολογήθηκε');dres.style.display='none';set('finalDecision','');return}
    var n=parseFloat(String(gi.value).replace(',','.'));
    if(Number.isFinite(n)&&n>=0&&n<=10)updateGrade();else{set('examGrade','Δεν βαθμολογήθηκε');dres.style.display='none';set('finalDecision','')}
  }
  docsRadios.forEach(function(r){r.addEventListener('change',sync)});
  examRadios.forEach(function(r){r.addEventListener('change',sync)});
  gi.addEventListener('input',updateGrade);
  p.__cleanExamSync=sync;p.__cleanExamGrade=gi;sync();
}
function syncVisibility(){var p=$('examinationPanel');if(!p)return;placeAfterResult();if(selectedKep()&&serviceEligible()){p.style.display='block';if(typeof p.__cleanExamSync==='function')p.__cleanExamSync()}else p.style.display='none'}
function boot(){build();placeAfterResult();setTimeout(function(){build();placeAfterResult()},100);setTimeout(placeAfterResult,500);setTimeout(syncVisibility,150);setTimeout(syncVisibility,600);setTimeout(syncVisibility,1200);var r=$('result');if(r&&!r.__cleanExamObserver){var mo=new MutationObserver(function(){setTimeout(syncVisibility,0)});mo.observe(r,{childList:true,subtree:true,characterData:true});r.__cleanExamObserver=true}document.querySelectorAll('input[name="kep"]').forEach(function(x){if(!x.__cleanKepBound){x.__cleanKepBound=true;x.addEventListener('change',function(){setTimeout(syncVisibility,50);setTimeout(syncVisibility,300)})}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* Final UI guard: the examination block must physically sit immediately below the green service result. */
(function(){
'use strict';
function guard(){
  var p=document.getElementById('examinationPanel');
  var r=document.getElementById('result');
  if(!p||!r||!r.parentNode)return;
  var t=String(r.innerText||r.textContent||'').replace(/\s+/g,' ').trim();
  var kep=document.querySelector('input[name="kep"]:checked');
  var eligible=!!kep&&/μπορεί να εξεταστεί|υπηρεσία .* επαρκής/i.test(t)&&!/δεν μπορεί να εξεταστεί|ανεπαρκή υπηρεσία/i.test(t);
  if(p.parentNode!==r.parentNode||p.previousElementSibling!==r)r.parentNode.insertBefore(p,r.nextSibling);
  if(eligible)p.style.display='block';
  else if(!kep||/δεν μπορεί να εξεταστεί|ανεπαρκή υπηρεσία/i.test(t))p.style.display='none';
  if(typeof p.__cleanExamSync==='function'&&eligible)p.__cleanExamSync();
}
function boot(){guard();var r=document.getElementById('result');if(r&&!r.__examGuardObserver){new MutationObserver(function(){setTimeout(guard,0)}).observe(r,{childList:true,subtree:true,characterData:true});r.__examGuardObserver=true}document.querySelectorAll('input[name="kep"]').forEach(function(x){x.addEventListener('change',function(){setTimeout(guard,0);setTimeout(guard,250)})});setTimeout(guard,500);setTimeout(guard,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();