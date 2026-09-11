const $ = (id) => document.getElementById(id);

const EXAMINERS_KEY = 'seaServiceExaminers';
const TRIPS = [];

function leap(y){ return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0); }
function monthLen(y,m){ return m === 2 ? (leap(y) ? 29 : 28) : 30; }
function day(v){ return Math.min(v, 30); }
function d(value){ const [y,m,dd] = String(value).split('-').map(Number); return new Date(y,m-1,dd); }
function ms(x){ return new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(); }
function addDay(x){ const z = new Date(x.getFullYear(),x.getMonth(),x.getDate()); z.setDate(z.getDate()+1); return z; }

// NAT-style convention: every month except February has 30 days.
function singleTrip(start,end){
  const sy=start.getFullYear(), sm=start.getMonth()+1, sd=day(start.getDate());
  const ey=end.getFullYear(), em=end.getMonth()+1, ed=day(end.getDate());
  if(ms(end)<ms(start)) return {months:0,days:0,totalDays:0};
  if(sy===ey && sm===em){
    const total=Math.max(0,ed-sd+1);
    return {months:Math.floor(total/30),days:total%30,totalDays:total};
  }
  let months=0, days=0;
  const startLength=monthLen(sy,sm);
  if(sd===1) months++; else days += startLength-sd+1;
  let y=sy,m=sm;
  while(true){ m++; if(m===13){m=1;y++;} if(y===ey && m===em) break; months++; }
  const endLength=monthLen(ey,em);
  if(ed>=endLength) months++; else days += ed;
  months += Math.floor(days/30); days %= 30;
  return {months,days,totalDays:months*30+days};
}

function mergeTrips(list){
  const ranges=list.map(t=>({start:d(t.embark),end:d(t.discharge)}))
    .filter(r=>ms(r.end)>=ms(r.start)).sort((a,b)=>ms(a.start)-ms(b.start));
  const merged=[];
  for(const r of ranges){
    if(!merged.length){merged.push({...r});continue;}
    const last=merged[merged.length-1];
    if(ms(r.start)<=ms(addDay(last.end))){ if(ms(r.end)>ms(last.end)) last.end=r.end; }
    else merged.push({...r});
  }
  return merged;
}

function calculateTrips(list){
  let months=0,days=0;
  for(const r of mergeTrips(list)){
    const s=singleTrip(r.start,r.end); months+=s.months; days+=s.days;
  }
  months += Math.floor(days/30); days %= 30;
  return {months,days,totalDays:months*30+days};
}

function examinerNames(){
  try{
    const x=JSON.parse(localStorage.getItem(EXAMINERS_KEY)||'[]');
    return Array.isArray(x) ? x.map(String).map(x=>x.trim()).filter(Boolean) : [];
  }catch{return [];}
}

function fillExaminers(select){
  const list=examinerNames();
  select.innerHTML='<option value="">— Επιλέξτε εξεταστή —</option>';
  for(const name of list){ const o=document.createElement('option');o.value=name;o.textContent=name;select.appendChild(o); }
}

function selectedKep(){ return document.querySelector('input[name="kep"]:checked')?.value || ''; }
function selectedExaminer(){ const k=selectedKep(); return $(k==='1'?'examiner1':'examiner2')?.value || ''; }

function showKep(){
  const k=selectedKep();
  $('examiner1Box').classList.toggle('active',k==='1');
  $('examiner2Box').classList.toggle('active',k==='2');
  $('workArea').classList.toggle('hidden',!k);
  if(k==='2') loadPreviousService();
  else $('manualPrevious').classList.add('hidden');
}

function loadPreviousService(){
  const reg=$('registry').value.trim();
  $('manualPrevious').classList.add('hidden');
  if(!reg){ $('previousStatus').textContent=''; return; }
  try{
    const archive=JSON.parse(localStorage.getItem('seaServiceArchive')||'[]');
    const rec=Array.isArray(archive)?archive.find(x=>String(x.registryNumber||'').trim()===reg):null;
    if(rec && Number.isFinite(Number(rec.serviceMonths))){
      $('previousStatus').textContent=`Βρέθηκε προηγούμενη υπηρεσία ΚΕΠ 1: ${rec.serviceMonths} μήνες και ${rec.serviceDays||0} ημέρες.`;
      $('previousMonths').value=rec.serviceMonths||0; $('previousDays').value=rec.serviceDays||0;
    }else{
      $('previousStatus').textContent='Δεν βρέθηκε αρχείο ΚΕΠ 1. Μπορεί να καταχωριστεί χειροκίνητα η προηγούμενη υπηρεσία.';
      $('manualPrevious').classList.remove('hidden');
    }
  }catch{
    $('previousStatus').textContent='Δεν βρέθηκε αρχείο ΚΕΠ 1. Μπορεί να καταχωριστεί χειροκίνητα η προηγούμενη υπηρεσία.';
    $('manualPrevious').classList.remove('hidden');
  }
}

function previousService(){
  if(selectedKep()!=='2') return {months:0,days:0,totalDays:0};
  const months=Math.max(0,parseInt($('previousMonths').value||'0',10)||0);
  const days=Math.max(0,Math.min(29,parseInt($('previousDays').value||'0',10)||0));
  return {months:months+Math.floor(days/30),days:days%30,totalDays:months*30+days};
}

function combine(a,b){
  const total=a.totalDays+b.totalDays;
  return {months:Math.floor(total/30),days:total%30,totalDays:total};
}

