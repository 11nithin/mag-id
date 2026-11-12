'use strict';
var http=require('http');
function g(path){return new Promise(function(res){http.get({host:'127.0.0.1',port:8080,path:path},function(r){var b='';r.on('data',function(c){b+=c;});r.on('end',function(){res(b);});}).on('error',function(e){res('ERR '+e.message);});});}
function J(x){try{return JSON.parse(x);}catch(e){return null;}}
function raw(params){var qs=Object.keys(params).map(function(k){return k+'='+encodeURIComponent(params[k]);}).join('&');return g('/api/debug/raw?'+qs).then(J);}
(async function(){
  var cat='134';
  // real movie list
  var list=await raw({type:'vod',action:'get_ordered_list',category:cat,genre:'*',p:1,sortby:'added',fav:0});
  var movies=(list&&list.data)||[];
  console.log('CAT',cat,'movies',movies.length);
  var m=movies[0]||{};
  console.log('MOVIE id=',m.id,'name=',m.name,'is_series=',m.is_series,'cmd=',m.cmd);
  // ordered list by movie_id
  var ol=await raw({type:'vod',action:'get_ordered_list',movie_id:m.id,season_id:0,episode_id:0,category:cat,p:1});
  var f=(ol&&ol.data&&ol.data[0])||{};
  console.log('FILE id=',f.id,'cmd=',f.cmd,'(data len',(ol&&ol.data||[]).length,')');
  // try create_link variants
  var tries=[
    ['A /media/file_<fid>.mpg', {type:'vod',action:'create_link',cmd:'/media/file_'+f.id+'.mpg',series:'',forced_storage:'',disable_ad:0,download:0,force_ch_link_check:0}],
    ['B file.cmd verbatim', {type:'vod',action:'create_link',cmd:f.cmd,forced_storage:0,disable_ad:0,download:0}],
    ['C movie.cmd verbatim', {type:'vod',action:'create_link',cmd:m.cmd,forced_storage:0,disable_ad:0,download:0}],
    ['D /media/<movieid>.mpg', {type:'vod',action:'create_link',cmd:'/media/'+m.id+'.mpg',forced_storage:0,disable_ad:0,download:0}]
  ];
  for(var i=0;i<tries.length;i++){
    var r=await raw(tries[i][1]);
    console.log(tries[i][0],'->', r&&r.cmd?('CMD '+String(r.cmd).slice(0,70)):('err='+JSON.stringify(r).slice(0,120)));
  }
})();
