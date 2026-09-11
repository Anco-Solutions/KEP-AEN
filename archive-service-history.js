(function(){
'use strict';
function start(){
 const frame=document.getElementById('appFrame');if(!frame||!frame.contentDocument)return;
 const doc=frame.contentDocument,win=frame.contentWindow,KEY='seaServiceArchive',AUDIT='seaServiceAuditLog';
 const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('el-GR');
 const read=key=>{try{const x=JSON.parse(win.localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}};
 const records=()=>read(KEY),audit=()=>read(AUDIT);
 function service(list){try{if(typeof win.calculateTripsService==='function')return win.calculateTripsService(list||[])}catch(e){}return{months:0,days:0,totalDays:0}}
 const txt=s=>`${s.months} ${s.months===1?'μήνα':'μήνες'} και ${s.days} ${s.days===1?'ημέρα':'ημέρες'}`;
 const fmt=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return isNaN(d)?v:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'})};
 function eventList(r){
  const key=String(r.registryNumber||'').trim(),name=norm(r.fullName);
  const merged=[];const seen=new Set();
  [...audit(),...(Array.isArray(r.history)?r.history:[])].filter(x=>String(x.registryNumber||'').trim()===key&&norm(x.fullName)===name).forEach(x=>{
   const id=String(x.id||'');const sig=id||[x.timestamp,x.action,x.by,x.kep].join('|');
   if(!seen.has(sig)){seen.add(sig);merged.push(x)}
  });
  if(merged.length)return merged.sort((a,b)=>String(a.timestamp||'').localeCompare(String(b.timestamp||'')));
  const c=r.createdAt||{};return[{id:'legacy-'+r.id,action:'Αρχική καταχώριση',timestamp:c.iso||r.timestamp,date:c.date||r.date,time:c.time||r.time,by:r.createdBy||r.examiner||'—',registryNumber:r.registryNumber,fullName:r.fullName,kep:r.kep,result:r.result,trips:Array.isArray(r.trips)?r.trips.slice():[]}];
 }
 function matching(r){return records().filter(x=>String(x.registryNumber||'').trim()===String(r.registryNumber||'').trim()&&norm(x.fullName)===norm(r.fullName))}
 function eventService(ev,r){if(ev.service&&Number.isFinite(Number(ev.service.totalDays)))return{months:Number(ev.service.months)||Math.floor(Number(ev.service.totalDays)/30),days:Number(ev.service.days)||Number(ev.service.totalDays)%30,totalDays:Number(ev.service.totalDays)};const t=Array.isArray(ev.trips)&&ev.trips.length?ev.trips:(Array.isArray(r.trips)?r.trips:[]);return service(t)}
 function renderDetail(card,r){
  const old=card.querySelector('.service-history-panel');if(old)old.remove();
  const all=matching(r),events=[];all.forEach(x=>eventList(x).forEach(e=>events.push({e,r:x})));
  const unique=[];const seen=new Set();events.sort((a,b)=>String(a.e.timestamp||'').localeCompare(String(b.e.timestamp||''))).forEach(x=>{const id=String(x.e.id||'');const sig=id||[x.e.timestamp,x.e.action,x.e.by,x.e.kep,x.r.registryNumber].join('|');if(!seen.has(sig)){seen.add(sig);unique.push(x)}});
  let html='<div class="service-history-panel"><div class="sh-head">📋 Πλήρες ιστορικό υπηρεσίας</div><div class="sh-summary"><strong>Όλες οι καταχωρημένες εξετάσεις:</strong> '+unique.length+'</div>';
  ['ΚΕΠ 1','ΚΕΠ 2'].forEach(k=>{const list=unique.filter(x=>x.e.kep===k||(!x.e.kep&&x.r.kep===k));if(!list.length)return;html+='<div class="sh-section"><h4>'+k+' — όλες οι καταχωρήσεις</h4>';list.forEach((x,i)=>{const e=x.e,r0=x.r,s=eventService(e,r0),tr=Array.isArray(e.trips)&&e.trips.length?e.trips:(Array.isArray(r0.trips)?r0.trips:[]);html+='<div class="sh-record"><strong>Καταχώρηση '+(i+1)+'</strong> · '+esc(e.date||'')+' '+esc(e.time||'')+' · <b>'+esc(e.action||'Καταχώριση')+'</b> · Εξεταστής: <b>'+esc(e.by||r0.examiner||'—')+'</b> · Σύνολο '+k+': <b>'+esc(txt(s))+'</b>';if(tr.length)html+='<div class="sh-trips">'+tr.map((t,j)=>{const q=service([t]);return '<div><b>'+(j+1)+'.</b> '+esc(fmt(t.embark))+' → '+esc(fmt(t.discharge))+' — '+esc(txt(q))+'</div>'}).join('')+'</div>';else html+='<div class="sh-muted">Δεν έχουν αποθηκευτεί αναλυτικά ταξίδια σε αυτή την καταχώρηση.</div>';html+='</div>'});html+='</div>'});
  if(unique.length){const latest=unique[unique.length-1],s=eventService(latest.e,latest.r);html+='<div class="sh-grand">Συνολική καταγεγραμμένη υπηρεσία: <b>'+esc(txt(s))+'</b></div>'}html+='</div>';card.insertAdjacentHTML('beforeend',html)
 }
 function enhance(){doc.querySelectorAll('.record-card').forEach(card=>{let b=card.querySelector('.service-history-button');if(!b){b=doc.createElement('button');b.type='button';b.className='service-history-button';b.textContent='📋 Προβολή πλήρους υπηρεσίας';b.style.cssText='padding:9px 12px;border:1px solid #cfd5dc;border-radius:8px;background:#f7f9fb;font:inherit;font-weight:700;cursor:pointer;width:100%;margin-top:8px';card.appendChild(b)}const id=card.querySelector('.edit-record')?.dataset.id;const r=id?records().find(x=>String(x.id)===String(id)):null;if(!r)return;b.onclick=()=>{const p=card.querySelector('.service-history-panel');if(p){p.remove();b.textContent='📋 Προβολή πλήρους υπηρεσίας'}else{renderDetail(card,r);b.textContent='▴ Απόκρυψη πλήρους υπηρεσίας'}};const grid=card.querySelector('.record-grid');if(!grid)return;if(!grid.querySelector('.registration-audit-extra')){const item=doc.createElement('div');item.className='record-item registration-audit-extra';item.innerHTML='<strong>Αρχική καταχώριση</strong><div class="record-value">'+esc(r.createdBy||r.examiner||'Παλαιά καταχώριση — δεν είχε καταγραφεί')+' · '+esc((r.createdAt&&r.createdAt.date)||r.date||'—')+' '+esc((r.createdAt&&r.createdAt.time)||r.time||'')+'</div>';grid.appendChild(item)}const oldBox=card.querySelector('.registration-history');if(oldBox)oldBox.remove();const evs=eventList(r);if(evs.length){const box=doc.createElement('div');box.className='registration-history';box.innerHTML='<strong>Ποιος έκανε κάθε καταχώριση / ενημέρωση</strong>'+evs.map((h,i)=>'<div style="margin-top:5px">'+(i+1)+'. <b>'+esc(h.by||'—')+'</b> — '+esc(h.action||'Καταχώριση')+' — '+esc(h.date||'')+' '+esc(h.time||'')+'</div>').join('');card.appendChild(box)}})}
 enhance();new MutationObserver(enhance).observe(doc.getElementById('archiveResults')||doc.body,{childList:true,subtree:true});
}
const frame=document.getElementById('appFrame');if(frame)frame.addEventListener('load',start);if(frame&&frame.contentDocument&&frame.contentDocument.readyState!=='loading')start();
})();
