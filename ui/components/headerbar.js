'use strict';

var AmpersandView = require('ampersand-view');
var fs = require('fs');
var template = fs.readFileSync('./ui/templates/headerbar.html', 'utf8');

module.exports = AmpersandView.extend({
    template: template,
    initialize: function (controller) {
        this.controller = controller;
    },
    events: {
        // The event + element: the name of the handler
        'click #home': 'handleHomeClick'
    },
    handleHomeClick: function () {
        this.controller.emit('list');
    },
    render: function () {
        this.renderWithTemplate();
    },
    bindings: {
        'model.title': '.brand-logo'
    }
});
