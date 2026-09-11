/* Keep the examination panel directly after the rendered service result. */
(function(){
'use strict';
function place(){
  var p=document.getElementById('examinationPanel');
  var r=document.getElementById('result');
  if(!p||!r||!r.parentNode)return;
  if(p.parentNode!==r.parentNode||p.previousElementSibling!==r){
    r.parentNode.insertBefore(p,r.nextSibling);
  }
}
function boot(){
  place();
  var root=document.querySelector('.container')||document.body;
  if(root&&!root.__examOrderObserver){
    var mo=new MutationObserver(function(){place()});
    mo.observe(root,{childList:true,subtree:true});
    root.__examOrderObserver=true;
  }
  [100,300,700,1200,2000,3000,5000].forEach(function(ms){setTimeout(place,ms)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
