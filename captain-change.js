let changingCaptain=false;

function captainDeadlineOpen(){
  if(!state?.deadline_at)return true;
  const deadline=new Date(state.deadline_at).getTime();
  return Number.isFinite(deadline)&&Date.now()<deadline;
}

function mySubmittedCaptain(){
  if(!profile)return null;

  // Before the weekly reveal, the public matchup state intentionally hides
  // Captain names. Use the manager's private card history first so the owner
  // can still manage their own submitted Captain without exposing it publicly.
  const privateCard=(myCards||[]).find(c=>Number(c.week_number)===Number(state.week));
  if(privateCard){
    return {
      player_one:privateCard.player_one||privateCard.card_label||'Current Captain',
      player_two:privateCard.player_two||null,
      card_type:privateCard.card_type||'player',
      opponent:privateCard.opponent||null
    };
  }

  // After reveal, the public matchup state can also identify the Captain.
  const m=myCurrentMatchup();
  if(!m)return null;
  const mineIsA=m.manager_a===profile.display_name;
  const player=mineIsA?m.player_a:m.player_b;
  if(!player)return null;
  return {
    player_one:player,
    player_two:mineIsA?m.player_a_two:m.player_b_two,
    card_type:mineIsA?m.card_type_a:m.card_type_b,
    opponent:mineIsA?m.manager_b:m.manager_a
  };
}

function decorateChangeCaptain(){
  const el=document.getElementById('playContext');
  const form=document.getElementById('captainForm');
  if(!el||!form||!profile)return;
  const mine=mySubmittedCaptain();
  const old=el.querySelector('#changeCaptainButton');
  if(old)old.remove();
  if(!mine)return;

  // A submitted Captain should stay hidden from the replacement form until the
  // manager deliberately chooses to change it.
  if(!changingCaptain)form.hidden=true;

  if(!captainDeadlineOpen()){
    changingCaptain=false;
    form.hidden=true;
    return;
  }

  const btn=document.createElement('button');
  btn.id='changeCaptainButton';
  btn.type='button';
  btn.className='btn blue change-captain-btn';
  btn.textContent='↻ Change Captain';
  btn.style.marginTop='10px';
  btn.addEventListener('click',()=>{
    changingCaptain=true;
    form.hidden=false;
    resetCaptainForm();
    const submit=document.getElementById('captainSubmit');
    if(submit)submit.textContent='↻ Replace Captain';
    setCaptainMessage('Choose your replacement card. Your current Captain stays active until the replacement is successfully saved.');
    form.scrollIntoView({behavior:'smooth',block:'start'});
  });
  el.appendChild(btn);
}

const originalRenderPlayContext=renderPlayContext;
renderPlayContext=function(){
  originalRenderPlayContext();
  setTimeout(decorateChangeCaptain,0);
};

// Re-run the decoration after the signed-in manager's private card history
// arrives. This is what makes Change Captain available before the public reveal.
const originalLoadMyCardsForChange=loadMyCards;
loadMyCards=async function(){
  const result=await originalLoadMyCardsForChange();
  decorateChangeCaptain();
  return result;
};

const originalSubmitCaptain=submitCaptain;
submitCaptain=async function(event){
  if(!changingCaptain)return originalSubmitCaptain(event);
  event.preventDefault();
  if(!session?.user||!profile){openAuth('signin');return}
  if(!captainDeadlineOpen()){
    changingCaptain=false;
    renderPlayContext();
    return setCaptainMessage('Captain changes are closed for this week.');
  }
  const photo=document.getElementById('cardPhoto').files[0];
  const cardType=document.getElementById('cardType').value;
  const playerOne=document.getElementById('playerOne').value.trim();
  const playerTwo=document.getElementById('playerTwo').value.trim();
  if(!photo)return setCaptainMessage('Take or upload the replacement card photo first.');
  if(!playerOne)return setCaptainMessage('Enter Player 1.');
  if(cardType==='dual_power'&&!playerTwo)return setCaptainMessage('Dual Power cards need Player 2.');
  if(!confirm(`Replace your current Week ${state.week||1} Captain with ${cardType==='dual_power'?`${playerOne} + ${playerTwo}`:playerOne}?\n\nYour old card will be released and can be played in a future week.`))return;
  const button=document.getElementById('captainSubmit');
  button.disabled=true;
  button.textContent='Uploading replacement…';
  setCaptainMessage('');
  let photoPath=null;
  try{
    const ext=safeExtension(photo);
    photoPath=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await client.storage.from('card-photos').upload(photoPath,photo,{cacheControl:'3600',upsert:false,contentType:photo.type||undefined});
    if(uploadError)throw new Error(`Photo upload failed: ${uploadError.message}`);
    button.textContent='Changing Captain…';
    const {error}=await client.rpc('change_captain',{
      p_card_type:cardType,
      p_player_one:playerOne,
      p_player_two:cardType==='dual_power'?playerTwo:null,
      p_photo_path:photoPath,
      p_physical_fingerprint:typeof cardPhysicalFingerprint!=='undefined'?cardPhysicalFingerprint:null,
      p_card_label:cardType==='dual_power'?`${playerOne} + ${playerTwo}`:playerOne
    });
    if(error)throw error;
    changingCaptain=false;
    resetCaptainForm();
    await loadLiveState();
    await loadMyCards();
    renderPlayContext();
    setCaptainMessage('✓ Captain changed. Your previous card is available to use later.',true);
  }catch(err){
    console.error('Captain change failed',err);
    setCaptainMessage(err?.message||'Could not change Captain. Your original Captain is still active.');
    if(photoPath){
      try{await client.storage.from('card-photos').remove([photoPath])}catch(cleanupErr){console.warn('Replacement photo cleanup failed',cleanupErr)}
    }
  }finally{
    button.disabled=false;
    button.textContent=changingCaptain?'↻ Replace Captain':'⚡ Play Captain';
  }
};

const captainForm=document.getElementById('captainForm');
if(captainForm){
  captainForm.removeEventListener('submit',originalSubmitCaptain);
  captainForm.addEventListener('submit',e=>submitCaptain(e));
}

document.addEventListener('click',e=>{
  if(changingCaptain&&e.target.closest('[data-nav]')&&!e.target.closest('[data-nav="play"]'))changingCaptain=false;
});

setInterval(()=>{
  if(profile&&mySubmittedCaptain()&&!captainDeadlineOpen()){
    changingCaptain=false;
    renderPlayContext();
  }
},15000);
