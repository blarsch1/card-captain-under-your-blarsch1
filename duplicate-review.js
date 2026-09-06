let duplicateReviewLoading=false;
let duplicateReviews=[];

function ensureDuplicateReviewPanel(){
  const admin=document.querySelector('[data-screen="admin"]');
  if(!admin)return null;
  let panel=document.getElementById('duplicateReviewPanel');
  if(panel)return panel;
  const matchups=document.getElementById('adminMatchups');
  panel=document.createElement('div');
  panel.id='duplicateReviewPanel';
  panel.className='panel duplicate-review-panel';
  panel.innerHTML=`<div class="duplicate-review-head"><div><span class="play-kicker">PHYSICAL CARD CHECK</span><h3>🕵️ Duplicate Review</h3></div><span id="duplicateReviewCount" class="duplicate-count">—</span></div><p class="duplicate-review-copy">Only cards flagged as possible physical-card reuse appear here. A flag never blocks a TNF submission.</p><div id="duplicateReviewList"><div class="duplicate-empty">Checking for flagged cards…</div></div><div id="duplicateReviewMessage" class="captain-message"></div>`;
  if(matchups)matchups.insertAdjacentElement('beforebegin',panel);else admin.appendChild(panel);
  ensureDuplicateReviewStyles();
  return panel;
}

function ensureDuplicateReviewStyles(){
  if(document.getElementById('duplicateReviewStyles'))return;
  const style=document.createElement('style');
  style.id='duplicateReviewStyles';
  style.textContent=`
  .duplicate-review-panel{margin:12px 0;border-left:5px solid var(--yellow)}
  .duplicate-review-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .duplicate-review-head h3{margin:3px 0 0;font-family:Impact,"Arial Black",system-ui,sans-serif;text-transform:uppercase;font-size:23px}
  .duplicate-count{display:grid;place-items:center;min-width:38px;height:38px;padding:0 9px;border:2px solid #090910;background:var(--yellow);color:#111;font-family:Impact,"Arial Black",system-ui,sans-serif;font-size:21px;box-shadow:3px 3px 0 var(--pink)}
  .duplicate-review-copy{margin:8px 0 12px;color:var(--muted);font-size:12px;line-height:1.45}
  .duplicate-review-card{margin-top:12px;padding:12px;background:#101224;border:2px solid var(--line)}
  .duplicate-review-card:first-child{margin-top:0}
  .duplicate-flag-line{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;color:#ffb1bd;font-size:10px;font-weight:1000;text-transform:uppercase;letter-spacing:.5px}
  .duplicate-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .duplicate-photo{min-width:0;background:#090b14;border:2px solid var(--line);padding:7px}
  .duplicate-photo img{display:block;width:100%;height:210px;object-fit:contain;background:#05060b}
  .duplicate-photo strong{display:block;margin-top:7px;font-size:12px;line-height:1.25;overflow-wrap:anywhere}
  .duplicate-photo small{display:block;margin-top:3px;color:var(--muted);font-size:10px}
  .duplicate-photo-unavailable{height:210px;display:grid;place-items:center;text-align:center;padding:12px;color:var(--muted);font-size:11px;background:#080a12}
  .duplicate-reason{margin:9px 0 0;color:var(--muted);font-size:10px;line-height:1.4}
  .duplicate-note{margin:9px 0 0!important}
  .duplicate-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
  .duplicate-actions .btn{font-size:10px;padding:9px 7px;margin-top:0;box-shadow:3px 3px 0 var(--yellow)}
  .duplicate-actions .duplicate-valid{background:var(--good);color:#07150d}
  .duplicate-actions .duplicate-same{background:#ff5f6d;color:#1c0508;box-shadow:3px 3px 0 var(--pink)}
  .duplicate-actions .duplicate-dismiss{grid-column:1/-1;background:#2a2940;color:var(--ink);box-shadow:3px 3px 0 #090910}
  .duplicate-empty{padding:14px;text-align:center;border:2px dashed var(--line);color:var(--muted);font-size:12px;font-weight:850}
  @media(max-width:460px){.duplicate-photo img,.duplicate-photo-unavailable{height:170px}}
  `;
  document.head.appendChild(style);
}

function duplicateReviewMsg(msg,ok=false){
  const el=document.getElementById('duplicateReviewMessage');
  if(!el)return;
  el.textContent=msg||'';
  el.classList.toggle('ok',ok);
}

async function duplicatePhotoUrl(path){
  if(!path)return null;
  const {data,error}=await client.storage.from('card-photos').createSignedUrl(path,900);
  if(error){console.warn('Duplicate review photo unavailable',error);return null}
  return data?.signedUrl||null;
}

