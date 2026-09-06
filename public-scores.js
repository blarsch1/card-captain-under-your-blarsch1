let sleeperScoreRefreshTimer=null;
let sleeperPlayerDirectory=null;
let sleeperScoresLoading=false;

function sleeperNormalizeName(v=''){
  return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}

function sleeperSubmittedNames(){
  const names=[];
  (state.matchups||[]).forEach(m=>{
    if(m.card_type_a!=='autograph_defense'){
      if(m.player_a)names.push(m.player_a);
      if(m.player_a_two)names.push(m.player_a_two);
    }
    if(m.card_type_b!=='autograph_defense'){
      if(m.player_b)names.push(m.player_b);
      if(m.player_b_two)names.push(m.player_b_two);
    }
  });
  return [...new Set(names)];
}

async function sleeperDirectory(){
  if(sleeperPlayerDirectory)return sleeperPlayerDirectory;
  const res=await fetch('https://api.sleeper.app/v1/players/nfl');
  if(!res.ok)throw new Error('Sleeper player directory unavailable');
  const players=await res.json();
  const byName=new Map();
  Object.entries(players||{}).forEach(([id,p])=>{
    const full=p?.full_name||[p?.first_name,p?.last_name].filter(Boolean).join(' ');
    if(full)byName.set(sleeperNormalizeName(full),id);
  });
  sleeperPlayerDirectory=byName;
  return byName;
}

function sleeperSideScore(m,side,scoreByName){
  const type=side==='a'?m.card_type_a:m.card_type_b;
  const p1=side==='a'?m.player_a:m.player_b;
  const p2=side==='a'?m.player_a_two:m.player_b_two;
  if(!p1||type==='autograph_defense')return null;
  const s1=scoreByName.get(sleeperNormalizeName(p1));
  if(type==='dual_power'){
    const s2=p2?scoreByName.get(sleeperNormalizeName(p2)):undefined;
    if(!Number.isFinite(s1)||!Number.isFinite(s2))return null;
    return s1+s2;
  }
  return Number.isFinite(s1)?s1:null;
}

function decorateSleeperScores(){
  document.querySelectorAll('.matchup-card').forEach((card,i)=>{
    const m=(state.matchups||[])[i];
    if(!m)return;
    const rows=card.querySelectorAll('.team-row');
    if(m._sleeper_a&&rows[0]){
      const score=rows[0].querySelector('.score');
      if(score&&!rows[0].querySelector('.score-source'))score.insertAdjacentHTML('afterend','<small class="score-source">SLEEPER LIVE</small>');
    }
    if(m._sleeper_b&&rows[1]){
      const score=rows[1].querySelector('.score');
      if(score&&!rows[1].querySelector('.score-source'))score.insertAdjacentHTML('afterend','<small class="score-source">SLEEPER LIVE</small>');
    }
  });
}

async function refreshPublicSleeperScores(){
  if(sleeperScoresLoading)return;
  const requested=sleeperSubmittedNames();
  if(!requested.length)return;
  sleeperScoresLoading=true;
  try{
    const week=Number(state.week)||1;
    const season=2026;
    const [byName,statsRes]=await Promise.all([
      sleeperDirectory(),
      fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`)
    ]);
    if(!statsRes.ok)throw new Error('Sleeper weekly stats unavailable');
    const stats=await statsRes.json();
    const scoreByName=new Map();
    requested.forEach(name=>{
      const id=byName.get(sleeperNormalizeName(name));
      const raw=id?stats?.[id]?.pts_ppr:undefined;
      const n=Number(raw);
      if(id&&raw!==null&&raw!==undefined&&Number.isFinite(n))scoreByName.set(sleeperNormalizeName(name),n);
    });

    let changed=false;
    (state.matchups||[]).forEach(m=>{
      const a=sleeperSideScore(m,'a',scoreByName);
      const b=sleeperSideScore(m,'b',scoreByName);
      if(a!==null){m.score_a=a;m._sleeper_a=true;changed=true}else m._sleeper_a=false;
      if(b!==null){m.score_b=b;m._sleeper_b=true;changed=true}else m._sleeper_b=false;
    });
    if(changed)renderState();
  }catch(err){
    console.warn('Public Sleeper score refresh skipped',err);
  }finally{
    sleeperScoresLoading=false;
  }
}

const publicScoreRenderState=renderState;
renderState=function(){
  publicScoreRenderState();
  decorateSleeperScores();
};

setTimeout(refreshPublicSleeperScores,1200);
sleeperScoreRefreshTimer=setInterval(refreshPublicSleeperScores,60000);
