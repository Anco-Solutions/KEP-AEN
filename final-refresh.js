/* Final refresh compatibility layer.
   The candidate workflow now uses repair.js and actions-final.js.
   Keep this file intentionally side-effect free so legacy handlers cannot
   create duplicate archive entries or blank popup print/PDF windows. */
(function(){
'use strict';
window.__finalSeaServiceRefresh={
  service:function(list){try{return typeof window.calculateTripsService==='function'?window.calculateTripsService(list||[]):{months:0,days:0,totalDays:0}}catch(e){return{months:0,days:0,totalDays:0}}}
};
})();
