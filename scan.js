let cardScanSuggestion=null;
function scanBox(){let el=document.getElementById('cardScanBox');if(el)return el;const photo=document.querySelector('.upload-zone');if(!photo)return null;el=document.createElement('div');el.id='cardScanBox';el.className='captain-message';el.style.marginTop='10px';photo.insertAdjacentElement('afterend',el);return el}
function fileDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function loadImageFromFile(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read card photo'))};img.src=url})}
async function optimizedImageDataUrl(file){
  try{
    const img=await loadImageFromFile(file);
    const maxSide=1600;
    const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    const height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
    ctx.drawImage(img,0,0,width,height);
    return canvas.toDataURL('image/jpeg',0.82);
  }catch(err){
    console.warn('Card photo optimization skipped',err);
    return fileDataUrl(file);
  }
}
async function identifyCardFile(file){
  if(!session?.access_token)throw new Error('Sign in to Card Captain before scanning a card.');
  const image=await optimizedImageDataUrl(file);
  const response=await fetch('/api/identify-card',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({image})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Card scan unavailable');
  return data;
}
function scanSummary(data){const names=[data.player_one,data.player_two].filter(Boolean).join(' + ')||'Player not confidently identified';const type=data.card_type==='dual_power'?'Dual Power':data.card_type==='autograph_defense'?'Autograph Defense':'Player Card';const detail=data.card_description?` · ${esc(data.card_description)}`:'';return {names,type,detail}}
async function scanSelectedCard(file){const box=scanBox();if(!box||!file)return;box.classList.remove('ok');box.innerHTML='✨ Scanning card…';try{const data=await identifyCardFile(file);cardScanSuggestion=data;const s=scanSummary(data);box.innerHTML=`<strong>✨ AI SUGGESTION · ${esc(String(data.confidence||'low').toUpperCase())} CONFIDENCE</strong><br>${esc(s.names)} · ${esc(s.type)}${s.detail}<br><button type="button" class="btn blue" id="useCardScan" style="margin-top:8px">Use this suggestion</button><br><small>Check the suggestion before playing your Captain. AI can misread cards.</small>`}catch(err){cardScanSuggestion=null;box.textContent=`AI scan couldn't identify this card. You can still enter it manually. (${err.message})`}}
function applyCardScan(){if(!cardScanSuggestion)return;const one=document.getElementById('playerOne'),two=document.getElementById('playerTwo'),type=document.getElementById('cardType');if(cardScanSuggestion.player_one)one.value=cardScanSuggestion.player_one;if(cardScanSuggestion.player_two)two.value=cardScanSuggestion.player_two;type.value=cardScanSuggestion.card_type||'player';type.dispatchEvent(new Event('change',{bubbles:true}));const box=scanBox();if(box){box.textContent='✓ Suggestion filled in. Confirm the player name and card type, then Play Captain.';box.classList.add('ok')}}
async function testAdminCard(file){const result=document.getElementById('adminScanResult'),preview=document.getElementById('adminScanPreview');if(!result||!file)return;if(preview){preview.src=URL.createObjectURL(file);preview.hidden=false}result.classList.remove('ok');result.textContent='✨ Scanning test card…';try{const data=await identifyCardFile(file);const s=scanSummary(data);result.innerHTML=`<strong>✨ AI RESULT · ${esc(String(data.confidence||'low').toUpperCase())} CONFIDENCE</strong><br><b>${esc(s.names)}</b><br>${esc(s.type)}${s.detail}<br><small>Test only. Nothing was submitted or saved to the league.</small>`;result.classList.add('ok')}catch(err){result.textContent=`Card scanner test failed: ${err.message}`}}
document.addEventListener('change',e=>{if(e.target?.id==='cardPhoto'&&e.target.files?.[0])scanSelectedCard(e.target.files[0]);if(e.target?.id==='adminScanPhoto'&&e.target.files?.[0])testAdminCard(e.target.files[0])});
document.addEventListener('click',e=>{if(e.target.closest('#useCardScan'))applyCardScan()});
