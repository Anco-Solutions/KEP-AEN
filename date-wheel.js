(function(){
'use strict';
function init(){
  ['embark','discharge'].forEach(function(id){
    var input=document.getElementById(id);
    if(!input||input.dataset.wheelReady)return;
    input.dataset.wheelReady='1';
    var wrap=document.createElement('div');
    wrap.className='date-wheel-wrap';
    wrap.style.cssText='display:flex;gap:8px;align-items:center;margin:6px 0 12px;flex-wrap:wrap';
    input.parentNode.insertBefore(wrap,input);
    input.style.margin='0';
    var btn=document.createElement('button');
    btn.type='button';btn.textContent='↕️ Κυλιόμενη επιλογή ημερομηνίας';
    btn.style.cssText='padding:9px 12px;border:1px solid #c8ced6;border-radius:8px;background:#f7f9fb;font:inherit;font-weight:700;cursor:pointer';
    wrap.appendChild(btn);
    var modal=document.createElement('div');
    modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10000;align-items:flex-end;justify-content:center';
    modal.innerHTML='<div style="width:100%;max-width:520px;background:#fff;border-radius:18px 18px 0 0;padding:18px;box-shadow:0 -8px 30px rgba(0,0,0,.2)"><div style="text-align:center;font-weight:800;font-size:18px;margin-bottom:14px">Επιλογή ημερομηνίας</div><div class="dw-cols" style="display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px"><select class="dw-day" size="5"></select><select class="dw-month" size="5"></select><select class="dw-year" size="5"></select></div><div style="display:flex;gap:8px;margin-top:16px"><button type="button" class="dw-cancel" style="flex:1;padding:11px;border:1px solid #ccc;border-radius:9px;background:#f2f3f5;font:inherit;font-weight:700">Ακύρωση</button><button type="button" class="dw-ok" style="flex:1;padding:11px;border:0;border-radius:9px;background:#2673e8;color:#fff;font:inherit;font-weight:700">Επιλογή</button></div></div>';
    document.body.appendChild(modal);
    var day=modal.querySelector('.dw-day'),month=modal.querySelector('.dw-month'),year=modal.querySelector('.dw-year');
    for(var m=1;m<=12;m++){var mo=document.createElement('option');mo.value=String(m).padStart(2,'0');mo.textContent=String(m).padStart(2,'0');month.appendChild(mo)}
    var now=new Date(),baseYear=now.getFullYear();
    for(var y=baseYear-50;y<=baseYear+20;y++){var yo=document.createElement('option');yo.value=y;yo.textContent=y;year.appendChild(yo)}
    function daysFor(y,m){return new Date(Number(y),Number(m),0).getDate()}
    function fillDays(selected){var old=selected||day.value;day.innerHTML='';var n=daysFor(year.value,month.value);for(var d=1;d<=n;d++){var o=document.createElement('option');o.value=String(d).padStart(2,'0');o.textContent=String(d).padStart(2,'0');day.appendChild(o)}if(old&&Number(old)<=n)day.value=String(old).padStart(2,'0');else day.value='01'}
    function load(){var v=input.value;if(/^\d{4}-\d{2}-\d{2}$/.test(v)){var p=v.split('-');year.value=p[0];month.value=p[1];fillDays(p[2])}else{year.value=String(baseYear);month.value=String(now.getMonth()+1).padStart(2,'0');fillDays('01')}}
    month.addEventListener('change',function(){fillDays(day.value)});
    year.addEventListener('change',function(){fillDays(day.value)});
    btn.addEventListener('click',function(){load();modal.style.display='flex'});
    modal.querySelector('.dw-cancel').addEventListener('click',function(){modal.style.display='none'});
    modal.querySelector('.dw-ok').addEventListener('click',function(){input.value=year.value+'-'+month.value+'-'+day.value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));modal.style.display='none'});
    modal.addEventListener('click',function(e){if(e.target===modal)modal.style.display='none'});
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
