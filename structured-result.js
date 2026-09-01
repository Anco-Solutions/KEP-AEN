/* SeaService Calculator — deterministic calculation model */
(function(){
  const ARCHIVE_KEY='seaServiceArchive';
  const $=id=>document.getElementById(id);

  function servicePhrase(months,days){
    const m=Number(months)||0,d=Number(days)||0;
    return `${m===1?'1 μήνα':m+' μήνες'} και ${d===1?'1 ημέρα':d+' ημέρες'}`;
  }

  function serviceFromTrips(list){
    if(typeof window.calculateTripsService==='function') return window.calculateTripsService(Array.isArray(list)?list:[]);
    const set=new Set();
    (Array.isArray(list)?list:[]).forEach(t=>{
      if(!t||!t.embark||!t.discharge)return;
      let d=new Date(t.embark+'T00:00:00'),e=new Date(t.discharge+'T00:00:00');
      while(d<=e){set.add(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));d.setDate(d.getDate()+1)}
    });
    if(!set.size)return {months:0,days:0,totalDays:0};
    const groups={};Array.from(set).sort().forEach(s=>{const p=s.split('-').map(Number),k=p[0]+'-'+String(p[1]).padStart(2,'0');(groups[k]||(groups[k]={y:p[0],m:p[1],d:[]})).d.push(p[2])});
    let months=0,days=0;Object.values(groups).forEach(g=>{const last=new Date(g.y,g.m,0).getDate();if(g.d.length===last&&Math.min(...g.d)===1&&Math.max(...g.d)===last)months++;else days+=g.d.length});
    months+=Math.floor(days/30);days%=30;return {months,days,totalDays:months*30+days};
  }

  function readArchive(){try{const a=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function latestKep1(registry){
    if(!registry)return null;
    return readArchive().filter(r=>String(r.registryNumber||'')===String(registry)&&String(r.kep||'')==='ΚΕΠ 1').sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))[0]||null;
  }
  function tripsFromRecord(r){return Array.isArray(r?.trips)?r.trips:[]}
  function sessionKep1Trips(){
    try{return (typeof window.kep1SavedTrips!=='undefined'&&Array.isArray(window.kep1SavedTrips))?window.kep1SavedTrips:[]}
    catch(e){return[]}
  }

  function priorKep1Service(registry){
    const session=sessionKep1Trips();
    if(session.length)return serviceFromTrips(session);
    const previous=latestKep1(registry);
    if(previous){
      if(previous.kep1ServiceTotalDays!==undefined)return {months:Number(previous.kep1ServiceMonths)||0,days:Number(previous.kep1ServiceDays)||0,totalDays:Number(previous.kep1ServiceTotalDays)||0};
      return serviceFromTrips(tripsFromRecord(previous));
    }
    return {months:0,days:0,totalDays:0};
  }

  function rankService(trips){
    const list=Array.isArray(trips)?trips:[];
    const ranks=[...new Set(list.map(t=>t&&t.rank).filter(Boolean))];
    if(ranks.length===1)return {rank:ranks[0],service:serviceFromTrips(list.filter(t=>t.rank===ranks[0]))};
    if(ranks.length>1){
      const items=ranks.map(rank=>({rank,service:serviceFromTrips(list.filter(t=>t.rank===rank))}));
      return {rank:'Πολλαπλές ειδικότητες',service:null,items};
    }
    return {rank:'',service:{months:0,days:0,totalDays:0}};
  }

  function calculate(){
    const kep=document.querySelector('input[name="kep"]:checked')?.value||'';
    const registry=($('registryNumber')?.value||'').trim();
    const trips=Array.isArray(window.trips)?window.trips:[];
    const current=serviceFromTrips(trips);
    const ranked=rankService(trips);
    const required=kep==='2'?360:90;
    if(kep==='2'){
      const previous=priorKep1Service(registry);
      const counted=Math.min(previous.totalDays,180);
      const cumulative=counted+current.totalDays;
      const remaining=Math.max(0,360-cumulative);
      const passed=cumulative>=360;
      return {
        version:1,kep:'ΚΕΠ 2',totalService:{months:Math.floor(cumulative/30),days:cumulative%30,totalDays:cumulative},
        currentService:current,previousKep1Service:previous,kep1CountedService:{months:Math.floor(counted/30),days:counted%30,totalDays:counted},
        rank:ranked.rank,rankService:ranked.service,rankItems:ranked.items||[],requiredService:{months:12,days:0,totalDays:360},remainingService:{months:Math.floor(remaining/30),days:remaining%30,totalDays:remaining},passed,
        failureReason:passed?'':`Δεν συμπληρώθηκε η απαιτούμενη συνολική υπηρεσία των 12 μηνών. Υπολείπονται ${servicePhrase(Math.floor(remaining/30),remaining%30)}.`,
        finalMessage:passed?'Το ΚΕΠ μπορεί να εξεταστεί.':'Το ΚΕΠ δεν μπορεί να εξεταστεί.'
      };
    }
    const passed=current.totalDays>=90;
    return {
      version:1,kep:'ΚΕΠ 1',totalService:current,currentService:current,previousKep1Service:null,kep1CountedService:current,
      rank:ranked.rank,rankService:ranked.service,rankItems:ranked.items||[],requiredService:{months:3,days:0,totalDays:required},remainingService:{months:Math.floor(Math.max(0,required-current.totalDays)/30),days:Math.max(0,required-current.totalDays)%30,totalDays:Math.max(0,required-current.totalDays)},passed,
      failureReason:passed?'':'Η υπηρεσία ΚΕΠ 1 είναι μικρότερη από την ελάχιστα απαιτούμενη υπηρεσία των 3 μηνών.',
      finalMessage:passed?'Το ΚΕΠ μπορεί να εξεταστεί.':'Το ΚΕΠ δεν μπορεί να εξεταστεί.'
    };
  }

  function syncKep2Inputs(){
    const selected=document.querySelector('input[name="kep"]:checked')?.value;
    if(selected!=='2')return;
    const s=priorKep1Service(($('registryNumber')?.value||'').trim());
    const m=$('kep1Months'),d=$('kep1Days');
    if(m)m.value=s.months;
    if(d)d.value=s.days;
  }

  function publish(){
    const result=calculate();
    window.structuredCalculationResult=result;
    return result;
  }

  window.getStructuredCalculationResult=publish;
  window.servicePhrase=servicePhrase;
  window.syncStructuredKep2Inputs=syncKep2Inputs;

  // Run before app.js's click handler so KEP 2 always receives the actual prior KEP 1 service.
  document.addEventListener('click',function(e){
    if(e.target&&e.target.id==='calculate'){
      syncKep2Inputs();
      setTimeout(publish,0);
    }
  },true);

  // Enrich every archived record at the moment it is written. This keeps calculation facts
  // separate from the human-readable result text and gives the PDF a single source of truth.
  const originalSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
    if(key===ARCHIVE_KEY){
      try{
        const arr=JSON.parse(value);
        if(Array.isArray(arr)&&arr.length){
          const r=arr[0];
          const model=window.getStructuredCalculationResult?window.getStructuredCalculationResult():window.structuredCalculationResult;
          if(model){
            r.calculation=model;
            r.serviceMonths=model.totalService.months;
            r.serviceDays=model.totalService.days;
            r.totalServiceText=servicePhrase(model.totalService.months,model.totalService.days);
            r.kep1ServiceMonths=model.previousKep1Service?.months??model.totalService.months;
            r.kep1ServiceDays=model.previousKep1Service?.days??model.totalService.days;
            r.kep1ServiceTotalDays=model.previousKep1Service?.totalDays??model.totalService.totalDays;
            r.currentServiceMonths=model.currentService.months;
            r.currentServiceDays=model.currentService.days;
            r.currentServiceTotalDays=model.currentService.totalDays;
            r.rank=model.rank||'';
            r.rankServiceText=model.rankService?servicePhrase(model.rankService.months,model.rankService.days):'';
            r.requiredServiceText=servicePhrase(model.requiredService.months,model.requiredService.days);
            r.remainingServiceText=servicePhrase(model.remainingService.months,model.remainingService.days);
            r.passed=model.passed;
            r.failureReason=model.failureReason;
            r.finalMessage=model.finalMessage;
            value=JSON.stringify(arr);
          }
        }
      }catch(e){}
    }
    return originalSetItem.call(this,key,value);
  };
})();
