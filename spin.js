/* Rose Prehall prize wheel. The server chooses one winner at launch. */
(function(){
  baseTabs.splice(baseTabs.findIndex(x=>x[0]==='history')+1,0,['spin','🎰','Spin']);
  privateScreens.add('spin');
  const screen=document.createElement('section');
  screen.className='screen';screen.dataset.screen='spin';
  screen.innerHTML='<div class="spin-stage"><div class="spin-kicker">ROSE PREHALL PRESENTS</div><h2>THE WHEEL OF DESTINY</h2><p class="spin-tagline">ONE PRIZE. TEN DREAMS. NINE DISAPPOINTMENTS.</p><div id="spinPrize" class="spin-prize">Loading the prize vault…</div><div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="spin-wheel" id="spinWheel"><div class="wheel-center">🌹<small>SPIN</small></div></div></div><div id="spinOdds" class="spin-odds"></div><button class="btn yellow spin-trigger" id="spinTrigger" type="button" disabled>🎰 SPIN THE WHEEL 🎰</button><div id="spinResult" class="spin-result" aria-live="polite"></div></div>';
  document.querySelector('main.content').appendChild(screen);
  const admin=document.querySelector('[data-screen="admin"]');
  const panel=document.createElement('div');panel.className='panel spin-admin';
  panel.innerHTML='<span class="play-kicker">🎰 PRIZE DRAWINGS</span><h3>Launch the Wheel of Destiny</h3><p>One prize, one secret winner, ticket-weighted odds. All managers can spin once to reveal their result. Tickets are not spent.</p><label>Prize name<input id="spinPrizeName" maxlength="120" placeholder="e.g. $25 gift card" /></label><button class="btn yellow" id="spinLaunch" type="button">🎟️ LAUNCH DRAWING</button><button class="btn blue" id="spinClose" type="button" hidden>Close Current Drawing</button><div id="spinAdminMessage" class="captain-message"></div>';
  admin.insertBefore(panel,document.getElementById('adminMatchups'));
  let active=null,spinning=false,denialTimer=null;
  const $=id=>document.getElementById(id);
  const message=(s)=>{$('spinResult').textContent=s;};
  function denySpin(){
    const result=$('spinResult');
    if(denialTimer)clearTimeout(denialTimer);
    result.className='spin-result spin-denied';
    result.innerHTML='<div class="denied-siren">🚨 ⛔ 🚨 ⛔ 🚨</div><strong>ACCESS DENIED</strong><div class="denied-sub">ZERO TICKETS. ZERO SPINS.</div><div class="denied-footer">NO TICKEY. NO SPINNY. GET OUTTA HERE.</div>';
    $('spinWheel').classList.add('wheel-rejected');
    denialTimer=setTimeout(()=>{$('spinWheel').classList.remove('wheel-rejected')},2600);
  }
  const call=async(fn,args={})=>{const {data,error}=await client.rpc(fn,args);if(error)throw error;return data};
  async function refresh(){
    if(!session?.user||!profile){message('Sign in to spin.');return}
    try{
      active=await call('get_card_captain_spin_state');
      $('spinPrize').textContent=active.active?'🏆 '+active.prize:'NO DRAWING ACTIVE';
      $('spinOdds').textContent=active.active?`YOUR TICKETS: ${active.tickets} / ${active.total_tickets} · ${active.total_tickets?((100*active.tickets/active.total_tickets).toFixed(1)):'0'}% ODDS`:'The commissioner has not launched a prize drawing.';
      $('spinTrigger').disabled=!active.active||active.spun||spinning;
      $('spinTrigger').textContent=active.active&&Number(active.tickets)===0?'⛔ TRY YOUR LUCK (0 TICKETS) ⛔':'🎰 SPIN THE WHEEL 🎰';
      if(active.active&&active.spun){message(active.won?'🏆 YOU WON! YOU MAGNIFICENT BASTARD! 🎉':'YOU WON ABSOLUTELY NOTHING. PLEASE RETURN TO WORK. ☕');$('spinResult').className='spin-result '+(active.won?'spin-win':'spin-lose')}
      else if(active.active){message(Number(active.tickets)===0?'You have zero tickets. Go ahead. Press it. I dare you.':'Your fate is sealed. Your spin is merely ceremonial.');$('spinResult').className='spin-result'}
      else {message('');$('spinResult').className='spin-result'}
      if(profile?.is_commissioner){$('spinClose').hidden=!active.active;$('spinLaunch').disabled=!!active.active}
    }catch(e){message('Could not load drawing: '+e.message)}
  }
  $('spinTrigger').addEventListener('click',async()=>{
    if(!active?.active||active.spun||spinning)return;
    if(Number(active.tickets)===0){denySpin();return;}
    spinning=true;$('spinTrigger').disabled=true;message('THE WHEEL HAS SPOKEN… ALMOST.');
    try{
      const result=await call('spin_card_captain_prize',{p_drawing_id:active.id});
      const wheel=$('spinWheel');wheel.classList.remove('spin-rolling');void wheel.offsetWidth;wheel.classList.add('spin-rolling');
      setTimeout(()=>{
        spinning=false;wheel.classList.remove('spin-rolling');
        $('spinResult').className='spin-result '+(result.won?'spin-win':'spin-lose');
        if(result.won){$('spinResult').innerHTML='<div class="spin-confetti">🎊 ✨ 🎉 💥 🏆 💥 🎉 ✨ 🎊</div><strong>YOU WON, YOU MAGNIFICENT BASTARD!</strong><div>🏆 '+esc(result.prize)+' 🏆</div><div class="spin-confetti">🎉 💰 🌹 🎉 💰 🌹 🎉</div>'}
        else{$('spinResult').innerHTML='<strong>YOU WON ABSOLUTELY NOTHING.</strong><div>☕ YEAH… I’M GONNA NEED YOU TO GO AHEAD AND COME IN ON SATURDAY.</div><small>— The Wheel of Destiny</small>'}
        refresh().then(()=>{if(result.won){$('spinResult').innerHTML='<div class="spin-confetti">🎊 ✨ 🎉 💥 🏆 💥 🎉 ✨ 🎊</div><strong>YOU WON, YOU MAGNIFICENT BASTARD!</strong><div>🏆 '+esc(result.prize)+' 🏆</div>'}});
      },6500);
    }catch(e){spinning=false;$('spinTrigger').disabled=false;message('Spin failed: '+e.message)}
  });
  $('spinLaunch').addEventListener('click',async()=>{
    const name=$('spinPrizeName').value.trim();if(!name)return $('spinAdminMessage').textContent='Enter a prize name first.';
    if(!confirm('Launch a drawing for '+name+'? One secret winner is chosen immediately using CURRENT ticket balances. This cannot be rerolled.'))return;
    $('spinLaunch').disabled=true;
    try{await call('launch_card_captain_drawing',{p_prize_name:name});$('spinAdminMessage').textContent='✓ Drawing launched. The winner is secretly locked in. Everyone can now spin.';await refresh()}
    catch(e){$('spinAdminMessage').textContent=e.message;$('spinLaunch').disabled=false}
  });
  $('spinClose').addEventListener('click',async()=>{
    if(!active?.active||!confirm('Close this drawing? Managers who have not spun will no longer be able to reveal their result.'))return;
    try{await call('close_card_captain_drawing',{p_drawing_id:active.id});$('spinAdminMessage').textContent='Drawing closed.';await refresh()}catch(e){$('spinAdminMessage').textContent=e.message}
  });
  const priorGo=go;go=function(id){priorGo(id);if(id==='spin'||id==='admin')refresh()};
  renderNav();
  if(location.hash==='#spin')go('spin');
})();
