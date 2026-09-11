(function(){
'use strict';
if(window.__kepFinalActionsLoaded)return;
window.__kepFinalActionsLoaded=true;
const $=id=>document.getElementById(id);
const v=id=>String($(id)?.value||'').trim();
const kep=()=>document.querySelector('input[name="kep"]:checked')?.value||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function write(key,x){localStorage.setItem(key,JSON.stringify(x))}
function now(){const d=new Date();return{iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
function trips(){try{const x=typeof getSeaServiceTrips==='function'?getSeaServiceTrips():[];return Array.isArray(x)?x:[]}catch(e){return[]}}
function service(list){try{if(typeof calculateTripsService==='function')return calculateTripsService(list||[])}catch(e){}return{months:0,days:0,totalDays:0}}
function phrase(s){s=s||{months:0,days:0};return `${s.months} ${s.months===1?'μήνα':'μήνες'} και ${s.days} ${s.days===1?'ημέρα':'ημέρες'}`}
function data(){let k=kep(),t=trips(),s=service(t);return{registry:v('registryNumber'),name:v('fullName'),kep:k?'ΚΕΠ '+k:'',examiner:v(k==='2'?'examinerKep2':'examinerKep1'),docs:v('documentsStatus')||'Δεν έχουν ελεγχθεί',exam:v('examinationStatus')||'Εκκρεμεί',grade:v('examGrade'),decision:v('finalDecision'),result:($('result')?.innerText||'').trim(),trips:t,service:s}}
function save(){
 const r=v('registryNumber'),n=v('fullName'),k=kep(),who=v(k==='2'?'examinerKep2':'examinerKep1'),z=now();
 if(!r||!n){alert('Για να αποθηκευτεί η καταχώριση απαιτούνται Μητρώο και Ονοματεπώνυμο.');return false}
 if(!who){alert('Για να αποθηκευτεί η καταχώριση πρέπει να επιλεγεί ο Εξεταστής.');return false}
 const archive=read('seaServiceArchive');
 const idx=archive.findIndex(x=>String(x.registryNumber||'').trim()===r);
 const old=idx>=0?(archive[idx]||{}):null;
 const t=trips(),s=service(t);
 const result=(($('result')?.innerText||'').trim())||old?.result||'Δεν έχει ακόμη ολοκληρωθεί ο υπολογισμός υπηρεσίας.';
 const docs=v('documentsStatus')||'Δεν έχουν ελεγχθεί';
 const exam=v('examinationStatus')||'Εκκρεμεί';
 const grade=v('examGrade')||'Δεν βαθμολογήθηκε';
 const decision=v('finalDecision')||'Σε αναμονή';
 const rec=old?Object.assign({},old):{};
 rec.id=old?.id||Date.now();rec.timestamp=old?.timestamp||z.iso;rec.date=old?.date||z.date;rec.time=old?.time||z.time;
 rec.registryNumber=r;rec.fullName=n;rec.kep=k?'ΚΕΠ '+k:(old?.kep||'');rec.examiner=who;
 rec.createdBy=old?.createdBy||who;rec.createdAt=old?.createdAt||{iso:z.iso,date:z.date,time:z.time};
 rec.lastUpdatedBy=who;rec.lastUpdatedAt={iso:z.iso,date:z.date,time:z.time};
 if(t.length)rec.trips=t;
 rec.result=result;rec.documents=docs;rec.documentsNote=v('documentsNote')||old?.documentsNote||'';rec.examinationStatus=exam;rec.grade=grade;rec.finalDecision=decision;
 rec.kep1ServiceMonths=rec.kep==='ΚΕΠ 1'?s.months:(rec.kep1ServiceMonths||0);rec.kep1ServiceDays=rec.kep==='ΚΕΠ 1'?s.days:(rec.kep1ServiceDays||0);rec.kep1ServiceTotalDays=rec.kep==='ΚΕΠ 1'?s.totalDays:(rec.kep1ServiceTotalDays||0);
 rec.history=Array.isArray(old?.history)?old.history.slice():[];
 const event={id:Date.now()+Math.floor(Math.random()*1000),action:old?'Ενημέρωση καταχώρισης':'Νέα καταχώριση',timestamp:z.iso,date:z.date,time:z.time,by:who,registryNumber:r,fullName:n,kep:rec.kep,result:result,documents:docs,examinationStatus:exam,grade:grade,finalDecision:decision,trips:t.slice(),service:{months:s.months,days:s.days,totalDays:s.totalDays}};
 rec.history.push(event);
 if(idx>=0)archive.splice(idx,1);archive.unshift(rec);write('seaServiceArchive',archive);
 const audit=read('seaServiceAuditLog');audit.push(event);write('seaServiceAuditLog',audit);
 alert(old?'Η καταχώριση ενημερώθηκε και αποθηκεύτηκε στο Αρχείο.':'Η καταχώριση αποθηκεύτηκε στο Αρχείο.');
 return true;
}
function rows(r){return r.trips.map((t,i)=>{let s=service([t]);return `<tr><td>${i+1}</td><td>${esc(t.embark||'—')}</td><td>${esc(t.discharge||'—')}</td><td>${esc(t.rank||'—')}</td><td>${esc(phrase(s))}</td></tr>`}).join('')}
function row(a,b){return `<tr><th style="border:1px solid #ccd3da;padding:7px;background:#f0f3f7;text-align:left">${a}</th><td style="border:1px solid #ccd3da;padding:7px">${esc(b)}</td></tr>`}
function report(r){return `<div style="width:794px;background:#fff;color:#222;font:13px Arial;padding:34px;box-sizing:border-box"><h1 style="text-align:center;color:#214f83;margin:0">SeaService Calculator</h1><h2 style="text-align:center;color:#214f83">ΑΡΧΕΙΟ ΕΞΕΤΑΣΗΣ ΚΕΠ</h2><h3>ΣΤΟΙΧΕΙΑ ΥΠΟΨΗΦΙΟΥ</h3><table>${row('Μητρώο',r.registry)}${row('Ονοματεπώνυμο',r.name)}${row('ΚΕΠ',r.kep)}${row('Εξεταστής',r.examiner||'—')}</table><h3>ΣΥΝΟΛΙΚΗ ΥΠΗΡΕΣΙΑ</h3><div style="padding:12px;border:2px solid #214f83;text-align:center;font-weight:800;font-size:17px">${esc(phrase(r.service))}</div><h3>ΑΠΟΤΕΛΕΣΜΑ</h3><div style="padding:12px;border:1px solid #ccd3da;white-space:pre-line">${esc(r.result||'—')}</div>${r.trips.length?'<h3>ΤΑΞΙΔΙΑ</h3><table><tr><th>#</th><th>Ναυτολόγηση</th><th>Απόλυση</th><th>Ειδικότητα</th><th>Διάρκεια</th></tr>'+rows(r)+'</table>':''}<h3>ΣΤΟΙΧΕΙΑ ΕΞΕΤΑΣΗΣ</h3><table>${row('Δικαιολογητικά',r.docs)}${row('Εξέταση',r.exam)}${row('Βαθμός',r.grade||'—')}${row('Τελική απόφαση',r.decision||'—')}</table></div>`}
async function pdf(){if(typeof html2pdf!=='function')throw Error('PDF library unavailable');let r=data();if(!r.registry||!r.name){alert('Συμπλήρωσε πρώτα Μητρώο και Ονοματεπώνυμο.');return null}let host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;z-index:-1';host.innerHTML=report(r);document.body.appendChild(host);try{await new Promise(x=>requestAnimationFrame(()=>requestAnimationFrame(x)));return await html2pdf().set({margin:0,filename:`Arxeio-Eksetasis-KEP-${r.registry}.pdf`,image:{type:'jpeg',quality:.96},html2canvas:{scale:1.5,useCORS:true,backgroundColor:'#fff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css'],avoid:['table','tr']}}).from(host.firstElementChild).outputPdf('blob')}finally{host.remove()}}
function download(blob,r){let u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`Arxeio-Eksetasis-KEP-${r.registry}.pdf`;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},60000)}
async function doPdf(){try{let r=data(),b=await pdf();if(b)download(b,r)}catch(e){console.error(e);alert('Δεν μπόρεσε να δημιουργηθεί το PDF. Δοκίμασε ξανά.')}}
async function doEmail(){let r=data();if(!r.registry||!r.name){alert('Συμπλήρωσε πρώτα Μητρώο και Ονοματεπώνυμο.');return}try{let b=await pdf();if(b&&navigator.share&&navigator.canShare){let f=new File([b],`Arxeio-Eksetasis-KEP-${r.registry}.pdf`,{type:'application/pdf'});if(navigator.canShare({files:[f]})){await navigator.share({title:'Αρχείο Εξέτασης ΚΕΠ',text:`Αρχείο εξέτασης ΚΕΠ — ${r.name}`,files:[f]});return}}}catch(e){if(e?.name==='AbortError')return;console.error(e)}let body=`Μητρώο: ${r.registry}\nΟνοματεπώνυμο: ${r.name}\nΚΕΠ: ${r.kep}\nΕξεταστής: ${r.examiner||'—'}\nΣυνολική υπηρεσία: ${phrase(r.service)}\nΔικαιολογητικά: ${r.docs}\nΕξέταση: ${r.exam}\nΒαθμός: ${r.grade||'—'}\nΤελική απόφαση: ${r.decision||'—'}`;location.href='mailto:?subject='+encodeURIComponent('Αρχείο Εξέτασης ΚΕΠ — '+r.registry)+'&body='+encodeURIComponent(body)}
function saveOld(el){return el?.id==='saveArchive'||/καταχώριση\s+στο\s+αρχείο/i.test(el?.innerText||el?.textContent||'')}
function isEmail(el){return el?.id==='emailResult'||/αποστολή\s+με\s+email/i.test(el?.innerText||el?.textContent||'')}
function isPdf(el){return ['pdfResult','downloadPdf','savePdf'].includes(el?.id)||/δημιουργία\s*pdf|\bpdf\b/i.test(el?.innerText||el?.textContent||'')}
function isPrint(el){return el?.id==='printResult'||/εκτύπωση/i.test(el?.innerText||el?.textContent||'')}
function hide(){document.querySelectorAll('button,a').forEach(el=>{if(saveOld(el)&&el.id!=='saveArchiveTop')el.style.display='none'})}
window.addEventListener('click',function(e){let el=e.target?.closest?.('button,a');if(!el)return;if(el.id==='saveArchiveTop'){e.preventDefault();e.stopImmediatePropagation();save();return}if(saveOld(el)){e.preventDefault();e.stopImmediatePropagation();el.style.display='none';return}if(isEmail(el)){e.preventDefault();e.stopImmediatePropagation();doEmail();return}if(isPdf(el)){e.preventDefault();e.stopImmediatePropagation();doPdf();return}if(isPrint(el)){e.preventDefault();e.stopImmediatePropagation();window.print();return}},true);
hide();new MutationObserver(hide).observe(document.body,{childList:true,subtree:true});
})();
