// Finalized season history + played-card tracker. Opponent data comes only from the secure history RPC.
(function(){
  let seasonHistory=[];
  const resultLabel=r=>r==='win'?'WIN':r==='loss'?'LOSS':r==='tie_or_no_move'?'NO TICKET MOVE':'PENDING';
  const resultIcon=r=>r==='win'?'🏆':r==='loss'?'✕':r==='tie_or_no_move'?'🛡️':'⏳';
  const captain=(one,two,type)=>type==='dual_power'&&two?`${one} + ${two}`:(one||'No Captain');
  const ticket=v=>{const n=Number(v)||0;return n>0?`🎟️ +${n} ticket`:n<0?`🎟️ ${n} ticket`:'🎟️ No ticket moved'};

  async function loadSeasonHistory(){
    const el=document.getElementById('myHistory');
    if(!session?.user||!profile){seasonHistory=[];if(el)el.innerHTML='<div class="history-row"><strong>Sign in to see your history.</strong></div>';return}
    if(el)el.innerHTML='<div class="history-row"><strong>Loading season history…</strong></div>';
    const {data,error}=await client.rpc('get_my_card_captain_history');
    if(error){console.error('Season history load failed',error);if(el)el.innerHTML=`<div class="history-row"><strong>Could not load History.</strong><span>${esc(error.message||'Try again.')}</span></div>`;return}
    seasonHistory=Array.isArray(data)?data:[];renderSeasonHistory();renderBurnedCards();
  }
  function renderSeasonHistory(){
    const el=document.getElementById('myHistory');if(!el)return;
    if(!seasonHistory.length){el.innerHTML='<div class="history-row"><strong>No completed Captain history yet.</strong><span>Played weeks will appear here after the deadline.</span></div>';return}
    el.classList.add('season-history');
    el.innerHTML=seasonHistory.map(h=>{
      const mine=captain(h.my_captain,h.my_player_two,h.my_card_type),opp=captain(h.opponent_captain,h.opponent_player_two,h.opponent_card_type);
      const myScore=h.my_score==null?'—':fmtScore(h.my_score),oppScore=h.opponent_score==null?'—':fmtScore(h.opponent_score),final=h.matchup_status==='final';
      return `<article class="history-game ${esc(h.result||'pending')}"><div class="history-game-top"><span>WEEK ${Number(h.week)||'—'}</span><strong>${resultIcon(h.result)} ${resultLabel(h.result)}</strong></div><div class="history-versus"><div><small>YOUR CAPTAIN</small><b>${esc(mine)}</b><span>${esc(cardTypeLabel(h.my_card_type))}</span></div><div class="history-score"><b>${myScore}</b><em>VS</em><b>${oppScore}</b></div><div><small>${esc(h.opponent||'OPPONENT')}</small><b>${esc(opp)}</b><span>${esc(cardTypeLabel(h.opponent_card_type))}</span></div></div><div class="history-ticket">${final?ticket(h.ticket_change):'⏳ Awaiting finalization'}</div></article>`;
    }).join('');
  }
  function renderBurnedCards(){
    const el=document.getElementById('myCards');if(!el||!profile)return;
    const used=(myCards||[]).filter(c=>c.week_number).sort((a,b)=>Number(b.week_number)-Number(a.week_number));
    if(!used.length){el.innerHTML='<div class="panel">No cards burned yet. Once a physical card is played, it stays here for the season.</div>';return}
    el.innerHTML=used.map(c=>{
      const h=seasonHistory.find(x=>Number(x.week)===Number(c.week_number));
      const res=h?resultLabel(h.result):String(c.submission_status||'PLAYED').toUpperCase();
      return `<article class="panel played-card burned-card">${c.photo_url?`<img src="${esc(c.photo_url)}" alt="${esc(c.card_label)} card photo" class="played-card-photo" />`:'<div class="played-card-photo missing-photo">🃏</div>'}<div class="played-card-body"><span class="play-kicker">🔥 BURNED · WEEK ${Number(c.week_number)}</span><h3>${esc(c.card_label)}</h3><strong>${esc(cardTypeLabel(c.card_type))}</strong><small>${c.opponent?`vs ${esc(c.opponent)} · `:''}${esc(res)}${c.total_score!=null?` · ${fmtScore(c.total_score)} PPR`:''}</small><small>This physical card cannot be played again this season.</small></div></article>`;
    }).join('');
  }

  // app.js owns the original renderer and can run again after navigation/auth refresh.
  // Wrap it once so the richer History remains authoritative after any later card reload.
  const baseRenderMyCards=renderMyCards;
  renderMyCards=function(error=''){
    baseRenderMyCards(error);
    if(error||!session?.user||!profile)return;
    if(seasonHistory.length){renderSeasonHistory();renderBurnedCards();}
  };

  const baseGo=go;
  go=function(id){
    baseGo(id);
    if((id==='history'||id==='cards')&&session?.user&&profile){
      setTimeout(loadSeasonHistory,0);
    }
  };

  window.cardCaptainSeasonHistory={reload:loadSeasonHistory};
})();
