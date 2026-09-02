/* KEP native selection fix — deliberately isolated from archive/workflow logic. */
(function(){
  'use strict';
  function radios(){
    return Array.prototype.slice.call(document.querySelectorAll('input[type="radio"][name="kep"]'));
  }
  function enable(){
    radios().forEach(function(r){ r.disabled=false; r.removeAttribute('disabled'); });
  }
  function activate(r){
    if(!r) return;
    enable();
    r.checked=true;
    r.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(function(){
      if(!r.checked){
        r.checked=true;
        r.dispatchEvent(new Event('change',{bubbles:true}));
      }
    },50);
  }
  function bind(){
    enable();
    radios().forEach(function(r){
      if(r.__kepNativeFix) return;
      r.__kepNativeFix=true;
      r.addEventListener('pointerdown',function(){ enable(); },true);
      r.addEventListener('click',function(){ activate(r); },true);
    });
    ['kep1Choice','kep2Choice'].forEach(function(id){
      var box=document.getElementById(id);
      if(!box || box.__kepNativeFix) return;
      box.__kepNativeFix=true;
      box.addEventListener('click',function(e){
        var r=box.querySelector('input[type="radio"][name="kep"]');
        if(!r) return;
        if(e.target.closest && e.target.closest('select,button')) return;
        setTimeout(function(){activate(r);},0);
      },true);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  setTimeout(bind,100);
  setTimeout(bind,500);
})();
