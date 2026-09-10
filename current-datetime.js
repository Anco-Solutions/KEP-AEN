(function(){
'use strict';
function update(){
  var el=document.getElementById('calculationDateTime');
  if(!el)return;
  var d=new Date();
  el.textContent='Ημερομηνία & ώρα: '+d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',hour12:false});
}
function init(){
  var el=document.getElementById('calculationDateTime');
  if(!el)return;
  update();
  setInterval(update,60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
