'use strict';


var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    extraProperties: 'allow',
    props: {
        name: 'string',
        pid: 'string',
        pm_id: 'string'
    },
    session: {},
    derived: {}
});
