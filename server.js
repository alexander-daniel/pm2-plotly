'use strict';

var fs = require('fs');
var ecstatic = require('ecstatic');
var staticServer = ecstatic({root: './ui/'});
var server = require('http').createServer(staticServer);
var WebSocketServer = require('ws').Server;
var wsServer = new WebSocketServer({'server': server});
var websocket = require('websocket-stream');
var JSONStream = require('JSONStream');
var emitIO = require('emit.io')();
var pm2 = require('pm2');
var hat = require('hat');
var PM2Plotly = require('./pm2-plotly');
var config;

try {
    config =  JSON.parse(fs.readFileSync(process.env.HOME + '/.plotly_pm2', 'utf-8'));
} catch (e) {
    console.log('No config found at ~/.plotly_pm2 ...');
    console.log('Please fill in your configuration first!');
    process.exit(0);
}

var pm2plotly = new PM2Plotly({
    config: config,
    pm2: pm2
});

function onConnection (ws) {
    var wstream = websocket(ws);
    var parser = JSONStream.parse([true]);
    var stringify = JSONStream.stringify();
    var emitStream = emitIO(pm2plotly);
    var id = hat(8,16);

    wstream.pipe(parser);
    emitIO(parser, pm2plotly);

    // send local messages over websocket
    emitStream.pipe(stringify).pipe(wstream);
    pm2plotly.emitTo(emitStream, 'auth', id);

    pm2plotly.on('list', function () {
        pm2.list(function (err, list) {
            pm2plotly.emitTo(emitStream, 'processList', list);
        });
    });

    pm2plotly.on('createDashboard', function (name) {
        pm2plotly.createDashboard(name, emitStream);
    });
}

pm2.connect(function onConnect (err) {
    if (err) console.log(err);
    server.listen(8000);
});

wsServer.on('connection', onConnection);
