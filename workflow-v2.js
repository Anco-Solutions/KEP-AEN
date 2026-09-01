/* KEP workflow v2 — documents first, examination status second, automatic result */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const val=id=>(($(id)?.value)||'').trim();
  const archiveKey='seaServiceArchive';
  let initialized=false;

  function resultText(){return (($('result')?.innerText)||'').trim()}
  function insufficient(t){return /δεν μπορεί να εξεταστεί|μικρότερη από την ελάχιστα απαιτούμενη|ανεπαρκή υπηρεσία/i.test(t||'')}
  function kep(){const x=document.querySelector('input[name="kep"]:checked');return x?x.value:''}
  function examiner(){return val(kep()==='1'?'examinerKep1':'examinerKep2')}
  function now(){const d=new Date();return {iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
  function readArchive(){try{return JSON.parse(localStorage.getItem(archiveKey)||'[]')}catch(e){return[]}}
  function writeArchive(a){localStorage.setItem(archiveKey,JSON.stringify(a))}

  function makeGradeField(){
    const old=$('examGrade'); if(!old)return;
    const wrap=old.parentElement;
    old.style.display='none';
    let input=$('examGradeNumber');
    if(!input){
      input=document.createElement('input');input.id='examGradeNumber';input.type='number';input.min='0';input.max='10';input.step='0.01';input.placeholder='0,00 – 10,00';input.inputMode='decimal';
      input.style.cssText='width:100%;box-sizing:border-box;padding:10px;border:1px solid #ccc;border-radius:8px;font:inherit;display:none';
      wrap.appendChild(input);
    }
    let note=$('automaticExamResult');
    if(!note){
      note=document.createElement('div');note.id='automaticExamResult';note.style.cssText='margin-top:10px;padding:10px 12px;border-radius:8px;font-weight:700;display:none';
      wrap.appendChild(note);
    }
    return input;
  }

  function makeStatusOptions(){
    const s=$('examinationStatus');if(!s)return;
    s.innerHTML='';
    [['pending','Εκκρεμεί εξέταση'],['done','Εξετάστηκε']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.appendChild(o)});
    s.value='pending';
  }

  function removeFinalDecision(){
    const d=$('finalDecision');if(!d)return;
    const label=d.closest('label');if(label)label.style.display='none';else d.style.display='none';
  }

  function styleExamGrid(){
    const s=$('examinationStatus');if(!s)return;
    const label=s.closest('label');
    if(label){
      const title=label.firstChild;
      if(title&&title.nodeType===3)title.textContent='Κατάσταση εξέτασης ';
      label.style.fontSize='14px';
      label.style.lineHeight='1.2';
    }
  }

  function updateAutomaticResult(){
    const s=$('examinationStatus'),g=$('examGradeNumber'),note=$('automaticExamResult');
    if(!s||!g||!note)return;
    const ready=!insufficient(resultText()) && val('documentsStatus')==='Εντάξει';
    g.style.display=(ready&&s.value==='done')?'block':'none';
    note.style.display=ready&&s.value==='done'?'block':'none';
    if(!ready||s.value!=='done'){note.textContent='';return}
    const n=Number(g.value);
    if(!g.value){note.textContent='Συμπληρώστε τον βαθμό εξέτασης.';return}
    if(!Number.isFinite(n)||n<0||n>10){note.textContent='Ο βαθμός πρέπει να είναι από 0,00 έως 10,00.';return}
    if(n>=5){note.textContent='✓ Η εξέταση κρίθηκε ΕΠΙΤΥΧΗΣ';note.className='';}
    else{note.textContent='✕ Η εξέταση κρίθηκε ΑΝΕΠΙΤΥΧΗΣ';note.className='';}
  }

  function updateWorkflow(){
    const panel=$('examinationPanel'),t=resultText();if(!panel||!t)return;
    const bad=insufficient(t),docs=$('documentsStatus'),s=$('examinationStatus'),w=$('examWarning');
    makeGradeField();makeStatusOptions();removeFinalDecision();styleExamGrid();
    if(bad){
      panel.style.display='none';
      if(docs)docs.value='Δεν έχει ελεγχθεί';
      return;
    }
    panel.style.display='block';
    if(docs){
      if(!Array.from(docs.options).some(o=>o.value==='Εκκρεμότητα')){const o=document.createElement('option');o.value='Εκκρεμότητα';o.textContent='Εκκρεμότητα';docs.appendChild(o)}
    }
    if(s){
      const ok=val('documentsStatus')==='Εντάξει';
      s.disabled=!ok;
      if(!ok)s.value='pending';
    }
    const g=$('examGradeNumber');
    if(g)g.style.display=(val('documentsStatus')==='Εντάξει'&&s&&s.value==='done')?'block':'none';
    if(w){
      if(docs&&docs.value==='Ελλιπή'){w.style.display='block';w.textContent='Τα δικαιολογητικά είναι ελλιπή. Η εξέταση δεν προχωρά.'}
      else if(docs&&docs.value==='Εκκρεμότητα'){w.style.display='block';w.textContent='Υπάρχει εκκρεμότητα στα δικαιολογητικά. Η εξέταση δεν προχωρά μέχρι να τακτοποιηθεί.'}
      else w.style.display='none';
    }
    updateAutomaticResult();
  }

  function ensureDocumentNote(){
    const s=$('documentsStatus');if(!s)return;
    if(!Array.from(s.options).some(o=>o.value==='Εκκρεμότητα')){const o=document.createElement('option');o.value='Εκκρεμότητα';o.textContent='Εκκρεμότητα';s.appendChild(o)}
    const grid=s.closest('.exam-grid');if(!grid)return;
    let wrap=$('documentsNoteWrap');
    if(!wrap){
      wrap=document.createElement('label');wrap.id='documentsNoteWrap';wrap.style.cssText='display:none;grid-column:1/-1';
      wrap.innerHTML='Παρατήρηση / εκκρεμότητα<textarea id="documentsNote" rows="3" placeholder="Περιγράψτε τι βρέθηκε ή τι εκκρεμεί."></textarea>';
      grid.appendChild(wrap);
      const ta=wrap.querySelector('textarea');ta.style.cssText='width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #ccc;border-radius:8px;font:inherit;resize:vertical;min-height:80px';
    }
    wrap.style.display=(s.value==='Εκκρεμότητα'||s.value==='Ελλιπή')?'block':'none';
  }

  function buildRecord(){
    const t=resultText(),bad=insufficient(t),docs=val('documentsStatus'),s=$('examinationStatus'),gradeInput=$('examGradeNumber');
    const registry=val('registryNumber'),name=val('fullName'),k=kep(),ex=examiner();
    if(!registry||!name||!t)return null;
    const z=now();
    if(bad)return {id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:registry,fullName:name,kep:k?'ΚΕΠ '+k:'',examiner:ex||'Δεν απαιτείται',documents:'Δεν ελέγχθηκαν — ανεπαρκής υπηρεσία',documentsNote:'',examinationStatus:'Δεν εξετάστηκε — ανεπαρκής υπηρεσία',grade:'Δεν βαθμολογήθηκε',finalDecision:'Δεν εξετάστηκε λόγω ανεπαρκούς υπηρεσίας',result:t,success:false,trips:Array.isArray(window.trips)?window.trips:[]};
    if(!ex){alert('Πρέπει να επιλέξετε τον εξεταστή του συγκεκριμένου ΚΕΠ.');return null}
    if(!docs||docs==='Δεν έχει ελεγχθεί'){alert('Πρέπει πρώτα να δηλώσετε την κατάσταση των δικαιολογητικών.');return null}
    const note=val('documentsNote');
    if((docs==='Εκκρεμότητα'||docs==='Ελλιπή')&&!note){alert('Παρακαλώ καταγράψτε την παρατήρηση ή την εκκρεμότητα των δικαιολογητικών.');return null}
    if(docs!=='Εντάξει')return {id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:registry,fullName:name,kep:k?'ΚΕΠ '+k:'',examiner:ex,documents:docs,documentsNote:note,examinationStatus:'Εκκρεμεί εξέταση',grade:'Δεν βαθμολογήθηκε',finalDecision:'Εκκρεμεί εξέταση',result:t+'\n\nΠαρατήρηση δικαιολογητικών: '+note,success:false,trips:Array.isArray(window.trips)?window.trips:[]};
    const status=s&&s.value==='done'?'Εξετάστηκε':'Εκκρεμεί εξέταση';
    let grade='Δεν βαθμολογήθηκε',decision='Εκκρεμεί εξέταση',success=false;
    if(status==='Εξετάστηκε'){
      const n=Number(gradeInput?.value);if(!Number.isFinite(n)||n<0||n>10){alert('Συμπληρώστε έγκυρο βαθμό εξέτασης από 0,00 έως 10,00.');return null}
      grade=n.toFixed(2);success=n>=5;decision=success?'Επιτυχής':'Ανεπιτυχής';
    }
    return {id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:registry,fullName:name,kep:k?'ΚΕΠ '+k:'',examiner:ex,documents:'Εντάξει',documentsNote:'',examinationStatus:status,grade:grade,finalDecision:decision,result:t,success:success,trips:Array.isArray(window.trips)?window.trips:[]};
  }

  function intercept(e){
    const b=e.target&&e.target.closest?e.target.closest('#saveArchive'):null;if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const r=buildRecord();if(!r)return;
    const a=readArchive();a.unshift(r);writeArchive(a);
    alert('Η εξέταση καταχωρήθηκε στο Αρχείο Εξέτασης ΚΕΠ.');
  }

  function init(){
    if(initialized)return;initialized=true;
    const docs=$('documentsStatus'),s=$('examinationStatus'),g=$('examGradeNumber');
    if(docs)docs.addEventListener('change',function(){ensureDocumentNote();updateWorkflow()});
    if(s)s.addEventListener('change',updateAutomaticResult);
    if(g)g.addEventListener('input',updateAutomaticResult);
    document.addEventListener('click',intercept,true);
    const result=$('result');
    if(result){const mo=new MutationObserver(updateWorkflow);mo.observe(result,{childList:true,subtree:true,characterData:true})}
    setInterval(function(){ensureDocumentNote();updateWorkflow()},500);
    ensureDocumentNote();updateWorkflow();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