function renderDuplicateReviews(){
  ensureDuplicateReviewPanel();
  const list=document.getElementById('duplicateReviewList');
  const count=document.getElementById('duplicateReviewCount');
  if(!list||!count)return;
  count.textContent=String(duplicateReviews.length);
  if(!duplicateReviews.length){
    list.innerHTML='<div class="duplicate-empty">✓ No cards need review right now.</div>';
    return;
  }
  list.innerHTML=duplicateReviews.map((r,i)=>{
    const a=r.card_photo_url?`<img src="${esc(r.card_photo_url)}" alt="Flagged card photo" />`:'<div class="duplicate-photo-unavailable">Photo unavailable</div>';
    const b=r.conflicting_photo_url?`<img src="${esc(r.conflicting_photo_url)}" alt="Earlier card photo" />`:'<div class="duplicate-photo-unavailable">Photo unavailable</div>';
    return `<article class="duplicate-review-card" data-flag-id="${esc(r.flag_id)}"><div class="duplicate-flag-line"><span>⚠️ POSSIBLE DUPLICATE</span><span>CHECK ${i+1} OF ${duplicateReviews.length}</span></div><div class="duplicate-photo-grid"><div class="duplicate-photo">${a}<strong>${esc(r.card_label||'New submission')}</strong><small>Newly flagged card</small></div><div class="duplicate-photo">${b}<strong>${esc(r.conflicting_card_label||'Earlier submission')}</strong><small>Earlier physical card</small></div></div>${r.reason?`<p class="duplicate-reason">${esc(r.reason)}</p>`:''}<label class="duplicate-note">Commissioner note (optional)<input class="duplicate-resolution-note" maxlength="240" placeholder="Why this is valid / duplicate" /></label><div class="duplicate-actions"><button class="btn duplicate-valid" type="button" data-duplicate-action="valid">✓ Different card</button><button class="btn duplicate-same" type="button" data-duplicate-action="duplicate">🚫 Same card</button><button class="btn duplicate-dismiss" type="button" data-duplicate-action="dismiss">Dismiss flag</button></div></article>`;
  }).join('');
}

async function loadDuplicateReviews(){
  if(!profile?.is_commissioner||duplicateReviewLoading)return;
  ensureDuplicateReviewPanel();
  duplicateReviewLoading=true;
  duplicateReviewMsg('Checking possible duplicate cards…');
  try{
    const {data,error}=await client.rpc('get_duplicate_card_reviews');
    if(error)throw error;
    const rows=Array.isArray(data)?data:[];
    duplicateReviews=await Promise.all(rows.map(async r=>({...r,card_photo_url:await duplicatePhotoUrl(r.card_photo_path),conflicting_photo_url:await duplicatePhotoUrl(r.conflicting_photo_path)})));
    renderDuplicateReviews();
    duplicateReviewMsg(duplicateReviews.length?`${duplicateReviews.length} possible duplicate${duplicateReviews.length===1?'':'s'} need review.`:'All clear.',!duplicateReviews.length);
  }catch(err){
    console.error('Duplicate review load failed',err);
    duplicateReviews=[];
    renderDuplicateReviews();
    duplicateReviewMsg(err?.message||'Could not load duplicate reviews.');
  }finally{duplicateReviewLoading=false}
}

async function resolveDuplicateReview(card,action){
  const flagId=card?.dataset?.flagId;
  if(!flagId)return;
  const note=card.querySelector('.duplicate-resolution-note')?.value?.trim()||null;
  const labels={valid:'Mark these as different physical cards?',duplicate:'Confirm these are the SAME physical card? This records the ruling but does not automatically delete the Captain submission.',dismiss:'Dismiss this duplicate flag?'};
  if(!confirm(labels[action]||'Resolve this duplicate review?'))return;
  card.querySelectorAll('button').forEach(b=>b.disabled=true);
  duplicateReviewMsg('Saving commissioner ruling…');
  try{
    const {error}=await client.rpc('resolve_duplicate_card_review',{p_flag_id:flagId,p_resolution:action,p_note:note});
    if(error)throw error;
    await loadDuplicateReviews();
    duplicateReviewMsg(action==='duplicate'?'✓ Recorded as the same physical card. No Captain submission was automatically removed.':'✓ Duplicate review resolved.',true);
  }catch(err){
    console.error('Duplicate review resolution failed',err);
    card.querySelectorAll('button').forEach(b=>b.disabled=false);
    duplicateReviewMsg(err?.message||'Could not save duplicate review.');
  }
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-duplicate-action]');
  if(btn)resolveDuplicateReview(btn.closest('.duplicate-review-card'),btn.dataset.duplicateAction);
});

const duplicateOldLoadAdmin=loadAdmin;
loadAdmin=async function(){await duplicateOldLoadAdmin();if(profile?.is_commissioner)await loadDuplicateReviews()};
