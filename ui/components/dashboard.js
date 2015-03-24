'use strict';

var AmpersandView = require('ampersand-view');
var fs = require('fs');
var template = fs.readFileSync('./ui/templates/dashboard.html', 'utf8');

module.exports = AmpersandView.extend({
    template: template,
    initialize: function (controller) {
        this.controller = controller;
    },
    events: {
        // The event + element: the name of the handler
        'click .delete': 'handleDeleteClick'
    },
    render: function () {
        var self = this;
        this.renderWithTemplate();
        this.controller.on('stats', function (stats) {
            console.log(stats);
            self.model.cpuUsage = stats.cpu || 0;
            self.model.memoryUsage = stats.memory || '';
            self.model.creationTime = stats.creationTime;
        });
    },
    bindings: {
        'model.plotURL': {
            type: 'attribute',
            name: 'href',
            hook: 'plotlyLink'
        },
        'model.img': {
            type: 'attribute',
            name: 'src',
            hook: 'dashboardImage'
        },
        'model.scriptSrc': {
            type: 'attribute',
            name: 'src',
            hook: 'plotlyScript'
        },
        'model.plotlyData': {
            type: 'attribute',
            name: 'data-plotly',
            hook: 'plotlyScript'
        },
        'model.cpuUsagePercent': {
            hook: 'cpuUsage'
        },
        'model.memoryUsage': {
            hook: 'memoryUsage'
        },
        'model.processName': {
            hook: 'processName'
        },
        'model.creationTime': {
            hook: 'creationTime'
        }
    }
});
