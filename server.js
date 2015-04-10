'use strict';

/**
 * Here we're just importing all of the
 * dependencies to build the webSocketServer.
 *
 * We'll be accepting websocket connections
 * and piping those through a JSON stream, and
 * then we'll listen to events from the client.
 */
var ecstatic = require('ecstatic');
var staticServer = ecstatic({root: './ui/'});
var server = require('http').createServer(staticServer);
var WebSocketServer = require('ws').Server;
var wsServer = new WebSocketServer({'server': server});
var websocket = require('websocket-stream');
var JSONStream = require('JSONStream');
var emitIO = require('emit.io')();
var hat = require('hat');
var chalk = require('chalk');

/**
 * Setting up PM2 Module to get information
 * from the daemon + PM2Plotly Instance.
 *
 * We read from ~/.plotly_pm2 for a config.
 * You should have at least 2 tokens in there.
 */
var pm2 = require('pm2');
var PM2Plotly = require('./lib/pm2-plotly');
var config = require('./lib/get-config')(chalk);

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
 * websocket to the client.
 *
 */
function onConnection (ws) {

    /* Create a websocket stream from the websocket */
    var wstream = websocket(ws);

    /* Create our JSON streams */
    var parser = JSONStream.parse([true]);
    var stringify = JSONStream.stringify();

    /* Hook up PM2Plotly to emitIO */
    var emitStream = emitIO(pm2plotly);
    var id = hat(8,16);
    pm2plotly.emitStream = emitStream;

    /* Pipe the client info the JSON parser */
    wstream.pipe(parser);

    /**
     * Listen for events from the parser
     * and trigger them on pm2plotly
     */
    emitIO(parser, pm2plotly);

    /**
     * stringify and send events from the
     * server/pm2plotly back to the client
     */
    emitStream.pipe(stringify).pipe(wstream);

    /**
     * Here we create our client API listeners.
     * Whenever a client emits one of these, events,
     * we can do what we'd like with it.
     */
    pm2plotly.on('list', pm2plotly.listProcesses.bind(pm2plotly));
    pm2plotly.on('createDashboard', pm2plotly.createDashboard.bind(pm2plotly));
    pm2plotly.on('start', pm2plotly.start.bind(pm2plotly));
    pm2plotly.on('stop', pm2plotly.stop.bind(pm2plotly));
    pm2plotly.on('restart', pm2plotly.restart.bind(pm2plotly));
    pm2plotly.on('delete', pm2plotly.createDashboard.bind(pm2plotly));

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

function onConnect (err) {
    if (err) console.log(err);

    server.listen(8000, function () {
        console.log(chalk.magenta('server started on port 8000!'));
    });

    wsServer.on('connection', onConnection);
}

pm2.connect(onConnect);
