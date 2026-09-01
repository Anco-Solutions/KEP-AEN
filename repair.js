(function(){
  function ready(){
    var tripForm=document.getElementById('tripForm');
    if(!tripForm)return;

    // Compatibility fields required by the current calculation logic.
    if(!document.getElementById('kep1Months')){
      var m=document.createElement('input');
      m.type='hidden';
      m.id='kep1Months';
      tripForm.appendChild(m);
    }
    if(!document.getElementById('kep1Days')){
      var d=document.createElement('input');
      d.type='hidden';
      d.id='kep1Days';
      tripForm.appendChild(d);
    }

    function serviceFromTrips(list){
      if(!Array.isArray(list)||!list.length)return {months:0,days:0,totalDays:0};
      var set=new Set();
      function key(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');}
      list.forEach(function(t){
        if(!t||!t.embark||!t.discharge)return;
        var s=new Date(t.embark+'T00:00:00');
        var e=new Date(t.discharge+'T00:00:00');
        while(s<=e){set.add(key(s));s.setDate(s.getDate()+1);}
      });
      var groups={};
      Array.from(set).sort().forEach(function(x){
        var p=x.split('-').map(Number);
        var k=p[0]+'-'+String(p[1]).padStart(2,'0');
        (groups[k]||(groups[k]={days:[]})).days.push(p[2]);
      });
      var months=0,days=0;
      Object.keys(groups).forEach(function(k){
        var p=k.split('-').map(Number);
        var last=new Date(p[0],p[1],0).getDate();
        var a=groups[k].days;
        if(a.length===last&&Math.min.apply(null,a)===1&&Math.max.apply(null,a)===last)months++;
        else days+=a.length;
      });
      months+=Math.floor(days/30);
      days%=30;
      return {months:months,days:days,totalDays:months*30+days};
    }

    function syncTripForm(){
      var selected=document.querySelector('input[name="kep"]:checked');
      var value=selected&&selected.value;
      tripForm.style.display=value?'block':'none';

      var months=document.getElementById('kep1Months');
      var days=document.getElementById('kep1Days');
      if(value==='2'){
        var saved=(typeof kep1SavedTrips!=='undefined'&&Array.isArray(kep1SavedTrips))?kep1SavedTrips:[];
        var service=serviceFromTrips(saved);
        months.value=service.months;
        days.value=service.days;
      }else{
        months.value='';
        days.value='';
      }
    }

    document.querySelectorAll('input[name="kep"]').forEach(function(radio){
      radio.addEventListener('change',function(){
        syncTripForm();
        setTimeout(syncTripForm,0);
      });
    });

    syncTripForm();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
  else ready();
})();
