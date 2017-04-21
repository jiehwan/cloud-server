#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

var port = 4001;

var server = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.end();
});
server.listen(port, function() {
	console.log((new Date()) + ' Server is listening on port '+ port);
});

wsServer = new WebSocketServer({
	httpServer: server,
	// You should not use autoAcceptConnections for production
	// applications, as it defeats all standard cross-origin protection
	// facilities built into the protocol and the browser.  You should
	// *always* verify the connection's origin and decide whether or not
	// to accept it.
	autoAcceptConnections: false
});

function originIsAllowed(origin) {
	// put logic here to detect whether the specified origin is allowed.
	return true;
}

var connection;

wsServer.on('request', function(request) {
	if (!originIsAllowed(request.origin)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}

	connection = request.accept(null, request.origin);
	console.log((new Date()) + ' Connection accepted.');
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			/////////////////////////////////////////////////////////////////////////////
			console.log('Received Message: ' + message.utf8Data);
			wsc.send(message.utf8Data);
			/////////////////////////////////////////////////////////////////////////////
		}
		else if (message.type === 'binary') {
			console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
			connection.sendBytes(message.binaryData);
		}
	});

	connection.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});
});

const WebSocket = require('ws');
var wsc;
var wscUri = 'ws://localhost:4002';

function wsConnect() {
	console.log("connect :",wscUri);

	wsc = new WebSocket(wscUri);
	wsc.onmessage = function(msg) {
		console.log("receive data from csa : " + msg.data);
		connection.send(msg.data);
	}

	wsc.onopen = function() {
		//ws.send("Open for data");
		console.log("connected");
	}

	wsc.onclose = function() {
		console.log("closed");
		setTimeout( function() {
			wsConnect();
		}, 1000);
	}
}

process.on('uncaughtException', function (err) {
	console.log(err);
	setTimeout(function(){
		console.log("timeout~~");
		wsConnect();
	},1000);
});

wsConnect();
