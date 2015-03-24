'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Plotly = require('plotly');
var defaults = require('./lib/defaults');
var url = require('url');
var timeago = require('timeago-words');
var os = require('os');
var numeral = require('numeral');

function pm2Plotly (opts) {
    /*jshint validthis: true */
    this.config = opts.config;
    this.tokens = this.config.tokens;
    this.streams = {};
    this.loop = null;
    this.pm2 = opts.pm2;
    var config = this.config;
    this.plotly = new Plotly(config.username, config.apiKey);
}

util.inherits(pm2Plotly, EventEmitter);

module.exports = pm2Plotly;

pm2Plotly.prototype.createDashboard = function (name, emitStream) {

    this.emitStream = emitStream;

    var self = this;
    var initdata = defaults.getData({tokens: self.tokens, maxpoints: 20});
    var initlayout = defaults.getLayout(name);

    function onPlotSuccess (err, msg) {
        if (self.loop) clearInterval(self.loop);
        if (err) return console.log(err);
        self.initStreams(name, msg, initdata);

        var plotURL = msg.url;
        var data = url.parse(plotURL).path.split('~')[1].replace('/', ':');

        var dashBoard = {
            processName: name,
            plotURL: plotURL,
            img: plotURL + '.png',
            plotlyData: data,
            scriptSrc: 'https://plot.ly/embed.js'
        };

        self.emitTo(emitStream, 'newDashboard', dashBoard);

    }

    this.plotly.plot(initdata, initlayout, onPlotSuccess);
};

pm2Plotly.prototype.initStreams = function (name, msg, initData) {
    var self = this;

    initData.forEach(function createStream(trace) {
        var name = trace.name;
        var token = trace.stream.token;
        var stream = self.plotly.stream(token, function (err, msg) {
            console.log(err, msg);
        });

        stream.on('error', function () {
            clearInterval(self.loop);
        });

        self.streams[name] = stream;
    });

    self.loop = setInterval(function () {
        self.getStats(name);
    }, 1000);
};

pm2Plotly.prototype.getStats = function (target) {
    var self = this;

    self.pm2.describe(target, function(err, proc) {
        if (err) return console.log(err);

        var targetProcess = proc[0];
        if (!targetProcess) return;
        var mem = targetProcess.monit.memory;
        var totalMem = os.freemem();
        var humanMem = numeral(totalMem).format('0.0b');
        var cpu = targetProcess.monit.cpu;

        var creationTime = timeago(new Date(targetProcess.pm2_env.created_at));
        var time = new Date();

        var memory = JSON.stringify({
            x: time,
            y: mem / 1e6
        });

        var CPU = JSON.stringify({
            x: time,
            y: cpu
        });

        self.streams.mem.write(memory+'\n');
        self.streams.cpu.write(CPU+'\n');

        self.emitTo(self.emitStream, 'stats', {cpu: cpu, memory: humanMem, creationTime: creationTime});
    });
};
