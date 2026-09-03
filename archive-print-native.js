(function(){
'use strict';
function install(frame){
  try{
    const w=frame.contentWindow, d=frame.contentDocument;
    if(!w||!d||!d.getElementById('printArchive')) return;
    function nativeMakePdf(data,win){
      if(!win||win.closed){alert('Δεν ήταν δυνατό να ανοίξει το παράθυρο εκτύπωσης.');return;}
      const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
      const dateText=v=>{const s=String(v||'');let x=null;if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const [y,m,d]=s.split('-').map(Number);x=new Date(y,m-1,d,12)}else if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const [dd,m,y]=s.split('/').map(Number);x=new Date(y,m-1,dd,12)}else{x=new Date(s)};return isNaN(x)?'Δεν έχει καταχωρηθεί':x.toLocaleDateString('el-GR',{weekday:'long',day:'numeric',month:'numeric',year:'numeric'})};
      const norm=v=>String(v??'').replace(/\b1\s+μήνες\b/gi,'1 μήνα').replace(/\b1\s+ημέρες\b/gi,'1 ημέρα').replace(/\b1\s+μέρες\b/gi,'1 μέρα');
      const decision=v=>{const s=String(v||'').trim();if(/^Απορριπτέα$/i.test(s))return 'Μη επιτυχής';return norm(s)};
      const service=r=>{if(r.serviceText)return norm(r.serviceText);const m=r.serviceMonths??r.months,d=r.serviceDays??r.days;if(m!==undefined||d!==undefined)return `${Number(m)||0} ${Number(m)===1?'μήνα':'μήνες'} και ${Number(d)||0} ${Number(d)===1?'ημέρα':'ημέρες'}`;if(r.totalMonths!==undefined||r.totalDays!==undefined)return `${Number(r.totalMonths)||0} ${Number(r.totalMonths)===1?'μήνα':'μήνες'} και ${Number(r.totalDays)||0} ${Number(r.totalDays)===1?'ημέρα':'ημέρες'}`;return norm(r.result||'Δεν έχει καταχωρηθεί υπηρεσία')};
      const rows=data.map(r=>{const ok=r.success===true||/επιτυχής/i.test(String(r.finalDecision||''));return `<section class="pdf-report"><header><div class="brand">SeaService Calculator</div><div class="title">ΑΡΧΕΙΟ ΕΞΕΤΑΣΗΣ ΚΕΠ</div><div class="sub">Εκτύπωση εξέτασης</div></header><h2>ΣΤΟΙΧΕΙΑ ΝΑΥΤΙΚΟΥ</h2><table><tr><th>Αριθμός Μητρώου</th><td>${esc(r.registryNumber||'—')}</td></tr><tr><th>Ονοματεπώνυμο</th><td>${esc(r.fullName||'—')}</td></tr></table><h2>${esc(r.kep||'ΚΕΠ')}</h2><table><tr><th>Ημερομηνία &amp; ώρα καταχώρισης</th><td>${esc(dateText(r.date))} — ${esc(r.time||'—')}</td></tr><tr><th>Εξεταστής</th><td>${esc(r.examiner||'—')}</td></tr><tr><th>Υπηρεσία</th><td>${esc(service(r))}</td></tr><tr><th>Δικαιολογητικά</th><td>${esc(r.documents||'—')}</td></tr><tr><th>Κατάσταση εξέτασης</th><td>${esc(r.examinationStatus||'—')}</td></tr><tr><th>Βαθμολογία</th><td>${esc(r.grade||'—')}</td></tr></table><h2>ΤΕΛΙΚΟ ΑΠΟΤΕΛΕΣΜΑ</h2><div class="final ${ok?'ok':''}"><div class="state">${ok?'ΕΠΙΤΥΧΗΣ':'ΜΗ ΕΠΙΤΥΧΗΣ'}</div><div><strong>Συνολική Υπηρεσία:</strong> ${esc(service(r))}</div><div class="reason">${esc(decision(r.finalDecision)||'Η εξέταση δεν ολοκληρώθηκε επιτυχώς.')}</div>${r.result?`<div class="note"><strong>Παρατήρηση:</strong> ${esc(norm(r.result))}</div>`:''}</div><footer>© 2026 SeaService Calculator. All rights reserved. <em>Σχεδιασμός &amp; Ανάπτυξη: Tassos Ballas</em></footer></section>`}).join('');
      win.document.open();
      win.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Αρχείο Εξέτασης ΚΕΠ</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#222;font-family:Arial,sans-serif}.pdf-report{width:210mm;height:297mm;padding:13mm 13mm 9mm;display:flex;flex-direction:column;break-after:page;page-break-after:always;background:#fff}.pdf-report:last-child{break-after:auto;page-break-after:auto}header{text-align:center;margin-bottom:7mm}.brand{font-size:22pt;font-weight:800;color:#214f83}.title{font-size:16pt;font-weight:800;color:#214f83;margin-top:2mm}.sub{font-size:9pt;color:#777;margin-top:2mm}.pdf-report h2{font-size:11pt;color:#214f83;margin:5mm 0 2mm}.pdf-report table{width:100%;border-collapse:collapse;font-size:9.5pt}.pdf-report th,.pdf-report td{border:1px solid #cfd6df;padding:3mm 3.2mm;text-align:left;vertical-align:middle}.pdf-report th{width:34%;background:#f0f3f7;font-weight:800}.final{border:1px solid #d9a7a7;background:#fff0f0;color:#a12626;padding:5mm;margin-top:1mm;font-size:9.5pt;line-height:1.5}.final.ok{border-color:#a8c8ae;background:#eaf4ec;color:#1f6b35}.state{text-align:center;font-size:12pt;font-weight:800;margin-bottom:3mm}.reason{margin-top:2mm}.note{margin-top:3mm}.pdf-report footer{margin-top:auto;border-top:1px solid #d5dbe2;padding-top:2mm;font-size:7.5pt;color:#777;display:flex;justify-content:space-between}footer em{font-style:italic}@media screen{body{background:#e5e7eb}.pdf-report{margin:0 auto 8mm;box-shadow:0 1px 8px rgba(0,0,0,.12)}}@media print{body{background:#fff}.pdf-report{box-shadow:none;margin:0}}</style></head><body>${rows}</body></html>`);
      win.document.close();
      try{win.focus();win.print()}catch(e){console.error(e)}
    }
    w.makePdf=nativeMakePdf;
    w.__nativeArchivePrintInstalled=true;
    const pb=d.getElementById('printArchive'); if(pb) pb.onclick=w.openPrintDialog;
    const eb=d.getElementById('emailArchive'); if(eb) eb.onclick=w.emailArchive;
  }catch(e){console.error('archive print override',e)}
}
const f=document.getElementById('appFrame');
if(f){f.addEventListener('load',()=>setTimeout(()=>install(f),0)); if(f.contentDocument&&f.contentDocument.readyState==='complete')setTimeout(()=>install(f),0)}
})();
