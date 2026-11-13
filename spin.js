/* Rose Prehall prize wheel. The server chooses one winner at launch. */
(function(){
  baseTabs.splice(baseTabs.findIndex(x=>x[0]==='history')+1,0,['spin','🎰','Spin']);
  privateScreens.add('spin');
  const screen=document.createElement('section');
  screen.className='screen';screen.dataset.screen='spin';
  screen.innerHTML='<div class="spin-stage"><div class="spin-kicker">ROSE PREHALL PRESENTS</div><h2>WHEEL OF FANTASY</h2><div id="spinPrize" class="spin-prize">Loading the prize vault…</div><div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="spin-wheel" id="spinWheel"><div class="wheel-center">🌹<small>SPIN</small></div></div></div><div id="spinOdds" class="spin-odds"></div><button class="btn yellow spin-trigger" id="spinTrigger" type="button" disabled>🎰 SPIN THE WHEEL 🎰</button><div id="spinResult" class="spin-result" aria-live="polite"></div></div>';
  document.querySelector('main.content').appendChild(screen);
  const admin=document.querySelector('[data-screen="admin"]');
  const panel=document.createElement('div');panel.className='panel spin-admin';
  panel.innerHTML='<span class="play-kicker">🎰 PRIZE DRAWINGS</span><h3>Launch the Wheel of Fantasy</h3><p>One prize, one secret winner, ticket-weighted odds. All managers can spin once to reveal their result. Tickets are not spent.</p><label>Prize name<input id="spinPrizeName" maxlength="120" placeholder="e.g. $25 gift card" /></label><button class="btn yellow" id="spinLaunch" type="button">🎟️ LAUNCH DRAWING</button><button class="btn blue" id="spinClose" type="button" hidden>Close Current Drawing</button><div id="spinAdminMessage" class="captain-message"></div><div id="spinAdminStatus" class="spin-admin-status"><p>Drawing status will appear here.</p></div><button class="btn blue" id="spinRefreshStatus" type="button">↻ Refresh Spin Status</button>';
  admin.insertBefore(panel,document.getElementById('adminMatchups'));
  const practice=document.createElement('div');
  practice.className='spin-practice';
  practice.innerHTML='<div class="spin-practice-title">🧪 COMMISSIONER PRACTICE MODE</div><p>Preview all three outcomes. No tickets, winners, or real drawings are affected.</p><div class="spin-practice-buttons"><button type="button" id="spinPracticeWin">🏆 TEST WINNER</button><button type="button" id="spinPracticeLose">☕ TEST LOSER</button><button type="button" id="spinPracticeDeny">⛔ TEST ZERO TICKETS</button></div><div class="spin-practice-note">PRACTICE ONLY · REPEAT AS OFTEN AS YOU WANT</div>';
  screen.querySelector('.spin-stage').appendChild(practice);
  let active=null,spinning=false,denialTimer=null,practiceTimer=null,practiceRunning=false,resultDismissed=false;
  const $=id=>document.getElementById(id);
  const message=(s)=>{$('spinResult').textContent=s;};
  function dismissOutcome(){resultDismissed=true;$('spinResult').className='spin-result';message('Result viewed.');}
  function addOutcomeClose(){const b=document.createElement('button');b.type='button';b.className='spin-outcome-close';b.textContent='✕ CLOSE';b.addEventListener('click',dismissOutcome);$('spinResult').appendChild(b);}
  function denySpin(){
    resultDismissed=false;
    const result=$('spinResult');
    if(denialTimer)clearTimeout(denialTimer);
    result.className='spin-result spin-denied';
    result.innerHTML='<div class="denied-siren">🚨 ⛔ 🚨 ⛔ 🚨</div><strong>ACCESS DENIED</strong><div class="denied-sub">ZERO TICKETS. ZERO SPINS.</div><div class="denied-footer">NO TICKEY. NO SPINNY. GET OUTTA HERE.</div>';
    addOutcomeClose();
    $('spinWheel').classList.add('wheel-rejected');
    denialTimer=setTimeout(()=>{$('spinWheel').classList.remove('wheel-rejected')},2600);
  }
  function practiceSpin(kind){
    if(practiceRunning)return;
    if(practiceTimer){clearTimeout(practiceTimer);practiceTimer=null;}
    const wheel=$('spinWheel');
    wheel.classList.remove('spin-rolling','wheel-rejected');
    if(kind==='deny'){denySpin();return;}
    resultDismissed=false;
    practiceRunning=true;
    practice.querySelectorAll('button').forEach(b=>b.disabled=true);
    $('spinResult').className='spin-result';
    message('🧪 PRACTICE SPIN — THE WHEEL IS DECIDING YOUR FAKE FATE…');
    void wheel.offsetWidth;
    wheel.classList.add('spin-rolling');
    practiceTimer=setTimeout(()=>{
      wheel.classList.remove('spin-rolling');
      showSpinOutcome(kind==='win','PRACTICE PRIZE — BRAGGING RIGHTS');
      practiceRunning=false;
      practice.querySelectorAll('button').forEach(b=>b.disabled=false);
      practiceTimer=null;
    },6500);
  }
  $('spinPracticeWin').addEventListener('click',()=>practiceSpin('win'));
  $('spinPracticeLose').addEventListener('click',()=>practiceSpin('lose'));
  $('spinPracticeDeny').addEventListener('click',()=>practiceSpin('deny'));
  const call=async(fn,args={})=>{const {data,error}=await client.rpc(fn,args);if(error)throw error;return data};
  function showSpinOutcome(won,prize){
    resultDismissed=false;
    const result=$('spinResult');
    result.className='spin-result '+(won?'spin-win':'spin-lose');
    if(won){
      result.innerHTML='<div class="spin-confetti">🎊 ✨ 🎉 💥 🏆 💥 🎉 ✨ 🎊</div><strong>YOU WON, YOU MAGNIFICENT BASTARD!</strong><div>🏆 '+esc(prize)+' 🏆</div><div class="spin-confetti">🎉 💰 🌹 🎉 💰 🌹 🎉</div>';
    }else{
      result.innerHTML='<strong>YOU WON ABSOLUTELY NOTHING.</strong><img class="spin-loser-gif" src="https://i.makeagif.com/media/3-31-2016/cE0QvT.gif" alt="Office Space losing reaction" loading="eager" onerror="this.style.display=\'none\';this.nextElementSibling.hidden=false"><a hidden class="spin-gif-fallback" href="https://makeagif.com/gif/milton-office-space-cE0QvT" target="_blank" rel="noopener noreferrer">WATCH THE OFFICE SPACE REACTION ↗</a><div>Here, let me just go ahead and get that ticket from you.</div>';
    }
    addOutcomeClose();
  }
  async function refreshAdminStatus(){
    if(!profile?.is_commissioner)return;
    const el=$('spinAdminStatus');
    try{
      const data=await call('get_commissioner_prize_drawing_status');
      if(!data.active){el.innerHTML='<p>No active drawing. Launch one above to lock in the winner and see spin activity.</p>';return;}
      const entries=data.managers||[];
      const spun=entries.filter(x=>x.spun).length;
      el.innerHTML='<div class="spin-admin-winner"><small>🔒 COMMISSIONER ONLY · SECRET WINNER</small><strong>🏆 '+esc(data.winner)+'</strong><span>'+esc(data.prize)+'</span></div>'+
        '<div class="spin-admin-count">🎰 '+spun+' / '+entries.length+' managers spun</div>'+
        '<div class="spin-admin-roster">'+entries.map(x=>
          '<div class="spin-admin-person"><span><strong>'+esc(x.manager)+'</strong><small>🎟️ '+Number(x.tickets)+' ticket'+(Number(x.tickets)===1?'':'s')+'</small></span>'+
          (x.spun?'<b class="spin-admin-done">✓ SPUN</b>':Number(x.tickets)===0?'<b class="spin-admin-zero">⛔ 0 TICKETS</b>':'<b class="spin-admin-wait">⏳ NOT YET</b>')+
          '</div>').join('')+'</div>';
    }catch(e){el.textContent='Could not load drawing status: '+e.message;}
  }
  $('spinRefreshStatus').addEventListener('click',refreshAdminStatus);
  async function refresh(){
    practice.hidden=!profile?.is_commissioner;
    if(!session?.user||!profile){message('Sign in to spin.');return}
    try{
      active=await call('get_card_captain_spin_state');
      $('spinPrize').textContent=active.active?'🏆 '+active.prize:'NO DRAWING ACTIVE';
      $('spinOdds').textContent=active.active?`YOUR TICKETS: ${active.tickets} / ${active.total_tickets} · ${active.total_tickets?((100*active.tickets/active.total_tickets).toFixed(1)):'0'}% ODDS`:'The commissioner has not launched a prize drawing.';
      $('spinTrigger').disabled=!active.active||active.spun||spinning;
      $('spinTrigger').textContent=active.active&&Number(active.tickets)===0?'⛔ TRY YOUR LUCK (0 TICKETS) ⛔':'🎰 SPIN THE WHEEL 🎰';
      if(active.active&&active.spun){if(!spinning&&!practiceRunning&&!resultDismissed)showSpinOutcome(active.won,active.prize)}
      else if(active.active&&!practiceRunning&&!resultDismissed){message(Number(active.tickets)===0?'You have zero tickets. Go ahead. Press it. I dare you.':'Your fate is sealed. Your spin is merely ceremonial.');$('spinResult').className='spin-result'}
      else if(!practiceRunning&&!resultDismissed){message('');$('spinResult').className='spin-result'}
      if(profile?.is_commissioner){$('spinClose').hidden=!active.active;$('spinLaunch').disabled=!!active.active;await refreshAdminStatus()}
    }catch(e){message('Could not load drawing: '+e.message)}
  }
  $('spinTrigger').addEventListener('click',async()=>{
    if(!active?.active||active.spun||spinning)return;
    if(Number(active.tickets)===0){denySpin();return;}
    resultDismissed=false;
    spinning=true;$('spinTrigger').disabled=true;message('THE WHEEL HAS SPOKEN… ALMOST.');
    try{
      const result=await call('spin_card_captain_prize',{p_drawing_id:active.id});
      const wheel=$('spinWheel');wheel.classList.remove('spin-rolling');void wheel.offsetWidth;wheel.classList.add('spin-rolling');
      setTimeout(()=>{
        spinning=false;wheel.classList.remove('spin-rolling');
        showSpinOutcome(result.won,result.prize);
        refresh();
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
  practice.hidden=true;
  renderNav();
  if(location.hash==='#spin')go('spin');
})();
