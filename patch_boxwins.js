'use strict';
/* Box always wins: stop the Mac from grabbing the provider session in the background.
   - disables startup auto sign-in
   - neutralizes the every-minute self-heal re-auth
   The Mac will still sign in ON DEMAND when you open the app (and yields to the box,
   showing "box is on" when the box is reachable). */
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var orig = s, log = [];

// 1) startup auto sign-in
var start = "if (DEVICE && !CFG.demo) selfConnect().catch(function (e) { console.log('[startup] self sign-in failed: ' + e.message); });";
if (s.indexOf(start) !== -1) { s = s.replace(start, "/* box-wins: startup auto sign-in removed */"); log.push('startup=disabled'); }
else log.push('startup=NOT_FOUND');

// 2) self-heal interval -> early return (works without knowing the body)
if (s.indexOf('/* self-heal DISABLED') !== -1) { log.push('selfheal=already'); }
else {
  var heal = "setInterval(function () { /* self-heal */";
  if (s.indexOf(heal) !== -1) { s = s.replace(heal, "setInterval(function () { return; /* self-heal DISABLED: box always wins */"); log.push('selfheal=disabled'); }
  else log.push('selfheal=NOT_FOUND');
}

if (s !== orig) fs.writeFileSync(P, s);
console.log(log.join(' | '));
