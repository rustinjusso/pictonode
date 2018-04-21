"use strict";
process.title = 'pictonode';
const port = process.env.PORT || 8080;
const historyLength = 100;

const WebSocketServer = require('websocket').server;
const http = require('http');

const history = [];
const clients = [];

function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getRandomColor(name) {
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += name[Math.floor(Math.random() * 16)];
    }
    return color;
}

const server = http.createServer((req, res) => {
    // empty because we are using WebSockets
}).listen(port, 'localhost');
console.log((new Date()) + ` | App server running on port ${port}...`);

const wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', (req) => {
    console.log((new Date()) + ` | Connection from: ${req.origin}.`);

    const connection = req.accept(null, req.origin);
    let index = clients.push(connection) - 1;
    let userName = false;
    let userColor = false;

    console.log((new Date()) + ' | Connection accepted.');

    if ( history.length > 0 ) {
        connection.sendUTF(
            JSON.stringify( { type: 'history', data: history } )
        );
    }

    connection.on('message', (message) => {
        if ( message.type === 'utf8') {
            if ( userName === false ) {
                userName = htmlEntities(message.utf8Data);
                userColor = getRandomColor(userName);
                connection.sendUTF(
                    JSON.stringify({ type: 'color', data: userColor })
                );

                console.log((new Date()) +
                    ` | User is known as ${userName} with ${userColor} color`);
            } else {
                console.log((new Date()) +
                    ` | Received message from ${userName}: ${message.utf8Data}`);

                let obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history.slice(historyLength * -1);

                const json = JSON.stringify({ type:'message', data: obj });
                for ( let i = 0 ; i < clients.length; i++ ) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    connection.on('close', (conn) => {
        if ( userName !== false && userColor !== false ) {
            console.log((new Date()) +
                ` | Peer ${conn.remoteAddress} disconnected.`);
            clients.splice(index, 1);
        }
    });
});

