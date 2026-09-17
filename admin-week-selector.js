// Commissioner historical week control. Historical Admin rendering never mutates live public state.
(function(){
  let selectedWeek=null, historical=null, loading=false;
  const liveWeek=()=>Number(state?.week)||1;
  const isHistory=()=>!!historical&&Number(selectedWeek)!==liveWeek();
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  const score=v=>v==null?'':Number(v).toFixed(2);
  const deadlineText=s=>{if(!s?.deadline_at)return 'Deadline not set';try{return new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(s.deadline_at))}catch{return 'first NFL kickoff'}};

  function install(){
    const summary=document.querySelector('[data-screen="admin"] .admin-summary');if(!summary||document.getElementById('adminWeekSelector'))return;
    const kicker=summary.querySelector('.play-kicker');if(!kicker)return;
    const wrap=document.createElement('div');wrap.id='adminWeekSelector';wrap.className='admin-week-selector';
    wrap.innerHTML='<button class="btn blue" id="adminPrevWeek" type="button">← Prior Week</button><strong id="adminSelectedWeekLabel">Current Week</strong><button class="btn blue" id="adminNextWeek" type="button">Next Week →</button>';
    kicker.insertAdjacentElement('afterend',wrap);
  }
  function controls(){
    install();const w=selectedWeek||liveWeek(),p=document.getElementById('adminPrevWeek'),n=document.getElementById('adminNextWeek'),l=document.getElementById('adminSelectedWeekLabel');
    if(p)p.disabled=loading||w<=1;if(n)n.disabled=loading||w>=liveWeek();if(l)l.textContent=w===liveWeek()?`Week ${w} · CURRENT`:`Week ${w} · HISTORY`;
  }
  function side(m,side,late){
    const name=side==='a'?m.manager_a:m.manager_b,p1=side==='a'?m.player_a:m.player_b,p2=side==='a'?m.player_a_two:m.player_b_two,type=side==='a'?m.card_type_a:m.card_type_b,total=side==='a'?m.score_a:m.score_b,sub=side==='a'?m.submission_a_id:m.submission_b_id;
    if(!p1)return `<div class="admin-side ${late?'forfeit':'pending'}"><strong>${esc(name)}</strong><span>${late?'🚫 MISSED DEADLINE · FORFEIT':'⏳ Captain not submitted'}</span></div>`;
    if(type==='autograph_defense')return `<div class="admin-side defense"><strong>${esc(name)}</strong><span>🛡️ ${esc(p1)} · DEFENSE</span><small>Pure protection · no ticket movement</small></div>`;
    return `<div class="admin-side" data-side="${side}"><strong>${esc(name)}</strong><div class="captain-correction"><label>Captain name<input class="admin-player-name" value="${esc(p1)}" data-original="${esc(p1)}" /></label>${sub?`<button class="btn blue correct-captain" type="button" data-submission="${esc(sub)}">Correct Captain</button>`:''}</div>${[p1,p2].filter(Boolean).map((p,i)=>`<label>${esc(p)} PPR<input class="admin-score" type="number" step="0.01" inputmode="decimal" data-player="${esc(p)}" placeholder="0.00" value="${i===0?score(total):''}" /></label>`).join('')}<small>${type==='dual_power'?'⚡ Dual Power':'🏈 Player Card'}${total!=null?` · Current ${Number(total).toFixed(2)}`:' · No score saved yet'}</small></div>`;
  }
  function renderHistory(){
    if(!isHistory())return;
    const s=historical,root=document.getElementById('adminMatchups');if(!root)return;
    const w=document.getElementById('adminWeek');if(w)w.textContent=s.week;
    const d=document.getElementById('adminDeadline');if(d)d.textContent=deadlineText(s);
    const late=!!s.deadline_at&&Date.now()>=new Date(s.deadline_at).getTime();
    root.innerHTML=(s.matchups||[]).map((m,i)=>{const a=!!m.player_a,b=!!m.player_b,submitted=a&&b,final=String(m.matchup_status||'').toLowerCase()==='final',one=a!==b,both=!a&&!b;let status=final?'FINAL':submitted?'READY':late?(one?'FORFEIT':both?'DOUBLE FORFEIT':'READY'):'WAITING';return `<article class="panel admin-matchup"><div class="matchup-top"><span>MATCHUP ${i+1}</span><span>${status}</span></div><h3>${esc(m.manager_a)} <em>vs</em> ${esc(m.manager_b)}</h3>${side(m,'a',late&&!a)}${side(m,'b',late&&!b)}<div class="admin-actions"><button class="btn blue history-save-scores" data-matchup="${esc(m.matchup_id)}" ${final||!submitted?'disabled':''}>Save / Update Scores</button><button class="btn yellow history-finalize" data-matchup="${esc(m.matchup_id)}" ${final||(!submitted&&!late)?'disabled':''}>${late&&!submitted?'Finalize Forfeit':'Review & Finalize'}</button></div></article>`}).join('')||'<div class="panel">No matchups found for this week.</div>';
    controls();
  }
  async function fetchHistory(week){const {data,error}=await client.rpc('get_commissioner_card_captain_week',{p_week_number:Number(week)});if(error)throw error;return data}
  async function loadWeek(week){
    week=Number(week);if(!profile?.is_commissioner||!Number.isInteger(week)||week<1||week>liveWeek())return;
    selectedWeek=week;loading=true;controls();adminMsg(`Loading Week ${week}…`);
    try{
      if(week===liveWeek()){historical=null;await loadAdmin();adminMsg(`Week ${week} control room loaded.`,true)}
      else{historical=await fetchHistory(week);renderHistory();adminMsg(`Week ${week} history loaded. Review unfinished matchups before finalizing.`,true)}
    }catch(err){console.error(err);adminMsg(err.message||`Could not load Week ${week}.`)}finally{loading=false;controls()}
  }
  async function saveHistorical(card){
    if(!isHistory())return;const inputs=[...card.querySelectorAll('.admin-score')];adminMsg('Saving historical scores…');
    try{for(const input of inputs){const v=input.value===''?0:Number(input.value);if(!Number.isFinite(v))throw new Error(`Invalid score for ${input.dataset.player}.`);const {error}=await client.rpc('set_weekly_player_score',{p_week_id:historical.week_id,p_player_name:input.dataset.player,p_ppr_score:v,p_source:'manual'});if(error)throw error}historical=await fetchHistory(selectedWeek);renderHistory();adminMsg('✓ Scores saved.',true)}catch(err){console.error(err);adminMsg(err.message||'Could not save scores.')}
  }
  async function finalizeHistorical(id){
    const m=(historical?.matchups||[]).find(x=>String(x.matchup_id)===String(id));if(!m)return adminMsg('Matchup could not be found.');
    if(m.player_a&&m.player_b&&(m.score_a==null||m.score_b==null))return adminMsg('Both Captain scores must be saved before finalizing.');
    let text=(!m.player_a||!m.player_b)?'Finalize this forfeit? The submitted manager can win regardless of score, and a ticket may move.':`FINAL RESULT\n\n${m.manager_a} — ${m.player_a}: ${Number(m.score_a).toFixed(2)}\n${m.manager_b} — ${m.player_b}: ${Number(m.score_b).toFixed(2)}\n\nConfirm final result? This marks both cards played and cannot be edited afterward.`;
    if(!confirm(text))return;adminMsg('Finalizing matchup…');
    try{const {data,error}=await client.rpc('finalize_card_captain_matchup',{p_matchup_id:id});if(error)throw error;historical=await fetchHistory(selectedWeek);renderHistory();await loadLiveState();renderHistory();adminMsg(`✓ ${data?.result||'Matchup finalized.'}`,true)}catch(err){console.error(err);adminMsg(err.message||'Could not finalize matchup.')}
  }

  // The existing Admin renderer is allowed to update only the live week. Any live
  // refresh that fires while History is selected is immediately overwritten by
  // this independent historical renderer; it never swaps or mutates global state.
  const oldRenderState=renderState;renderState=function(){oldRenderState();if(isHistory())queueMicrotask(renderHistory)};
  const oldLoadAdmin=loadAdmin;loadAdmin=async function(){if(isHistory()){renderHistory();return}return oldLoadAdmin()};

  document.addEventListener('click',e=>{
    if(e.target.closest('#adminPrevWeek')){e.preventDefault();e.stopImmediatePropagation();loadWeek((selectedWeek||liveWeek())-1);return}
    if(e.target.closest('#adminNextWeek')){e.preventDefault();e.stopImmediatePropagation();loadWeek((selectedWeek||liveWeek())+1);return}
    const save=e.target.closest('.history-save-scores');if(save){e.preventDefault();e.stopImmediatePropagation();saveHistorical(save.closest('.admin-matchup'));return}
    const fin=e.target.closest('.history-finalize');if(fin){e.preventDefault();e.stopImmediatePropagation();finalizeHistorical(fin.dataset.matchup);return}
  },true);

  const oldGo=go;go=function(id){oldGo(id);if(id==='admin'&&profile?.is_commissioner){selectedWeek=selectedWeek||liveWeek();setTimeout(()=>loadWeek(selectedWeek),0)}};
  window.cardCaptainAdminWeeks={loadWeek,current:()=>selectedWeek};setTimeout(()=>{install();controls()},0);
})();
