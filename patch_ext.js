'use strict';
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var orig = s, n = 0;

var oldWrap = "function hpWrap(abs){ return '/hlsproxy?u=' + encodeURIComponent(Buffer.from(abs,'utf8').toString('base64')); }";
var newWrap = "function hpExt(abs){ var p=abs.replace(/[?#].*$/,''); var m=p.match(/\\.([a-z0-9]{1,5})$/i); if(m){ var e=m[1].toLowerCase(); if(e==='m3u8'||e==='m3u') return 'p.m3u8'; return 's.'+e; } return 's.ts'; }\nfunction hpWrap(abs){ return '/hlsproxy/'+hpExt(abs)+'?u=' + encodeURIComponent(Buffer.from(abs,'utf8').toString('base64')); }";
if (s.indexOf('function hpExt(') === -1 && s.indexOf(oldWrap) !== -1) { s = s.replace(oldWrap, newWrap); n++; }

var oldIn = "var inUrl = 'http://127.0.0.1:' + CFG.port + '/hlsproxy?u=' + encodeURIComponent(Buffer.from(streamUrl).toString('base64'));";
var newIn = "var inUrl = 'http://127.0.0.1:' + CFG.port + '/hlsproxy/index.m3u8?u=' + encodeURIComponent(Buffer.from(streamUrl).toString('base64'));";
if (s.indexOf(oldIn) !== -1) { s = s.replace(oldIn, newIn); n++; }

if (s !== orig) fs.writeFileSync(P, s);
console.log('applied', n, '| hpExt:', s.indexOf('function hpExt(')!==-1, '| inUrl ext:', s.indexOf("/hlsproxy/index.m3u8?u=")!==-1);
