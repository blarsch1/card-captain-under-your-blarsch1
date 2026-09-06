const SUPABASE_URL='https://prupedxpebntoqhilrzi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_TZahmAv5GD3bv4LaHfma_w_i0daueMI';

async function requireCardCaptainUser(req){
  const authorization=req.headers.authorization||'';
  if(!authorization.startsWith('Bearer '))return null;
  const userRes=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:authorization}});
  if(!userRes.ok)return null;
  const user=await userRes.json().catch(()=>null);
  if(!user?.id)return null;
  const profileRes=await fetch(`${SUPABASE_URL}/rest/v1/manager_profiles?auth_user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:authorization}});
  if(!profileRes.ok)return null;
  const profiles=await profileRes.json().catch(()=>[]);
  return profiles?.[0]?.id?user:null;
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const user=await requireCardCaptainUser(req);
    if(!user)return res.status(401).json({error:'Sign in to Card Captain before scanning a card.'});

    const {image}=req.body||{};
    if(!image||typeof image!=='string'||!image.startsWith('data:image/'))return res.status(400).json({error:'Card image required'});
    if(image.length>8_000_000)return res.status(413).json({error:'Card photo is too large. Try taking the photo again.'});

    const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!token)return res.status(503).json({error:'AI card scan is not configured yet'});

    const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'openai/gpt-4o-mini',
        messages:[{role:'user',content:[
          {type:'text',text:'Identify this American football trading card for the Card Captain fantasy football game. Return ONLY valid compact JSON with keys player_one, player_two, card_type, card_description, confidence. card_type must be player, dual_power, or autograph_defense. Use autograph_defense only when the card visibly contains an autograph/signature; dual_power only when two NFL players are featured as the playable subjects. Player names must be full names when readable. card_description should briefly identify visible year, brand, set, card number, serial numbering, parallel, or insert only when reasonably visible. confidence must be high, medium, or low. Never invent unreadable details; use null.'},
          {type:'image_url',image_url:{url:image,detail:'auto'}}
        ]}],
        temperature:0,
        max_tokens:220,
        stream:false
      })
    });
    const raw=await response.text();
    if(!response.ok){
      console.error('AI Gateway',response.status,raw.slice(0,1000));
      let detail='Card scan unavailable right now';
      try{const j=JSON.parse(raw);detail=j?.error?.message||j?.message||detail}catch{}
      return res.status(502).json({error:detail});
    }

    const data=JSON.parse(raw);
    let text=data?.choices?.[0]?.message?.content||'';
    if(Array.isArray(text))text=text.map(x=>x?.text||'').join('');
    text=String(text).trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
    const result=JSON.parse(text);
    const allowed=new Set(['player','dual_power','autograph_defense']);
    if(!allowed.has(result.card_type))result.card_type='player';
    return res.status(200).json({
      player_one:result.player_one||null,
      player_two:result.player_two||null,
      card_type:result.card_type,
      card_description:result.card_description||null,
      confidence:['high','medium','low'].includes(result.confidence)?result.confidence:'low'
    });
  }catch(err){
    console.error(err);
    return res.status(500).json({error:err?.message||'Could not identify this card'});
  }
}
