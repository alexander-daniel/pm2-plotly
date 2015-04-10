'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Plotly = require('plotly');
var defaults = require('./defaults');
var url = require('url');
var timeago = require('timeago-words');
var os = require('os');
var numeral = require('numeral');

function pm2Plotly (opts) {
    /*jshint validthis: true */

    if (!opts) throw new Error('You have to supply options to pm2-plotly!');

    this.config = opts.config;
    this.tokens = this.config.tokens;
    this.emitStream = null;
    this.streams = {};
    this.loop = null;
    this.pm2 = opts.pm2;
    this.plotly = new Plotly(opts.config.username, opts.config.apiKey);
    this.initData = defaults.getData({tokens: opts.config.tokens, maxpoints: 20});
    this.initLayout = defaults.getLayout();
}

util.inherits(pm2Plotly, EventEmitter);

module.exports = pm2Plotly;

var proto = pm2Plotly.prototype;

proto.start = function (processName) {
    var pm2 = this.pm2;

    function onStart (err, proc) {
        if (err) return console.log(err);
        console.log(proc);
    }

    pm2.start(processName, onStart);

};

proto.stop = function (processName) {
    var pm2 = this.pm2;


    function onStop (err, proc) {
        if (err) return console.log(err);
        console.log(proc);
    }

    pm2.stop(processName, onStop);

};

proto.restart = function (processName) {
    var pm2 = this.pm2;


    function onRestart (err, proc) {
        if (err) return console.log(err);
        console.log(proc);
    }

    pm2.restart(processName, onRestart);

};

proto.remove = function (processName) {
    var pm2 = this.pm2;

    function onDelete (err, proc) {
        if (err) console.log(err);
        console.log(proc);
    }

    pm2['delete'](processName, onDelete);
};

/**
 * Returns the list of pm2 apps to the
 * client stream.
 */
proto.listProcesses = function () {
    var self = this;
    var pm2 = this.pm2;
    var emitStream = this.emitStream;

    function onList (err, list) {
        self.emitTo(emitStream, 'processList', list);
    }

    pm2.list(onList);
};

/**
 * Client emits 'createDashboard' and this gets called with
 * the target process as the only argument.
 *
 *
 */
proto.createDashboard = function (processName) {

    var self = this;
    var emitStream = this.emitStream;
    var plotly = this.plotly;
    var initdata = this.initData;
    var initlayout = this.initLayout;
    var plotURL;
    var data;
    var dashBoard;

    function onPlotSuccess (err, msg) {

        if (self.loop) clearInterval(self.loop);
        if (err) return console.log(err);

        self.initStreams(processName);

        plotURL = msg.url;
        data = url.parse(plotURL).path.split('~')[1].replace('/', ':');

        dashBoard = {
            processName: processName,
            plotURL: plotURL,
            img: plotURL + '.png',
            plotlyData: data,
            scriptSrc: 'https://plot.ly/embed.js'
        };

        self.emitTo(emitStream, 'newDashboard', dashBoard);

    }

    self.pm2.list(function onList (err, list) {
        var processes = {};

        list.forEach(function (monitoredProcess) {
            processes[monitoredProcess.name] = monitoredProcess;
        });

        if (!processes[processName]) self.emitTo(emitStream, 'processNotFound', processName);
        else plotly.plot(initdata, initlayout, onPlotSuccess);
    });

};

proto.initStreams = function (processName) {
    var self = this;
    var initData = this.initData;

    function createStream (trace) {
        var traceName = trace.name;
        var token = trace.stream.token;
        var stream = self.plotly.stream(token, function (err, msg) {
            console.log(err, msg);
        });

        stream.on('error', function () {
            clearInterval(self.loop);
        });

        self.streams[traceName] = stream;
    }

    initData.forEach(createStream);

    self.loop = setInterval(function () {
        self.getStats(processName);
    }, 1000);
};

proto.getStats = function (processName) {
    var self = this;
    var pm2 = this.pm2;

    pm2.describe(processName, function(err, proc) {
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
