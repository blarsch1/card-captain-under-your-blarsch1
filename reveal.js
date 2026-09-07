// Card Captain reveal gate: keep opponent Captain identities hidden until the official weekly deadline.
(function(){
  function revealOpen(){
    if(typeof state?.captains_revealed==='boolean') return state.captains_revealed;
    if(state?.deadline_at){
      const deadline=new Date(state.deadline_at).getTime();
      return Number.isFinite(deadline) && Date.now()>=deadline;
    }
    return false;
  }

  function sideSubmitted(m,side){
    const key=side==='a'?'submitted_a':'submitted_b';
    if(typeof m?.[key]==='boolean') return m[key];
    const alt=side==='a'?'captain_submitted_a':'captain_submitted_b';
    if(typeof m?.[alt]==='boolean') return m[alt];
    const player=side==='a'?m?.player_a:m?.player_b;
    const type=side==='a'?m?.card_type_a:m?.card_type_b;
    return Boolean(player||type);
  }

  function sideLabel(m,side){
    const p1=side==='a'?m.player_a:m.player_b;
    const p2=side==='a'?m.player_a_two:m.player_b_two;
    const type=side==='a'?m.card_type_a:m.card_type_b;
    if(revealOpen()) return captainLabel(p1,p2,type);
    return sideSubmitted(m,side)?'🔒 Captain submitted':'Captain pending';
  }

  matchupCard=function(m,i){
    const revealed=revealOpen();
    const a=Number(m.score_a),b=Number(m.score_b);
    const aHas=revealed&&m.score_a!==null&&m.score_a!==undefined&&Number.isFinite(a);
    const bHas=revealed&&m.score_b!==null&&m.score_b!==undefined&&Number.isFinite(b);
    const aWin=aHas&&bHas&&a>b,bWin=aHas&&bHas&&b>a;
    const status=revealed?(state.demo_mode?'DEMO LIVE':esc(m.matchup_status||'LIVE').toUpperCase()):'CAPTAINS HIDDEN';
    return `<article class="panel matchup-card"><div class="matchup-top"><span>MATCHUP ${i+1}</span><span>${status}</span></div><div class="team-row ${aWin?'winner':''}"><div><div class="manager-name">${esc(m.manager_a)}</div><div class="captain-name">${esc(sideLabel(m,'a'))}</div></div><div class="score">${revealed?fmtScore(m.score_a):''}</div></div><div class="team-row ${bWin?'winner':''}"><div><div class="manager-name">${esc(m.manager_b)}</div><div class="captain-name">${esc(sideLabel(m,'b'))}</div></div><div class="score">${revealed?fmtScore(m.score_b):''}</div></div></article>`;
  };

  renderPlayContext=function(){
    const el=document.getElementById('playContext');
    const form=document.getElementById('captainForm');
    if(!el)return;
    if(!profile){
      el.innerHTML='<strong>Sign in to see your matchup.</strong>';
      if(form)form.hidden=false;
      return;
    }
    const m=myCurrentMatchup();
    if(!m){
      el.innerHTML=`<strong>Week ${state.week||1}</strong><span>No matchup found for ${esc(profile.display_name)}.</span>`;
      if(form)form.hidden=false;
      return;
    }
    const mineIsA=m.manager_a===profile.display_name;
    const opponent=mineIsA?m.manager_b:m.manager_a;
    const submitted=sideSubmitted(m,mineIsA?'a':'b');
    const myWeekCard=(myCards||[]).find(c=>Number(c.week_number)===Number(state.week));
    if(submitted){
      const ownLabel=myWeekCard?.card_label||'Captain submitted';
      el.innerHTML=`<div><span class="play-kicker">⚡ WEEK ${state.week||1} CAPTAIN LOCKED IN</span><strong>${esc(ownLabel)}</strong><small>vs ${esc(opponent)} · Your Captain is hidden from your opponent until the weekly deadline.</small></div>`;
      if(form)form.hidden=true;
    }else{
      el.innerHTML=`<div><span class="play-kicker">WEEK ${state.week||1} MATCHUP</span><strong>${esc(profile.display_name)} <em>vs</em> ${esc(opponent)}</strong><small>Your Captain will stay secret until the weekly deadline.</small></div>`;
      if(form)form.hidden=false;
    }
  };

  const originalLoadMyCards=loadMyCards;
  loadMyCards=async function(){
    const result=await originalLoadMyCards.apply(this,arguments);
    renderPlayContext();
    return result;
  };

  const originalRenderState=renderState;
  renderState=function(){
    originalRenderState();
    const banner=document.querySelector('.preview-banner');
    if(banner&&!revealOpen()) banner.textContent=`LIVE SUPABASE DATA · Week ${state.week||1} · Captains reveal at the weekly deadline · Unused cards remain private`;
  };

  renderState();
})();