function renderTrips(){
  const box=$('tripList');
  if(!TRIPS.length){box.innerHTML='<span class="muted">Δεν υπάρχουν ακόμη ταξίδια.</span>';return;}
  box.innerHTML='';
  TRIPS.forEach((t,i)=>{
    const row=document.createElement('div');row.className='trip';
    row.innerHTML=`<span><strong>${t.embark}</strong> → <strong>${t.discharge}</strong></span><button class="btn btn-secondary" data-remove="${i}" type="button">Αφαίρεση</button>`;
    box.appendChild(row);
  });
}

function resultText(service){
  const k=selectedKep();
  if(service.totalDays<180) return {type:'pending',html:`⏳ Η υπηρεσία ${k?'ΚΕΠ '+k:''} είναι <strong>${service.months} μήνες και ${service.days} ημέρες</strong>. Εκκρεμεί η απαιτούμενη υπηρεσία των έξι μηνών και δεν μπορεί να εξεταστεί.`};
  return {type:'ok',html:`✅ Η υπηρεσία ${k?'ΚΕΠ '+k:''} είναι <strong>${service.months} μήνες και ${service.days} ημέρες</strong>.<br><br>Το ΚΕΠ μπορεί να εξεταστεί.<br><span class="muted">Θα ληφθούν υπόψη μόνο οι έξι μήνες υπηρεσίας.</span>`};
}

function classify(g){
  if(g<5) return 'Ανεπιτυχής';
  if(g<6.5) return 'Καλώς — Επιτυχής';
  if(g<8.5) return 'Λίαν Καλώς — Επιτυχής';
  return 'Άριστα — Επιτυχής';
}

function updateExam(){
  const completed=$('examCompleted').checked;
  $('gradeWrap').classList.toggle('visible',completed);
  const grade=parseFloat($('grade').value);
  const docs=document.querySelector('input[name="docs"]:checked')?.value||'';
  const decision=$('decision');
  $('classification').textContent='';
  if(!completed){ decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: Σε εκκρεμότητα'; return; }
  if(!Number.isFinite(grade)||grade<0||grade>10){ decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: Σε εκκρεμότητα — απαιτείται βαθμός 0–10'; return; }
  const classification=classify(grade);
  $('classification').textContent=`Κατάταξη: ${classification}`;
  if(grade<5){decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΑΠΟΡΡΙΠΤΕΑ';return;}
  if(docs==='full') decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ';
  else if(docs==='incomplete') decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ — Εκκρεμότητα δικαιολογητικών';
  else decision.textContent='ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ: ΕΠΙΤΥΧΗΣ — Εκκρεμεί ο έλεγχος δικαιολογητικών';
}

function calculate(){
  if(!TRIPS.length && selectedKep()!=='2'){
    $('result').className='result pending';$('result').innerHTML='⏳ Προσθέστε τουλάχιστον ένα ταξίδι.';$('examPanel').classList.remove('visible');return;
  }
  const newService=calculateTrips(TRIPS);
  const service=combine(previousService(),newService);
  const out=resultText(service); $('result').className=`result ${out.type}`; $('result').innerHTML=out.html;
  $('examPanel').classList.toggle('visible',service.totalDays>=180);
  $('serviceSummary').textContent=`Συγκεντρωμένη υπηρεσία: ${service.months} μήνες και ${service.days} ημέρες.`;
  updateExam();
}

$('registry').addEventListener('input',()=>{if(selectedKep()==='2')loadPreviousService();});
document.querySelectorAll('input[name="kep"]').forEach(r=>r.addEventListener('change',showKep));
['examiner1','examiner2'].forEach(id=>fillExaminers($(id)));

$('addTrip').addEventListener('click',()=>{
  const embark=$('embark').value, discharge=$('discharge').value;
  if(!embark||!discharge){alert('Συμπληρώστε ημερομηνία ναυτολόγησης και απόλυσης.');return;}
  if(ms(d(discharge))<ms(d(embark))){alert('Η ημερομηνία απόλυσης δεν μπορεί να είναι πριν από τη ναυτολόγηση.');return;}
  TRIPS.push({embark,discharge}); $('embark').value='';$('discharge').value='';renderTrips();
});
$('tripList').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;TRIPS.splice(Number(b.dataset.remove),1);renderTrips();});
$('calculate').addEventListener('click',calculate);
$('grade').addEventListener('input',updateExam);
document.querySelectorAll('input[name="docs"],input[name="examState"]').forEach(x=>x.addEventListener('change',updateExam));
$('previousMonths').addEventListener('input',()=>{if(selectedKep()==='2')calculate();});
$('previousDays').addEventListener('input',()=>{if(selectedKep()==='2')calculate();});
$('newEntry').addEventListener('click',()=>location.reload());
showKep();renderTrips();

// Agreed regression cases for the NAT convention.
const tests=[
 ['31/12/2024→12/07/2025','2024-12-31','2025-07-12','6m13d'],
 ['02/12/2025→21/06/2026','2025-12-02','2026-06-21','6m20d'],
 ['16/05/2024→12/10/2024','2024-05-16','2024-10-12','4m27d'],
 ['19/03/2025→23/12/2025','2025-03-19','2025-12-23','9m5d'],
 ['06/05/2024→25/11/2024','2024-05-06','2024-11-25','6m20d'],
 ['28/02/2025→25/11/2025','2025-02-28','2025-11-25','8m26d'],
 ['16/05/2024→25/10/2024','2024-05-16','2024-10-25','5m10d'],
 ['16/05/2024→12/11/2024','2024-05-16','2024-11-12','5m27d']
];
console.assert(tests.every(([,a,b,expected])=>{const x=calculateTrips([{embark:a,discharge:b}]);return `${x.months}m${x.days}d`===expected;}),'NAT calculation self-check failed');
