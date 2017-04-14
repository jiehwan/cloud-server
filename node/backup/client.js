// client.js

"use strict";

const WebSocket = require('ws');

	var ws;
	var wsUri = "ws:";
        
        wsUri = 'ws://127.0.0.1:4000';
	console.log(wsUri);
        
        function wsConnect() {
            console.log("connect",wsUri);
            ws = new WebSocket(wsUri);

            ws.onmessage = function(msg) {
                var line = "";
                var data = msg.data;
                line += "<p>"+data+"</p>";
                //ws.send(JSON.stringify({data:data}));
		console.log(line);
            }

            ws.onopen = function() {
                //ws.send("Open for data");
                console.log("connected");
            }

            ws.onclose = function() {
		console.log("closed");
            }
        }
	wsConnect();

