'use strict';
var http=require('http');
function get(path,bin){return new Promise(function(res){http.get({host:'127.0.0.1',port:8080,path:path},function(r){var ch=[];r.on('data',function(c){ch.push(c);});r.on('end',function(){var b=Buffer.concat(ch);res({status:r.statusCode,ct:r.headers['content-type'],ce:r.headers['content-encoding'],body:bin?b:b.toString('utf8')});});}).on('error',function(e){res({status:0,body:'ERR '+e.message});});});}
function b64(s){return encodeURIComponent(Buffer.from(s).toString('base64'));}
function J(x){try{return JSON.parse(x);}catch(e){return null;}}
function firstProxyLine(txt){var ls=String(txt).split('\n');for(var i=0;i<ls.length;i++){var t=ls[i].replace(/\r$/,'');if(t.indexOf('/hlsproxy')===0)return t;}return null;}
(async function(){
  var pj=J((await get('/api/vod/play?id=1013672&category=134')).b||(await get('/api/vod/play?id=1013672&category=134')).body);
  var play=await get('/api/vod/play?id=1013672&category=134'); var url=J(play.body).url;
  console.log('master url host:', url.split('/')[2]);
  var m=await get('/hlsproxy?u='+b64(url)); console.log('MASTER proxied: status',m.status,'ct',m.ct);
  var subLine=firstProxyLine(m.body); console.log('sub line present:', !!subLine);
  if(!subLine){ console.log('master body head:', m.body.slice(0,200)); return; }
  var sub=await get(subLine.replace(/^\/hlsproxy/,'/hlsproxy')); console.log('SUB proxied: status',sub.status,'ct',sub.ct);
  console.log('sub head:', sub.body.slice(0,160).replace(/\n/g,' | '));
  var segLine=firstProxyLine(sub.body); console.log('seg line present:', !!segLine);
  if(!segLine){ return; }
  var seg=await get(segLine, true);
  var head=seg.body.slice(0,8);
  console.log('SEG proxied: status',seg.status,'ct',seg.ct,'ce',seg.ce,'len',seg.body.length,'firstByte=0x'+(seg.body[0]!=null?seg.body[0].toString(16):'??'),'(TS sync should be 0x47)');
})();
