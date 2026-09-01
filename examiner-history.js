/* KEP examiner management + previous-service continuation */
(function(){
const ARCHIVE='seaServiceArchive',EXAMINERS='seaServiceExaminers';
const $=id=>document.getElementById(id);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const kep=()=>{const x=document.querySelector('input[name="kep"]:checked');return x?x.value:''};
const reg=()=>($('registryNumber')?.value||'').trim();
function activeExaminerId(){return kep()==='1'?'examinerKep1':'examinerKep2'}
function examinerName(){return ($(activeExaminerId())?.value||'').trim()}
function addTopExaminerUI(){
 if($('topExaminerCard'))return;
 const anchor=document.getElementById('kepStatus')||document.getElementById('tripForm'); if(!anchor)return;
 const card=document.createElement('div'); card.id='topExaminerCard';
 card.innerHTML='<div class="top-examiner-head"><strong id="topExaminerTitle">Εξεταστής ΚΕΠ</strong><a href="examiner.html" class="examiner-settings-link">⚙️ Διαχείριση εξεταστών</a></div><div class="top-examiner-row"><select id="topExaminerSelect"><option value="">— Επιλέξτε εξεταστή —</option></select></div><div id="topExaminerHint" class="top-examiner-hint">Ο εξεταστής είναι υποχρεωτικός για την καταχώριση της εξέτασης.</div>';
 anchor.parentNode.insertBefore(card,anchor.nextSibling);
 const style=document.createElement('style');style.textContent='#topExaminerCard{background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:13px 14px;margin:12px 0 16px;box-shadow:0 2px 7px rgba(0,0,0,.04)}.top-examiner-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:#26344f}.examiner-settings-link{font-size:12px;text-decoration:none;font-weight:700;color:#315f9f;white-space:nowrap}.top-examiner-row select{width:100%;box-sizing:border-box;min-height:44px;padding:8px 10px;border:1px solid #b9c1ca;border-radius:8px;font:inherit;background:#fff}.top-examiner-hint{font-size:12px;color:#777;margin-top:7px}.top-examiner-missing{border-color:#d88989;background:#fff8f8}.top-examiner-missing .top-examiner-hint{color:#9b1c1c;font-weight:700}@media(max-width:700px){.top-examiner-head{align-items:flex-start;flex-direction:column}.examiner-settings-link{font-size:12px}}';document.head.appendChild(style);
 $('topExaminerSelect').addEventListener('change',()=>{const id=activeExaminerId();if($(id))$(id).value=$('topExaminerSelect').value;updateTopExaminer();});
}
function renderTopExaminer(){
 const card=$('topExaminerCard');const sel=$('topExaminerSelect');if(!card||!sel)return;
 const k=kep(); if(!k){card.style.display='none';return} card.style.display='block';
 $('topExaminerTitle').textContent='Εξεταστής ΚΕΠ '+k;
 const hidden=$(k==='1'?'examinerKep1':'examinerKep2');const current=hidden?.value||'';const a=read(EXAMINERS);
 sel.innerHTML='<option value="">'+(a.length?'— Επιλέξτε εξεταστή —':'— Δεν υπάρχουν εξεταστές —')+'</option>'+a.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
 sel.value=a.includes(current)?current:'';
 updateTopExaminer();
}
function updateTopExaminer(){const s=$('topExaminerSelect');const c=$('topExaminerCard');if(!s||!c)return;c.classList.toggle('top-examiner-missing',!s.value)}
function ensureUI(){addTopExaminerUI();renderTopExaminer();}
function renderLists(){
 const a=read(EXAMINERS);['examinerKep1','examinerKep2'].forEach(id=>{const s=$(id);if(!s)return;const v=s.value;s.innerHTML='<option value="">'+(a.length?'— Επιλέξτε εξεταστή —':'— Δεν υπάρχουν εξεταστές —')+'</option>'+a.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');if(a.includes(v))s.value=v});renderTopExaminer();
}
function latest(registry,k){return read(ARCHIVE).filter(r=>String(r.registryNumber||'')===String(registry)&&String(r.kep||'')==='ΚΕΠ '+k).sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))[0]||null}
function serviceDays(r){if(!r)return null;if(Array.isArray(r.trips)&&r.trips.length){const days=new Set();r.trips.forEach(t=>{if(!t.embark||!t.discharge)return;let d=new Date(t.embark),e=new Date(t.discharge);while(d<=e){days.add(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}});const total=days.size;if(total)return {months:Math.floor(total/30),days:total%30,total}}const m=String(r.result||'').match(/Συνολική Υπηρεσία\s*\n?\s*(\d+)\s*μήνες?(?:\s*και\s*(\d+)\s*ημέρες?)?/i);if(m)return {months:Number(m[1])||0,days:Number(m[2])||0,total:(Number(m[1])||0)*30+(Number(m[2])||0)};return null}
function showHistory(){const r=reg(),k=kep();let note=$('continuationNotice');if(!note){note=document.createElement('div');note.id='continuationNotice';note.style.cssText='margin:10px 0;padding:11px;border-radius:8px;background:#eef6ff;border:1px solid #c9def5;color:#234a70;font-size:13px';const target=$('registryNumber');if(target)target.parentNode.insertBefore(note,target.nextSibling)}if(!r||!k){note.style.display='none';return}const prev=latest(r,'1');if(!prev){note.style.display='none';return}const s=serviceDays(prev);note.style.display='block';note.innerHTML='<strong>📋 Προηγούμενη καταχώριση:</strong> ΚΕΠ 1 — '+esc(s?`${s.months} μήνες και ${s.days} ημέρες`:'υπηρεσία καταχωρημένη')+'.<br><span style="font-size:12px">Η προηγούμενη υπηρεσία παραμένει καταγεγραμμένη και χρησιμοποιείται αυτόματα στον υπολογισμό του ΚΕΠ 2.</span>';if(k==='2'&&s&&$('kep1Months')&&$('kep1Days')){$('kep1Months').value=s.months;$('kep1Days').value=s.days}}
function validateBeforeSave(e){if(!examinerName()){e.stopImmediatePropagation();e.preventDefault();alert('Πρέπει να επιλέξεις τον εξεταστή του ΚΕΠ '+kep()+' πριν από την καταχώριση.');return false}return true}
function hookSave(){const b=$('saveArchive');if(!b||b.dataset.examinerHook)return;b.dataset.examinerHook='1';b.addEventListener('click',validateBeforeSave,true)}
function init(){ensureUI();hookSave();const r=$('registryNumber');if(r){r.addEventListener('blur',showHistory);r.addEventListener('change',showHistory)}document.querySelectorAll('input[name="kep"]').forEach(x=>x.addEventListener('change',()=>setTimeout(()=>{ensureUI();showHistory();hookSave()},100)));$('calculate')?.addEventListener('click',()=>setTimeout(()=>{ensureUI();showHistory();hookSave()},220));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();