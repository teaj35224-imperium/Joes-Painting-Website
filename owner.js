const galleryEndpoint='/.netlify/functions/gallery-admin';
const authEndpoint='/.netlify/functions/owner-auth';

const loginBox=document.getElementById('login-box');
const manager=document.getElementById('manager');
const passcode=document.getElementById('owner-passcode');
const loginButton=document.getElementById('owner-login');
const logoutButton=document.getElementById('logout');
const loginStatus=document.getElementById('login-status');
const status=document.getElementById('status');
const photos=document.getElementById('photos');
const upload=document.getElementById('upload');
const file=document.getElementById('file');

function message(el,text){el.textContent=text||''}
function setAuthenticated(ok){
 loginBox.classList.toggle('hidden',ok);
 manager.classList.toggle('hidden',!ok);
 if(!ok){photos.replaceChildren();file.value='';}
}
async function request(url,method='GET',body){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),20000);
 try{
  const r=await fetch(url,{
   method,
   credentials:'same-origin',
   headers:method==='POST'?{'Content-Type':'application/json'}:{},
   body:body?JSON.stringify(body):undefined,
   signal:controller.signal
  });
  const raw=await r.text();
  let data={};
  try{data=raw?JSON.parse(raw):{}}catch{throw Error('Server returned an unexpected response (HTTP '+r.status+')')}
  if(!r.ok)throw Error(data.error||'Request failed (HTTP '+r.status+')');
  return data;
 }catch(e){
  if(e.name==='AbortError')throw Error('Request timed out');
  throw e;
 }finally{clearTimeout(timer)}
}
async function loadGallery(){
 try{
  const data=await request(galleryEndpoint);
  setAuthenticated(true);
  photos.replaceChildren();
  if(!data.photos.length){
   const empty=document.createElement('p');
   empty.className='small';
   empty.textContent='No project photos uploaded yet.';
   photos.append(empty);
  }
  for(const p of data.photos){
   const row=document.createElement('div');row.className='photo';
   const img=document.createElement('img');img.src=p.url;img.alt='Project photo';
   const name=document.createElement('span');name.textContent=p.name.replace(/^\d+-/,'');
   const del=document.createElement('button');del.type='button';del.textContent='Delete';del.className='ghost';
   del.onclick=async()=>{
    if(!confirm('Delete this photo from the public gallery?'))return;
    del.disabled=true;
    try{
     await request(galleryEndpoint,'POST',{action:'delete',name:p.name,sha:p.sha});
     message(status,'Photo deleted.');
     await loadGallery();
    }catch(e){message(status,e.message);del.disabled=false}
   };
   row.append(img,name,del);photos.append(row);
  }
  message(loginStatus,'');
 }catch(e){
  setAuthenticated(false);
  if(!/sign in|401|authorized/i.test(e.message))message(loginStatus,e.message);
 }
}
loginButton.onclick=async()=>{
 const value=passcode.value.trim();
 if(!value){message(loginStatus,'Enter your owner passcode.');return}
 loginButton.disabled=true;
 message(loginStatus,'Unlocking…');
 try{
  await request(authEndpoint,'POST',{action:'login',passcode:value});
  passcode.value='';
  message(loginStatus,'');
  await loadGallery();
 }catch(e){message(loginStatus,e.message)}
 finally{loginButton.disabled=false}
};
passcode.addEventListener('keydown',e=>{if(e.key==='Enter')loginButton.click()});
logoutButton.onclick=async()=>{
 try{await request(authEndpoint,'POST',{action:'logout'})}catch{}
 setAuthenticated(false);
 message(loginStatus,'Gallery locked.');
};
upload.onclick=async()=>{
 const files=[...file.files];
 if(!files.length){message(status,'Choose at least one photo.');return}
 const allowed=new Set(['image/jpeg','image/png','image/webp']);
 if(files.some(f=>f.size>4*1024*1024)){message(status,'Each photo must be 4 MB or smaller.');return}
 if(files.some(f=>!allowed.has(f.type))){message(status,'Use JPG, PNG or WebP photos only.');return}
 upload.disabled=true;
 try{
  let done=0;
  for(const f of files){
   message(status,`Uploading ${done+1} of ${files.length}…`);
   const base64=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(',')[1]);
    reader.onerror=()=>reject(Error('Could not read '+f.name));
    reader.readAsDataURL(f);
   });
   await request(galleryEndpoint,'POST',{action:'upload',name:f.name.replace(/[^a-zA-Z0-9._-]/g,'-'),content:base64});
   done++;
  }
  file.value='';
  message(status,`${done} photo${done===1?'':'s'} uploaded successfully.`);
  await loadGallery();
 }catch(e){message(status,e.message)}
 finally{upload.disabled=false}
};
setAuthenticated(false);
loadGallery();