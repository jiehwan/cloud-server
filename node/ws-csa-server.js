// server.js

"use strict";

const WebSocket = require("ws");

const wss = new WebSocket.Server({ 
	port: 4000 
});

console.log('port = ', wss.options.port);

function send(ws) {
        ws.send(JSON.stringify({ cmd: 'connected', 
				token: 'test-token', 
				clientnum: 888}),
		function (err) {
			if (err) {
				console.log(err);
			}
		});
}

wss.on("connection", function connection(ws) {
        console.info("websocket connection open");

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		send(ws);
		});

        if (ws.readyState === ws.OPEN) {
		var readline = require('readline');
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: false
		});
		rl.on('line', function(line){
			console.log("send :", JSON.stringify({ cmd: line }));
			ws.send(JSON.stringify({ cmd: line }),
				function (err) {
					if(err) {
						console.log("ws.send :", err);
					}
				});
			
		});
	}
});
