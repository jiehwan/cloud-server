// server.js

"use strict";

//////////////////////////////////////////////////////////////
///     websocket server for csa interface
//////////////////////////////////////////////////////////////
const WebSocket = require("ws");
const wss = new WebSocket.Server({ 
	port: 4000 
});
console.log('csa port = ', wss.options.port);


function send(ws) {
        ws.send(JSON.stringify({ cmd: 'connected', 
				token: 'test-token', 
				clientnum: 888}),
		function (err) {
			if (err) {
				console.log("ws.send connected :", err);
			}
		});
}

var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
        output: process.stdout,
        terminal: false
});

var ws_csa;

wss.on("connection", function connection(ws) {
        console.info("websocket connection open");

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		send(ws);
		send_web(message)
		});

        if (ws.readyState === ws.OPEN) {
		ws_csa = ws;
 
		rl.on('line', function(line){
			if (line.length > 0){
				console.log("send :", JSON.stringify({ cmd: line }));
				ws.send(JSON.stringify({ cmd: line }),
					function (err) {
						if(err) {
							console.log("ws.send :", err);
						}
					});
			}
			
		});
	}
});



//////////////////////////////////////////////////////////////
///	websocket server for web interface
//////////////////////////////////////////////////////////////
const WebSocketIn = require("ws");
const wssin = new WebSocketIn.Server({
        port: 4002
});
console.log('internal port = ', wssin.options.port);

var ws_web;

function send_web(message) {
	if(ws_web){

	        //ws_web.send(JSON.stringify({ cmd: 'connected', token: 'test-token', clientnum: 888}),
		ws_web.send(message,
	                function (err) {
        	                if (err) {
                	                console.log("ws.send connected :", err);
                        	}
	                });
		}
}


wssin.on("connection", function connection(ws) {
        console.info("internal port connected...");
	ws_web = ws;

        ws.on('message', function incoming(message) {
                console.log('internal port received: %s', message);

		if( ws_csa){
			console.log("send command =", message);
			//ws_csa.send(JSON.stringify({ cmd: message }),
			ws_csa.send(message,
                                        function (err) {
                                                if(err) {
                                                        console.log("ws.send :", err);
                                                }
                                        });
			}
                });

        if (ws.readyState === ws.OPEN) {

                }

});

