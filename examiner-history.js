/* Examiner selection: directly beside the selected KEP + management link */
(function(){
const ARCHIVE='seaServiceArchive',EXAMINERS='seaServiceExaminers';
const $=id=>document.getElementById(id);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}};
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const kep=()=>document.querySelector('input[name="kep"]:checked')?.value||'';
function field(){return $(kep()==='2'?'examinerKep2':'examinerKep1')}
function selectedKepLabel(){const r=document.querySelector('input[name="kep"]:checked');return r?.closest('label')||r?.parentElement||null}
function styles(){
 if($('examinerRequiredStyles'))return;
 const s=document.createElement('style');s.id='examinerRequiredStyles';
 s.textContent=`
 .kep-choice-with-examiner{display:flex!important;align-items:center;gap:8px;flex-wrap:wrap;margin:7px 0!important}
 .top-examiner-card{display:inline-flex;align-items:center;gap:8px;background:#f7f9fb;border:1px solid #dfe3e8;border-radius:9px;padding:6px 8px;box-sizing:border-box;vertical-align:middle}
 .top-examiner-head{display:inline-flex;align-items:center;gap:5px;color:#26344f;white-space:nowrap}
 .top-examiner-title{font-size:14px;font-weight:800}
 .top-examiner-required{font-size:9px;font-weight:800;color:#9b1c1c;background:#fff0f0;padding:3px 6px;border-radius:999px}
 .top-examiner-card select{min-width:190px;min-height:36px;box-sizing:border-box;padding:5px 9px;border:1px solid #b9c1ca;border-radius:8px;background:#fff;font:inherit}
 .top-examiner-actions{display:inline-flex;align-items:center}
 .top-examiner-actions a{font-size:11px;font-weight:700;color:#315f9f;text-decoration:none;white-space:nowrap}
 .top-examiner-warning{display:none;padding:6px 8px;border-radius:7px;background:#fff0f0;color:#9b1c1c;font-size:12px;font-weight:700}
 .examiner-box{display:none!important}
 @media(max-width:700px){
   .kep-choice-with-examiner{align-items:flex-start}
   .top-examiner-card{display:flex;width:100%;max-width:100%;margin:2px 0 4px;padding:8px;flex-wrap:wrap;gap:7px}
   .top-examiner-head{width:auto}
   .top-examiner-card select{flex:1;min-width:150px}
   .top-examiner-actions{width:100%}
   .top-examiner-actions a{font-size:12px}
 }
 `;
 document.head.appendChild(s)
}
function ensure(){
 styles();
 let c=$('topExaminerCard');
 if(!c){
  const radios=document.querySelectorAll('input[name="kep"]');
  if(!radios.length)return;
  c=document.createElement('div');c.id='topExaminerCard';c.className='top-examiner-card';
  c.innerHTML='<div class="top-examiner-head"><div id="topExaminerTitle" class="top-examiner-title">Εξεταστής</div><div class="top-examiner-required">ΥΠΟΧΡΕΩΤΙΚΟ</div></div><select id="topExaminerSelect"><option value="">— Επιλέξτε εξεταστή —</option></select><div id="topExaminerWarning" class="top-examiner-warning">Ο εξεταστής είναι υποχρεωτικός πριν από την καταχώριση.</div><div class="top-examiner-actions"><a href="examiner.html">⚙️ Διαχείριση / προσθήκη εξεταστών</a></div>';
  $('topExaminerSelect').addEventListener('change',sync);
 }
 position(c);render();
}
function position(c){
 const label=selectedKepLabel();
 if(!label||!c)return;
 label.classList.add('kep-choice-with-examiner');
 label.appendChild(c);
}
function render(){
 const c=$('topExaminerCard'),s=$('topExaminerSelect');if(!c||!s)return;
 const k=kep();c.style.display=k?'inline-flex':'none';
 const a=read(EXAMINERS),f=field(),v=f?.value||'';
 s.innerHTML='<option value="">'+(a.length?'— Επιλέξτε εξεταστή —':'— Δεν υπάρχουν εξεταστές —')+'</option>'+a.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
 if(a.includes(v))s.value=v;
 sync();
}
function sync(){
 const s=$('topExaminerSelect'),f=field();
 if(s&&f)f.value=s.value;
 const w=$('topExaminerWarning');if(w&&s?.value)w.style.display='none';
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
 if(!field()?.value.trim()){
  e.preventDefault();e.stopImmediatePropagation();
  $('topExaminerWarning').style.display='block';$('topExaminerSelect').focus();
  alert('Πρέπει να επιλέξεις τον εξεταστή του ΚΕΠ '+kep()+' πριν από την καταχώριση.');return false
 }
 return true
}
function init(){
 ensure();
 const save=$('saveArchive');
 if(save&&!save.dataset.examinerRequired){save.dataset.examinerRequired='1';save.addEventListener('click',validate,true)}
 document.querySelectorAll('input[name="kep"]').forEach(r=>r.addEventListener('change',()=>setTimeout(()=>{ensure();position($('topExaminerCard'));render();history()},30)));
 $('registryNumber')?.addEventListener('blur',history);$('registryNumber')?.addEventListener('change',history);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
