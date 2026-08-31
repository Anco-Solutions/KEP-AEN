/* KEP examiner + previous-service continuation layer */
(function(){
  const ARCHIVE='seaServiceArchive', EXAMINERS='seaServiceExaminers';
  const $=id=>document.getElementById(id);
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const kep=()=>{const x=document.querySelector('input[name="kep"]:checked');return x?x.value:''};
  const reg=()=>($('registryNumber')||{}).value?.trim()||'';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function examinerName(){const e=$(kep()==='1'?'examinerKep1':'examinerKep2');return e?e.value.trim():''}
  function ensureUI(){
    const panel=$('examinationPanel'); if(!panel||$('examinerKep1'))return;
    const grid=panel.querySelector('.exam-grid');if(!grid)return;
    const box=document.createElement('div');
    box.className='examiner-box';
    box.innerHTML='<div class="examiner-title">Εξεταστής ανά ΚΕΠ</div><div class="examiner-select-grid"><label>Εξεταστής ΚΕΠ 1<select id="examinerKep1"><option value="">— Επιλέξτε εξεταστή —</option></select></label><label>Εξεταστής ΚΕΠ 2<select id="examinerKep2"><option value="">— Επιλέξτε εξεταστή —</option></select></label></div><button type="button" id="manageExaminers" class="manage-examiners">⚙️ Διαχείριση εξεταστών</button><div id="examinerManager" class="examiner-manager" style="display:none"></div>';
    grid.insertBefore(box,grid.firstChild);
    renderLists();
    $('manageExaminers').onclick=()=>{const m=$('examinerManager');m.style.display=m.style.display==='none'?'block':'none';if(m.style.display==='block')renderManager()};
  }
  function renderLists(){const a=read(EXAMINERS),v1=$('examinerKep1')?.value,v2=$('examinerKep2')?.value;['examinerKep1','examinerKep2'].forEach(id=>{const s=$(id);if(!s)return;s.innerHTML='<option value="">— Επιλέξτε εξεταστή —</option>'+a.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');const v=id==='examinerKep1'?v1:v2;if(a.includes(v))s.value=v;});}
  function renderManager(){
    const m=$('examinerManager');if(!m)return;
    const a=read(EXAMINERS);
    m.innerHTML='<div class="examiner-manager-card"><div class="examiner-manager-heading">Λίστα εξεταστών</div><div class="examiner-list">'+(a.length?a.map((n,i)=>'<div class="examiner-row"><span>'+esc(n)+'</span><button type="button" class="remove-examiner" data-x="'+i+'" aria-label="Αφαίρεση εξεταστή">🗑️</button></div>').join(''):'<span class="examiner-empty">Δεν υπάρχουν εξεταστές.</span>')+'</div><div class="examiner-add-row"><input id="newExaminer" class="new-examiner-input" type="text" autocomplete="name" placeholder="Ονοματεπώνυμο εξεταστή"><button type="button" id="addExaminer" class="add-examiner">＋ Προσθήκη</button></div></div>';
    m.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const a=read(EXAMINERS),i=+b.dataset.x;if(confirm('Να αφαιρεθεί ο εξεταστής «'+a[i]+'» από τη λίστα;')){a.splice(i,1);write(EXAMINERS,a);renderLists();renderManager();}});
    $('addExaminer').onclick=()=>{const i=$('newExaminer'),n=i.value.trim();if(!n){alert('Γράψε το ονοματεπώνυμο του εξεταστή.');i.focus();return}const a=read(EXAMINERS);if(!a.some(x=>x.toLowerCase()===n.toLowerCase()))a.push(n);write(EXAMINERS,a);i.value='';renderLists();renderManager();setTimeout(()=>$('newExaminer')?.focus(),0)};
    $('newExaminer').addEventListener('keydown',e=>{if(e.key==='Enter'){$('addExaminer').click()}});
  }
  function latest(registry,k){return read(ARCHIVE).filter(r=>String(r.registryNumber||'')===String(registry)&&String(r.kep||'')==='ΚΕΠ '+k).sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))[0]||null;}
  function serviceDays(r){if(!r||!Array.isArray(r.trips)||!r.trips.length)return null;let days=new Set();r.trips.forEach(t=>{if(!t.embark||!t.discharge)return;let d=new Date(t.embark),e=new Date(t.discharge);while(d<=e){days.add(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}});let total=days.size;return {months:Math.floor(total/30),days:total%30,total};}
  function showHistory(){const r=reg(),k=kep();let note=$('continuationNotice');if(!note){note=document.createElement('div');note.id='continuationNotice';note.style.cssText='margin:10px 0;padding:11px;border-radius:8px;background:#eef6ff;border:1px solid #c9def5;color:#234a70;font-size:13px';const target=$('registryNumber');if(target)target.parentNode.insertBefore(note,target.nextSibling)}if(!r||!k){note.style.display='none';return}
    const prev=latest(r,'1');if(!prev){note.style.display='none';return}const s=serviceDays(prev);note.style.display='block';note.innerHTML='<strong>📋 Προηγούμενη καταχώριση:</strong> ΚΕΠ 1 — '+esc(s?`${s.months} μήνες και ${s.days} ημέρες`:(prev.service||'υπηρεσία καταχωρημένη'))+'.<br><span style="font-size:12px">Η προηγούμενη εξέταση παραμένει στο ιστορικό και η νέα υπηρεσία θα προστεθεί ως νέα εξέταση.</span>';
    if(k==='2'&&s&&$('kep1Months')&&$('kep1Days')){$('kep1Months').value=s.months;$('kep1Days').value=s.days;}
  }
  function validateExaminerBeforeSave(e){const n=examinerName();if(!n){e.stopImmediatePropagation();e.preventDefault();alert('Πρέπει να επιλέξεις τον εξεταστή του συγκεκριμένου ΚΕΠ πριν από την καταχώριση.');return false}return true}
  function hookSave(){const b=$('saveArchive');if(!b||b.dataset.examinerHook)return;b.dataset.examinerHook='1';b.addEventListener('click',validateExaminerBeforeSave,true)}
  function init(){ensureUI();hookSave();const r=$('registryNumber');if(r){r.addEventListener('blur',showHistory);r.addEventListener('change',showHistory)}document.querySelectorAll('input[name="kep"]').forEach(x=>x.addEventListener('change',()=>setTimeout(()=>{ensureUI();showHistory();hookSave()},80)));const c=$('calculate');if(c)c.addEventListener('click',()=>setTimeout(()=>{ensureUI();hookSave();showHistory()},180));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
