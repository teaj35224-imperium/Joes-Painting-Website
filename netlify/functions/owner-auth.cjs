const crypto=require('node:crypto');
const {seal,secureCookie,session,response,sameOrigin}=require('./_shared.cjs');

const SALT=Buffer.from('1880f9593b7615ff4cc13254af323d8c','hex');
const EXPECTED=Buffer.from('82abced3c351e01067cc3c6127710feb05b6d1853dda332d605e7a17131ff059','hex');

function validPasscode(value){
 if(typeof value!=='string'||value.length<12||value.length>128)return false;
 const actual=crypto.scryptSync(value,SALT,32,{N:16384,r:8,p:1});
 return actual.length===EXPECTED.length&&crypto.timingSafeEqual(actual,EXPECTED);
}

exports.handler=async(event)=>{
 if(event.httpMethod==='GET'){
  return session(event)?response(200,{authenticated:true}):response(401,{authenticated:false});
 }
 if(event.httpMethod!=='POST')return response(405,{error:'Method not allowed'});
 if(!sameOrigin(event))return response(403,{error:'Invalid request origin'});
 let body={};
 try{body=JSON.parse(event.body||'{}')}catch{return response(400,{error:'Invalid request'})}
 if(body.action==='logout'){
  return response(200,{ok:true},{'Set-Cookie':secureCookie('jp_session','',0)});
 }
 if(body.action!=='login'||!validPasscode(body.passcode)){
  return response(401,{error:'Incorrect owner passcode'});
 }
 const value=seal({owner:true,exp:Date.now()+12*60*60*1000});
 return response(200,{ok:true},{'Set-Cookie':secureCookie('jp_session',value,12*60*60)});
};