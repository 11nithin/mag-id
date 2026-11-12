var fs=require('fs');var f=process.env.HOME+'/HomeTV/mag-portal/server.js';var s=fs.readFileSync(f,'utf8');var n=0;
// 1. selfConnect gains a force flag (skip box check)
var a1='function selfConnect() {';
if(s.indexOf('function selfConnect(force)')<0 && s.indexOf(a1)>=0){ s=s.replace(a1,'function selfConnect(force) {'); n++; }
var a2='  stalker.connecting = boxReachable().then(function (online) {';
var r2='  stalker.connecting = (force ? Promise.resolve(false) : boxReachable()).then(function (online) {';
if(s.indexOf(a2)>=0){ s=s.replace(a2,r2); n++; }
// 2. takeover route
var a3="  else if (p === 'vod/play') job = getVodLink(q.id, q.category);";
if(s.indexOf("'takeover'")<0 && s.indexOf(a3)>=0){
  var r3=a3+"\n  else if (p === 'takeover') { stalker.connecting = null; job = selfConnect(true).then(function () { return { ok: true }; }, function (e) { return { ok: false, error: e.message }; }); }";
  s=s.replace(a3,r3); n++;
}
// 3. periodic self-heal: if disconnected and box is off, reconnect automatically
var a4="  if (DEVICE && !CFG.demo) selfConnect().catch(function (e) { console.log('[startup] self sign-in failed: ' + e.message); });";
if(s.indexOf('self-heal')<0 && s.indexOf(a4)>=0){
  var r4=a4+"\n  if (DEVICE && !CFG.demo) setInterval(function () { /* self-heal */\n"+
    "    if (stalker.authed || stalker.connecting) return;\n"+
    "    boxReachable().then(function (on) { if (!on) selfConnect().catch(function () {}); });\n"+
    "  }, 60000);";
  s=s.replace(a4,r4); n++;
}
fs.writeFileSync(f,s);console.log('applied '+n);
