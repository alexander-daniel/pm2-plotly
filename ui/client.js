'use strict';

var emitIO       = require('emit.io')();
var websocket    = require('websocket-stream');
var wstream      = websocket('ws://localhost:8000');
var JSONStream   = require('JSONStream');
var parser       = JSONStream.parse([true]);
var stringify    = JSONStream.stringify();
var EventEmitter = require('events').EventEmitter;

var controller   = new EventEmitter();
var controlOut   = emitIO(controller);

var ProcessModel = require('./models/process');
var ProcessCard  = require('./components/process-card');
var DashBoardModel = require('./models/dashboard');
var DashBoard    = require('./components/dashboard');

var HeaderBar = require('./components/headerbar');
var HeaderBarModel = require('./models/headerbar');
var headerBar = new HeaderBar(controller);
headerBar.model = new HeaderBarModel();
headerBar.model.title = 'pm2-plotly';
headerBar.render();

wstream.pipe(parser);
emitIO(parser, controller);
controlOut.pipe(stringify).pipe(wstream);

controller.on('auth', function (id) {
    var first = document.body.firstElementChild;
    document.body.insertBefore(headerBar.el, first);
    console.log('auth ' +  id);
    controller.emit('list');
});

var processes = [];
var dashBoard = null;

controller.on('processList', function (list) {
    if (dashBoard) dashBoard.remove();

    processes.forEach(function (proc) {
        proc.remove();
    });

    list.forEach(function (proc) {
        proc.pid = proc.pid.toString();
        proc.pm_id = proc.pm_id.toString();
        var contentDiv = document.getElementById('content');
        console.log(proc);
        var processModel = new ProcessModel(proc);
        var processCard = new ProcessCard(controller);
        processCard.model = processModel;
        processCard.render();
        contentDiv.appendChild(processCard.el);
        processes.push(processCard);
    });
});

controller.on('newDashboard', function (spec) {
    processes.forEach(function (proc) {
        proc.remove();
    });
    var model = new DashBoardModel(spec);
    dashBoard = new DashBoard(controller);
    dashBoard.model = model;
    dashBoard.render();
    var contentDiv = document.getElementById('content');
    contentDiv.appendChild(dashBoard.el);
    var script = document.createElement('script');
    script.setAttribute('data-plotly', spec.plotlyData);
    var target = dashBoard.query('#target');
    target.appendChild(script);
    script.setAttribute('src',spec.scriptSrc);
    headerBar.model.title = spec.processName;

});
