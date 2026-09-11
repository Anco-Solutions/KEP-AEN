/* Native print controller — print the current visible calculator page reliably. */
(function(){
'use strict';
if(window.__kepNativePrintV2Loaded)return;window.__kepNativePrintV2Loaded=true;
function isAction(el){return el&&el.id==='printResult'}
function printCurrentPage(){
  var style=document.getElementById('kepPrintCurrentPage');
  if(!style){
    style=document.createElement('style');style.id='kepPrintCurrentPage';
    style.textContent='@media print{html,body{background:#fff!important}body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.container{max-width:none!important;width:100%!important;box-shadow:none!important;margin:0!important}.archive-link,#archiveActions,#archiveActionsBottom,.pending-save,#newEntryButton,#manageExaminers,#examinerManager,button,input,select,textarea{display:none!important}#examinationPanel{display:block!important;break-inside:avoid!important;page-break-inside:avoid!important}.inline-examiner{display:none!important}footer{display:block!important}}';document.head.appendChild(style)
  }
  document.documentElement.classList.add('kep-printing');
  var done=false;
  function finish(){if(done)return;done=true;document.documentElement.classList.remove('kep-printing')}
  setTimeout(function(){try{window.focus();window.print()}catch(e){console.error('KEP print:',e)}finally{setTimeout(finish,1200)}},80)
}
document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('button,a'):null;if(!isAction(el))return;e.preventDefault();e.stopImmediatePropagation();printCurrentPage()},true);
})();