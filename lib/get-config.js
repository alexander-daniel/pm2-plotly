'use strict';

var fs = require('fs');

function GetConfig (chalk) {
    if (!(this instanceof GetConfig)) return new GetConfig();
    var config;

    try {
        config =  JSON.parse(fs.readFileSync(process.env.HOME + '/.plotly_pm2', 'utf-8'));
    } catch (e) {
        console.log(chalk.red('No config found at ~/.plotly_pm2 ...'));
        console.log(chalk.red('Please fill in your configuration first!'));
        process.exit(0);
    }

    return config;

}


module.exports = GetConfig;
