'use strict';
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var orig = s, n = 0;

var BLOCK = [
"// ---------- on-the-fly transcode (4K -> 1080p for phones that can't decode 4K H.264) ----------",
"var FFMPEG = path.join(process.env.HOME || ROOT, 'HomeTV', 'bin', 'ffmpeg');",
"var HLS_DIR = path.join(os.tmpdir(), 'mag-hls');",
"function rmrf(pp){ try { fs.rmSync(pp, { recursive: true, force: true }); } catch (e) { try { (fs.readdirSync(pp)||[]).forEach(function(f){ try { fs.unlinkSync(path.join(pp,f)); } catch(e2){} }); fs.rmdirSync(pp); } catch(e3){} } }",
"try { fs.mkdirSync(HLS_DIR, { recursive: true }); } catch (e) {}",
"try { fs.readdirSync(HLS_DIR).forEach(function(d){ rmrf(path.join(HLS_DIR, d)); }); } catch (e) {}",
"var TX = { proc: null, dir: null, sid: null, key: null };",
"function stopTranscode(){ if (TX.proc) { try { TX.proc.kill('SIGKILL'); } catch(e){} TX.proc=null; } if (TX.dir) { var old=TX.dir; setTimeout(function(){ rmrf(old); }, 4000); TX.dir=null; } TX.sid=null; TX.key=null; }",
"function startTranscode(streamUrl, key){",
"  return new Promise(function(resolve, reject){",
"    if (!fs.existsSync(FFMPEG)) return reject(new Error('Transcoder not installed on the Mac.'));",
"    if (TX.key===key && TX.proc && TX.dir && fs.existsSync(path.join(TX.dir,'index.m3u8'))) return resolve({ url: '/hls/'+TX.sid+'/index.m3u8', transcoded: true });",
"    stopTranscode();",
"    var sid = Date.now().toString(36) + Math.random().toString(36).slice(2,7);",
"    var dir = path.join(HLS_DIR, sid);",
"    try { fs.mkdirSync(dir, { recursive: true }); } catch(e){ return reject(new Error('Could not create transcode folder.')); }",
"    var args = ['-y','-hide_banner','-loglevel','error',",
"      '-user_agent','Mozilla/5.0','-rw_timeout','20000000',",
"      '-re','-hwaccel','videotoolbox','-i',streamUrl,",
"      '-vf','scale=-2:1080','-c:v','h264_videotoolbox','-b:v','6M','-profile:v','high',",
"      '-c:a','aac','-b:a','160k','-ac','2','-sn',",
"      '-f','hls','-hls_time','4','-hls_list_size','0',",
"      '-hls_flags','independent_segments','-hls_segment_type','mpegts',",
"      '-hls_segment_filename',path.join(dir,'seg%05d.ts'),path.join(dir,'index.m3u8')];",
"    var proc = cp.spawn(FFMPEG, args, { stdio: ['ignore','ignore','pipe'] });",
"    var errbuf=''; proc.stderr.on('data', function(c){ errbuf+=c; if(errbuf.length>4000) errbuf=errbuf.slice(-2000); });",
"    var done=false;",
"    proc.on('exit', function(code){ if(!done && code){ done=true; reject(new Error('Transcode failed: '+errbuf.slice(-160))); } });",
"    TX = { proc: proc, dir: dir, sid: sid, key: key };",
"    var waited=0;",
"    var iv = setInterval(function(){",
"      waited += 300;",
"      var pl = path.join(dir,'index.m3u8'); var ok=false;",
"      try { ok = fs.existsSync(pl) && /\\.ts/.test(fs.readFileSync(pl,'utf8')); } catch(e){}",
"      if (ok) { clearInterval(iv); if(!done){ done=true; resolve({ url: '/hls/'+sid+'/index.m3u8', transcoded: true }); } }",
"      else if (waited>=16000) { clearInterval(iv); if(!done){ done=true; reject(new Error('Transcode did not start in time.')); } }",
"    }, 300);",
"  });",
"}",
"function transcodeFor(kind, q){",
"  var pr = (kind==='episode') ? getEpisodeLink(q.file, q.ep) : getVodLink(q.id, q.category);",
"  var key = kind + ':' + (q.file||q.id||'') + ':' + (q.ep||q.category||'');",
"  return pr.then(function(r){ if(!r||!r.url) throw new Error('No source stream for this title.'); return startTranscode(r.url, key); });",
"}",
"function serveHls(req, res, u){",
"  var m = u.pathname.match(/^\\/hls\\/([a-z0-9]+)\\/([a-z0-9_.%-]+)$/i);",
"  if (!m) { res.writeHead(404); return res.end('nf'); }",
"  var file = path.normalize(path.join(HLS_DIR, m[1], decodeURIComponent(m[2])));",
"  if (file.indexOf(HLS_DIR) !== 0) { res.writeHead(403); return res.end(); }",
"  fs.readFile(file, function(err, data){",
"    if (err) { res.writeHead(404); return res.end('nf'); }",
"    var ext = path.extname(file).toLowerCase();",
"    var ct = ext==='.m3u8' ? 'application/vnd.apple.mpegurl' : (ext==='.ts' ? 'video/mp2t' : 'application/octet-stream');",
"    res.writeHead(200, { 'Content-Type': ct, 'Cache-Control':'no-cache', 'Access-Control-Allow-Origin':'*' });",
"    res.end(data);",
"  });",
"}",
""
].join("\n");

// 1) insert transcode block before handleApi
var a1 = "function handleApi(req, res, u) {";
if (s.indexOf("function startTranscode(") === -1 && s.indexOf(a1) !== -1) { s = s.replace(a1, BLOCK + a1); n++; }

// 2) routes after vod/episode
var a2 = "else if (p === 'vod/episode') job = getEpisodeLink(q.file, q.ep);";
if (s.indexOf("p === 'transcode'") === -1 && s.indexOf(a2) !== -1) {
  s = s.replace(a2, a2 + "\n  else if (p === 'transcode') job = transcodeFor(q.kind === 'episode' ? 'episode' : 'vod', q);\n  else if (p === 'transcode/stop') { stopTranscode(); job = Promise.resolve({ ok: true }); }");
  n++;
}

// 3) /hls/ route in main server
var a3 = "if (u.pathname.indexOf('/api/') === 0) return handleApi(req, res, u);  serveStatic(req, res, u);";
if (s.indexOf("return serveHls(") === -1 && s.indexOf(a3) !== -1) {
  s = s.replace(a3, "if (u.pathname.indexOf('/api/') === 0) return handleApi(req, res, u);  if (u.pathname.indexOf('/hls/') === 0) return serveHls(req, res, u);  serveStatic(req, res, u);");
  n++;
}

if (s !== orig) fs.writeFileSync(P, s);
console.log('applied', n, '| startTranscode:', s.indexOf('function startTranscode(')!==-1, '| route:', s.indexOf("p === 'transcode'")!==-1, '| hls:', s.indexOf('return serveHls(')!==-1);
