/* Safe KEP PDF pagination. Keeps each report section together instead of slicing a canvas at arbitrary pixels. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const svc=s=>`${s.months||0} μήνες και ${s.days||0} ημέρες`;
  function tripService(list){
    const set=new Set();
    (Array.isArray(list)?list:[]).forEach(t=>{
      if(!t?.embark||!t?.discharge)return;
      let d=new Date(t.embark+'T00:00:00'),e=new Date(t.discharge+'T00:00:00');
      while(d<=e){set.add(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));d.setDate(d.getDate()+1)}
    });
    if(!set.size)return {months:0,days:0,totalDays:0};
    const groups={};Array.from(set).sort().forEach(s=>{const p=s.split('-').map(Number),k=p[0]+'-'+String(p[1]).padStart(2,'0');(groups[k]||(groups[k]={y:p[0],m:p[1],d:[]})).d.push(p[2])});
    let m=0,days=0;Object.values(groups).forEach(g=>{const last=new Date(g.y,g.m,0).getDate();if(g.d.length===last&&Math.min(...g.d)===1&&Math.max(...g.d)===last)m++;else days+=g.d.length});
    m+=Math.floor(days/30);days%=30;return {months:m,days,totalDays:m*30+days};
  }
  function tripsNow(){try{return typeof trips!=='undefined'&&Array.isArray(trips)?trips:[]}catch(e){return[]}}
  function savedK1(){try{return typeof kep1SavedTrips!=='undefined'&&Array.isArray(kep1SavedTrips)?kep1SavedTrips:[]}catch(e){return[]}}
  function record(){
    const k=document.querySelector('input[name="kep"]:checked')?.value||'';
    const ex=$('examinerKep1')?.value||$('examinerKep2')?.value||'';
    const r=$('registryNumber')?.value?.trim()||'',n=$('fullName')?.value?.trim()||'';
    const docs=$('documentsStatus')?.value||'Δεν έχει ελεγχθεί';
    const status=$('examinationStatus')?.value||'Δεν εξετάστηκε';
    const grade=$('examGrade')?.value||'Δεν βαθμολογήθηκε';
    const decision=$('finalDecision')?.value||'Σε αναμονή';
    const d=new Date();
    return {registryNumber:r,fullName:n,kep:k?'ΚΕΠ '+k:'',examiner:ex,documents:docs,examinationStatus:status,grade,finalDecision:decision,trips:tripsNow(),date:d.toLocaleDateString('el-GR'),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})};
  }
  function serviceRows(ts){return (Array.isArray(ts)?ts:[]).map((t,i)=>`<div class="trip"><strong>Πλοίο ${i+1}</strong><span>Ναυτολόγηση: ${esc(t.embark?new Date(t.embark+'T00:00:00').toLocaleDateString('el-GR'):'—')}</span><span>Απόλυση: ${esc(t.discharge?new Date(t.discharge+'T00:00:00').toLocaleDateString('el-GR'):'—')}</span><span>Ειδικότητα: ${esc(t.rank||'—')}</span></div>`).join('')}
  function reportHtml(r){
    const selected=r.kep==='ΚΕΠ 2'?'2':'1';
    const k1Trips=selected==='1'?(r.trips||[]):savedK1(),k2Trips=selected==='2'?(r.trips||[]):[];
    const k1=tripService(k1Trips),k2=tripService(k2Trips),k1Days=Math.min(k1.totalDays,180),combined=k1Days+k2.totalDays,remaining=Math.max(0,360-combined);
    const k1Counted={months:Math.floor(k1Days/30),days:k1Days%30,totalDays:k1Days},rm=Math.floor(remaining/30),rd=remaining%30;
    const insufficient1=k1.totalDays<90,insufficient2=selected==='2'&&combined<360,docsOK=r.documents==='Εντάξει',examDone=/Εξετάστηκε/i.test(r.examinationStatus||'')&&!/Δεν εξετάστηκε/i.test(r.examinationStatus||''),positive=r.finalDecision==='Επιτυχής';
    let narrative='';
    if(selected==='1'){
      narrative=`Ο υποψήφιος με αριθμό μητρώου ${esc(r.registryNumber)} και ονοματεπώνυμο ${esc(r.fullName)} προσήλθε για εξέταση στο ΚΕΠ 1. Κατά τον υπολογισμό της απαιτούμενης υπηρεσίας διαπιστώθηκε ότι διέθετε συνολική υπηρεσία ${svc(k1)}. `;
      if(insufficient1)narrative+='Η διαθέσιμη υπηρεσία δεν καλύπτει την ελάχιστη απαιτούμενη υπηρεσία των 3 μηνών. Ως εκ τούτου δεν μπορεί να εξεταστεί και η καταχώριση είναι απορριπτέα. Ο εξεταζόμενος πρέπει να επανέλθει με την κανονική απαιτούμενη υπηρεσία ή τουλάχιστον τρίμηνη υπηρεσία.';
      else{narrative+='Ως εκ τούτου πληρούσε την απαιτούμενη υπηρεσία για τη συμμετοχή του στην εξέταση. ';if(docsOK)narrative+='Τα δικαιολογητικά ελέγχθηκαν και βρέθηκαν εντάξει. ';else if(r.documents==='Ελλιπή')narrative+='Τα δικαιολογητικά ελέγχθηκαν και βρέθηκαν ελλιπή. ';if(examDone)narrative+=`Η εξέταση πραγματοποιήθηκε από τον εξεταστή ${esc(r.examiner)} και το αποτέλεσμα ήταν ${positive?'επιτυχές':'ανεπιτυχές'}${r.grade&&r.grade!=='Δεν βαθμολογήθηκε'?' με βαθμολογία '+esc(r.grade):''}.`;else if(!docsOK)narrative+='Η εξέταση δεν ολοκληρώθηκε λόγω των δικαιολογητικών.';}
    }else{
      narrative=`Ο υποψήφιος με αριθμό μητρώου ${esc(r.registryNumber)} και ονοματεπώνυμο ${esc(r.fullName)} προσήλθε για εξέταση στο ΚΕΠ 2. Ανακτήθηκε η υπηρεσία που είχε καταχωρηθεί στο ΚΕΠ 1 (${svc(k1)}) και προστέθηκε η νέα υπηρεσία του ΚΕΠ 2 (${svc(k2)}). Η υπηρεσία ΚΕΠ 1 που υπερβαίνει το όριο των 6 μηνών δεν προσμετράται πέραν του ορίου. Η συνολική υπηρεσία που λαμβάνεται υπόψη ανέρχεται σε ${svc({months:Math.floor(combined/30),days:combined%30})}. `;
      if(insufficient2)narrative+=`Με βάση την απαιτούμενη συνολική υπηρεσία των 12 μηνών, υπολείπονται ${rm} μήνες και ${rd} ημέρες. Ως εκ τούτου η εξέταση δεν μπορεί να προχωρήσει και η απόφαση είναι απορριπτέα λόγω ανεπαρκούς υπηρεσίας. Ο εξεταζόμενος πρέπει να επανέλθει με την απαιτούμενη υπηρεσία.`;
      else{narrative+='Η απαιτούμενη συνολική υπηρεσία των 12 μηνών έχει συμπληρωθεί. ';if(docsOK)narrative+='Τα δικαιολογητικά ελέγχθηκαν και βρέθηκαν εντάξει. ';else if(r.documents==='Ελλιπή')narrative+='Τα δικαιολογητικά ελέγχθηκαν και βρέθηκαν ελλιπή. ';if(examDone)narrative+=`Η εξέταση πραγματοποιήθηκε από τον εξεταστή ${esc(r.examiner)} και το αποτέλεσμα ήταν ${positive?'επιτυχές':'ανεπιτυχές'}${r.grade&&r.grade!=='Δεν βαθμολογήθηκε'?' με βαθμολογία '+esc(r.grade):''}.`;}
    }
    const finalReason=positive?'Η απαιτούμενη υπηρεσία και τα καταχωρημένα στοιχεία εξέτασης πληρούν τις προϋποθέσεις.':(insufficient1||insufficient2?'Δεν συμπληρώθηκε η απαιτούμενη υπηρεσία. Ο εξεταζόμενος πρέπει να επανέλθει με την απαιτούμενη υπηρεσία.':r.documents==='Ελλιπή'?'Τα δικαιολογητικά είναι ελλιπή.':'Η εξέταση δεν ολοκληρώθηκε επιτυχώς.');
    const finalBg=positive?'#eaf7ee':'#fff0f0',finalBorder=positive?'#8bc79b':'#e5a0a0',finalColor=positive?'#176b35':'#9b1c1c';
    const section=(title,items,body)=>`<section><h2>${title}</h2><table>${items.map(x=>`<tr><th>${esc(x[0])}</th><td>${x[1]}</td></tr>`).join('')}</table>${body||''}</section>`;
    const k1Items=[['Ημερομηνία & ώρα καταχώρισης',selected==='1'?`${esc(r.date)} ${esc(r.time)}`:'Ανακτήθηκε από το Αρχείο'],['Εξεταστής',selected==='1'?esc(r.examiner):'Ανακτήθηκε από την καταχώριση ΚΕΠ 1'],['Υπηρεσία ΚΕΠ 1',svc(k1)],['Υπηρεσία που λαμβάνεται υπόψη',svc(k1Counted)]];
    const k2Items=[['Ημερομηνία & ώρα καταχώρισης',`${esc(r.date)} ${esc(r.time)}`],['Εξεταστής',esc(r.examiner)],['Υπηρεσία από ΚΕΠ 1',svc(k1)],['Νέα υπηρεσία από ΚΕΠ 2',svc(k2)],['Συνολική υπηρεσία',svc({months:Math.floor(combined/30),days:combined%30})],['Υπολειπόμενη υπηρεσία μέχρι τους 12 μήνες',`${rm} μήνες και ${rd} ημέρες`]];
    const examItems=[['Δικαιολογητικά',esc(r.documents)],['Κατάσταση εξέτασης',esc(r.examinationStatus)],['Βαθμολογία',esc(r.grade)]];
    return `<div class="report"><header><div class="brand">SeaService Calculator</div><div class="subtitle">ΑΡΧΕΙΟ ΕΞΕΤΑΣΗΣ ΚΕΠ</div></header><div class="identity"><div><small>Αριθμός Μητρώου</small><strong>${esc(r.registryNumber)}</strong></div><div><small>Ονοματεπώνυμο</small><strong>${esc(r.fullName)}</strong></div></div><div class="label">ΣΤΟΙΧΕΙΑ ΝΑΥΤΙΚΟΥ</div>${section('ΚΕΠ 1',k1Items,selected==='1'&&k1Trips.length?`<div class="trips"><h3>Τα καταχωρημένα ταξίδια</h3>${serviceRows(k1Trips)}</div>`:'')}${selected==='2'?section('ΚΕΠ 2',k2Items,k2Trips.length?`<div class="trips"><h3>Νέα ταξίδια ΚΕΠ 2</h3>${serviceRows(k2Trips)}</div>`:''):''}${section('ΣΤΟΙΧΕΙΑ ΕΞΕΤΑΣΗΣ',examItems)}<section><h2>ΕΚΘΕΣΗ</h2><p class="narrative">${narrative}</p></section><section class="decision" style="background:${finalBg};border-color:${finalBorder};color:${finalColor}"><h2>Τελική απόφαση</h2><div class="decision-word">${positive?'Επιτυχής':'Απορριπτέα'}</div><p>${finalReason}</p></section><footer>Η εξέταση ολοκληρώθηκε σύμφωνα με τα καταχωρημένα στοιχεία.<br><span>© 2026 SeaService Calculator · Σχεδιασμός &amp; Ανάπτυξη: Tassos Ballas</span></footer><style>.report{box-sizing:border-box;width:760px;background:#fff;color:#172033;padding:42px 44px;font-family:Arial,sans-serif;line-height:1.5}.report header{text-align:center;border-bottom:2px solid #173d72;padding-bottom:18px;margin-bottom:22px}.brand{font-size:30px;font-weight:800;color:#173d72}.subtitle{font-size:16px;font-weight:800;letter-spacing:1px;margin-top:4px}.identity{display:grid;grid-template-columns:1fr 1.6fr;gap:18px;margin-bottom:16px}.identity div{background:#f6f8fb;border-radius:10px;padding:14px 16px}.identity small{display:block;color:#667085;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:4px}.identity strong{font-size:17px}.label{font-size:11px;color:#667085;font-weight:800;letter-spacing:1px;margin:10px 0 8px}section{border:1px solid #d9dee7;border-radius:11px;padding:18px 20px;margin-top:15px;break-inside:avoid;page-break-inside:avoid}section h2{font-size:18px;margin:0 0 12px;color:#173d72}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:8px 7px;border-bottom:1px solid #e9edf2;vertical-align:top}th{width:42%;color:#536074;font-weight:700}tr:last-child th,tr:last-child td{border-bottom:0}.trips{margin-top:14px;background:#f8fafc;border-radius:9px;padding:11px 13px;break-inside:avoid;page-break-inside:avoid}.trips h3{font-size:13px;margin:0 0 7px}.trip{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:11.5px;border-top:1px solid #e4e8ee;padding:7px 0;break-inside:avoid;page-break-inside:avoid}.trip strong{grid-column:1/-1;color:#173d72}.narrative{font-size:13px;text-align:justify;margin:0}.decision{border:2px solid;border-radius:12px;padding:20px 22px;margin-top:18px;text-align:center;break-inside:avoid;page-break-inside:avoid}.decision h2{margin:0 0 8px;color:inherit}.decision-word{font-size:25px;font-weight:900;letter-spacing:.5px}.decision p{margin:8px 0 0;font-size:13px}.report footer{text-align:center;color:#7a8494;font-size:10.5px;margin-top:24px;padding-top:14px;border-top:1px solid #e1e5eb}.report footer span{display:inline-block;margin-top:3px}</style></div>`;
  }
  async function makeFixedPdf(){
    if(typeof html2pdf==='undefined'){alert('Το εργαλείο PDF δεν έχει φορτώσει ακόμη. Δοκίμασε ξανά σε λίγο.');return null}
    const r=record();
    if(!r.registryNumber||!r.fullName){alert('Συμπλήρωσε πρώτα Μητρώο και Ονοματεπώνυμο.');return null}
    const holder=document.createElement('div');holder.style.cssText='position:fixed;left:-10000px;top:0;z-index:-1;background:#fff;width:760px';holder.innerHTML=reportHtml(r);document.body.appendChild(holder);
    const root=holder.querySelector('.report');
    await new Promise(x=>requestAnimationFrame(()=>requestAnimationFrame(x)));
    const opt={margin:[8,8,8,8],filename:`Arxeio-Eksetasis-KEP-${r.registryNumber}.pdf`,image:{type:'jpeg',quality:.96},html2canvas:{scale:2,useCORS:true,backgroundColor:'#fff',windowWidth:800},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['section','.decision','.trips','.trip']}};
    try{return await html2pdf().set(opt).from(root).outputPdf('blob')}finally{holder.remove()}
  }
  function attach(){
    const p=$('printResult'),e=$('emailResult');
    if(p&&!p.dataset.fixedPdf){p.dataset.fixedPdf='1';p.onclick=async function(){const b=await makeFixedPdf();if(!b)return;const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`Arxeio-Eksetasis-KEP-${record().registryNumber}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}}
    if(e&&!e.dataset.fixedPdf){e.dataset.fixedPdf='1';e.onclick=async function(){const b=await makeFixedPdf();if(!b)return;const r=record(),file=new File([b],`Arxeio-Eksetasis-KEP-${r.registryNumber}.pdf`,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Αρχείο Εξέτασης ΚΕΠ',text:'Επισυνάπτεται αρχείο εξέτασης ΚΕΠ.'})}else{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}}}
  }
  new MutationObserver(attach).observe(document.body,{childList:true,subtree:true});
  attach();
})();