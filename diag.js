'use strict';
var http=require('http');
function g(path){return new Promise(function(res){http.get({host:'127.0.0.1',port:8080,path:path},function(r){var b='';r.on('data',function(c){b+=c;});r.on('end',function(){res({s:r.statusCode,b:b});});}).on('error',function(e){res({s:0,b:'ERR '+e.message});});});}
function head(url){return new Promise(function(res){try{var u=new URL(url);var lib=u.protocol==='https:'?require('https'):http;var r=lib.request({host:u.hostname,port:u.port||(u.protocol==='https:'?443:80),path:u.pathname+u.search,method:'GET',headers:{'User-Agent':'Mozilla/5.0'}},function(x){var b='';x.on('data',function(c){b+=c;if(b.length>1200)x.destroy();});x.on('end',function(){res({s:x.statusCode,ct:x.headers['content-type'],body:b.slice(0,400)});});x.on('close',function(){res({s:x.statusCode,ct:x.headers['content-type'],body:b.slice(0,400)});});});r.on('error',function(e){res({s:0,ct:'',body:'ERR '+e.message});});r.setTimeout(9000,function(){r.destroy();res({s:0,ct:'',body:'TIMEOUT'});});r.end();}catch(e){res({s:0,ct:'',body:'BADURL '+e.message});}});}
function J(x){try{return JSON.parse(x);}catch(e){return null;}}
(async function(){
  var st=J((await g('/api/status')).b); console.log('STATUS', st&&st.connected, st&&st.error||'');
  var cats=J((await g('/api/vod/categories?type=vod')).b)||[];
  console.log('VOD CATS', cats.length, cats.slice(0,3).map(function(c){return c.id+':'+c.title;}).join(' | '));
  if(!cats.length){console.log('no cats, abort');return;}
  var cat=cats[0].id;
  var list=J((await g('/api/vod/list?type=vod&genre=*&category='+cat+'&page=1')).b)||{};
  var items=list.items||[]; console.log('LIST cat',cat,'items',items.length,'first',items[0]&&(items[0].id+':'+items[0].name));
  if(!items.length){console.log('empty list, abort');return;}
  var mid=items[0].id;
  var play=J((await g('/api/vod/play?id='+mid+'&category='+cat)).b)||{};
  console.log('PLAY url=',play.url,'error=',play.error);
  if(play.url){ var h=await head(play.url); console.log('STREAM http',h.s,'ct=',h.ct); console.log('STREAM body:', h.body.replace(/\n/g,' \\n ').slice(0,300)); }
  // compare: a live channel
  var live=J((await g('/api/live')).b)||{}; var ch=(live.channels||[])[0];
  if(ch){ var lk=J((await g('/api/link?type=itv&cmd='+encodeURIComponent(ch.cmd))).b)||{}; console.log('LIVE ch',ch.name,'url=',lk.url,'err=',lk.error); if(lk.url){var h2=await head(lk.url); console.log('LIVE stream http',h2.s,'ct=',h2.ct);} }
})();
