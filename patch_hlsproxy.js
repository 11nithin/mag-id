'use strict';
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var orig = s, n = 0;

var PROXY = [
"function hpResolve(base, ref){ try { return new URL(ref, base).href; } catch(e){ return ref; } }",
"function hpWrap(abs){ return '/hlsproxy?u=' + encodeURIComponent(Buffer.from(abs,'utf8').toString('base64')); }",
"function serveHlsProxy(req, res, u){",
"  var target;",
"  try { target = Buffer.from(String(u.query.u||''),'base64').toString('utf8'); } catch(e){ res.writeHead(400); return res.end('bad'); }",
"  if(!/^https?:\\/\\//.test(target)){ res.writeHead(400); return res.end('bad'); }",
"  var lib = target.indexOf('https:')===0 ? https : http;",
"  var pu = urlLib.parse(target);",
"  var opts = { host: pu.hostname, port: pu.port||(pu.protocol==='https:'?443:80), path: pu.path, method:'GET', headers:{ 'User-Agent':'Mozilla/5.0', 'Accept':'*/*' } };",
"  var preq = lib.request(opts, function(pr){",
"    if(pr.statusCode>=300 && pr.statusCode<400 && pr.headers.location){ res.writeHead(302, { 'Location': hpWrap(hpResolve(target, pr.headers.location)) }); return res.end(); }",
"    var ct = pr.headers['content-type']||'';",
"    var isM = /mpegurl|m3u8/i.test(ct) || /\\.m3u8(\\?|$)/i.test(target);",
"    if(isM){",
"      var ch=[]; pr.on('data',function(c){ch.push(c);}); pr.on('end',function(){",
"        var body=Buffer.concat(ch).toString('utf8');",
"        var out=body.split('\\n').map(function(line){",
"          var t=line.replace(/\\r$/,'');",
"          if(!t) return t;",
"          if(t.charAt(0)==='#') return t.replace(/URI=\\\"([^\\\"]+)\\\"/g,function(m,uri){ return 'URI=\\\"'+hpWrap(hpResolve(target,uri))+'\\\"'; });",
"          return hpWrap(hpResolve(target,t));",
"        }).join('\\n');",
"        res.writeHead(200,{ 'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*' });",
"        res.end(out);",
"      });",
"    } else {",
"      res.writeHead(pr.statusCode,{ 'Content-Type':ct||'video/mp2t','Access-Control-Allow-Origin':'*' });",
"      pr.pipe(res);",
"    }",
"  });",
"  preq.on('error',function(e){ try{res.writeHead(502);res.end('err');}catch(x){} });",
"  preq.setTimeout(20000,function(){ preq.destroy(); try{res.writeHead(504);res.end('t');}catch(x){} });",
"  preq.end();",
"}",
""
].join("\n");

// 1) add proxy functions before serveHls
var a1 = "function serveHls(req, res, u){";
if (s.indexOf("function serveHlsProxy(") === -1 && s.indexOf(a1) !== -1) { s = s.replace(a1, PROXY + a1); n++; }

// 2) route ffmpeg input through the local proxy
var a2 = "var args = ['-y','-hide_banner','-loglevel','error',";
if (s.indexOf("var inUrl =") === -1 && s.indexOf(a2) !== -1) {
  s = s.replace(a2, "var inUrl = 'http://127.0.0.1:' + CFG.port + '/hlsproxy?u=' + encodeURIComponent(Buffer.from(streamUrl).toString('base64'));\n    " + a2);
  n++;
}
if (s.indexOf("'-i',streamUrl,") !== -1) { s = s.replace("'-i',streamUrl,", "'-i',inUrl,"); n++; }

// 3) router: add /hlsproxy
var a3 = "if (u.pathname.indexOf('/hls/') === 0) return serveHls(req, res, u);";
if (s.indexOf("return serveHlsProxy(") === -1 && s.indexOf(a3) !== -1) {
  s = s.replace(a3, "if (u.pathname.indexOf('/hlsproxy') === 0) return serveHlsProxy(req, res, u);\n  " + a3);
  n++;
}

if (s !== orig) fs.writeFileSync(P, s);
console.log('applied', n, '| proxy:', s.indexOf('function serveHlsProxy(')!==-1, '| inUrl:', s.indexOf('var inUrl =')!==-1, '| streamUrl gone:', s.indexOf("'-i',streamUrl,")===-1, '| route:', s.indexOf('return serveHlsProxy(')!==-1);
