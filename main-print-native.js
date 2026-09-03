/* Native print fallback for iOS: bypass html2pdf canvas for PDF/email actions. */
(function(){
'use strict';
if(window.__kepNativePrintLoaded)return;
window.__kepNativePrintLoaded=true;
const isPdfButton=el=>['emailResult','pdfResult','downloadPdf','savePdf'].includes(el?.id)||/pdf/i.test(el?.innerText||el?.textContent||'');
async function nativePdf(){
  const win=window.open('about:blank','_blank');
  if(!win){alert('Το iPhone μπλόκαρε το παράθυρο εκτύπωσης. Επίτρεψε αναδυόμενα παράθυρα για τη σελίδα.');return}
  try{
    const r=typeof window.get==='function'?window.get():{
      registry:document.getElementById('registryNumber')?.value?.trim()||'',
      name:document.getElementById('fullName')?.value?.trim()||'',
      kep:document.querySelector('input[name="kep"]:checked')?.value||'1',
      examiner:'',docs:'',status:'',grade:'',decision:'',now:new Date().toLocaleString('el-GR'),trips:typeof window.getSeaServiceTrips==='function'?window.getSeaServiceTrips():[]
    };
    if(!r.registry||!r.name){if(!win.closed)win.close();alert('Συμπλήρωσε πρώτα Μητρώο και Ονοματεπώνυμο.');return}
    const response=await fetch('pdf-template-v2-master.html?pdfv=6',{cache:'no-store'});
    if(!response.ok)throw new Error('PDF template '+response.status);
    const template=await response.text();
    if(typeof window.build!=='function')throw new Error('Ο ελεγκτής PDF δεν φόρτωσε.');
    const html=window.build(r,template);
    win.document.open();
    win.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Αρχείο Εξέτασης ΚΕΠ</title><style>@page{size:A4 portrait;margin:0}@media print{body{margin:0}.page{break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}}html,body{margin:0;padding:0;background:#fff}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }catch(e){console.error('Native KEP PDF:',e);if(!win.closed)win.close();alert('Δεν μπόρεσε να ανοίξει η εκτύπωση PDF. Χρησιμοποίησε την Εκτύπωση ως εναλλακτική.')}
}
document.addEventListener('click',function(e){
  const el=e.target?.closest?.('button,a');
  if(!el||!isPdfButton(el))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  nativePdf();
},true);
})();
