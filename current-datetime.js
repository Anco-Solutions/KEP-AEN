(function(){
'use strict';
function update(){
  var el=document.getElementById('calculationDateTime');
  if(!el)return false;
  var d=new Date();
  el.textContent='Ημερομηνία & ώρα: '+d.toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+d.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',hour12:false});
  return true;
}
function init(){
  if(update()){
    setInterval(update,60000);
  }else{
    setTimeout(init,100);
  }
}
init();
})();
