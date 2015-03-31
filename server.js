'use strict';

/**
 * Here we're just importing all of the
 * dependencies to build the webSocketServer.
 *
 * We'll be accepting websocket connections
 * and piping those through a JSON stream, and
 * then we'll listen to events from the client.
 */
var fs = require('fs');
var ecstatic = require('ecstatic');
var staticServer = ecstatic({root: './ui/'});
var server = require('http').createServer(staticServer);
var WebSocketServer = require('ws').Server;
var wsServer = new WebSocketServer({'server': server});
var websocket = require('websocket-stream');
var JSONStream = require('JSONStream');
var emitIO = require('emit.io')();
var hat = require('hat');

/**
 * Setting up PM2 Module to get information
 * from the daemon + PM2Plotly Instance.
 *
 * We read from ~/.plotly_pm2 for a config.
 * You should have at least 2 tokens in there.
 */
var pm2 = require('pm2');
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


/**
 * WebSocketServer handler.
 *
 * When a client connects, we are passed the websocket.
 * Turn that websocket into a Stream, pipe it to a JSON parser,
 * then pipe its events at the instance of pm2plotly.
 *
 * Pipe events originating from pm2plotly back up to the
 * websocket.
 *
 */
function onConnection (ws) {

    // Create a websocket stream from the websocket
    var wstream = websocket(ws);

    // Create our JSON streams
    var parser = JSONStream.parse([true]);
    var stringify = JSONStream.stringify();

    // Hook up PM2Plotly to the global
    // emitter
    var emitStream = emitIO(pm2plotly);
    var id = hat(8,16);
    pm2plotly.emitStream = emitStream;

    // Pipe the client info the JSON parser
    wstream.pipe(parser);

    // Listen for events from the parser, and
    // trigger them on pm2plotly
    emitIO(parser, pm2plotly);

    // stringify and send events from the server/pm2plotly
    // back to the client
    emitStream.pipe(stringify).pipe(wstream);

    /**
     * Here we create our client API listeners.
     * Whenever a client emits one of these, events,
     * we can do what we'd like with it.
     */

    pm2plotly.on('list', function () {
        pm2plotly.listProcesses();
    });

    pm2plotly.on('createDashboard', function (processName) {
        pm2plotly.createDashboard(processName);
    });


    /**
     * Here we send the client an event to tell them
     * that all is good to go!
     */
    pm2plotly.emitTo(emitStream, 'auth', id);
}


/**
 * Let's do this! Connect to the pm2 daemon.
 * Once all is well, start listening for client
 * connections!
 */
pm2.connect(function onConnect (err) {
    if (err) console.log(err);

    server.listen(8000);
    wsServer.on('connection', onConnection);
});
