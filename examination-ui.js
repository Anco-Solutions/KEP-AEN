(function(){
'use strict';
function $(id){return document.getElementById(id)}
function v(id){var e=$(id);return e?String(e.value||'').trim():''}
function set(id,value){var e=$(id);if(e){e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}))}}
function eligible(){var p=$('examinationPanel');return p&&p.style.display!=='none'}
function build(){
  var p=$('examinationPanel');
  if(!p||p.__cleanExamUI)return;
  p.__cleanExamUI=true;
  var docs=$('documentsStatus'), exam=$('examinationStatus'), grade=$('examGrade'), decision=$('finalDecision');
  if(!docs||!exam||!grade||!decision)return;
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
    .clean-exam-status{margin-top:8px;font-weight:700}
  `;document.head.appendChild(style);
  function block(title){var b=document.createElement('div');b.className='clean-exam-block';var h=document.createElement('div');h.className='clean-exam-title';h.textContent=title;b.appendChild(h);return b}
  function option(name,label,value,checked){var l=document.createElement('label');l.className='clean-exam-option';var r=document.createElement('input');r.type='radio';r.name=name;r.value=value;r.checked=!!checked;l.appendChild(r);l.appendChild(document.createTextNode(label));return l}
  var b1=block('Δικαιολογητικά'),o1=document.createElement('div');o1.className='clean-exam-options';o1.appendChild(option('cleanDocs','Πλήρη','Πλήρη',v('documentsStatus')==='Πλήρη'));o1.appendChild(option('cleanDocs','Ελλιπή','Ελλιπή',v('documentsStatus')==='Ελλιπή'));b1.appendChild(o1);var dnote=document.createElement('div');dnote.className='clean-exam-note';dnote.style.display='none';dnote.textContent='Απαιτείται επανυποβολή των ελλιπών δικαιολογητικών.';b1.appendChild(dnote);grid.appendChild(b1);
  var b2=block('Εξέταση'),o2=document.createElement('div');o2.className='clean-exam-options';o2.appendChild(option('cleanExam','Πραγματοποιήθηκε','Πραγματοποιήθηκε',v('examinationStatus')==='Πραγματοποιήθηκε'));o2.appendChild(option('cleanExam','Δεν πραγματοποιήθηκε','Δεν πραγματοποιήθηκε',v('examinationStatus')==='Δεν πραγματοποιήθηκε'));b2.appendChild(o2);grid.appendChild(b2);
  var b3=block('Συμπλήρωση ΚΕΠ'),o3=document.createElement('div');o3.className='clean-exam-options';o3.appendChild(option('cleanFill','Πλήρης','Πλήρης',false));o3.appendChild(option('cleanFill','Ελλιπής','Ελλιπής',false));b3.appendChild(o3);grid.appendChild(b3);
  var b4=block('Βαθμολογία'),gwrap=document.createElement('div');gwrap.className='clean-exam-grade';var gi=document.createElement('input');gi.type='number';gi.min='0';gi.max='10';gi.step='0.01';gi.inputMode='decimal';gi.placeholder='0,00';gi.setAttribute('aria-label','Βαθμολογία');gwrap.appendChild(gi);var gres=document.createElement('div');gres.className='clean-exam-result';gwrap.appendChild(gres);b4.appendChild(gwrap);grid.appendChild(b4);
  var note=p.querySelector('.exam-note');if(note)note.textContent='Καλώς 5,00–6,49 · Λίαν Καλώς 6,50–8,49 · Άριστα 8,50–10,00 · κάτω από 5,00: Ανεπιτυχής.';
  var fillRadios=o3.querySelectorAll('input'), examRadios=o2.querySelectorAll('input'), docsRadios=o1.querySelectorAll('input');
  function updateGrade(){var n=parseFloat(String(gi.value).replace(',','.'));if(!Number.isFinite(n)||n<0||n>10){gres.style.display='none';set('examGrade','Δεν βαθμολογήθηκε');set('finalDecision','');return}var label=n<5?'Ανεπιτυχής':n<6.5?'Καλώς — Επιτυχής':n<8.5?'Λίαν Καλώς — Επιτυχής':'Άριστα — Επιτυχής';gres.textContent=label;gres.style.display='block';set('examGrade',n.toFixed(2).replace('.',','));set('finalDecision',n>=5?'Επιτυχής':'Ανεπιτυχής')}
  function sync(){
    var d=document.querySelector('input[name="cleanDocs"]:checked')?.value||'';set('documentsStatus',d);
    var ex=document.querySelector('input[name="cleanExam"]:checked')?.value||'';set('examinationStatus',ex);
    var fill=document.querySelector('input[name="cleanFill"]:checked')?.value||'';
    dnote.style.display=d==='Ελλιπή'?'block':'none';
    var allowed=d==='Πλήρη';b2.style.display=allowed?'block':'none';
    if(!allowed){b3.style.display='none';b4.style.display='none';set('examinationStatus','');set('examGrade','Δεν βαθμολογήθηκε');set('finalDecision','');return}
    if(ex==='Πραγματοποιήθηκε'){b3.style.display='block';var f=fill; b4.style.display=f==='Πλήρης'?'block':'none'; if(f!=='Πλήρης'){set('examGrade','Δεν βαθμολογήθηκε');set('finalDecision','')} else updateGrade();}
    else {b3.style.display='none';b4.style.display='none';set('examGrade','Δεν βαθμολογήθηκε');set('finalDecision','')}
  }
  docsRadios.forEach(function(r){r.addEventListener('change',sync)});examRadios.forEach(function(r){r.addEventListener('change',sync)});fillRadios.forEach(function(r){r.addEventListener('change',sync)});gi.addEventListener('input',updateGrade);
  var observer=new MutationObserver(function(){if(eligible())sync()});observer.observe(p,{attributes:true,attributeFilter:['style']});p.__cleanExamSync=sync;p.__cleanExamGrade=gi;
  sync();
}
function boot(){build();setTimeout(build,100);setTimeout(build,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
