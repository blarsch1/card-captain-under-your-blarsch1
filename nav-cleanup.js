// Keep ticket balances on Home, but remove the redundant dedicated Tickets tab from bottom navigation.
(function(){
  const ticketsIndex=baseTabs.findIndex(tab=>tab[0]==='tickets');
  if(ticketsIndex!==-1) baseTabs.splice(ticketsIndex,1);
  renderNav();

  // If an old #tickets URL is opened, send it to Home instead of leaving an unreachable screen active.
  if(location.hash.slice(1)==='tickets') go('home');
})();
