export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const {image}=req.body||{};
    if(!image||typeof image!=='string'||!image.startsWith('data:image/'))return res.status(400).json({error:'Card image required'});
    const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!token)return res.status(503).json({error:'AI card scan is not configured yet'});
    const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({model:'openai/gpt-5.4-mini',messages:[{role:'user',content:[{type:'text',text:'Identify this American football trading card for a fantasy football game. Return ONLY valid compact JSON with keys player_one, player_two, card_type, card_description, confidence. card_type must be player, dual_power, or autograph_defense. Use autograph_defense only when the card visibly contains an autograph/signature; dual_power only when two NFL players are featured as the playable subjects. Player names must be full names when readable. card_description should briefly identify visible year/brand/set/card number/parallel only when reasonably visible. confidence must be high, medium, or low. Never invent unreadable details; use null.'},{type:'image_url',image_url:{url:image,detail:'auto'}}]}],temperature:0,stream:false})});
    const raw=await response.text();
    if(!response.ok){console.error('AI Gateway',response.status,raw.slice(0,500));return res.status(502).json({error:'Card scan unavailable right now'});}
    const data=JSON.parse(raw);let text=data?.choices?.[0]?.message?.content||'';if(Array.isArray(text))text=text.map(x=>x?.text||'').join('');text=String(text).trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
    const result=JSON.parse(text);const allowed=new Set(['player','dual_power','autograph_defense']);
    if(!allowed.has(result.card_type))result.card_type='player';
    return res.status(200).json({player_one:result.player_one||null,player_two:result.player_two||null,card_type:result.card_type,card_description:result.card_description||null,confidence:['high','medium','low'].includes(result.confidence)?result.confidence:'low'});
  }catch(err){console.error(err);return res.status(500).json({error:'Could not identify this card'});}
}
