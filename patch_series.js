'use strict';
var fs=require('fs');
var P=process.env.HOME+'/HomeTV/mag-portal/server.js';
var s=fs.readFileSync(P,'utf8');
var orig=s, n=0;

var FUNCS =
"function getSeries(seriesId, category) {\n"+
"  return ensureConnected().then(function () {\n"+
"    return call({ type: 'vod', action: 'get_ordered_list', movie_id: seriesId, season_id: 0, episode_id: 0, category: category || '*', p: 1 });\n"+
"  }).then(function (js) {\n"+
"    var seasons = (js && js.data) || [];\n"+
"    if (!seasons.length) return { seasons: [] };\n"+
"    return Promise.all(seasons.map(function (se) {\n"+
"      return call({ type: 'vod', action: 'get_ordered_list', movie_id: se.id, season_id: se.id, episode_id: 0, category: category || '*', p: 1 })\n"+
"        .then(function (ej) {\n"+
"          var eps = ((ej && ej.data) || []).map(function (e) {\n"+
"            var ep = (e.series_number != null && e.series_number !== '') ? e.series_number : ((e.series && e.series[0]) || '');\n"+
"            return { file: String(e.id), ep: String(ep), name: String(e.name || ('Episode ' + ep)) };\n"+
"          });\n"+
"          eps.sort(function (a, b) { return (parseInt(a.ep, 10) || 0) - (parseInt(b.ep, 10) || 0); });\n"+
"          return { season: String(se.season_number || se.id), name: String(se.name || ('Season ' + (se.season_number || ''))), episodes: eps };\n"+
"        });\n"+
"    })).then(function (arr) { return { seasons: arr }; });\n"+
"  });\n"+
"}\n"+
"function getEpisodeLink(fileId, ep) {\n"+
"  return ensureConnected().then(function () {\n"+
"    return call({ type: 'vod', action: 'create_link', cmd: '/media/file_' + fileId + '.mpg', series: ep || '', forced_storage: '', disable_ad: 0, download: 0, force_ch_link_check: 0 });\n"+
"  }).then(function (js) {\n"+
"    var url = cleanCmd(js && js.cmd);\n"+
"    if (!url) throw new Error('Provider did not return a stream for this episode.');\n"+
"    return { url: url, solution: solutionOf(js.cmd) };\n"+
"  });\n"+
"}\n";

// 1) insert new functions right before getLink
var anchor1="function getLink(type, cmd, series) {";
if(s.indexOf("function getSeries(")===-1 && s.indexOf(anchor1)!==-1){ s=s.replace(anchor1, FUNCS+anchor1); n++; }

// 2) add routes after vod/play
var anchor2="else if (p === 'vod/play') job = getVodLink(q.id, q.category);";
if(s.indexOf("p === 'vod/series'")===-1 && s.indexOf(anchor2)!==-1){
  s=s.replace(anchor2, anchor2+"\n  else if (p === 'vod/series') job = getSeries(q.id, q.category);\n  else if (p === 'vod/episode') job = getEpisodeLink(q.file, q.ep);");
  n++;
}

if(s!==orig){ fs.writeFileSync(P,s); }
console.log('applied', n, '| getSeries present:', s.indexOf('function getSeries(')!==-1, '| routes present:', s.indexOf("p === 'vod/series'")!==-1);
