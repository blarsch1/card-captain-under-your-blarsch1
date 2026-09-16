// Commissioner-only historical week selector. Keeps public/live state untouched.
(function(){
  let selectedWeek=null;
  let adminWeekState=null;
  let loading=false;

  function liveWeek(){return Number(state?.week)||1}
  function currentAdminState(){return adminWeekState||state}
  function installSelector(){
    const summary=document.querySelector('[data-screen="admin"] .admin-summary');
    if(!summary||document.getElementById('adminWeekSelector'))return;
    const kicker=summary.querySelector('.play-kicker');
    if(!kicker)return;
    const wrap=document.createElement('div');
    wrap.id='adminWeekSelector';wrap.className='admin-week-selector';
    wrap.innerHTML='<button class="btn blue" id="adminPrevWeek" type="button">← Prior Week</button><strong id="adminSelectedWeekLabel">Current Week</strong><button class="btn blue" id="adminNextWeek" type="button">Next Week →</button>';
    kicker.insertAdjacentElement('afterend',wrap);
  }
  function syncControls(){
    installSelector();const week=selectedWeek||liveWeek();
    const prev=document.getElementById('adminPrevWeek'),next=document.getElementById('adminNextWeek'),label=document.getElementById('adminSelectedWeekLabel');
    if(prev)prev.disabled=loading||week<=1;if(next)next.disabled=loading||week>=liveWeek();
    if(label)label.textContent=week===liveWeek()?`Week ${week} · CURRENT`:`Week ${week} · HISTORY`;
  }
  async function renderSelectedWeek(){
    const s=currentAdminState();if(!s)return;
    const original=state;
    try{
      state=s;adminWeekId=s.week_id||null;
      const weekEl=document.getElementById('adminWeek');if(weekEl)weekEl.textContent=s.week||'—';
      const deadlineEl=document.getElementById('adminDeadline');if(deadlineEl)deadlineEl.textContent=deadlineLabel();
      await loadSubmissionIds();renderAdmin();await hydrateAdminScores();renderAdmin();
    }finally{state=original}
    syncControls();
  }
  async function loadWeek(week){
    week=Number(week);if(!profile?.is_commissioner||!Number.isInteger(week)||week<1||week>liveWeek())return;
    selectedWeek=week;loading=true;syncControls();adminMsg(`Loading Week ${week}…`);
    try{
      if(week===liveWeek()){adminWeekState=null;await loadLiveState();}
      else{const {data,error}=await client.rpc('get_commissioner_card_captain_week',{p_week_number:week});if(error)throw error;adminWeekState=data;}
      await renderSelectedWeek();adminMsg(week===liveWeek()?`Week ${week} control room loaded.`:`Week ${week} history loaded. Review unfinished matchups before finalizing.`,true);
    }catch(err){console.error('Historical admin week load failed',err);adminMsg(err.message||`Could not load Week ${week}.`)}finally{loading=false;syncControls()}
  }

  // admin.js reloads Admin whenever the public 15-second scoreboard refresh runs.
  // When viewing history, pin Admin to the selected historical data instead of
  // allowing that background refresh to replace it with the live week.
  const priorLoadAdmin=loadAdmin;
  loadAdmin=async function(){
    if(adminWeekState&&selectedWeek!==liveWeek())return renderSelectedWeek();
    return priorLoadAdmin();
  };

  document.addEventListener('click',e=>{if(e.target.closest('#adminPrevWeek'))loadWeek((selectedWeek||liveWeek())-1);if(e.target.closest('#adminNextWeek'))loadWeek((selectedWeek||liveWeek())+1)});
  const priorGo=go;go=function(id){priorGo(id);if(id==='admin'&&profile?.is_commissioner){selectedWeek=selectedWeek||liveWeek();setTimeout(()=>loadWeek(selectedWeek),0)}};

  const priorFinalize=finalizeMatchup;
  finalizeMatchup=async function(id){
    if(!adminWeekState)return priorFinalize(id);
    const original=state;state=adminWeekState;
    try{
      const m=(state.matchups||[]).find(x=>String(x.matchup_id)===String(id));if(!m)return adminMsg('Matchup could not be found.');
      const missing=!m.player_a||!m.player_b;let prompt;
      if(missing)prompt='Finalize this forfeit? The submitted manager can win regardless of score, and a ticket may move.';
      else{if(m.score_a==null||m.score_b==null)return adminMsg('Both Captain scores must be saved before finalizing.');prompt=`FINAL RESULT\n\n${matchupScoreSummary(m)}\n\nConfirm final result? This marks both cards played and cannot be edited afterward.`;}
      if(!confirm(prompt))return;adminMsg('Finalizing matchup…');
      const {data,error}=await client.rpc('finalize_card_captain_matchup',{p_matchup_id:id});if(error)throw error;
      await loadLiveState();const {data:fresh,error:freshErr}=await client.rpc('get_commissioner_card_captain_week',{p_week_number:selectedWeek});if(freshErr)throw freshErr;adminWeekState=fresh;await renderSelectedWeek();adminMsg(`✓ ${data?.result||'Matchup finalized.'}`,true);
    }catch(err){console.error(err);adminMsg(err.message||'Could not finalize matchup.')}finally{state=original}
  };

  window.cardCaptainAdminWeeks={loadWeek,current:()=>selectedWeek};setTimeout(()=>{installSelector();syncControls()},0);
})();
