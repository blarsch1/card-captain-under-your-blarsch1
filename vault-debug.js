// Temporary Card Vault photo diagnostics. Safe: read-only, manager's own returned card data only.
(function(){
  const originalLoad = window.loadMyCards || loadMyCards;

  async function diagnosePhoto(card){
    const result={path:card?.photo_path||null,signed:'not tried',download:'not tried',render:'not tried'};
    if(!result.path){result.signed='FAIL: photo_path missing from RPC result';return result;}
    try{
      const signed=await client.storage.from('card-photos').createSignedUrl(result.path,3600);
      if(signed.error) result.signed=`FAIL: ${signed.error.message||String(signed.error)}`;
      else if(!signed.data?.signedUrl) result.signed='FAIL: no signedUrl returned';
      else {
        result.signed='OK: signed URL created';
        try{
          const r=await fetch(signed.data.signedUrl);
          result.render=r.ok?`OK: image request ${r.status} (${r.headers.get('content-type')||'unknown type'})`:`FAIL: image request HTTP ${r.status}`;
        }catch(e){result.render=`FAIL: image request ${e.message||e}`;}
      }
    }catch(e){result.signed=`FAIL: exception ${e.message||e}`;}
    try{
      const dl=await client.storage.from('card-photos').download(result.path);
      result.download=dl.error?`FAIL: ${dl.error.message||String(dl.error)}`:`OK: ${dl.data?.type||'blob'} · ${dl.data?.size??'?'} bytes`;
    }catch(e){result.download=`FAIL: exception ${e.message||e}`;}
    return result;
  }

  window.loadMyCards=loadMyCards=async function(){
    if(!session?.user||!profile){myCards=[];renderMyCards();return;}
    const {data,error}=await client.rpc('get_my_card_captain_cards');
    if(error){console.error('My Cards load failed',error);myCards=[];renderMyCards('Could not load your cards.');return;}
    myCards=await Promise.all((data||[]).map(async card=>{
      const debug=await diagnosePhoto(card);
      let photo_url=null;
      if(card.photo_path){
        const signed=await client.storage.from('card-photos').createSignedUrl(card.photo_path,3600);
        if(!signed.error) photo_url=signed.data?.signedUrl||null;
      }
      return {...card,photo_url,vault_debug:debug};
    }));
    renderMyCards();
    const cardsEl=document.getElementById('myCards');
    if(cardsEl){
      myCards.forEach((c,i)=>{
        const article=cardsEl.children[i]; if(!article)return;
        const d=c.vault_debug||{};
        const box=document.createElement('div');
        box.style.cssText='margin:10px;padding:10px;border:2px dashed #ffeb3b;font:12px/1.45 monospace;word-break:break-word;background:#111;color:#fff';
        box.innerHTML='<strong>VAULT PHOTO DEBUG</strong><br>'+
          'path: '+esc(d.path||'MISSING')+'<br>'+
          'signed: '+esc(d.signed||'—')+'<br>'+
          'download: '+esc(d.download||'—')+'<br>'+
          'render: '+esc(d.render||'—');
        article.appendChild(box);
      });
    }
  };
})();
