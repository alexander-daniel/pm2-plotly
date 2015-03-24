'use strict';


var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    extraProperties: 'allow',
    props: {
        title: 'string'
    },
    session: {},
    derived: {}
});
