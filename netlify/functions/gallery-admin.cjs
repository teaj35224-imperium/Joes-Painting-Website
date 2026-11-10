const {repo,owner,session,response,gh,secureCookie,sameOrigin,appToken}=require('./_shared.cjs');
exports.handler=async(event)=>{
 if(event.httpMethod==='POST'&&!sameOrigin(event))return response(403,{error:'Invalid request origin'});
 if(event.httpMethod==='POST'&&event.queryStringParameters?.action==='logout')return response(200,{ok:true},{'Set-Cookie':secureCookie('jp_session','',0)});
 const s=session(event);if(!s)return response(401,{error:'Please sign in with the authorized GitHub account'});
 let token;try{token=await appToken()}catch{return response(503,{error:'Gallery repository connection not configured'})}
 if(event.httpMethod==='GET'){const r=await gh(`/repos/${owner}/${repo}/contents/photos`,token);if(r.status===404)return response(200,{photos:[]});if(!r.ok)return response(502,{error:'Could not load gallery'});const files=await r.json();return response(200,{photos:files.filter(x=>x.type==='file'&&/\.(jpg|jpeg|png|webp)$/i.test(x.name)).map(x=>({name:x.name,sha:x.sha,url:x.download_url}))})}
 if(event.httpMethod!=='POST')return response(405,{error:'Method not allowed'});
 let body;try{body=JSON.parse(event.body||'{}')}catch{return response(400,{error:'Invalid request'})}
 if(body.action==='upload'){
  if(!/^[a-zA-Z0-9._-]{1,100}\.(jpg|jpeg|png|webp)$/i.test(body.name||'')||!/^[a-zA-Z0-9+/=]+$/.test(body.content||'')||body.content.length>5500000)return response(400,{error:'Use JPG, PNG or WebP images under 4 MB'});
  const bytes=Buffer.from(body.content,'base64'),ext=body.name.split('.').pop().toLowerCase();
  const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const png=bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
  const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(bytes.length>4*1024*1024||!((['jpg','jpeg'].includes(ext)&&jpg)||(ext==='png'&&png)||(ext==='webp'&&webp)))return response(400,{error:'Invalid image format'});
  const name=Date.now()+'-'+body.name;
  const r=await gh(`/repos/${owner}/${repo}/contents/photos/${encodeURIComponent(name)}`,token,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Add Joe’s Painting project photo',content:body.content})});
  return r.ok?response(200,{ok:true}):response(502,{error:'GitHub rejected upload'});
 }
 if(body.action==='delete'){
  if(!/^[a-zA-Z0-9._-]{1,140}\.(jpg|jpeg|png|webp)$/i.test(body.name||'')||!/^[a-f0-9]{40}$/.test(body.sha||''))return response(400,{error:'Invalid photo'});
  const r=await gh(`/repos/${owner}/${repo}/contents/photos/${encodeURIComponent(body.name)}`,token,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Delete Joe’s Painting project photo',sha:body.sha})});
  return r.ok?response(200,{ok:true}):response(502,{error:'Could not delete photo'});
 }
 return response(400,{error:'Unknown action'});
};