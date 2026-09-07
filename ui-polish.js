// Home hero polish: live countdown to the official weekly Captain deadline.
(function(){
  let timer=null;

  function formatRemaining(ms){
    if(ms<=0)return '00:00:00';
    const total=Math.floor(ms/1000);
    const days=Math.floor(total/86400);
    const hours=Math.floor((total%86400)/3600);
    const minutes=Math.floor((total%3600)/60);
    const seconds=total%60;
    const hh=String(hours).padStart(2,'0');
    const mm=String(minutes).padStart(2,'0');
    const ss=String(seconds).padStart(2,'0');
    return days>0?`${days}D ${hh}:${mm}:${ss}`:`${hh}:${mm}:${ss}`;
  }

  function ensureCountdown(){
    const hero=document.querySelector('.hero');
    const live=hero?.querySelector('.live-badge');
    if(!hero||!live)return null;

    let row=hero.querySelector('.hero-status-row');
    if(!row){
      row=document.createElement('div');
      row.className='hero-status-row';
      live.parentNode.insertBefore(row,live);
      row.appendChild(live);
    }

    let countdown=row.querySelector('.kickoff-countdown');
    if(!countdown){
      countdown=document.createElement('div');
      countdown.className='kickoff-countdown';
      row.appendChild(countdown);
    }
    return countdown;
  }

  function renderCountdown(){
    const el=ensureCountdown();
    if(!el)return;
    const deadline=state?.deadline_at?new Date(state.deadline_at).getTime():NaN;
    if(!Number.isFinite(deadline)){
      el.innerHTML='<span>Captain deadline</span><strong>—</strong>';
      return;
    }
    const remaining=deadline-Date.now();
    if(remaining<=0){
      el.innerHTML='<span>Captain deadline</span><strong>LOCKED</strong>';
      return;
    }
    el.innerHTML=`<span>Locks in</span><strong>${formatRemaining(remaining)}</strong>`;
  }

  const priorRenderState=renderState;
  renderState=function(){
    priorRenderState();
    renderCountdown();
  };

  renderCountdown();
  timer=setInterval(renderCountdown,1000);
})();
