(function(){
'use strict';
function start(){
  const frame=document.getElementById('appFrame');
  if(!frame||!frame.contentDocument)return;
  const doc=frame.contentDocument, win=frame.contentWindow;
  const KEY='seaServiceArchive';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('el-GR');
  const records=()=>{try{const x=JSON.parse(win.localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}};
  function dates(t){const out=[];if(!t?.embark||!t?.discharge)return out;let d=new Date(t.embark+'T12:00:00'),e=new Date(t.discharge+'T12:00:00');if(isNaN(d)||isNaN(e)||d>e)return out;while(d<=e){out.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));d.setDate(d.getDate()+1)}return out}
  function service(list){const set=new Set();(list||[]).forEach(t=>dates(t).forEach(x=>set.add(x)));if(!set.size)return{months:0,days:0,totalDays:0};const g={};Array.from(set).sort().forEach(s=>{const [y,m,d]=s.split('-').map(Number),k=y+'-'+String(m).padStart(2,'0');(g[k]||(g[k]={y,m,d:[]})).d.push(d)});let months=0,daysCount=0;Object.values(g).forEach(x=>{const last=new Date(x.y,x.m,0).getDate();if(x.d.length===last&&Math.min(...x.d)===1&&Math.max(...x.d)===last)months++;else daysCount+=x.d.length});months+=Math.floor(daysCount/30);daysCount%=30;return{months,days:daysCount,totalDays:months*30+daysCount}}
  const one=t=>service([t]);
  const txt=s=>`${s.months} ${s.months===1?'μήνα':'μήνες'} και ${s.days} ${s.days===1?'ημέρα':'ημέρες'}`;
  const fmt=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return isNaN(d)?v:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'})};
  function totalOf(r){const td=Number(r.kep1ServiceTotalDays);if(Number.isFinite(td))return{months:Number(r.kep1ServiceMonths)||Math.floor(td/30),days:Number(r.kep1ServiceDays)||td%30,totalDays:td};if(r.calculation?.totalService&&Number.isFinite(Number(r.calculation.totalService.totalDays)))return r.calculation.totalService;const m=Number(r.serviceMonths),d=Number(r.serviceDays);if(Number.isFinite(m)&&Number.isFinite(d))return{months:m,days:d,totalDays:m*30+d};return null}
  function currentOf(r){if(r.kep==='ΚΕΠ 1'){const s=service(r.trips||[]);return s.totalDays?{label:'Υπηρεσία ΚΕΠ 1',s}:null}if(r.kep==='ΚΕΠ 2'){const td=Number(r.kep2ServiceTotalDays);if(Number.isFinite(td))return{label:'Υπηρεσία ΚΕΠ 2',s:{months:Number(r.kep2ServiceMonths)||Math.floor(td/30),days:Number(r.kep2ServiceDays)||td%30,totalDays:td}}}return null}
  function historyFor(r){const all=records().filter(x=>String(x.registryNumber||'').trim()===String(r.registryNumber||'').trim()&&norm(x.fullName)===norm(r.fullName));return all.sort((a,b)=>String(a.timestamp||a.id).localeCompare(String(b.timestamp||b.id)))}
  function renderDetail(card,r){
    const old=card.querySelector('.service-history-panel');if(old)old.remove();
    const all=historyFor(r), kep1=all.filter(x=>x.kep==='ΚΕΠ 1'), kep2=all.filter(x=>x.kep==='ΚΕΠ 2');
    let html='<div class="service-history-panel"><div class="sh-head">📋 Πλήρης ιστορικό υπηρεσίας</div>';
    html+='<div class="sh-summary"><strong>Όλες οι καταχωρημένες εξετάσεις:</strong> '+all.length+'</div>';
    if(kep1.length){html+='<div class="sh-section"><h4>ΚΕΠ 1 — όλες οι καταχωρήσεις</h4>';kep1.forEach((x,i)=>{const s=totalOf(x)||service(x.trips||[]);html+='<div class="sh-record"><strong>Καταχώρηση '+(i+1)+'</strong> · '+esc(x.date||'')+' · Σύνολο ΚΕΠ 1: <b>'+esc(s?txt(s):'—')+'</b>';if((x.trips||[]).length){html+='<div class="sh-trips">'+x.trips.map((t,j)=>{const q=one(t);return '<div><b>'+(j+1)+'.</b> '+esc(fmt(t.embark))+' → '+esc(fmt(t.discharge))+' — '+esc(txt(q))+'</div>'}).join('')+'</div>'}else html+='<div class="sh-muted">Δεν έχουν αποθηκευτεί αναλυτικά ταξίδια σε αυτή την καταχώρηση.</div>';html+='</div>'});html+='</div>'}
    if(kep2.length){html+='<div class="sh-section"><h4>ΚΕΠ 2 — όλες οι καταχωρήσεις</h4>';kep2.forEach((x,i)=>{const s=currentOf(x),total=totalOf(x);html+='<div class="sh-record"><strong>Καταχώρηση '+(i+1)+'</strong> · '+esc(x.date||'')+(s?' · Υπηρεσία ΚΕΠ 2: <b>'+esc(txt(s.s))+'</b>':'')+(total?' · Συνολική υπηρεσία: <b>'+esc(txt(total))+'</b>':'');if((x.trips||[]).length){html+='<div class="sh-trips">'+x.trips.map((t,j)=>{const q=one(t);return '<div><b>'+(j+1)+'.</b> '+esc(fmt(t.embark))+' → '+esc(fmt(t.discharge))+' — '+esc(txt(q))+'</div>'}).join('')+'</div>'}else html+='<div class="sh-muted">Δεν έχουν αποθηκευτεί αναλυτικά ταξίδια σε αυτή την καταχώρηση.</div>';html+='</div>'});html+='</div>'}
    const latest=kep2.length?kep2[kep2.length-1]:kep1[kep1.length-1];const latestTotal=latest?totalOf(latest):null;
    if(latestTotal)html+='<div class="sh-grand">Συνολική καταγεγραμμένη υπηρεσία: <b>'+esc(txt(latestTotal))+'</b></div>';
    html+='</div>';
    card.insertAdjacentHTML('beforeend',html);
  }
  function enhance(){
    const cards=doc.querySelectorAll('.record-card');cards.forEach(card=>{
      if(card.querySelector('.service-history-button'))return;
      const buttons=doc.createElement('button');buttons.type='button';buttons.className='service-history-button';buttons.textContent='📋 Προβολή πλήρους υπηρεσίας';
      buttons.style.cssText='padding:9px 12px;border:1px solid #cfd5dc;border-radius:8px;background:#f7f9fb;font:inherit;font-weight:700;cursor:pointer;width:100%;margin-top:8px';
      card.appendChild(buttons);
      const data=records();const id=card.querySelector('.edit-record')?.dataset.id;const r=data.find(x=>String(x.id)===String(id));
      buttons.onclick=()=>{if(!r)return;const panel=card.querySelector('.service-history-panel');if(panel){panel.remove();buttons.textContent='📋 Προβολή πλήρους υπηρεσίας'}else{renderDetail(card,r);buttons.textContent='▴ Απόκρυψη πλήρους υπηρεσίας'}};
    });
  }
  enhance();
  new MutationObserver(enhance).observe(doc.getElementById('archiveResults')||doc.body,{childList:true,subtree:true});
}
const frame=document.getElementById('appFrame');if(frame)frame.addEventListener('load',start);if(frame&&frame.contentDocument&&frame.contentDocument.readyState!=='loading')start();
})();