'use strict';
var http=require('http');
function g(path){return new Promise(function(res){http.get({host:'127.0.0.1',port:8080,path:path},function(r){var b='';r.on('data',function(c){b+=c;});r.on('end',function(){res(b);});}).on('error',function(e){res('ERR '+e.message);});});}
function J(x){try{return JSON.parse(x);}catch(e){return null;}}
function raw(params){var qs=Object.keys(params).map(function(k){return k+'='+encodeURIComponent(params[k]);}).join('&');return g('/api/debug/raw?'+qs).then(J);}
(async function(){
  var cat='20'; // ENGLISH | TV SHOWS
  var list=await raw({type:'vod',action:'get_ordered_list',category:cat,genre:'*',p:1,sortby:'added',fav:0});
  var s=(list&&list.data&&list.data[0])||{};
  console.log('SERIES id=',s.id,'name=',s.name,'is_series=',s.is_series,'series=',JSON.stringify(s.series),'cmd=',s.cmd);
  // level 1: seasons
  var L1=await raw({type:'vod',action:'get_ordered_list',movie_id:s.id,season_id:0,episode_id:0,category:cat,p:1});
  var d1=(L1&&L1.data)||[];
  console.log('L1 rows',d1.length,'first=',JSON.stringify(d1[0]||{}).slice(0,220));
  if(d1[0]){
    var a=d1[0];
    // level 2: episodes within first season
    var L2=await raw({type:'vod',action:'get_ordered_list',movie_id:a.id,season_id:(a.season_id||a.id),episode_id:0,category:cat,p:1});
    var d2=(L2&&L2.data)||[];
    console.log('L2 rows',d2.length,'first=',JSON.stringify(d2[0]||{}).slice(0,260));
    var e=d2[0]||a;
    console.log('EPISODE series field=',JSON.stringify(e.series),'id=',e.id,'cmd=',e.cmd);
    // try create_link with episode's series number
    var epnum=(e.series&&e.series[0])||1;
    var r=await raw({type:'vod',action:'create_link',cmd:'/media/file_'+e.id+'.mpg',series:epnum,forced_storage:'',disable_ad:0,download:0,force_ch_link_check:0});
    console.log('EP create_link ->', r&&r.cmd?('CMD '+String(r.cmd).slice(0,60)):('err='+JSON.stringify(r).slice(0,120)));
  }
})();
