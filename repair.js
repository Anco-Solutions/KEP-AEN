/* Stable repair/controller layer for the KEP calculator. */
(function(){
'use strict';
function load(src){var s=document.createElement('script');s.src=src;document.body.appendChild(s);}
/* Keep the established supporting layers. */
document.write('<script src="structured-result.js?v=2"><\\/script>');
document.write('<script src="main-print-native-v2.js?v=2"><\\/script>');
document.write('<script src="print-fix.js?v=3"><\\/script>');
(function(){var form=document.getElementById('tripForm');if(form){['kep1Months','kep1Days'].forEach(function(id){if(!document.getElementById(id)){var x=document.createElement('input');x.type='hidden';x.id=id;x.value='0';form.appendChild(x)}})})();
(function(){function compact(){if(document.getElementById('compact-kep-controls'))return;var s=document.createElement('style');s.id='compact-kep-controls';s.textContent='input[type="radio"][name="kep"]{width:auto!important;min-height:0!important;height:16px!important;padding:0!important;margin:0 5px 0 0!important;border:0!important;box-sizing:border-box!important;vertical-align:middle!important}#kep1Choice>label,#kep2Choice>label{display:inline-flex!important;align-items:center!important;width:auto!important;margin:0!important;padding:0!important;font-size:16px!important;font-weight:700!important;white-space:nowrap!important}#kep1Choice,#kep2Choice{width:auto!important;box-sizing:border-box!important}';document.head.appendChild(s)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',compact);else compact()})();
(function(){
var bound=false;
function $(id){return document.getElementById(id)}
function val(id){var e=$(id);return e?(e.value||'').trim():''}
function kep(){var e=document.querySelector('input[name="kep"]:checked');return e?e.value:''}
function examiner(){var k=kep();return val(k==='1'?'examinerKep1':k==='2'?'examinerKep2':'')}
function resultText(){return (($('result')&&$('result').innerText)||'').trim()}
function now(){var d=new Date();return{iso:d.toISOString(),date:d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'}),time:d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}}
function read(key){try{var a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
function trips(){try{if(typeof window.getSeaServiceTrips==='function'){var a=window.getSeaServiceTrips();return Array.isArray(a)?a:[]}}catch(e){}return[]}
function serviceSnapshot(){var r=$('result');return r?String(r.innerText||'').trim():''}
function save(){
 var r=val('registryNumber'),n=val('fullName'),k=kep(),who=examiner(),z=now();
 if(!r||!n){alert('Για να αποθηκευτεί η καταχώριση απαιτούνται Μητρώο και Ονοματεπώνυμο.');return false}
 /* Examiner remains the audit signer, but saving never depends on examination/document completion. */
 if(!who){alert('Για να αποθηκευτεί η καταχώριση πρέπει να επιλεγεί ο Εξεταστής.');return false}
 var archive=read('seaServiceArchive');
 var idx=archive.findIndex(function(x){return String(x.registryNumber||'').trim()===r});
 var old=idx>=0?(archive[idx]||{}):null;
 var docs=val('documentsStatus')||'Δεν έχουν ελεγχθεί';
 var ex=val('examinationStatus')||'Εκκρεμεί';
 var grade=val('examGrade')||'Δεν βαθμολογήθηκε';
 var decision=val('finalDecision')||'Σε αναμονή';
 var result=serviceSnapshot()||((old&&old.result)||'Δεν έχει ακόμη ολοκληρωθεί ο υπολογισμός υπηρεσίας.');
 var t=trips();
 var rec=old?Object.assign({},old):{};
 rec.id=old&&old.id?old.id:Date.now();
 rec.timestamp=old&&old.timestamp?old.timestamp:z.iso;
 rec.date=old&&old.date?old.date:z.date;
 rec.time=old&&old.time?old.time:z.time;
 rec.registryNumber=r;rec.fullName=n;rec.kep=k?'ΚΕΠ '+k:(old&&old.kep)||'';rec.examiner=who;
 rec.createdBy=old&&old.createdBy?old.createdBy:who;rec.createdAt=old&&old.createdAt?old.createdAt:{iso:z.iso,date:z.date,time:z.time};
 rec.lastUpdatedBy=who;rec.lastUpdatedAt={iso:z.iso,date:z.date,time:z.time};
 if(t.length)rec.trips=t;else if(!Array.isArray(rec.trips))rec.trips=[];
 rec.result=result;
 rec.documents=docs;rec.documentsNote=val('documentsNote')||old&&old.documentsNote||'';
 rec.examinationStatus=ex;rec.grade=grade;rec.finalDecision=decision;
 var event={id:Date.now()+Math.floor(Math.random()*1000),action:old?'Ενημέρωση καταχώρισης':'Νέα καταχώριση',timestamp:z.iso,date:z.date,time:z.time,by:who,registryNumber:r,fullName:n,kep:rec.kep,result:result,documents:docs,examinationStatus:ex,grade:grade,finalDecision:decision};
 rec.history=Array.isArray(old&&old.history)?old.history.slice():[];rec.history.push(event);
 if(idx>=0)archive.splice(idx,1);archive.unshift(rec);write('seaServiceArchive',archive);
 var audit=read('seaServiceAuditLog');audit.push(event);write('seaServiceAuditLog',audit);
 alert(old?'Η καταχώριση ενημερώθηκε και αποθηκεύτηκε στο Αρχείο.':'Η καταχώριση αποθηκεύτηκε στο Αρχείο.');
 return true;
}
function intercept(e){var b=e.target&&e.target.closest?e.target.closest('#saveArchiveTop,#saveArchive'):null;if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();save()}
function bind(){if(bound)return;document.addEventListener('click',intercept,true);bound=true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
setTimeout(function(){load('candidate-flow.js?v=14')},0);
setTimeout(function(){load('date-wheel.js?v=2')},0);
setTimeout(function(){load('examination-ui.js?v=5')},0);
setTimeout(function(){load('exam-order-fix.js?v=2')},1800);
setTimeout(function(){load('examination-final.js?v=2')},2200);
setTimeout(function(){load('actions-final.js?v=1')},2400);
(function(){function loadServiceRule(){if(document.getElementById('service-calculation-fix'))return;var s=document.createElement('script');s.id='service-calculation-fix';s.src='service-calculation-fix.js?v=7';document.body.appendChild(s)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadServiceRule);else loadServiceRule()})();
})();
