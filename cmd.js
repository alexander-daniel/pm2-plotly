#!/usr/bin/env node

'use strict';

var PORT = process.argv[2] || 9090;

var pm2 = require('pm2');
var http = require('http');
var moment = require('moment');
var request = require('request');

var fs = require('fs');
var config;

try {
    config =  JSON.parse(fs.readFileSync(process.env.HOME + '/.plotly_pm2', 'utf-8'));
} catch (e) {
    console.log('No config found at ~/.plotly_pm2 ...');
    console.log('Please fill in your configuration first!');
    process.exit(0);
}

var plotly = require('plotly')(config.username, config.apiKey);

var tokens = config.tokens;
var defaults = require('./lib/defaults');

var streams = {};
var plotURL;
var loop= null;

console.log('Starting the pm2-plotly dashboard...\n');


function handler (req, res) {

    if (req.url === '/favicon.ico') return res.end();
    var target = req.url.split('/')[1];

    if (target === '') {
        /**
         * Build up a list of running pm2 services.
         */
        pm2.list(function (err, list) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<h2 style="margin:0">Currently Running PM2 Apps</h2>');
            res.write('<h5 style="margin:0">Click on any to view resource usage</h5><br>');

            function buildLink(pm2Process) {
                var name = pm2Process.name;
                var link = '<a href=' + name + '>' + name + '</a><br>';

                res.write(link);
            }

            list.forEach(buildLink);

            res.end();
        });

    } else {

        clearInterval(loop);

        console.log(target);

        var initdata = defaults.getData({tokens: tokens, maxpoints: 200});
        var initlayout = defaults.getLayout(target);

        plotly.plot(initdata, initlayout, function (err, msg) {
            if (err) return console.log(err);
            plotURL = msg.url;

            initdata.forEach(function (trace) {
                var name = trace.name;
                var token = trace.stream.token;
                var stream = plotly.stream(token, function (err, msg) {
                    console.log(err, msg);
                });

                stream.on('error', function (err) {
                    //console.log(err);
                });

                streams[name] = stream;
            });

            loop = setInterval(function () {
                pm2.describe(target, function(err, proc) {
                    if (err) return console.log(err);

                    var target = proc[0];
                    var mem = target.monit.memory;
                    var cpu = target.monit.cpu;
                    var time = moment().format('h:mm:ss a');

                    var memory = JSON.stringify({
                        x: time,
                        y: mem / 1e6,
                        mode: 'lines+markers'
                    });

                    var CPU = JSON.stringify({
                        x: time,
                        y: cpu
                    });

                    streams.mem.write(memory+'\n');
                    streams.cpu.write(CPU+'\n');
                });
            }, 1000);

            res.writeHead(200, {'Content-Type': 'text/html'});
            request(plotURL + '.html').pipe(res);
        });
    }
}

var server = http.createServer(handler);

pm2.connect(function onConnect (err) {
    if (err) console.log(err);
    server.listen(PORT, function () {
        console.log('Your dashboard is ready! You can view it at: http://localhost:' + PORT);
    });
});
