const crypto=require('node:crypto');
const {owner,cookie,secureCookie,seal,gh}=require('./_shared.cjs');

exports.handler=async(event)=>{
  const q=event.queryStringParameters||{};
  const state=cookie(event,'jp_oauth_state');
  const clear=secureCookie('jp_oauth_state','',0);
  const fail=msg=>({
    statusCode:302,
    headers:{
      Location:'/owner.html?error='+encodeURIComponent(msg),
      'Cache-Control':'no-store',
      'Set-Cookie':clear
    },
    body:''
  });

  if(!q.code||!q.state||!state||q.state.length!==state.length||!crypto.timingSafeEqual(Buffer.from(q.state),Buffer.from(state))){
    return fail('Invalid login session');
  }

  try{
    const redirectUri=process.env.SITE_URL.replace(/\/$/,'')+'/.netlify/functions/auth-callback';
    const params=new URLSearchParams({
      client_id:process.env.GITHUB_CLIENT_ID,
      client_secret:process.env.GITHUB_CLIENT_SECRET,
      code:q.code,
      redirect_uri:redirectUri
    });

    const r=await fetch('https://github.com/login/oauth/access_token',{
      method:'POST',
      headers:{
        Accept:'application/json',
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body:params.toString()
    });

    const t=await r.json();
    if(!r.ok||!t.access_token){
      const reason=t.error_description||t.error||('HTTP '+r.status);
      return fail('GitHub authorization failed: '+reason);
    }

    const u=await gh('/user',t.access_token);
    const user=await u.json();
    if(!u.ok){
      return fail('GitHub user verification failed');
    }
    if(!user.login||user.login.toLowerCase()!==owner.toLowerCase()){
      return fail('This GitHub account is not authorized');
    }

    const value=seal({login:user.login,id:user.id,exp:Date.now()+3600000});

    return {
      statusCode:302,
      headers:{
        Location:'/owner.html',
        'Cache-Control':'no-store'
      },
      multiValueHeaders:{
        'Set-Cookie':[
          secureCookie('jp_session',value,3600),
          clear
        ]
      },
      body:''
    };
  }catch(e){
    console.error('Owner OAuth callback failed',e&&e.message?e.message:e);
    return fail('Login failed');
  }
};