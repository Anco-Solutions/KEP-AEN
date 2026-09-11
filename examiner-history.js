/* Examiner selection: candidate flow uses the existing examiner list; management stays outside this screen. */
(function(){
const ARCHIVE='seaServiceArchive',EXAMINERS='seaServiceExaminers';
const $=id=>document.getElementById(id);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}};
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const kep=()=>document.querySelector('input[name="kep"]:checked')?.value||'';
function field(){return $(kep()==='2'?'examinerKep2':'examinerKep1')}
function styles(){
 if($('examinerRequiredStyles'))return;
 const s=document.createElement('style');s.id='examinerRequiredStyles';
 s.textContent=`
 .candidate-examiner-control{display:inline-flex;align-items:center;gap:7px;margin:6px 0;padding:7px 9px;background:#f7f9fb;border:1px solid #dfe3e8;border-radius:9px;vertical-align:middle}
 .candidate-examiner-control strong{font-size:13px;color:#26344f;white-space:nowrap}
 .candidate-examiner-control select{min-width:190px;min-height:36px;box-sizing:border-box;padding:5px 9px;border:1px solid #b9c1ca;border-radius:8px;background:#fff;font:inherit}
 .candidate-examiner-warning{display:none;color:#9b1c1c;font-size:12px;font-weight:700}
 .examiner-box{display:none!important}
 #manageExaminers{display:none!important}
 @media(max-width:700px){.candidate-examiner-control{display:flex;width:100%;box-sizing:border-box;flex-wrap:wrap}.candidate-examiner-control select{flex:1;min-width:150px}}
 `;
 document.head.appendChild(s)
}
function ensure(){
 styles();
 const old=$('manageExaminers');
 let c=$('candidateExaminerControl');
 if(old){
   if(!c){
     c=document.createElement('div');c.id='candidateExaminerControl';c.className='candidate-examiner-control';
     c.innerHTML='<strong>Εξεταστής:</strong><select id="candidateExaminerSelect"><option value="">— Επιλέξτε εξεταστή —</option></select><span id="candidateExaminerWarning" class="candidate-examiner-warning">Υποχρεωτικό</span>';
     old.replaceWith(c);
     $('candidateExaminerSelect').addEventListener('change',sync);
   } else old.remove();
 }
 if(!c){
   const anchor=$('topExaminerCard')||document.querySelector('.examiner-box');
   if(anchor){
     c=document.createElement('div');c.id='candidateExaminerControl';c.className='candidate-examiner-control';
     c.innerHTML='<strong>Εξεταστής:</strong><select id="candidateExaminerSelect"><option value="">— Επιλέξτε εξεταστή —</option></select><span id="candidateExaminerWarning" class="candidate-examiner-warning">Υποχρεωτικό</span>';
     anchor.replaceWith(c);
     $('candidateExaminerSelect').addEventListener('change',sync);
   }
 }
 if($('topExaminerCard'))$('topExaminerCard').remove();
 document.querySelectorAll('.top-examiner-card,.top-examiner-actions').forEach(x=>x.remove());
 render();
}
function render(){
 const s=$('candidateExaminerSelect');if(!s)return;
 const a=read(EXAMINERS),f=field(),v=f?.value||'';
 s.innerHTML='<option value="">'+(a.length?'— Επιλέξτε εξεταστή —':'— Δεν υπάρχουν εξεταστές —')+'</option>'+a.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
 if(a.includes(v))s.value=v;
 sync();
}
function sync(){
 const s=$('candidateExaminerSelect'),f=field();
 if(s&&f)f.value=s.value;
}
function latest(registry,k){return read(ARCHIVE).filter(r=>String(r.registryNumber||'')===String(registry)&&String(r.kep||'')==='ΚΕΠ '+k).sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))[0]||null}
function serviceDays(r){
 if(!r)return null;if(Array.isArray(r.trips)&&r.trips.length){const days=new Set();r.trips.forEach(t=>{if(!t.embark||!t.discharge)return;let d=new Date(t.embark),e=new Date(t.discharge);while(d<=e){days.add(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}});const n=days.size;return n?{months:Math.floor(n/30),days:n%30}:null}return null
}
function history(){
 const r=($('registryNumber')?.value||'').trim();if(!r)return;const p=latest(r,'1');if(!p)return;const s=serviceDays(p);let n=$('continuationNotice');
 if(!n){n=document.createElement('div');n.id='continuationNotice';const t=$('registryNumber');t?.parentNode.insertBefore(n,t.nextSibling)}
 n.style.cssText='margin:10px 0;padding:11px;border-radius:8px;background:#eef6ff;border:1px solid #c9def5;color:#234a70;font-size:13px';
 n.innerHTML='<strong>📋 Προηγούμενη καταχώριση:</strong> ΚΕΠ 1 — '+esc(s?`${s.months} μήνες και ${s.days} ημέρες`:'υπηρεσία καταχωρημένη')+'.<br><span style="font-size:12px">Η προηγούμενη υπηρεσία παραμένει καταγεγραμμένη.</span>'
}
function validate(e){
 sync();
 const f=field();
 if(!f?.value.trim()){
  e.preventDefault();e.stopImmediatePropagation();
  const w=$('candidateExaminerWarning');if(w)w.style.display='inline';
  $('candidateExaminerSelect')?.focus();
  alert('Πρέπει να επιλέξεις τον εξεταστή του ΚΕΠ '+kep()+' πριν από την καταχώριση.');return false
 }
 return true
}
function init(){
 ensure();
 const save=$('saveArchive');
 if(save&&!save.dataset.examinerRequired){save.dataset.examinerRequired='1';save.addEventListener('click',validate,true)}
 document.querySelectorAll('input[name="kep"]').forEach(r=>r.addEventListener('change',()=>setTimeout(()=>{ensure();render();history()},30)));
 $('registryNumber')?.addEventListener('blur',history);$('registryNumber')?.addEventListener('change',history);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
