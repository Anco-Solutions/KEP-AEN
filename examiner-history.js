/* Examiner selection + progressive examination flow. */
(function(){
'use strict';
const ARCHIVE='seaServiceArchive',EXAMINERS='seaServiceExaminers';
const $=id=>document.getElementById(id);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}};
const kep=()=>document.querySelector('input[name="kep"]:checked')?.value||'';
function field(){return $(kep()==='2'?'examinerKep2':'examinerKep1')}
function styles(){
 if($('examinerRequiredStyles'))return;
 const s=document.createElement('style');s.id='examinerRequiredStyles';
 s.textContent=`
  #manageExaminers{display:none!important}
  #examinerManager{display:none!important}
  #topExaminerCard,.top-examiner-card,.top-examiner-actions{display:none!important}
  .inline-examiner{display:none!important;align-items:center;gap:8px;margin:8px 0 14px;padding:9px 11px;background:#f5f7fa;border:1px solid #dfe3e8;border-radius:9px}
  .inline-examiner.active{display:flex!important}
  .inline-examiner strong{white-space:nowrap}
  .inline-examiner select{flex:1;min-width:0;box-sizing:border-box;padding:8px 10px;border:1px solid #c8ced6;border-radius:7px;background:#fff;font:inherit}
  @media(max-width:700px){.inline-examiner{align-items:stretch;flex-direction:column}.inline-examiner select{width:100%}}
 `;
 document.head.appendChild(s)
}
function populate(select){
 if(!select)return;
 const list=read(EXAMINERS).filter(x=>String(x||'').trim());
 const current=select.value||'';
 select.innerHTML='';
 const first=document.createElement('option');first.value='';first.textContent=list.length?'— Επιλέξτε εξεταστή —':'— Δεν υπάρχουν εξεταστές —';select.appendChild(first);
 list.forEach(name=>{const o=document.createElement('option');o.value=String(name);o.textContent=String(name);select.appendChild(o)});
 if(list.includes(current))select.value=current;
}
function syncSelected(){
 const selected=kep();
 const e1=$('kep1Examiner'),e2=$('kep2Examiner');
 [e1,e2].forEach(box=>{if(!box)return;box.classList.remove('active');const s=box.querySelector('select');if(s)populate(s)});
 const box=selected==='1'?e1:selected==='2'?e2:null;
 if(box){box.classList.add('active');const s=box.querySelector('select');if(s)s.focused=false}
}
function syncValue(e){
 const selected=kep(),source=e?.target;
 if(!source)return;
 const target=selected==='1'?$ ('examinerKep1'):$('examinerKep2');
 if(target)target.value=source.value;
}
function ensure(){
 styles();
 const old=$('manageExaminers');if(old)old.remove();
 const manager=$('examinerManager');if(manager)manager.remove();
 const top=$('topExaminerCard');if(top)top.remove();
 document.querySelectorAll('.top-examiner-card,.top-examiner-actions').forEach(x=>x.remove());
 const e1=$('examinerKep1'),e2=$('examinerKep2');
 [e1,e2].forEach(s=>{if(s&&!s.__examinerHistoryBound){s.__examinerHistoryBound=true;s.addEventListener('change',syncValue)}});
 syncSelected();
}
function resultText(){return (($('result')&&$('result').innerText)||'').replace(/\s+/g,' ').trim()}
function serviceInsufficient(t){return /δεν μπορεί να εξεταστεί|μικρότερη από την ελάχιστα απαιτούμενη|ανεπαρκή υπηρεσία/i.test(t||'')}
function syncExamPanel(){
 const p=$('examinationPanel');if(!p)return;
 const t=resultText();
 if(!kep()||!t||serviceInsufficient(t)){p.style.display='none';return}
 p.style.display='block';
 if(typeof p.__cleanExamSync==='function'){try{p.__cleanExamSync()}catch(e){}}
}
function history(){
 const r=($('registryNumber')?.value||'').trim();if(!r)return;
 const p=read(ARCHIVE).filter(x=>String(x.registryNumber||'')===r&&String(x.kep||'')==='ΚΕΠ 1').sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))[0];
 if(!p)return;
 let n=$('continuationNotice');
 if(!n){n=document.createElement('div');n.id='continuationNotice';const t=$('registryNumber');t?.parentNode.insertBefore(n,t.nextSibling)}
 n.style.cssText='margin:10px 0;padding:11px;border-radius:8px;background:#eef6ff;border:1px solid #c9def5;color:#234a70;font-size:13px';
 n.innerHTML='<strong>📋 Προηγούμενη καταχώριση:</strong> ΚΕΠ 1 — Η προηγούμενη υπηρεσία παραμένει καταγεγραμμένη.';
}
function init(){
 ensure();
 document.querySelectorAll('input[name="kep"]').forEach(r=>{r.addEventListener('change',()=>{setTimeout(()=>{ensure();syncExamPanel();history()},20)})});
 $('registryNumber')?.addEventListener('blur',history);$('registryNumber')?.addEventListener('change',history);
 const result=$('result');
 if(result&&!result.__examPanelObserver){const mo=new MutationObserver(()=>syncExamPanel());mo.observe(result,{childList:true,subtree:true,characterData:true});result.__examPanelObserver=true}
 setTimeout(syncExamPanel,100);setTimeout(syncExamPanel,500);setTimeout(syncExamPanel,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();