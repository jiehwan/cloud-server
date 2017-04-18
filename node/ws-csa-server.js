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


function send_connection(ws) {

		ws.send(JSON.stringify({ cmd: 'connected', 
				token: ws.upgradeReq.headers['sec-websocket-key'], 
				clientnum: ws._socket._server._connections}),
		function (err) {
			if (err) {
				console.log("ws.send connected :", err);
			}
		});
}

function send_mesg_direct(message) {
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
}



var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
        output: process.stdout,
        terminal: false
});


var ws_csa;

var connections = new Map();
var connectionID;

var LinkedList = require('linkedlist');
var list = new LinkedList();
var targetlists = new LinkedList();


function responseToWeb(ws, message) { 
	console.log("rcv KeyID =", ws.upgradeReq.headers['sec-websocket-key']);
	console.log("message =", message);

	// convert from string to struct
	var rcv = JSON.parse(message);
	console.log("message ={%s}", message);
	if(rcv.cmd == 'getContainerLists')
	{
		list.resetCursor();
	    while (list.next()) {
   	        console.log("messages ={%s}{%s}", list.current.clientname);
      	}
	}
	else
	{
		send_web(message);
	}

	//var connectioncnt = connectionID;
	//var session = connections.get(1);
	//if(session) console.log(" connections KeyID =", session.upgradeReq.headers['sec-websocket-key']);

	//session = connections.get(2);
        //if(session) console.log(" connections KeyID =", session.upgradeReq.headers['sec-websocket-key']);
}

wss.on("connection", function connection(ws) {
        console.info("websocket connection open");

	// session management
	////////////////////////////////////////////////////////////////////////
	console.log("current connection [%d]", ws._socket._server._connections);
	console.log(ws.upgradeReq.headers['sec-websocket-key']);

	connectionID = ws._socket._server._connections;
	connections.set(connectionID, ws);
	var session = connections.get(connectionID);
	//var sendThis = String(connectionID);
	//var obj[connectionID] = JSON.parse(JSON.stringify(ws));

	//list.push(connectionID);

	list.push(ws);
	console.log("list.length =", list.length)
	console.log("list.connections =", list.current._socket._server._connections);
	list.resetCursor();
	while (list.next()) {
		console.log("keyID =", list.current.upgradeReq.headers['sec-websocket-key']);
	}
	 

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		console.log('received cmd: %s', JSON.parse(message).cmd);

		var rcv = JSON.parse(message);
		switch(rcv.cmd){
			case 'request':
				ws.clientname = rcv.name;
				send_connection(ws);
				break;
			default:
				responseToWeb(this, message);
				break;
		}
		//responseToWeb(this, message);
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

		send_mesg_direct(message);
                });

        if (ws.readyState === ws.OPEN) {

                }

});

