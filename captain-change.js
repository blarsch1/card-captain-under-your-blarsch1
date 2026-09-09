let changingCaptain=false;

function captainDeadlineOpen(){
  if(!state?.deadline_at)return true;
  const deadline=new Date(state.deadline_at).getTime();
  return Number.isFinite(deadline)&&Date.now()<deadline;
}

function resetChangeMode(){
  changingCaptain=false;
  const form=document.getElementById('captainForm');
  const submit=document.getElementById('captainSubmit');
  if(submit)submit.textContent='⚡ Play Captain';
  if(form)form.hidden=!!mySubmittedCaptain();
  setCaptainMessage('');
  resetCaptainForm();
  renderPlayContext();
}

function mySubmittedCaptain(){
  const m=myCurrentMatchup();
  if(!m||!profile)return null;
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
  if(!mine)return;
  const existing=el.querySelector('#changeCaptainButton');
  if(existing)existing.remove();
  if(!captainDeadlineOpen()){
    form.hidden=true;
    return;
  }
  const btn=document.createElement('button');
  btn.id='changeCaptainButton';
  btn.type='button';
  btn.className='btn blue change-captain-btn';
  btn.textContent='↻ Change Captain';
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
