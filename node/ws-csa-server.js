// server.js

"use strict";

var LinkedList = require('linkedlist');
var ws_client_list = new LinkedList();  // connection-socket lists
var TargetInfoList = new LinkedList();  // socket list received targetinfo data

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

// send message into client
//		message = format of CSA
// need to add destination
//		destination = "" : send to all connected clients
//		destination = [ID] : ??????????????????????
function send_mesg_direct(sendMsg, destClient) {
	var index;

	// clear response data
	TargetInfoList.resetCursor();
	while (TargetInfoList.next()) {
		TargetInfoList.removeCurrent();
		TargetInfoList.resetCursor();
	}

	ws_client_list.resetCursor();
	while (ws_client_list.next()) {
		console.log("-----------------------");
		console.log("list.length =", ws_client_list.length)
		console.log("<direct> keyID ={%s} client{%s}", ws_client_list.current.upgradeReq.headers['sec-websocket-key'], ws_client_list.current.clientname);
		console.log("<direct> send command: " + sendMsg);
		console.log("<direct> destClient: " + destClient);

		if((destClient == "ALL") || (destClient == ws_client_list.current.clientname)) {
			console.log("<direct> sent to clientname(%s)", ws_client_list.current.clientname);
			ws_client_list.current.send(sendMsg, function (err) {
				if(err) {
					// if error, remove the client in lists
					console.info("<direct>ws.send :", err);
					console.log("remove keyID ={%s} client{%s}", ws_client_list.current.upgradeReq.headers['sec-websocket-key'], ws_client_list.current.clientname);
					ws_client_list.current.close();
					console.log("remove linst{%s} ", ws_client_list.removeCurrent());
					ws_client_list.resetCursor();
				}
			});
		}
		index ++;
    }
	console.log("list.length =", ws_client_list.length)
}



var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
        output: process.stdout,
        terminal: false
});



var connections = new Map();
var connectionID;

function responseToWeb(ws, message) {
	console.log("rcv keyID ={%s} client{%s}", ws.upgradeReq.headers['sec-websocket-key'], ws.clientname);
	console.log("message =", message);

	// convert from string to struct
	var rcv = JSON.parse(message);
	console.log("<toWeb> message ={%s}", message);
	console.log("<toWeb> cmd ={%s}", rcv.Cmd);

	////////////////////////////////////
	// switch on command from CSA
	////////////////////////////////////
	if(rcv.Cmd == 'GetContainersInfo')
	{
		console.log("<toWeb> TargetInfoList length =%d", TargetInfoList.length);

		var found = 0;

		TargetInfoList.resetCursor();
	    while (TargetInfoList.next()) {
			if(ws.upgradeReq.headers['sec-websocket-key'] == TargetInfoList.current.key) {
				console.log("<toWeb> found same key =%s", TargetInfoList.current.key);
				found =1;
				break;
			}
		}
		if(found == 0) {
				console.log("<toWeb> add new clientname ={%s}", ws_client_list.current.clientname);

				var targetInfoObject = { "key": "", "client": "",  "body": "" };
				targetInfoObject.client = ws.clientname;
				targetInfoObject.key = ws.upgradeReq.headers['sec-websocket-key'];
				targetInfoObject.body = message;

				console.log("<toWeb> info =", targetInfoObject);
				TargetInfoList.push(targetInfoObject);
		}

		if(TargetInfoList.length)
		{
			var msg_str = "";

			// construct data into array string
			TargetInfoList.resetCursor();
			while (TargetInfoList.next()) {
				if(TargetInfoList.head == TargetInfoList.current) {
					msg_str += "[";
				}
				else {
					msg_str += ", ";
				}

				msg_str += TargetInfoList.current.body;

				if(TargetInfoList.tail == TargetInfoList.current){
					msg_str += "]";
                }
			}
			// send data to web...
			send_web(msg_str);


		}
		// bind all target response into a single message

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


	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		console.log('received cmd: %s', JSON.parse(message).cmd);

		var rcv = JSON.parse(message);
		switch(rcv.cmd) {
			case 'request':
				ws.clientname = rcv.name;

				ws_client_list.push(ws);
				console.log("list.length =", ws_client_list.length)
				console.log("ws.connections =", ws._socket._server._connections);
				ws_client_list.resetCursor();
				while (ws_client_list.next()) {
					console.log("keyID ={%s} client ={%s}", ws_client_list.current.upgradeReq.headers['sec-websocket-key'], ws_client_list.current.clientname);
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
		rl.on('line', function(line) {
			if (line.length > 0) {
				console.log("-----------------------");
				console.log("<shell> [%s] send :", ws.clientname, JSON.stringify({ cmd: line }));
				ws.send(JSON.stringify({ cmd: line }), function (err) {
					if(err) {
						console.info("<shell>ws.send :", err);

						// remove ws in list
						ws_client_list.resetCursor();
						while (ws_client_list.next()) {
							if(ws_client_list.current.upgradeReq.headers['sec-websocket-key'] == ws.upgradeReq.headers['sec-websocket-key']) {
								ws_client_list.removeCurrent();
								console.log("<shell> remove KeyID ={%s} client{%s}", ws_client_list.current.upgradeReq.headers['sec-websocket-key'], ws_client_list.current.clientname);
								ws_client_list.removeCurrent();
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
		ws_web.send(message, function (err) {
			if (err) {
				console.log("ws.send connected :", err);
			}
		});
	}
}

function convertMsg_from_web_to_csa(message) {
	var rcv = JSON.parse(message);
	var sendMsg = "";
	var destClient = "";

	////////////////////////////////////
	// switch on command from WEB
	////////////////////////////////////
	switch(rcv.Cmd) {
		case "GetContainersInfo":
			sendMsg = {
				"Cmd": rcv.Cmd
			}
			destClient = "ALL";
			break;
		case "UpdateImage":
			sendMsg = {
				"Cmd": rcv.Cmd,
				"ContainerName": rcv.ContainerName,
				"ImageName": rcv.ImageName,
			}
			destClient = rcv.DeviceID;
			break;
		default:
			break;
	}
	return{msg:sendMsg, dest:destClient}
}

wssin.on("connection", function connection(ws) {
	console.info("internal port connected...");

	ws_web = ws;
	ws.on('message', function incoming(message) {
		console.log('internal port received: %s', message);

		// conver message(WEB) into message(CSA)
		// conver_mesg_from_web_to_csa();
		var rcvVal = convertMsg_from_web_to_csa(message);
		var sendMsg = JSON.stringify(rcvVal.msg);
		var destClient = rcvVal.dest;

		// add destination..
		send_mesg_direct(sendMsg, destClient);
	});

	if (ws.readyState === ws.OPEN) {

	}
});
