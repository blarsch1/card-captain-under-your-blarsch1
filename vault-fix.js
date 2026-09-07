// Card vault photo fallback: if signed URLs fail, download the manager's own private photo
// with the authenticated Supabase client and render it from a local object URL.
(function(){
  if(typeof signedPhoto!=='function' || typeof client==='undefined') return;

  const originalSignedPhoto=signedPhoto;

  signedPhoto=async function(path){
    if(!path) return null;

    try{
      const url=await originalSignedPhoto(path);
      if(url) return url;
    }catch(err){
      console.warn('Signed card photo URL failed; trying authenticated download.',err);
    }

    try{
      const {data,error}=await client.storage.from('card-photos').download(path);
      if(error) throw error;
      if(!data) return null;
      return URL.createObjectURL(data);
    }catch(err){
      console.error('Authenticated card photo download failed',err);
      return null;
    }
  };
})();
