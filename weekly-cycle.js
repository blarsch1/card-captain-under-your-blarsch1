// Card Captain weekly rhythm: Tue = commissioner review, Wed 6:00 AM CT = next week.
// The database is the source of truth for the active week. This layer only presents the phase.
(function(){
  const CT='America/Chicago';
  function ctParts(d=new Date()){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:CT,weekday:'short',hour:'numeric',hour12:false}).formatToParts(d);
    const get=t=>parts.find(p=>p.type===t)?.value;
    return {day:get('weekday'),hour:Number(get('hour'))};
  }
  function phase(){
    const {day,hour}=ctParts();
    if(day==='Tue')return 'review';
    if(day==='Wed'&&hour<6)return 'review';
    return 'live';
  }
  function cycleWeek(baseWeek){
    // Backend get_card_captain_week_number() owns rollover now.
    return Number(baseWeek||1);
  }
  function applyCycle(){
    const p=phase();
    const base=Number(state.week||1);
    document.documentElement.dataset.weekPhase=p;
    const eyebrow=document.querySelector('.hero .eyebrow');
    if(eyebrow){
      if(p==='review')eyebrow.textContent=`WEEK ${base} · REVIEW DAY`;
      else eyebrow.textContent=`WEEK ${base} · ${String(state.week_status||'OPEN').toUpperCase()}`;
    }
    const badge=document.querySelector('.live-badge');
    if(badge)badge.innerHTML=p==='review'?'<span class="live-dot"></span> TUESDAY · SCORE REVIEW':'<span class="live-dot"></span> LIVE · PPR SCOREBOARD';
    const playHead=document.querySelector('[data-screen="play"] .section-head span');
    if(playHead)playHead.textContent=p==='review'?'Next week opens Wednesday at 6:00 AM CT':'Locks at first NFL kickoff';
    const form=document.getElementById('captainForm');
    if(p==='review'){
      if(form)form.hidden=true;
      const ctx=document.getElementById('playContext');
      if(ctx)ctx.innerHTML=`<div><span class="play-kicker">WEEK ${base} · REVIEW DAY</span><strong>Commissioner score review</strong><small>Week ${base+1} opens Wednesday at 6:00 AM CT.</small></div>`;
    }else if(form){
      // Let the normal Play/Change Captain renderers decide whether a live-week form should be visible.
      // Do not carry Tuesday's forced hidden state into Wednesday.
      const hasCaptain=typeof mySubmittedCaptain==='function'&&mySubmittedCaptain();
      form.hidden=!!hasCaptain;
    }
    const adminSummary=document.querySelector('.admin-summary');
    if(adminSummary&&p==='review'){
      const kicker=adminSummary.querySelector('.play-kicker');
      if(kicker)kicker.innerHTML=`WEEK <b id="adminWeek">${base}</b> · TUESDAY REVIEW`;
    }
  }
  const priorRender=renderState;
  renderState=function(){priorRender();applyCycle()};
  const priorPlay=renderPlayContext;
  renderPlayContext=function(){priorPlay();applyCycle()};
  window.cardCaptainWeeklyCycle={phase,cycleWeek,applyCycle};
  setInterval(applyCycle,60000);
  applyCycle();
})();
