'use strict';

var AmpersandView = require('ampersand-view');
var fs = require('fs');
var template = fs.readFileSync('./ui/templates/process-card.html', 'utf8');

module.exports = AmpersandView.extend({
    template: template,
    initialize: function (controller) {
        this.controller = controller;
    },
    events: {
        // The event + element: the name of the handler
        'click .delete': 'handleDeleteClick',
        'click .dashboard': 'handleDashboardClick'
    },
    render: function () {
        this.renderWithTemplate();
    },
    handleDashboardClick: function () {
        this.controller.emit('createDashboard', this.model.name);
    },
    handleDeleteClick: function () {
        //this.remove();
    },
    bindings: {
        'model.name': '.name',
        'model.pm_id': '.pm2id',
        'model.pid': '.pid'
    }
});
