'use strict';
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var n = 0;
var a = "if (u.pathname.indexOf('/api/') === 0) return handleApi(req, res, u);";
if (s.indexOf("return serveHls(") === -1 && s.indexOf(a) !== -1) {
  s = s.replace(a, a + "\n  if (u.pathname.indexOf('/hls/') === 0) return serveHls(req, res, u);");
  fs.writeFileSync(P, s); n++;
}
console.log('applied', n, '| hls route present:', s.indexOf('return serveHls(') !== -1);
