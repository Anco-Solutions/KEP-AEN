/* Native main print/PDF controller — mobile-first PDF layout. */
(function(){
'use strict';
if(window.__kepNativePrintV2Loaded)return;window.__kepNativePrintV2Loaded=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const val=id=>document.getElementById(id)?.value?.trim()||'';
const choice=name=>document.querySelector(`input[name="${name}"]:checked`)?.value||'';
function report(){
 const registry=val('registryNumber'),name=val('fullName'),kep=choice('kep')||'1',examiner=val(kep==='2'?'examinerKep2':'examinerKep1'),result=document.getElementById('result');
 const rows=[['Αριθμός Μητρώου',registry||'—'],['Ονοματεπώνυμο',name||'—'],['ΚΕΠ','ΚΕΠ '+kep],['Εξεταστής',examiner||'—'],['Δικαιολογητικά',val('documentsStatus')||'—'],['Κατάσταση εξέτασης',val('examinationStatus')||'—'],['Βαθμολογία',val('examGrade')||'—'],['Τελικό αποτέλεσμα',val('finalDecision')||'—']];
 const resultHtml=result?.innerHTML||'Δεν έχει ολοκληρωθεί ο υπολογισμός.';
 const now=new Date().toLocaleString('el-GR',{weekday:'long',day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
 return `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Αρχείο Εξέτασης ΚΕΠ — ${esc(registry)}</title><style>@page{size:108mm 192mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#222;font-family:Arial,sans-serif}.sheet{width:108mm;min-height:192mm;padding:6mm;display:flex;flex-direction:column;break-after:page;page-break-after:always}.head{text-align:center;border-bottom:1px solid #214f83;padding-bottom:3mm;margin-bottom:3mm}.brand{font-size:14pt;font-weight:800;color:#214f83}.title{font-size:11pt;font-weight:800;color:#214f83;margin-top:1.5mm}.sub{font-size:6.5pt;color:#777;margin-top:1.5mm}h2{font-size:8pt;color:#214f83;margin:3mm 0 1.5mm}table{width:100%;border-collapse:collapse;font-size:7.2pt}th,td{border:1px solid #cfd6df;padding:1.8mm;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{width:36%;background:#f0f3f7;font-weight:800}.result{border:1px solid #cfd6df;padding:2.5mm;font-size:7.5pt;line-height:1.4;overflow-wrap:anywhere}.result button,.result input,.result select,.result textarea{display:none}.foot{margin-top:auto;border-top:1px solid #d5dbe2;padding-top:1.5mm;font-size:5.5pt;color:#777;display:flex;justify-content:space-between;gap:3mm}.foot em{font-style:italic;text-align:right}</style></head><body><section class="sheet"><div class="head"><div class="brand">SeaService Calculator</div><div class="title">ΑΡΧΕΙΟ ΕΞΕΤΑΣΗΣ ΚΕΠ</div><div class="sub">Εκτύπωση / Αποθήκευση ως PDF — ${esc(now)}</div></div><h2>ΣΤΟΙΧΕΙΑ ΝΑΥΤΙΚΟΥ</h2><table>${rows.slice(0,4).map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table><h2>ΣΤΟΙΧΕΙΑ ΕΞΕΤΑΣΗΣ</h2><table>${rows.slice(4).map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table><h2>ΑΠΟΤΕΛΕΣΜΑ ΥΠΟΛΟΓΙΣΜΟΥ</h2><div class="result">${resultHtml}</div><div class="foot"><span>© 2026 SeaService Calculator. All rights reserved.</span><em>Σχεδιασμός &amp; Ανάπτυξη: Tassos Ballas</em></div></section></body></html>`;
}
function printNative(){
 const win=window.open('about:blank','_blank');
 if(!win){alert('Το iPhone μπλόκαρε το παράθυρο. Επίτρεψε αναδυόμενα παράθυρα για τη σελίδα.');return}
 try{
  win.document.open();win.document.write(report());win.document.close();
  let done=false;const go=()=>{if(done||win.closed)return;done=true;try{win.focus();setTimeout(()=>{try{win.print()}catch(e){console.error(e)}},700)}catch(e){console.error(e)}};
  win.addEventListener('load',go,{once:true});setTimeout(go,1600);
 }catch(e){console.error('Native main print:',e);if(!win.closed)win.close();alert('Δεν μπόρεσε να ανοίξει η εκτύπωση.')}
}
function isAction(el){return el&&(['printResult','emailResult','pdfResult','downloadPdf','savePdf'].includes(el.id)||/pdf|εκτύπωση|αποστολή με email/i.test(el.innerText||el.textContent||''))}
document.addEventListener('click',e=>{const el=e.target?.closest?.('button,a');if(!isAction(el))return;e.preventDefault();e.stopImmediatePropagation();printNative()},true);
})();
