/* KEP workflow v2 — documents first, examination status second, automatic result */
(function(){
'use strict';
const $=id=>document.getElementById(id), val=id=>(($(id)?.value)||'').trim();
const archiveKey='seaServiceArchive';
function resultText(){return (($('result')?.innerText)||'').trim()}
function insufficient(t){return /δεν μπορεί να εξεταστεί|μικρότερη από την ελάχιστα απαιτούμενη|ανεπαρκή υπηρεσία/i.test(t||'')}
function kep(){const x=document.querySelector('input[name="kep"]:checked');return x?x.value:''}
function examiner(){return val(kep()==='1'?'examinerKep1':'examinerKep2')}
function now(){const d=new Date();return{iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
function readArchive(){try{return JSON.parse(localStorage.getItem(archiveKey)||'[]')}catch(e){return[]}}
function writeArchive(a){localStorage.setItem(archiveKey,JSON.stringify(a))}
function ensureFields(){
 const old=$('examGrade');if(!old)return null;const wrap=old.parentElement;old.style.display='none';
 let g=$('examGradeNumber');if(!g){g=document.createElement('input');g.id='examGradeNumber';g.type='number';g.min='0';g.max='10';g.step='0.01';g.placeholder='0,00 – 10,00';g.inputMode='decimal';g.style.cssText='width:100%;box-sizing:border-box;padding:10px;border:1px solid #ccc;border-radius:8px;font:inherit;display:none';wrap.appendChild(g)}
 let n=$('automaticExamResult');if(!n){n=document.createElement('div');n.id='automaticExamResult';n.style.cssText='margin-top:10px;padding:10px 12px;border-radius:8px;font-weight:700;display:none';wrap.appendChild(n)}
 return g;
}
function statusOptions(){
 const s=$('examinationStatus');if(!s)return;
 const current=s.value==='done'?'done':'pending';
 if(s.dataset.v2==='1'){s.value=current;return}
 s.innerHTML='<option value="pending">Εκκρεμεί εξέταση</option><option value="done">Εξετάστηκε</option>';
 s.dataset.v2='1';s.value=current;
}
function hideFinal(){const d=$('finalDecision');if(!d)return;const l=d.closest('label');if(l)l.style.display='none';else d.style.display='none'}
function noteField(){
 const s=$('documentsStatus');if(!s)return;const grid=s.closest('.exam-grid');if(!grid)return;
 if(!Array.from(s.options).some(o=>o.value==='Εκκρεμότητα')){const o=document.createElement('option');o.value='Εκκρεμότητα';o.textContent='Εκκρεμότητα';s.appendChild(o)}
 let w=$('documentsNoteWrap');if(!w){w=document.createElement('label');w.id='documentsNoteWrap';w.style.cssText='display:none;grid-column:1/-1';w.innerHTML='Παρατήρηση / εκκρεμότητα<textarea id="documentsNote" rows="3" placeholder="Περιγράψτε τι βρέθηκε ή τι εκκρεμεί."></textarea>';grid.appendChild(w);w.querySelector('textarea').style.cssText='width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #ccc;border-radius:8px;font:inherit;resize:vertical;min-height:80px'}
 w.style.display=(s.value==='Εκκρεμότητα'||s.value==='Ελλιπή')?'block':'none';
}
function refresh(){
 const p=$('examinationPanel'),t=resultText();if(!p||!t)return;const bad=insufficient(t),docs=$('documentsStatus'),s=$('examinationStatus'),w=$('examWarning');
 if(bad){p.style.display='none';if(docs)docs.value='Δεν έχει ελεγχθεί';return}
 p.style.display='block';noteField();statusOptions();hideFinal();
 const ok=val('documentsStatus')==='Εντάξει';if(s){s.disabled=!ok;if(!ok)s.value='pending'}
 const g=ensureFields();if(g){const show=ok&&s&&s.value==='done';g.style.setProperty('display',show?'block':'none','important');g.parentElement.style.display='block'}
 if(w){if(docs&&docs.value==='Ελλιπή'){w.style.display='block';w.textContent='Τα δικαιολογητικά είναι ελλιπή. Η εξέταση δεν προχωρά.'}else if(docs&&docs.value==='Εκκρεμότητα'){w.style.display='block';w.textContent='Υπάρχει εκκρεμότητα στα δικαιολογητικά. Η εξέταση δεν προχωρά μέχρι να τακτοποιηθεί.'}else w.style.display='none'}
 const n=$('automaticExamResult');if(n){const show=ok&&s&&s.value==='done';n.style.display=show?'block':'none';if(show){const x=Number(g?.value);n.textContent=!g?.value?'Συμπληρώστε τον βαθμό εξέτασης.':(!Number.isFinite(x)||x<0||x>10?'Ο βαθμός πρέπει να είναι από 0,00 έως 10,00.':x>=5?'✓ Η εξέταση κρίθηκε ΕΠΙΤΥΧΗΣ':'✕ Η εξέταση κρίθηκε ΑΝΕΠΙΤΥΧΗΣ')}}
}
function buildRecord(){
 const t=resultText(),bad=insufficient(t),docs=val('documentsStatus'),s=$('examinationStatus'),g=$('examGradeNumber'),r=val('registryNumber'),name=val('fullName'),k=kep(),ex=examiner();if(!r||!name||!t)return null;const z=now();
 if(bad)return{id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:r,fullName:name,kep:k?'ΚΕΠ '+k:'',examiner:ex||'Δεν απαιτείται',documents:'Δεν ελέγχθηκαν — ανεπαρκής υπηρεσία',documentsNote:'',examinationStatus:'Δεν εξετάστηκε — ανεπαρκής υπηρεσία',grade:'Δεν βαθμολογήθηκε',finalDecision:'Δεν εξετάστηκε λόγω ανεπαρκούς υπηρεσίας',result:t,success:false,trips:Array.isArray(window.trips)?window.trips:[]};
 if(!ex){alert('Πρέπει να επιλέξετε τον εξεταστή του συγκεκριμένου ΚΕΠ.');return null}
 if(!docs||docs==='Δεν έχει ελεγχθεί'){alert('Πρέπει πρώτα να δηλώσετε την κατάσταση των δικαιολογητικών.');return null}
 const note=val('documentsNote');if((docs==='Εκκρεμότητα'||docs==='Ελλιπή')&&!note){alert('Παρακαλώ καταγράψτε την παρατήρηση ή την εκκρεμότητα των δικαιολογητικών.');return null}
 if(docs!=='Εντάξει')return{id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:r,fullName:name,kep:k?'ΚΕΠ '+k:'',examiner:ex,documents:docs,documentsNote:note,examinationStatus:'Εκκρεμεί εξέταση',grade:'Δεν βαθμολογήθηκε',finalDecision:'Εκκρεμεί εξέταση',result:t+'\n\nΠαρατήρηση δικαιολογητικών: '+note,success:false,trips:Array.isArray(window.trips)?window.trips:[]};
 const done=s&&s.value==='done';let grade='Δεν βαθμολογήθηκε',decision='Εκκρεμεί εξέταση',success=false;if(done){const n=Number(g?.value);if(!Number.isFinite(n)||n<0||n>10){alert('Συμπληρώστε έγκυρο βαθμό εξέτασης από 0,00 έως 10,00.');return null}grade=n.toFixed(2);success=n>=5;decision=success?'Επιτυχής':'Ανεπιτυχής'}
 return{id:Date.now(),timestamp:z.iso,date:z.date,time:z.time,registryNumber:r,fullName:name,kep:k?'ΚΕΠ '+k:'',examiner:ex,documents:'Εντάξει',documentsNote:'',examinationStatus:done?'Εξετάστηκε':'Εκκρεμεί εξέταση',grade,finalDecision:decision,result:t,success,trips:Array.isArray(window.trips)?window.trips:[]}
}
function intercept(e){const b=e.target?.closest?.('#saveArchive');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const r=buildRecord();if(!r)return;const a=readArchive();a.unshift(r);writeArchive(a);alert('Η εξέταση καταχωρήθηκε στο Αρχείο Εξέτασης ΚΕΠ.')}
function init(){
 document.addEventListener('click',intercept,true);
 document.addEventListener('change',e=>{if(e.target?.id==='documentsStatus'||e.target?.id==='examinationStatus')refresh()});
 document.addEventListener('input',e=>{if(e.target?.id==='examGradeNumber')refresh()});
 const r=$('result');if(r)new MutationObserver(refresh).observe(r,{childList:true,subtree:true,characterData:true});
 setInterval(refresh,500);refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
