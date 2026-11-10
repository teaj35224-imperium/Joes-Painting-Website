const crypto=require('node:crypto');
const owner='teaj35224-imperium',repo='Joes-painting-gallery';
const base='https://api.github.com';

function cookie(event,name){
 const s=event.headers.cookie||event.headers.Cookie||'';
 return s.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';
}
function key(){
 const secret=process.env.SESSION_SECRET;
 if(!secret||Buffer.byteLength(secret)<32)throw Error('SESSION_SECRET must be at least 32 bytes');
 return crypto.createHash('sha256').update(secret).digest();
}
function seal(data){
 const iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
 const encrypted=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
}
function unseal(value){
 try{
  const b=Buffer.from(value,'base64url');
  if(b.length<29)return null;
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));
  decipher.setAuthTag(b.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString('utf8'));
 }catch{return null}
}
function secureCookie(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function session(event){
 const s=unseal(cookie(event,'jp_session'));
 if(!s||s.exp<=Date.now())return null;
 if(s.owner===true)return s;
 if(typeof s.login==='string'&&s.login.toLowerCase()===owner.toLowerCase()&&Number.isInteger(s.id))return s;
 return null;
}
function response(statusCode,body,headers={}){
 return {statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers},body:JSON.stringify(body)};
}
function sameOrigin(event){
 const origin=event.headers.origin||event.headers.Origin;
 const expected=process.env.SITE_URL?.replace(/\/$/,'');
 return !!expected&&origin===expected;
}
async function gh(path,token,options={}){
 return fetch(base+path,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}});
}
async function appToken(){
 const appId=process.env.GITHUB_APP_ID,installationId=process.env.GITHUB_APP_INSTALLATION_ID;
 const pem=(process.env.GITHUB_APP_PRIVATE_KEY||'').replace(/\\n/g,'\n');
 if(!appId||!installationId||!pem)throw Error('GitHub App not configured');
 const now=Math.floor(Date.now()/1000),b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
 const unsigned=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iat:now-60,exp:now+540,iss:appId});
 const sig=crypto.sign('RSA-SHA256',Buffer.from(unsigned),pem).toString('base64url');
 const r=await fetch(`${base}/app/installations/${encodeURIComponent(installationId)}/access_tokens`,{method:'POST',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${unsigned}.${sig}`,'X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({repositories:[repo],permissions:{contents:'write'}})});
 if(!r.ok)throw Error('GitHub App installation token unavailable');
 return (await r.json()).token;
}
module.exports={owner,repo,cookie,seal,secureCookie,session,response,sameOrigin,gh,appToken};