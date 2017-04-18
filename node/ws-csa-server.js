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
	var index;
	list.resetCursor();
    while (list.next()) {
			console.log("-----------------------");		
			console.log("list.length =", list.length)
	        console.log("<direct> keyID ={%s} client{%s}", list.current.upgradeReq.headers['sec-websocket-key'], list.current.clientname);
			console.log("<direct> send command =", message);

			list.current.send(message, function (err) {
				        	        if(err) {
            					        console.info("<direct>ws.send :", err);
										console.log("remove keyID ={%s} client{%s}", list.current.upgradeReq.headers['sec-websocket-key'], list.current.clientname);
										list.current.close();
										console.log("remove linst{%s} ", list.removeCurrent());
										list.resetCursor();
                					}
				                });
			index ++;
    }

	console.log("list.length =", list.length)

}



var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
        output: process.stdout,
        terminal: false
});



var connections = new Map();
var connectionID;

var LinkedList = require('linkedlist');
var list = new LinkedList();
var targetlists = new LinkedList();


function responseToWeb(ws, message) { 
	console.log("rcv keyID ={%s} client{%s}", ws.upgradeReq.headers['sec-websocket-key'], ws.clientname);
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

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		console.log('received cmd: %s', JSON.parse(message).cmd);

		var rcv = JSON.parse(message);
		switch(rcv.cmd){
			case 'request':
				ws.clientname = rcv.name;

				list.push(ws);
				console.log("list.length =", list.length)
				console.log("ws.connections =", ws._socket._server._connections);
				list.resetCursor();
				while (list.next()) {
					console.log("keyID ={%s} client ={%s}", list.current.upgradeReq.headers['sec-websocket-key'], list.current.clientname);
				}

				send_connection(ws);
				break;
			default:
				responseToWeb(this, message);
				break;
		}
		//responseToWeb(this, message);
	});

    if (ws.readyState === ws.OPEN) {

		// input from prompt 
		rl.on('line', function(line){
			if (line.length > 0){
				console.log("-----------------------");
				console.log("<shell> [%s] send :", ws.clientname, JSON.stringify({ cmd: line }));
				ws.send(JSON.stringify({ cmd: line }),
					function (err) {
						if(err) {
							console.info("<shell>ws.send :", err);

							// remove ws in list
							list.resetCursor();
							while (list.next()) {
								if(list.current.upgradeReq.headers['sec-websocket-key'] == ws.upgradeReq.headers['sec-websocket-key']){
									list.removeCurrent();
									console.log("<shell> remove KeyID ={%s} client{%s}", list.current.upgradeReq.headers['sec-websocket-key'], list.current.clientname);
									list.removeCurrent();
									ws.close();
									break;
								}
							}
							ws.close();
							return;
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

