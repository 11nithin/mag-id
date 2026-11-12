'use strict';
var fs = require('fs');
var P = process.env.HOME + '/HomeTV/mag-portal/server.js';
var s = fs.readFileSync(P, 'utf8');
var n = 0;
var oldA = "      '-re','-hwaccel','videotoolbox','-i',streamUrl,";
var newA = "      '-reconnect','1','-reconnect_on_network_error','1','-reconnect_streamed','1','-reconnect_delay_max','4',\n      '-re','-hwaccel','videotoolbox','-i',streamUrl,";
if (s.indexOf("'-reconnect'") === -1 && s.indexOf(oldA) !== -1) { s = s.replace(oldA, newA); fs.writeFileSync(P, s); n++; }
console.log('applied', n, '| reconnect present:', s.indexOf("'-reconnect'") !== -1);
