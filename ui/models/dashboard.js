'use strict';


var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    extraProperties: 'allow',
    props: {
        processName: 'string',
        plotURL: 'string',
        img: 'string',
        scriptSrc: 'string',
        plotlyData: 'string',
        memoryUsage: 'string',
        cpuUsage: 'number',
        creationTime: 'string'
    },
    session: {},
    derived: {
        cpuUsagePercent: {
            deps: ['cpuUsage'],
            fn: function () {
                if (!this.cpuUsage) return '0%';
                return this.cpuUsage + '%';
            }
        }
    }
});
