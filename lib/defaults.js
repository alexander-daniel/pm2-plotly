'use strict';

function defaultLayout (targetProcess) {
    return {
        filename: 'pm2',
        fileopt: 'overwrite',
        layout: {
            showlegend: false,
            title: 'Resource use of PM2 process: <b>'  + targetProcess + '</b>',
            yaxis2: {
                domain: [0.5, 0.95],
                autorange: true,
                title: 'memory (MB)',
                type: 'linear',
                range: [38.5536, 39.249919999999996],
                ticks: 'inside',
                showgrid: true,
                linecolor: 'rgb(34,34,34)',
                mirror: true,
                zeroline: false,
                showline: true,
                linewidth: 1,
                ticklen: 2
            },
            yaxis: {
                domain: [0.05, 0.45],
                range: [-5, 100],
                title: 'cpu usage %',
                type: 'linear',
                ticks: 'inside',
                showgrid: true,
                linecolor: 'rgb(34,34,34)',
                mirror: true,
                zeroline: false,
                showline: true,
                linewidth: 1,
                ticklen: 2
            },
            xaxis: {
                type: 'category',
                range: [0, 49],
                autorange: true,
                ticks: 'inside',
                showgrid: true,
                linecolor: 'rgb(34,34,34)',
                mirror: 'all',
                zeroline: false,
                showline: true,
                linewidth: 1,
                ticklen: 2,
                tickangle: 50,
                showticklabels: true
            },
            height: 600,
            width: 800,
            autosize: false,
            margin: {
                b: 150
            },
            paper_bgcolor: 'white',
            legend: {
                y: 1,
                x: 0.02,
                xref: 'paper',
                yref: 'paper',
                bgcolor: 'rgba(255, 255, 255, 0.5)'
            },
            plot_bgcolor: 'white'
        }
    };
}

function defaultData (opts) {
    return [{
        name: 'cpu',
        mode: 'lines+markers',
        line: {
            color: 'rgb(0, 116, 217)'
        },
        x: [],
        y: [],
        stream: {
            token: opts.tokens[0],
            maxpoints: opts.maxpoints
        }
    }, {
        name: 'mem',
        mode: 'lines+markers',
        line: {
            color: 'rgb(216, 71, 62)'
        },
        x: [],
        y: [],
        yaxis: 'y2',
        stream: {
            token: opts.tokens[1],
            maxpoints: opts.maxpoints
        }
    }];
}

exports.getLayout = defaultLayout;
exports.getData = defaultData;
