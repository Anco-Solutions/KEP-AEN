import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient('https://yblvmtaxorbdctvrpqer.supabase.co','sb_publishable_g5YEf2H_2yWoDM1DOzKtQw_qsCvc6ty');

async function sessionProfile(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return null;
  const {data,error}=await supabase.from('profiles').select('id,full_name,email,role,active').eq('id',session.user.id).single();
  if(error||!data?.active) return null;
  return data;
}

function addNav(profile){
  const header=document.querySelector('.app-header');
  if(!header||header.querySelector('.app-nav')) return;
  const nav=document.createElement('nav'); nav.className='app-nav';
  nav.innerHTML='<a href="index.html">🏠 Νέα Εξέταση</a><a href="archive.html">📁 Αρχείο Εξετάσεων</a>'+(profile?.role==='admin'?'<a href="teachers.html">👥 Καθηγητές</a><a href="audit.html">🕘 Ιστορικό</a>':'');
  header.appendChild(nav);
}

function readTrips(){
  return [...document.querySelectorAll('#tripList .trip')].map(row=>{
    const m=row.innerText.match(/(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})/);
    return m?{embark:m[1],discharge:m[2]}:null;
  }).filter(Boolean);
}

async function saveCurrent(){
  const profile=await sessionProfile();
  if(!profile){alert('Η σύνδεση έχει λήξει. Συνδεθείτε ξανά.');return;}
  const registry=document.getElementById('registry')?.value.trim();
  const fullName=document.getElementById('fullName')?.value.trim();
  const kep=document.querySelector('input[name="kep"]:checked')?.value;
  const examinerName=document.getElementById(kep==='1'?'examiner1':'examiner2')?.value || '';
  if(!registry||!fullName||!kep||!examinerName){alert('Συμπληρώστε Μητρώο, Ονοματεπώνυμο, ΚΕΠ και Εξεταστή.');return;}
  const trips=readTrips();
  const serviceText=document.getElementById('serviceSummary')?.textContent||'';
  const resultText=document.getElementById('result')?.innerText||'';
  const docs=document.querySelector('input[name="docs"]:checked')?.value||'unchecked';
  const docsMap={unchecked:'Δεν έχουν ελεγχθεί',full:'Πλήρη',incomplete:'Ελλιπή'};
  const examinationStatus=document.querySelector('input[name="examState"]:checked')?.value==='completed'?'Ολοκληρώθηκε':'Εκκρεμεί';
  const gradeRaw=document.getElementById('grade')?.value;
  const grade=gradeRaw===''?null:Number(gradeRaw);
  const classification=document.getElementById('classification')?.textContent||null;
  const decision=document.getElementById('decision')?.textContent||null;
  const match=serviceText.match(/(\d+)\s+μήνες\s+και\s+(\d+)\s+ημέρες/);
  const serviceMonths=match?Number(match[1]):0, serviceDays=match?Number(match[2]):0;
  const {data:examiner,error:exErr}=await supabase.from('profiles').select('id').eq('full_name',examinerName).eq('active',true).limit(1).maybeSingle();
  if(exErr){alert('Δεν ήταν δυνατή η εύρεση του εξεταστή.');return;}
  const {data:exam,error}=await supabase.from('examinations').insert({registry_number:registry,full_name:fullName,kep:Number(kep),rank:document.getElementById('rank')?.value||null,examiner_id:examiner?.id||profile.id,documents_status:docsMap[docs],examination_status:examinationStatus,grade:Number.isFinite(grade)?grade:null,grade_classification:classification,final_decision:decision,service_months:serviceMonths,service_days:serviceDays,result_text:resultText,created_by:profile.id}).select('id').single();
  if(error){alert('Αποτυχία αποθήκευσης: '+error.message);return;}
  if(trips.length){
    const rows=trips.map(t=>({examination_id:exam.id,embark_date:t.embark,discharge_date:t.discharge,service_months:0,service_days:0}));
    const {error:tripError}=await supabase.from('service_trips').insert(rows);
    if(tripError){await supabase.from('examinations').delete().eq('id',exam.id);alert('Αποτυχία αποθήκευσης ταξιδιών: '+tripError.message);return;}
  }
  await supabase.from('audit_log').insert({user_id:profile.id,examination_id:exam.id,action:'create_examination',details:{registry_number:registry,full_name:fullName,kep:Number(kep),examiner:examinerName}});
  alert('Η εξέταση αποθηκεύτηκε επιτυχώς στο Αρχείο.');
}

function wire(){
  sessionProfile().then(profile=>{if(profile) addNav(profile);});
  const footer=document.querySelector('.footer-actions');
  if(footer && !document.getElementById('saveArchive')){
    const b=document.createElement('button');b.id='saveArchive';b.type='button';b.className='btn btn-primary';b.textContent='📁 Αποθήκευση Αρχείου';
    b.addEventListener('click',saveCurrent); footer.prepend(b);
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
