const endpoint='/.netlify/functions/gallery-admin';
const status=document.getElementById('status'),photos=document.getElementById('photos'),upload=document.getElementById('upload'),file=document.getElementById('file');
function msg(t){status.textContent=t}
let authenticated=false;function signedIn(ok){authenticated=ok;upload.disabled=false;file.disabled=false;upload.textContent=ok?'Upload photo':'Sign in to upload'}
signedIn(false);
async function api(method='GET',body,action){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const r=await fetch(endpoint+(action?'?action='+encodeURIComponent(action):''),{method,credentials:'same-origin',headers:method==='POST'?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
  const raw=await r.text();let data;
  try{data=JSON.parse(raw)}catch{throw Error('Server returned an unexpected response (HTTP '+r.status+'). Check Netlify function logs')}
  if(!r.ok)throw Error(data.error||'Request failed (HTTP '+r.status+')');
  return data;
 }catch(e){if(e.name==='AbortError')throw Error('Request timed out after 20 seconds. Check Netlify function logs');throw e}
 finally{clearTimeout(timeout)}
}
async function load(){
 try{
  const data=await api();signedIn(true);photos.replaceChildren();
  if(!data.photos.length)photos.textContent='No uploaded photos yet.';
  for(const p of data.photos){
   const row=document.createElement('div');row.className='photo';
   const img=document.createElement('img');img.src=p.url;img.alt=p.name;
   const name=document.createElement('span');name.textContent=p.name;
   const del=document.createElement('button');del.textContent='Delete';
   del.onclick=async()=>{if(!confirm('Permanently delete this photo?'))return;del.disabled=true;try{await api('POST',{action:'delete',name:p.name,sha:p.sha});await load();msg('Photo deleted')}catch(e){msg(e.message);del.disabled=false}};
   row.append(img,name,del);photos.append(row)
  }
  msg('Signed in and connected');
 }catch(e){signedIn(false);photos.replaceChildren();msg(e.message)}
}
upload.onclick=async()=>{
 if(!authenticated)return msg('Sign in with GitHub above before uploading. The file picker is available so you can choose your photo first.');
 const f=file.files[0];if(!f)return msg('Choose a photo');
 if(f.size>4*1024*1024)return msg('Maximum file size is 4 MB');
 upload.disabled=true;
 try{
  msg('Reading photo…');
  const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read photo'));reader.readAsDataURL(f)});
  msg('Uploading to GitHub…');
  await api('POST',{action:'upload',name:f.name,content:base64});
  await load();msg('Photo uploaded successfully');file.value='';
 }catch(e){msg(e.message)}finally{upload.disabled=false}
};
document.getElementById('logout').onclick=async()=>{try{await api('POST',null,'logout');photos.replaceChildren();signedIn(false);msg('Signed out')}catch(e){msg(e.message)}};
load();
