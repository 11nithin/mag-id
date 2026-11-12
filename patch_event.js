'use strict';
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var n = 0;
var a = "'-f','hls','-hls_time','4','-hls_list_size','0',";
var b = "'-f','hls','-hls_time','4','-hls_list_size','0','-hls_playlist_type','event',";
if (s.indexOf("'-hls_playlist_type'") === -1 && s.indexOf(a) !== -1) { s = s.replace(a, b); fs.writeFileSync(P, s); n++; }
console.log('applied', n, '| event present:', s.indexOf("'-hls_playlist_type'") !== -1);
